import React from 'react'
import CsI18n from "../../../components/csI18n"

import {
  Button,
  Card,
  Banner,
  Badge,
  Heading,
  Page,
  Stack,
  ResourceList,
  Spinner, Layout, DataTable, TextStyle, Icon, Link, Tooltip, FilterType, DisplayText, Select, Checkbox, TextField, Avatar,
} from '@shopify/polaris';
import {
  ChevronDownMinor,
  ChevronLeftMinor,
  ChevronUpMinor,
  CircleChevronRightMinor,
  MarkFulfilledMinor
} from "@shopify/polaris-icons";
import Util from '../../../helpers/Util';
import AmazonTab from "../../../helpers/amazon-tab";
import shopifyContext from "../../../context";
import ApplicationApiCall from "../../../functions/application-api-call";
import CsErrorMessage from "../../../components/csErrorMessage";

import FeedErrorDetail from "./feed_error_detail";
import FeedContext from "./feed-context";
import "../actions.scss";
import "./feeds.scss";

// import feeds_errors from "../../../testData/feeds_errors.json"
// const TEST_MODE = false;

class FeedErrors extends AmazonTab {

  state = {
    ...this.state,
    processing: true,
    error: false,
    errorList: [],
    errorDetail: false,
    appliedFilters: [],
    searchValue: '',
  }

  constructor(props) {
    super(props);

    this.initialState = Util.clone(this.state);
    this.dataRows = [];
    this.filteredRows = [];
    this.shopify = shopifyContext.getShared();
    this.unMounted = false;
    this.page_type = this.props.page_type;

    this.contextData = {
      page_type: this.props.page_type,
      errorList: null,
      errorItemList: []
    }
    console.log("page_type", this.page_type);
  }

  componentDidMount() {
    this.fetchFeeds(true);
  }

  componentWillUnmount() {
    this.unMounted = true;
  }

  fetchFeeds(isNew=false) {
    let configuration = this.shopify.getConfigurationSelected();
    let params = {configuration, search: this.state.searchValue};

    let operation = this.page_type === 'products'? 'feeds_product_errors':'feeds_offer_errors';
    // if(TEST_MODE) {
    //   setTimeout(()=> {
    //     this.cbInit(isNew, feeds_errors.data);
    //   }, 1000);
    // } else {
      ApplicationApiCall.get('/application/offers/'+operation, params, (data) => { this.cbInit(isNew, data) }, this.cbInitError);
    // }
    this.setState({processing: true});
  }

  cbInit = (isNew, json) => {
    console.log(this.shopify, this.state, json);

    if(!json || this.unMounted !== false) {
      return;
    }

    let errorList;

    errorList = json.errors;
    this.filteredRows = errorList;
    this.contextData.errorList = errorList;

    this.setState({
      processing: false,
      errorList: errorList,
    });

  }

  cbInitError = (err) => {
    console.log(err);

    if(err && this.unMounted === false){
      this.setState({error: err, processing: false, search_more: false})
    }
  }

  handleViewErrorDetail = (item) => () => {
    console.log("handleViewErrorDetail", item);
    this.setState({errorDetail : item})
  }

  handleRefresh = () => {
    this.fetchFeeds(true);
  }

  handleBackToList = () => {
    this.setState({errorDetail : false});
  }

  handleSearchChange = (value) => {
    this.setState({searchValue: value});
  }

  handleSearchClick = () => {
    this.fetchFeeds(true);
  }

  initRows() {
    this.dataRows = [];
    for(let index in this.filteredRows){
      let item = this.filteredRows[index];
      this.dataRows.push(item);
    }
  }

  render() {
    let content;

    if (this.state.error) {
      content = this.renderError();
    } else {
      content = this.renderList();
    }
    return (
        <FeedContext.Provider value={this.contextData}>
          <div className="feed_error-list">
            {content}
          </div>
        </FeedContext.Provider>
    );
  }

  renderError(){
    let errorType;
    let errorMessage;

    if(this.state.error){
      errorType = this.state.error.type;
      errorMessage = this.state.error.message
    }

    return(
        <CsErrorMessage
          errorType={errorType}
          errorMessage={errorMessage}
        />
    )
  }

  renderLoading() {
    return (
        <div className="loading">
          <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
        </div>
    )
  }

  renderEmpty() {
    return (
      <div>
        <br/>
        <Banner status="warning" title={CsI18n.t("No data")}>
          <TextStyle><CsI18n>No pending errors</CsI18n></TextStyle>
        </Banner>
        <br/>
      </div>
    )
  }

  renderFilter() {

    const action = {
      content: CsI18n.t("Search"),
      onAction: this.handleSearchClick,
      loading: this.state.processing === true
    }

    return (
          <ResourceList.FilterControl
            searchValue={this.state.searchValue}
            onSearchChange={this.handleSearchChange}
            additionalAction={{
              content: CsI18n.t('Search'),
              loading: this.state.processing,
              disabled: this.state.processing,
              onAction: () => this.handleSearchClick(),
            }}
          />
    );
  }


  renderList(){
    let content;
    if( this.state.refreshing === true || this.state.processing === true ) {
      content = this.renderLoading();
    } else if(this.state.errorList.length === 0) {
      content = this.renderEmpty();
    } else if (this.state.errorDetail ) {
      return (<React.Fragment>
        <FeedErrorDetail onBack={this.handleBackToList} error_data={this.state.errorDetail} page_type={this.page_type}/>
      </React.Fragment>);
    } else {
      content = this.renderTable();
    }
    return(
      <div className={"mt-3"}>
        {this.renderFilter()}
        {content}
      </div>
    )
  }

  renderTable(){
    this.initRows();
    const resourceListHeadings = (
        <div className="csResourceList-header_container mt-3" >
          <div className="csResourceList-header">
            <div className="left">
              <Heading>&nbsp;</Heading>
            </div>
            <div className="left">
              <Heading><CsI18n>Error Code</CsI18n></Heading>
            </div>
            <div className="left">
              <Heading><CsI18n>Batch Id</CsI18n></Heading>
            </div>
            <div className="left">
              <Heading><CsI18n>Message</CsI18n></Heading>
            </div>
            <div className="right">
              <Heading><CsI18n>SKUs</CsI18n></Heading>
            </div>
            <div className="right">
              <Heading>&nbsp;</Heading>
            </div>
          </div>
        </div>
    );

    let list = [];
    this.dataRows.forEach((item, index) => {
      list.push(this.renderRow(item, index));
    });
    return (
          <div className={"csResourceList feeds-error"}>
            {resourceListHeadings}
            {list}
          </div>);
  }

  renderRow(item, index) {
    let total_items = 0;

    let marketplace_codes = item.marketplaces;
    let codes = [];
    for(let iso_code of marketplace_codes) {
      let flag_url = this.shopify.static_content + '/amazon/flags/flag_' + iso_code + '_64px.png';
      codes.push(<Stack.Item key={item.error_code + "_" + iso_code}><Avatar source={flag_url} alt={iso_code} size="small"/></Stack.Item>)
    }

    let error_code = <Badge key={"error_code"+index} status={item.error_priority == 1? 'warning':'attention'}>{item.error_code}</Badge>;

    return (<div key={item.error_code} className={"csResourceList-item_container"}>
        <div className="csResourceList-item">
          <div className={"left"}><Stack spacing={"extraTight"}>{codes}</Stack></div>
          <div className="left">
            {error_code}
          </div>
          <div className="left">{item.batch_id}</div>
          <div className="left">{React.createElement("div", { dangerouslySetInnerHTML: { __html: item.error_details } })}</div>
          <div className="right">{item.sku_num}</div>
          <div className="right"><Button onClick={this.handleViewErrorDetail(item)}><CsI18n>View</CsI18n></Button></div>
        </div>
      </div>);
  }
}
export default FeedErrors;
