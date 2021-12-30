import React from 'react';
import {
    Button,
    Card,
    ResourceList,
    Select,
    Stack,
    TextStyle,
    Heading,
    Spinner,
    Layout,
    Thumbnail,
    Toast
} from "@shopify/polaris";
import {ArrowLeftMinor} from '@shopify/polaris-icons';

import CsI18n from "../../components/csI18n";
import States from "../../helpers/rules/states";
import Constants from "../../helpers/rules/constants";
import Util from "../../helpers/Util";
import MarketplaceTab from "../../helpers/marketplace-tab";

import {ModelContext} from "./model-context";
import ModelTab from "./model-context";

import CsErrorMessage from "../../components/csErrorMessage";
import ApplicationApiCall from "../../functions/application-api-call";

import CsAutoComplete from '../../components/csAutocomplete';

import CsImageModal from "../../components/csImageModal";
import CsNoImage from "../../components/csNoImage";


const DEFAULT_PAGE_COUNT = 20;

export default class BulkEdit extends ModelTab {

    static contextType = ModelContext;

    state = {
        wait: false,
        status: States.STATUS_NORMAL,

        selectedMarketplaceTab: 0,
        fields: [],

        group_id: "",
        search: "",
        search_pre: "",

        page_item_count: DEFAULT_PAGE_COUNT,
        search_count: 0,

        select_all: false,
        filter_text: "",
        activeImageModalIndex: "",
        updated: false,

        selectedItems: [],

        showToast: false,
    }

    static default_value = { value: '', attribute: '', value_error: '', attribute_error: '' };

    constructor(props) {
        super(props);
        this.initialState = Util.clone(this.state);
        this.unMounted = false;
        this.auto_id = 1;
    }

    componentWillMount() {
        require("./bulkedit.css");
        let marketplace_id = this.getMarketplaceId();
        this.initConfig(marketplace_id);
    }

    getMarketplaceId() {
        let {selectedMarketplaceTab} = this.state;
        let {marketplaceList} = this.context;
        let {MarketplaceId} = marketplaceList[selectedMarketplaceTab];
        return MarketplaceId;
    }

    initConfig(marketplace_id) {
        let matchingGroupList = [{label: "", value: ""}];
        if( this.context.data && this.context.data.matchingGroup ) {
            for(let i in this.context.data.matchingGroup ) {
                let matchingGroup = this.context.data.matchingGroup[i];
                let {is_update_mode} = matchingGroup;
                if (is_update_mode) {
                    continue;
                }
                if( matchingGroup.marketplace_id == marketplace_id ) {
                    matchingGroupList.push({label: matchingGroup.groupName, value: ""+matchingGroup.id});
                }
            }
        }
        this.matchingGroupList = matchingGroupList;
        this.products = [];
        this.filtered_products = [];
        this.extra_fields = [];

        this.setState({group_id: "", search: "", search_pre: "", filter_text: "", selectedItems: [], select_all: false, search_count: 0});
    }

    loadData(group_id) {
        this.products = [];
        this.filtered_products = [];
        this.extra_fields = [];
        if( group_id ) {
            this.fetchExtraFields(group_id);
        }
    }

    componentWillUnmount() {
        this.unMounted = true;
    }

    initExtraFields(group_id, extra_fields) {
        this.extra_fields = extra_fields;
        this.extra_fields_map = [];
        let fields = [];
        for(let key in this.extra_fields ) {
            let {name} = this.extra_fields[key];
            this.extra_fields_map[name] = this.extra_fields[key];
            fields[name] = Util.clone(BulkEdit.default_value);
        }

        //search product
        this.fetchProducts(group_id, this.state.search);
        this.setState({fields: fields, selectedItems: []});
    }

    initProducts(products, isNew) {
        if( isNew ) {
            this.products = [];
        }
        for(let key in products ) {
            let product = products[key];
            let extra_fields = [];
            for(let ei in product.extra_fields) {
                let field = product.extra_fields[ei];
                if( this.extra_fields_map[field.name] ) {
                    extra_fields.push( {...field, display_name: this.extra_fields_map[field.name].display_name});
                }
            }
            product.extra_fields = extra_fields;
            this.products.push(product);
        }
        this.initRows();
    }

    getAutoId() {
        return this.auto_id++;
    }

    fetchProducts(group_id, search, isNew=true) {
        let {configuration} = this.context;

        let {search_count, page_item_count} = this.state;
        if ( isNew || (isNew === false && this.products.length < search_count) ) {
            let limit_from = isNew? 0: this.products.length;
            let limit_to = page_item_count;

            let params = {configuration, group_id, q: search, limit_from, limit_to};

            ApplicationApiCall.get('/application/models/searchproducts', params,
                (json) => {
                    this.cbFetchProductSuccess(json, isNew);
                }, this.cbFetchProductError);

            if(isNew) {
                this.setState({status: States.STATUS_SEARCHING});
            } else {
                this.setState({status: States.STATUS_SEARCHING_MORE});
            }
        }
    }

    cbFetchProductSuccess(json, isNew) {
        console.log("cbFetchProductSuccess", json);
        if (this.unMounted)
            return;

        if (!json) {
            console.error("json is null");
            return;
        }
        let {group_id, count, products} = json;

        this.initProducts(products, isNew);
        console.log("cbFetchProductSuccess", group_id, products);
        this.setState({status: States.STATUS_NORMAL, search_count: count});
    }

    cbFetchProductError = (err) => {
        console.log("cbFetchProductError", err);
        if (err && this.unMounted === false) {
            console.log("cbFetchProductError: show error");
            // setTimeout(() => {
            //     this.setState({error: null, status: States.STATUS_NORMAL})
            // }, 5000);
            this.setState({error: err, status: States.STATUS_ERROR});
        }
    }

    fetchExtraFields(group_id) {
        let {configuration, extraData} = this.context;
        if (extraData[group_id] != undefined) {
            this.initExtraFields(group_id, extraData[group_id]);
            this.setState({wait: false});
            return;
        }

        let params = {configuration, group_id};
        ApplicationApiCall.get('/application/models/extrafields',
            params, this.cbFetchExtraDataSuccess, this.cbFetchExtraDataError);
        this.setState({wait: true});
    }

    cbFetchExtraDataSuccess = (json) => {
        console.log("cbFetchExtraDataSuccess", json);
        if (this.unMounted)
            return;

        if (!json) {
            console.error("json is null");
            return;
        }
        let {group_id, extra_fields} = json;

        this.context.extraData[group_id] = extra_fields;
        this.initExtraFields(group_id, extra_fields);

        console.log("cbFetchMetaCandidateSuccess", group_id, extra_fields);
        this.setState({wait: false});
    }

    cbFetchExtraDataError = (err) => {
        console.log("cbFetchExtraDataError", err);
        if (err && this.unMounted === false) {
            console.log("cbFetchExtraDataError: show error");
            // setTimeout(() => {
            //     this.setState({error: null, status: States.STATUS_NORMAL})
            // }, 5000);
            this.setState({error: err, status: States.STATUS_ERROR, wait: false});
        }
    }

    handleMarketplaceTabChange = (value) => {
        let {marketplaceList} = this.context;
        let {MarketplaceId} = marketplaceList[value];
        this.initConfig(MarketplaceId);
        this.setState({
            selectedMarketplaceTab: value,
        });
    }

    handleSearchBtnClick = (value) => {
        let {search_pre} = this.state;
        this.fetchProducts(this.state.group_id, search_pre);
        this.setState({search: search_pre});
    }

    handleChangeMatchingGroup = (value) => {
        console.log("handleChangeMatchingGroup", value);
        this.loadData(value);
        this.setState({group_id: value, search: "", search_pre: ""});
    }

    handleSearchChange = (value) => {
        this.setState({search_pre: value});
    }

    handleSearchMore = () => {
        let {group_id, search} = this.state;
        this.fetchProducts(group_id, search, false);
    }

    initRows(filter="") {
        this.filtered_products = [];
        if( filter == "") {
            this.filtered_products = this.products.map(item => {
                if( !item.auto_id ) {
                    item.auto_id = this.getAutoId();
                }
                return {id: item.auto_id, ...item};

            });
        } else {
            let dStart = new Date();
            let nStart = dStart.getTime();
            for (let i in this.products) {
                let product = this.products[i];
                let text = [product.sku, product.vender, product.barcode, product.title, ...product.extra_fields.map(field => field.value)].join("::");
                let result = text.search(new RegExp(filter, "i"));
                if (result === -1) {
                    continue;
                }
                if( !product.auto_id ) {
                    product.auto_id = this.getAutoId();
                }
                this.filtered_products.push({id: product.auto_id, ...product});
            }

            let dEnd = new Date();
            let nEnd = dEnd.getTime();
            console.log("time: ", nEnd, nStart, (nEnd-nStart));
        }
    }

    handleFilterChange = (value) => {
        this.initRows(value);
        this.setState({filter_text: value});
    }

    handleValueChange = field => v => {
        let {fields} = this.state;
        fields[field].value = v;
        this.setState({fields});
    }

    handleValidValueAdd = field => v => {
        let {group_id} = this.state;

        let {name, valid_values} = field;
        if(!valid_values) {
            valid_values = [];
        }
        valid_values.push(v);
        for(let key in this.extra_fields) {
            if( this.extra_fields[key].name == name ) {
                this.extra_fields[key].valid_values = valid_values;
                this.extra_fields_map[name].valid_values = valid_values;
                break;
            }
        }

        this.context.extraData[group_id] = this.extra_fields;

        let {configuration} = this.context;
        let params = {configuration, group_id}
        ApplicationApiCall.post('/application/models/saveextra2',
            params,
            {
                name: name,
                values: valid_values,
            },
            (result) => {}
        );
        this.setState({update: true});
    }

    handleAttributeChange = field => v => {
        let {fields} = this.state;
        fields[field].attribute = v;
        if( v ) {
            fields[field].attribute_error = '';
        }
        this.setState({fields});
    }

    selectAttributes(selectedItems) {
        //found same attributes.
        let {fields} = this.state;
        for(let fi in fields) {
            fields[fi] = Util.clone(BulkEdit.default_value);
        }
        let value_reset = [];
        let attribute_reset = [];
        let count_selected = 0;
        let selected_fields = [];
        for( let key in this.products) {
            let product = this.products[key];
            if( selectedItems.includes(product.auto_id) ) {
                count_selected++;
                for(let fi in product.extra_fields) {
                    let product_field = product.extra_fields[fi];
                    if( fields[product_field.name].value && product_field.value && fields[product_field.name].value != product_field.value ) {
                        fields[product_field.name].value = "";
                        value_reset[product_field.name] = true;
                    } else if( !value_reset[product_field.name] && fields[product_field.name].value == "" && product_field.value ) {
                        fields[product_field.name].value = product_field.value;
                    } else if ( fields[product_field.name].value && product_field.value == "" ) {
                        fields[product_field.name].value = "";
                        value_reset[product_field.name] = true;
                    }

                    if( fields[product_field.name].attribute && product_field.attribute && fields[product_field.name].attribute != product_field.attribute ) {
                        fields[product_field.name].attribute = "";
                        attribute_reset[product_field.name] = true;
                    } else if( !attribute_reset[product_field.name] && fields[product_field.name].attribute == "" && product_field.attribute ) {
                        fields[product_field.name].attribute = product_field.attribute;
                    } else if ( fields[product_field.name].attribute && product_field.attribute == "" ) {
                        fields[product_field.name].attribute = "";
                        attribute_reset[product_field.name] = true;
                    }
                    if( selected_fields[product_field.name] ) {
                        selected_fields[product_field.name] ++;
                    } else {
                        selected_fields[product_field.name] = 1;
                    }
                }
            }
        }

        for(let fi in fields) {
            if( !selected_fields[fi] || selected_fields[fi] != count_selected ) {
                fields[fi].value = "";
                fields[fi].attribute = "";
            }
        }
        this.setState({fields});
    }

    handleApplySelection = () => {
        let {fields, selectedItems, group_id} = this.state;
        console.log("handleApplySelection", fields, selectedItems);
        //validate attributes
        let count_error = 0;

        for(let fi in fields) {
            if( fields[fi].value == "" || fields[fi].attribute ) {
                continue;
            }
            let extra_field = this.extra_fields_map[fi];
            if( extra_field.attributes && extra_field.attributes.length > 0 ) {
                fields[fi].attribute_error = CsI18n.t('Please select attribute');
                count_error ++;
            }
        }
        if( count_error ) {
            this.setState({fields});
            return;
        }

        let variant_ids = [];
        for(let i in this.products) {
            if( selectedItems.includes(this.products[i].auto_id) ) {
                variant_ids.push(this.products[i].variant_id);
            }
        }
        if( variant_ids.length == 0 ) {
            let toastMessage = CsI18n.t("Please select products");
            this.setState({showToast: toastMessage});
            return;
        }
        let extra_fields = [];
        for(let fi in fields) {
            let field = fields[fi];
            if( field.value ) {
                extra_fields.push({...field, name: this.extra_fields_map[fi].name, display_name: this.extra_fields_map[fi].display_name});
            }
        }
        // if( extra_fields.length === 0 ) {
        //     let toastMessage = CsI18n.t("Please input Meta fields");
        //     this.setState({showToast: toastMessage});
        //     return;
        // }

        let {configuration} = this.context;

        let params = {configuration, group_id};
        let new_selectedItems = [];
        ApplicationApiCall.post('/application/models/saveproductextra',
            params,
            {variant_ids: variant_ids, extra_fields: extra_fields.map(field => {return {name: field.name, value: field.value, attribute: field.attribute}} ) },
            (result) => {

                for( let key in this.products) {
                    let product = this.products[key];
                    if( !variant_ids.includes(product.variant_id) )
                        continue;

                    product.extra_fields = extra_fields;
                    product.auto_id = this.getAutoId();
                    new_selectedItems.push(product.auto_id);
                }

                this.initRows(this.state.filter_text);
                this.setState({status: States.STATUS_SAVED, selectedItems: new_selectedItems});
                setTimeout(() => {
                    this.setState({status: States.STATUS_NORMAL});
                }, 3000);

            },
            (err) => {
                if (err && this.unMounted === false) {
                    // setTimeout(() => {
                    //     this.setState({error: null, status: States.STATUS_NORMAL})
                    // }, 7000);
                    this.setState({error: err, status: States.STATUS_ERROR, wait: false});
                }

            }
        );
        this.setState({status: States.STATUS_SAVING});
    }

    render() {
        console.log("render", this.state, this.matchingGroupList, this.products, this.filtered_products);
        const {status, selectedMarketplaceTab} = this.state;
        let {marketplaceList} = this.context;

        let contextual_message = '';
        let bEditable = true;
        if( this.state.wait || this.state.status == States.STATUS_SEARCHING ) {
            contextual_message = (<div align="center">
                <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
            </div>);
            bEditable = false;
        } else if ( status === States.STATUS_ERROR ) {
            contextual_message = this.renderError();
        } else if ( status === States.STATUS_SAVED ) {
            contextual_message = <div className={"mb-2"}>{Constants.metaData_saved_successfully}</div>;
        }
        if( this.products.length == 0 ) {
            bEditable = false;
        }

        const toastShow = this.state.showToast ? <Toast content={this.state.showToast} error={true} onDismiss={() => { this.setState({showToast: false})} } duration={5000} /> : '';
        return (
            <div>
                {toastShow}
                <Layout>
                    <Layout.Section>
                        <MarketplaceTab marketplaceList={marketplaceList}
                                        selectedMarketplaceTab={selectedMarketplaceTab}
                                        onChange={this.handleMarketplaceTabChange}/>
                    </Layout.Section>
                </Layout>
                <Layout>
                    <Layout.Section>
                        <div className={"search-group"}>
                            <div className={"matching-list"} >
                                <Select label="MatchingGroup" labelHidden={true} options={this.matchingGroupList} value={this.state.group_id} onChange={this.handleChangeMatchingGroup} disabled={this.state.status == States.STATUS_SAVING} />
                            </div>
                            <div className={"search-box"}>
                                <ResourceList.FilterControl
                                    searchValue={this.state.search_pre}
                                    onSearchChange={this.handleSearchChange}
                                    additionalAction={{
                                        content: CsI18n.t('Search'),
                                        onAction: () => this.handleSearchBtnClick(),
                                    }}
                                />
                            </div>
                        </div>
                    </Layout.Section>
                </Layout>
                <div className={"bulkedit-main"}>
                    {contextual_message}
                    {bEditable? this.renderBulkEdit():''}
                </div>
            </div>
        )
    }

    handleSelectionChange = (selectedItems) => {
        console.log("handleSelectionChange", selectedItems);
        this.selectAttributes(selectedItems);
        this.setState({selectedItems});
    };

    resolveItemIds = (item) => {
        console.log("resolveItemIds", item);
        let {id} = item;
        return id;
    }

    renderBulkEdit() {
        let {status, search_count } = this.state;

        let products_title = (<Stack alignment={"center"}>
            <Stack.Item><Heading><CsI18n>Products</CsI18n></Heading></Stack.Item>
                <Stack.Item>{CsI18n.t("Total products: {{total_count}}", {total_count: search_count})}</Stack.Item><Stack.Item>{CsI18n.t("Showing: {{show_count}}", {show_count: this.products.length } )}</Stack.Item>
        </Stack>)
        let metafields_title = (<Stack alignment={"center"}>
            <Stack.Item fill><Heading><CsI18n>Meta fields</CsI18n></Heading></Stack.Item>
            <Stack.Item><Button icon={ArrowLeftMinor} primary={true} onClick={this.handleApplySelection} disabled={status == States.STATUS_SAVING} loading={status == States.STATUS_SAVING}><CsI18n>Apply to selection</CsI18n></Button></Stack.Item>
        </Stack>);
        return (<Layout>
            <Layout.Section>
                <Card title={products_title} sectioned>
                    <div className={"filter-block"}>
                    <Stack alignment={"center"} distribution={"fillEvenly"}>
                        <Stack.Item>
                            <ResourceList.FilterControl
                            searchValue={this.state.filter_text}
                            onSearchChange={this.handleFilterChange}
                            placeholder={"Filter products"}
                        />
                    </Stack.Item>
                    </Stack>
                    </div>
                    <ResourceList
                        resourceName={{ singular: "product", plural: "products" }}
                        renderItem={this.renderItem} items={this.filtered_products}
                        selectedItems={this.state.selectedItems}
                        onSelectionChange={this.handleSelectionChange}
                        resolveItemId={this.resolveItemIds}
                        selectable
                        loading={status == States.STATUS_SAVING}
                    />
                    {this.products.length < this.state.search_count?
                    <div align="center">
                        <Button onClick={this.handleSearchMore} loading={this.state.status == States.STATUS_SEARCHING_MORE} disabled={this.state.status == States.STATUS_SEARCHING_MORE}><CsI18n>More</CsI18n></Button>
                    </div>
                        :
                        ''}
                </Card>
            </Layout.Section>
            <Layout.Section secondary>
                <Card title={metafields_title} sectioned>
                    {this.renderAvailableFields()}
                    <br/>
                    <Button icon={ArrowLeftMinor} primary={true} onClick={this.handleApplySelection} disabled={status == States.STATUS_SAVING} loading={status == States.STATUS_SAVING}><CsI18n>Apply to selection</CsI18n></Button>
                </Card>
            </Layout.Section>
        </Layout>);
    }

    renderAvailableFields() {
        let view_extra_fields = this.extra_fields.map( field => {
            return (<div className={"available-field"} key={"available-field"+field.name}><Stack vertical={true} spacing={"tight"}>
                <Stack.Item><Heading>{field.display_name}</Heading></Stack.Item>
                <Stack.Item>
                    <CsAutoComplete
                        isOnlyValue={true}
                        options={field.valid_values}
                        selected={this.state.fields[field.name].value}
                        allowedInput={field.has_custom_value? true:false}
                        allowedAddNew={field.has_custom_value? true:false}
                        onChange={this.handleValueChange(field.name)}
                        onAdd={this.handleValidValueAdd(field)}
                        error={this.state.fields[field.name].value_error}
                        isAddFirstEmpty={true}
                        /></Stack.Item>
                {field.attributes && field.attributes.length > 0?
                <Stack.Item>
                    <CsAutoComplete
                        isOnlyValue={true}
                        options={field.attributes}
                        selected={this.state.fields[field.name].attribute}
                        onChange={this.handleAttributeChange(field.name)}
                        isAddFirstEmpty={true}
                        error={this.state.fields[field.name].attribute_error}
                        allowedInput={false}
                    />
                </Stack.Item>:''}
            </Stack></div>);
        });
        return view_extra_fields;
    }

    handleImageModal = (id) => () => {
        this.setState({activeImageModalIndex: id});
    }

    renderItem = (item, _, index) => {
        console.log("renderItem", item);
        const {id, variant_id, sku, vendor, title, shopify_image_url, on_marketplaces, barcode, available, price, collection_id, updated_at, extra_fields} = item;

        let view_extra_fields = extra_fields.map( field => { return <span className={"product-extra-field"} key={variant_id + field.name}><span className={"label"}>{field.display_name}:</span> <TextStyle variation={"code"}>{field.value + "" + (field.attribute? field.attribute:"")}</TextStyle></span> } );

        // let {selected} = this.state;
        // const no_image_url = this.shopify.static_content + '/amazon/no-image.png';

        return (
            <ResourceList.Item id={id} sortOrder={index}>
                <Stack wrap={false} spacing="tight">
                    <Stack.Item>
                        {shopify_image_url ?
                            <CsImageModal
                                title={title}
                                size="large"
                                alt={title}
                                active={this.state.activeImageModalIndex == index}
                                source={shopify_image_url}
                                onToggle={this.handleImageModal(index)}
                            />
                            :
                            <CsNoImage alt={title}/>
                        }
                    </Stack.Item>
                    <Stack.Item fill>
                        <Stack vertical spacing="extraTight">
                            <Stack.Item>
                                <TextStyle variation="strong">{title}</TextStyle>
                            </Stack.Item>
                            <Stack.Item>
                                <div className="display-link">
                                    <Stack spacing="tight">
                                        <Stack.Item><TextStyle>{vendor + " | " + sku + " | " + barcode}</TextStyle></Stack.Item>
                                    </Stack>
                                </div>
                            </Stack.Item>
                            {extra_fields.length > 0? <Stack.Item>{view_extra_fields}</Stack.Item>:''}
                        </Stack>
                    </Stack.Item>
                </Stack>
            </ResourceList.Item>
        );
    }

    renderError() {
        console.log(this.state.error);
        return (
            <CsErrorMessage
                errorType={this.state.error.type}
                errorMessage={this.state.error.message}
            />
        )
    }
}
