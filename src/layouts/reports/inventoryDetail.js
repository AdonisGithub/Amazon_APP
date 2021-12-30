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
  Spinner, Layout, DataTable, TextStyle, Button, FilterType, Tooltip, Avatar, Banner, Badge, Tag,
} from '@shopify/polaris';

import {
  ViewMinor
} from '@shopify/polaris-icons';
import ApplicationApiCall from "../../functions/application-api-call";
import Util from "../../helpers/Util";
import shopifyContext, {TAB} from "../../context";
import "./reports.scss";

import CsMultiSelect from '../../components/csMultiSelect';
import CsErrorMessage from "../../components/csErrorMessage";
import MarketplaceTab from "../../helpers/marketplace-tab";
import {ErrorType} from "../../components/csErrorMessage/csErrorMessage";
import Constants from "../../helpers/rules/constants";
import AmazonHelper from "../../helpers/AmazonHelper";
import ShopifyHelper from "../../helpers/ShopifyHelper";

// import report_inventory from "../../testData/report_inventory";

const PREV_BTN = 1;
const NEXT_BTN = 2;

// const DEFAULT_PAGE_COUNT = 10; //to test
const DEFAULT_PAGE_COUNT = 100;
const SELECT_PAGE_OPTIONS = [ // Olivier>Kbug; values have to be high like this, merchant inventory average size is 3000 items
  // {label: "10", value: "10"}, // to test
  {label: "100", value: "100"},
  {label: "500", value: "500"},
  {label: "1000", value: "1000"},
];

const FILTER = {title: "0", sku: "1", asin: "2", barcode: "3"};

const columnOptions = [
    // {label: CsI18n.t('Domain'),   value: 'domain', checked: false},
    {label: CsI18n.t('Title'),    value: 'title', checked: true},
    {label: CsI18n.t('SKU'),      value: 'sku', checked: true},
    {label: CsI18n.t('ASIN'),     value: 'asin', checked: true},
    {label: CsI18n.t('Barcode'),     value: 'barcode', checked: true},
    {label: CsI18n.t('Price'),    value: 'price', checked: true},
    {label: CsI18n.t('Qty'),      value: 'qty', checked: true},
];
const DEFAULT_DOWNLOAD_FORMAT = "xls";
const TYPE_OPTIONS = [
  {label: "Excel", value: "xls"},
  {label: "CSV", value: "csv"},
]

class InventoryDetail extends React.Component {

  state = {
    processing: true,
    total_count: 0,
    current_page: 1,
    error: false,
    downloadError: null,
    downloadSuccess: false,
    //searchValue:
    search_option: {mode: 'shopify', keyword: '', synced: 'any', synced_offer: 'any', barcode: 'any'},
    // searching: false,
    filterItems: [],
    data : [],
    appliedFilters: [],
    selectedMarketplaceTab: 0,
    columnOptions:columnOptions,
    page_item_count : DEFAULT_PAGE_COUNT,
    format : DEFAULT_DOWNLOAD_FORMAT,
  };

  constructor(props) {
    super(props);
    this.initialState = Util.clone(this.state);
    this.dataRows = [];
    this.unMounted = false;
    this.marketplaces = this.props.marketplaces;
    this.shopify = shopifyContext.getShared();
    this.state.data = this.props.data;
    this.state.total_count = this.props.total_count;
  }

  componentDidMount() {
    this.cbInitData(true, {details: this.props.data, total_count: this.props.total_count});
  }

  componentWillUnmount() {
    this.unMounted = true;
  }

  componentWillReceiveProps(nextProps) {
  }

  init() {
    this.dataRows = [];
    this.filteredRows = [];
    this.setState(Util.clone(this.initialState));
  }

  refresh() {
    this.fetchReport(true, this.state.search_option);
  }

  fetchReport(isNew=false, search_option) {
    let limit_from = isNew? 0:this.state.data.length;
    let limit_to = this.state.page_item_count;
    let configuration = this.shopify.getConfigurationSelected();
    let marketplace_id = this.marketplaces[this.state.selectedMarketplaceTab].MarketplaceId;

    let params = {
      configuration, limit_from, limit_to, marketplace_id,
      ...search_option
    };

    ApplicationApiCall.get('/application/reports/inventory', params, (json) => { this.cbInitData(isNew, json) }, this.cbInitError, false);
    if( isNew ) {
      this.setState({processing: true, search_option});
    } else {
      this.setState({processing: true, search_option});
    }
  }

  cbInitData = (isNew, json) => {
    console.log("sbInitData", json);
    if( this.unMounted ) {
      return;
    }

    if (json) {
      let data;

      let current_page;
      let total_count;
      if( isNew ) {
        data = json.details;
        current_page = 1;
        total_count = json.total_count;
      } else {
        data = json.details ? this.state.data.concat(json.details) : this.state.data;
        current_page = this.state.current_page;
        total_count = this.state.total_count;
      }

      this.filterRows(this.state.appliedFilters, this.getCurPageItems(data, current_page, this.state.page_item_count));
      this.setState({
        total_count,
        current_page,
        data,
        processing: false,
        searching: false,
      })
    }
  }

  cbInitError = (err) => {
    console.log(err);
    if(err && this.unMounted === false){
      this.setState({error: err, processing: false, searching: false});
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

  checkFilter = (appliedFilters, item) => {

    let list = [];
    list = this.checkFilterOptions(appliedFilters, item);

    return this.isEveryBool(list);
  }

  checkFilterOptions = (appliedFilters, item) => {
    let array = [];
    appliedFilters.forEach((filter) => {
      if(!filter.value) {
        return;
      }
      let filter_value = filter.value.toLowerCase();
      let fields = [];
      switch(filter.key) {
        case FILTER.title:
          fields = [item.s_title, item.a_title];
          break;
        case FILTER.sku:
          fields = [item.s_sku, item.a_sku];
          break;
        case FILTER.barcode:
          fields = [item.barcode];
          break;
        case FILTER.asin:
          fields = [item.asin];
          break;
      }
      for(let field of fields) {
        if((field && field.toLowerCase().indexOf(filter_value) !== -1)) {
          array.push(true);
          return;
        }
      }
      array.push(false);
    })
    return array;
  }

  handleSearchChange = (value) => {
    let {search_option} = this.state;
    search_option.keyword = value;
    this.setState({search_option});
  }

  handleSearchClick = () => {
    this.fetchReport(true, this.state.search_option);
  }

  handleFiltersChange = (appliedFilters) => {
    this.filterRows(appliedFilters, this.getCurPageItems(this.state.data, this.state.current_page, this.state.page_item_count));
    this.setState({appliedFilters: appliedFilters});
  }

  handleChangeMode = (option) => (value) => {
    let {search_option} = this.state;
    search_option[option] = value;
    this.fetchReport(true, search_option);
  }

  filterRows(appliedFilters, data) {
    this.filteredRows = [];
    for (let index in data) {
      let item = data[index];

      if (!this.checkFilter(appliedFilters, item)) {
        continue;
      }
      this.filteredRows.push(item);
    }
  }

  handlePaginationBtnClick = (btn) => () => {
    let {current_page} = this.state;
    if (btn === PREV_BTN) {
      current_page--;
    } else {
      current_page++;
    }
    let max_page_loaded = parseInt((this.state.data.length - 1) / this.state.page_item_count) + 1;

    if(max_page_loaded >= current_page) {
      this.filterRows(this.state.appliedFilters, this.getCurPageItems(this.state.data, current_page, this.state.page_item_count));
      this.setState({current_page: current_page});
    } else {
      this.setState({processing: true, current_page}, () => {this.fetchReport(false, this.state.search_option);});
    }
  }

  handlePageItemCountChange = (value) => {
    // this.setState({page_item_count: value});
    this.setState({processing: true, page_item_count: value}, this.refresh);
  }

  handleDownloadTypeChange = (value) => {
    this.setState({format: value});
  }

  handleDownloadBtnClick = () => {
    this.setState({downloading: true});

    let configuration = this.shopify.getConfigurationSelected();
    let format = this.state.format;
    let marketplace_id = this.marketplaces[this.state.selectedMarketplaceTab].MarketplaceId;
    let {search_option} = this.state;
    let params = {
      configuration, format, marketplace_id, ...search_option};

    let fileName = CsI18n.t("InventoryReport") + "." + this.state.format;
    ApplicationApiCall.download('/application/reports/inventory', params, fileName, this.downloadSuccess, this.downloadFail);
  }

  downloadSuccess = () => {
    if (this.unMounted) {
      return;
    }
    this.setState({downloadSuccess: true, downloading: false})
    setTimeout(() => {
      this.setState({downloadSuccess: false});
    }, 5000)
  }

  downloadFail = (err) => {
    console.log(err);

    this.setState({downloadError: err, downloading: false});
  }

  handleColumnSelect = (columnOptions) => {

    this.setState({
      columnOptions: columnOptions,
    })
  }

  handleMarketplaceTabChange = (selected) => {
    this.setState({
      selectedMarketplaceTab: selected,
    }, this.refresh);
  }

  renderDataItem() {
    this.dataRows = [];
    let {mode} = this.state.search_option;
    let shopify_mode = (mode == 'shopify')? true:false;
    let shopify_domain = this.shopify.domain;
    for (let index in this.filteredRows) {
      let item = this.filteredRows[index];
      let row = [];
      let title =
          <div className="display-link">
            <Stack wrap={false} alignment="center" spacing="extraTight">
              <Stack.Item>
                {shopify_mode? item.s_title:item.a_title}
              </Stack.Item>
              {item.product_id?
              <Stack.Item>
                <Tooltip content={CsI18n.t("View on Shopify")} preferredPosition="above">
                  <a href={ShopifyHelper.getProductPage(shopify_domain, item.product_id)} target="_blank"><Icon source={ViewMinor} color="inkLighter"/></a>
                </Tooltip>
              </Stack.Item>:''}
            </Stack>
          </div>

      let hasShopify = false;
      if(item.s_title) {
        hasShopify = true;
      }
      let hasAmazon = false;
      if(item.a_sku) {
        hasAmazon = true;
      }
      let offer_sync;
      let is_synced = false;
      if (hasShopify && hasAmazon) {
        offer_sync = <span className="check">&#10003;</span>;
        is_synced = true;
      }
      row.push(is_synced? offer_sync:'');

      let barcode = '';
      if(item.barcode) {
        if(!item.barcode_valid) {
          barcode = (<span className={"color-red"}>{item.barcode}</span>);
        } else {
          barcode = (<span>{item.barcode}</span>);
        }
      }

      let asin = '';
      if(item.asin) {
        asin = (<div className="display-link"><Stack wrap={false} alignment="center" spacing="extraTight">
          <Stack.Item>
            {item.asin}
          </Stack.Item>
              <Stack.Item>
                <Tooltip content={CsI18n.t("View on Amazon")} preferredPosition="above">
                  <a href={AmazonHelper.getProductPage(item.domain, item.asin)} target="_blank"><Icon source={ViewMinor} color="inkLighter"/></a>
                </Tooltip>
              </Stack.Item>
        </Stack></div>);
        if(item.is_fba == 1) {
          asin = <Stack vertical={true} spacing={"extraTight"}><Stack.Item>{asin}</Stack.Item><Stack.Item><Badge status={"attention"}>FBA</Badge></Stack.Item></Stack>;
        }
      }

      let price_synced = false;
      let quantity_synced = false;
      if(is_synced) {
        price_synced = Util.isSameFloat(item.s_price, item.b_s_price);
        quantity_synced = item.s_quantity == item.b_s_quantity;
      }
      let price = '';
      price = (<Stack vertical spacing="extraTight">
        {price_synced? (<Stack.Item><span className="check">&#10003;</span></Stack.Item>):''}
        {hasAmazon? <Stack.Item>
          <TextStyle variation="strong">A
            : </TextStyle>{Util.getCurrency(item.a_price, item.marketplace_currency_symbol, true)}
        </Stack.Item>:''}
        {hasShopify? <Stack.Item>
          <TextStyle variation="strong">S
            : </TextStyle>{Util.getCurrency(item.s_price, item.store_currency_symbol, true)}
        </Stack.Item>:''}
        {(price_synced && item.b_price_rule)? <Stack.Item><span className={"text-break"}>{item.b_price_rule}</span></Stack.Item>:''}
      </Stack>);

      let quantity = '';
      quantity = (<Stack vertical spacing="extraTight">
        {quantity_synced? (<Stack.Item><span className="check">&#10003;</span></Stack.Item>):''}
        {hasAmazon && item.is_fba == 1? <Stack.Item>
          <TextStyle variation="strong">AFN : </TextStyle>{item.fba_quantity}
        </Stack.Item>:null}
        {hasAmazon? <Stack.Item>
          <TextStyle variation="strong">MFN : </TextStyle>{item.a_quantity}
        </Stack.Item>:null}
        {hasShopify? <Stack.Item>
          <TextStyle variation="strong">S : </TextStyle>{item.s_quantity}
        </Stack.Item>:''}
        {(quantity_synced && item.b_quantity_rule)? <Stack.Item><span className={"text-break"}>{item.b_quantity_rule}</span></Stack.Item>:''}
      </Stack>);

      for(let index1 in this.state.columnOptions){
        let option = this.state.columnOptions[index1];
        if(!option.checked) {
          continue;
        }
        switch(option.value) {
          case "title":
            row.push(title);
            break;
          case "sku":
            row.push(<span className={"text-break"}>{shopify_mode? item.s_sku:item.a_sku}</span>)
            break;
          case "asin":
            row.push(asin);
            break;
          case "barcode":
            row.push(barcode);
            break;
          case "price":
            row.push(price);
            break;
          case "qty":
            row.push(quantity);
            break;
          default:
            row.push(item[option.value]);
        }
      }
      this.dataRows.push(row);
    }
  }

  render() {
    console.log(this.state);
    let content = '';
    if(this.state.error) {
      content = this.renderError()
    } else if (this.state.processing && this.state.searching === false) {
      content = this.renderLoading();
    } else if ( this.state.data.length === 0) {
      content = this.renderEmpty();
    } else {
      content = this.renderDataList();
    }

    let {selectedMarketplaceTab} = this.state;
    return(
      <div>
        <div className={"mb-4"}>
          <MarketplaceTab marketplaceList={this.marketplaces} selectedMarketplaceTab={selectedMarketplaceTab} onChange={this.handleMarketplaceTabChange}/>
        </div>
        {this.renderFiler()}
        {this.renderOption()}
        {this.state.downloadSuccess ? this.renderDownloadSuccess() : ''}
        {this.state.downloadError || this.state.error ? this.renderError() : ''}
        {content}
      </div>
    )
  }

  renderDownloadSuccess(){
    return(
      <div className={"mb-3"}>
        <Banner status="success" title={CsI18n.t("Report has been downloaded successfully")}/>
      </div>
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
        <Banner status="warning" title={CsI18n.t("No data")}>
          <TextStyle><CsI18n>No offers available yet</CsI18n></TextStyle>
        </Banner>
      </Layout.Section>
    )
  }

  renderDownloadFooter() {
    let type_options = TYPE_OPTIONS

    return (
      <Layout.Section>
        <Stack alignment="center">
          <Stack.Item fill>
              <Stack>
                <Stack.Item><TextStyle variation="strong">&#10003; {CsI18n.t("Offer is sync")}</TextStyle></Stack.Item><Stack.Item><TextStyle variation="strong">A: {CsI18n.t("Amazon")}</TextStyle></Stack.Item><Stack.Item><TextStyle variation="strong">S: {CsI18n.t("Shopify")}</TextStyle></Stack.Item>
              </Stack>
          </Stack.Item>
          <Stack.Item>
            <Stack wrap={false} spacing="extraLoose" alignment="center" distribution="trailing">
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
          </Stack.Item>
        </Stack>
      </Layout.Section>
    )
  }

  renderDataList() {
    let dataList = this.renderInventoryTable();
    return (
        <div className="table">
          {dataList}
          {this.renderDataTableFooter()}
          {(this.state.processing === true || this.state.data.length === 0) ? '' : this.renderDownloadFooter()}
        </div>
    )
  }

  renderFiler() {
    const filters = [
      {
          key: FILTER.sku,
          label: CsI18n.t('SKU'),
          operatorText: CsI18n.t('Contains'),
          type: FilterType.TextField,
      },
      {
        key: FILTER.asin,
        label: CsI18n.t('ASIN'),
        operatorText: CsI18n.t('Contains'),
        type: FilterType.TextField,
      },
      {
        key: FILTER.barcode,
        label: CsI18n.t('Barcode'),
        operatorText: CsI18n.t('Contains'),
        type: FilterType.TextField,
      },
      {
        key: FILTER.title,
        label: CsI18n.t('Title'),
        operatorText: CsI18n.t('Contains'),
        type: FilterType.TextField,
      }
    ];

    return (
        <Stack vertical spacing="tight">
          <Stack.Item>
            <Stack spacing="none">
              <Stack.Item fill>
                <div className="filter-search">
                  <ResourceList.FilterControl
                      filters={filters}
                      appliedFilters={this.state.appliedFilters}
                      onFiltersChange={this.handleFiltersChange}
                      searchValue={this.state.search_option.keyword}
                      onSearchChange={this.handleSearchChange}
                      additionalAction={{
                        content: CsI18n.t('Search'),
                        loading: this.state.processing,
                        disabled: this.state.processing,
                        onAction: () => this.handleSearchClick(),
                      }}
                  />
                </div>
              </Stack.Item>
            </Stack>
          </Stack.Item>
        </Stack>
    );
  }

  renderOption() {
    const showByOptions = [{ label: 'Shopify', value: 'shopify' }, { label: 'Amazon', value: 'amazon' }];
    const syncedOptions = [{ label: CsI18n.t('Any'), value: 'any' }, { label: CsI18n.t('Yes'), value: 'yes' }, { label: CsI18n.t('No'), value: 'no' }];
    const offerSyncedOptions = [{ label: CsI18n.t('Any'), value: 'any' }, { label: CsI18n.t('Synced'), value: 'synced' }, { label: CsI18n.t('None'), value: 'none' }];
    const barcodeOptions = [{ label: CsI18n.t('Any'), value: 'any' }, { label: CsI18n.t('Has'), value: 'has' }, { label: CsI18n.t('None'), value: 'none' }];

    return (
        <div className={"mt-4"}>
          <Stack alignment={"center"}>
            <Stack.Item>
              <Select label={CsI18n.t('Show by')} labelInline={true} options={showByOptions}
                      onChange={this.handleChangeMode('mode')} value={this.state.search_option.mode}/>
            </Stack.Item>
            <Stack.Item>
              <Select label={CsI18n.t('Synced offer')} labelInline={true} options={offerSyncedOptions}
                      onChange={this.handleChangeMode('synced_offer')} value={this.state.search_option.synced_offer}/>
            </Stack.Item>
            <Stack.Item>
              <Select label={CsI18n.t('Synced')} labelInline={true} options={syncedOptions}
                      onChange={this.handleChangeMode('synced')} value={this.state.search_option.synced}/>
            </Stack.Item>
            <Stack.Item>
              <Select label={CsI18n.t('Has barcode')} labelInline={true} options={barcodeOptions}
                      onChange={this.handleChangeMode('barcode')} value={this.state.search_option.barcode}/>
            </Stack.Item>
            <Stack.Item fill>&nbsp;</Stack.Item>
            <Stack.Item>
              <Stack distribution="trailing">
                <CsMultiSelect options={this.state.columnOptions} onSelect={this.handleColumnSelect}/>
              </Stack>
            </Stack.Item>
          </Stack>
        </div>);
  }

  renderDataTableFooter() {
    let max_page = parseInt((this.state.total_count - 1) / this.state.page_item_count) + 1;

    let hasPrev = this.state.current_page && this.state.current_page > 1;
    let hasNext = this.state.current_page < max_page;
    return (
      <div className="pagination">
        <Stack wrap={false}>
          <Stack.Item>
            <TextStyle><CsI18n>Showing</CsI18n></TextStyle>
            <div className="pagination-select">
              <Select
                  lable={''}
                  labelHidden={true}
                  options={SELECT_PAGE_OPTIONS}
                  value={this.state.page_item_count}
                  onChange={this.handlePageItemCountChange}
              />
            </div>
            <TextStyle><CsI18n>Items</CsI18n></TextStyle>
          </Stack.Item>
          <Stack.Item>
            <Pagination
              hasPrevious={hasPrev}
              onPrevious={this.handlePaginationBtnClick(PREV_BTN)}
              hasNext={hasNext}
              onNext={this.handlePaginationBtnClick(NEXT_BTN)}
            />
          </Stack.Item>
        </Stack>
      </div>
    )
  }

  renderInventoryTable() {
    this.renderDataItem();

    let columnsContentType = ['text'];
    let headings = [<Heading>&#10003;</Heading>];

    this.state.columnOptions.forEach(item => {
      if(item.checked === true){
        columnsContentType.push(item.value === 'price' || item.value === 'qty' ? 'numeric' : 'text');
        headings.push(<Heading>{item.label}</Heading>);
      }
    });

    return (
      <div className="inv_detail">
        <DataTable
          columnContentTypes={columnsContentType}
          headings={headings}
          rows={this.dataRows}/>
      </div>
    )
  }
}

export default InventoryDetail;
