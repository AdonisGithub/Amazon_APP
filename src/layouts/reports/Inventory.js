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
  Spinner, Layout, DataTable, TextStyle, Button, FilterType, Tooltip, Avatar, Banner, Badge,
} from '@shopify/polaris';

import {
  ViewMinor
} from '@shopify/polaris-icons';
import ApplicationApiCall from "../../functions/application-api-call";
import Util from "../../helpers/Util";
import shopifyContext, {TAB} from "../../context";
import "./reports.scss"
import AmazonTab from "../../helpers/amazon-tab";
import CsMultiSelect from '../../components/csMultiSelect';
import CsErrorMessage from "../../components/csErrorMessage";
import MarketplaceTab from "../../helpers/marketplace-tab";
import {ErrorType} from "../../components/csErrorMessage/csErrorMessage";
import Constants from "../../helpers/rules/constants";
import InventorySummary from "./inventorySummary";
import InventoryDetail from "./inventoryDetail";

// import report_inventory from "../../testData/report_inventory";

const TAB_SUMMARY = 1;
const TAB_INVENTORY = 2;

// const DEFAULT_PAGE_COUNT = 10; //to test
const DEFAULT_PAGE_COUNT = 100;

class InventoryTab extends AmazonTab {

  state = {
    ...this.state,
    processing: true,
    error: false,
    searchValue: '',
    searching: false,
    summaryData : [],
    details : [],
    total_count: 0,
    count: 0,
    selected_tab: TAB_SUMMARY,
  };

  constructor(props) {
    super(props);
    this.initialState = Util.clone(this.state);
    this.dataRows = [];
    this.unMounted = false;
    this.marketplaces = [];
    this.shopify = shopifyContext.getShared();
    this.selectedConfiguration = this.getConfigurationSelectedIndex();
    this.initTab();
  }

  initTab(){
    if(this.shopify.getTab(TAB.CHILD_TAB2) === 'details'){
      let sku = Util.getParam('id');

      if(sku){
        this.state.searchValue = sku
      }
      this.state.selected_tab = TAB_INVENTORY
    }
  }

  componentDidMount() {
    this.init();
  }

  componentWillUnmount() {
    this.unMounted = true;
  }

  componentWillReceiveProps(nextProps) {
    super.componentWillReceiveProps(nextProps);

    if(this.selectedConfiguration !== this.getConfigurationSelectedIndex()){
      console.log("componentWillReceiveProps --- changed selectedConfiguration");
      this.selectedConfiguration = this.getConfigurationSelectedIndex();
      this.setState({
        ...Util.clone(this.initialState),
        processing: true}
        , this.init);
    }
  }

  init() {
    this.setState({processing: true});

    let limit_from = 0;
    let limit_to = DEFAULT_PAGE_COUNT;
    let configuration = this.shopify.getConfigurationSelected();
    let q = "";
    let params = {configuration, limit_from, limit_to, q};

    ApplicationApiCall.get('/application/reports/inventory', params, this.cbInitData, this.cbInitError);
  }

  cbInitData = (json) => {
    console.log("sbInitData", json);

    if (json && this.unMounted === false) {
      let total_count = json.total_count ? json.total_count : 0;
      let count = json.count ? json.count : 0;
      let summaryData = json.summary ?  json.summary : [];
      let details = [];
      this.marketplaces = json.marketplaces;

      if(this.state.searching === false){
        details = json.details ? this.state.details.concat(json.details) : this.state.details;
      }else{
        details = json.details ? json.details : [];
      }

      this.setState({
        total_count,
        count,
        summaryData,
        details,
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

  handleTabSelect = (tab) => () => {
    if (this.state.selected_tab !== tab) {
      if (tab === TAB_SUMMARY) {
        this.setState({selected_tab: tab});
      } else {
        this.setState({selected_tab: tab});
      }
    }
  }

  render() {
    console.log(this.state, this.marketplaces);
    let content = "";

    if(this.state.processing === true){
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
                                     onClick={this.handleTabSelect(TAB_SUMMARY)}>Summary</a></Stack.Item>
                      <Stack.Item><a className={this.state.selected_tab === TAB_INVENTORY ? "selected" : ""}
                                     onClick={this.handleTabSelect(TAB_INVENTORY)}>Details</a></Stack.Item>
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

    if(this.state.error) {
      content = this.renderError()
    } else {
      content = this.state.selected_tab === TAB_SUMMARY ?
          (<InventorySummary data={this.state.summaryData} />)
          : (<InventoryDetail marketplaces={this.marketplaces} data={this.state.details} total_count={this.state.total_count} />);
    }

    return(
      <div>
            {content}
      </div>
    )
  }

  renderError(){
    let errorType;
    let errorTitle;
    let errorMessage;

    if (this.state.error){
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
}

export default InventoryTab;
