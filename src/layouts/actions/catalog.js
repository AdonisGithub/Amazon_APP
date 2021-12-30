import React from 'react'


import {
  Page,
  Stack,
  Layout,
  TextStyle,
  Avatar, Spinner, Tabs,

} from '@shopify/polaris';

import shopifyContext from "../../context";
import AmazonTab from "../../helpers/amazon-tab";
import ApplicationApiCall from "../../functions/application-api-call";
import CsI18n from "../../components/csI18n";
import CsErrorMessage from "../../components/csErrorMessage";
import MarketplaceTab from "../../helpers/marketplace-tab";
import Util from "../../helpers/Util";
import {actionsTabs, offerTabs} from "../../constant/actions";
import Import from "./catalog/import";
import Search from "./catalog/search";
import Export from "./catalog/export";
import Match from "./catalog/match";
import Lookup from "./catalog/lookup";
import Upload from "./catalog/upload";
import Image from "./catalog/image/image";
import Admin from "./catalog/admin";

import "./actions.scss"
import {ErrorType} from "../../components/csErrorMessage/csErrorMessage";
import Constants from "../../helpers/rules/constants";
import Translate from "./catalog/translate/translate";

class Catalog extends AmazonTab {

  state = {
    ... this.state,
    processing : false,
    selectedTab : 0,
    selectedMarketplaceTab : 0,
    error : null,
  }
  constructor(props) {
    super(props);
    this.initialState = Util.clone(this.state);
    this.shopify = shopifyContext.getShared();
    this.selectedConfiguration = this.getConfigurationSelectedIndex();
    this.marketplaceList = [];
    this.unMounted = false;

    let initPath = this.shopify.getTab(3);

    let tabs = offerTabs.filter((tab) => {
          if( this.shopify.isAllowedFeature(tab.feature) )
            return true;
          else
            return false;
        }
    );

    if (this.shopify.isAdminMode()) {
      tabs.push({
        id: 'admin',
        content: CsI18n.t('Admin'),
        name: 'admin'
      });
    }

    this.tabs = tabs;
    if(initPath) {
      for(let i in this.tabs) {
        if(this.tabs[i].id == initPath) {
          this.state.selectedTab = i;
          break;
        }
      }
    }
  }

  componentDidMount() {
    this.init();
  }

  componentWillUnmount() {
    this.unMounted = true;
  }

  componentWillUpdate(nextProps, nextState, nextContext) {
    console.log("%cinv_WillUpdate", 'color:green', this.selectedConfiguration, this.getConfigurationSelectedIndex());

    if(this.selectedConfiguration !== this.getConfigurationSelectedIndex()){
      this.selectedConfiguration = this.getConfigurationSelectedIndex();
      this.marketplaceList = [];
      this.setState(Util.clone(this.initialState), this.init)
    }
  }

  init = () => {
    if( this.fetchMarketplaceList(this.cbMarketplacesSuccess, this.cbMarketplaceError) === false ) {
      this.setState({processing: true});
    }
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
    if(err && this.unMounted === false){
      // setTimeout(( ) => {
      //   this.setState({error: null})
      // }, 5000)
      this.setState({error: err, processing: false})
    }
  }

  handleTabSelect = (tab) => () => {
    if (this.state.selectedTab !== tab) {
      this.setState({selectedTab: tab, selectedMarketplaceTab: 0, error: null});
      let {onTabChange} = this.props;
      if( onTabChange ) {
        onTabChange(this.tabs[tab].id, this.tabs[tab].name);
      }
    }
  }

  handleMarketplaceTabChange = (selectedMarketplageTab) => {
    this.setState({selectedMarketplaceTab: selectedMarketplageTab});
  }

  render() {
    console.log(this.state);
    let content = '';
    if(this.state.error){
      content = this.renderError()
    }else{
      content = this.state.processing === true ? this.renderLoading() : this.renderData();
    }

    return (
      <div className="actions">
        <Page fullWidth>
          <Layout>
            <Layout.Section>
              <Stack wrap={false}>
                <Stack.Item>
                  {this.renderTabs()}
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

  renderTabs(){
      let tabs = this.tabs.map((tab, index) => {
        return <Stack.Item key={tab.id}><a className={Number(this.state.selectedTab) === index ? "selected" : ""}
                              onClick={this.handleTabSelect(index)}>{tab.content}</a></Stack.Item>
      });

      return(
          <div className="side-bar">
            <Stack vertical>
              {tabs}
            </Stack>
          </div>
      )
  }

  renderError(){
    return(
      <CsErrorMessage
        errorType={this.state.error.type}
        errorMessage={this.state.error.message}
      />
    )
  }

  renderLoading() {
    return (
      <div className="loading">
        <br/>
        <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}/>
      </div>
    )
  }

  renderData(){
    const {selectedMarketplaceTab} = this.state;
    console.log(this.marketplaceList, selectedMarketplaceTab);

    if(!this.marketplaceList || this.marketplaceList.length === 0){
      return ''
    }

    let content = '';
    let tab_id = this.tabs[Number(this.state.selectedTab)].id;
    switch (tab_id) {
      case 'export':
        content = <Export marketplaceInfo={this.marketplaceList[selectedMarketplaceTab]}/>
        break;
      case 'import':
        content = <Import marketplaceInfo={this.marketplaceList[selectedMarketplaceTab]}/>
        break;
      case 'match':
        content = <Match marketplaceInfo={this.marketplaceList[selectedMarketplaceTab]}/>
        break;
      case 'lookup':
        content = <Lookup marketplaceInfo={this.marketplaceList[selectedMarketplaceTab]}/>
        break;
      case 'search':
        content = <Search marketplaceInfo={this.marketplaceList[selectedMarketplaceTab]}/>
        break;
      case 'upload':
        content = <Upload marketplaceInfo={this.marketplaceList[selectedMarketplaceTab]}/>
        break;
      case 'image':
        content = <Image />
        break;
      case 'translate':
        content = <Translate />
        break;
      case 'admin':
        content = <Admin marketplaceInfo={this.marketplaceList[selectedMarketplaceTab]} />
        break;
    }

    return(
      <Stack vertical spacing="none">
        {(tab_id !== 'image' && tab_id !== 'translate')?
        <Stack.Item>
          <MarketplaceTab marketplaceList={this.marketplaceList} selectedMarketplaceTab={selectedMarketplaceTab} onChange={this.handleMarketplaceTabChange}/>
        </Stack.Item>
            :''}
        <Stack.Item>
            {content}
        </Stack.Item>
      </Stack>
    )
  }
}

export default Catalog;
