import React from 'react'
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
  TextContainer, Tag, Badge,
} from '@shopify/polaris';

import ApplicationApiCall from "../../../functions/application-api-call";
import Util from "../../../helpers/Util";
import shopifyContext from "../../../context";
import "../actions.scss"
import AmazonTab from "../../../helpers/amazon-tab";
import CsErrorMessage from "../../../components/csErrorMessage";
import CsEmbeddedModal from "../../../components/csEmbeddedModal";
import CsDataTable from "../../../components/csDataTable";

const PRICE_0 = "price_0";
const PRICE_TO_CURRENCY = "price_to_currency";
const OUT_OF_STOCK = "out_of_stock";
const IMAGES = "images";
const UNPUBLISHED = 'unpublished';
const OPTIONS = {price_0: 1, price_to_currency: 1, out_of_stock: 1, images: 1, unpublished: 1};

const NONE = 0;
const IMPORT_ALL = 1;
const IMPORT_SELECTED = 2;

const DEFAULT_PAGE_COUNT = 100;
// const DEFAULT_PAGE_COUNT = 10; //
const SELECT_PAGE_OPTIONS = [ // Olivier>Kbug; values have to be high like this, merchant inventory average size is 3000 items
  {label: 100, value: 100},
  {label: 500, value: 500},
  {label: 1000, value: 1000},
];

const STEP_GET_STARTED = 0;
const STEP_LOADING = 1;
const STEP_IMPORTABLE = 2;
const STEP_IMPORTING = 3;


const FILTER = {name: "1", title: "2", domain: "3", sku: "4", asin: "5", region: "6"};

class Import extends AmazonTab {

  state = {
    ...this.state,
    processing: false,
    count: 0,
    allCount:0,
    active: false,        // modal is active if true
    error: false,
    selected: [],
    searchValue: '',
    // searching: false,
    filterItems: [],
    productList : [],
    appliedFilters: [],
    options: OPTIONS,
    page_item_count : DEFAULT_PAGE_COUNT,
    importBtnClicked: NONE,
    postError: null,
    postSuccess: null,
    step: STEP_GET_STARTED,
    search_more: false
  };

  constructor(props) {
    super(props);
    this.initialState = Util.clone(this.state);
    this.dataRows = [];
    this.filteredRows = [];
    this.bMounted = false;
    this.shopify = shopifyContext.getShared();
    this.selectedConfiguration = this.getConfigurationSelectedIndex();
    this.marketplaceInfo = props.marketplaceInfo;
    this.unMounted = false;
  }

  componentWillUnmount() {
    this.unMounted = true;
  }

  componentWillReceiveProps(nextProps) {
    super.componentWillReceiveProps(nextProps);
    console.log("%cComponentWillReceiveProps", 'color:green', this.initialState);

    if(this.selectedConfiguration !== this.getConfigurationSelectedIndex() ||
      this.marketplaceInfo.MarketplaceId !== nextProps.marketplaceInfo.MarketplaceId ){
      this.marketplaceInfo = nextProps.marketplaceInfo;
      this.selectedConfiguration = this.getConfigurationSelectedIndex();
      this.init();
    }
  }

  init() {
    this.dataRows = [];
    this.filteredRows = [];
    this.setState(Util.clone(this.initialState));
  }

  fetchProducts(isNew=false) {
    let limit_from = isNew? 0:this.state.productList.length;
    let limit_to = this.state.page_item_count;
    let configuration = this.shopify.getConfigurationSelected();
    let marketplace_id = this.marketplaceInfo.MarketplaceId;
    let params = {configuration, limit_from, limit_to, marketplace_id, search: this.state.searchValue};

    ApplicationApiCall.get('/application/products/list', params, (json) => { this.cbInitData(isNew, json) }, this.cbInitError, false);
    if( isNew ) {
      this.setState({step: STEP_LOADING});
    } else {
      this.setState({search_more: true});
    }
  }

  cbInitData = (isNew, json) => {
    console.log("cbInitData", json);

    if (json && this.unMounted === false) {
      // const error = json.error == 1? true:false;
      let count = json.count ? parseInt(json.count) : 0;
      let allCount = this.state.searchValue === ''?count:this.state.allCount;
      let productList;
      let selected;

      if( isNew ) {
        productList = json.details;
        selected = [];
      } else {
        selected = this.state.selected;
        productList = json.details ? this.state.productList.concat(json.details) : this.state.productList;
      }
      if( json.details ) {
        let prev_count = selected.length;
        for (let index in json.details) {
          selected.push({id: prev_count + Number(index), disabled: false, checked: false});
        }
      }
      let message = json.message ? json.message : '';
      if( json.groups && json.groups.length > 0 ) {
        this.groups = [ {label:"", value:0}, ...json.groups.map(a => { return {label: a.name, value: a.id}; })];
        console.log("groups", this.groups);
      }


      this.filterRows(this.state.appliedFilters, productList, selected);
      this.setState( preState => ({
        ...preState,
        allCount:allCount,
        count: count,
        selected: selected,
        productList: productList,
        message: message,
        step: STEP_IMPORTABLE,
        search_more: false,
      }));
    }
  }

  cbInitError = (err) => {

    console.log(err);

    if(err && this.unMounted === false){
      // setTimeout(() => {
      //   this.setState({error: null})
      // }, 5000);
      this.setState({error: err, step: STEP_IMPORTABLE, search_more: false});
    }
  }

  postSelectedProducts = () => {
    let sku_list = [];
      let items = null;
    if (this.state.importBtnClicked === IMPORT_ALL) {
        items = 'all';
    } else if (this.state.importBtnClicked === IMPORT_SELECTED) {

      this.state.selected.forEach(item => {
        if( item.checked )
          sku_list.push(this.state.productList[item.id].sku);
      });
    }
    this.setState({step: STEP_IMPORTING, active: false});
    let configuration = this.shopify.getConfigurationSelected();
    let marketplace_id = this.marketplaceInfo.MarketplaceId;
    let options = this.state.options;
    let params = {configuration, marketplace_id, items, ...options, search: this.state.searchValue};
    ApplicationApiCall.post('/application/products/import', params, {sku: sku_list}, this.cbPostSuccess, this.cbPostError, false);
     //this.cbPostSuccess('Success');
  }

  cbPostSuccess = (json) => {
    console.log("cbPostSuccess", json);

    if (json) {
      let {selected} = this.state;

      if (this.state.importBtnClicked === IMPORT_ALL) {
        selected.map(item => {
          item.checked = false;
          item.disabled = true;
        });
      } else if (this.state.importBtnClicked === IMPORT_SELECTED) {
        selected.map(item => {
          if( item.checked ) {
            item.checked = false;
            item.disabled = true;
          }
        });
      }

      setTimeout(() => {
        this.setState({postSuccess: null})
      }, 5000);
      this.setState( preState => ({
        ...preState,
        selected: selected,
        postSuccess: json,
        importBtnClicked: NONE,
        step: STEP_IMPORTABLE
      }))
    }
  }

  cbPostError = (err) => {
    console.log(err)

    // setTimeout(() => {
    //   this.setState({postError: null});
    // }, 7000)
    this.setState({postError: err, step: STEP_IMPORTABLE, importBtnClicked: NONE});
  }

  isCheckBool = (value) => {
    return value === true
  }

  isEveryBool = (array) => {
    return array.every(this.isCheckBool)
  }


  isSomeBool = (array) => {
    return array.some(this.isCheckBool)
  }

  checkFilter = (appliedFilters, item) => {

    let array = [];
    let sku = [];


    array = this.checkFilterOptions(appliedFilters, item);

    // return ((item.sku && item.sku.toLowerCase().indexOf(this.state.searchValue.toLowerCase()) !== -1) ||
    //   (item.name && item.name.toLowerCase().indexOf(this.state.searchValue.toLowerCase()) !== -1) ||
    //   (item.region && item.region.toLowerCase().indexOf(this.state.searchValue.toLowerCase()) !== -1) ||
    //   (item.asin && item.asin.toLowerCase().indexOf(this.state.searchValue.toLowerCase()) !== -1)) && this.isEveryBool(array);
    return this.isEveryBool(array);
  }

  hasMore() {
    return this.state.productList.length < this.state.count;
  }

  checkFilterOptions = (appliedFilters, item) => {

    let array = [];

    appliedFilters.forEach((filter) => {
      if(filter.key === FILTER.name){
        if(filter.value && item.name && item.name.toLowerCase().indexOf(filter.value.toLowerCase()) !== -1){
          array.push(true);
        }else{
          array.push(false);
        }
      }
      if (filter.key === FILTER.asin) {
        if (filter.value && item.asin && item.asin.toLowerCase().indexOf(filter.value.toLowerCase()) !== -1) {
          array.push(true);
        } else {
          array.push(false);
        }
      } else if (filter.key === FILTER.sku) {
        if (filter.value && item.sku && item.sku.toLowerCase().indexOf(filter.value.toLowerCase()) !== -1) {
          array.push(true);
        } else {
          array.push(false);
        }
      } else if (filter.region === FILTER.region) {

        if (filter.value && item.sku && item.sku.toLowerCase().indexOf(filter.value.toLowerCase()) !== -1) {
          array.push(true);
        } else {
          array.push(false);
        }
      }
    })
    return array;
  }

  handleSearchChange = (value) => {
    this.setState({searchValue: value});
  }

  handleSearchClick = () => {
    this.fetchProducts(true);
  }

  handleFiltersChange = (appliedFilters) => {
    console.log(appliedFilters);

    this.filterRows(appliedFilters, this.state.productList, this.state.selected);
    this.setState({appliedFilters: appliedFilters});
  }

  handleRemoveFilter = (value) => () => {
    let idx;
    let {appliedFilters} = this.state;

    this.state.appliedFilters.forEach((filter, index) => {
      if(filter.value === value){
        idx = index;
      }
    });
    appliedFilters.splice(idx, 1);
    this.filterRows(appliedFilters, this.state.productList, this.state.selected);
    this.setState({appliedFilters: appliedFilters});
  };

  handleMoreBtnClick = () => {
    this.fetchProducts();
  };

  handlePageItemCountChange = (value) => {
    this.setState({page_item_count: parseInt(value)})
  };

  handleItemCheck = (row_selected) =>{
    let {selected} = this.state;
    for(let i in row_selected) {
      selected[row_selected[i].id] = row_selected[i];
    }
    console.log("handleItemCheck", row_selected, selected);
    this.filteredRows_selected = row_selected;
    this.setState({selected});
  };

  handleToggleModal = () => {

    this.setState( ({
      active: false,
    }));
  };

  handleImportBtnClick = (clicked) => () => {

    if(clicked === IMPORT_ALL){
      this.setState({active: true, importBtnClicked: clicked})

    }else{
      this.setState({importBtnClicked: clicked, active: true})
    }

  }

  handleOptionCheck = (option) => (value) => {
    this.setState(preState => (
      preState.options[option] = value
    ))
  }

  filterRows(appliedFilters, productList, selected) {
    console.log("filterRows", appliedFilters, productList);
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

  render()
  {
    if(this.state.step === STEP_GET_STARTED) {
      return this.renderGetStarted();
    } else {
      return this.renderImport();
    }
  }

  renderGetStarted()
  {
    let action = {
      content: CsI18n.t('Get started'),
      onAction: () => {
        this.fetchProducts(true);
      },
      loading: false,
      disable: false
    };

    return(
      <Stack vertical>
        <Stack.Item>
          <br />
        </Stack.Item>
        <Stack.Item>
          <Banner
            title={CsI18n.t("Import products from Amazon")}
            action={action}
          >
            <p>
              <CsI18n>Your products will be imported from Amazon to your store.</CsI18n><br />
              <CsI18n> Some information won't be imported.</CsI18n>
            </p>
          </Banner>
        </Stack.Item>
        <Stack.Item>
          <br />
        </Stack.Item>
      </Stack>
    )
  }

  renderImport() {
    let content = "";
    if(this.state.step === STEP_LOADING) {
      content = this.renderLoading();
    } else if(this.state.step === STEP_IMPORTABLE && this.state.productList.length === 0){
      content = this.renderEmpty();
    } else {
      content = this.renderDataList();
    }

    return (
      <div className="actions import-body">
        <Layout>
          {this.renderImportOptions()}
          {content}
          {this.state.active === true ? this.renderModal() : ''}
        </Layout>
      </div>
    );
  }

  getImportedCount() {
    let selected = this.state.selected;
    let count = 0;
    selected.forEach(item => {
      if( item.disabled ) {
        count++;
      }
    });
    return count;
  }

  getSelectedCount() {
    let selected = this.state.selected;
    let count = 0;
    selected.forEach(item => {
      if( item.checked ) {
        count++;
      }
    });
    return count;
  }

  renderImportOptions(){
    let importedCount = this.getImportedCount();
    let selectedCount = this.getSelectedCount();
    return(
      <Layout.Section>
        <Card>
          <Card.Section>
              <Stack vertical spacing="none">
                <Stack.Item>
                  <Stack distribution="fillEvenly">
                    <Stack.Item>
                        <Stack alignment="center" spacing={"extraTight"}>
                          <Stack.Item><Checkbox checked={this.state.options[PRICE_0]}
                                                onChange={this.handleOptionCheck(PRICE_0)}/></Stack.Item>
                          <Stack.Item><TextStyle><CsI18n>Import products with price = 0</CsI18n></TextStyle></Stack.Item>
                        </Stack>
                    </Stack.Item>
                    <Stack.Item>
                        <Stack alignment="center" spacing={"extraTight"}>
                          <Stack.Item><Checkbox checked={this.state.options[PRICE_TO_CURRENCY]}
                                                onChange={this.handleOptionCheck(PRICE_TO_CURRENCY)}/></Stack.Item>
                          <Stack.Item><TextStyle><CsI18n>Convert prices to store currency</CsI18n></TextStyle></Stack.Item>
                        </Stack>
                    </Stack.Item>
                    <Stack.Item>
                        <Stack alignment="center" spacing={"extraTight"}>
                          <Stack.Item><Checkbox checked={this.state.options[OUT_OF_STOCK]}
                                                onChange={this.handleOptionCheck(OUT_OF_STOCK)}/></Stack.Item>
                          <Stack.Item><TextStyle><CsI18n> Import out of stock products</CsI18n></TextStyle></Stack.Item>
                        </Stack>
                    </Stack.Item>
                    <Stack.Item>
                        <Stack alignment="center" spacing={"extraTight"}>
                          <Stack.Item><Checkbox checked={this.state.options[IMAGES]}
                                                onChange={this.handleOptionCheck(IMAGES)}/></Stack.Item>
                          <Stack.Item><TextStyle><CsI18n>Import images</CsI18n></TextStyle></Stack.Item>
                        </Stack>
                    </Stack.Item>
                    <Stack.Item>
                      <Stack alignment="center" spacing={"extraTight"}>
                        <Stack.Item><Checkbox checked={this.state.options[UNPUBLISHED]}
                                              onChange={this.handleOptionCheck(UNPUBLISHED)}/></Stack.Item>
                        <Stack.Item><TextStyle><CsI18n>Make imported products unavailable</CsI18n></TextStyle></Stack.Item>
                      </Stack>
                    </Stack.Item>
                  </Stack>
                </Stack.Item>
                <Stack.Item>
                  <br/>
                </Stack.Item>
                <Stack.Item>
                  <Stack>
                    <Stack.Item fill>
                      <Button size="slim"
                              disabled={importedCount === this.state.productList.length ||
                              selectedCount !== 0 || this.state.importing === true}
                              loading={this.state.importing === true && this.state.importBtnClicked === IMPORT_ALL}
                              onClick={this.handleImportBtnClick(IMPORT_ALL)}><CsI18n>Import all</CsI18n></Button>
                    </Stack.Item>
                    <Stack.Item>
                      <Button size="slim"
                              disabled={importedCount === this.state.productList.length ||
                              selectedCount === 0 || this.state.importing === true && this.state.importBtnClicked === IMPORT_ALL}
                              loading={this.state.importing === true && this.state.importBtnClicked === IMPORT_SELECTED}
                              onClick={this.handleImportBtnClick(IMPORT_SELECTED)}><CsI18n>Import selected</CsI18n></Button>
                    </Stack.Item>
                  </Stack>
                </Stack.Item>
              </Stack>
          </Card.Section>
        </Card>
        <div className={"import-search-box"}>
          {this.renderFiler()}
        </div>
      </Layout.Section>
    )
  }

  renderModal(){

    let {importBtnClicked} = this.state;
    let selected_count;
    if( importBtnClicked === IMPORT_ALL )
      selected_count = this.state.count - this.getImportedCount();
    else
      selected_count = this.getSelectedCount();

    return(
      <CsEmbeddedModal
        open={true}
        onClose={this.handleToggleModal}
        title={CsI18n.t("Import {{selected_count}} products?", {selected_count: selected_count})}
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
            <p><CsI18n> Do you still want to continue?</CsI18n></p>
          </TextContainer>
        </Modal.Section>
      </CsEmbeddedModal>
    )
  }


  renderError(){
    let errorType;
    let errorTitle;
    let errorMessage;

    if(this.state.postError){
      errorType = this.state.postError.type;
      errorTitle = CsI18n.t("Failed to import products");
    } else if (this.state.error){
      errorType = this.state.error.type;
      errorMessage = this.state.error.message;
    }

    return(
      <div>
        <CsErrorMessage
          errorType={errorType}
          errorTitle={errorTitle}
          errorMessage={errorMessage}
        />
        <br/>
      </div>
    )
  }

  renderImportSuccess(){
    return(
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
    if(this.state.message){
      message = this.state.message;
    }else{
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

  renderDataItem()
  {
    let dataItem = [];
    for( let index in this.filteredRows) {
      const item = this.filteredRows[index];
      dataItem[index] = [];

      dataItem[index].push(item.sku);
      dataItem[index].push(item.asin);
      dataItem[index].push(item.name);
      dataItem[index].push(item.marketplace_currency_symbol + " " + item.price);
      dataItem[index].push(item.quantity);
    }
    return dataItem;
  }
  renderDataList() {
    return (
      <Layout.Section>
        {this.state.postSuccess ? this.renderImportSuccess() : ''}
        {this.state.error || this.state.postError ? this.renderError() : ''}
        {this.renderProductTableInfor()}
        {this.renderProductImportTable()}
        {this.hasMore() ? this.renderProductTableFooter() : ''}
      </Layout.Section>
    )
  }

  renderFiler() {

    const productFilter = [
      {
        key: FILTER.sku,
        label: CsI18n.t('SKU'),
        operatorText: CsI18n.t('Contains'),
        type: FilterType.TextField,
      },
      {
        key: FILTER.name,
        label: CsI18n.t('Name'),
        operatorText: CsI18n.t('Contains'),
        type: FilterType.TextField,
      },
      {
        key: FILTER.asin,
        label: CsI18n.t('Asin'),
        operatorText: CsI18n.t('Contains'),
        type: FilterType.TextField,
      },
      {
        key: FILTER.region,
        label: CsI18n.t('Region'),
        operatorText: CsI18n.t('Contains'),
        type: FilterType.TextField,
      }
    ];

    return (
      <Stack spacing="tight">
        <Stack.Item fill>
          <ResourceList.FilterControl
            filters={productFilter}
            appliedFilters={this.state.appliedFilters}
            onFiltersChange={this.handleFiltersChange}
            searchValue={this.state.searchValue}
            onSearchChange={this.handleSearchChange}
            additionalAction={{
              content: CsI18n.t('Search'),
              loading: this.state.searching,
              disabled: this.state.searching,
              onAction: () => this.handleSearchClick(),
            }}
          />
        </Stack.Item>
      </Stack>
    );
  }

  renderProductTableFooter() {

    return(
      <div className="pagination">
        <Stack wrap={false} alignment="center">
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
            <Button loading={this.state.search_more} onClick={this.handleMoreBtnClick}><CsI18n>More</CsI18n></Button>
          </Stack.Item>
        </Stack>
      </div>
    )
  }

  renderProductTableInfor(){
    return(
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
    );
  }

  renderProductImportTable() {
    console.log("renderProductImportTable", this.state.selected, this.filteredRows_selected);
    let dataItem = this.renderDataItem();
    for(let i in this.filteredRows_selected) {
      this.filteredRows_selected[i] = this.state.selected[this.filteredRows_selected[i].id];
    }

    return (
        <div className={'catalog'}>
          <CsDataTable
              onChange={this.handleItemCheck}
              columnContentType={[
                'text',
                'text',
                'text',
                'numeric',
                'numeric',
              ]}
              headers={[
                  <Heading><CsI18n>SKU</CsI18n></Heading>,
                  <Heading><CsI18n>Asin</CsI18n></Heading>,
                  <Heading><CsI18n>Name</CsI18n></Heading>,
                  <Heading><CsI18n>Price</CsI18n></Heading>,
                  <Heading><CsI18n>Qty</CsI18n></Heading>,
              ]}
              dataItem={dataItem}
              selected={this.filteredRows_selected}/>
        </div>
    );
  }
}

export default Import;
