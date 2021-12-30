import React from 'react'
import {
    Card,
    Page,
    Spinner,
    Tabs,
    Stack, Scrollable,
} from '@shopify/polaris';
import CsI18n from "./components/csI18n";
import CsErrorMessage from "./components/csErrorMessage";
import Util from "./helpers/Util";
import {modelTabs} from "./constant/model";
import {MatchingGroup} from "./layouts/model/matchingGroup";
import {ModelList} from "./layouts/model/model";
import BulkEdit from "./layouts/model/bulkedit";
import {Mappings} from "./layouts/model/mapping";
import ConfigurationApiCall from "./functions/configuration-api-call";

import ModelTab from "./layouts/model/model-context";
import {ModelContext} from "./layouts/model/model-context";

import {ErrorType} from "./components/csErrorMessage/csErrorMessage";
import Constants from "./helpers/rules/constants";

import CsHelpButton from "./components/csHelpButton";

class Model extends ModelTab {

    getName() {
        return "Models";
    }

    defaultData = {
        matchingGroup: [],
        modelList: [],
    }

    state = {
        ...this.state,
        loading: true,
        initData: false,
        selectedMarketplaceTab: 0,
        selectedTab: 0,
        error: null,
    }

    constructor(props) {
        super(props);
        this.initialState = Util.clone(this.state);

        this.contextData = {
            marketplaceList: [],
            rulesParameter: null,
            data: null,
            universe: [],
            dataDefinition: [],
            dataDefinitionForUpdate: [],
            mapping: [],
            extraData: [],
            metaFieldsProduct: [],
            metaFieldsVariant: [],
            configurationId: -1,
            configuration: "",
            selected_group_id: -1
        }
    }

    componentWillMount() {
        require('./layouts/model/model.scss');
        this.getModelConfiguration();
    }

    componentWillReceiveProps(nextProps) {
        console.log("componentWillReceiveProps", nextProps);
        if (this.contextData.configurationId !== this.getSelectedConfigurationIndex()) {
            this.contextData.configurationId = this.getSelectedConfigurationIndex();
            this.contextData.configuration = this.getSelectedConfigurationName();
            if( this.state.initData ) {
                this.setContextData(this.configurationGetCurrent());
            }
            this.setState(Util.clone(this.initialState), this.getRulesParameters);
        }
    }

    setContextData(data) {
        let defaultData = Util.clone(this.defaultData);
        this.contextData.data = {...defaultData, ...data}; //add for new Tab @kbug.
    }

    getModelConfiguration() {
        let configuration = "global";
        let section = "groups";
        let params = {section, configuration};
        ConfigurationApiCall.get('get', params, this.cbModelConfigurationSuccess, this.cbModelConfigurationError);
    }

    cbModelConfigurationSuccess = (json) => {
        if (this.unMounted) {
            return;
        }
        console.log("cbModelConfigurationSuccess", json, this.shopify.amazon);
        if (json) {
            this.shopify.initTabData(ModelTab.SECTION, json);
            this.configurationInitAll();
            this.getRulesParameters();
        }
    }

    cbModelConfigurationError = (err) => {
        console.log("cbModelConfigurationError", err);

        if (err) {
            this.setState({error: err});
        }
    }

    getRulesParameters() {
        this.fetchRulesParameters(this.cbRulesParametersSuccess, this.cbRulesParameterError);
    }

    cbRulesParametersSuccess = (result) => {
        if (result && this.unMounted === false) {
            console.log(result);
            if( !result.collections || result.collections.length == 0 ) {
                this.cbRulesParameterError({type: ErrorType.INVALID_PARAM, message: CsI18n.t('No collection configured in Workflow > Collections')});
                return;
            }
            this.contextData.rulesParameter = result;
            this.getMarketplaceList();
        }
    }

    cbRulesParameterError = (err) => {
        console.log(err);
        if (err && this.unMounted === false) {
            this.setState({error: err, loading: false})
        }
    }

    initData() {
        this.contextData.configurationId = this.getSelectedConfigurationIndex();
        this.contextData.configuration = this.getSelectedConfigurationName();
        this.setContextData(this.configurationGetCurrent());
        this.setState({loading: false, initData: true});
    }

    getMarketplaceList = () => {
        this.fetchMarketplaceList(this.cbMarketplacesSuccess, this.cbMarketplaceError);
    }

    cbMarketplacesSuccess = (json) => {
        if (json && this.unMounted === false) {
            let marketplaceList = this.getActiveMarketplaceList(json);
            if( marketplaceList.length > 0 ) {
                this.contextData.marketplaceList = marketplaceList;
                this.initData();
            } else {
                this.cbMarketplaceError({type: ErrorType.INVALID_PARAM, message: Constants.must_be_selected_marketplace});
            }
        }
    }

    handleGotoEditModel = (group_id) => {
        this.contextData.selected_group_id = group_id;
        console.log("handleGotoEditModel", group_id);
        this.setState({selectedTab: 1});
    }

    cbMarketplaceError = (err) => {
        if (err && this.unMounted === false) {
            this.setState({error: err, loading: false})
        }
    }

    handleTabSelect = (value) => {
        this.setState({selectedTab: value});
    }

    resetToInitialState = (value) => {
        this.setState(Util.clone(this.initialState), this.getRulesParameters);
    }

    render() {
        console.log(this.state);
        console.log(this.contextData);

        let content;

        if (this.state.loading === true) {
            content = this.renderLoading();
        } else if (this.state.error) {
            content = this.renderError();
        } else {
            content = this.renderTabs();
        }

        return (
            <ModelContext.Provider value={this.contextData}>
                <Page separator fullWidth>
                    <div className="model" data-recording-gdpr-safe>
                        <Card>
                            {content}
                        </Card>
                    </div>
                </Page>
            </ModelContext.Provider>
        )
    }

    renderTabs() {
        let {selectedTab} = this.state;
        let help_tag = modelTabs[selectedTab].panelID;
        return (
            <React.Fragment>
                <Stack alignment={"center"} wrap={false}>
                    <Stack.Item fill>
                        <Tabs selected={selectedTab} tabs={modelTabs} onSelect={this.handleTabSelect}></Tabs>
                    </Stack.Item>
                    <Stack.Item><CsHelpButton page={"Models"} tag={help_tag}/></Stack.Item>
                    <Stack.Item/>
                </Stack>
                {this.renderTab(selectedTab)}
            </React.Fragment>
        )
    }

    renderTab(selectedTab) {
        let model_tabs = [
            <MatchingGroup onGotoEditModel={this.handleGotoEditModel}/>,
            <ModelList changeTab={this.resetToInitialState}/>,
            <BulkEdit />,
            <Mappings />,
        ];
        let content = model_tabs[selectedTab];
        return (content);
    }

    renderLoading() {
        return (
            <div align="center">
                <br/>
                <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}/>
            </div>
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

export default Model;
