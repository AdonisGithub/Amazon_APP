import React from "react";
import CsI18n from "../../../components/csI18n"

import {
    Banner,
    Layout,
    Card,
    Page,
    Spinner,
    Tabs,
    Stack,
} from "@shopify/polaris";

import CsErrorMessage from "../../../components/csErrorMessage/csErrorMessage";
import Cache from "../../../helpers/Cache";

import CsHelpButton from "../../../components/csHelpButton";
import States from "../../../helpers/rules/states";
import FbaShippable from "./fbaShippable";
import FbaShipped from "./fbaShipped";
import ShopifyContext from "../../../context";

class FbaTab extends React.Component {
    getName() {
        return "FbaTab";
    }

    state = {
        selected: 0,
    }

    constructor(props) {
        super(props);

        this.shopify = ShopifyContext.getShared();
        this.unMounted = false;
        this.tabs = [
            {
                id: "shippable",
                content: CsI18n.t('Shippable'),
                accessibilityLabel: CsI18n.t('Shippable'),
                panelID: "shippable",
                hasVideo: true,
            },
            {
                id: "shipped",
                content: CsI18n.t('Shipped'),
                accessibilityLabel: CsI18n.t('Shipped'),
                panelID: "shipped",
                hasVideo: false,
            }
        ];
    }

    componentWillMount() {
        require("./fba.scss");
    }

    componentWillReceiveProps(nextProps) {
    }

    componentWillUnmount() {
        this.unMounted = true
    }

    handleTabChange = (selected) => {
        this.setState({selected});
    }

    render() {
        console.log(this.state);
        let {selected} = this.state;
        return (
            <div style={{width: '100%'}} className={"order-fba"}>
                <Tabs tabs={this.tabs} selected={selected} onSelect={this.handleTabChange}/>
                {this.renderTab(selected)}
            </div>

        );
    }

    renderTab(selected)
    {
        let tab_id = this.tabs[Number(selected)].id;
        switch (tab_id) {
            case 'shippable':
                return <FbaShippable />;
            case 'shipped':
                return <FbaShipped />;
        }
    }
}

export default FbaTab;
