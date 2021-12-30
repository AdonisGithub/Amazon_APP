import React from 'react'
import {
  Card,
  Page,
  Tabs,
  Stack,
} from '@shopify/polaris';

import ShopifyContext, { TAB } from "./context";
import AmazonTab from "./helpers/amazon-tab";
import MustConfigure from "./helpers/must-configure";
import Operations from "./layouts/actions/operations";
import OrderList from "./layouts/actions/orders";
import Catalog from "./layouts/actions/catalog";
import ScheduleList from "./layouts/actions/scheduleList";
import FailuresTab from "./layouts/actions/failures";
import {actionsTabs, mainTabs} from "./constant";
import { offerTabs} from "./constant/actions";

import CsHelpButton from "./components/csHelpButton";
import Feeds from "./layouts/actions/feeds";

class Actions extends AmazonTab {

  constructor(props) {
    super(props);
    this.shopify = ShopifyContext.getShared();
    this.state.wait = true;
    this.state.subTab = '';

    this.tabs = actionsTabs.filter((tab) => {
          if( this.shopify.isAllowedFeature(tab.feature) )
            return true;
          else
            return false;
        }
    );

    this.setSelectedTab();
  }

  setSelectedTab(){
    this.tabs.forEach((tab, index) => {
      if(this.shopify.getTab(TAB.CHILD_TAB1) && this.shopify.getTab(TAB.CHILD_TAB1).toLowerCase() === tab.id.toLowerCase()){
        this.state.selectedTab = index;
      }
    });
    // this.state.selectedTab = 1;
  }

  handleTabChange = (selectedTabIndex) => {
    let subTab = '';
    if ( selectedTabIndex == 1 ) {
      subTab = offerTabs[0].name;
    }
    console.log("handleTabChange", subTab);
    this.setState({selectedTab: parseInt(selectedTabIndex), subTab});
  }

  handleSubtabChange = (id, name) => {
    console.log("handleSubtabChange", id, name);
    this.setState({subTab: name});
  }

  render() {
    if (this.state.wait == false && this.checkConfig() == false) {
      return <MustConfigure/>;
    }

    return (
        <Page separator fullWidth>
            {this.renderTabs()}
        </Page>
    );
  }

  renderTabs() {
    const selected = parseInt(this.state.selectedTab);
    let help_tag = this.tabs[selected].panelID;

    return (
      <Card>
        <Stack alignment={"center"} wrap={false}>
          <Stack.Item fill>
            <Tabs tabs={ this.tabs } selected={selected} onSelect={this.handleTabChange}/>
          </Stack.Item>
          <Stack.Item><CsHelpButton page={"Actions"} tag={help_tag} sub_tag={this.state.subTab}/></Stack.Item>
          <Stack.Item/>
        </Stack>
        {this.renderTab(selected)}
      </Card>
    );
  }

  renderTab(selected) {
    let tab_id = this.tabs[selected].id;
    switch (tab_id) {
      case 'orders':
        return <OrderList/>;
      case 'catalog':
        return <Catalog onTabChange={this.handleSubtabChange}/>;
      case 'feeds':
        return <Feeds/>;
      case 'operations':
        return <Operations/>;
      case 'scheduler':
        return <ScheduleList/>;
      case 'failures':
        return <FailuresTab/>;
    }
  }

}

export default Actions;
