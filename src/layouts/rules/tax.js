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


import TaxForm from "./taxForm";
import Util from "../../helpers/Util";
import {instanceOf} from "prop-types";
import CsVideoTutorialButton from "../../components/csVideoTutorialButton";
import VideoTutorial from "../../helpers/VideoTutorial";
import AmazonHelper from "../../helpers/AmazonHelper";
import ShopifyContext from "../../context";
import RuleTab from "./rule_tab";

class Tax extends RuleTab {
    //add for debug
    getName() {
        return "Tax";
    }
    constructor(props) {
        super(props);
        this.shopify = ShopifyContext.getShared();
        this.rules_parameters = this.props.rules_parameters;
        this.defaults = {
            ...this.defaults,
            taxes: [], //saved taxes
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
        let {taxes} = Util.clone(config);
        let data_edit = Util.clone(this.defaults_edit);

        if ( taxes.length ) {
            taxes = taxes.filter(item => (item.hasOwnProperty('rules') && item.rules.name.length));
            data_edit.items  = Util.clone(taxes);
            for (let i = 0; i < data_edit.items.length; i++) {
                data_edit.edit.push(States.EDIT_SAVED); //saved_flag
            }
            config.taxes = taxes;
        }
        this.state.data = config;
        this.data_edit = data_edit;
    }

    componentWillMount() {
        this.updateStatus(States.EVENT_REFRESH);
    }

    componentWillReceiveProps(nextProps) {
        console.log("componentWillReceiveProps");
        this.loadConfig();
        this.rules_parameters = nextProps.rules_parameters;
        this.updateStatus(States.EVENT_REFRESH);
    }

    // update status
    updateStatus = (event, id = -1) => {
        let {data} = this.state;
        let preStatus = this.data_edit.status;
        let status = preStatus;
        let current = this.data_edit.current;

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

                        if (this.state.data.taxes.length > 0) {
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
                        if (parseInt(this.data_edit.current) !== id) {

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
                        if (this.state.data.taxes.length > 0) {
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
                if (this.state.data.taxes.length > 0) {
                    if (this.data_edit.current !== -1 && event !== States.EVENT_REFRESH) {
                        status = States.STATE_EDIT;//Editing
                    } else {
                        current = -1;
                        status = States.STATE_NORMAL;
                    }
                } else {
                    status = this.rules_parameters.shopify_inventory_loaded === 0 ? States.NONE : States.STATE_EMPTY ;
                }
            }
                break;
        }

        console.log("status: ", status, this.state.data);

        this.data_edit.current = current;
        this.data_edit.status = status;
        this.saveState();
        this.setState(state => ({
            ...state,
            status,
            current,
        }));
    }


    doAdd = (data) => {
        let tax = {
            rules: TaxForm.RULES,
            conditions: [TaxForm.CONDITION],
            tax: TaxForm.TAX,
        };
        let id = this.state.data.taxes.length;
        data.taxes[id] = Util.clone(tax);
        this.data_edit.items[id] = Util.clone(tax);
        this.data_edit.edit[id] = States.EDIT_NEW;
        return id;
    }

    doDelete = (data) => {
        let id = parseInt(this.data_edit.current);
        console.log("tax: doDelete", id);

        const taxes = this.state.data.taxes.filter((item, i) => id !== i);
        data.taxes = taxes;
        const items = this.data_edit.items.filter((item, i) => (id !== i));
        this.data_edit.items = items;
        const edit = this.data_edit.edit.filter((item, i) => id !== i);
        this.data_edit.edit = edit;
    }

    doSave = (data) => {
        let id = parseInt(this.data_edit.current);
        console.log("tax: doSave", id);

        data.taxes[id] = Util.clone(this.data_edit.items[id]);
        this.data_edit.edit[id] = States.EDIT_SAVED;
    }

    doClose = (data) => {
        let id = parseInt(this.data_edit.current);
        console.log("tax: doClose", id);

        id = parseInt(id);
        if( this.data_edit.edit[id] === States.EDIT_NEW ) {
            data.taxes = this.state.data.taxes.filter((item, i) => id !== i);
            this.data_edit.items = this.data_edit.items.filter((item, i) => (id !== i));
            this.data_edit.edit = this.data_edit.edit.filter((item, i) => id !== i);
        } else {
            this.data_edit.items[id] = Util.clone(this.state.data.taxes[id]);
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

        console.log("tax: handlerSave", this.data_edit.current, this.state);

        const id = parseInt(this.data_edit.current);
        let taxes = [];
        for (let i = 0; i < this.state.data.taxes.length; i++) {
            if (i === id) {
                taxes.push(this.data_edit.items[i]);
            } else {
                if (this.data_edit.edit[i] < States.EDIT_SAVED)
                    continue;

                taxes.push(this.state.data.taxes[i]);
            }
        }

        let configData = {...this.defaults, ...this.configurationGetCurrent(), taxes};

        const {onSave} = this.props;

        onSave(configData, () => {
              cbSuccess(true);
              this.updateStatus(States.EVENT_SAVE_DONE);
          }, (error) => {
              cbError(error);
          }
        );
    }

    handlerFormClose = () => {
        console.log("tax: handlerSave", this.data_edit.current, this.state);

        this.updateStatus(States.EVENT_CLOSE);
    }

    handlerFormDelete = () => {

        console.log("tax: handlerSave", this.data_edit.current);

        const id = parseInt(this.data_edit.current);
        let taxes = [];
        if (this.data_edit.edit[id] < States.EDIT_SAVED) {
            this.updateStatus(States.EVENT_DELETE_DONE);
        } else {
            for (let i = 0; i < this.state.data.taxes.length; i++) {
                if (this.data_edit.edit[i] < States.EDIT_SAVED)
                    continue;

                if (i === id)
                    continue;
                taxes.push(this.state.data.taxes[i]);
            }

            let configData = {...this.defaults, ...this.configurationGetCurrent(), taxes};

            const {onSave} = this.props;

            onSave(configData, () => {
                this.updateStatus(States.EVENT_DELETE_DONE);
            });
        }
    }

    handlerFormChange = (data) => {

        console.log("tax: handlerFormChange", this.data_edit.current);

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
                    <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}/>
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
                <TaxForm
                    mode={mode}
                    data={data}
                    items={this.data_edit.items}
                    rules_parameters={this.rules_parameters}
                    shopifyContext={this.shopify}
                    onSave={this.handlerFormSave}
                    onClose={this.handlerFormClose}
                    onDelete={this.handlerFormDelete}
                    onChange={this.handlerFormChange}
                />
            );
    }

    renderList() {
        const resourceName = {singular: 'tax', plural: 'taxes'};

        // Let's consider if the rule has no name, this is a wrong rule and we remove it from the list
        // const items = this.state.data.taxes.filter((item, i) => (this.data_edit.edit[i] !== States.EDIT_NEW && item.rules.name.length));
        const items = this.state.data.taxes;
        const hasContent = items.length;
        const status = this.data_edit.status;

        if (hasContent && !(status === States.STATE_EDIT || status === States.STATE_ADD)) {
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
            let heading =
                <Stack>
                    <Stack.Item>
                        <Heading element="h3">{CsI18n.t("No tax rule configured yet")}</Heading>
                    </Stack.Item>
                    <Stack.Item>
                        <span className={"csRulesVideoEmptyState"}>
                            <CsVideoTutorialButton url={VideoTutorial.rules_taxes}/>
                        </span>
                    </Stack.Item>
                </Stack>

            return (
                <Card.Section>
                    <Banner
                        status="default"
                        action={{content: <CsI18n>Add tax rule</CsI18n>, onAction: this.handlerAddButton.bind(this)}}
                    >
                        {heading}
                        <p><CsI18n>it allows to configure the specific tax workflow for Amazon</CsI18n></p>
                    </Banner>
                </Card.Section>
            );
        }
    }

    renderItem = (item, id) => {
        const {name, scope} = item.rules;

        if (!item.rules.name.length) { // filter empty items
            return;
        }

        let tax_category = this.rules_parameters.tax_categories.find(function(tc) {
            return tc.value == item.tax.tax_category;
        });

        let selected_tax_category = tax_category instanceof Object && tax_category.hasOwnProperty('label') && tax_category.label.length ? tax_category.label : '';

        console.log('tax_categories:', this.rules_parameters.tax_categories, tax_category);

        let scope_display;
        let tax_display = '';
        if (scope == 'order') {
            scope_display = CsI18n.t("Order");
            tax_display += " " + CsI18n.t('Item tax rate: {{item_tax_rate}}%, Shipping tax rate: {{shipping_tax_rate}}%',
                {item_tax_rate: item.tax.item_tax_rate, shipping_tax_rate: item.tax.shipping_tax_rate});
        } else {
            scope_display = CsI18n.t("Product");
            tax_display += item.tax.ptc.length || selected_tax_category.length ? CsI18n.t('Tax')  + ': ' : ''
            tax_display += item.tax.ptc.length ? item.tax.ptc : ''
            tax_display += selected_tax_category.length && item.tax.ptc.length ? ', ' : ''
            tax_display += selected_tax_category.length ? selected_tax_category : ''
        }

        return (
            <ResourceList.Item id={id}>
                <Stack wrap={false}>
                    <Stack.Item fill>
                        <Heading>
                            {name}
                        </Heading>
                        <Caption>
                            {CsI18n.t("Scope")}: {scope_display},
                            {tax_display}
                        </Caption>
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

export default Tax;
