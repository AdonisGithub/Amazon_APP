import React from "react";
import AmazonTab from "./helpers/amazon-tab";
import MustConfigure from "./helpers/must-configure";
import ShopifyContext, {TAB} from "./context";
import {
  Card,
  Page,
  Tabs,Stack,
} from "@shopify/polaris";

import OrderTab from "./layouts/reports/orders";
import InventoryTab from "./layouts/reports/Inventory";
import {reportsTabs} from "./constant";
import CsHelpButton from "./components/csHelpButton";

class Reports extends AmazonTab {

  //add for debug
  getName() {
    return "Reports";
  }

  constructor(props) {
    super(props);
    this.shopify = ShopifyContext.getShared();
    this.selectedConfiguration = this.getConfigurationSelectedIndex();
    this.state.wait = true;
    this.state.selectedTab = 0;
    this.setSelectedTab();
  }

  setSelectedTab(){
    this.tabs = reportsTabs.filter((tab) => {
          if ( this.shopify.isAllowedFeature(tab.feature) )
            return true;
          else
            return false;
        }
    );

    this.tabs.forEach((tab, index) => {
      if(this.shopify.getTab(TAB.CHILD_TAB1) && this.shopify.getTab(TAB.CHILD_TAB1).toLowerCase() === tab.id.toLowerCase()){
        this.state.selectedTab = index;
      }
    })
  }

  componentWillMount() {

  }

  handleTabChange = (selectedTabIndex) => {
    console.log("handle change" + selectedTabIndex);
    console.log(selectedTabIndex);

    this.setState({selectedTab: parseInt(selectedTabIndex)});
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
          <Stack.Item><CsHelpButton page={"Reports"} tag={help_tag}/></Stack.Item>
          <Stack.Item/>
        </Stack>
          {this.renderTab(selected)}
      </Card>
    );
  }

  renderTab(selected) {
    console.log("Selected Marketplace:", this.state.selectedTab, ", Selected Tab:", selected);

    let tab_id = this.tabs[Number(selected)].id;
    switch (tab_id) {
      case 'orders':
        return <OrderTab/>;
      case 'inventory':
        return <InventoryTab/>;
    }
  }

}

export default Reports;
