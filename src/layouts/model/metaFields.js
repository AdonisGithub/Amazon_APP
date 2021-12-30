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
import {ChevronDownMinor, ChevronUpMinor} from '@shopify/polaris-icons';

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
import CsToggleButton from "../../components/csToggleButton/csToggleButton";
import MetaFieldEditModal from "./metaFieldEditModal";

export class MetaFields extends ModelTab {

    static contextType = ModelContext;

    state = {
        ...this.state,
        wait: true,
        status: States.STATUS_NORMAL,
        currentEdit: -1,
        deleteIndex: -1,
        selectedMarketplaceTab: 0,
        openedMetaFieldEditModal: false,
        updated: false,
    }

    constructor(props) {
        super(props);
        this.initialState = Util.clone(this.state);
        this.unMounted = false;
    }

    componentWillMount() {
        require("./metaFields.css");
        this.initConfig();
        this.loadData();
    }

    getMarketplaceId() {
        let {selectedMarketplaceTab} = this.state;
        let {marketplaceList} = this.context;
        let {MarketplaceId} = marketplaceList[selectedMarketplaceTab];
        return MarketplaceId;
    }

    loadData = () => {
        this.fetchMetaCandidate(this.getMarketplaceId());
    }

    componentWillUnmount() {
        this.unMounted = true;
    }

    //  metaFieldData = [
    //      { marketplace_id: '', fields: [{universe: '', 'name' => '', 'values' => []}] }
    //  ]
    //
    //

    initConfig() {
        // this.defaults = {
        //     ...this.defaults,
        //     metaFieldData: [], //saved meta fields
        // };
        // let initConfig = this.configurationGetCurrent();
        // console.log("initConfig", initConfig, this.defaults);

        // let config = {...this.defaults, ...initConfig};
        // this.data = Util.clone(config);
        this.universes = [];
        this.candidate = [];
        this.metaFieldData = [];
    }

    fetchMetaCandidate(marketplace_id) {
        let {configuration, metaData} = this.context;
        if (metaData[marketplace_id] != undefined) {
            this.initMetaData(marketplace_id, metaData[marketplace_id]);
            this.setState({wait: false});
            return;
        }
        let params = {configuration, marketplace_id};
        ApplicationApiCall.get('/application/models/metadata',
            params, this.cbFetchMetaCandidateSuccess, this.cbFetchMetaCandidateError);
        this.setState({wait: true});
    }

    cbFetchMetaCandidateSuccess = (json) => {
        console.log("cbFetchMetaCandidateSuccess", json);
        if (this.unMounted)
            return;

        if (!json) {
            console.error("json is null");
            return;
        }
        let marketplace_id = json.marketplace_id;
        let {candidate, metafields} = json;
        let metadata = {candidate, metafields};
        this.context.metaData[marketplace_id] = metadata;
        this.initMetaData(marketplace_id, metadata);
        console.log("cbFetchMetaCandidateSuccess", marketplace_id, metadata);
        this.setState({wait: false});
    }

    cbFetchMetaCandidateError = (err) => {
        console.log("cbFetchMetaCandidateError", err);
        if (err && this.unMounted === false) {
            console.log("cbFetchMappingError: show error");
            // setTimeout(() => {
            //     this.setState({error: null})
            // }, 5000);
            this.setState({error: err, wait: false});
        }
    }

    makeKey(item) {
        return item.universe + "_" + item.name;
    }

    initMetaData(marketplace_id, metaData) {
        this.initMetaFieldData(marketplace_id, metaData.metafields);
        this.initCandidate(marketplace_id, metaData.candidate);
    }

    initMetaFieldData(marketplace_id, data) {
        this.metaFieldData[marketplace_id] = data;
    }

    initCandidate(marketplace_id, candidate) {
        this.candidate = [];
        this.universes = [{label: '', value: ''}];
        let metaDataCandidate = candidate;
        let items = this.metaFieldData[marketplace_id]? this.metaFieldData[marketplace_id]:[];
        for (let key in metaDataCandidate) {
            let fields = [];
            for( let key2 in metaDataCandidate[key].fields) {
                let field = metaDataCandidate[key].fields[key2];
                let founds = items.filter(item => {
                    if (item.name == field.name)
                        return true;
                    else
                        return false;
                });
                if (!founds || founds.length === 0) {
                    fields.push(field);
                }
            }

            if (fields && fields.length) {
                this.universes.push({label: metaDataCandidate[key].universe_display_name, value: metaDataCandidate[key].universe});
                this.candidate[key] = { ...metaDataCandidate[key], fields};
            }
        }
        console.log("initMetaData", candidate, this.universes, this.candidate);
    }

    handleMarketplaceTabChange = (value) => {
        this.setState({
            wait: true, selectedMarketplaceTab: value,
        }, this.loadData);
    }

    handleAddButton = () => {
        console.log('handleAddButton');
        this.setState({currentEdit: -1, openedMetaFieldEditModal: true});
    }

    handlerActive = index => (value) => {
        let marketplace_id = this.getMarketplaceId();
        this.metaFieldData[marketplace_id][index].active = value;
        let item = this.metaFieldData[marketplace_id][index];
        let {configuration} = this.context;
        let params = {configuration, marketplace_id}
        ApplicationApiCall.post('/application/models/savemeta',
            params,
            item,
            (result) => {
                if( !result.error && result.metafield_id) {
                    item.metafield_id = result.metafield_id;
                    let {onSave} = this.props;
                    if (onSave) {
                        onSave(item);
                    }
                }
            },
            () => {

            });
        this.context.metaData[marketplace_id].metafields[index] = item;
        this.setState({updated: true});
    }

    handlerEdit = (index) => () => {
        console.log('handleEditButton', index);
        this.setState({currentEdit: index, openedMetaFieldEditModal: true});
    }

    handlerDelete = (index) => () => {

        let {configuration} = this.context;
        let marketplace_id = this.getMarketplaceId();
        let params = {configuration, marketplace_id, metafield_id: this.metaFieldData[marketplace_id][index].metafield_id};
        ApplicationApiCall.get('/application/models/deletemeta',
            params,
            () => {
                this.metaFieldData[marketplace_id].splice(index, 1);
                this.context.metaData[marketplace_id].metafields = this.metaFieldData[marketplace_id];
                this.initCandidate(marketplace_id, this.context.metaData[marketplace_id].candidate);
                this.setState({deleteIndex: -1});
            },
            () => {
                this.setState({deleteIndex: -1});
            });
        this.setState({deleteIndex : index});
    }

    handleModalClose = () => {
        console.log("handleModalClose");
        this.setState({currentEdit: -1, openedMetaFieldEditModal: false});
    }

    handleModalSave = (item) => {
        console.log("handleModalSave", item);
        let marketplace_id = this.getMarketplaceId();
        let index = this.state.currentEdit;
        if( index !== -1 && this.metaFieldData[marketplace_id] && index < this.metaFieldData[marketplace_id].length ) {
            this.metaFieldData[marketplace_id][this.state.currentEdit] = item;
        } else {
            if( !this.metaFieldData[marketplace_id] ) {
                this.metaFieldData[marketplace_id] = [];
            }
            this.metaFieldData[marketplace_id].push(item);
        }
        this.context.metaData[marketplace_id].metafields = this.metaFieldData[marketplace_id];
        this.initCandidate(marketplace_id, this.context.metaData[marketplace_id].candidate);
        this.setState({currentEdit: -1, openedMetaFieldEditModal: false});
    }

    render() {
        console.log("render", this.state, this.metaFieldData, this.universes, this.candidate);
        const {status, selectedMarketplaceTab} = this.state;
        let {marketplaceList} = this.context;

        let contextual_message;
        if (status === States.STATUS_ERROR) {
            contextual_message = this.renderError();
        } else if (status === States.STATUS_SAVED) {
            contextual_message = Constants.metaData_saved_successfully;
        }

        let marketplace_id = this.getMarketplaceId();
        let metaFieldData = this.metaFieldData[marketplace_id]? this.metaFieldData[marketplace_id]:[];

        return (
            <Layout>
                <Layout.Section>
                    <MarketplaceTab marketplaceList={marketplaceList}
                                    selectedMarketplaceTab={selectedMarketplaceTab}
                                    onChange={this.handleMarketplaceTabChange}/>
                </Layout.Section>
                <Layout.Section>
                    {this.state.wait ?
                        (<div align="center">
                            <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
                        </div>)
                        :
                        <React.Fragment>
                            {(this.universes.length > 1 || metaFieldData.length > 0) ?
                                <div className={"meta-main"}>
                                {contextual_message}
                                <div className="meta-list">
                                    <ResourceList
                                        resourceName={{singular: 'metafield', plural: 'metafields'}}
                                        items={metaFieldData}
                                        renderItem={this.renderItem}
                                    />
                                </div>
                                    {this.universes.length > 1?
                                <Stack>
                                    <Stack.Item fill/>
                                    <Stack.Item><Button onClick={this.handleAddButton} primary={true}><CsI18n>Add</CsI18n></Button></Stack.Item>
                                </Stack>
                                        :''}
                            </div>
                                :
                                this.renderEmptyCandidate()
                            }
                            {this.state.openedMetaFieldEditModal ? (
                                <MetaFieldEditModal
                                    opened={this.state.openedMetaFieldEditModal}
                                    onClose={this.handleModalClose}
                                    onSave={this.handleModalSave}
                                    marketplace_id={marketplace_id}
                                    universe={this.universes}
                                    candidate={this.candidate}
                                    items={metaFieldData}
                                    current={this.state.currentEdit}
                                />) : ''
                            }
                        </React.Fragment>
                        }
                </Layout.Section>
            </Layout>
        )
    }

    renderItem = (item, index) => {
        let display_name = '';
        const {name, active} = item;
        console.log(index, item);
        return (
            <ResourceList.Item id={"metafield-" + this.index}>
                <Stack wrap={false}>
                    <Stack.Item>
                        <CsToggleButton checked={item.active} onChange={this.handlerActive(index)}/>
                    </Stack.Item>

                    <Stack.Item fill>
                        <Heading>
                            {item.universe_display_name + " > " + item.display_name}
                        </Heading>
                    </Stack.Item>

                    <Stack.Item>
                        <Button onClick={this.handlerDelete(index)} size={"slim"}  destructive={true} loading={this.state.deleteIndex == index} disabled={this.state.deleteIndex == index}><CsI18n>Delete</CsI18n></Button>
                    </Stack.Item>
                    <Stack.Item>
                            <Button onClick={this.handlerEdit(index)} size="slim"><CsI18n>Edit</CsI18n></Button>
                    </Stack.Item>
                </Stack>
            </ResourceList.Item>
        );
    };

    renderEmptyCandidate() {
        return (<Card.Section>
            <Banner
                title={CsI18n.t("No model configured yet")}
                status="default"
            >
                <p><CsI18n>Please create models</CsI18n></p>
            </Banner>
        </Card.Section>);
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
