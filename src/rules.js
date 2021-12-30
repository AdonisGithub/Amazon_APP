import React from "react";
import CsI18n from "./components/csI18n"
import CsVideoTutorialButton from "./components/csVideoTutorialButton";
import Markup from "./layouts/rules/markup";
import Sale from "./layouts/rules/sale";
import Filter from "./layouts/rules/filter";
import Inventory from "./layouts/rules/inventory";
import Tax from "./layouts/rules/tax";
import Order from "./layouts/rules/order";
import Shipping from "./layouts/rules/shipping";
import {rulesTabs} from "./constant";
import CategoryRule from "./layouts/rules/category";
import "./layouts/rules/rules.scss"

import ConfigurationApiCall from "./functions/configuration-api-call";

import {
    Banner,
    Layout,
    Card,
    Page,
    Spinner,
    Tabs,
    Stack,
} from "@shopify/polaris";

import CsErrorMessage from "./components/csErrorMessage/csErrorMessage";
import Cache from "./helpers/Cache";

import CsHelpButton from "./components/csHelpButton";
import ShopifyContext from "./context";
import RuleTab from "./layouts/rules/rule_tab";
import Business from "./layouts/rules/business";
import FeatureLimited from "./helpers/feature-limited";

class Rules extends RuleTab {
    //add for debug
    getName() {
        return "Rules";
    }

    constructor(props) {
        super(props);

        this.shopify = ShopifyContext.getShared();
        this.state.wait = true;
        this.selectedConfiguration = this.getConfigurationSelectedIndex();
        this.state.error = null;
        this.unMounted = false;
        console.log( this.shopify, this.state);

        this.tabs = rulesTabs.filter((tab) => {
                if( this.shopify.isAllowedFeature(tab.feature) )
                    return true;
                else
                    return false;
            }
        );
    }

    componentWillMount() {
        ConfigurationApiCall.get('get', {section:'rules', configuration: 'global'}, this.cbLoadConfiguration, this.cbRulesError);
    }

    componentWillReceiveProps(nextProps) {
        console.log("componentWillReceiveProps", nextProps);
        if ( this.getConfigurationSelectedIndex() !== this.selectedConfiguration ) {
            this.selectedConfiguration = this.getConfigurationSelectedIndex();
            this.getRulesParameters();
        }
    }

    componentWillUnmount() {
        this.unMounted = true
    }

    getRulesParameters(){
        this.setState({wait: true, error: null});
        this.fetchRulesParameters(this.cbRulesParameters, this.cbRulesError);
    }

    cbRulesParameters = (result) => {
        if (result && this.unMounted === false) {
            console.log("cbRulesParameters", result);
            this.rules_parameters = result;
            this.setState({wait: false});
        }
    }

    cbRulesError = (err) => {
        if (this.unMounted) {
            return;
        }
        console.log(err);
        if(err && this.unMounted === false){
            setTimeout(() => {
                this.setState({error: null})
            }, 5000);
            this.setState({error: err, wait: false})
        }
    }



    cbLoadConfiguration = (result) => {
        if (this.unMounted) {
            return;
        }
        this.shopify.initTabData(RuleTab.SECTION, result);
        this.configurationInitAll();
        this.getRulesParameters();
    }

    handleTabChange = selectedTabIndex => {
        if (this.unMounted) {
            return;
        }
        console.log("handle change" + selectedTabIndex);
        console.log(selectedTabIndex);

        this.state.selectedTab = parseInt(selectedTabIndex);
        this.getRulesParameters();
    }

    handlerSave = (configData, cbSuccess, cbError) => {
        if (this.unMounted) {
            return;
        }
        console.log(configData, cbSuccess, cbError);
        for ( let key in configData) {
            if( key.toString().indexOf("_edit") !== -1 ) {
                delete configData[key];
            }
        }

        const configuration = this.shopify.getConfigurationSelected();
        ConfigurationApiCall.post("replace", {
            section: "rules",
            configuration: configuration
        }, configData, () => {
            if (this.unMounted) {
                return;
            }
            if ( cbSuccess !== undefined)
                Cache.removeCachedStoreInfo('store_step');
                cbSuccess();
        }, (error) => {
            console.log(error, cbError);
            if ( cbError !== undefined )
                cbError(error);
        });

    }

    checkConfig() {
        if( this.rules_parameters
            && this.rules_parameters.collections
            && this.rules_parameters.product_types
            && this.rules_parameters.tags
            && this.rules_parameters.vendors
        ) {
            return true;
        }
        return false;
    }

    render() {
        console.log(this.state);

        /*if( this.state.wait == false && this.state.error === null && this.checkConfig() == false ) {
            return <MustConfigure />;
        }*/

        return (
            <Page fullWidth>
                <div className={"cs-layout"} data-recording-gdpr-safe>
                <Layout>
                    <Layout.AnnotatedSection
                        title="Rules"
                        description={CsI18n.t("Configure rules")}
                    >
                        {this.state.error !== null ? this.renderError() : this.renderTabs()}
                    </Layout.AnnotatedSection>
                </Layout>
                </div>
            </Page>

        );
    }

    renderTabs()
    {
        var contextual_message = "";
        let help_page = "Rules";
        const selected = parseInt(this.state.selectedTab);
        let help_tag = this.tabs[selected].panelID;

        if (this.state.saved) {
            contextual_message = (
                <div>
                    <Banner status="success" title={CsI18n.t("Parameters saved successfully")} />
                    <br />
                </div> )
        }

        switch(selected) {
            case 'x':
                var footerAction={
                    content: CsI18n.t('Save'),
                    onAction: this.saveForm,
                    loading: this.state.saving,
                    disabled: this.state.saving
                };
                break;
            default:
                var footerAction=null;
                break;
        }

        return(
            <Card
                primaryFooterAction={footerAction}
            >
                <div>
                    {contextual_message}
                    <React.Fragment>
                        <Stack alignment={"center"} wrap={false}>
                            <Stack.Item fill>
                                <Tabs tabs={this.tabs} selected={selected} onSelect={this.handleTabChange}/>
                            </Stack.Item>
                            <Stack.Item>
                                <CsHelpButton page={"Rules"} tag={help_tag}/></Stack.Item>

                            <Stack.Item/>
                        </Stack>
                        {this.state.wait === true ? this.renderLoading() : this.renderTab(selected)}
                    </React.Fragment>
                </div>
            </Card>
        )   ;

    }

    renderTab(selected) {
        console.log("Selected Configuration:", this.getConfigurationSelectedIndex());
        console.log("Selected Tab:", selected);
        let tab = this.tabs[Number(selected)];
        let tab_id = tab.id;
        let tab_head = null;
        if (!ShopifyContext.getShared().isAllowByPlan(tab)) {
            tab_head = <FeatureLimited/>;
        }
        let tab_body = '';
        switch (tab_id) {
            case 'markup':
                tab_body = <Markup shopContext={this.shopify} config={this.state} rules_parameters={this.rules_parameters} onSave={this.handlerSave} />;
                break;
            case 'sale':
                tab_body = <Sale shopContext={this.shopify} config={this.state} rules_parameters={this.rules_parameters} onSave={this.handlerSave} />;
                break;
            case 'business':
                tab_body = <Business config={this.state} rules_parameters={this.rules_parameters} onSave={this.handlerSave} />;
                break;
            case 'filter':
                tab_body = <Filter shopContext={this.shopify} rules_parameters={this.rules_parameters} config={this.state} onSave={this.handlerSave} />;
                break;
            case 'inventory':
                tab_body = <Inventory shopContext={this.shopify} rules_parameters={this.rules_parameters} config={this.state} onSave={this.handlerSave} />;
                break;
            // Suppressed on 2021/04/04 by Olivier, no need anymore, we can handle from models
            case 'categories':
                tab_body = <CategoryRule shopContext={this.shopify} rules_parameters={this.rules_parameters} config={this.state} onSave={this.handlerSave} />;
                break;
            case 'taxes':
                tab_body = <Tax shopContext={this.shopify} rules_parameters={this.rules_parameters} config={this.state} onSave={this.handlerSave} />;
                break;
            case 'orders':
                tab_body = <Order shopContext={this.shopify} rules_parameters={this.rules_parameters} config={this.state} onSave={this.handlerSave} />;
                break;
            case 'shipping':
                tab_body = <Shipping shopContext={this.shopify} rules_parameters={this.rules_parameters} config={this.state} onSave={this.handlerSave} />;
                break;

        }
        if (!tab_head) {
            return tab_body;
        }
        return <React.Fragment>{tab_head}{tab_body}</React.Fragment>
    }

    renderError(){

        console.log(this.state.error);


        return(
          <CsErrorMessage
            errorType={this.state.error.type}
            errorMessage={this.state.error.message}
          />
        )
    }

    renderLoading(){
        return(
            <div align="center">
                <br/>
                <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")} ></Spinner>
                <br/>
            </div>

        );
    }
}
export default Rules;
