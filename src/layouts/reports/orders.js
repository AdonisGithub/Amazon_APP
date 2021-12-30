import React from 'react'
import CsI18n from "./../../components/csI18n"


import {
  Heading,
  Icon,
  Page,
  Pagination,
  Select,
  Stack,
  ResourceList,
  Spinner, Layout, DataTable, TextStyle, Button, FilterType, Tooltip, Avatar, Banner, Checkbox, Badge,
} from '@shopify/polaris';

import {
  CircleChevronRightMinor,
} from '@shopify/polaris-icons';

import CsDatePicker from "../../components/csDatePicker";
import ApplicationApiCall from "../../functions/application-api-call";
import Util from "../../helpers/Util";
import shopifyContext from "../../context";
import "./reports.scss"
import AmazonTab from "../../helpers/amazon-tab";
import OrderDetail from "./orderDetail";
import {array} from "prop-types";
import CsMultiSelect from '../../components/csMultiSelect';
import CsErrorMessage from "../../components/csErrorMessage";
import MarketplaceTab from "../../helpers/marketplace-tab";

import {ErrorType} from "../../components/csErrorMessage/csErrorMessage";
import Constants from "../../helpers/rules/constants";

// import order_report from "../../testData/order_report";

const FIELD_DATE_FROM = 1;
const FIELD_DATE_UP = 2;

const TAG_SUMMARY = 1;
const TAG_TAXDETAIL = 2;

const TAB_SUMMARY = 1;
const TAB_ORDER = 2;

const YEAR_BUTTON = 1;
const YEAR_1_BUTTON = 2;
const MONTH_1_BUTTON = 3;
const MONTH_BUTTON = 4;

const PREV_BTN = 1;
const NEXT_BTN = 2;

const DEFAULT_PAGE_COUNT = 20;
const SELECT_PAGE_OPTIONS = [
  {label: 10, value: 10},
  {label: 20, value: 20},
  {label: 50, value: 50},
  {label: 100, value: 100}
];
const Filter = {date: "0", name: "1", status: "2", amazon_order_id: "3", shopify_order_id: "4" , channel: '5', sku: "6", city: "7"};
const DEFAULT_DOWNLOAD_FORMAT = "xls";
const TYPE_OPTIONS = [
  {label: "Excel", value: "xls"},
  {label: "CSV", value: "csv"},
]

const FULFILLMENT_FULFILLED = 'fulfilled';
const FULFILLMENT_PARTIALLY = 'partial';

const columnOptions = [
  {label: <span>&#128197;</span>, value: 'purchase_date', checked: true},
  {label: <span>&#35;</span>, value: 'count', checked: true},
  {label: <span>&curren;</span>, value: 'order_total_currency', checked: true},
  {label: CsI18n.t('Amount'), value: 'order_total_amount', checked: true},
  {label: CsI18n.t('Status'), value: 'status', checked: true},
];

class OrderTab extends AmazonTab {

  default = {
    page : 1,
    pages : 0,
    error : false,
    taxDetail : null,
    summaryData : [],
    ordersData : {
      orders : [],
      shipping : [],
      items : [],
    }
  };

  state = {
    ...this.state,
    ...this.default,
    processing: false,
    downloadError: null,
    downloadSuccess: false,
    searchDate: {
      from: null,
      to: null,
    },
    searchOption: {
      show_pending: false,
    },
    appliedFilters: [],
    searchValue: '',
    page_item_count: DEFAULT_PAGE_COUNT,
    selected_tab: TAB_SUMMARY,
    format: DEFAULT_DOWNLOAD_FORMAT,
    searchBtnClicked: false,
    columnOptions: columnOptions,
    selectedMarketplaceTab: 0,
  };

  constructor(props) {
    super(props);
    this.initialState = Util.clone(this.state);
    this.dataRows = [];
    this.shopify = shopifyContext.getShared();
    this.unMounted = false;
    this.selectedConfiguration = this.getConfigurationSelectedIndex();
    this.marketplaceList = [];
    this.total = {
      amount: 0,
      tax: 0,
      currency: '',
    };
  }

  componentDidMount() {
    this.search();
  }

  componentWillUnmount() {
    this.unMounted = true;
  }

  componentWillMount() {
    console.log("[componentWillUnmount]");
  }

  componentWillReceiveProps(nextProps) {
    super.componentWillReceiveProps(nextProps);

    if(this.selectedConfiguration !== this.getConfigurationSelectedIndex()){
      this.selectedConfiguration = this.getConfigurationSelectedIndex();

      this.setState({
        ...Util.clone(this.initialState),
    }, this.search);
    }
  }

  getMarketplaceList(){
    this.fetchMarketplaceList(this.cbMarketplacesSuccess, this.cbMarketplaceError);
  }

  cbMarketplacesSuccess = (json) =>{
    if(json && this.unMounted === false){
      this.marketplaceList = this.getActiveMarketplaceList(json);
      if( this.marketplaceList.length > 0 ) {
        this.setState({processing: false});
      } else {
        this.cbMarketplaceError({type: ErrorType.INVALID_PARAM, message: Constants.must_be_selected_marketplace});
      }

    }
  }

  cbMarketplaceError = (err) => {
    console.log(err)

    if(err && this.unMounted === false){
      // setTimeout(( ) => {
      //   this.setState({error: null})
      // }, 5000)
      this.setState({error: err, processing: false})
    }
  }

  search() {
    let {searchDate, searchOption} = this.state;
    let items = this.getCurPageItems(this.state.ordersData.orders, this.state.page, this.state.page_item_count);

    if(this.state.pages === 0 || items.length === 0 && this.state.page <= this.state.pages){
      //this.setState({processing: true});
      if (searchDate.from === null) {
        let date_from = new Date();
        searchDate.from = new Date(date_from.setDate(1));
        searchDate.to = new Date();
      }

      this.setState({searchDate, processing: true});

      let date_from = Util.getDateString(new Date(searchDate.from));
      let date_to = Util.getDateString(new Date(searchDate.to));
      let limit_from = (this.state.page - 1) * this.state.page_item_count;
      let limit_to = this.state.ordersData.orders.length + this.state.page_item_count;
      let search = this.state.searchValue;
      let configuration = this.shopify.getConfigurationSelected();
      let show_pending = searchOption.show_pending? 1:0;
      let params = {configuration, date_from, date_to, limit_from, limit_to, search, show_pending};
      ApplicationApiCall.get('/application/reports/orders', params, this.cbSearchData, this.cbSearchError);
    }else{
      this.setState({processing: false});
    }
  }

  cbSearchData = (json) => {
    console.log("cbSearchData", this.state.ordersData.orders);
    if (this.unMounted) {
      return;
    }

    if (json) {
      let ordersData = {};
      //json = order_report.data;
      let pages = json.pages ? json.pages : [];
      let summaryData = json.summary ? json.summary : [];
      ordersData.orders = this.state.ordersData.orders.concat(json.orders);
      ordersData.items = this.state.ordersData.items.concat(json.items);
      ordersData.shipping = this.state.ordersData.shipping.concat(json.shipping);

      this.setState(preState => ({
        ...preState,
        pages,
        summaryData,
        ordersData,
        processing: false
      }))
    }
  }

  cbSearchError = (err) => {
    console.log("cbSearchError", err);

    if(err && this.unMounted === false){
      this.setState({error: err, processing: false});
    }
  }

  /**
   *
   * @param a array
   * @param p page number
   * @param c element count
   * @returns {array}
   */

  getCurPageItems(a, p, c){
    return a.slice((p - 1) * c, a.length >= p * c ? p * c : a.length);
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

  checkFilter = (item) => {
    if (this.state.selected_tab === TAB_SUMMARY) {
        let array = [];
        array = this.checkFilterOptions(item);

        return (/*(item.from_state.toLowerCase().indexOf(this.state.searchValue.toLowerCase()) !== -1) ||
          (item.to_state.toLowerCase().indexOf(this.state.searchValue.toLowerCase()) !== -1) ||*/
          (item.sales_channel.toLowerCase().indexOf(this.state.searchValue.toLowerCase()) !== -1)) && this.isEveryBool(array);
    } else {
        let array = [];
        array = this.checkFilterOptions(item);

        /*return ((item.name.toLowerCase().indexOf(this.state.searchValue.toLowerCase()) !== -1) ||
          (item.amazon_order_id.toLowerCase().indexOf(this.state.searchValue.toLowerCase()) !== -1) ||
          (item.city.toLowerCase().indexOf(this.state.searchValue.toLowerCase()) !== -1) ||
          (item.postal_code.toLowerCase().indexOf(this.state.searchValue.toLowerCase()) !== -1) ||
          (item.sales_channel.toLowerCase().indexOf(this.state.searchValue.toLowerCase()) !== -1)) && this.isEveryBool(array);*/
        return this.isEveryBool(array);
    }
  }

  checkFilterOptions = (item) => {

    let array = [];
    this.state.appliedFilters.forEach((filter) => {
      if (filter.key === Filter.date) {
        let order_date = Util.getDateString(new Date(item.purchase_date));

        if (filter.value && order_date && order_date === filter.value) {
          array.push(true);
        } else {
          array.push(false);
        }
      } else if (filter.key === Filter.name) {
        if (filter.value && item.name && item.name.toLowerCase().indexOf(filter.value.toLowerCase()) !== -1) {
          array.push(true);
        } else {
          array.push(false);
        }
      } else if (filter.key === Filter.status) {
        if (filter.value && item.order_status && item.order_status.toLowerCase() === filter.value.toLowerCase()) {
          array.push(true);
        } else {
          array.push(false);
        }
      } else if (filter.key === Filter.amazon_order_id) {
        if (filter.value && item.amazon_order_id && item.amazon_order_id.toLowerCase().indexOf(filter.value.toLowerCase()) !== -1) {
          array.push(true);
        } else {
          array.push(false);
        }
      } else if (filter.key === Filter.city) {
        if (filter.value && item.city && item.city.toLowerCase().indexOf(filter.value.toLowerCase()) !== -1) {
          array.push(true);
        } else {
          array.push(false);
        }
      } else if (filter.key === Filter.sku) {
        let items = this.state.ordersData.items.filter(item1 => {
          return item1.amazon_order_id === item.amazon_order_id;
        });

        let result = items.map(item1 => {
            return item1.sku.toLowerCase().indexOf(filter.value.toLowerCase()) !== -1;
        });
        console.log(item.amazon_order_id, items, result);
        if (filter.value && this.isSomeBool(result)) {
          array.push(true);
        } else {
          array.push(false);
        }
      }else if (filter.key === Filter.channel) {
        if (filter.value && item.channel && item.sales_channel.toLowerCase().indexOf(filter.value.toLowerCase()) !== -1) {
          array.push(true);
        } else {
          array.push(false);
        }
      }
    })
    return array;
  }

  handleSearchDateChange = (field) =>
    (date) => {
      console.log(date);
      let {searchDate} = this.state;
      if (field == FIELD_DATE_FROM) {
        searchDate.from = date;
        if (date > searchDate.to) {
          let newDate = new Date(date);
          searchDate.to = newDate.setDate(newDate.getDate() + 7);
        }
      } else {
        searchDate.to = date;
        if (date < this.state.searchDate.from) {
          let newDate = new Date(date);
          searchDate.from = newDate.setDate(newDate.getDate() - 7);
        }
      }
      this.setState({
        searchDate: searchDate
      })
    }

  handleSearchOption = (field) => (value) => {
    let {searchOption} = this.state;
    searchOption[field] = value;
    this.setState(preState => ({
      ...preState,
      ...this.default,
      searchOption,
      searchBtnClicked: true,
    }), this.search);
  }

  handleSearchButtonClick = () => {
    this.setState(preState => ({
      ...preState,
      ...this.default,
      searchBtnClicked: true,
    }), this.search);
  }

  handleSearchChange = (value) => {
    this.setState({searchValue: value});
  }

  handleFiltersChange = (appliedFilters) => {
    this.setState({appliedFilters: appliedFilters});
  }

  handleDateButtonClick = (button) => () => {
    let searchDate = Util.getSearchPeriod(button, new Date());
    let searchBtnClicked = true;
    this.setState(preState => ({
      ...preState,
      ...this.default,
      searchDate,
      searchBtnClicked,
    }), this.search);
  }

  handleTaxDetail = (tag, amazon_order_id) => () => {
    if (tag === TAG_TAXDETAIL && amazon_order_id) {
      this.setState({taxDetail: amazon_order_id});
    } else if (tag === TAG_SUMMARY) {
      this.setState({taxDetail: null});
    }
  }

  handlePaginationBtnClick = (btn) => () => {
    let {page, processing, paginationBtnClicked} = this.state;
    processing = true;
    paginationBtnClicked = true;
    if (btn === PREV_BTN) {
      page --;
    } else {
      page ++;
    }
    this.setState({
      page: page,
      processing,
      paginationBtnClicked,

    }, this.search);
  }

  handlePageItemCountChange = (value) => {
    console.log(this.initialState)
    this.setState(preState => ({
      ...preState,
      ...this.default,
      page_item_count: parseInt(value),
    }), this.search)
  }

  handleTabSelect = (tab) => () => {
    if (this.state.selected_tab !== tab) {
      this.setState({
        selected_tab: tab,
        appliedFilters: [],
        searchValue: '',
        processing: true,
      }, this.getMarketplaceList)
    }
  }

  handleDownloadTypeChange = (value) => {
    this.setState({format: value});
  }

  handleDownloadBtnClick = () => {
    this.setState({downloading: true});// this.setProcessing(true);
    let date_from = Util.getDateString(new Date(this.state.searchDate.from));
    let date_to = Util.getDateString(new Date(this.state.searchDate.to));

    let configuration = this.shopify.getConfigurationSelected();
    let format = this.state.format;
    let report = "order_tax";
    let params = {configuration, date_from, date_to, format, report};
    let fileName = CsI18n.t("OrdersReport") + "_" + date_from + "-" + date_to + "." + this.state.format;

    ApplicationApiCall.download('/application/reports/orders', params, fileName, this.downloadSuccess, this.downloadFail);
  }

  downloadSuccess = () => {
    console.log('[DownloadSuccess]');
    this.setState({downloadSuccess: true, downloading: false})
    setTimeout(() => {
      this.setState({downloadSuccess: false});
    }, 5000)
  }

  downloadFail = (err) => {
    console.log(err);

    // setTimeout(() => {
    //   this.setState({downloadError: null})
    // }, 5000)
    this.setState({downloadError: err, downloading: false});
  }

  handleColumnSelect = (columnOptions) =>{
    this.setState({columnOptions: columnOptions});
  }

  handleMarketplaceTabChange = (selected) => {
    this.setState({
     selectedMarketplaceTab: selected,
    });
  }

  initRows() {

    this.dataRows = [];
    this.total.amount = 0;
    this.total.tax = 0;
    let orders;

    if(this.state.selected_tab === TAB_SUMMARY){
      orders = this.state.summaryData;
    }else{
      orders = this.getCurPageItems(this.state.ordersData.orders, this.state.page, this.state.page_item_count);
      orders = orders.filter((order) => {
        return order.marketplace_id === this.marketplaceList[this.state.selectedMarketplaceTab].MarketplaceId;
      })
    }

    for(let index in orders){
      let order = orders[index];

      if(!this.checkFilter(order)){
        continue;
      }

      if (this.state.selected_tab === TAB_SUMMARY) {
        let {from_country_code, from_country, to_country_code, to_country, store_order_total, store_order_tax, sales_channel, store_currency_symbol, combined_tax_rate} = order;
        this.total.amount += Util.isNumber(store_order_total)? parseFloat(store_order_total):0;
        this.total.tax += Util.isNumber(store_order_tax)? parseFloat(store_order_tax):0;
        this.total.currency = store_currency_symbol? store_currency_symbol:"";

        const from_country_image = from_country_code? (this.shopify.static_content + '/amazon/flags/flag_' + from_country_code.toLowerCase() + '_64px.png'):'';
        const to_country_image = to_country_code? (this.shopify.static_content + '/amazon/flags/flag_' + to_country_code.toLowerCase() + '_64px.png'):'';
        const text_combined_tax_rate = Util.isNumber(combined_tax_rate)? (parseInt(combined_tax_rate * 100) + "%"):'';
        const text_order_total = Util.isNumber(store_order_total)? (store_currency_symbol + " " + parseFloat(store_order_total).toFixed(2)):'';
        const text_order_tax = Util.isNumber(store_order_tax)? (store_currency_symbol + " " + parseFloat(store_order_tax).toFixed(2)):'';

        this.dataRows[index] = [
          <Stack spacing="tight" alignment="center" wrap={false}>
            <Stack.Item>{from_country_image? <Avatar source={from_country_image} size="small"/>:''}</Stack.Item>is
            <Stack.Item>{from_country? from_country:""}</Stack.Item>
          </Stack>,
          <Stack spacing="tight" alignment="center" wrap={false}>
            <Stack.Item>{to_country_image? <Avatar source={to_country_image} size="small"/>:''}</Stack.Item>
            <Stack.Item>{to_country? to_country:""}</Stack.Item>
          </Stack>,
          sales_channel,
          text_combined_tax_rate,
          text_order_total,
          text_order_tax,
        ]
      } else {
        // if(!order.country_code ||  !order.amazon_order_id || !order.purchase_date || !order.order_status){
        //   continue;
        // }
        let {country_code, city, postal_code, amazon_order_id, name, purchase_date, order_status, shopify_order, is_premium_order, is_business_order, is_prime, fulfillment_channel} = order;

        let link = amazon_order_id? (<Tooltip content={CsI18n.t("Show Detail")} preferredPosition="above">
                      <a onClick={this.handleTaxDetail(TAG_TAXDETAIL, amazon_order_id)}>
                        <Icon source={CircleChevronRightMinor} color="inkLighter"/></a></Tooltip>):'';

        let full_address = '' + (postal_code? (postal_code + ', '):'') + (city? city.toUpperCase():'') + (country_code? (' (' + order.country_code + ')'):'');
        const image_url = country_code? (this.shopify.static_content + '/amazon/flags/flag_' + country_code.toLowerCase() + '_64px.png'):'';

        let total_items = 0;
        let order_lines = [];
        if (this.state.ordersData.items.length) {
          this.state.ordersData.items.forEach((item, index) => {
            if(item.amazon_order_id === amazon_order_id) {
              let item_count = Util.isNumber(item.quantity)? parseInt(item.quantity):0;
              total_items += item_count ;
              let status_banner = "";

              if (item.quantity == item.quantity_shipped) {
                status_banner = <Badge status="success">{CsI18n.t('Shipped')}</Badge>
              } else if (item.quantity_shipped == 0) {
                status_banner = <Badge status="attention">{CsI18n.t('Unshipped')}</Badge>
              } else if (item.quantity > item.quantity_shipped) {
                status_banner = <Badge status="info">{CsI18n.t('Partially Shipped')}</Badge>
              }
              order_lines.push(
                <Stack key={amazon_order_id + '-' + index} wrap={false} spacing="Tight">
                  <Stack.Item><TextStyle>{item_count + (item.sku? (' x ' + item.sku) : '')}</TextStyle></Stack.Item>
                  <Stack.Item>{status_banner}</Stack.Item>
                </Stack>
              );
            }
          })
        }
        let marks = [];
        if(fulfillment_channel == 'AFN') {
          marks.push(<Badge status={"info"} key={amazon_order_id + "fba"}><CsI18n>FBA</CsI18n></Badge>);
        }
        if(is_business_order == 1) {
          marks.push(<Badge status={"info"} key={amazon_order_id + "business"}><CsI18n>Business</CsI18n></Badge>);
        }
        if(is_premium_order == 1) {
          marks.push(<Badge status={"info"} key={amazon_order_id + "premium"}><CsI18n>Premium</CsI18n></Badge>);
        }
        if(is_prime == 1) {
          marks.push(<Badge status={"info"} key={amazon_order_id + "prime"}><CsI18n>Prime</CsI18n></Badge>);
        }

        let shopify_order_name = null;

        if (order.hasOwnProperty('shopify_order')) {
          shopify_order_name = order.shopify_order.name;
        }
        let from = <div className="order-from">
          <Stack wrap={false}>
            <Stack.Item>
              {image_url? (<Avatar source={image_url} size="small"/>):''}
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
                              variation="code">{shopify_order_name}</TextStyle>&nbsp;
                        </Stack.Item>
                        : ''
                    }
                    <Stack.Item>
                      {amazon_order_id? (<TextStyle variation="code">#{amazon_order_id}</TextStyle>):''}
                    </Stack.Item>
                    <Stack.Item>
                      {link}
                    </Stack.Item>
                  </Stack>
                </Stack.Item>
                {marks.length > 0? <Stack.Item><Stack spacing={"extraTight"}>{marks}</Stack></Stack.Item>:null}
                <Stack.Item fill>
                  {order_lines}
                </Stack.Item>
              </Stack>
            </Stack.Item>
          </Stack>
        </div>;

        this.dataRows[index] = [from];

        let amazon_order_status_field = OrderDetail.renderOrderStatus(order.order_status);

        let shopify_order_status_field = false;
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

        for(let index1 in this.state.columnOptions) {
          let option = this.state.columnOptions[index1];

          if (option.checked) {
            if (option.value === 'status') {
              this.dataRows[index].push(order_status_field);
            }else if (option.value === 'order_total_amount') {
              this.dataRows[index].push(parseFloat(order[option.value]).toFixed(2));
            }else if (option.value === 'count') {
              this.dataRows[index].push(total_items);
            } else {
              this.dataRows[index].push(order[option.value]);
            }
          }
        }
      }
    }
  }

  render() {

    console.log(this.state)
    let content = "";

    if(this.state.processing === true && !this.state.searchBtnClicked && !this.state.paginationBtnClicked && this.state.selected_tab === TAB_ORDER){
      content = this.renderLoading();
    }else{
      content = this.renderTab();
    }
    return (
      <div className="reports">
        <Page fullWidth>
          <Layout>
            <Layout.Section>
              <Stack wrap={false}>
                <Stack.Item>
                  <div className="side-bar">
                    <Stack vertical>
                      <Stack.Item><a className={this.state.selected_tab === TAB_SUMMARY ? "selected" : ""}
                                     onClick={this.handleTabSelect(TAB_SUMMARY)}><CsI18n>Summary</CsI18n></a></Stack.Item>
                      <Stack.Item><a className={this.state.selected_tab === TAB_ORDER ? "selected" : ""}
                                     onClick={this.handleTabSelect(TAB_ORDER)}><CsI18n>Details</CsI18n></a></Stack.Item>
                    </Stack>
                  </div>
                </Stack.Item>
                <Stack.Item fill>
                  {content}
                </Stack.Item>
              </Stack>
            </Layout.Section>
          </Layout>
        </Page>
      </div>
    );
  }

  renderTab(){

    let content;
    if (this.state.error) {
      content = this.renderError();
    } else if (this.state.processing === true) {
      content = this.renderLoading();
    } else if (this.state.ordersData.orders.length === 0) {
      content = this.renderEmpty();
    } else if (this.state.taxDetail) {
      content = this.renderOrderDetail()
    } else {
      content = this.renderDataList();
    }

    return(
      <Stack vertical>
        <Stack.Item>
          {this.renderMarketplace()}
        </Stack.Item>
        <Stack.Item>
          <Layout>
            {this.state.taxDetail ? '' : this.renderLookupSearch()}
            {this.state.downloadSuccess ? this.renderDownloadSuccess() : ''}
            {this.state.downloadError ? this.renderError() : ''}
            {content}
          </Layout>
        </Stack.Item>
      </Stack>
    )
  }

  renderMarketplace(){

    let {selectedMarketplaceTab} = this.state;

    if(this.state.selected_tab === TAB_SUMMARY || !this.marketplaceList || !this.marketplaceList.length || this.state.taxDetail){
      return '';
    }else{
      return(
        <Stack.Item>
          <MarketplaceTab marketplaceList={this.marketplaceList} selectedMarketplaceTab={selectedMarketplaceTab} onChange={this.handleMarketplaceTabChange}/>
        </Stack.Item>
      )
    }
  }

  renderDownloadSuccess(){
    return(
      <Layout.Section>
        <Banner status="success" title={CsI18n.t("Report has been downloaded successfully")}/>
      </Layout.Section>
    )
  }

  renderError(){

    let errorType;
    let errorTitle;
    let errorMessage;

    if(this.state.downloadError){
      errorType = this.state.downloadError.type;
      errorTitle = CsI18n.t("Failed to download file");
    } else if (this.state.error){
      errorType = this.state.error.type;
      errorMessage = this.state.error.message;
    }

    return(
      <Layout.Section>
        <CsErrorMessage
          errorType={errorType}
          errorTitle={errorTitle}
          errorMessage={errorMessage}
        />
      </Layout.Section>
    )
  }
  renderLoading() {
    return (
      <Layout.Section>
        <div className="loading">
          <br/>
          <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
        </div>
      </Layout.Section>
    )
  }

  renderEmpty() {
    return (
      <Layout.Section>
        <Banner status="warning" title={CsI18n.t("No order")}>
          <TextStyle><CsI18n>No order available for this period</CsI18n></TextStyle>
        </Banner>
      </Layout.Section>
    )
  }

  renderDownloadFooter() {
    let type_options = TYPE_OPTIONS;
    return (
      <Layout.Section>
        <div className="download-footer">
          <Stack alignment="center" spacing="extraLoose">
            <Stack.Item>
              <TextStyle variation="strong"><CsI18n>Date Range</CsI18n></TextStyle>
            </Stack.Item>
            <Stack.Item>
              <Stack spacing="tight" alignment="center">
                <Stack.Item>
                  <TextStyle>{Util.getDateString(new Date(this.state.searchDate.from))}</TextStyle>
                </Stack.Item>
                <Stack.Item>
                  <TextStyle>~</TextStyle>
                </Stack.Item>
                <Stack.Item>
                  <TextStyle>{Util.getDateString(new Date(this.state.searchDate.to))}</TextStyle>
                </Stack.Item>
              </Stack>
            </Stack.Item>
            <Stack.Item>
              <div className="format">
                <Stack spacing="loose" alignment="center">
                  <Stack.Item><TextStyle variation="strong"><CsI18n>Format</CsI18n></TextStyle></Stack.Item>
                  <Stack.Item>
                    <Select value={this.state.format}
                            options={type_options}
                            onChange={this.handleDownloadTypeChange}
                    />
                  </Stack.Item>
                </Stack>
              </div>
            </Stack.Item>
            <Stack.Item><Button loading={this.state.downloading} onClick={this.handleDownloadBtnClick}><CsI18n>Download</CsI18n></Button></Stack.Item>
          </Stack>
        </div>
      </Layout.Section>
    )
  }

  renderOrderDetail() {

    return (
      <OrderDetail
        data={this.state.ordersData}
        amazonOrderId={this.state.taxDetail}
        back={this.handleTaxDetail(TAG_SUMMARY)}
      />
    )
  }

  renderDataList() {
    let dataList = this.state.selected_tab === TAB_SUMMARY ? this.renderSummaryTable() : this.renderOrderTable();
    return (
      <Layout.Section>
        <div className="table">
          {dataList}
          {this.state.selected_tab !== TAB_SUMMARY ? this.renderSummaryTableFooter() : ""}
          {this.state.processing !== true && this.state.ordersData.orders.length !== 0 ? this.renderDownloadFooter() : ''}
        </div>
      </Layout.Section>
    )
  }

  renderLookupSearch() {

    return (
      <Layout.Section>
        <div className="lookup mb-3">
          <Stack spacing="extraLoose" alignment={"center"}>
            <Stack.Item>
              <Stack alignment="center" spacing={"tight"}>
                <Stack.Item><Button onClick={this.handleDateButtonClick(YEAR_BUTTON)} disabled={this.state.processing}><CsI18n>Year</CsI18n></Button></Stack.Item>
                <Stack.Item><Button onClick={this.handleDateButtonClick(YEAR_1_BUTTON)} disabled={this.state.processing}><CsI18n>Year</CsI18n>-1</Button></Stack.Item>
                <Stack.Item><Button onClick={this.handleDateButtonClick(MONTH_1_BUTTON)} disabled={this.state.processing}><CsI18n>Month</CsI18n>-1</Button></Stack.Item>
                <Stack.Item><Button onClick={this.handleDateButtonClick(MONTH_BUTTON)} disabled={this.state.processing}><CsI18n>Month</CsI18n></Button></Stack.Item>
              </Stack>
            </Stack.Item>
            <Stack.Item>
              <Stack alignment="center" spacing={"tight"}>
                <Stack.Item>
                  <TextStyle variation="strong"><CsI18n>From</CsI18n></TextStyle>
                </Stack.Item>
                <Stack.Item>
                  <CsDatePicker date={Util.getDateString(new Date(this.state.searchDate.from))}
                                onChange={this.handleSearchDateChange(FIELD_DATE_FROM)}
                  />
                </Stack.Item>
                <Stack.Item>
                  <TextStyle variation="strong"><CsI18n>To</CsI18n></TextStyle>
                </Stack.Item>
                <Stack.Item>
                  <CsDatePicker date={Util.getDateString(new Date(this.state.searchDate.to))}
                                onChange={this.handleSearchDateChange(FIELD_DATE_UP)}
                  />
                </Stack.Item>
              </Stack>
            </Stack.Item>
            <Stack.Item fill>
              <Checkbox label={CsI18n.t('Show pending or canceled orders')} checked={this.state.searchOption.show_pending} disabled={this.state.processing} onChange={this.handleSearchOption('show_pending')} />
            </Stack.Item>
          </Stack>
        </div>
        {this.renderFilter()}
      </Layout.Section>
    );
  }

  renderFilter() {
    const orderfilters = [
      {
        key: Filter.date,
        label: CsI18n.t('Date'),
        operatorText: CsI18n.t('is'),
        type: FilterType.TextField,
        textFieldType: 'date',
      },
      {
        key: Filter.name,
        label: CsI18n.t('Name'),
        operatorText: CsI18n.t('Contains'),
        type: FilterType.TextField,
      }, {
        key: Filter.status,
        label: CsI18n.t('Status'),
        operatorText: CsI18n.t('is'),
        type: FilterType.Select,
        options: ['Shipped', 'Unshipped']
      }, {
        key: Filter.sku,
        label: CsI18n.t('SKU'),
        operatorText: CsI18n.t('Contains'),
        type: FilterType.TextField,
      }, {
        key: Filter.city,
        label: CsI18n.t('City'),
        operatorText: CsI18n.t('Contains'),
        type: FilterType.TextField,
      }, {
        key: Filter.amazon_order_id,
        label: CsI18n.t('Amazon Order Id'),
        operatorText: CsI18n.t('Contains'),
        type: FilterType.TextField,
      }, /*{
        key: Filter.shopify_order_id,
        label: CsI18n.t('Shopify Order Id'),
        operatorText: CsI18n.t('contains'),
        type: FilterType.Select,
      },*/
    ];

    const summaryFilters = [
      {
        key: Filter.channel,
        label: CsI18n.t('Channel'),
        operatorText: CsI18n.t('Contains'),
        type: FilterType.TextField,
      }
    ];
    let filters = this.state.selected_tab === TAB_SUMMARY ? summaryFilters : orderfilters
    return (
        <Stack>
          <Stack.Item fill>
            <ResourceList.FilterControl
                filters={filters}
                appliedFilters={this.state.appliedFilters}
                onFiltersChange={this.handleFiltersChange}
                searchValue={this.state.searchValue}
                onSearchChange={this.handleSearchChange}
                additionalAction={{
                  content: CsI18n.t('Search'),
                  loading: this.state.processing,
                  disabled: this.state.processing,
                  onAction: this.handleSearchButtonClick,
                }}
            />
          </Stack.Item>
          {this.state.selected_tab === TAB_ORDER ?
          <Stack.Item>
            <CsMultiSelect options={this.state.columnOptions} onSelect={this.handleColumnSelect}/>
          </Stack.Item>
              : ''}
        </Stack>


    );
  }

  renderSummaryTableFooter() {

    return (
      <div className="pagination">
        <Stack wrap={false}>
          <Stack.Item>
            <TextStyle><CsI18n>Showing</CsI18n></TextStyle>
            <div className="pagination-select">
              <Select
                options={SELECT_PAGE_OPTIONS}
                value={this.state.page_item_count}
                onChange={this.handlePageItemCountChange}
              ></Select>
            </div>
            <TextStyle><CsI18n>Items</CsI18n></TextStyle>
          </Stack.Item>
          <Stack.Item>

            <Pagination
              hasPrevious={this.state.page && this.state.page > 1}
              onPrevious={this.handlePaginationBtnClick(PREV_BTN)}
              hasNext={this.state.page && this.state.pages && this.state.page < this.state.pages}
              onNext={this.handlePaginationBtnClick(NEXT_BTN)}
            />

          </Stack.Item>
        </Stack>
      </div>
    )
  }

  renderSummaryTable() {
    console.log("renderSummaryTable");
    this.initRows();
    console.log(this.total);
    let total_amount = this.total.currency + ' ' + this.total.amount.toFixed(2);
    let total_tax = this.total.currency + ' ' + this.total.tax.toFixed(2);

    return (
      <div className="total">
        <DataTable
          columnContentTypes={[
            'text',
            'text',
            'text',
            'numeric',
            'numeric',
            'numeric',
          ]}
          headings={[
            <Heading><CsI18n>From</CsI18n></Heading>,
            <Heading><CsI18n>To</CsI18n></Heading>,
            <Heading><CsI18n>Channel</CsI18n></Heading>,
            <Heading><CsI18n>Rate</CsI18n></Heading>,
            <Heading><CsI18n>Amount</CsI18n></Heading>,
            <Heading><CsI18n>Tax</CsI18n></Heading>,
          ]}
          rows={this.dataRows}
          totals={['', '', '', '', total_amount, total_tax]}
        />
      </div>
    );
  }

  renderOrderTable() {
    this.initRows();

    let columnContentTypes = ['text'];
    let headings = [<Heading><CsI18n>From</CsI18n></Heading>];

    this.state.columnOptions.forEach(item => {
      if(item.checked){
        if(item.value === 'order_total_amount' || item.value === 'status'){
          console.log(item.label);
          columnContentTypes.push('numeric');
        }else{
          columnContentTypes.push("text");
        }
        headings.push(<Heading>{item.label}</Heading>);
      }
    })

    return (
      <div className="order-table">
        <DataTable
            columnContentTypes={columnContentTypes}
            headings={headings}
            rows={this.dataRows}/>
      </div>
    )
  }

}

export default OrderTab;
