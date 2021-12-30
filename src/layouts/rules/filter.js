import AmazonTab from '../../helpers/amazon-tab'
import React from "react";
import CsI18n from "./../../components/csI18n"

import States from "../../helpers/rules/states";
import Constants from "../../helpers/rules/constants";

import {
    Banner,
    Button,
    ButtonGroup,
    Card,
    Caption,
    ResourceList,
    Stack,
    Spinner,
    Heading,
} from "@shopify/polaris";


import FilterForm from "./filterForm";
import Util from "../../helpers/Util";
import ApplicationApiCall from "../../functions/application-api-call";
import AmazonHelper from "../../helpers/AmazonHelper";
import ShopifyContext from "../../context";
import RuleTab from "./rule_tab";

class Filter extends RuleTab {

    //add for debug
    getName() {
        return "Filter";
    }

    constructor(props) {
        super(props);
        this.shopify = ShopifyContext.getShared();
        this.rules_parameters = this.props.rules_parameters;
        this.defaults = {
            ...this.defaults,
            filters: [], //saved filters
        };

        this.defaults_edit =  {
            items: [], //saved_rules and editing rules
            edit: [],  //item : 1: editing, 2: saved 3: updating( edit after saved),
            current: -1, //
            status: States.STATE_EMPTY,
        };

        this.loadConfig();
    }

    loadConfig() {
        // this.configurationInit(); //load data
        let config = this.configurationGetCurrent();

        config = {...this.defaults, ...config};
        let {filters} = Util.clone(config);
        let data_edit = Util.clone(this.defaults_edit);

        if ( filters.length ) {
            filters = filters.filter(item => (item.hasOwnProperty('rules') && item.rules.name.length));
            data_edit.items  = Util.clone(filters);
            for (let i = 0; i < data_edit.items.length; i++) {
                data_edit.edit.push(States.EDIT_SAVED); //saved_flag
            }
            config.filters = filters;
        }
        this.state.data = config;
        this.data_edit = data_edit;
    }

    componentWillMount() {
        this.updateStatus(States.EVENT_REFRESH);
    }

    componentWillReceiveProps(nextProps) {

        this.loadConfig();
        this.rules_parameters = nextProps.rules_parameters;
        this.updateStatus(States.EVENT_REFRESH);
    }

    // update status
    updateStatus = (event, id = -1) => {
        let {data} = this.state;
        let preStatus = this.data_edit.status;
        let current = this.data_edit.current;
        let status = preStatus;

        console.log("filter: updateStatus", this.data_edit.status, this.state, event, id);
        console.log(preStatus, status);

        switch (event) {
            case States.EVENT_ADD: {
                switch (preStatus) {
                    case States.STATE_ADD:
                        current = -1;
                        status = States.STATE_NORMAL;
                        break;
                    case States.STATE_EMPTY:
                    case States.STATE_NORMAL:
                    case States.STATE_EDIT: {
                        const id = this.doAdd(data);

                        current = id;
                        status = States.STATE_ADD;
                    }
                    default:
                        break;
                }
            }
                break;
            case States.EVENT_DELETE_DONE: {
                switch (preStatus) {
                    case States.STATE_EDIT:
                        this.doDelete(data);
                        current = -1;

                        if (this.state.data.filters.length > 0) {
                            status = States.STATE_NORMAL;
                        } else {
                            status = States.STATE_EMPTY;
                        }
                        break;
                }
            }
                break;
            case States.EVENT_EDIT: {
                switch (preStatus) {
                    case States.STATE_ADD:
                        // accordion behavior
                        current = id;
                        status = States.STATE_EDIT;
                        break;
                    case States.STATE_EDIT:
                    case States.STATE_NORMAL:
                        if (parseInt(current) !== id) {

                            current = id;
                            status = States.STATE_EDIT;
                        } else {
                            // accordion behavior:
                            // the guy is clicking on the Edit button for the second time and for the same ID; we uncollapse the current item (flip/flop)
                            status = States.STATE_NORMAL;
                            current = null;
                        }

                        break;
                }
            }
                break;
            case States.EVENT_SAVE_DONE: {
                switch (preStatus) {
                    case States.STATE_ADD:
                    case States.STATE_EDIT: {
                        this.doSave(data);
                        setTimeout(() => {
                            this.data_edit.current = -1;
                            this.data_edit.status = States.STATE_NORMAL;
                            this.saveState();
                            this.setState(state => ({
                                ...state,
                                data,
                            }));
                        }, 3000);
                        return;
                    }
                    break;
                }
            }
                break;
            case States.EVENT_CLOSE: {
                switch (preStatus) {
                    case States.STATE_ADD:
                    case States.STATE_EDIT: {
                        this.doClose(data);
                        current = -1;
                        if (this.state.data.filters.length > 0) {
                            status = States.STATE_NORMAL;
                        } else {
                            status = States.STATE_EMPTY;
                        }
                    }
                        break;
                }
            }
                break;
            default: {
                if (this.state.data.filters.length > 0) {
                    if (current !== -1 && event !== States.EVENT_REFRESH) {
                        status = States.STATE_EDIT;//Editing
                    } else {
                        status = States.STATE_NORMAL;
                        current = -1;
                    }
                } else {
                    status = this.rules_parameters.shopify_inventory_loaded === 0 ? States.NONE : States.STATE_EMPTY ;
                }
            }
                break;
        }

        this.data_edit.current = current;
        this.data_edit.status = status;
        this.saveState();
        this.setState(state => ({
            ...state,
            data,
        }));
    }


    doAdd = (data) => {
        let filter = {
            rules: FilterForm.RULES,
            conditions: [FilterForm.CONDITION],
            filters: [FilterForm.FILTER],
        };
        let id = this.state.data.filters.length;
        data.filters[id] = Util.clone(filter);
        this.data_edit.items[id] = Util.clone(filter);
        this.data_edit.edit[id] = States.EDIT_NEW;
        return id;
    }

    doDelete = (data) => {
        let id = parseInt(this.data_edit.current);

        console.log("filter: doDelete", id);

        const filters = this.state.data.filters.filter((item, i) => id !== i);

        data.filters = filters;
        const items = this.data_edit.items.filter((item, i) => (id !== i));
        this.data_edit.items = items;
        const edit = this.data_edit.edit.filter((item, i) => id !== i);
        this.data_edit.edit = edit;
    }

    doSave = (data) => {
        let id = parseInt(this.data_edit.current);
        console.log("filter: doSave", id);

        data.filters[id] = Util.clone(this.data_edit.items[id]);
        this.data_edit.edit[id] = States.EDIT_SAVED;
    }

    doClose = (data) => {

        let id = parseInt(this.data_edit.current);
        if( this.data_edit.edit[id] === States.EDIT_NEW ) {
            data.filters = this.state.data.filters.filter((item, i) => id !== i);
            this.data_edit.items = this.data_edit.items.filter((item, i) => (id !== i));
            this.data_edit.edit = this.data_edit.edit.filter((item, i) => id !== i);
        } else {
            this.data_edit.items[id] = Util.clone(this.state.data.filters[id]);
            this.data_edit.edit[id] = States.EDIT_SAVED;
        }
    }

    handlerAddButton = () => {
        this.updateStatus(States.EVENT_ADD);
    }

    handlerEdit(id) {

        this.updateStatus(States.EVENT_EDIT, parseInt(id));
    };

    handlerFormSave = (cbSuccess, cbError) => {

        const id = parseInt(this.data_edit.current);
        let filters = [];
        for (let i = 0; i < this.state.data.filters.length; i++) {
            if (i === id) {
                filters.push(this.data_edit.items[i]);
            } else {
                if (this.data_edit.edit[i] < States.EDIT_SAVED)
                    continue;

                filters.push(this.state.data.filters[i]);
            }
        }

        let configData = {...this.defaults, ...this.configurationGetCurrent(), filters};

        const {onSave} = this.props;

        onSave(configData, () => {
              cbSuccess(true);
              this.updateStatus(States.EVENT_SAVE_DONE);
          }, (error) => {
              cbError(error);
          }
        );
    }

    handleFormSimulate = (cbSuccess=null, cbError=null) => {
        console.log("markup: handleSimulate", this.data_edit.current);
        if (this.data_edit.current < 0) {
            return;
        }
        const id = parseInt(this.data_edit.current);
        let filters = Util.clone(this.data_edit.items[id]);
        console.log(filters);
        let configuration = this.shopify.getConfigurationSelected();
        let params = {configuration, operation: 'filters'};

        ApplicationApiCall.post('/application/rules/simulator', params, {filters: filters}, (json) => {
            if(cbSuccess){
                cbSuccess(json);
            }
        }, (err) => {
            if(cbError){
                cbError(err);
            }
        });

    }

    handlerFormClose = () => {
        console.log("filter: handlerSave", this.data_edit.current, this.state);

        this.updateStatus(States.EVENT_CLOSE);
    }

    handlerFormDelete = () => {

        const id = parseInt(this.data_edit.current);
        let filters = [];
        if (this.data_edit.edit[id] < States.EDIT_SAVED) {
            this.updateStatus(States.EVENT_DELETE_DONE);
        } else {
            for (let i = 0; i < this.state.data.filters.length; i++) {
                if (this.data_edit.edit[i] < States.EDIT_SAVED)
                    continue;

                if (i === id)
                    continue;
                filters.push(this.state.data.filters[i]);
            }

            let configData = {...this.defaults, ...this.configurationGetCurrent(), filters};

            const {onSave} = this.props;

            onSave(configData, () => {
                this.updateStatus(States.EVENT_DELETE_DONE);
            });
        }
    }

    handlerFormChange = (data) => {
        console.log("filter: handlerFormChange", this.data_edit.current);

        const id = parseInt(this.data_edit.current);
        this.data_edit.items[id] = data;
        if (this.data_edit.edit[id] === States.EDIT_SAVED) {
            this.data_edit.edit[id] = States.EDIT_UPDATING;
        }
        this.saveState();
    }

    render() {
        const status = this.data_edit.status;
        if (this.state.wait) {
            return (
                <div align="center">
                    <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
                </div>
            );
        } else {
            return (
                <React.Fragment>
                    {this.renderList()}
                    {(status === States.STATE_EDIT || status === States.STATE_ADD) && this.renderForm()}
                </React.Fragment>
            );
        }
    }

    renderForm() {
        const mode = this.data_edit.status === States.STATE_ADD ? States.MODE_ADD : States.MODE_EDIT;
        const current = this.data_edit.current;
        const data = this.data_edit.items[current];
        return (
                <FilterForm
                    mode={mode}
                    data={data}
                    items={this.data_edit.items}
                    rules_parameters={this.rules_parameters}
                    shopifyContext={this.shopify}
                    onSave={this.handlerFormSave}
                    onSimulate={this.handleFormSimulate}
                    onClose={this.handlerFormClose}
                    onDelete={this.handlerFormDelete}
                    onChange={this.handlerFormChange}
                />
            );
    }

    renderList() {
        const resourceName = {singular: 'filter', plural: 'filters'};

        // Let's consider if the rule has no name, this is a wrong rule and we remove it from the list
        // const items = this.state.data.filters.filter((item, i) => (this.data_edit.edit[i] !== States.EDIT_NEW && item.rules.name.length)); //error //@kbug_190131
        const items = this.state.data.filters;
        const hasContent = items.length;
        const status = this.data_edit.status;

        if (hasContent && !(status === States.STATE_EDIT || status === States.STATE_ADD)) {
            // Sorting alphabetically //DON'T sort because the first shown one is an lower priority than the below one.
            // items.sort(function (a, b) {
            //     if (a.rules.name < b.rules.name) {
            //         return -1;
            //     }
            //     if (a.rules.name > b.rules.name) {
            //         return 1;
            //     }
            //     return 0;
            // })
            return (
              <div className="list">
                  <Card primaryFooterAction={{
                      content: <CsI18n>Add</CsI18n>,
                      onAction: this.handlerAddButton.bind(this),
                  }}>
                      <ResourceList
                        resourceName={resourceName}
                        items={items}
                        renderItem={this.renderItem}
                      />

                  </Card>
              </div>
            )
        }

        if (status === States.NONE) {
            return (
              <Card.Section>
                  <Banner
                      title={CsI18n.t("Inventory is being to be imported or you don\'t have any products listed on Amazon")}
                      status="info"
                  >
                      <p><CsI18n>We are waiting for at least one offer on Amazon.</CsI18n></p>
                  </Banner>
              </Card.Section>
            );
        }

        if (status === States.STATE_EMPTY) {
            return (
                <Card.Section>
                    <Banner
                        title={CsI18n.t("No filter configured yet")}
                        status="default"
                        action={{content: <CsI18n>{Constants.add_first_rule}</CsI18n>, onAction: this.handlerAddButton.bind(this)}}
                    >
                        <p><CsI18n>A filter is used to exclude offers from being published on Amazon
                        </CsI18n></p>
                    </Banner>
                </Card.Section>
            );
        }
    }

    renderItem = (item, id) => {
        let display_name = '';

        const {name} = item.rules;
        let condition = item.rules.condition.toString();
        condition = condition === 'all'? CsI18n.t('All Conditions') : CsI18n.t('Any Condition');

        if (!item.rules.name.length) { // filter empty items
            return;
        }
        return (
            <ResourceList.Item id={id}>
                <Stack wrap={false}>
                    <Stack.Item fill>
                        <Heading>
                            {name}<Caption><CsI18n condition={condition}>{'Products must match: {{condition}}'}</CsI18n></Caption>
                        </Heading>
                    </Stack.Item>
                    <Stack.Item>
                        <ButtonGroup>
                            <Button onClick={this.handlerEdit.bind(this, id)} size="slim"><CsI18n>Edit</CsI18n></Button>
                        </ButtonGroup>
                    </Stack.Item>
                </Stack>
            </ResourceList.Item>
        );
    };


}

export default Filter;
