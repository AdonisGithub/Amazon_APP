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
import CsI18n from "../../components/csI18n";
import CsErrorMessage from "../../components/csErrorMessage";
import Util from "../../helpers/Util";
import {feedTabs} from "../../constant/actions";

import FeedList from "./feeds/feedList";
import FeedErrors from "./feeds/feedErrors";

import {ErrorType} from "../../components/csErrorMessage/csErrorMessage";
import "./actions.scss";

class Feeds extends AmazonTab {

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
    this.unMounted = false;

    this.tabs = feedTabs.filter((tab) => {
        if( this.shopify.isAllowedFeature(tab.feature) )
          return true;
        else
          return false;
      }
    );
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
      this.setState(Util.clone(this.initialState), this.init)
    }
  }

  init = () => {

  }

  handleTabSelect = (tab) => () => {
    if (this.state.selectedTab !== tab) {
      this.setState({selectedTab: tab, error: null});
      let {onTabChange} = this.props;
      if( onTabChange ) {
        onTabChange(this.tabs[tab].id, this.tabs[tab].name);
      }
    }
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
      <div className="actions feeds-container">
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
        <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
      </div>
    )
  }

  renderData(){
    let content = '';
    let tab_id = this.tabs[Number(this.state.selectedTab)].id;
    switch (tab_id) {
      case 'all':
        content = <FeedList />
        break;
      case 'product_errors':
        content = <FeedErrors key={'product_errors'} page_type={"products"} />
        break;
      case 'offer_errors':
        content = <FeedErrors key={'offer_errors'} page_type={"offers"} />
        break;
    }

    return(
        <React.Fragment>
            {content}
        </React.Fragment>
    )
  }
}

export default Feeds;
