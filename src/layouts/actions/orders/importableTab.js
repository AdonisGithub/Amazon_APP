import AmazonTab from "../../../helpers/amazon-tab";
import React from 'react'
import CsI18n from "../../../components/csI18n"

import {
    Avatar,
    Banner,
    Button,
    Checkbox,
    DataTable,
    FilterType,
    Heading,
    Icon,
    Layout,
    Page,
    ResourceList,
    Stack,
    Spinner,
    TextStyle,
    Tooltip,
    Select,
    ButtonGroup,
    Modal,
    TextContainer,
    Badge,
    ChoiceList,
} from '@shopify/polaris';
import ShopifyContext from "../../../context"
import Util from "../../../helpers/Util"
import CsDatePicker from "../../../components/csDatePicker"
import CsEmbeddedModal from "../../../components/csEmbeddedModal"
import ApplicationApiCall from "../../../functions/application-api-call";
import "./orders.css"
import CsErrorMessage from "../../../components/csErrorMessage/csErrorMessage";
import CsDataTable from "../../../components/csDataTable";
import Cache from "../../../helpers/Cache";
// import order_data from "./../../../testData/order_error.json";


//lookup status
const LOOKUP_NONE = 1;
const LOOKUP_GETTING = 2;
const LOOKUP_DONE = 3;

//lookup import status
const LOOKUP_IMPORTABLE = 'importable';
const LOOKUP_IMPORT_IMPORTED = 'imported';
const LOOKUP_IMPORT_EXIST = 'exist';
const LOOKUP_IMPORT_ERROR = 'error';

// //order state
// const ORDER_STATE = {
//     NONE: 0,
// }
// //import state
// const IMPORT_STATE = {
//     NONE: 0,
//     IMPORTED: 1,
// }

const DEFAULT_PAGE_COUNT = 100;
const SELECT_PAGE_OPTIONS = [
    {label: 30, value: 30},
    {label: 50, value: 50},
    {label: 100, value: 100},
];

const AMOUNT_TO_IMPORT_AT_ONCE = 1; //amount to import at once

class ImportableTab extends AmazonTab {

    getName() {
        return "OrderList";
    }

    state = {
        error: null,
        orders: [],
        selected: [],
        processing: false,
        importing: false,
        importSuccess: false,
        importError: null,

        keywordFilter: '',
        // searchValue: '',
        openimportmodal: false,
        nameFilter: [],
        appliedFilters: [],
        filter_existing: ['all'], //all, no, exist

        searching: false,
        searchDateFrom: null,
        searchDateTo: null,
        searchOrderStatus: "all",

        searchingMore: false,
        searchNextToken: "",
        page_item_count : DEFAULT_PAGE_COUNT,

        //LOOKUP_NONE: no click lookup, LOOKUP_GETTING: when click lookup,  LOOKUP_DONE: when data is loaded from server.
        lookupStatus: LOOKUP_NONE,
        lookupBtnClicked: false,
        // bMaxLimited: false,
    }

    constructor(props) {
        super(props);
        this.rows = [];
        this.rows_selected = [];
        this.shopify = ShopifyContext.getShared();
        this.unMounted = false;
        this.selectedConfiguration = this.getConfigurationSelectedIndex();

        let date_from = new Date();
        let page_item_count = Cache.getCachedParameter('order_page_items_count');
        if (page_item_count > 0) {
            this.state.page_item_count = parseInt(page_item_count);
        }
        let searchDateFrom = new Date(date_from.setDate(date_from.getDate() - 1));
        let searchDateTo = new Date();
        this.state.searchDateFrom = searchDateFrom;
        this.state.searchDateTo = searchDateTo;
        this.initialState = Util.clone(this.state);
    }

    componentWillReceiveProps(nextProps) {
        super.componentWillReceiveProps(nextProps);

        console.log("[componentWillReceiveProps]", nextProps);

        if (this.selectedConfiguration !== this.getConfigurationSelectedIndex()) {
            this.selectedConfiguration = this.getConfigurationSelectedIndex();
            this.setState(Util.clone(this.initialState), this.init)
        }
    }

    componentDidMount() {
        // this.init();
    }

    componentWillUnmount() {
        this.unMounted = true;
    }

    init = (is_more = false) => {
        console.log('%cInit', 'color:green');
        let {searchDateFrom, searchDateTo, searchNextToken, page_item_count} = this.state;
        if (this.state.searchDateFrom === null) {
            let date_from = new Date();

            searchDateFrom = new Date(date_from.setDate(date_from.getDate() - 1));
            searchDateTo = new Date();
        }

        let date_from = Util.getDateString(new Date(searchDateFrom));
        let date_to = Util.getDateString(new Date(searchDateTo));
        let order_status = this.state.searchOrderStatus;

        let params;
        let configuration = this.shopify.getConfigurationSelected();
        if (order_status == "all") {
            params = {configuration, date_from, date_to, page_item_count};
        } else {
            params = {
                configuration,
                date_from,
                date_to,
                order_status,
                page_item_count
            };
        }
        if (is_more) {
            params.next_token = is_more? searchNextToken: null;
        }

        let updatedState = {
            lookupStatus: LOOKUP_GETTING,
            searchDateFrom, searchDateTo,
        }
        if (is_more) {
            updatedState.searchingMore = true;
        } else {
            updatedState.processing = true;
        }

        this.setState(updatedState);
        ApplicationApiCall.get('/application/orders/list', params, (json) => {this.cbInitData(is_more, json);}, this.cbInitError);
    }

    cbInitData = (is_more, json) => {
        console.log(json);
        if (json && this.unMounted === false) {

            let orders = [];
            let selected = [];
            let lookupStatus;
            let lookupFlag;
            let order;
            let index = 0;
            // let bMaxLimited = json.orders.length == 100;
            if (is_more) {
                orders = this.state.orders;
                selected = this.state.selected;
                index = orders.length;
            }
            for(let i in json.orders) {
                order = json.orders[i];
                let {amazon_order_id, shopify_order_id, existing, order_status} = order;
                if (order.order_status === "Canceled" || order.order_status === "Pending") {
                    continue;
                }
                order.import_status = existing? LOOKUP_IMPORT_EXIST:LOOKUP_IMPORTABLE;
                orders.push(order);
                selected.push({id: index, checked: false, disabled: (existing === true)? true:false });
                index++;
            }
            let searchNextToken = json.next_token;

            lookupStatus = LOOKUP_DONE;
            lookupFlag = false;

            this.setState(preState => ({
                ...preState,
                orders,
                selected,
                lookupStatus: lookupStatus,
                lookupFlag: lookupFlag,
                // bMaxLimited,
                processing: false,
                searching: false,
                searchingMore: false,
                searchNextToken,
            }));
        }
    }

    cbInitError = (err) => {
        console.log(err);

        if (err && this.unMounted === false) {
            this.setState({error: err, processing: false, searching: false, searchingMore: false})
        }
    }

    handleMoreBtnClick = () => {
        console.log("handleMoreBtnClick start");
        this.init(true);
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

    checkFilterOption = (nameFilter, name) => {

        let array = []
        let names = this.state.appliedFilters && this.state.appliedFilters.filter((item) => {
            return item.key == nameFilter
        })
        names.map((item) => {
            if (item.key === "nameFilter") {
                if (typeof name == "string" && item.value && typeof item.value == "string" && name.toLowerCase().indexOf(item.value.toLowerCase()) !== -1) {
                    array.push(true);
                } else {
                    array.push(false);
                }
            }

            if (item.key === "cityFilter") {
                if (typeof name == "string" && item.value && typeof item.value == "string" && name.toLowerCase().indexOf(item.value.toLowerCase()) !== -1) {
                    array.push(true);
                } else {
                    array.push(false);
                }
            }

            if (item.key === "countryFilter") {
                if (typeof name == "string" && item.value && typeof item.value == "string" && name.toLowerCase().indexOf(item.value.toLowerCase()) !== -1) {
                    array.push(true);
                } else {
                    array.push(false);
                }
            }

            if (item.key === 'orderState') {
                if (typeof name === "string" && item.value && item.value === name) {
                    array.push(true);
                } else {
                    array.push(false);
                }
            }
        })

        return array
    }

    checkDateFilterOption = (nameFilter, date) => {
        let array = []

        let names = this.state.appliedFilters && this.state.appliedFilters.filter((item) => {
            return item.key == nameFilter
        })
        names.map((item) => {
            if (date && item.value && typeof item.value == "string") {

                let order_date = Util.getDateString(new Date(date));

                if (item.key === "orderDateFilter" && item.value === order_date) {
                    array.push(true);
                } else {
                    array.push(false);
                }
            }
        })
        return array
    }

    checkFilter = (order) => {
        console.log("checkFilter", order);
        let {amazon_order_id, name, city, country_code, order_status, display_date, existing} = order;

        if (typeof this.state.appliedFilters != "undefined") {
            // let arrayFilter = [];
            let arrayNameFilter, arrayCityFilter, arrayCountryCodeFilter, arrayOrderStateFilter, arrayDateCodeFilter;

            arrayNameFilter = this.checkFilterOption("nameFilter", name);
            if (arrayNameFilter.length > 0 && !this.isSomeBool(arrayNameFilter)) return false;
            // arrayFilter.push(this.isSomeBool(arrayNameFilter));

            arrayCityFilter = this.checkFilterOption("cityFilter", city);
            if (arrayCityFilter.length > 0 && !this.isSomeBool(arrayCityFilter)) return false;
            // arrayFilter.push(this.isSomeBool(arrayCityFilter));

            arrayCountryCodeFilter = this.checkFilterOption("countryCodeFilter", country_code);
            if (arrayCountryCodeFilter.length > 0 && !this.isSomeBool(arrayCountryCodeFilter)) return false;
            // arrayFilter.push(this.isSomeBool(arrayCountryCodeFilter));

            arrayOrderStateFilter = this.checkFilterOption("orderState", order_status);
            if (arrayOrderStateFilter.length > 0 && !this.isSomeBool(arrayOrderStateFilter)) return false;
            // arrayFilter.push(this.isSomeBool(arrayOrderStateFilter));

            arrayDateCodeFilter = this.checkDateFilterOption("orderDateFilter", display_date);
            if (arrayDateCodeFilter.length > 0 && !this.isSomeBool(arrayDateCodeFilter)) return false;
            // arrayFilter.push(this.isSomeBool(arrayDateCodeFilter));
        }

        let {filter_existing} = this.state;
        if (Array.isArray(filter_existing) && filter_existing.length > 0) {
            filter_existing = filter_existing[0];
        }
        if(filter_existing == 'no') {
            if(existing) {
                return false;
            }
        } else if(filter_existing == 'exist') {
            if(!existing) {
                return false;
            }
        }
        if( !this.state.keywordFilter )
            return true;
        let keyword = this.state.keywordFilter.toLowerCase();
        if( name.toLowerCase().indexOf(keyword) !== -1 ||
            city.toLowerCase().indexOf(keyword) !== -1 ||
            amazon_order_id.toLowerCase().indexOf(keyword) !== -1 )
        {
            return true;
        }
        let bMatched = false;
        if(order.order_lines) {
            for(let item of order.order_lines) {
                if( (item.sku && item.sku.toLowerCase().indexOf(keyword) !== -1) ||
                    (item.title && item.title.toLowerCase().indexOf(keyword) !== -1) )
                {
                    return true;
                }
            }
        }

        return false;
    }

    initRows() {
        this.rows = [];
        this.rows_selected = [];
        for (let index in this.state.orders) {

            let order = this.state.orders[index];

            let iso_code = order.country_code.toLowerCase();
            let full_address = order.postal_code + ', ' + order.city.toUpperCase() + ' (' + order.country_code + ')';

            var name = order.name.toLowerCase()
                .split(' ')
                .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
                .join(' ');
            const image_url = this.shopify.static_content + '/amazon/flags/flag_' + iso_code + '_64px.png';

            let checkFilterFn = this.checkFilter(order);
            if (!checkFilterFn) {
                continue;
            }
            let order_import_status = order.import_status;
            let show_import_status = null;
            let disabled = false;

            show_import_status = <Badge><CsI18n>Yes</CsI18n></Badge>

            if (order_import_status) {
                switch (order_import_status) {
                    case LOOKUP_IMPORT_IMPORTED:
                        show_import_status = <Badge status="success"><CsI18n>Imported</CsI18n></Badge>
                        disabled = true;
                        break;
                    case LOOKUP_IMPORT_EXIST:
                        disabled = true;
                        show_import_status = <Badge status="attention"><CsI18n>Existing</CsI18n></Badge>
                        break;
                    case LOOKUP_IMPORT_ERROR:
                        show_import_status = <Badge status="warning"><CsI18n>Error</CsI18n></Badge>
                        break;
                    case LOOKUP_IMPORTABLE:
                        show_import_status = <Badge><CsI18n>Yes</CsI18n></Badge>;
                        break;
                    default:
                        show_import_status = null;
                        break;
                }
            }
            let business_order = "";
            let premium_order = "";
            let prime_order = "";
            let fba_order = "";

            let order_type = [];

            if (parseInt(order.is_premium_order) === 1) {
                premium_order =
                    <Badge key={order.amazon_order_id + '-premium'} status="success"><CsI18n>Premium</CsI18n></Badge>;
                order_type.push(premium_order);
            }
            if (parseInt(order.is_prime) === 1) {
                prime_order =
                    <Badge key={order.amazon_order_id + '-prime'} status="success"><CsI18n>Prime</CsI18n></Badge>;
                order_type.push(prime_order);
            }
            if (parseInt(order.is_business_order) === 1) {
                business_order =
                    <Badge key={order.amazon_order_id + '-business'} status="success"><CsI18n>Business</CsI18n></Badge>;
                order_type.push(business_order);
            }

            if (order.fulfillment_channel === 'AFN') {
                fba_order =
                    <Badge key={order.amazon_order_id + '-fba'} progress="complete"
                           status="info"><CsI18n>FBA</CsI18n></Badge>;
                order_type.push(fba_order);
            }

            let total_items = 0;
            let total_items_amount = 0;
            let order_lines = [];
            if (order.hasOwnProperty('order_lines') && order.order_lines.length) {

                order.order_lines.forEach((item, index) => {
                    total_items += parseInt(item.quantity_ordered);
                    let amount = parseFloat(item.item_price_amount).toFixed(2);
                    let status = CsI18n.t('Unknown');
                    let progress = 'size="small';
                    let status_banner = "";

                    if (item.quantity_ordered === item.quantity_shipped) {
                        status = CsI18n.t('Shipped');
                        progress += 'complete';
                        status_banner = <Badge status="success">{status}</Badge>
                    } else if (item.quantity_shipped == 0) {
                        status = CsI18n.t('Unshipped');
                        progress += 'incomplete';
                        status_banner = <Badge status="attention">{status}</Badge>
                    } else if (item.quantity_ordered > item.quantity_shipped) {
                        status = CsI18n.t('Partially Shipped');
                        progress += 'partiallyComplete'
                        status_banner = <Badge status="info">{status}</Badge>
                    }

                    order_lines.push(
                        <Stack key={order.amazon_order_id + '-' + item.sku + index} wrap={false} spacing="extraTight">
                            <Stack.Item><TextStyle>{item.quantity_ordered} x {item.sku}</TextStyle></Stack.Item>
                            <Stack.Item fill><TextStyle>{item.title}</TextStyle></Stack.Item>
                            <Stack.Item>{status_banner}</Stack.Item>
                        </Stack>
                    );

                })
            }

            this.rows.push([
                <div className="order-from">
                    <Stack wrap={false}>
                        <Stack.Item>
                            <Avatar source={image_url} alt={iso_code} size="small"/>
                        </Stack.Item>
                        <Stack.Item>
                            <Stack wrap={true} vertical spacing="extraTight">
                                <Stack.Item>
                                    <Heading>{name}</Heading>
                                </Stack.Item>
                                <Stack.Item>
                                    <TextStyle variation="subdued">{full_address}</TextStyle>
                                </Stack.Item>
                                <Stack.Item>
                                    <Stack spacing="none" wrap={true}>
                                        <Stack.Item>
                                            <TextStyle variation="code">#{order.amazon_order_id}</TextStyle>
                                        </Stack.Item>
                                    </Stack>

                                </Stack.Item>
                                <Stack.Item fill>
                                    {order_lines}
                                </Stack.Item>
                            </Stack>
                        </Stack.Item>

                    </Stack>
                </div>
                ,
                <div className="order-date">{order.display_date}</div>,
                <div>{total_items}</div>,
                <div>{order.order_total_currency}</div>,
                <div>{parseFloat(order.order_total_amount).toFixed(2)}</div>,
                show_import_status,
                <Stack vertical={true}>{order_type}</Stack>
            ]);
            this.rows_selected.push(this.state.selected[index]);
        }
    }

    handleLookupClick = () => {

        this.setState({
            orders: [],
            error: null,
            lookupBtnClicked: true,
        }, this.init);
    }

    handleKeywordChange = (keyword) => {
        this.setState({keywordFilter: keyword});
    };

    handleSearchClick = () => {
        this.setState({searching: true}, this.init)
    }

    handleFiltersChange = (appliedFilters) => {
        this.setState({appliedFilters});
    };

    handlePageItemCountChange = (value) => {
        let page_item_count = parseInt(value);
        Cache.setCachedParameter('order_page_items_count', page_item_count, -1);
        this.setState({page_item_count: page_item_count})
    }

    handleItemCheck = (row_selected) => {
        let {selected} = this.state;
        for(let i in row_selected) {
            selected[row_selected[i].id] = row_selected[i];
        }
        console.log("handleItemCheck", row_selected, selected);
        this.setState({selected});
    };

    handleSearchDateChange = (field) =>
        (date) => {
            console.log(date);
            let {searchDateFrom, searchDateTo} = this.state;
            let dateLimit = new Date(date);

            const LIMIT_DAY = 1000;
            if (field === "searchDateFrom") {
                searchDateFrom = date;
                dateLimit.setDate(dateLimit.getDate() + LIMIT_DAY);

                if (dateLimit < searchDateTo) {
                    searchDateTo = dateLimit;
                } else {
                    if (date > searchDateTo) {
                        let newDate = new Date(date);
                        searchDateTo = newDate.setDate(newDate.getDate() + LIMIT_DAY);
                    }
                }
            } else {
                searchDateTo = date;
                dateLimit.setDate(dateLimit.getDate() - LIMIT_DAY);

                if (dateLimit > searchDateFrom) {
                    searchDateFrom = dateLimit;
                } else {
                    if (date < searchDateFrom) {
                        let newDate = new Date(date);
                        searchDateFrom = newDate.setDate(newDate.getDate() - LIMIT_DAY);
                    }
                }

            }
            this.setState({searchDateFrom: searchDateFrom, searchDateTo: searchDateTo});
        }


    getSelectedIndex() {
        let data = [];
        let {selected} = this.state;
        selected.forEach((item, index) => {
            if (item.checked) {
                data.push(index);
            }
        });

        return data;
    }

    handleImportLookupOrder = (is_start = true, selected_list = []) => {
        console.log("handleImportLookup");
        let params = {configuration: this.shopify.getConfigurationSelected()};

        let data = [];
        let selected = is_start ? this.getSelectedIndex() : selected_list;

        let remain_selected = [];
        for (let i in selected) {
            let index = selected[i];
            if (i < AMOUNT_TO_IMPORT_AT_ONCE) {
                data.push(this.state.orders[index].amazon_order_id);
            } else {
                remain_selected.push(index);
            }
        }
        console.log(selected, remain_selected);
        if (is_start) {
            console.log(params, data, 'data:' + JSON.stringify(data));
            this.setState({importing: true, openimportmodal: false});
        }
        ApplicationApiCall.post('/application/orders/import', params, data, (result) => {
            this.cbImportOrder(result, remain_selected)
        }, this.cbImportError, false);
    }

    cbImportOrder = (result, selected_list) => {
        if (this.unMounted !== false) {
            return;
        }
        let {selected} = this.state;
        if (result.length) {
            for(let index in this.state.orders) {
                let order = this.state.orders[index];
                if (order instanceof Object
                    && order.hasOwnProperty('amazon_order_id'))
                {
                    let found = result.find((item) => {
                        return order.amazon_order_id == item.amazon_order_id
                    });
                    if (found) {
                        selected[index].disabled = true;
                        selected[index].checked = false;
                        order.existing = true;
                        order.import_status = LOOKUP_IMPORT_IMPORTED;
                    }
                }
            }

            console.log("Success ", result);
        }
        console.log('Success : result', result);
        if (selected_list.length > 0) {
            this.handleImportLookupOrder(false, selected_list);
            this.setState({selected});
        } else {
            this.setState({
                importing: false,
                importSuccess: true,
                selected
            });
            setTimeout(() => {
                this.setState({importSuccess: false, processing: false});
            }, 5000);
        }
    }

    cbImportError = (err) => {
        console.log('Error : ', err);

        if (err && this.unMounted === false) {
            this.setState({importing: false, importSuccess: false, importError: err});
            // setTimeout(() => {
            //     this.setState({importError: false, processing: false});
            // }, 7000);
        }
    }

    handleSearchStateChange = (value) => {
        this.setState({searchOrderStatus: value});
    }

    handleToggleModal = () => {
        this.setState(({openimportmodal}) => ({
            openimportmodal: !openimportmodal
        }));
    };


    importConfirmation = () => {
        console.log(this.state.openimportmodal);
        this.handleToggleModal();
    }


    render() {
        console.log(this.state);
        var content;

        if (this.state.error) {
            content = this.renderError();
        } else if (this.state.processing && this.state.searching === false) {
            content = this.renderLoading();
        } else if (this.state.orders.length === 0) {
            if (this.state.lookupBtnClicked === true)
                content = this.renderNoOrders();
            else
                content = ''
        } else {
            content = this.renderOrders();
        }

        let notice = '';

        if (this.state.importSuccess) {
            notice = (
                <Layout.Section>
                    <Banner status="success" title={CsI18n.t("Orders imported successfully")}/>
                </Layout.Section>
            );
        } else if (this.state.importError) {
            notice = (
                <Layout.Section>
                    <CsErrorMessage
                        errorType={this.state.importError.type}
                        errorMessage={this.state.importError.message}
                    />
                </Layout.Section>
            );
        }
        const lookupSearchRender = this.renderLookupSearch();
        return (
            <div style={{width: '100%'}}>
                <div className="order-lookup">
                    {lookupSearchRender}
                </div>
                {notice}
                {content}

                <CsEmbeddedModal
                    open={this.state.openimportmodal}
                    onClose={this.handleToggleModal}
                    title={CsI18n.t("Confirm")}
                    primaryAction={{
                        content: <CsI18n>OK</CsI18n>,
                        onAction: this.handleImportLookupOrder,
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
                            <p><CsI18n>Do you want to import selected orders?</CsI18n></p>
                        </TextContainer>
                    </Modal.Section>
                </CsEmbeddedModal>
            </div>
        )
    }

    renderLoading() {
        return (
            <Layout.Section>
                <div align="center">
                    <br/>
                    <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
                </div>
            </Layout.Section>
        )
    }

    renderError() {

        return (
            <Layout.Section>
                <CsErrorMessage
                    errorType={this.state.error.type}
                    errorMessage={this.state.error.message}
                />
            </Layout.Section>
        )
    }

    renderMaxOrderLimited() {
        return (
            <Layout.Section>
                <Banner status="warning" title={CsI18n.t("More than 100 orders displayed, not all orders can be imported at once")} />
            </Layout.Section>
        )
    }

    renderNoOrders() {
        return (
            <Layout.Section>
                <Banner status="warning" title={CsI18n.t("No order")}>
                    <TextStyle><CsI18n>No order has been found in this period</CsI18n></TextStyle>
                </Banner>
            </Layout.Section>
        )
    }

    renderLookupSearch() {
        const lookupStatus = [
            {label: CsI18n.t('All'), value: 'all'},
            {label: CsI18n.t('Shipped'), value: 'shipped'},
            {label: CsI18n.t('Unshipped'), value: 'unshipped'},
        ];

        return (
            <Layout.Section>

                <Stack alignment="center" spacing="tight">
                    <Stack.Item>
                        <TextStyle variation="strong"><CsI18n>From</CsI18n></TextStyle>
                    </Stack.Item>
                    <Stack.Item>
                        <CsDatePicker date={Util.getDateString(new Date(this.state.searchDateFrom))}
                                      onChange={this.handleSearchDateChange('searchDateFrom')}/>
                    </Stack.Item>
                    <Stack.Item>
                        <TextStyle variation="strong"><CsI18n>To</CsI18n></TextStyle>
                    </Stack.Item>
                    <Stack.Item>
                        <CsDatePicker date={Util.getDateString(new Date(this.state.searchDateTo))}
                                      onChange={this.handleSearchDateChange('searchDateTo')}/>
                    </Stack.Item>
                    <Stack.Item>
                        <TextStyle variation="strong"><CsI18n>Order Status</CsI18n></TextStyle>
                    </Stack.Item>
                    <Stack.Item fill>
                        <div className="select-state">
                            <Select
                                options={lookupStatus}
                                onChange={this.handleSearchStateChange}
                                value={this.state.searchOrderStatus}
                            />
                        </div>
                    </Stack.Item>
                    <Stack.Item>
                        <Select
                            label={'Items'}
                            labelInline={true}
                            options={SELECT_PAGE_OPTIONS}
                            value={this.state.page_item_count}
                            onChange={this.handlePageItemCountChange}
                        />
                    </Stack.Item>
                    <Stack.Item>
                        <Button
                            disabled={this.state.processing || this.state.searchingMore}
                            onClick={this.handleLookupClick}
                        > <CsI18n>Lookup</CsI18n>
                        </Button>
                    </Stack.Item>
                </Stack>

            </Layout.Section>
        );

    }

    renderLookupImport() {
        let selected = this.getSelectedIndex();
        return (
            <Layout.Section>
                <Stack>
                    <Stack.Item fill/>
                    <Stack.Item>
                        <ButtonGroup>
                            <Button primary
                                    loading={this.state.importing}
                                    disabled={selected.length === 0 || this.state.importing}
                                    onClick={this.importConfirmation}><CsI18n>Import</CsI18n></Button>
                        </ButtonGroup>
                    </Stack.Item>
                </Stack>
            </Layout.Section>
        );
    }

    renderFiler() {
        const filters = [
            {
                key: 'nameFilter',
                label: CsI18n.t('Name'),
                operatorText: CsI18n.t('Contains'),
                type: FilterType.TextField,
            }, {
                key: 'cityFilter',
                label: CsI18n.t('City'),
                operatorText: CsI18n.t('Contains'),
                type: FilterType.TextField,
            }, {
                key: 'countryCodeFilter',
                label: CsI18n.t('Country Code'),
                operatorText: CsI18n.t('is'),
                type: FilterType.Select,
                options: ['FR', 'EN', 'DE', 'IT'],
            },
            {
                key: 'orderDateFilter',
                label: CsI18n.t('Order date'),
                operatorText: CsI18n.t('is'),
                type: FilterType.TextField,
                textFieldType: 'date',
            },
        ];

        // const order_status = {
        //   key: 'orderState',
        //   label: CsI18n.t('Order State'),
        //   operatorText: CsI18n.t('is'),
        //   type: FilterType.Select,
        //   options: [CsI18n.t('Shipped'), CsI18n.t('Unshipped')],
        // }
        //
        // const action = {
        //   content: CsI18n.t("Search"),
        //   onAction: this.handleSearchClick,
        //   loading: this.state.searching === true
        // }
        //
        let existing_filter_option = [
            {label: CsI18n.t('All'), value: 'all'},
            {label: CsI18n.t('Non existing'), value: 'no'},
            {label: CsI18n.t('Existing'), value: 'exist'},
        ]
        return (
            <Layout.Section>
                <Stack alignment={"center"}>
                    <Stack.Item fill>
                        <ResourceList.FilterControl
                            filters={filters}
                            appliedFilters={this.state.appliedFilters}
                            onFiltersChange={this.handleFiltersChange}
                            searchValue={this.state.keywordFilter}
                            onSearchChange={this.handleKeywordChange}
                        />
                    </Stack.Item>
                    <Stack.Item>
                        <div className="custom-choice">
                            <ChoiceList
                                title = ""
                                titleHidden={true}
                                choices={existing_filter_option}
                                selected={this.state.filter_existing}
                                onChange={(filter_existing) => {this.setState({filter_existing})}}
                            />
                        </div>
                    </Stack.Item>
                </Stack>
            </Layout.Section>
        );
    }

    renderOrders() {
        let content;
        if (this.state.searching === true) {
            content = this.renderLoading();
        } else {
            content = this.renderImportableTable();
        }

        return (
            <Layout.Section>
                {/*{this.state.bMaxLimited? this.renderMaxOrderLimited():''}*/}
                {this.renderFiler()}
                {content}
            </Layout.Section>
        );
    }

    // renderTableFooter() {
    //     return(
    //         <div className="pagination">
    //             <Stack wrap={false} alignment="center">
    //                 <Stack.Item>
    //                     <TextStyle><CsI18n>Showing</CsI18n></TextStyle>
    //                     <div className="pagination-select">
    //                         <Select
    //                             options={SELECT_PAGE_OPTIONS}
    //                             value={this.state.page_item_count}
    //                             onChange={this.handlePageItemCountChange}
    //                         />
    //                     </div>
    //                     <TextStyle><CsI18n>Items</CsI18n></TextStyle>
    //                 </Stack.Item>
    //                 <Stack.Item>
    //                     <Button loading={this.state.searchingMore} disabled={this.state.processing || this.state.searchingMore} onClick={this.handleMoreBtnClick}><CsI18n>More</CsI18n></Button>
    //                 </Stack.Item>
    //             </Stack>
    //         </div>
    //     )
    // }

    renderImportableTable() {
        let headings = [
            <Heading><CsI18n>From</CsI18n></Heading>,
            <Heading><CsI18n>&#128197;</CsI18n></Heading>,
            <Heading>#</Heading>,
            <Heading>&curren;</Heading>,
            <Heading><CsI18n>Amount</CsI18n></Heading>,
            <Heading><CsI18n>Importable</CsI18n></Heading>,
            <Heading><CsI18n>Flag</CsI18n></Heading>,
        ];

        this.initRows();
        let has_more = !!this.state.searchNextToken;

        console.log("renderImportableTable", this.rows, this.rows_selected);
        return (
            <div>
                {this.renderLookupImport()}
                <Layout.Section>
                    <div className="order-table">
                        <CsDataTable
                            onChange={this.handleItemCheck}
                            columnContentType={[
                                'text',
                                'text',
                                'numeric',
                                'text',
                                'numeric',
                                'numeric',
                                'numeric',
                            ]}
                            headers={headings}
                            dataItem={this.rows}
                            selected={this.rows_selected}/>
                    </div>
                </Layout.Section>
                {/*{has_more? (this.renderTableFooter()):null}*/}
                {has_more? (<div className={"text-center mt-5"}>
                    <Button loading={this.state.searchingMore} disabled={this.state.processing || this.state.searchingMore} onClick={this.handleMoreBtnClick}><CsI18n>More</CsI18n></Button>
                </div>):null}
            </div>
        )
    }
}

export default ImportableTab;
