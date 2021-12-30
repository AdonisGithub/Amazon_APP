import React from 'react';
import {
    Page,
    Button,
    Card,
    ChoiceList,
    Collapsible,
    DisplayText,
    Modal,
    FormLayout,
    OptionList,
    ResourceList,
    Select,
    Stack,
    TextContainer,
    TextField, ButtonGroup, TextStyle, Tooltip, Icon, Badge, Banner, Link, Heading, Spinner, Layout, Tag
} from "@shopify/polaris";
import {ChevronDownMinor, ChevronUpMinor, ChevronRightMinor} from '@shopify/polaris-icons';

import {CsValidationForm, CsValidation} from "../../components/csValidationForm";
import CsI18n from "../../components/csI18n";
import States from "../../helpers/rules/states";
import Constants from "../../helpers/rules/constants";
import Util from "../../helpers/Util";
import MarketplaceTab from "../../helpers/marketplace-tab";

import {ModelContext} from "./model-context";
import ModelTab from "./model-context";

import ConfigurationApiCall from "../../functions/configuration-api-call";

import CsErrorMessage from "../../components/csErrorMessage";
import ApplicationApiCall from "../../functions/application-api-call";

import CsAutoComplete from '../../components/csAutocomplete';
import default_mapping_data from "./mapping_data.json";
import MappingMarketplace from "./mapping_marketplace";

export class Mappings extends ModelTab {

    static contextType = ModelContext;

    state = {
        ...this.state,
        wait: true,
        selectedMarketplaceTab: 0,
        updated: false,
        opened: [],
        status: States.STATUS_NORMAL,
    }

    constructor(props) {
        super(props);
        this.initialState = Util.clone(this.state);
        this.unMounted = false;
    }

    componentWillMount() {
        require("./mapping.css");
    }

    getMarketplaceId() {
        let {selectedMarketplaceTab} = this.state;
        let {marketplaceList} = this.context;
        let {MarketplaceId} = marketplaceList[selectedMarketplaceTab];
        return MarketplaceId;
    }

    componentWillUnmount() {
        this.unMounted = true;
    }

    handleMarketplaceTabChange = (value) => {
        this.setState({
            wait: true, selectedMarketplaceTab: value,
        }, this.loadMapping);
    }

    render() {
        console.log("render", this.state);
        const {selectedMarketplaceTab} = this.state;
        let {marketplaceList} = this.context;
        let marketplace_id = this.getMarketplaceId()

        return (
            <Page fullWidth={true}>
                <Layout>
                    <Layout.Section>
                        <MarketplaceTab marketplaceList={marketplaceList}
                                        selectedMarketplaceTab={selectedMarketplaceTab}
                                        onChange={this.handleMarketplaceTabChange}/>
                    </Layout.Section>
                    <MappingMarketplace key={`mapping-${marketplace_id}`} marketplace_id={marketplace_id} />
                </Layout>
            </Page>
        )
    }

    renderError() {
        console.log(this.state.error);
        return (
            <CsErrorMessage
                errorType={this.state.error.type}
                errorMessage={this.state.error.message}
            />
        )
    }
}
