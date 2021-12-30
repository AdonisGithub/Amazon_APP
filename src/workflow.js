import AmazonTab from "./helpers/amazon-tab";
import React from "react";
import CsI18n from "./components/csI18n"

import Inventory from "./layouts/workflow/inventory";
import Orders from "./layouts/workflow/orders";
import Products from "./layouts/workflow/products";
import CollectionSelector from "./layouts/workflow/collections";
import LocationSelector from "./layouts/workflow/locations";
import Platform from './layouts/workflow/platform';
import Fba from './layouts/workflow/fba';
import ConfigurationApiCall from "./functions/configuration-api-call";

import CsVideoTutorialButton from "./components/csVideoTutorialButton";
import VideoTutorial from "./helpers/VideoTutorial";
import WorkflowTab from "./layouts/workflow/workflow_tab";

import {
    Banner,
    Layout,
    Card,
    Page,
    Spinner,
    Tabs,
    Stack,

} from "@shopify/polaris";
import CsErrorMessage, {ErrorType} from "./components/csErrorMessage/csErrorMessage";
import {workflowTabs} from "./constant/";
import Util from "./helpers/Util";
import Cache from "./helpers/Cache";
import CsHelpButton from "./components/csHelpButton";
import ShopifyContext from "./context";
import Metafields from "./layouts/workflow/metafields";
import FeatureLimited from "./helpers/feature-limited";
import Markup from "./layouts/rules/markup";
import "./layouts/workflow/workflow_ex.scss";

class Workflow extends WorkflowTab {
    state = {
        ...this.state,
        wait: true,
        error: null,
        validationError: null,
        show_help: false,
        marketplacesError: null,
    }

    getName() {
        return "Workflow";
    }

    constructor(props) {
        super(props);
        this.initialState = Util.clone(this.state);
        this.shopify = ShopifyContext.getShared();
        this.marketplaceList = [];

        this.handleChange = this.handleChange.bind(this);
        this.saveForm = this.saveForm.bind(this);

        this.tabs = workflowTabs.filter((tab) => {
                if( this.shopify.isAllowedFeature(tab.feature) )
                    return true;
                else
                    return false;
            }
        );
        this.defaults = Util.clone({...Inventory.default_values, ...Orders.default_values, ...Products.default_values, ...Fba.default_values});

        Cache.removeCachedStoreInfo("locations_listing");
        Cache.removeCachedStoreInfo("shop_collections");

        this.removeCachedSetting('marketplace_parameters');
    }

    componentDidMount() {
        this.loadData();
    }

    componentWillReceiveProps(nextProps) {

    }

    componentWillMount() {
        require('./layouts/workflow/workflow.css');
    }

    isDataInit(config) {
        if (config && config.products_import) {
            return true;
        }
    }

    handleTabChange = selectedTabIndex => {

        this.setState({
            selectedTab: parseInt(selectedTabIndex),
            error: null,
            marketplacesError: null,
        });
    }

    handleChange(ev) {

    }

    loadData()
    {
        ConfigurationApiCall.get('get', {
            section: 'workflow',
            configuration: 'global'
        }, this.cbLoadDataSuccess, this.cbConfigurationLoadError);
    }

    cbLoadDataSuccess = (result) => {
        if (this.unMounted) {
            return;
        }
        this.shopify.initTabData(Workflow.SECTION, result);
        this.configurationInitAll();
        this.getMarketplaceList();
        this.configurationLoad();
    }

    cbConfigurationLoadError = (err) => {
        this.setState({error: err, saving: false, wait: false});
    }

    cbConfigurationError = (err) => {

        console.log(err)

        setTimeout(() => {
            this.setState({error: null})
        }, 5000)
        this.setState({error: err, saving: false, wait: false});
    }

    getMarketplaceList = () => {
        this.fetchMarketplaceList(this.cbMarketplacesSuccess, this.cbMarketplaceError);
    }

    cbMarketplacesSuccess = (json) => {
        if (this.unMounted) {
            return;
        }
        if (json) {
            this.marketplaceList = [];
            if(json.length > 0) {
                for(let row of json) {
                    if(row.HasSellerSuspendedListings) {
                        continue;
                    }
                    this.marketplaceList.push(row);
                }
            }
            this.setState({wait: false})
        }
    }

    cbMarketplaceError = (err) => {
        if (err && this.unMounted === false) {
            // setTimeout(( ) => {
            //   this.setState({error: null})
            // }, 5000)
            this.setState({marketplacesError: err, wait: false})
        }
    }
    render() {
        console.log(this.state)
        console.log(this.marketplaceList);

        return (
            <Page fullWidth>
                <div className={"cs-layout"} data-recording-gdpr-safe>
                    <Layout>
                <Layout.AnnotatedSection
                    title={CsI18n.t("Workflow")}
                    description={CsI18n.t("Configure behaviors")}
                >
                    {this.renderTabs()}
                </Layout.AnnotatedSection>
                    </Layout>
                </div>
            </Page>
        );
    }

    handleHelp = (value) => {
        this.setState({show_help: value});
    }

    renderTabs() {
        let contextual_message = "";
        let validation_message = '';

        if (this.state.error) {
            contextual_message = this.renderError(this.state.error);
        } else if(this.state.validationError) {
            validation_message = this.renderError({type: ErrorType.CUSTOM, message: this.state.validationError});
        }
        if (this.state.saved) {
            contextual_message = (
                <Card>
                    <Banner status="success" title={CsI18n.t("Parameters saved successfully")}/>
                </Card>)
        }

        const selected = parseInt(this.state.selectedTab);
        let help_tag = this.tabs[selected].panelID;

        if (this.state.wait) {
            return (
                <div align="center">
                    <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}/>
                </div>
            );
        } else {
            let class_name = this.state.saving? "disabled-block":"";
            return (
                <div className={class_name}>
                    {contextual_message}
                    <Card
                        primaryFooterAction={{
                            content: <CsI18n>Save</CsI18n>,
                            onAction: this.saveForm,
                            loading: this.state.saving,
                            disabled: this.state.saving
                        }}
                    >
                        <div>
                            <Stack alignment={"center"} wrap={false} spacing={"tight"}>
                                <Stack.Item fill>
                                    <Tabs tabs={this.tabs} selected={selected} onSelect={this.handleTabChange}/>
                                </Stack.Item>
                                <Stack.Item>
                                    <CsHelpButton page={"Workflow"} tag={help_tag}/>
                                </Stack.Item>
                                <Stack.Item>
                                    <CsVideoTutorialButton
                                        url={VideoTutorial.workflow}/>
                                </Stack.Item>
                                <Stack.Item/>
                            </Stack>
                            <br/>
                            {validation_message}
                            {this.renderTab(selected)}
                        </div>
                    </Card>
                </div>
            );
        }
    }

    renderTab(selected) {

        if (this.state.marketplacesError || this.marketplaceList === null) {
            return this.renderError(this.state.marketplacesError)
        }

        let tab = this.tabs[Number(selected)];
        let tab_id = tab.id;
        let tab_head = null;
        if (!ShopifyContext.getShared().isAllowByPlan(tab)) {
            tab_head = <FeatureLimited/>;
        }
        let tab_body = '';

        switch (tab_id) {
            // case 'feature':
            //     return <Feature config={this.state} />;
            case 'platform':
                tab_body = <Platform config={this.state}
                                 marketplaceList={this.marketplaceList}/>;
                break;
            case 'inventory':
                tab_body = <Inventory config={this.state}/>;
                break;
            case 'orders':
                tab_body = <Orders config={this.state}/>;
                break;
            case 'products':
                tab_body = <Products config={this.state}/>;
                break;
            case 'metafields':
                tab_body = <Metafields config={this.state}/>;
                break;
            case 'fba':
                tab_body = <Fba config={this.state}/>;
                break;
            case 'locations':
                tab_body = <LocationSelector config={this.state} marketplaceList={this.marketplaceList}/>;
                break;
            case 'collections':
                tab_body = <CollectionSelector config={this.state}/>;
                break;
        }
        if (!tab_head) {
            return tab_body;
        }
        return <React.Fragment>{tab_head}{tab_body}</React.Fragment>
    }

    renderError(error) {
        let type;
        let title;
        let message;

        if (error.type == ErrorType.INVALID_PARAM) {
            if (error.message) {
                title = error.message;
            } else if (this.marketplaceList === null) {
                title = "No marketplaces information";
            }
        } else {
            type = error.type;
            message = error.message;
        }
        return (
            <CsErrorMessage
                errorTitle={title}
                errorType={type}
                errorMessage={message}
            />
        )
    }

    cbSaveForm = (json) => {
        if (this.unMounted) {
            return;
        }

        Cache.removeCachedStoreInfo('store_step');
        let configurationData = this.configurationGetCurrent();
        let configuration = this.shopify.getConfigurationSelected();
        // this.shopify.updateSelectedFeatures(configuration, configurationData.selected_features);
        let locations = [];
        if( Array.isArray(configurationData.locations) ) {
            locations = configurationData.locations.filter((item) => { return item? true:false});
        }
        let collections = [];
        if( Array.isArray(configurationData.collections) ) {
            collections = configurationData.collections.filter((item) => { return item? true:false});
        }
        let selectedMarketplaces = [];
        if( Array.isArray(configurationData.selected_marketplaces) ) {
            selectedMarketplaces = configurationData.selected_marketplaces.filter((item) => { return item? true:false});
        }

        console.log("workflow-cbSave", locations, collections);
        let hasLocations = (locations && locations.length > 0 )? true:false;
        let hasCollections = (collections && collections.length > 0 )? true:false;
        let hasSelectedMarketplacs = (selectedMarketplaces&& selectedMarketplaces.length > 0)? true:false;
        this.shopify.updateSettingStatus(configuration, 'locations', hasLocations);
        this.shopify.updateSettingStatus(configuration, 'collections', hasCollections);
        this.shopify.updateSettingStatus(configuration, 'selected_marketplaces', hasSelectedMarketplacs);
        this.shopify.updateSettingStatus(configuration, 'is_exist_scheduler', true);

        this.removeCachedAllSetting();
        let {onUpdate} = this.props;
        if( onUpdate ) {
            onUpdate();
        }
        this.setState({saving: false, saved: true});
        setTimeout(() => {
            if (this.unMounted) {
                return;
            }
            this.setState({saved: false});
        }, 3000);
    }

    validateForm(configurationData) {
        console.log("saveForm", configurationData);
        if(configurationData.fba_sync_option && configurationData.fba_sync_option[0] == 'multi' ) {
            if( !configurationData.fba_sync_location) {
                let validationError = CsI18n.t('Amazon FBA') + ' > ' + CsI18n.t('please select a location');
                console.log("validateForm", validationError);
                setTimeout(() => {
                    this.setState({validationError: null});
                }, 5000);
                this.setState({validationError: validationError});
                return false;
            }
            if (configurationData.fba_sync_location && !configurationData.locations.includes(configurationData.fba_sync_location)) {
                configurationData.locations.push(configurationData.fba_sync_location);
            }
        }

        if(configurationData.sync_shopify && configurationData.sync_shopify[0] == 'when-inventory-import') {
            if( !configurationData.sync_shopify_location) {
                let validationError = CsI18n.t('Inventory') + ' > ' + CsI18n.t('please select a location');
                console.log("validateForm", validationError);
                setTimeout(() => {
                    this.setState({validationError: null});
                }, 5000);
                this.setState({validationError: validationError});
                return false;
            }
            if (configurationData.sync_shopify_location && !configurationData.locations.includes(configurationData.sync_shopify_location)) {
                configurationData.locations.push(configurationData.sync_shopify_location);
            }
        }
        return true;
    }

    saveForm() {
        //var configurationData={...this.configurationGetCurrent(),...this.getShopifyConfigurations()};
        let configurationData = {...this.configurationGetCurrent()}; // Commented on 2019/10/05 we don't need in the workflow to have the whole configuration
        if(!this.validateForm(configurationData)) {
            return;
        }
        this.setState({saving: true});
        let configuration = this.shopify.getConfigurationSelected();
        ConfigurationApiCall.post("replace", {
            section: "workflow",
            configuration: configuration
        }, configurationData, this.cbSaveForm, this.cbConfigurationError);
    }
}

export default Workflow;
