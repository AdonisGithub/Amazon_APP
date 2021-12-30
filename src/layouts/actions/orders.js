import AmazonTab from "../../helpers/amazon-tab";
import React from 'react'
import CsI18n from "../../components/csI18n"

import {
    Layout,
    Page,
    Stack,
} from '@shopify/polaris';
import ShopifyContext, {TAB} from "../../context"
import "./orders/orders.css"
import ImportableTab from "./orders/importableTab";
import ImportedTab from "./orders/importedTab";
import FulfillmentTab from "./orders/fulfillmentTab";
import FbaTab from "./orders/fbaTab";
import Util from "../../helpers/Util";
import { ordersTabs} from "../../constant";

const IMPORTABLE_TAB = 0;
const IMPORTED_TAB = 1;
const FULFILLMENT_TAB = 2;
const FBA_TAB = 3;

class OrderList extends AmazonTab {

    getName() {
        return "OrderList";
    }

    state = {
        selectedTab : IMPORTABLE_TAB
    }

    constructor(props) {
        super(props);
        this.initialState = Util.clone(this.state);
        this.shopify = ShopifyContext.getShared();
    }

    componentDidMount() {
        this.setSelectedTab();
    }

    setSelectedTab(){
        console.log(this.shopify.getTab(TAB.CHILD_TAB2));
        ordersTabs.forEach((tab, index) => {
            if(this.shopify.getTab(TAB.CHILD_TAB2) && this.shopify.getTab(TAB.CHILD_TAB2).toLowerCase() === tab.id.toLowerCase()){
                this.state.selectedTab = index
                this.setState({selectedTab: index});
            } else {
                this.setState({selected: 0});
            }
        })
    }

    componentWillReceiveProps(nextProps) {
        super.componentWillReceiveProps(nextProps);

        console.log("[componentWillReceiveProps]", nextProps);

        if(this.selectedConfiguration !== this.getConfigurationSelectedIndex()){
            this.selectedConfiguration = this.getConfigurationSelectedIndex();
            this.setState(Util.clone(this.initialState))
            this.setSelectedTab();
        }
    }

    handleTabChange = (tab) => () => {
        this.setState({selectedTab: tab});
    }

    render() {
        console.log(this.state);
        let content = '';
        let {selectedTab} = this.state;
        switch(selectedTab) {
            case IMPORTABLE_TAB:
                content = <ImportableTab/>;
                break;
            case IMPORTED_TAB:
                content = <ImportedTab/>;
                break;
            case FULFILLMENT_TAB:
                content = <FulfillmentTab/>;
                break;
            case FBA_TAB:
                content = <FbaTab/>;
                break;
        }

        return (
          <div className="actions">
          <Page fullWidth>
              <Layout>
                  <Layout.Section>
                      <Stack horizontal wrap={false}>
                          <Stack.Item>
                              <div className="side-bar">
                                  <Stack vertical>
                                      <Stack.Item><a
                                        className={this.state.selectedTab === IMPORTABLE_TAB ? "selected" : ""}
                                        onClick={this.handleTabChange(IMPORTABLE_TAB)}><CsI18n>Importable</CsI18n></a></Stack.Item>
                                      <Stack.Item><a
                                          className={this.state.selectedTab === IMPORTED_TAB ? "selected" : ""}
                                          onClick={this.handleTabChange(IMPORTED_TAB)}><CsI18n>Imported</CsI18n></a></Stack.Item>
                                      <Stack.Item><a
                                          className={this.state.selectedTab === FULFILLMENT_TAB ? "selected" : ""}
                                          onClick={this.handleTabChange(FULFILLMENT_TAB)}><CsI18n>Fulfillment</CsI18n></a></Stack.Item>
                                      <Stack.Item><a
                                          className={this.state.selectedTab === FBA_TAB ? "selected" : ""}
                                          onClick={this.handleTabChange(FBA_TAB)}><CsI18n>FBA</CsI18n></a></Stack.Item>
                                  </Stack>
                              </div>
                          </Stack.Item>
                          <Stack.Item fill>
                              <Layout>
                                  {content}
                              </Layout>
                          </Stack.Item>
                      </Stack>

                  </Layout.Section>
              </Layout>
          </Page>
          </div>
        )
    }
}

export default OrderList;
