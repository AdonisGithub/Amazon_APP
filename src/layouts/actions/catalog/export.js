import React from 'react'
import {debounce} from 'lodash';
import validbarcode from "barcode-validator";
import CsI18n from "../../../components/csI18n"

import {
    Card,
    Heading,
    Select,
    Stack,
    ResourceList,
    Spinner,
    Layout,
    DataTable,
    TextStyle,
    Button,
    FilterType,
    Banner,
    Checkbox,
    Modal,
    RadioButton,
    TextContainer, Tag, Badge, FormLayout, Link, Icon, Collapsible, ChoiceList, TextField, Tooltip,
} from '@shopify/polaris';

import ApplicationApiCall from "../../../functions/application-api-call";
import Util from "../../../helpers/Util";
import shopifyContext from "../../../context";
import "../actions.scss"
import AmazonTab from "../../../helpers/amazon-tab";
import CsErrorMessage from "../../../components/csErrorMessage";
import CsFastFilter from "../../../components/csFastFilter";
import CsEmbeddedModal from "../../../components/csEmbeddedModal";
import CsDataTableEx from "../../../components/csDataTableEx";
import CsImageModal from "../../../components/csImageModal";
import CsNoImage from "../../../components/csNoImage";
import {CircleInformationMajorMonotone, ChevronDownMinor, ChevronUpMinor, ViewMinor} from "@shopify/polaris-icons";
import ShopifyHelper from "../../../helpers/ShopifyHelper";
import {ErrorType} from "../../../components/csErrorMessage/csErrorMessage";
import * as Sentry from "@sentry/react";
import Cache from "../../../helpers/Cache";

const SEND_MATCHING = 'send_matching';
const SEND_PRICES = "send_prices";
const SEND_QUANTITIES = "send_quantities";
const SEND_IMAGES = "send_images";
const SEND_METADATAS = "send_metadata";
const SEND_DELETE = "send_delete";
const SEND_NOT_PRODUCT = 'send_not_product';
const SEND_NOT_EXTENDED = 'send_not_extended';
const SEND_PARENT_ONLY = 'send_parent_only';
const SEND_RELATIONSHIP_ONLY = 'send_relationship_only';
const BIND_SKU_ONLY = 'bind_sku_only';
const SEND_NO_FEED = 'send_no_feed';
const SEND_SWITCH_MFN = 'send_switch_mfn';
const DELETE_EXCLUDED = 'delete_excluded';
const SEND_SWITCH_AFN = 'send_switch_afn';
const SEND_OVERRIDE = 'send_override';
const DOWNLOAD_CSV = 'csv';

const DISPLAY_PRODUCT_ID = 'is_display_id';
const DISPLAY_IMAGE = 'is_display_image';
const DISPLAY_RULES = 'is_display_rules';
const DISPLAY_AMAZON_QUANTITY = 'is_display_amazon_quantity';
const DISPLAY_LOCATIONS = 'is_display_locations';

const OPTIONS = {
    send_matching: 0,
    send_prices: 1,
    send_quantities: 1,
    send_images: 1,
    send_metadata: 1,
    send_delete: 0,
    send_not_product: 0,
    send_not_extended: 0,
    send_parent_only: 0,
    send_relationship_only: 0,
    send_no_feed: 0,
    send_switch_mfn: 0,
    bind_sku_only: 0,
    send_switch_afn: 0,
    send_override: 0,
};

const DISPLAY_OPTIONS = {
    is_display_id: 1,
    is_display_image: 1,
    is_display_amazon_quantity: 1,
    is_display_locations: 0,
    is_display_rules: 0,
};

const NONE = 0;
const EXPORT_ALL = 1;
const EXPORT_SELECTED = 2;

const DEFAULT_PAGE_COUNT = 100;
// const DEFAULT_PAGE_COUNT = 5; //

const SELECT_PAGE_OPTIONS = [ // Olivier>Kbug; values have to be high like this, merchant inventory average size is 3000 items
    {label: 100, value: 100},
    {label: 500, value: 500},
    {label: 1000, value: 1000},
];

const STEP_GET_STARTED = 0;
const STEP_LOADING = 1;
const STEP_IMPORTABLE = 2;
const STEP_IMPORTING = 3;

const FILTER = {unexisting: "1", existing: "2"};

class Export extends AmazonTab {

    state = {
        ...this.state,
        // allCount:0,
        count: 0,
        active: false,        // modal is active if true
        error: null,
        selected: [],
        // searchValue: '',
        search_option: {
            group_id: 0,
            is_only_no_exist: false,
            is_only_exist: false,
            is_only_available: false,
            is_only_barcode: false,
            keyword: ''
        },
        searching: false,
        appliedFilters: [],
        options: {...OPTIONS},
        display_options: {...DISPLAY_OPTIONS},
        searched_display_options: null,
        advanced_active: false,
        page_item_count: DEFAULT_PAGE_COUNT,
        exportBtnClicked: NONE,
        exportOption: [],
        productList: [],
        parents: [],
        postError: null,
        postSuccess: null,
        activeImageModalIndex: "",
        step: STEP_GET_STARTED,
        search_more: false,
    };

    constructor(props) {
        super(props);
        this.initialState = Util.clone(this.state);
        this.dataRows = [];
        this.filteredRows = [];
        this.filteredRows_selected = [];
        this.groups = [];
        this.shopify = shopifyContext.getShared();
        this.selectedConfiguration = this.getConfigurationSelectedIndex();
        this.marketplaceInfo = props.marketplaceInfo;
        this.unMounted = false;
        console.log("%c[constructor]", this.shopify.getConfigurationSelected());

        let export_display_options = Cache.getCachedParameter('export_display_options');
        if (export_display_options) {
            this.state.display_options = export_display_options;
        }
        this.debounceHandleChangeASIN = debounce((item, is_parent) => {
            if (item.candidate_asin && Util.checkASIN(item.candidate_asin)) {
                this.doPostASIN(item, is_parent)
            }
        }, 300)
    }

    componentWillUnmount() {
        this.unMounted = true;
    }

    componentWillReceiveProps(nextProps) {
        super.componentWillReceiveProps(nextProps);
        console.log("%cComponentWillReceiveProps", 'color:green', this.initialState);

        if (this.selectedConfiguration !== this.getConfigurationSelectedIndex() ||
            this.marketplaceInfo.MarketplaceId !== nextProps.marketplaceInfo.MarketplaceId) {
            this.marketplaceInfo = nextProps.marketplaceInfo;
            this.selectedConfiguration = this.getConfigurationSelectedIndex();
            this.init();
        }
    }

    init() {
        this.dataRows = [];
        this.filteredRows = [];
        this.filteredRows_selected = [];
        this.groups = [];
        this.setState(Util.clone(this.initialState));
    }

    fetchProducts(isNew = false, search_option) {
        let limit_from = isNew ? 0 : this.state.productList.length;
        let limit_to = this.state.page_item_count;
        let configuration = this.shopify.getConfigurationSelected();
        let marketplace_id = this.marketplaceInfo.MarketplaceId;
        let display_options = this.state.display_options;
        let params = {
            configuration,
            limit_from,
            limit_to,
            marketplace_id,
            group_id: search_option.group_id,
            search: search_option.keyword,
            no_bound: search_option.is_only_no_exist ? 1 : 0,
            only_bound: search_option.is_only_exist ? 1 : 0,
            only_available: search_option.is_only_available ? 1 : 0,
            only_barcode: search_option.is_only_barcode ? 1 : 0,
            ...display_options
        };
        let searched_display_options = {...display_options};

        ApplicationApiCall.get('/application/offers/list', params, (json) => {
            this.cbInitData(isNew, json)
        }, this.cbInitError, false);
        if (isNew) {
            this.setState({searched_display_options, step: STEP_LOADING, search_option});
        } else {
            this.setState({searched_display_options, search_more: true, search_option});
        }
    }

    cbInitData = (isNew, json) => {
        console.log("cbInitData", json);

        if (json && this.unMounted === false) {
            // const error = json.error == 1? true:false;
            let count = json.count ? parseInt(json.count) : 0;
            // let allCount = this.state.searchValue === ''?count:this.state.allCount; //
            let productList;
            let selected;
            let parents;

            if (isNew) {
                productList = json.details;
                parents = json.parents;
                selected = [];
            } else {
                selected = this.state.selected;
                productList = json.details ? this.state.productList.concat(json.details) : this.state.productList;
                parents = {...this.state.parents, ...json.parents};
            }
            // console.log("cbInitData - parents", parents);
            if (json.details) {
                let prev_count = selected.length;
                for (let index in json.details) {
                    selected.push({id: prev_count + Number(index), disabled: false, checked: false});
                }
            }
            if (productList && selected && selected.length != productList.length) {
                console.error('Export: data is wrong!!!');
                Sentry.captureMessage(`Export: data is wrong!!!(product: ${productList.length}, selected: ${selected.length})`);
            }
            let message = json.message ? json.message : '';
            if (json.groups && json.groups.length > 0) {

                // Sorting alphabetically
                json.groups.sort(function (a, b) {
                    if (a.name < b.name) {
                        return -1;
                    }
                    if (a.name > b.name) {
                        return 1;
                    }
                    return 0;
                })

                this.groups = [{label: "", value: 0}, ...json.groups.map(a => {
                    return {label: a.name, value: a.id};
                })];

                console.log("groups", this.groups);
            }

            this.filterRows(this.state.appliedFilters, productList, selected);
            this.setState(preState => ({
                ...preState,
                // allCount:allCount,
                count: count,
                selected: selected,
                productList: productList,
                message: message,
                step: STEP_IMPORTABLE,
                search_more: false,
                parents,
            }));
        }
    }

    cbInitError = (err) => {

        console.log(err);

        if (err) {
            setTimeout(() => {
                this.setState({error: null})
            }, 8000);
            this.setState({error: err, step: STEP_IMPORTABLE, search_more: false});
        }
    }

    postSelectedProducts = () => {

        let variant_ids = [];
        let all = 0;

        if (this.state.exportBtnClicked !== EXPORT_ALL) {
            this.state.selected.forEach(item => {
                if (item.checked)
                    variant_ids.push(this.state.productList[item.id].variant_id);
            });
        } else {
            all = 1;
        }

        this.setState({step: STEP_IMPORTING, active: false});
        let configuration = this.shopify.getConfigurationSelected();
        let marketplace_id = this.marketplaceInfo.MarketplaceId;
        let options = this.state.options;
        let group_id = this.state.search_option.group_id;
        let search = this.state.search_option.keyword;
        let no_bound = this.state.search_option.is_only_no_exist ? 1 : 0;
        let only_bound = this.state.search_option.is_only_exist ? 1 : 0;
        let only_available = this.state.search_option.is_only_available ? 1 : 0;
        let only_barcode = this.state.search_option.is_only_barcode ? 1 : 0;
        let params = {
            configuration,
            marketplace_id, ...options,
            all,
            group_id,
            search,
            no_bound,
            only_bound,
            only_available,
            only_barcode
        };

        ApplicationApiCall.post('/application/offers/export', params, {variant_ids}, this.cbPostSuccess, this.cbPostError, false);
        //this.cbPostSuccess('Success');
    }

    cbPostSuccess = (json) => {
        console.log("cbPostSuccess", json);
        if (this.unMounted) {
            return;
        }

        if (!json) {
            return;
        }

        if (json.success) {
            let {selected} = this.state;

            if (this.state.exportBtnClicked === EXPORT_ALL) {
                selected.map(item => {
                    item.checked = false;
                    item.disabled = true;
                });
            } else {
                selected.map(item => {
                    if (item.checked) {
                        item.checked = false;
                        item.disabled = true;
                    }
                });
            }


            setTimeout(() => {
                this.setState({postSuccess: null})
            }, 5000);
            this.setState(preState => ({
                ...preState,
                selected: selected,
                postSuccess: json.message,
                exportBtnClicked: NONE,
                step: STEP_IMPORTABLE,
            }))
        } else {
            this.cbPostError({type: ErrorType.NORMAL, message: json.error_message});
        }
    }

    cbPostError = (err) => {
        console.log(err)

        setTimeout(() => {
            this.setState({postError: null});
        }, 10000)
        this.setState({
            postError: err,
            step: STEP_IMPORTABLE,
            exportBtnClicked: NONE
        });
    }

    isCheckBool = (value) => {
        return value == true
    }

    isEveryBool = (array) => {
        return array.every(this.isCheckBool)
    }


    isSomeBool = (array) => {
        return array.some(this.isCheckBool)
    }

    checkFilter(appliedFilters, item) {

        let array = [];
        let sku = [];


        array = this.checkFilterOptions(appliedFilters, item);
        // return ((item.sku && item.sku.toLowerCase().indexOf(this.state.searchValue.toLowerCase()) !== -1) ||
        //   (item.name && item.name.toLowerCase().indexOf(this.state.searchValue.toLowerCase()) !== -1) ||
        //   (item.title && item.title.toLowerCase().indexOf(this.state.searchValue.toLowerCase()) !== -1) ||
        //   (item.price && item.price.toString().indexOf(this.state.searchValue.toLowerCase()) !== -1) ||
        //   (item.available && item.available.toString().indexOf(this.state.searchValue.toLowerCase()) !== -1) ||
        //   (item.asin && item.asin.toLowerCase().indexOf(this.state.searchValue.toLowerCase()) !== -1)) && this.isEveryBool(array);
        return this.isEveryBool(array);
    }

    hasMore() {
        return this.state.productList.length < this.state.count;
    }

    checkFilterOptions(appliedFilters, item) {

        let array = [];

        appliedFilters.forEach((filter) => {
            if (filter.value === FILTER.unexisting) {
                if (item.existing != 1) {
                    array.push(true);
                } else {
                    array.push(false);
                }
            } else if (filter.value === FILTER.existing) {
                if (item.existing == 1) {
                    array.push(true);
                } else {
                    array.push(false);
                }
            }
        })
        return array;
    }

    handleSearchChange = (value) => {
        let {search_option} = this.state;
        search_option.keyword = value;
        this.setState({search_option});
    }

    handleSearchClick = () => {
        this.fetchProducts(true, this.state.search_option);
    }

    handleFiltersChange = (appliedFilters) => {

        this.filterRows(appliedFilters, this.state.productList, this.state.selected);
        this.setState({appliedFilters: appliedFilters});
    }

    handleRemoveFilter = (value) => () => {
        let idx;
        let {appliedFilters} = this.state;

        this.state.appliedFilters.forEach((filter, index) => {
            if (filter.value === value) {
                idx = index;
            }
        });
        appliedFilters.splice(idx, 1);
        this.filterRows(appliedFilters, this.state.productList, this.state.selected);
        this.setState({appliedFilters: appliedFilters});
    }

    handleMoreBtnClick = () => {
        this.fetchProducts(false, this.state.search_option);
    }

    handlePageItemCountChange = (value) => {

        this.setState({page_item_count: parseInt(value)})
    }

    handleItemCheck = (row_selected) => {
        let {selected} = this.state;
        for (let i in row_selected) {
            selected[row_selected[i].id] = row_selected[i];
        }
        console.log("handleItemCheck", row_selected, selected);
        this.filteredRows_selected = row_selected;
        this.setState({selected});
    };

    handleToggleModal = () => {

        this.setState(({
            active: false,
            exportBtnClicked: NONE,
        }));
    };

    handleOptionCheck = (option) => (value) => {
        let {options} = this.state;
        options[option] = value ? 1 : 0;

        this.setState({options});
    }

    handleDisplayOptionCheck = (option) => (value) => {
        let {searched_display_options, display_options} = this.state;
        display_options[option] = value ? 1 : 0;

        Cache.setCachedParameter('export_display_options', display_options, -1);
        //BOC check if searching is need again?
        let is_need = false;
        let fields = ['is_display_image', 'is_display_rules', 'is_display_amazon_quantity', 'is_display_locations'];
        for(let field of fields) {
            if (searched_display_options[field] < display_options[field]) {
                is_need = true;
                break;
            }
        }
        //EOC
        if (is_need) {
            this.setState({display_options}, () => {this.fetchProducts(true, this.state.search_option);});
        } else {
            this.setState({display_options});
        }
    }

    handleAdvancedOpen = () => {
        this.setState(prev => {
            return {advanced_active: !prev.advanced_active}
        })
    }

    handleImportBtnClick = (type) => () => {

        this.setState({active: true, exportBtnClicked: type});
    }

    handleChangeGroup = (group_id) => {
        console.log("handleChangeGroup", parseInt(group_id));
        let {search_option} = this.state;
        search_option.group_id = parseInt(group_id);
        this.fetchProducts(true, search_option);
    }

    handleChangeSearchOption = field => (value) => {
        console.log("handleChangeSearchOption", field, value);
        let {search_option} = this.state;
        search_option[field] = value;
        this.fetchProducts(true, search_option);
    }

    filterRows(appliedFilters, productList, selected) {
        this.filteredRows = [];
        this.filteredRows_selected = [];
        for (let index in productList) {
            let item = productList[index];

            if (!this.checkFilter(appliedFilters, item)) {
                continue;
            }
            this.filteredRows.push(item);
            this.filteredRows_selected.push(selected[index]);
        }
    }

    doPostASIN = (item, is_parent) => {
        console.log("doPostASIN", item, is_parent);
        item.saving = true;
        let variant_id = is_parent ? item.product_id : item.variant_id;
        let asin = item.candidate_asin;
        let marketplace_id = this.marketplaceInfo.MarketplaceId;
        let configuration = this.shopify.getConfigurationSelected();
        let params = {
            configuration
        };
        ApplicationApiCall.post('/application/offers/update_asin', params, {
            variant_id,
            asin,
            marketplace_id,
            is_parent
        }, () => this.cbPostASINSuccess(item, is_parent), () => {
        }, false);
        this.setState({refresh: true});
    }

    cbPostASINSuccess = (item, is_parent) => {
        item.saving = false;
        item.saved = true;
        this.setState({refresh: true});
        setTimeout(() => {
            item.saved = false;
            this.setState({refresh: true});
        }, 3000);
    }

    handleChangeASIN = (variant_id, is_parent) => value => {
        // console.log("handleChangeASIN", variant_id, value);

        let item;
        if (is_parent) {
            let {parents} = this.state;
            item = parents[variant_id];
            item.candidate_asin = value;
            this.setState({parents});
        } else {
            for (let index in this.filteredRows) {
                item = this.filteredRows[index];
                if (item.variant_id == variant_id) {
                    item.candidate_asin = value;
                    break;
                }
            }
        }

        this.debounceHandleChangeASIN(item, is_parent);
        this.setState({refresh: true});
    }

    buildRow(index, item, parent = null, is_selectable = false) {
        let can_be_created;
        let {is_display_amazon_quantity} = this.state.display_options;
        if (item.can_be_created === true && item.existing === false) {
            can_be_created = <span className="check">&#10003;</span>;
        } else {
            can_be_created = '';
        }

        let existing;

        if (item.is_excluded) {
            existing = <Badge status="attention"><CsI18n>Exc</CsI18n></Badge>
        } else {
            if (item.existing === true) {
                existing = <Badge status="success"><CsI18n>Yes</CsI18n></Badge>
            } else {
                existing = <Badge><CsI18n>No</CsI18n></Badge>
            }
        }

        let asin_field = '';
        let asin = '';
        let is_parent = !!parent;

        if (parent) {
            if (parent.asin) {
                asin_field = this.renderAsinDisplay(parent.asin, true);
            } else {
                if (parent.candidate_asin) {
                    asin = parent.candidate_asin;
                } else {
                    asin = '';
                }
                asin_field = this.renderAsinEdit(asin, parent, true);
            }
            asin = asin_field;
        } else {
            if (item.binding_asin) {
                asin_field = this.renderAsinDisplay(item.binding_asin);
            } else {
                if (item.candidate_asin) {
                    asin = item.candidate_asin;
                } else {
                    asin = '';
                }
                asin_field = this.renderAsinEdit(asin, item);
            }
            asin = asin_field;
            if (is_display_amazon_quantity && item.is_fba == 1) {
                existing = <React.Fragment><Badge status="info">FBA</Badge><br/>{existing}</React.Fragment>
            }
        }

        return {
            title: this.renderTitleBlock(index, item, parent),
            asin,
            group: is_parent? '':this.renderGroup(index, item),
            qty: is_parent? '':this.renderQtyBlock(index, item),
            // price: is_parent? '':this.shopify.getMoneyStringWithStoreFormat(item.price),
            synced: existing,
            can_be: can_be_created,
            selectable: is_selectable
        };
    }

    renderGroup(index, item) {
        let {is_display_rules} = this.state.display_options;
        let {group, has_model, applied_rule} = item;
        let group_line = null;
        if (group && !has_model) {
            group_line =
                <Stack.Item key={`g${index}-model`}><Stack vertical={true} spacing={"extraTight"}><Stack.Item><TextStyle variation={"subdued"}>G: </TextStyle>{group}</Stack.Item><Stack.Item><span
                    className={"color-darkred"}>{CsI18n.t('No model')}</span></Stack.Item></Stack></Stack.Item>;
        } else if (group) {
            group_line = <Stack.Item key={`g${index}-model`}><TextStyle variation={"subdued"}>G: </TextStyle>{group}</Stack.Item>;
        }
        let has_rules = false;
        let rule_lines = null;
        if (is_display_rules && Array.isArray(applied_rule) && applied_rule.length > 0) {
            has_rules = true;
            rule_lines = applied_rule.map((rule, item_index) => {
                return <Stack.Item key={`g${index}_${item_index}`}>
                        <TextStyle variation={"subdued"}>{rule['type']}: </TextStyle><TextStyle >{rule['name']}</TextStyle></Stack.Item>
            })
        }
        return <Stack spacing={"extraTight"} vertical={true}>
            {group_line}
            {has_rules? rule_lines:null}
        </Stack>;
    }

    renderTitleBlock(index, item, parent) {
        let {is_display_id, is_display_image, is_display_locations} = this.state.display_options;
        let {shopify_image_url, title, vendor, barcode, product_id, variant_id, locations} = item;
        let shopify_domain = this.shopify.domain;
        let is_parent = !!parent;
        let sku;
        if (parent) {
            title = parent.title;
            barcode = '';
            sku = this.renderSkuDisplay(parent, true);
        } else {
            sku = this.renderSkuDisplay(item);
        }
        let display_locations = '';
        let barcode_class = '';

        if (!barcode) {
            barcode_class = "barcode-negative";
            barcode = 'N/A'
        } else {
            if (validbarcode(barcode)) {
                barcode_class = "barcode-positive";
            } else {
                barcode_class = "barcode-negative";
            }
        }

        if (is_display_locations && Array.isArray(locations) && locations.length > 0) {
            // console.log("has - locations");
            display_locations = locations.map((location, index) => {
                return <Stack.Item key={`k${product_id}_${variant_id}_${index}`}><TextStyle
                    variation={"code"}>{location}</TextStyle></Stack.Item>;
            })
        }
        // console.log("display_locations", display_locations);


        return <Stack wrap={false} spacing="tight">
            {is_display_image? <Stack.Item>
                {shopify_image_url ?
                    <CsImageModal
                        title={title}
                        size="large"
                        alt={title}
                        active={this.state.activeImageModalIndex == index}
                        source={shopify_image_url}
                        onToggle={() => {
                            this.setState({activeImageModalIndex: index});
                        }}
                    />
                    :
                    <CsNoImage alt={title}/>
                }
            </Stack.Item>:null}
            <Stack.Item fill>
                <Stack vertical={true} spacing={"extraTight"}>
                    <Stack.Item>
                        <div className="display-link2">
                            <Stack wrap={false} alignment="center" spacing="extraTight">
                            <Stack.Item><div className={"product-title"}>{is_parent? <b>{title}</b>:title}<Tooltip content={CsI18n.t("View on Shopify")} preferredPosition="above">
                                <a href={is_parent ? ShopifyHelper.getProductPage(shopify_domain, product_id) : ShopifyHelper.getProductVariantPage(shopify_domain, product_id, variant_id)}
                                   target="_blank"><Icon
                                    source={ViewMinor} color="inkLighter"/></a>
                            </Tooltip>
                            </div>
                            </Stack.Item>
                        </Stack>
                        </div>
                    </Stack.Item>
                    {is_display_id? <Stack.Item><Stack spacing={"tight"} >
                        <Stack.Item><TextStyle variation={"subdued"}><CsI18n>Product ID</CsI18n>: </TextStyle></Stack.Item>
                        <Stack.Item>{product_id}</Stack.Item>
                    </Stack></Stack.Item>:null}
                    {!is_parent? <Stack.Item>
                        <Stack spacing={"tight"} >
                            <Stack.Item><TextStyle variation={"subdued"}><CsI18n>Barcode</CsI18n>: </TextStyle><span
                                className={barcode_class}>{barcode}</span></Stack.Item>
                            <Stack.Item><TextStyle variation={"subdued"}><CsI18n>Vendor</CsI18n>: </TextStyle>{vendor}
                            </Stack.Item>
                        </Stack>
                    </Stack.Item>:null}
                    <Stack.Item><Stack spacing={"tight"} >
                        <Stack.Item><TextStyle variation={"subdued"}><CsI18n>SKU</CsI18n>: </TextStyle></Stack.Item>
                        <Stack.Item>{sku}</Stack.Item>
                    </Stack></Stack.Item>
                    {is_display_locations? <Stack.Item><Stack spacing={"tight"} >
                        <Stack.Item><TextStyle variation={"subdued"}><CsI18n>Locations</CsI18n>: </TextStyle></Stack.Item>
                        <Stack.Item><Stack spacing={"extraTight"}>{display_locations}</Stack></Stack.Item>
                    </Stack></Stack.Item>:null}
                </Stack>
            </Stack.Item>
        </Stack>
    }

    renderSkuDisplay(item, is_parent = false) {
        let {binding_sku, shopify_sku, mapping_sku, mapping_sku_key, product_id} = item;
        // console.log("renderSkuDisplay", item, is_parent);
        let sku_display = '';
        if (is_parent) {
            shopify_sku = item.sku;
        }

        if (mapping_sku_key) {
            if ((mapping_sku && (mapping_sku == binding_sku || !binding_sku))) {
                sku_display =
                    <span>{mapping_sku}{(mapping_sku != shopify_sku && shopify_sku) ?
                        <br/> : null}{(mapping_sku != shopify_sku && shopify_sku) ? `S: ${shopify_sku}` : ''}</span>; //success
            } else if (mapping_sku && (mapping_sku != binding_sku && binding_sku)) {
                sku_display = (<span
                        style={{color: 'red'}}><CsI18n>Wrong Sync</CsI18n>{`M: ${mapping_sku}`}{(shopify_sku && mapping_sku != shopify_sku) ?
                        <br/> : null}{(shopify_sku && mapping_sku != shopify_sku) ? `S: ${shopify_sku}` : ''}
                        {binding_sku ? <br/> : null}{binding_sku ? `A: ${binding_sku}` : ''}</span>);
            } else if (mapping_sku) {
                sku_display =
                    <span>{mapping_sku}{(mapping_sku != shopify_sku && shopify_sku) ?
                        <br/> : null}{(mapping_sku != shopify_sku && shopify_sku) ? `S: ${shopify_sku}` : ''}</span>; //success
            } else if (!mapping_sku) {
                sku_display = <span style={{color: 'red'}}><CsI18n>Missing SKU mapping</CsI18n>
                  <br/>{`M: ${mapping_sku_key}`}
                        {shopify_sku ? <br/> : null}{shopify_sku ? `S: ${shopify_sku}` : ''}{binding_sku ?
                            <br/> : null}{binding_sku ? `A: ${binding_sku}` : ''}</span>
            }
        } else {
            if (binding_sku && binding_sku != shopify_sku) {
                sku_display = `${shopify_sku} (A: ${binding_sku})`;
            } else if (shopify_sku == '') {
                sku_display = <span style={{color: 'red'}}><CsI18n>Missing SKU</CsI18n></span>;
            } else {
                sku_display = shopify_sku;
            }
        }
        return (<div className={"sku"}>{sku_display}</div>);
    }

    renderAsinDisplay(asin, is_parent = false) {
        let link = 'https://' + this.props.marketplaceInfo.DomainName + '/dp/' + asin;
        return (<div className="display-link">
            <Stack spacing="extraTight" wrap={false}>
                <Stack.Item><TextStyle>{is_parent ? <b>{asin}</b> : asin}</TextStyle></Stack.Item>
                <Stack.Item><Tooltip content={CsI18n.t("View on Amazon")} preferredPosition="above"><a
                    href={link} target="_blank"><Icon
                    source={ViewMinor}
                    color="inkLighter"/></a>
                </Tooltip></Stack.Item>
            </Stack>
        </div>);
    }

    renderAsinEdit(asin, item, is_parent = false) {
        let field_id = is_parent ? item['product_id'] : item['variant_id'];
        let link = 'https://' + this.props.marketplaceInfo.DomainName + '/dp/' + asin;
        // console.log(asin, item, is_parent);
        let asin_value = asin ? asin : "";
        return (<div className="display-link"><Stack spacing={"extraTight"} wrap={false} alignment={"center"}>
            <Stack.Item>
                <div className={"asin-input"}><TextField value={asin_value} type="text" label={"asin"}
                                                         labelHidden={true}
                                                         key={"asin_" + field_id} error={!Util.checkASIN(asin_value)}
                                                         onChange={this.handleChangeASIN(field_id, is_parent)}/>
                </div>
            </Stack.Item>
            {asin ? <Stack.Item><Tooltip content={CsI18n.t("View on Amazon")} preferredPosition="above"><a
                href={link} target="_blank"><Icon
                source={ViewMinor}
                color="inkLighter"/></a>
            </Tooltip></Stack.Item> : null}
            {item.saving ? <Stack.Item><Spinner size="small" color="teal"/></Stack.Item> : null}
            {item.saved ?
                <Stack.Item><span className="check">&#10003;</span></Stack.Item> : null}
        </Stack></div>);
    }

    renderQtyBlock(index, item) {
        let {is_display_amazon_quantity} = this.state.display_options;
        let {available, existing, candidate_quantity, amazon_quantity} = item;

        let has_candidate_quantity = item.hasOwnProperty('candidate_quantity') && candidate_quantity != available;
        let has_amazon_quantity = existing && item.hasOwnProperty('amazon_quantity') && is_display_amazon_quantity;
        let mapping_quantity = has_candidate_quantity? candidate_quantity:available;
        return <Stack vertical={true}
                     spacing={"extraTight"}>
            <Stack.Item>{this.shopify.getMoneyStringWithStoreFormat(item.price)}</Stack.Item>
            <Stack.Item><TextStyle variation={"subdued"}>S: </TextStyle>{available}</Stack.Item>
            {has_candidate_quantity? <Stack.Item><TextStyle variation={"subdued"}>M: </TextStyle>{candidate_quantity}</Stack.Item>:null}
            {has_amazon_quantity? <Stack.Item><TextStyle variation={"subdued"}>A: </TextStyle>
                {mapping_quantity == amazon_quantity? amazon_quantity:<span style={{color: 'red'}}>{amazon_quantity}</span>
            }</Stack.Item>:null}
            </Stack>
    }

    renderDataItem() {
        let dataItem = [];
        let parent_id = false;
        let {parents} = this.state;


        for (let index in this.filteredRows) {
            const item = this.filteredRows[index];
            if (item.has_parent && parent_id != item.product_id) {
                parent_id = item.product_id;
                dataItem.push(this.buildRow(index, item, parents[parent_id], false));
            }
            dataItem.push(this.buildRow(index, item, null, true));
        }
        return dataItem;
    }

    render() {
        if (this.state.step === STEP_GET_STARTED) {
            return this.renderGetStarted();
        } else {
            return this.renderExport();
        }
    }

    renderProductTableInfor() {
        return (
            <Stack alignment={"center"} distribution={"equalSpacing"}>
                <Stack.Item>
                    <Stack alignment={"center"}>
                        <Stack.Item>
                            <Heading><CsI18n>Products</CsI18n></Heading>
                        </Stack.Item>
                        <Stack.Item>
                            <CsI18n count={this.state.count}>{"Total: {{count}}"}</CsI18n>
                        </Stack.Item>
                        <Stack.Item>
                            <CsI18n count={this.filteredRows.length}>{"Showing: {{count}}"}</CsI18n>
                        </Stack.Item>
                        <Stack.Item>
                            <CsI18n count={this.getSelectedCount()}>{"Selected: {{count}}"}</CsI18n>
                        </Stack.Item>
                    </Stack>
                </Stack.Item>
                <Stack.Item>
                    <Stack alignment={"center"}>
                        <Stack.Item>
                            <TextStyle variation="strong">&#10003; {CsI18n.t("Can be created")}</TextStyle>
                        </Stack.Item>
                        <Stack.Item>
                            <TextStyle>{CsI18n.t("M: Mapping")}</TextStyle>
                        </Stack.Item>
                        <Stack.Item>
                            <TextStyle>{CsI18n.t("S: Shopify")}</TextStyle>
                        </Stack.Item>
                        <Stack.Item>
                            <TextStyle>{CsI18n.t("A: Amazon")}</TextStyle>
                        </Stack.Item>
                    </Stack>
                </Stack.Item>
            </Stack>
        );
    }

    renderRuleMarkInfo() {
        return <Stack alignment={"center"}>
            <Stack.Item>
                <Heading><CsI18n>Group/Rules</CsI18n></Heading>
            </Stack.Item>
            <Stack.Item>
                <TextStyle>{CsI18n.t("G: Group(Model)")}</TextStyle>
            </Stack.Item>
            <Stack.Item>
                <TextStyle>{CsI18n.t("M: Markup")}</TextStyle>
            </Stack.Item>
            <Stack.Item>
                <TextStyle>{CsI18n.t("S: Sales")}</TextStyle>
            </Stack.Item>
            <Stack.Item>
                <TextStyle>{CsI18n.t("E: Exclusions")}</TextStyle>
            </Stack.Item>
            <Stack.Item>
                <TextStyle>{CsI18n.t("I: Inventory")}</TextStyle>
            </Stack.Item>
            <Stack.Item>
                <TextStyle>{CsI18n.t("C: Category")}</TextStyle>
            </Stack.Item>
            <Stack.Item>
                <TextStyle>{CsI18n.t("T: Taxes")}</TextStyle>
            </Stack.Item>
            <Stack.Item>
                <TextStyle>{CsI18n.t("Sh: Shipping")}</TextStyle>
            </Stack.Item>
            <Stack.Item>
                <TextStyle>{CsI18n.t("B: Business")}</TextStyle>
            </Stack.Item>
        </Stack>
    }

    renderGetStarted() {
        let action = {
            content: CsI18n.t('Get started'),
            onAction: () => {
                this.fetchProducts(true, this.state.search_option);
            },
            loading: false,
            disable: false
        };
        return (
            <Stack vertical>
                <Stack.Item>
                    <br/>
                </Stack.Item>
                <Stack.Item>
                    <Banner
                        title={CsI18n.t("Export your offers to Amazon")}
                        action={action}
                    >
                        <p>
                            <CsI18n>Your offers will be exported from your store to Amazon</CsI18n><br/>
                            <CsI18n>This will update offer information: Title, description, tax information, pictures
                                etc.</CsI18n>
                        </p>
                    </Banner>
                </Stack.Item>
                <Stack.Item>
                    <br/>
                </Stack.Item>
            </Stack>
        )
    }

    renderExport() {
        let content = "";
        if (this.state.step === STEP_LOADING) {
            content = this.renderLoading();
        } else if (!this.state.error && this.state.step === STEP_IMPORTABLE && this.state.productList.length === 0) {
            content = this.renderEmpty();
        } else {
            content = this.renderDataList();
        }

        return (
            <div className="actions export-body" data-recording-gdpr-safe>
                <Layout>
                    {this.renderExportOptions()}
                    {content}
                    {this.state.active === true ? this.renderModal() : ''}
                </Layout>
            </div>
        );
    }

    getExportedCount() {
        let selected = this.state.selected;
        let count = 0;
        selected.forEach(item => {
            if (item.disabled) {
                count++;
            }
        });
        return count;
    }

    getSelectedCount() {
        let selected = this.state.selected;
        let count = 0;
        selected.forEach(item => {
            if (item.checked) {
                count++;
            }
        });
        return count;
    }

    renderExportOptions() {
        // console.log("renderExportOptions", this.state.options);
        let exportedCount = this.getExportedCount();
        let selectedCount = this.getSelectedCount();

        let label_matching_mode =
            <Stack
                spacing="tight"><Stack.Item>{CsI18n.t("Product matching")}</Stack.Item>
                <Stack.Item fill>
                    <Tooltip
                        content={CsI18n.t("Match existing products on Amazon with the barcode")}>
                        <span className={"help-tooltip"}>
                            <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                        </span>
                    </Tooltip>
                </Stack.Item></Stack>;

        let label_meta_data =
            <Stack
                spacing="tight"><Stack.Item>{CsI18n.t("Meta-data")}</Stack.Item>
                <Stack.Item fill>
                    <Tooltip
                        content={CsI18n.t("Send your own product informations, Title, Description, Brand, Taxes (etc.)")}>
                        <span className={"help-tooltip"}>
                            <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                        </span>
                    </Tooltip>
                </Stack.Item></Stack>;

        let label_override =
            <Stack
                spacing="tight"><Stack.Item>{CsI18n.t("Override")}</Stack.Item>
                <Stack.Item fill>
                    <Tooltip
                        content={CsI18n.t("Allow the App to Create product or Override product information")}>
                        <span className={"help-tooltip"}>
                            <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                        </span>
                    </Tooltip>
                </Stack.Item></Stack>;


        return (
            <Layout.Section>
                <Card>
                    <Card.Section>
                        <Stack>
                            <Heading>{CsI18n.t('Export options')}</Heading>
                        </Stack>
                        <Stack vertical>
                            <Stack.Item>
                                <Stack distribution="fillEvenly">
                                    <Stack.Item>
                                        <Stack alignment="center" spacing={"extraTight"}>
                                            <Stack.Item><Checkbox checked={this.state.options[SEND_PRICES]}
                                                                  onChange={this.handleOptionCheck(SEND_PRICES)}/></Stack.Item>
                                            <Stack.Item><TextStyle><CsI18n>Prices</CsI18n></TextStyle></Stack.Item>
                                        </Stack>
                                    </Stack.Item>
                                    <Stack.Item>
                                        <Stack alignment="center" spacing={"extraTight"}>
                                            <Stack.Item><Checkbox checked={this.state.options[SEND_QUANTITIES]}
                                                                  onChange={this.handleOptionCheck(SEND_QUANTITIES)}/></Stack.Item>
                                            <Stack.Item><TextStyle><CsI18n>Quantities</CsI18n></TextStyle></Stack.Item>
                                        </Stack>
                                    </Stack.Item>
                                    <Stack.Item>
                                        <Stack alignment="center" spacing={"extraTight"}>
                                            <Stack.Item><Checkbox checked={this.state.options[SEND_IMAGES]}
                                                                  onChange={this.handleOptionCheck(SEND_IMAGES)}/></Stack.Item>
                                            <Stack.Item><TextStyle><CsI18n>Images</CsI18n></TextStyle></Stack.Item>
                                        </Stack>
                                    </Stack.Item>
                                    <Stack.Item>
                                        <Stack alignment="center" spacing={"extraTight"}>
                                            <Stack.Item><Checkbox checked={this.state.options[SEND_METADATAS]}
                                                                  onChange={this.handleOptionCheck(SEND_METADATAS)}/></Stack.Item>
                                            <Stack.Item>{label_meta_data}</Stack.Item>
                                        </Stack>
                                    </Stack.Item>
                                    <Stack.Item>
                                        <Stack alignment="center" spacing={"extraTight"}>
                                            <Stack.Item><Checkbox checked={this.state.options[SEND_MATCHING]}
                                                                  onChange={this.handleOptionCheck(SEND_MATCHING)}/></Stack.Item>
                                            <Stack.Item>{label_matching_mode}</Stack.Item>
                                        </Stack>
                                    </Stack.Item>
                                    <Stack.Item>
                                        <Stack alignment="center" spacing={"extraTight"}>
                                            <Stack.Item><Checkbox checked={this.state.options[SEND_OVERRIDE]}
                                                                  onChange={this.handleOptionCheck(SEND_OVERRIDE)}/></Stack.Item>
                                            <Stack.Item>{label_override}</Stack.Item>
                                        </Stack>
                                    </Stack.Item>
                                </Stack>
                            </Stack.Item>
                            <Stack.Item>
                                <div className="advanced">
                                    <Stack alignment={"leading"}>
                                        <Stack.Item><Heading element="h3">{CsI18n.t('Advanced')}</Heading></Stack.Item>
                                        <Stack.Item><Link onClick={this.handleAdvancedOpen}><Icon
                                            source={this.state.advanced_active ? ChevronUpMinor : ChevronDownMinor}/></Link></Stack.Item>
                                    </Stack>
                                </div>
                                {this.state.advanced_active ? (<div className={"mt-2"}>
                                    <Stack spacing={"extraLoose"}>
                                        <Stack.Item>
                                            <Stack alignment="center" spacing={"extraTight"}>
                                                <Stack.Item><Checkbox checked={this.state.options[SEND_DELETE]}
                                                                      onChange={this.handleOptionCheck(SEND_DELETE)}/></Stack.Item>
                                                <Stack.Item><TextStyle><CsI18n>Delete</CsI18n></TextStyle></Stack.Item>
                                            </Stack>
                                        </Stack.Item>
                                        <Stack.Item>
                                            <Stack alignment="center" spacing={"extraTight"}>
                                                <Stack.Item><Checkbox checked={this.state.options[SEND_NOT_PRODUCT]}
                                                                      onChange={this.handleOptionCheck(SEND_NOT_PRODUCT)}/></Stack.Item>
                                                <Stack.Item><TextStyle><CsI18n>Do not send product</CsI18n></TextStyle></Stack.Item>
                                            </Stack>
                                        </Stack.Item>
                                        <Stack.Item>
                                            <Stack alignment="center" spacing={"extraTight"}>
                                                <Stack.Item><Checkbox checked={this.state.options[SEND_NOT_EXTENDED]}
                                                                      onChange={this.handleOptionCheck(SEND_NOT_EXTENDED)}/></Stack.Item>
                                                <Stack.Item><TextStyle><CsI18n>Do not send extended
                                                    data</CsI18n></TextStyle></Stack.Item>
                                            </Stack>
                                        </Stack.Item>
                                        <Stack.Item>
                                            <Stack alignment="center" spacing={"extraTight"}>
                                                <Stack.Item><Checkbox checked={this.state.options[SEND_PARENT_ONLY]}
                                                                      onChange={this.handleOptionCheck(SEND_PARENT_ONLY)}/></Stack.Item>
                                                <Stack.Item><TextStyle><CsI18n>Send parent/s
                                                    only</CsI18n></TextStyle></Stack.Item>
                                            </Stack>
                                        </Stack.Item>
                                        <Stack.Item>
                                            <Stack alignment="center" spacing={"extraTight"}>
                                                <Stack.Item><Checkbox
                                                    checked={this.state.options[SEND_RELATIONSHIP_ONLY]}
                                                    onChange={this.handleOptionCheck(SEND_RELATIONSHIP_ONLY)}/></Stack.Item>
                                                <Stack.Item><TextStyle><CsI18n>Send relationship
                                                    only</CsI18n></TextStyle></Stack.Item>
                                            </Stack>
                                        </Stack.Item>
                                        <Stack.Item>
                                            <Stack alignment="center" spacing={"extraTight"}>
                                                <Stack.Item><Checkbox checked={this.state.options[BIND_SKU_ONLY]}
                                                                      onChange={this.handleOptionCheck(BIND_SKU_ONLY)}/></Stack.Item>
                                                <Stack.Item><TextStyle><CsI18n>Bind SKU
                                                    only</CsI18n></TextStyle></Stack.Item>
                                            </Stack>
                                        </Stack.Item>
                                        {this.shopify.admin ?
                                            <Stack.Item>
                                                <Stack alignment="center" spacing={"extraTight"}>
                                                    <Stack.Item><Checkbox checked={this.state.options[SEND_NO_FEED]}
                                                                          onChange={this.handleOptionCheck(SEND_NO_FEED)}/></Stack.Item>
                                                    <Stack.Item><TextStyle>Don't send XML feed
                                                        (Admin)</TextStyle></Stack.Item>
                                                </Stack>
                                            </Stack.Item>
                                            : ''}
                                        {this.shopify.admin ?
                                            <Stack.Item>
                                                <Stack alignment="center" spacing={"extraTight"}>
                                                    <Stack.Item><Checkbox checked={this.state.options[DELETE_EXCLUDED]}
                                                                          onChange={this.handleOptionCheck(DELETE_EXCLUDED)}/></Stack.Item>
                                                    <Stack.Item><TextStyle>Delete excluded offers
                                                        (Admin)</TextStyle></Stack.Item>
                                                </Stack>
                                            </Stack.Item>
                                            : ''}
                                        {this.shopify.admin ?
                                            <Stack.Item>
                                                <Stack alignment="center" spacing={"extraTight"}>
                                                    <Stack.Item><Checkbox checked={this.state.options[SEND_SWITCH_AFN]}
                                                                          onChange={this.handleOptionCheck(SEND_SWITCH_AFN)}/></Stack.Item>
                                                    <Stack.Item><TextStyle>Send SwitchToAFN
                                                        (Admin)</TextStyle></Stack.Item>
                                                </Stack>
                                            </Stack.Item>
                                            : ''}
                                        {this.shopify.admin ?
                                            <Stack.Item>
                                                <Stack alignment="center" spacing={"extraTight"}>
                                                    <Stack.Item><Checkbox checked={this.state.options[SEND_SWITCH_MFN]}
                                                                          onChange={this.handleOptionCheck(SEND_SWITCH_MFN)}/></Stack.Item>
                                                    <Stack.Item><TextStyle>Send SwitchToMFN
                                                        (Admin)</TextStyle></Stack.Item>
                                                </Stack>
                                            </Stack.Item>
                                            : ''}
                                        {/*{this.shopify.admin ?*/}
                                        {/*  <Stack.Item>*/}
                                        {/*    <Stack alignment="center" spacing={"extraTight"}>*/}
                                        {/*      <Stack.Item><Checkbox checked={this.state.options[DOWNLOAD_CSV]}*/}
                                        {/*                            onChange={this.handleOptionCheck(DOWNLOAD_CSV)}/></Stack.Item>*/}
                                        {/*      <Stack.Item><TextStyle><CsI18n>Csv</CsI18n></TextStyle></Stack.Item>*/}
                                        {/*    </Stack>*/}
                                        {/*  </Stack.Item>*/}
                                        {/*  : ''}*/}
                                    </Stack>
                                </div>) : ''
                                }
                            </Stack.Item>

                            <Stack.Item>
                                <Stack>
                                    <Stack.Item fill>
                                        <Button size="slim"
                                                disabled={exportedCount === this.state.productList.length ||
                                                selectedCount !== 0 || this.state.exportBtnClicked === EXPORT_SELECTED}
                                                loading={this.state.step === STEP_IMPORTING && this.state.exportBtnClicked === EXPORT_ALL}
                                                onClick={this.handleImportBtnClick(EXPORT_ALL)}><CsI18n>Export
                                            all</CsI18n></Button>
                                    </Stack.Item>
                                    <Stack.Item>
                                        <Button size="slim"
                                                disabled={exportedCount === this.state.productList.length ||
                                                selectedCount === 0 || this.state.exportBtnClicked === EXPORT_ALL}
                                                loading={this.state.step === STEP_IMPORTING && this.state.exportBtnClicked === EXPORT_SELECTED}
                                                onClick={this.handleImportBtnClick(EXPORT_SELECTED)}><CsI18n>Export
                                            selected</CsI18n></Button>
                                    </Stack.Item>
                                </Stack>
                            </Stack.Item>
                        </Stack>
                    </Card.Section>
                    <Card.Section>
                        <Stack>
                            <Heading>{CsI18n.t('Search options')}</Heading>
                        </Stack>

                        <Stack distribution="fill">
                            <Stack.Item>
                                <div className={"search-matching-group-label"}><CsI18n>Matching Group</CsI18n>
                                    <span className={"search-matching-group-value"}>
                                                <Select label="Matching Group"
                                                        options={this.groups}
                                                        onChange={this.handleChangeGroup}
                                                        value={this.state.search_option.group_id}
                                                        labelHidden={true}/>
                                            </span>
                                </div>
                            </Stack.Item>
                            <Checkbox label={CsI18n.t("List only non-existent products on Amazon")}
                                      checked={this.state.search_option.is_only_no_exist}
                                      onChange={this.handleChangeSearchOption('is_only_no_exist')}/>

                            <Checkbox label={CsI18n.t("Availability > 0")}
                                      checked={this.state.search_option.is_only_available}
                                      onChange={this.handleChangeSearchOption('is_only_available')}/>
                            <Checkbox label={CsI18n.t("Products with barcodes only")}
                                      checked={this.state.search_option.is_only_barcode}
                                      onChange={this.handleChangeSearchOption('is_only_barcode')}/>
                            <Checkbox label={CsI18n.t("Existing on Amazon")}
                                      checked={this.state.search_option.is_only_exist}
                                      onChange={this.handleChangeSearchOption('is_only_exist')}/>

                        </Stack>
                    </Card.Section>

                    <Card.Section>
                        {this.renderFiler()}
                    </Card.Section>

                    <Card.Section>
                        <Stack>
                            <Heading>{CsI18n.t('Display options')}</Heading>
                        </Stack>
                        <Stack distribution="fill">

                            <Stack.Item>
                                <Stack alignment="center" spacing={"extraTight"}>
                                    <Stack.Item><Checkbox checked={this.state.display_options[DISPLAY_PRODUCT_ID]}
                                                          onChange={this.handleDisplayOptionCheck(DISPLAY_PRODUCT_ID)}/></Stack.Item>
                                    <Stack.Item><TextStyle><CsI18n>Shopify Product ID</CsI18n></TextStyle></Stack.Item>
                                </Stack>
                            </Stack.Item>
                            <Stack.Item>
                                <Stack alignment="center" spacing={"extraTight"}>
                                    <Stack.Item><Checkbox checked={this.state.display_options[DISPLAY_IMAGE]}
                                                          onChange={this.handleDisplayOptionCheck(DISPLAY_IMAGE)}/></Stack.Item>
                                    <Stack.Item><TextStyle><CsI18n>Image</CsI18n></TextStyle></Stack.Item>
                                </Stack>
                            </Stack.Item>
                            <Stack.Item>
                                <Stack alignment="center" spacing={"extraTight"}>
                                    <Stack.Item><Checkbox checked={this.state.display_options[DISPLAY_AMAZON_QUANTITY]}
                                                          onChange={this.handleDisplayOptionCheck(DISPLAY_AMAZON_QUANTITY)}/></Stack.Item>
                                    <Stack.Item><TextStyle><CsI18n>Amazon quantity</CsI18n></TextStyle></Stack.Item>
                                </Stack>
                            </Stack.Item>
                            <Stack.Item>
                                <Stack alignment="center" spacing={"extraTight"}>
                                    <Stack.Item><Checkbox checked={this.state.display_options[DISPLAY_LOCATIONS]}
                                                          onChange={this.handleDisplayOptionCheck(DISPLAY_LOCATIONS)}/></Stack.Item>
                                    <Stack.Item><TextStyle><CsI18n>Locations</CsI18n></TextStyle></Stack.Item>
                                </Stack>
                            </Stack.Item>
                            <Stack.Item>
                                <Stack alignment="center" spacing={"extraTight"}>
                                    <Stack.Item><Checkbox checked={this.state.display_options[DISPLAY_RULES]}
                                                          onChange={this.handleDisplayOptionCheck(DISPLAY_RULES)}/></Stack.Item>
                                    <Stack.Item><TextStyle><CsI18n>Rules applied</CsI18n></TextStyle></Stack.Item>
                                </Stack>
                            </Stack.Item>
                        </Stack>
                    </Card.Section>


                </Card>
            </Layout.Section>
        )
    }

    renderModal() {

        let selected_count;
        if (this.state.exportBtnClicked === EXPORT_ALL)
            selected_count = this.state.count - this.getExportedCount();
        else
            selected_count = this.getSelectedCount();

        return (
            <CsEmbeddedModal
                open={true}
                onClose={this.handleToggleModal}
                title={CsI18n.t("Export {{selected_count}} products", {selected_count: selected_count})}
                primaryAction={{
                    content: <CsI18n>OK</CsI18n>,
                    onAction: this.postSelectedProducts,
                }}
                secondaryActions={[
                    {
                        content: <CsI18n>Cancel</CsI18n>,
                        onAction: this.handleToggleModal
                    }
                ]}
            >
                <Modal.Section>
                    <TextContainer>
                        <p><CsI18n>Do you still want to continue?</CsI18n></p>
                    </TextContainer>
                </Modal.Section>
            </CsEmbeddedModal>
        )
    }

    renderError() {
        let errorType;
        let errorTitle;
        let errorMessage;

        if (this.state.postError) {
            errorType = this.state.postError.type;
            if (this.state.postError.message) {
                errorTitle = this.state.postError.message;
            } else {
                errorTitle = CsI18n.t("Failed to export products");
            }
        } else if (this.state.error) {
            errorType = this.state.error.type;
            errorMessage = this.state.error.message;
        }

        return (
            <Layout.Section>
                <CsErrorMessage
                    errorType={errorType}
                    errorTitle={errorTitle}
                    errorMessage={errorMessage}
                />
                <br/>
            </Layout.Section>
        )
    }

    renderImportSuccess() {
        return (
            <div>
                <Banner status="success" title={this.state.postSuccess}/>
                <br/>
            </div>
        )
    }

    renderLoading() {
        return (
            <Layout.Section>
                <div className="loading">
                    <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
                </div>
            </Layout.Section>
        )
    }

    renderEmpty() {
        let message;
        if (this.state.message) {
            message = this.state.message;
        } else {
            message = 'No products found'
        }
        return (
            <Layout.Section>
                <Banner status="warning" title={CsI18n.t("No product")}>
                    <TextStyle><CsI18n>{message}</CsI18n></TextStyle>
                </Banner>
            </Layout.Section>
        )
    }

    renderDataList() {
        let {is_display_rules} = this.state.display_options;
        return (
            <Layout.Section>
                {this.state.postSuccess ? this.renderImportSuccess() : ''}
                {this.state.error || this.state.postError ? this.renderError() : ''}
                {this.renderProductTableInfor()}
                {is_display_rules? this.renderRuleMarkInfo():null}
                {this.renderProductExportTable()}
                {this.hasMore() ? this.renderProductTableFooter() : ''}
            </Layout.Section>
        )
    }

    renderFiler() {
        const filters = [
            {
                value: FILTER.existing,
                label: CsI18n.t('Only existing offers'),
            },
            {
                value: FILTER.unexisting,
                label: CsI18n.t('Only unexisting offers'),
            },
        ];

        let filterTags = [];
        if (this.state.appliedFilters.length) {
            this.state.appliedFilters.forEach((filter, index) => {
                filterTags.push(
                    <Stack.Item key={index}>
                        <Tag onRemove={this.handleRemoveFilter(filter.value)}>{filter.label}</Tag>
                    </Stack.Item>
                );
            })
        }

        return (
            <Stack vertical spacing="tight">
                <Stack.Item>
                    <Stack spacing="none">
                        <Stack.Item>
                            <div className="export-filter">
                                <CsFastFilter
                                    filters={filters}
                                    appliedFilters={this.state.appliedFilters}
                                    onFiltersChange={this.handleFiltersChange}
                                />
                            </div>
                        </Stack.Item>
                        <Stack.Item fill>
                            <div className="filter-search">
                                <ResourceList.FilterControl
                                    searchValue={this.state.search_option.keyword}
                                    onSearchChange={this.handleSearchChange}
                                    additionalAction={{
                                        content: CsI18n.t('Search'),
                                        loading: this.state.searching,
                                        disabled: this.state.searching,
                                        onAction: () => this.handleSearchClick(),
                                    }}
                                />
                            </div>
                        </Stack.Item>
                    </Stack>
                </Stack.Item>
                {this.state.appliedFilters.length ?
                    <Stack.Item>
                        <Stack spacing="tight">
                            {filterTags}
                        </Stack>
                    </Stack.Item>
                    : ''}
            </Stack>
        );
    }

    renderLegend() {
        return (
            <div className="legend">
                <Stack>
                    <Stack.Item>
                        <TextStyle variation="strong">&#10003; {CsI18n.t("Can be created")}</TextStyle>
                    </Stack.Item>
                </Stack>
            </div>
        )
    }

    renderProductTableFooter() {
        return (
            <div className="pagination">
                <Stack wrap={false} alignment="center">
                    <Stack.Item>
                        <TextStyle><CsI18n>Showing</CsI18n></TextStyle>
                        <div className="pagination-select">
                            <Select
                                options={SELECT_PAGE_OPTIONS}
                                value={this.state.page_item_count}
                                onChange={this.handlePageItemCountChange}
                            />
                        </div>
                        <TextStyle><CsI18n>Items</CsI18n></TextStyle>
                    </Stack.Item>
                    <Stack.Item>
                        <Button loading={this.state.search_more} onClick={this.handleMoreBtnClick}><CsI18n>More</CsI18n></Button>
                    </Stack.Item>
                </Stack>
            </div>
        )
    }

    renderProductExportTable() {
        let dataItem = this.renderDataItem();
        let {is_display_rules} = this.state.display_options;
        console.log(this.state, is_display_rules);
        let display_rule_header = is_display_rules == 1? "Group/Rules":"Group";

        let asinHelp =
            <Stack spacing={"tight"}>
                <Stack.Item>
                    {CsI18n.t('ASIN')}
                </Stack.Item>
                <Stack.Item>
                    <Tooltip
                        content={CsI18n.t("ASIN input field is optional. This option is useful to force the ASIN.")}>
                    <span className={"help-tooltip"}>
                        <Icon source={CircleInformationMajorMonotone}
                              color={"green"}/>
                    </span>
                    </Tooltip>
                </Stack.Item>
            </Stack>

        // console.log("renderSearchList", dataItem, this.filteredRows_selected);
        return (
            <div className={'catalog-export'}>
                <CsDataTableEx
                    onChange={this.handleItemCheck}
                    columnContentType={[
                        'text',
                        'text',
                        'text',
                        'numeric',
                        'numeric',
                        'numeric',
                    ]}
                    headers={[
                        {label: <Heading><CsI18n>Title</CsI18n></Heading>, key: 'title'},
                        // {label: <Heading><CsI18n>SKU</CsI18n></Heading>, key: 'sku'},
                        {label: <Heading>{asinHelp}</Heading>, key: 'asin'},
                        {label: <Heading><CsI18n>{display_rule_header}</CsI18n></Heading>, key: 'group'},
                        {label: <Heading><CsI18n>Price/Qty</CsI18n></Heading>, key: 'qty'},
                        // {label: <Heading><CsI18n>Price</CsI18n></Heading>, key: 'price'},
                        {label: <Heading><CsI18n>Synced</CsI18n></Heading>, key: 'synced'},
                        {label: <Heading>&#10003;</Heading>, key: 'can_be'},
                    ]}
                    dataItem={dataItem}
                    selected={this.filteredRows_selected}/>
            </div>
        );
    }
}

export default Export;
