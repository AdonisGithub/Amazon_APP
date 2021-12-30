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


import ShippingForm from "./shippingForm";
import Util from "../../helpers/Util";
import CsVideoTutorialButton from "../../components/csVideoTutorialButton";
import VideoTutorial from "../../helpers/VideoTutorial";
import AmazonHelper from "../../helpers/AmazonHelper";
import ShopifyContext from "../../context";
import RuleTab from "./rule_tab";

class Shipping extends RuleTab {
    //add for debug
    getName() {
        return "Shipping";
    }
    constructor(props) {
        super(props);
        this.shopify = ShopifyContext.getShared();
        this.rules_parameters = this.props.rules_parameters;
        this.defaults = {
            ...this.defaults,
            shippings: [], //saved shippings
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
        let {shippings} = Util.clone(config);
        let data_edit = Util.clone(this.defaults_edit);

        if ( shippings.length ) {
            shippings = shippings.filter(item => (item.hasOwnProperty('rules') && item.rules.name.length));
            data_edit.items  = Util.clone(shippings);
            for (let i = 0; i < data_edit.items.length; i++) {
                data_edit.edit.push(States.EDIT_SAVED); //saved_flag
            }
            config.shippings = shippings;
        }
        this.state.data = config;
        this.data_edit = data_edit;
        console.log("loadConfig", this.data_edit);
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
        console.log("updateStatus", this.data_edit.status);

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

                        if (this.state.data.shippings.length > 0) {
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
                            this.setState(state => ({
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
                        if (this.state.data.shippings.length > 0) {
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
                if (this.state.data.shippings.length > 0) {
                    if (this.data_edit.current !== -1 && event !== States.EVENT_REFRESH) {
                        status = States.STATE_EDIT;//Editing
                    } else {
                        status = States.STATE_NORMAL;
                        current = -1;
                    }
                } else {
                    status = States.STATE_EMPTY ;
                }
            }
                break;
        }
        this.data_edit.current = current;
        this.data_edit.status = status;
        this.saveState();

        console.log("updateStatus", this.data_edit.status);
        this.setState(state => ({
            ...state,
              data,
        }));
    }


    doAdd = (data) => {
        let shipping = {
            rules: ShippingForm.RULES,
            conditions: [ShippingForm.CONDITION],
            actions: [ShippingForm.ACTION],
        };
        let id = this.state.data.shippings.length;
        data.shippings[id] = Util.clone(shipping);
        this.data_edit.items[id] = Util.clone(shipping);
        this.data_edit.edit[id] = States.EDIT_NEW;
        return id;
    }

    doDelete = (data) => {
        let id = parseInt(this.data_edit.current);

        const shippings = this.state.data.shippings.filter((item, i) => id !== i);
        data.shippings = shippings;
        const items = this.data_edit.items.filter((item, i) => (id !== i));
        this.data_edit.items = items;
        const edit = this.data_edit.edit.filter((item, i) => id !== i);
        this.data_edit.edit = edit;
    }

    doSave = (data) => {
        let id = this.data_edit.current;
        console.log("shipping: doSave", id);

        data.shippings[id] = Util.clone(this.data_edit.items[id]);
        this.data_edit.edit[id] = States.EDIT_SAVED;
    }

    doClose = (data) => {
        let id = this.data_edit.current;
        console.log("shipping: doClose", id);

        id = parseInt(id);
        if( this.data_edit.edit[id] === States.EDIT_NEW ) {
            data.shippings = this.state.data.shippings.filter((item, i) => id !== i);
            this.data_edit.items = this.data_edit.items.filter((item, i) => (id !== i));
            this.data_edit.edit = this.data_edit.edit.filter((item, i) => id !== i);
        } else {
            this.data_edit.items[id] = Util.clone(this.state.data.shippings[id]);
            this.data_edit.edit[id] = States.EDIT_SAVED;
        }
    }

    handlerAddButton = () => {
        this.updateStatus(States.EVENT_ADD);
    }

    handlerEdit(id) {

        console.log("shipping: handlerEdit", id);


        this.updateStatus(States.EVENT_EDIT, parseInt(id));
    };

    handlerFormSave = (cbSuccess, cbError) => {

        const id = parseInt(this.data_edit.current);
        let shippings = [];
        for (let i = 0; i < this.state.data.shippings.length; i++) {
            if (i === id) {
                shippings.push(this.data_edit.items[i]);
            } else {
                if (this.data_edit.edit[i] < States.EDIT_SAVED)
                    continue;

                shippings.push(this.state.data.shippings[i]);
            }
        }

        let configData = {...this.defaults, ...this.configurationGetCurrent(), shippings};

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

        this.updateStatus(States.EVENT_CLOSE);
    }

    handlerFormDelete = () => {

        const id = parseInt(this.data_edit.current);
        let shippings = [];
        if (this.data_edit.edit[id] < States.EDIT_SAVED) {
            this.updateStatus(States.EVENT_DELETE_DONE);
        } else {
            for (let i = 0; i < this.state.data.shippings.length; i++) {
                if (this.data_edit.edit[i] < States.EDIT_SAVED)
                    continue;

                if (i === id)
                    continue;
                shippings.push(this.state.data.shippings[i]);
            }

            let configData = {...this.defaults, ...this.configurationGetCurrent(), shippings};

            const {onSave} = this.props;

            onSave(configData, () => {
                this.updateStatus(States.EVENT_DELETE_DONE);
            });
        }
    }

    handlerFormChange = (data) => {

        const id = parseInt(this.data_edit.current);
        this.data_edit.items[id] = data;
        if (this.data_edit.edit[id] === States.EDIT_SAVED) {
            this.data_edit.edit[id] = States.EDIT_UPDATING;
        }
        this.saveState();
    }

    render() {
        const status = this.data_edit.status;
        console.log("render", this.data_edit.status);
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
                <ShippingForm
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
        const resourceName = {singular: 'shipping', plural: 'shippings'};
        console.log("renderList", this.data_edit.status);

        // Let's consider if the rule has no name, this is a wrong rule and we remove it from the list
        // const items = this.state.data.shippings.filter((item, i) => (this.data_edit.edit[i] !== States.EDIT_NEW && item.rules.name.length));
        const items = this.state.data.shippings;
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
            // if (this.rules_parameters.shipping_groups != undefined && this.rules_parameters.shipping_groups.length)
            // {
                let heading =
                    <Stack>
                        <Stack.Item>
                            <Heading element="h3">{CsI18n.t("No shipping rules configured yet")}</Heading>
                        </Stack.Item>
                        <Stack.Item>
                        <span className={"csRulesVideoEmptyState"}>
                            <CsVideoTutorialButton url={VideoTutorial.rules_shipping}/>
                        </span>
                        </Stack.Item>
                    </Stack>

                return (
                    <Card.Section>
                        <Banner
                            title=""
                            status="default"
                            action={{content: <CsI18n>Add shipping rule</CsI18n>, onAction: this.handlerAddButton.bind(this)}}
                        >
                            {heading}
                            <p><CsI18n>Manage your Amazon shipping templates</CsI18n></p>
                        </Banner>
                    </Card.Section>
                );
            // } else {
            //     return (
            //         <Card.Section>
            //             <Banner
            //                 title={CsI18n.t("Waiting for shipping groups samples")}
            //                 status="info"
            //             >
            //                 <p><CsI18n>You need to create some offers with shipping group on Amazon;</CsI18n><br/><CsI18n>It will allow you to access to this menu and configure your rules.</CsI18n></p>
            //             </Banner>
            //         </Card.Section>
            //     );
            // }
        }
    }

    renderItem = (item, id) => {
        let display_name = '';
        const fulfillment_modes = Constants.fulfillment_modes;
        const {name} = item.rules;
        let condition = item.rules.condition.toString();
        condition = condition === 'all'? CsI18n.t('All Conditions') : CsI18n.t('Any Condition');
        let fulfillment_mode_label = '';
        let fulfillment_mode = item.fulfillment_mode? item.fulfillment_mode:'MFN';
        for(let mode of fulfillment_modes) {
            if( mode.value === fulfillment_mode ) {
                fulfillment_mode_label = mode.label;
                break;
            }
        }

        if (!item.rules.name.length) { // filter empty items
            return;
        }
        return (
            <ResourceList.Item id={id}>
                <Stack wrap={false}>
                    <Stack.Item fill>
                        <Heading>
                            {name}<Caption><CsI18n condition={condition}>{'Products must match: {{condition}}'}</CsI18n>{fulfillment_mode_label? ", " + fulfillment_mode_label:''}</Caption>
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

export default Shipping;
