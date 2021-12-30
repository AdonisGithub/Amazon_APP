import React from "react";
import HelpTab from "./layouts/help/tab";

import {
    Card,
    Page,
    Tabs,

} from "@shopify/polaris";
import {helpTabs} from "./constant";
import ShopifyContext from "./context";
import {TAB} from './context';

class Help extends React.Component {

    static getHelpUrl(tab) {
        let shopifyContext = ShopifyContext.getShared();
        if (!shopifyContext)
            return "";
        return shopifyContext.getAppBaseUrl() + "/help/" + tab;
    }

    static getSupportUrl() {
        let shopifyContext = ShopifyContext.getShared();
        if (!shopifyContext)
            return "";
        return shopifyContext.getAppBaseUrl() + "/support/";
    }

    constructor(props) {
        super(props);

        this.shopify = ShopifyContext.getShared();

        this.state = {
            selectedTab: 0,
            section: "",
        }

        console.log("help: constructor:", this.shopify.store_tab);
        for (let i = 0; i < helpTabs.length; i++) {
            if (this.shopify.getTab(TAB.CHILD_TAB1) == (helpTabs[i].tab)) {
                this.state.selectedTab = i;
                break;
            }
        }
        if(this.shopify.getTab(TAB.CHILD_TAB2)) {
            this.state.section = this.shopify.getTab(TAB.CHILD_TAB2);
        }
    }

    componentWillMount() {
        require("./layouts/help/help.css");
    }

    handleTabChange = index => {

        this.setState({selectedTab: parseInt(index), section:""});
    }

    render() {
        const selected = parseInt(this.state.selectedTab);
        const tabs = helpTabs.map(item => ({
            id: item.tab,
            content: item.title,
            accessibilityLabel: item.title,
            panelID: item.tab
        }));

        var footerAction = null;
        return (
            <Page>
                <Card
                    primaryFooterAction={footerAction}
                >
                    <div className={"help-center"}>
                        <Tabs tabs={tabs} selected={selected} onSelect={this.handleTabChange}/>
                        {this.renderTab(selected)}
                    </div>
                </Card>
            </Page>
        );
    }

    renderTab(selected) {
        return (<HelpTab lang={this.shopify.lang} page_param={helpTabs[selected].param} page={helpTabs[selected].tab} section={this.state.section}/>)
    }
}

export default Help;
