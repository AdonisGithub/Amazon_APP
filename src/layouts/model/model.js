import React from 'react';
import {
    Badge,
    Banner,
    Button,
    ButtonGroup,
    Card,
    Caption,
    Heading,
    ResourceList,
    Select,
    Spinner,
    Stack, Tabs, Layout, Avatar
} from '@shopify/polaris'
import CsI18n from "../../components/csI18n";
import States from "../../helpers/rules/states";

import Constants from "../../helpers/rules/constants";
import ModelForm from "./modelForm";
import Util from "../../helpers/Util";
import ApplicationApiCall from "../../functions/application-api-call";
import ConfigurationApiCall from "../../functions/configuration-api-call";

import ShopifyContext from "../../context";
import {ModelContext} from "./model-context";
import ModelTab from "./model-context";
import MarketplaceTab from "../../helpers/marketplace-tab";
import ModelFormForUpdate from "./modelFormForUpdate";

const TEST_MODE = 1;

export class ModelList extends ModelTab {

    static contextType = ModelContext;

    state = {
        ...this.state,
        wait: false,
        status: States.STATE_NORMAL,
        is_update_mode: false,
        selected_group_id: -1,
        currentEdit: -1,
        selectedMarketplaceTab: 0,
        updated: false,
    }

    constructor(props) {
        super(props);
        this.initialState = Util.clone(this.state);
        this.listModelCreate = [];
        this.listModelUpdate = [];
    }

    componentWillMount() {
        super.componentWillMount();
        this.initConfig();
    }

    initConfig() {
        this.defaults = {
            ...this.defaults,
            modelList: [], //saved markups
        };
        let initConfig = this.configurationGetCurrent();
        console.log("initConfig", initConfig, this.defaults);

        let config = {...this.defaults, ...initConfig};
        this.data = Util.clone(config);
        let {marketplaceList, selected_group_id} = this.context;
        this.marketplaceList = marketplaceList;
        // this.initModelList();
        if (selected_group_id >= 0) {
            let matching_group = this.getMatchingGroup(selected_group_id);
            // console.log("initConfig", matching_group);
            if (matching_group) {
                let {marketplace_id: group_marketplace_id, is_update_mode: group_is_update_mode} = matching_group;
                let selectedMarketplaceTab = -1;
                for(let index in this.marketplaceList) {
                    if( this.marketplaceList[index].MarketplaceId == group_marketplace_id ) {
                        selectedMarketplaceTab = parseInt(index);
                        break;
                    }
                }
                // console.log("initConfig", selectedMarketplaceTab);
                if (selectedMarketplaceTab > -1) {
                    let is_add = true;
                    for(let i in this.data.modelList) {
                        if( this.data.modelList[i].group_id == selected_group_id ) {
                            is_add = false;
                            break;
                        }
                    }
                    this.setState({selectedMarketplaceTab, selected_group_id}, () => {
                        // console.log("initConfig -- callback", is_add, group_is_update_mode, selectedMarketplaceTab, selected_group_id);
                        if (is_add) {
                            this.handlerAddButton(group_is_update_mode)();
                        } else {
                            this.handlerEdit(selected_group_id, group_is_update_mode)();
                        }
                    });
                    this.context.selected_group_id = -1;
                }
            }
        }
    }


    handleMarketplaceTabChange = (value) => {
        this.setState({
            selectedMarketplaceTab: value,
        });
    }

    handlerAddButton = (is_update_mode) => () => {
        console.log('handleAddButton');
        this.setState({status: States.STATE_ADD, currentEdit: this.data.modelList.length, is_update_mode});
    };

    handlerEdit = (group_id, is_update_mode) => () => {
        console.log('handleEditButton', group_id);
        for(let i in this.data.modelList) {
            if( this.data.modelList[i].group_id == group_id ) {
                this.setState({status: States.STATE_EDIT, currentEdit: i, is_update_mode: is_update_mode});
                break;
            }
        }
        return;

    }

    // handlerChange = (index) => (value) => {
    //     console.log("handlerChange", index);
    //
    //     this.data.modelList[index].disabled = !value;
    //     this.setState({updated: true});
    // }
    //
    handlerFormClose = () => {
        console.log("handlerClose");
        let {status} = this.state;
        status = this.data.modelList.length ? States.STATUS_NORMAL : States.STATE_EMPTY;
        this.setState({
            status,
            currentEdit: -1,
        });
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

                this.context.mappingData = [];
                this.context.metaDataCandidate = [];

            }, (err) => {
                console.log("formSaveError", err);
                cbError(err);
            })
    }

    handlerDuplicate = (fromGroupId, toGroupId, cbSuccess, cbError) => {
        console.log("handlerDuplicate", fromGroupId, toGroupId);
        let modelList = this.data.modelList;
        let fromModel = false;
        for(let model of modelList) {
            if( model.group_id == fromGroupId ) {
                fromModel = model;
                break;
            }
        }
        if(!fromModel) {
            cbError();
            return;
        }
        let newModel = Util.clone(fromModel);
        newModel.group_id = toGroupId;
        modelList.push(newModel);

        this.data.modelList = modelList;
        let config = {...this.defaults, ...this.configurationGetCurrent(), modelList};
        console.log(modelList, config);
        this.handlerSave(config,
            (json) => {
                cbSuccess();
                this.setState({status: States.STATE_NORMAL, currentEdit: -1});
                setTimeout(() => {
                    this.setState({status: States.STATE_EDIT, currentEdit: modelList.length-1});
                }, 300)
            }, err => {
                cbError(err);
            });
    }

    handlerFormSave = (modelList, cbSuccess, cbError) => {
        this.data.modelList = modelList;
        let config = {...this.defaults, ...this.configurationGetCurrent(), modelList};
        console.log(modelList, config);
        this.handlerSave(config,
            (json) => {
                cbSuccess(json);
                setTimeout(() => {
                    this.setState({status: States.STATE_NORMAL, currentEdit: -1});
                }, 3000)
            }, err => {
                cbError(err);
            });
    }

    handlerFormDelete = (cbError) => {
        console.log("markup: handlerFormDelete");
        let temp = [];
        let {currentEdit} = this.state;

        this.data.modelList.forEach((item, index) => {
            console.log(index, parseInt(currentEdit));
            if (index !== parseInt(currentEdit)) {
                temp.push(item);
            }
        });
        let config = {...this.defaults, ...this.configurationGetCurrent(), modelList: temp};
        this.handlerSave(config,
            () => {
                let status = temp.length ? States.STATE_NORMAL : States.STATE_EMPTY;
                this.data.modelList = temp;
                this.setState({status: status, currentEdit: -1})
            }, (err) => {
                cbError(err)
            })
    }

    getMatchingGroup(groupId) {
        let {matchingGroup} = this.context.data;
        for(let i in matchingGroup) {
            if( matchingGroup[i].id == groupId)
                return matchingGroup[i];
        }
        return null;
    }

    getMarketplaceInfo(marketplace_id) {
        for(let index in this.marketplaceList) {
            if( this.marketplaceList[index].MarketplaceId == marketplace_id ) {
                return this.marketplaceList[index];
            }
        }
    }

    initModelList() {
        let {selectedMarketplaceTab} = this.state;
        let {MarketplaceId} = this.marketplaceList[selectedMarketplaceTab];
        let modelList = this.getModelListByMarketplaceId(MarketplaceId);

        this.listModelCreate = [];
        this.listModelUpdate = [];
        for(let model of modelList) {
            let group = this.getMatchingGroup(model.group_id);
            if (!group) {
                continue;
            }
            let {is_update_mode} = group;
            model.groupName = group.groupName;
            if (is_update_mode) {
                this.listModelUpdate.push(model);
            } else {
                this.listModelCreate.push(model);
            }
        }
    }

    render() {
        console.log("render", this.state);
        const {status, selectedMarketplaceTab} = this.state;
        if (this.state.wait) {
            return (<div align="center">
                    <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
                </div>);
        } else {
            let {marketplaceList} = this.context;
            return (
                <Layout>
                    {this.state.status !== States.STATE_ADD && this.state.status !== States.STATE_EDIT ?
                        (<Layout.Section>
                            <MarketplaceTab marketplaceList={marketplaceList}
                                            selectedMarketplaceTab={selectedMarketplaceTab}
                                            onChange={this.handleMarketplaceTabChange}>
                            </MarketplaceTab>
                        </Layout.Section>) : ''
                    }
                    <Layout.Section>
                        {this.state.status === States.STATE_EDIT || this.state.status === States.STATE_ADD ?
                            this.renderForm() : this.renderList()}
                    </Layout.Section>
                </Layout>
            );
        }
    }

    renderForm() {
        let {status, currentEdit, selectedMarketplaceTab, selected_group_id, is_update_mode} = this.state;
        const mode = status === States.STATE_ADD ? States.MODE_ADD : States.MODE_EDIT;
        let {marketplaceList, configuration} = this.context;
        return (
            <div>
                {!is_update_mode?
                    <ModelForm
                        mode={mode}
                        items={this.data.modelList}
                        group_id={selected_group_id}
                        current={currentEdit}
                        marketplace={marketplaceList[selectedMarketplaceTab]}
                        onSave={this.handlerFormSave}
                        onDuplicate={this.handlerDuplicate}
                        onClose={this.handlerFormClose}
                        onDelete={this.handlerFormDelete}
                    />
                    :
                    <ModelFormForUpdate
                        mode={mode}
                        group_id={selected_group_id}
                        items={this.data.modelList}
                        current={currentEdit}
                        marketplace={marketplaceList[selectedMarketplaceTab]}
                        onSave={this.handlerFormSave}
                        onDuplicate={this.handlerDuplicate}
                        onClose={this.handlerFormClose}
                        onDelete={this.handlerFormDelete}
                    />
                }
            </div>
        )
    }

    getModelListByMarketplaceId ( marketplace_id ) {
        let modelList = [];

        console.log('Matching Groups:', this.data.matchingGroup);

        if (this.data.modelList && this.data.modelList.length) {
            this.data.modelList.forEach((item, index) => {
                for(let i in this.data.matchingGroup) {
                    if( this.data.matchingGroup[i].marketplace_id == marketplace_id && this.data.matchingGroup[i].id == item.group_id ) {
                        item.matching_group_name = this.data.matchingGroup[i].groupName;
                        modelList.push(item);
                        break;
                    }
                }
            });
            // Sorting alphabetically
            modelList.sort(function (a, b) {
                if (a.matching_group_name < b.matching_group_name) {
                    return -1;
                }
                if (a.matching_group_name > b.matching_group_name) {
                    return 1;
                }
                return 0;
            })
        }
        return modelList;
    }

    renderList() {
        const resourceName = {singular: 'model', plural: 'modelList'};
        this.initModelList();
        // let {matchingGroup} = this.context.data;
        // let {marketplaceList} = this.context;
        // let {selectedMarketplaceTab} = this.state;
        // // let {MarketplaceId} = marketplaceList[selectedMarketplaceTab];
        // // let modelList = this.getModelListByMarketplaceId(MarketplaceId);

        console.log("renderList", this.listModelCreate, this.listModelUpdate);
        let {matchingGroup} = this.context.data;

        let modelCount = this.listModelCreate.length + this.listModelUpdate.length;
        if (modelCount > 0 || matchingGroup.length > 0) {
            return (
                <div>
                    <Layout>
                        {this.renderCreateModelList()}
                        {this.renderUpdateModelList()}
                    </Layout>
                </div>
            )
        } else {
            return (
                <Card.Section>
                    <Banner
                        title={CsI18n.t("No matching groups configured yet")}
                        status="warning"
                        action={{
                            content: <CsI18n>{Constants.model_go_to_matching_groups}</CsI18n>,
                            onAction: this.props.changeTab
                        }}
                    >
                        <p><CsI18n>You must create a matching group first.</CsI18n></p>
                    </Banner>
                </Card.Section>
            );
        }
    }

    renderCreateModelList() {
        const resourceName = {singular: 'modelForCreate', plural: 'modelListForCreate'};
        let count = this.listModelCreate.length;
        return (<Layout.Section>
            <div className={"model-list mb-5"}>
                <Stack>
                    <Stack.Item fill><Heading><CsI18n>Models for products creation</CsI18n></Heading></Stack.Item>
                    <Stack.Item><Button primary onClick={this.handlerAddButton(false)}><CsI18n>Add model for products creation</CsI18n></Button></Stack.Item>
                </Stack>
                <div className="list mt-2">
                    {count > 0? (<ResourceList
                        resourceName={resourceName}
                        items={this.listModelCreate}
                        renderItem={this.renderCreateModelItem}
                    />)
                        :
                        <Banner
                            title={CsI18n.t("No models configured yet")}
                            status="default"
                        >
                            <p>
                                <CsI18n>Please create your first model</CsI18n><br/>
                                <CsI18n>Model are used to enrich the data that will be sent to Amazon.</CsI18n>
                            </p>
                        </Banner>
                    }

                </div>
            </div>
            </Layout.Section>);
    }

    renderCreateModelItem = (item, index) => {
        let group = this.getMatchingGroup(item.group_id);
        if( !group ) {
            console.error("group is null");
            return null;
        }

        let groupName = group.groupName;
        console.log("renderItem", item, groupName);

        return (
            <ResourceList.Item id={"model-" + item.group_id}>
                <Stack wrap={false}>
                    <Stack.Item fill>
                        <Heading>
                            {groupName}<Caption>{Util.getRawHtmlElement(item.universe_display_name)}&gt;{Util.getRawHtmlElement(item.product_type_display_name)}</Caption>
                        </Heading>
                    </Stack.Item>
                    <Stack.Item>
                        <Button onClick={this.handlerEdit(item.group_id, false)} size="slim"><CsI18n>Edit</CsI18n></Button>
                    </Stack.Item>
                </Stack>
            </ResourceList.Item>
        );
    };

    renderUpdateModelList() {
        const resourceName = {singular: 'modelForUpdate', plural: 'modelListForUpdate'};
        let count = this.listModelUpdate.length;
        return (<Layout.Section>
            <div className={"model-list mb-5"}>
                <Stack>
                    <Stack.Item fill><Heading><CsI18n>Models for products update</CsI18n></Heading></Stack.Item>
                    <Stack.Item><Button primary onClick={this.handlerAddButton(true)}><CsI18n>Add model for products update</CsI18n></Button></Stack.Item>
                </Stack>
                <div className="list mt-2 mb-5">
                    {count > 0? (<ResourceList
                            resourceName={resourceName}
                            items={this.listModelUpdate}
                            renderItem={this.renderUpdateModelItem}
                        />)
                        :
                        <Banner
                            title={CsI18n.t("No models configured yet")}
                            status="default"
                        >
                            <p>
                                <CsI18n>Please create your first model</CsI18n><br/>
                                <CsI18n>Model are used to enrich the data that will be sent to Amazon.</CsI18n>
                            </p>
                        </Banner>
                    }

                </div>
            </div>
        </Layout.Section>);
    }

    renderUpdateModelItem = (item, index) => {
        let group = this.getMatchingGroup(item.group_id);
        if( !group ) {
            console.error("group is null");
            return null;
        }
        let groupName = group.groupName;
        console.log("renderItem", item, groupName);

        return (
            <ResourceList.Item id={"model-" + item.group_id}>
                <Stack wrap={false}>
                    <Stack.Item fill>
                        <Heading>
                            {groupName}
                        </Heading>
                    </Stack.Item>
                    <Stack.Item>
                        <Button onClick={this.handlerEdit(item.group_id, true)} size="slim"><CsI18n>Edit</CsI18n></Button>
                    </Stack.Item>
                </Stack>
            </ResourceList.Item>
        );
    };
}
