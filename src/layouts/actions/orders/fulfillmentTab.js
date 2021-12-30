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
    TextField,
    Badge, Card,
} from '@shopify/polaris';
import {CircleChevronRightMinor, MarkFulfilledMinor} from "@shopify/polaris-icons";
import ShopifyContext from "../../../context"
import Util from "../../../helpers/Util"
import CsDatePicker from "../../../components/csDatePicker"
import ApplicationApiCall from "../../../functions/application-api-call";
import OrderEdit from "./orderEdit";
import "./orders.css"
import CsErrorMessage from "../../../components/csErrorMessage/csErrorMessage";

// import test_unshipped from "../../../testData/test_unshipped";
import CsAutocomplete from "../../../components/csAutocomplete";
import ConfigurationApiCall from "../../../functions/configuration-api-call";

const CARRIER_STATE = {
    NONE: 0,
    PROCESSING: 1,
};

const DEFAULT_SEARCH_PERIOD = 1;

class FulfillmentTab extends AmazonTab {

    getName() {
        return "fulfillment";
    }

    state = {
        ...this.state,
        orders: [],
        error: null,
        processing: true,
        isAllSelected: false,
        selected: [],
        keywordFilter: '',
        searching: false,
        nameFilter: [],
        appliedFilters: [],
        searchDateFrom: null,
        searchDateTo: null,
        lookupImportStatus: [],
        view_shopify_order_id: null,
        /// Carrier
        carrierCodeList: [],
        orderCarrier: [],
        orderCarrierProcess: [],
        orderCarrierSuccess: false,
        orderCarrierError: false,
    }

    constructor(props) {
        super(props);
        this.initialState = this.state;
        this.rows = [];
        this.shopify = ShopifyContext.getShared();
        this.unMounted = false;
        // this.state. = test_unshipped.carrier_code;
    }

    componentDidMount() {
        this.init();
    }

    componentWillUnmount() {
        this.unMounted = true;
    }

    componentWillReceiveProps(nextProps) {
        if (this.selectedConfiguration !== this.getConfigurationSelectedIndex()) {
            this.selectedConfiguration = this.getConfigurationSelectedIndex();
            this.setState(Util.clone(this.initialState), this.init)
        }
    }

    init = () => {
        console.log('%cInit', 'color:green');
        let {searchDateFrom, searchDateTo} = this.state;

        if (searchDateFrom === null) {
            let date_from = new Date();

            searchDateFrom = new Date(date_from.setDate(date_from.getDate() - DEFAULT_SEARCH_PERIOD));
            searchDateTo = new Date();
        }

        if (this.state.orders.length === 0) {

            this.setState({processing: true, searchDateFrom, searchDateTo});
            this.state.buttonClicked = false
            // let date_from = Util.getDateString(new Date(searchDateFrom));
            // let date_to = Util.getDateString(new Date(searchDateTo));
            // console.log(date_from, date_to)
            let params = {configuration: this.shopify.getConfigurationSelected()};
            ApplicationApiCall.get('/application/orders/unshipped', params, this.cbInitData, this.cbInitError);
            // this.cbInitData(test_unshipped);

        } else {
            this.setState({processing: false, searchDateFrom, searchDateTo})
        }

    }
    cbInitData = (json) => {
        if( this.unMounted ) {
            return ;
        }
        console.log(json);

        let index = 0;
        let orders = [];
        let order;
        let carrierCodeList = [];
        let orderCarrier = [];

        if ( json.orders && json.orders.length > 0 ) {
            if( json.carrier_code && json.carrier_code.length > 0 ) {
                carrierCodeList = json.carrier_code;
            }
            let defaultCarrier = carrierCodeList[0] || "";

            for(let i in json.orders) {
                order = json.orders[i];
                if (order.order_status === "Canceled" || order.order_status === "Pending")
                    continue;
                orders.push(order);
                let amazon_order_id = order.amazon_order_id;
                orderCarrier[amazon_order_id] = [];
                for(let i in order.order_lines) {
                    let order_item = order.order_lines[i];
                    let shipped = order_item.quantity_shipped == order_item.quantity_ordered;
                    orderCarrier[amazon_order_id][i] = {check: false, code: shipped? order_item.carrier_code:defaultCarrier, code_error: '', number: shipped? order_item.tracking_number:'', number_error: '', shipped: shipped};
                }

                index++;
            }
        }

        this.setState(preState => ({
            ...preState,
            orders,
            carrierCodeList,
            orderCarrier,
            processing: false,
        }));
    }

    cbInitError = (err) => {
        console.log(err);
        if (err && this.unMounted === false) {
            this.setState({error: err, processing: false})
        }
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
        let {amazon_order_id, name, city, country_code, order_state, purchase_date} = order;
        if (typeof this.state.appliedFilters != "undefined") {
            let arrayFilter = [],
                arrayNameFilter = [],
                arrayCityFilter = [],
                arrayCountryCodeFilter = [],
                arrayOrderStateFilter = [],
                arrayDateCodeFilter = [];

            arrayNameFilter = this.checkFilterOption("nameFilter", name);
            if (arrayNameFilter.length > 0 && !this.isSomeBool(arrayNameFilter)) return false;
            // arrayFilter.push(this.isSomeBool(arrayNameFilter));

            arrayCityFilter = this.checkFilterOption("cityFilter", city);
            if (arrayCityFilter.length > 0 && !this.isSomeBool(arrayCityFilter)) return false;
            // arrayFilter.push(this.isSomeBool(arrayCityFilter));

            arrayCountryCodeFilter = this.checkFilterOption("countryCodeFilter", country_code);
            if (arrayCountryCodeFilter.length > 0 && !this.isSomeBool(arrayCountryCodeFilter)) return false;
            // arrayFilter.push(this.isSomeBool(arrayCountryCodeFilter));

            arrayOrderStateFilter = this.checkFilterOption("orderState", order_state);
            if (arrayOrderStateFilter.length > 0 && !this.isSomeBool(arrayOrderStateFilter)) return false;
            // arrayFilter.push(this.isSomeBool(arrayOrderStateFilter));

            arrayDateCodeFilter = this.checkDateFilterOption("orderDateFilter", purchase_date);
            if (arrayDateCodeFilter.length > 0 && !this.isSomeBool(arrayDateCodeFilter)) return false;
            // arrayFilter.push(this.isSomeBool(arrayDateCodeFilter));
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
        for(let item of order.order_lines) {
            if( (item.sku && item.sku.toLowerCase().indexOf(keyword) !== -1) ||
                (item.title && item.title.toLowerCase().indexOf(keyword) !== -1) )
            {
                return true;
            }
        }

        return false;
    }

    initRows() {
        this.rows = [];
        for (let index in this.state.orders) {
            let order = this.state.orders[index];
            let resultFilter = this.checkFilter(order);
            if (!resultFilter) {
                continue;
            }
            this.rows.push(order);
        }
    }

    handleButtonClick = () => {

        this.setState({
            orders: [],
            error: null,
        }, this.init);
    }

    handleKeywordChange = (keywordFilter) => {
        this.setState({keywordFilter});
    };

    handleSearchClick = () => {
        this.setState({searching: true, page: 1})
    }

    handleFiltersChange = (appliedFilters) => {
        this.setState({appliedFilters});
    };

    handleSearchDateChange = (field) =>
        (date) => {
            console.log(date)
            let {searchDateFrom, searchDateTo} = this.state;
            let dateLimit = new Date(date);

            if (field === "searchDateFrom") {
                searchDateFrom = date;
                dateLimit.setMonth(dateLimit.getMonth() + 1);

                if (dateLimit < searchDateTo) {
                    searchDateTo = dateLimit;
                } else {
                    if (date > searchDateTo) {
                        let newDate = new Date(date);
                        searchDateTo = newDate.setDate(newDate.getDate() + 1);
                    }
                }
            } else {
                searchDateTo = date;
                dateLimit.setMonth(dateLimit.getMonth() - 1);

                if (dateLimit > searchDateFrom) {
                    searchDateFrom = dateLimit;
                } else {
                    if (date < searchDateFrom) {
                        let newDate = new Date(date);
                        searchDateFrom = newDate.setDate(newDate.getDate() - 1);
                    }
                }

            }
            this.setState({searchDateFrom: searchDateFrom, searchDateTo: searchDateTo});
        }

    handleActionClick = (shopify_order_id) => () => {

        console.log('handleActionClick', );

        this.setState({view_shopify_order_id: shopify_order_id});
    }

    handleOrdersBack = () => {
        this.setState({view_shopify_order_id: 0});
    }

    handleOrderDetailChange = (op) => (shopify_order) => {
        console.log('handleOrderChange', op, shopify_order);
        /*

        if (op === 'cancel') {
            this.state.orders[this.state.view_shopify_order_id].order_status = 'Cancelled';
        }

        if (op === 'cancelItems') {
            this.state.orders[this.state.view_shopify_order_id].shopify_order = shopify_order;
        }
        */
    }

    handleShopifyOrder = () => {
        console.log("handleShopifyOrder");
    }

    render() {
        // console.log(this.state);
        var content;

        if (this.state.error) {
            content = this.renderError();
        } else if (this.state.processing && this.state.searching === false) {
            content = this.renderLoading();
        } else if (this.state.orders.length === 0) {
            content = this.renderNoOrders();
        } else {
            content = this.state.view_shopify_order_id ? this.renderOrderDetail() : this.renderOrders();
        }

        return (
            <div style={{width: '100%'}}>
                <div className="order-lookup">
                    {!this.state.view_shopify_order_id ? this.renderImportSearch() : ''}
                </div>
                {content}
            </div>
        )
    }

    renderSuccess(){
        return(
            <div>
                <Banner status="success" title={CsI18n.t('Orders fulfilled successfully')}/>
                <br/>
            </div>
        )
    }

    renderCarrierError() {
        return (
            <Layout.Section>
                <CsErrorMessage
                    errorType={this.state.orderCarrierError.type}
                    errorMessage={this.state.orderCarrierError.message}
                />
            </Layout.Section>
        )
    }

    renderOrderDetail() {
        let order = null;
        for(let i in this.state.orders) {
            if( this.state.orders[i].shopify_order_id == this.state.view_shopify_order_id ) {
                order = this.state.orders[i];
                break;
            }
        }
        if( !order ) {
            console.error('selected order is wrong');
            return '';
        }
        return (
            <OrderEdit
                data={order}
                ordersBack={this.handleOrdersBack}
                onCancel={this.handleOrderDetailChange('cancel')}
                onCancelItems={this.handleOrderDetailChange('cancelItems')}
            />
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

    renderNoOrders() {
        return (
            <Layout.Section>
                <Banner status="warning" title={CsI18n.t("No order to be shipped")}>
                    <TextStyle><CsI18n>No order to be shipped has been found</CsI18n></TextStyle>
                </Banner>
            </Layout.Section>
        )
    }

    renderImportSearch() {
        return '';

        return (
            <Layout.Section>
                <Stack alignment="center" spacing="extraLoose">
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
                    <Stack.Item fill>
                        <CsDatePicker date={Util.getDateString(new Date(this.state.searchDateTo))}
                                      onChange={this.handleSearchDateChange('searchDateTo')}/>
                    </Stack.Item>
                    <Stack.Item>
                        <Button
                            className="Search"
                            disabled={this.state.processing}
                            onClick={this.handleButtonClick}
                        > <CsI18n>Search</CsI18n>
                        </Button>
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

        return (
            <Layout.Section>
                <ResourceList.FilterControl
                    filters={filters}
                    appliedFilters={this.state.appliedFilters}
                    onFiltersChange={this.handleFiltersChange}
                    searchValue={this.state.keywordFilter}
                    onSearchChange={this.handleKeywordChange}
                />
            </Layout.Section>
        );
    }

    renderOrders() {
        let content;

        if (this.state.searching === true) {
            content = this.renderLoading();
        } else {
            content = this.renderTable();
        }
        return (
            <Layout.Section>
                {this.renderFiler()}
                {content}
            </Layout.Section>
        );
    }

    renderTable() {
        const resourceName = {
            singular: 'order',
            plural: 'orders'
        };
        this.initRows();

        const resourceListHeadings = (
            <div className="csResourceList-header_container" >
                <div className="csResourceList-header">
                    <div className="col-6 left">
                        <Heading><CsI18n>From</CsI18n></Heading>
                    </div>
                    <div className="col-2 left">
                        <Heading>&#128197;</Heading>
                    </div>
                    <div className="col-1 right">
                        <Heading>&#35;</Heading>
                    </div>
                    <div className="col-1 right">
                        <Heading>&curren;</Heading>
                    </div>
                    <div className="col-1 right">
                        <Heading><CsI18n>Amount</CsI18n></Heading>
                    </div>
                    <div className="col-1 right">
                        <Heading>&nbsp;</Heading>
                    </div>
                </div>
            </div>
        );

        let list = [];
        this.rows.forEach((order, index) => {
            list.push(this.renderOrder(order, index));
        });
        return (
            <Layout.Section>
                {this.state.orderCarrierSuccess? this.renderSuccess():''}
                {this.state.orderCarrierError? this.renderCarrierError():''}
                <div className={"csResourceList order-fulfillment"}>
                {resourceListHeadings}
                {list}
                </div>
            </Layout.Section>
        );
    }

    handleCarrierValueChange = (field, index, item_index) => (value) => {
        let {orderCarrier} = this.state;
        let amazon_order_id = this.rows[index].amazon_order_id;
        // console.log("handleCarrierValueChange", orderCarrier, amazon_order_id, field, index, item_index);
        orderCarrier[amazon_order_id][item_index][field] = value;
        if( field == 'code' ) {
            orderCarrier[amazon_order_id][item_index].code_error = '';
        }
        if( field == 'number' ) {
            orderCarrier[amazon_order_id][item_index].number_error = '';
        }
        this.setState({orderCarrier});
    }

    getCarrierValue(field, index, item_index) {
        let amazon_order_id = this.rows[index].amazon_order_id;
        let {orderCarrier} = this.state;
        if( !orderCarrier[amazon_order_id] || !orderCarrier[amazon_order_id] || !orderCarrier[amazon_order_id][item_index] || !orderCarrier[amazon_order_id][item_index][field] ) {
            if( field === 'check' )
                return false;
            else
                return "";
        }
        return orderCarrier[amazon_order_id][item_index][field];
    }

    handleCarrierAdd = (value) => {
        let {carrierCodeList} = this.state;
        if( !value ) {
            return;
        }
        carrierCodeList = [value, ...carrierCodeList];
        let configuration = this.shopify.getConfigurationSelected();
        ConfigurationApiCall.post('replace', {section: "fulfillment", configuration}, {carrier: carrierCodeList},
            (json) => {}, (err) => {});
        this.setState({carrierCodeList});
    }

    isValidFulfillment(index) {
        // console.log("isValidFulfillment", index);
        let amazon_order_id = this.rows[index].amazon_order_id;
        let {orderCarrierProcess} = this.state;
        if( orderCarrierProcess[amazon_order_id] ) {
            return false;
        }
        // console.log("step1");
        for( let i in this.rows[index].order_lines ) {
            if( this.getCarrierValue('check', index, i) ) {
                return true;
            }
        }
        // console.log("step2");
        return false;
    }

    isProcessingFulfillment(index) {
        let amazon_order_id = this.rows[index].amazon_order_id;
        let {orderCarrierProcess} = this.state;
        console.log("isProcessingFulfillment", amazon_order_id, orderCarrierProcess);
        if ( orderCarrierProcess[amazon_order_id] && orderCarrierProcess[amazon_order_id] == CARRIER_STATE.PROCESSING ) {
            return true;
        }
        return false;
    }

    handleFulfillmentClick = (index) => () => {
        console.log("handleFulfillmentClick", index);
        let amazon_order_id = this.rows[index].amazon_order_id;
        let shopify_order_id = this.rows[index].shopify_order_id;

        //validate
        let carrier_items = [];
        let bInputCheck = true;
        let {orderCarrier} = this.state;
        for(let i in orderCarrier[amazon_order_id] ) {
            let carrier = orderCarrier[amazon_order_id][i];
            if( !carrier.check ) {
                continue;
            }
            if( !carrier.code ) {
                orderCarrier[amazon_order_id][i].code_error = CsI18n.t("Carrier code is required");
                bInputCheck = false;
            }
            if( !carrier.number) {
                orderCarrier[amazon_order_id][i].number_error = CsI18n.t("Tracking number is required");
                bInputCheck = false;
            }
            carrier_items.push({index: i, order_item_id: this.rows[index].order_lines[i].order_item_id, carrier_code: carrier.code, tracking_number: carrier.number});
        }
        if( !bInputCheck ) {
            this.setState({orderCarrier});
            return;
        }
        let carrier_order = { amazon_order_id, shopify_order_id, carrier_items};
        let params_data = [carrier_order];
        let params = {configuration: this.shopify.getConfigurationSelected()};
        ApplicationApiCall.post('/application/orders/fulfillment', params, params_data, (result) => {this.cbFulfillmentSuccess(result, params_data)}, (err) => { this.cbFulfillmentError(err, params_data); });

        // setTimeout(() => {
        //     this.cbFulfillmentSuccess([], params_data);
        // }, 3000);
        let {orderCarrierProcess} = this.state;
        orderCarrierProcess[amazon_order_id] = CARRIER_STATE.PROCESSING; //processing
        this.setState({orderCarrierProcess});
    }

    cbFulfillmentSuccess = (result, params) => {
        if( this.unMounted ) {
            return ;
        }

        let {orderCarrier, orders, orderCarrierProcess} = this.state;
        for(let i in params) {
            let {amazon_order_id, shopify_order_id, carrier_items} = params[i];
            let order = null;
            for(let oi in orders) {
                if( orders[oi].shopify_order_id == shopify_order_id ) {
                    order = orders[oi];
                    break;
                }
            }
            if( order ) {
                for(let j in carrier_items) {
                    let carrier_item = carrier_items[j];
                    orderCarrier[amazon_order_id][carrier_item.index].shipped = true;
                    orderCarrier[amazon_order_id][carrier_item.index].check = false;
                    order.order_lines[carrier_item.index].quantity_shipped = order.order_lines[carrier_item.index].quantity_ordered;
                }
            }
            orderCarrierProcess[amazon_order_id] = CARRIER_STATE.NONE;
        }

        if( result ) {
            for(let si in result) {
                let shopify_order = result[si];
                for(let i in orders) {
                    if( orders[i].shopify_order_id == shopify_order.id ) {
                        orders[i].shopify_order.order = shopify_order;
                        break;
                    }
                }
            }
        }
        setTimeout(()=>{this.setState({orderCarrierSuccess: false})}, 5000);
        this.setState({orderCarrier, orders, orderCarrierProcess, orderCarrierSuccess: true, orderCarrierError: false});
    }

    cbFulfillmentError = (err, params) => {
        if( this.unMounted ) {
            return ;
        }
        let {orderCarrier, orders, orderCarrierProcess} = this.state;
        for(let i in params) {
            let {amazon_order_id} = params[i];
            orderCarrierProcess[amazon_order_id] = CARRIER_STATE.NONE;
        }

        this.setState({orderCarrierError: err, orderCarrierProcess});

    }

    renderOrder = (order, index) => {
        // console.log('renderOrder', order, index);
        let iso_code = order.country_code.toLowerCase();
        let full_address = order.postal_code + ', ' + order.city.toUpperCase() + ' (' + order.country_code + ')';

        let name = order.name.toLowerCase()
            .split(' ')
            .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
            .join(' ');
        const image_url = this.shopify.static_content + '/amazon/flags/flag_' + iso_code + '_64px.png';
        const order_url = this.shopify.getShopUrl() + '/admin/orders/' + order.shopify_order_id;

        let link = <Tooltip active={false} content={CsI18n.t("Show order")} preferredPosition="above"><a
            href={order_url} target="_blank" onClick={this.handleShopifyOrder}><Icon source={CircleChevronRightMinor} external={true} color="inkLighter"/></a></Tooltip>

        let total_items = 0;
        let order_lines = [];
        if (order.order_lines && order.order_lines.length) {
            order.order_lines.forEach((item, item_index) => {
                total_items += parseInt(item.quantity_ordered);
                let status = CsI18n.t('Unknown');
                let status_banner = "";

                if (item.quantity_ordered === item.quantity_shipped) {
                    status = CsI18n.t('Shipped');
                    status_banner = <Badge status="success">{status}</Badge>
                } else if (item.quantity_shipped == 0) {
                    status = CsI18n.t('Unshipped');
                    status_banner = <Badge status="attention">{status}</Badge>
                } else if (item.quantity_ordered > item.quantity_shipped) {
                    status = CsI18n.t('Partially Shipped');
                    status_banner = <Badge status="info">{status}</Badge>
                }

                let shipped = this.getCarrierValue('shipped', index, item_index);
                order_lines.push(
                    <div className={"csResourceList-item mt-3"} key={order.amazon_order_id + '-' + item.sku}>
                        <div className="col-6 left">
                            <Stack vertical={false} wrap={false}>
                                <Stack.Item>
                                    <Checkbox label={"order item"} labelHidden={true} checked={this.getCarrierValue('check', index, item_index)} onChange={this.handleCarrierValueChange('check', index, item_index)} disabled={shipped}/>
                                </Stack.Item>
                                <Stack.Item fill>
                                    <Stack spacing={"tight"} vertical={true}>
                                        <Stack.Item>
                                    <TextStyle>{item.quantity_ordered} x {item.sku} {status_banner}</TextStyle>
                                        </Stack.Item>
                                        <Stack.Item><TextStyle>{item.title}</TextStyle></Stack.Item>
                                    </Stack>
                                </Stack.Item>
                            </Stack>
                        </div>
                        <div className={"col-3 left"}>{shipped? this.getCarrierValue('code', index, item_index)
                            :
                            <CsAutocomplete
                            isOnlyValue={true}
                            options={this.state.carrierCodeList}
                            selected={this.getCarrierValue('code', index, item_index)}
                            allowedInput={true}
                            allowedAddNew={true}
                            onChange={this.handleCarrierValueChange('code', index, item_index)}
                            onAdd={this.handleCarrierAdd}
                            error={this.getCarrierValue('code_error', index, item_index)}
                            placeholder={CsI18n.t("Carrier")}
                            isAddFirstEmpty={true}
                        />}</div>
                        <div className={"col-3 left"}>{shipped? this.getCarrierValue('number', index, item_index)
                            :
                            <TextField
                                label={"tracking number"}
                                labelHidden={true}
                                placeholder={CsI18n.t("Tracking Number")}
                                value={this.getCarrierValue('number', index, item_index)}
                                onChange={this.handleCarrierValueChange('number', index, item_index)}
                                error={this.getCarrierValue('number_error', index, item_index)}
                            />}
                        </div>
                    </div>
                );
            })
        }
        let isLoading = this.isProcessingFulfillment(index);
        return (
            <div key={order.amazon_order_id} className={"csResourceList-item_container"}>
                <div className="csResourceList-item">
                    <div className="col-6 left">
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
                                            <Stack.Item>
                                                {link}
                                            </Stack.Item>
                                        </Stack>
                                    </Stack.Item>
                                </Stack>
                            </Stack.Item>

                        </Stack>
                    </div>
                    <div className="col-2 left">{order.display_date}</div>
                    <div className="col-1 right">{total_items}</div>
                    <div className="col-1 right">{order.order_total_currency}</div>
                    <div className="col-1 right">{parseFloat(order.order_total_amount).toFixed(2)}</div>
                    <div className="col-1 right"><Button onClick={this.handleActionClick(order.shopify_order_id)}
                                                         size="slim"><CsI18n>View</CsI18n></Button></div>
                </div>
                {order_lines}
                <div className="csResourceList-item">
                    <div className={"col-12 right button-fulfillment"}><Button icon={isLoading? '':MarkFulfilledMinor}
                                                                               disabled={this.isValidFulfillment(index)? false:true}
                                                                               loading={isLoading}
                                                                               onClick={this.handleFulfillmentClick(index)}><CsI18n>Fulfill</CsI18n></Button>
                    </div>
                </div>
            </div>
        );
    };
}

export default FulfillmentTab;
