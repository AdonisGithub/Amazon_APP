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
    Badge,
} from '@shopify/polaris';
import {CircleChevronRightMinor} from "@shopify/polaris-icons";
import ShopifyContext from "../../../context"
import Util from "../../../helpers/Util"
import CsDatePicker from "../../../components/csDatePicker"
import ApplicationApiCall from "../../../functions/application-api-call";
import OrderEdit from "./orderEdit";
import "./orders.css"
import CsErrorMessage from "../../../components/csErrorMessage/csErrorMessage";

//order state
const ORDER_STATE = {
    NONE: 0,
};

const DEFAULT_SEARCH_PERIOD = 1;

const FULFILLMENT_FULFILLED = 'fulfilled';
const FULFILLMENT_PARTIALLY = 'partial';

class ImportedTab extends AmazonTab {

    getName() {
        return "imported";
    }

    state = {
        ...this.state,
        orders: [],
        error: null,
        orderState: ORDER_STATE.NONE,
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
        orderDetail: null,

    }

    constructor(props) {
        super(props);
        this.initialState = this.state;
        this.rows = [];
        this.selectArray = [];

        this.shopify = ShopifyContext.getShared();
        this.unMounted = false;
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
            let date_from = Util.getDateString(new Date(searchDateFrom));
            let date_to = Util.getDateString(new Date(searchDateTo));
            console.log(date_from, date_to)
            // let search = this.state.keywordFilter;
            let params = {configuration: this.shopify.getConfigurationSelected(), date_from, date_to};
            ApplicationApiCall.get('/application/orders/imported', params, this.cbInitData, this.cbInitError);

        } else {
            this.setState({processing: false, searchDateFrom, searchDateTo})
        }

    }
    cbInitData = (json) => {
        console.log(json);

        let index = 0;
        let orders = [];
        let order;
        for(let i in json) {
            order = json[i];
            if (order.order_status === "Canceled" || order.order_status === "Pending")
                continue;
            orders.push(order);
            index++;
        }

        this.setState(preState => ({
            ...preState,
            orders: orders,
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

    initRows = () => {
        this.rows = [];
        var selectArrays = [];

        //var view = false;

        for (var index in this.state.orders) {

            let order = this.state.orders[index];

            if (!order.hasOwnProperty('id_store') || order.id_store === null)
                continue;

            let iso_code = order.country_code.toLowerCase();
            let full_address = order.postal_code + ', ' + order.city.toUpperCase() + ' (' + order.country_code + ')';

            var name = order.name.toLowerCase()
                .split(' ')
                .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
                .join(' ');
            const image_url = this.shopify.static_content + '/amazon/flags/flag_' + iso_code + '_64px.png';
            let link;

            const order_url = this.shopify.getShopUrl() + '/admin/orders/' + order.shopify_order_id;

            link = <Tooltip active={false} content={CsI18n.t("Show order")} preferredPosition="above"><a
                href={order_url} target="_blank" onClick={this.handleShopifyOrder}><Icon source={CircleChevronRightMinor}
                                                                                         external={true}
                                                                                         color="inkLighter"/></a></Tooltip>


            if (order.order_status === "Canceled" || order.order_status === "Pending")
                continue;

            selectArrays.push(index);

            var checkFilterFn = this.checkFilter(order);

            if (checkFilterFn) {

                let disabled = false;

                let total_items = 0;
                let total_items_amount = 0;
                let order_lines = [];
                if (order.hasOwnProperty('order_lines') && order.order_lines.length) {

                    order.order_lines.forEach((item) => {
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
                            <Stack key={order.amazon_order_id + '-' + item.sku} spacing="extraTight">
                                <Stack.Item><TextStyle>{item.quantity_ordered} x {item.sku}</TextStyle></Stack.Item>
                                <Stack.Item fill><TextStyle>{item.title}</TextStyle></Stack.Item>
                                <Stack.Item>{status_banner}</Stack.Item>
                            </Stack>
                        );

                    })
                }
                let shopify_order_name = null;

                if (order.hasOwnProperty('shopify_order') && order.shopify_order.hasOwnProperty('order')) {
                    shopify_order_name = order.shopify_order.order.name;
                }

                this.rows[index] = [

                    <Checkbox disabled={disabled}
                              checked={disabled === false && this.checkArray(this.state.selected, index)}
                              onChange={this.handleCheckChange(index)}/>

                    ,
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
                                            {shopify_order_name ?
                                                <Stack.Item>
                                                    <TextStyle
                                                        variation="code">{order.shopify_order.order.name}</TextStyle>&nbsp;
                                                </Stack.Item>
                                                : ''
                                            }
                                            <Stack.Item>
                                                <TextStyle variation="code">#{order.amazon_order_id}</TextStyle>
                                            </Stack.Item>
                                            <Stack.Item>
                                                {link}
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
                ]

                let amazon_order_status_field = order.order_status === "Shipped" ?
                    <Badge status="success"><CsI18n>Shipped</CsI18n></Badge> :
                    <Badge status="attention"><CsI18n>Unshipped</CsI18n></Badge>;

                let shopify_order_status_field = false;
                let shopify_order = order.shopify_order.order;
                if(shopify_order) {
                    switch (shopify_order.fulfillment_status) {
                        case FULFILLMENT_FULFILLED:
                            shopify_order_status_field = <Badge status="success" progress={"complete"}><CsI18n>Fulfilled</CsI18n></Badge>;
                            break;
                        case FULFILLMENT_PARTIALLY:
                            shopify_order_status_field = <Badge status="warning" progress={"partiallyComplete"}><CsI18n>Partially fulfilled</CsI18n></Badge>;
                            break;
                        default:
                            shopify_order_status_field = <Badge status="attention" progress={"incomplete"}><CsI18n>Unfulfilled</CsI18n></Badge>;
                    }
                }

                let order_status_field = <Stack vertical><Stack.Item>A: {amazon_order_status_field}</Stack.Item>
                    {shopify_order_status_field? <Stack.Item>S: {shopify_order_status_field}</Stack.Item>:''}</Stack>;

                this.rows[index].push(order_status_field);
                this.rows[index].push(<Button onClick={this.handleActionClick(index)}
                                              size="slim"><CsI18n>View</CsI18n></Button>);

            }
            this.selectArray = selectArrays;
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

    handleCheckAllChange = (field) => (value) => {
        this.setState({[field]: value}, () => {
            if (value) {
                this.setState(state => (state.selected = this.selectArray, state));
            } else {
                this.setState(state => (state.selected = [], state));
            }
        });

    };

    checkAllfn = () => {
        if (this.selectArray.sort().toString() == this.state.selected.sort().toString()) {
            this.setState({isAllSelected: true});
        } else {
            this.setState({isAllSelected: false});
        }
    }

    handleCheckChange = (field) => (value) => {
        //this.setState({check[field]: value});
        if (value) {
            this.setState(state => (state.selected = [...state.selected, field], state), this.checkAllfn);

        } else {
            var array = [...this.state.selected]; // make a separate copy of the array
            var index = array.indexOf(field)
            array.splice(index, 1);
            this.setState(state => (state.selected = array, state), this.checkAllfn);
        }

        //this.setState(state => (state.rules[state.currentRuleIndex]["price_rules"] = [...state.rules[state.currentRuleIndex]["price_rules"], {}], state));
    };

    checkArray = (array, key) => {

        return array.indexOf(key) != -1;
    }

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

    handleActionClick = (idx) => () => {

        console.log('handleActionClick', idx, this.state.orders[idx]);

        this.setState({orderDetail: idx});
    }

    handleOrdersBack = () => {
        this.setState({orderDetail: null});
    }

    handleOrderDetailChange = (op) => (shopify_order) => {
        console.log('handleOrderChange', op, shopify_order);

        if (op === 'cancel') {
            this.state.orders[this.state.orderDetail].order_status = 'Cancelled';
        }

        if (op === 'cancelItems') {
            this.state.orders[this.state.orderDetail].shopify_order = shopify_order;
        }

    }

    handleShopifyOrder = () => {
        console.log("handleShopifyOrder");
    }

    render() {

        console.log(this.state);
        var content;

        if (this.state.error) {
            content = this.renderError();
        } else if (this.state.processing && this.state.searching === false) {
            content = this.renderLoading();
        } else if (this.state.orders.length === 0) {
            content = this.renderNoOrders();
        } else {
            content = this.state.orderDetail ? this.renderOrderDetail() : this.renderOrders();
        }

        return (
            <div style={{width: '100%'}}>
                <div className="order-lookup">
                    {!this.state.orderDetail ? this.renderImportSearch() : ''}
                </div>
                {content}
            </div>
        )
    }

    renderOrderDetail() {
        return (
            <OrderEdit
                data={this.state.orders[this.state.orderDetail]}
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
                <Banner status="warning" title={CsI18n.t("No order")}>
                    <TextStyle><CsI18n>No order has been found in this period</CsI18n></TextStyle>
                </Banner>
            </Layout.Section>
        )
    }

    renderImportSearch() {

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
            {
                key: 'orderState',
                label: CsI18n.t('Order State'),
                operatorText: CsI18n.t('is'),
                type: FilterType.Select,
                options: [CsI18n.t('Shipped'), CsI18n.t('Unshipped')],
            }
        ];

        const action = {
            content: CsI18n.t("Search"),
            onAction: this.handleSearchClick,
            loading: this.state.searching === true
        }

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
            content = this.renderImportedTable();
        }
        return (
            <Layout.Section>
                {this.renderFiler()}
                {content}
            </Layout.Section>
        );
    }

    renderImportedTable() {
        let headings = [
            <Heading>
                <Checkbox
                    checked={this.state.isAllSelected}
                    onChange={this.handleCheckAllChange('isAllSelected')}
                />
            </Heading>
            ,
            <Heading><CsI18n>From</CsI18n></Heading>,
            <Heading>&#128197;</Heading>,
            <Heading>&#35;</Heading>,
            <Heading>&curren;</Heading>,
            <Heading><CsI18n>Amount</CsI18n></Heading>,
            <Heading><CsI18n>Status</CsI18n></Heading>,
            <Heading></Heading>
        ];

        this.initRows();

        return (
            <Layout.Section>
                <div className="order-table">
                    <DataTable
                        columnContentTypes={['text', 'text', 'text', 'numeric', 'text', 'numeric', 'numeric']}
                        headings={headings}
                        rows={this.rows}
                    />
                </div>
            </Layout.Section>
        );
    }
}

export default ImportedTab;
