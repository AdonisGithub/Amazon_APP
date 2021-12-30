import React from 'react';
import {
    Badge,
    Banner,
    Button,
    ButtonGroup,
    Card,
    Caption,
    FormLayout,
    Heading,
    Icon,
    ResourceList,
    Select,
    Spinner,
    Stack,
    Tabs,
    TextContainer,
    Layout
} from '@shopify/polaris'


import CsI18n from "../../components/csI18n";
import States from "../../helpers/rules/states";
import Constants from "../../helpers/rules/constants";
import MatchingGroupForm from "./matchingGroupForm";
import CsToggleButton from "../../components/csToggleButton/csToggleButton";
import CsInlineHelp from "../../components/csInlineHelp/csInlineHelp";
import Util from "../../helpers/Util";
import MarketplaceTab from "../../helpers/marketplace-tab";
import CsErrorMessage from "../../components/csErrorMessage";
import {ModelContext} from "./model-context";
import ModelTab from "./model-context";
import ConfigurationApiCall from "../../functions/configuration-api-call";
import CsVideoTutorialButton from "../../components/csVideoTutorialButton";
import VideoTutorial from "../../helpers/VideoTutorial";

export class MatchingGroup extends ModelTab {

    static contextType = ModelContext;

    state = {
        ...this.state,
        wait: false,
        status: States.STATE_NORMAL,
        currentEdit: -1,
        selectedMarketplaceTab: 0,
        updated: false,
        processing: false,
        error: false,
    }

    constructor(props) {
        super(props);
        this.initialState = Util.clone(this.state);
        this.unMounted = false;
        this.listCreate = [];
        this.listUpdate = [];
    }

    componentWillMount() {
        super.componentWillMount();
        this.initConfig();
    }

    componentWillUnmount() {
        this.unMounted = true;
    }

    initConfig() {
        this.defaults = {
            ...this.defaults,
            matchingGroup: [], //saved markups
        };
        let initConfig = this.configurationGetCurrent();
        console.log("initConfig", initConfig, this.defaults);

        let config = {...this.defaults, ...initConfig};
        this.data = Util.clone(config);
    }

    handleMarketplaceTabChange = (value) => {
        this.setState({
            selectedMarketplaceTab: value,
        });
    }

    handlerAddButton = () => {
        console.log('handleAddButton');
        this.setState( {status: States.STATE_ADD, currentEdit: this.data.matchingGroup.length} );
    };

    handlerEdit = (index) => () => {
        console.log('handleEditButton');
        this.setState({status: States.STATE_EDIT, currentEdit: index})
    }

    handlerChange = (index) => (value) => {
        console.log("handlerChange", index);

        this.doUpdate(index, value);

        this.setState({processing: true});
    }

    doUpdate(index, value) {
        let configuration = this.getSelectedConfigurationName();
        this.data.matchingGroup[index].disabled = !value;
        let matchingGroup = this.data.matchingGroup;

        let config = {...this.defaults, ...this.configurationGetCurrent(), matchingGroup};

        ConfigurationApiCall.post('replace', {section: "groups", configuration}, config,
            (json) => {
                console.log("formSaveSuccess", json);
                this.configurationUpdateCurrent(config);
                this.context.data = config;
                this.setState({processing: false, error: false});
            }, (err) => {
                console.log("formSaveError", err);
                this.data.matchingGroup[index].disabled = value;
                // setTimeout(()=>{this.setState({error:false})}, 10000);
                this.setState({processing: false, error: err});
            })
    }

    handlerFormClose = () => {
        console.log("handlerClose");
        let {status} = this.state;
        status = this.data.matchingGroup.length ? States.STATUS_NORMAL : States.STATE_EMPTY;
        this.setState({
            status,
            currentEdit: -1,
        })
    }

    handlerSave = (data, cbSuccess, cbError) => {
        console.log(data);
        let configuration = this.getSelectedConfigurationName();
        ConfigurationApiCall.post('replace', {section: "groups", configuration}, data,
            (json) => {
                console.log("formSaveSuccess", json);
                cbSuccess(json);

                this.configurationUpdateCurrent(data);
                this.context.data = data;

            }, (err) => {
                console.log("formSaveError", err);
                cbError(err);
            })
    }

    handleGotoModelEdit = (group_id) => {
        console.log("handleGotoModelEdit", group_id);
        let {onGotoEditModel} = this.props;
        onGotoEditModel(group_id);
    }

    handlerFormSave = (matchingGroup, cbSuccess, cbError, is_edit_model) => {
        console.log(matchingGroup);
        this.data.matchingGroup = matchingGroup;
        let config = {...this.defaults, ...this.configurationGetCurrent(), matchingGroup};
        // console.log(matchingGroup, config);
        let group_id = this.data.matchingGroup[this.state.currentEdit].id;
        this.handlerSave(config,
            (json) => {
                if (cbSuccess) {
                    cbSuccess(json, is_edit_model);
                }
                if (is_edit_model) {
                    setTimeout(() => {
                        this.setState({status: States.STATE_NORMAL, currentEdit: -1}, () => {this.handleGotoModelEdit(group_id)});
                    }, 300)
                } else {
                    setTimeout(() => {
                        this.setState({status: States.STATE_NORMAL, currentEdit: -1});
                    }, 3000)
                }
            }, err => {
                cbError(err);
            });
    }

    handlerFormDelete = (cbError) => {
        console.log("markup: handlerFormDelete");
        let {currentEdit} = this.state;

        let group_temp = [];
        let removed_group_id = this.data.matchingGroup[currentEdit].id;
        this.data.matchingGroup.forEach((item, index) => {
            console.log(index, parseInt(currentEdit));
            if (index !== parseInt(currentEdit)) {
                group_temp.push(item);
            }
        });
        let model_temp = [];
        if (this.data.modelList) {
            this.data.modelList.forEach((item, index) => {
                if( item.group_id != removed_group_id ) {
                    model_temp.push(item);
                }
            })
        }
        console.log("handlerFormDelete", group_temp, model_temp);

        let config = {...this.defaults, ...this.configurationGetCurrent(), matchingGroup: group_temp, modelList: model_temp};
        this.handlerSave(config,
            () => {
                let status = group_temp.length ? States.STATE_NORMAL : States.STATE_EMPTY;
                this.data.matchingGroup = group_temp;
                this.data.modelList = model_temp;
                this.setState({status: status, currentEdit: -1})
            }, (err) => {
                cbError(err)
            })
    }

    static compareGroup(a, b) {
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        }
        return 0;
    }

    initList() {
        this.listCreate = [];
        this.listUpdate = [];

        let {selectedMarketplaceTab} = this.state;
        let {marketplaceList} = this.context;
        let {MarketplaceId} = marketplaceList[selectedMarketplaceTab];
        let listCreate = [];
        let listUpdate = [];

        if (this.data.hasOwnProperty('matchingGroup') && this.data.matchingGroup.length) {
            this.data.matchingGroup.forEach((item, index) => {
                if (item && item.marketplace_id === MarketplaceId) {
                    let {is_update_mode} = item;
                    if (is_update_mode) {
                        listUpdate.push({index: index, name: item.groupName, disabled: item.disabled});
                    } else {
                        listCreate.push({index: index, name: item.groupName, disabled: item.disabled});
                    }

                }
            })
            // Sorting alphabetically
            listCreate.sort(MatchingGroup.compareGroup);
            listUpdate.sort(MatchingGroup.compareGroup);
        }
        this.listCreate = listCreate;
        this.listUpdate = listUpdate;
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

    render() {
        console.log(this.state);
        const {status, selectedMarketplaceTab} = this.state;
        if (this.state.wait) {
            return (<div align="center">
                    <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
                </div>);
        } else {
            let {marketplaceList} = this.context;
            return (
                <Layout>
                    {status !== States.STATE_ADD && status !== States.STATE_EDIT ?
                        (<Layout.Section>
                            <Stack>
                                <Stack.Item>
                                    &nbsp;
                                </Stack.Item>
                                <Stack.Item fill>
                                    <MarketplaceTab marketplaceList={marketplaceList}
                                                    selectedMarketplaceTab={selectedMarketplaceTab}
                                                    onChange={this.handleMarketplaceTabChange}>
                                    </MarketplaceTab>
                                </Stack.Item>
                                <Stack.Item>
                                    &nbsp;
                                </Stack.Item>
                            </Stack>
                        </Layout.Section>) : ''
                    }
                    <Layout.Section>
                        {status === States.STATE_EDIT || status === States.STATE_ADD ?
                            this.renderForm() : this.renderList()}
                    </Layout.Section>
                </Layout>
            );
        }
    }

    renderForm() {

        let {status, currentEdit, selectedMarketplaceTab} = this.state;
        const mode = status === States.STATE_ADD ? States.MODE_ADD : States.MODE_EDIT;
        let {marketplaceList, configuration} = this.context;
        return (
            <div>
                <MatchingGroupForm
                    mode={mode}
                    items={this.data.matchingGroup}
                    current={currentEdit}
                    marketplace={marketplaceList[selectedMarketplaceTab]}
                    configuration={configuration}
                    onSave={this.handlerFormSave}
                    onClose={this.handlerFormClose}
                    onDelete={this.handlerFormDelete}
                />
            </div>
        )
    }

    renderCreateList() {
        const resourceName = {singular: 'matching', plural: 'matching-group'};
        if (this.listCreate.length == 0) {
            return null;
        }
        return <Layout.Section>
            <div className="matching-list mb-3">
                <div className={"mb-2"}>
                    <Heading><CsI18n>For products creation</CsI18n></Heading>
                </div>
                <ResourceList
                    resourceName={resourceName}
                    items={this.listCreate}
                    renderItem={this.renderItem}
                    loading={this.state.processing}
                />
            </div>
        </Layout.Section>

    }

    renderUpdateList() {
        const resourceName = {singular: 'matching', plural: 'matching-group'};
        if (this.listUpdate.length == 0) {
            return null;
        }
        return <Layout.Section>
            <div className="matching-list mb-3">
                <div className={"mb-2"}>
                    <Heading><CsI18n>For products update</CsI18n></Heading>
                </div>
                <ResourceList
                    resourceName={resourceName}
                    items={this.listUpdate}
                    renderItem={this.renderItem}
                    loading={this.state.processing}
                />
            </div>
        </Layout.Section>
    }

    renderList() {
        const resourceName = {singular: 'matching', plural: 'matching-group'};
        this.initList();

        let group_count = 0;
        group_count += this.listUpdate.length;
        group_count += this.listCreate.length;
        console.log("renderList", this.listUpdate, this.listCreate);
        if (group_count > 0) {
            return (
                <div>
                    {this.state.error? this.renderError():''}
                    <Layout>
                        {this.renderCreateList()}
                        {this.renderUpdateList()}
                        <Layout.Section>
                            <Card primaryFooterAction={{
                                content: <CsI18n>Add</CsI18n>,
                                onAction: this.handlerAddButton,
                            }}>
                                <CsInlineHelp
                                    content={CsI18n.t("Matching groups allow to create or update a set of products having the same characteristics for instance to group all T-Shirts with short sleeves from a same brand.")}/>
                            </Card>
                        </Layout.Section>
                    </Layout>
                </div>
            )
        } else {
            let heading =
                <Stack>
                    <Stack.Item>
                        <Heading element="h3">{CsI18n.t("No matching group configured yet")}</Heading>
                    </Stack.Item>
                    <Stack.Item>
                        <span className={"csRulesVideoEmptyState"}>
                            <CsVideoTutorialButton url={VideoTutorial.models_matching_groups}/>
                        </span>
                    </Stack.Item>
                </Stack>

            return (
                <Card.Section>
                    <Banner
                        status="default"
                        action={{
                            content: <CsI18n>{Constants.model_add_first_matching_group}</CsI18n>,
                            onAction: this.handlerAddButton
                        }}
                    >
                        {heading}
                        <p>
                            <CsI18n>Matching groups allow to create a set of products having the same characteristics
                                for instance to group all T-Shirts with short sleeves from a same brand</CsI18n><br/>
                            <b><CsI18n>Matching groups are required only to create new products on Amazon or to enrich
                                them</CsI18n></b>
                        </p>
                    </Banner>
                </Card.Section>
            );
        }
    }

    renderItem = (item) => {
        let display_name = '';
        const {name, disabled,  index} = item;
        return (
            <ResourceList.Item id={"matching-" + this.index}>
                <Stack wrap={false}>
                    <Stack.Item>
                        <CsToggleButton checked={!disabled} key={"group-switch-"+index} onChange={this.handlerChange(index)}/>
                    </Stack.Item>

                    <Stack.Item fill>
                        <Heading>
                            {name}
                        </Heading>
                    </Stack.Item>

                    <Stack.Item>
                        <ButtonGroup>
                            <Button onClick={this.handlerEdit(index)} size="slim"><CsI18n>Edit</CsI18n></Button>
                        </ButtonGroup>
                    </Stack.Item>
                </Stack>
            </ResourceList.Item>
        );
    };
}
