import React from "react";
import AmazonTab from "./helpers/amazon-tab";
import MustConfigure from "./helpers/must-configure";
import ShopifyContext, {TAB} from "./context";
import {
    Layout,
    Card,
    Page,
    Tabs,
} from "@shopify/polaris";


import LogTab from "./layouts/admin/log";
import { adminTabs } from "./constant";

class AdminTab extends AmazonTab {

    //add for debug
    getName() {
        return "Admin";
    }

    constructor(props) {
        super(props);
        this.shopify = ShopifyContext.getShared();
        this.state.wait = true;
        this.setSelectedTab();
    }

    setSelectedTab(){
        if(this.shopify.getTab(TAB.CHILD_TAB1) === 'log'){
            this.state.selectedTab = 1;
        } else {
            this.state.selectedTab = 0;
        }
    }

    handleTabChange = (selectedTabIndex) => {
        console.log("handle change" + selectedTabIndex);
        console.log(selectedTabIndex);

        this.setState({selectedTab: parseInt(selectedTabIndex)});
    }

    render() {
        console.log(this.shopify);
        if (this.state.wait == false && this.checkConfig() == false) {
            return <MustConfigure/>;
        }

        return (

            <Page separator fullWidth>
                <Layout.Section secondary>
                    {this.renderTabs()}
                </Layout.Section>
            </Page>

        );
    }

    renderTabs() {

        const selected = parseInt(this.state.selectedTab);

        return (
            <Card>
                <Tabs tabs={ adminTabs } selected={selected} onSelect={this.handleTabChange}/>
                {this.renderTab(selected)}
            </Card>
        );
    }

    renderTab(selected) {
        console.log("Selected Marketplace:", this.state.selectedTab, ", Selected Tab:", selected);


        switch (selected) {
            case 0:
                return <div></div>;
            case 1:
                return <LogTab/>;
        }
    }

}

export default AdminTab;
