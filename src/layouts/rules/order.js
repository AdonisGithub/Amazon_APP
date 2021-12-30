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


import OrderForm from "./orderForm";
import Util from "../../helpers/Util";
import CsErrorMessage from "../../components/csErrorMessage";
import AmazonHelper from "../../helpers/AmazonHelper";
import ShopifyContext from "../../context";
import RuleTab from "./rule_tab";

class Order extends RuleTab {
    //add for debug
    getName() {
        return "Order";
    }
    constructor(props) {
        super(props);
        this.shopify = ShopifyContext.getShared();
        this.rules_parameters = this.props.rules_parameters;
        this.defaults = {
            ...this.defaults,
            orders: [], //saved orders
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
        let {orders} = Util.clone(config);
        let data_edit = Util.clone(this.defaults_edit);

        if ( orders.length ) {
            orders = orders.filter(item => (item.hasOwnProperty('rules') && item.rules.name.length));
            data_edit.items  = Util.clone(orders);
            for (let i = 0; i < data_edit.items.length; i++) {
                data_edit.edit.push(States.EDIT_SAVED); //saved_flag
            }
            config.orders = orders;
        }
        this.state.data = config;
        this.data_edit = data_edit;
    }

    componentWillMount() {
        console.log('Will mount', this);

        this.updateStatus(States.EVENT_REFRESH);
    }

    componentWillReceiveProps(nextProps) {
        console.log("componentWillReceiveProps", nextProps.rules_parameters);
        this.rules_parameters = nextProps.rules_parameters;
        this.loadConfig();
        this.updateStatus(States.EVENT_REFRESH);
    }

    // update status
    updateStatus = (event, id = -1) => {
        let {data} = this.state;
        let preStatus = this.data_edit.status;
        let status = preStatus;
        let current = this.data_edit.current;
        console.log("componentWillReceiveProps");


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

                        if (this.state.data.orders.length > 0) {
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
                    case States.STATE_EDIT:
                        this.doSave(data);
                        setTimeout(() => {
                            this.data_edit.current = -1;
                            this.data_edit.status = States.STATE_NORMAL;

                            this.saveState();
                            this.setState(state =>({
                                ...state,
                                data,
                            }));
                        }, 3000);
                        return;
                }
            }
                break;
            case States.EVENT_CLOSE: {
                switch (preStatus) {
                    case States.STATE_ADD:
                    case States.STATE_EDIT: {
                        this.doClose(data);
                        current = -1;
                        if (this.state.data.orders.length > 0) {
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
                if (this.state.data.orders.length > 0) {
                    if (this.data_edit.current !== -1 && event !== States.EVENT_REFRESH) {
                        status = States.STATE_EDIT;//Editing
                    } else {
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

        this.setState(state=> ({
           ...state,
            data,
        }));
    }


    doAdd = (data) => {
        let order = {
            rules: OrderForm.RULES,
            conditions: [OrderForm.CONDITION],
            actions: [OrderForm.ACTION],
        };
        let id = this.state.data.orders.length;
        data.orders[id] = Util.clone(order);
        this.data_edit.items[id] = Util.clone(order);
        this.data_edit.edit[id] = States.EDIT_NEW;
        return id;
    }

    doDelete = (data) => {
        let id = parseInt(this.data_edit.current);
        console.log("status: ", id, this.state.data);

        const orders = this.state.data.orders.filter((item, i) => id !== i);
        data.orders = orders;
        const items = this.data_edit.items.filter((item, i) => (id !== i));
        this.data_edit.items = items;
        const edit = this.data_edit.edit.filter((item, i) => id !== i);
        this.data_edit.edit = edit;
    }

    doSave = (data) => {
        let id = parseInt(this.data_edit.current);
        console.log("order: doSave", id);

        data.orders[id] = Util.clone(this.data_edit.items[id]);
        this.data_edit.edit[id] = States.EDIT_SAVED;
    }

    doClose = (data) => {
        let id = this.data_edit.current
        console.log("order: doClose", id);

        id = parseInt(id);
        if( this.data_edit.edit[id] === States.EDIT_NEW ) {
            data.orders = this.state.data.orders.filter((item, i) => id !== i);
            this.data_edit.items = this.data_edit.items.filter((item, i) => (id !== i));
            this.data_edit.edit = this.data_edit.edit.filter((item, i) => id !== i);
        } else {
            this.data_edit.items[id] = Util.clone(this.state.data.orders[id]);
            this.data_edit.edit[id] = States.EDIT_SAVED;
        }
    }

    handlerAddButton = () => {
        this.updateStatus(States.EVENT_ADD);
    }

    handlerEdit(id) {
        console.log("order: handlerEdit", id);

        this.updateStatus(States.EVENT_EDIT, parseInt(id));
    };

    handlerFormSave = (cbSuccess, cbError) => {
        console.log("order: handlerSave", this.data_edit.current, this.state);


        const id = parseInt(this.data_edit.current);
        let orders = [];
        for (let i = 0; i < this.state.data.orders.length; i++) {
            if (i === id) {
                orders.push(this.data_edit.items[i]);
            } else {
                if (this.data_edit.edit[i] < States.EDIT_SAVED)
                    continue;

                orders.push(this.state.data.orders[i]);
            }
        }

        let configData = {...this.defaults, ...this.configurationGetCurrent(), orders};

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
        console.log("order: handlerSave", this.data_edit.current, this.state);

        this.updateStatus(States.EVENT_CLOSE);
    }

    handlerFormDelete = () => {
        console.log("order: handlerSave", this.data_edit.current);

        const id = parseInt(this.data_edit.current);
        let orders = [];
        if (this.data_edit.edit[id] < States.EDIT_SAVED) {
            this.updateStatus(States.EVENT_DELETE_DONE);
        } else {
            for (let i = 0; i < this.state.data.orders.length; i++) {
                if (this.data_edit.edit[i] < States.EDIT_SAVED)
                    continue;

                if (i === id)
                    continue;
                orders.push(this.state.data.orders[i]);
            }

            let configData = {...this.defaults, ...this.configurationGetCurrent(), orders};

            const {onSave} = this.props;

            onSave(configData, () => {
                this.updateStatus(States.EVENT_DELETE_DONE);
            });
        }
    }

    handlerFormChange = (data) => {
        console.log("order: handlerFormChange", this.data_edit.current);

        const id = parseInt(this.data_edit.current);
        this.data_edit.items[id] = data;
        if (this.data_edit.edit[id] === States.EDIT_SAVED) {
            this.data_edit.edit[id] = States.EDIT_UPDATING;
        }
        this.saveState();
    }

    render() {
        console.log(this.rules_parameters);

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
                <OrderForm
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
        const resourceName = {singular: 'order', plural: 'orders'};

        // Let's consider if the rule has no name, this is a wrong rule and we remove it from the list
        // const items = this.state.data.orders.filter((item, i) => (this.data_edit.edit[i] !== States.EDIT_NEW && item.rules.name.length));
        const items = this.state.data.orders;
        const hasContent = items.length;
        const status = this.data_edit.status;

        console.log('orders: RenderOrders', items);
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
                      <p><CsI18n>We are waiting for at least one product listing on AmazonWe are waiting for at least
                          one offer on Amazon.</CsI18n></p>
                  </Banner>
              </Card.Section>
            );
        }

        if (status === States.STATE_EMPTY) {
            if (this.rules_parameters.orders != undefined && this.rules_parameters.orders.heading != undefined && this.rules_parameters.orders.heading.length)
            {
                return (
                    <Card.Section>
                        <Banner
                            title=""
                            status="default"
                            action={{content: <CsI18n>Add order rule</CsI18n>, onAction: this.handlerAddButton.bind(this)}}
                        >
                            <p><CsI18n>A rule is used to manage orders imported from Amazon</CsI18n></p>
                        </Banner>
                    </Card.Section>
                );
            } else {
                return (
                    <Card.Section>
                        <Banner
                            title={CsI18n.t("Waiting for samples orders")}
                            status="info"
                        >
                            <p><CsI18n>First, you should import some orders from Amazon;</CsI18n><br/><CsI18n>It will allow you to access to this menu and configure your rules.</CsI18n></p>
                        </Banner>
                    </Card.Section>
                );
            }
        }
    }

    renderError(){

        return(
          <CsErrorMessage
            errorType={this.state.error.type}
            errorMessage={this.state.error.message}
          />
        )
    }

    renderItem = (item, id) => {
        let display_name = '';

        const {name} = item.rules;
        let condition = item.rules.condition.toString();
        condition = condition === 'all' ? CsI18n.t('All Conditions') : CsI18n.t('Any Condition');

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

export default Order;
