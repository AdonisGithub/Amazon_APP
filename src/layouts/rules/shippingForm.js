import React from "react";
import CsI18n from "./../../components/csI18n"

import States from "../../helpers/rules/states";
import Constants from "../../helpers/rules/constants";

import {
    Button,
    ButtonGroup,
    Card,
    Caption,
    ChoiceList,
    FormLayout,
    ResourceList,
    Select,
    Stack,
    TextField,
    TextStyle, TextContainer,
    Modal, Heading,

} from "@shopify/polaris";
import Util from "../../helpers/Util";
import {CsValidationForm, CsValidation} from '../../components/csValidationForm'
import CsEmbeddedModal from "../../components/csEmbeddedModal";
import {DeleteMinor, PlusMinor} from "@shopify/polaris-icons";

import CsVideoTutorialButton from "../../components/csVideoTutorialButton";
import VideoTutorial from "../../helpers/VideoTutorial";
import AmazonHelper from "../../helpers/AmazonHelper";
import CsAutoComplete from "../../components/csAutocomplete";
import ShopifyContext from "../../context";

const MERCHANT_FULFILLMENT_NETWORK = "MFN";

class ShippingForm extends States {
    static RULES = {name: '', condition: 'all'};
    static CONDITION = {id: 0, condition: '', rule: 0, value: 0};
    static ACTION = {id: 0, action: '', value: ''};
    static SHIPPING = {}

    state = {
        status: States.STATUS_NORMAL,
        opendeletemodal: false,
        rules: null,
        fulfillment_mode: "",
        conditions: [],
        actions: [],
        items: [] //shipping list

    }
    constructor(props) {
        super(props);

        this.shopify = ShopifyContext.getShared();
        this.rules_parameters = this.props.rules_parameters;

        this.new_rule = Util.clone(ShippingForm.RULES);
        this.new_condition = Util.clone(ShippingForm.CONDITION);
        this.new_shipping = Util.clone(ShippingForm.SHIPPING);

        this.unit_options = Constants.UNIT_OF_WEIGHT;

        this.state.rules = this.props.data.rules;
        this.state.fulfillment_mode = this.props.data.fulfillment_mode;
        this.state.conditions = this.props.data.conditions;
        this.state.actions = this.props.data.actions;

        this.state.mode = this.props.mode;
        this.state.updated = false;
        this.state.items = this.props.items;

        let marketplaces = AmazonHelper.getMarketplaceOptions(this.rules_parameters.selected_marketplaces);

        this.marketplaces = marketplaces;
        console.log(this.state, this.marketplaces);
    }

    componentWillReceiveProps(nextProps, nextContext) {

        /*this.state.rules = nextProps.data.rules;
        this.state.conditions = nextProps.data.conditions;
        this.state.actions = nextProps.data.actions;

        this.state.items = nextProps.items;

        this.setState({mode: nextProps.mode})*/
    }

    componentWillUpdate(nextProps, nextState, nextContext) {
        console.log("shippingForm: componentWillUpdate", nextState.updated);
        const {onChange} = this.props;
        if( onChange === undefined )
            return;

        if( nextState.updated === false )
            return true;

        let data = {rules: nextState.rules, fulfillment_mode: nextState.fulfillment_mode, conditions: nextState.conditions, actions: nextState.actions};
        onChange(data);
        nextState.updated = false;
    }

    handleChangeRule = (field) => (value) => {
        let {status, updated, rules} = this.state;
        status = States.STATUS_CHANGED;
        updated = true;
        rules[field] = field === 'name' ?  value : value[0];
        console.log('handleChangeRue, Current State:', this.state);
        console.log('Field:', field);

        this.setState(state => ({
            ...state,
            status,
            updated,
        }));
    }

    handleChangeFulfillmentMode = (value) => {
        let {status, updated} = this.state;
        status = States.STATUS_CHANGED;
        updated = true;

        this.setState(state => ({
            ...state,
            status,
            updated,
            fulfillment_mode: value
        }));
    }

    handleAddCondition = () => {
        let {status, updated} = this.state;
        status = States.STATUS_CHANGED;
        updated = true;
        console.log('handleAddCondition, Current State:', this.state.conditions);

        this.setState(prevState => ({
            conditions: [
                ...prevState.conditions,
                {...this.new_condition, id: prevState.conditions.length},
            ],
            status,
            updated,
        }));
    }

    handleChangeCondition = (field, index) => (value) => {
        let {status, updated, conditions} = this.state;
        status = States.STATUS_CHANGED;
        updated = true;

        if(field === 'condition'){
            conditions[index]['rule'] = 0;
            conditions[index]['value'] = 0;
          }
        if ( field == 'rule' ) {
            let rule = parseInt(this.state.conditions[index]['rule']);
            if (rule === Constants.RULE_EQUAL || rule == Constants.RULE_NOT_EQUAL)
                conditions[index]['value'] = "";
            else
                conditions[index]['value'] = 0;
        }
        conditions[index][field] = value;
        this.setState(state => ({
            ...state,
            status,
            updated,
            conditions,
        }));
    }

    handleDeleteCondition = index => {
        let {status, updated, conditions} = this.state;

        status = States.STATUS_CHANGED;
        updated = true;
        conditions = this.state.conditions.filter((item, i) => index !== i);
        let i = 0;
        conditions = conditions.map(item => ({...item, id: i++}));

        this.setState(state => ({
           ...state,
            status,
            updated,
            conditions,
        }));
    };

    handleAddAction = () => {
        let {status, updated} = this.state;
        status = States.STATUS_CHANGED;
        updated = true;
        console.log('handleAddAction, Current State:', this.state);

        this.setState(prevState => ({
            actions: [
                ...prevState.actions,
                {...this.new_shipping, id: prevState.actions.length}
            ],
            status,
            updated,
        }));
    }

    handleChangeAction = (field, index) => (value) => {
        let {status, updated, actions} = this.state;
        status = States.STATUS_CHANGED;
        updated = true;
        actions[index][field] = value;
        if (field === 'action') {
            actions[index].value = '';
        }

        console.log('handleChangeAction, Current State:', this.state);
        console.log('Field:', field, 'Index:', index);

        this.setState(state => ({
            ...state,
            status,
            updated,
            actions,
        }));
    }

    handleDeleteAction = index => {
        let {status, updated, actions} = this.state;
        status = States.STATUS_CHANGED;
        updated = true;
        actions = this.state.actions.filter((item, i) => index !== i);
        let i = 0;
        actions = actions.map(item => ({...item, id: i++}));

        this.setState(state => ({
           ...state,
           status,
           updated,
           actions,
        }));
    };

    render() {
        console.log(this.state.actions);
        let contextual_message = "";

        const conditions_options = Constants.conditions_conditions;
        const condition_policy = Constants.conditions_policies;
        const condition_rule = Constants.rules_policies;
        const shipping_actions = Constants.shipping_actions;
        const fulfillment_modes = Constants.fulfillment_modes;
        const rules_conditions = Constants.rules_conditions_for_shipping;
        const video = <CsVideoTutorialButton url={VideoTutorial.rules_shipping}/>

        console.log('rules params:', this.rules_parameters);
        console.log('rules:', this.state.rules);
        console.log('conditions:', this.state.conditions);
        console.log('actions:', this.state.actions);

        if (this.state.status == States.STATUS_DUPLICATED) {
            contextual_message = Constants.must_be_unique;
        } else if (this.state.status == States.STATUS_ERROR_REQUIRE_CONDITION) {
            contextual_message = Constants.must_select_condition;
        } else if (this.state.status == States.STATUS_ERROR) {
            contextual_message = this.renderError();
        } else if (this.state.status ==  States.STATUS_SAVED) {
            contextual_message = Constants.saved_successfully;
        }

        let title;
        let heading;

        if (this.props.mode == States.MODE_ADD)
            title = CsI18n.t('New shipping rule');
        else
            title = CsI18n.t('Edit shipping rule');

        heading =
            <Stack>
                <Stack.Item>
                    <Heading element="h3">{title}</Heading>
                </Stack.Item>
                <Stack.Item>
                    <span className={"csRulesVideo"}>
                    {video}
                    </span>
                </Stack.Item>
            </Stack>

        return (
            <CsValidationForm name="shippingform">
                <Card.Section>
                    {heading}
                    {contextual_message}
                    <FormLayout>
                        <FormLayout.Group>
                            <CsValidation>
                                <TextField
                                    value={this.state.rules.name}
                                    label={Constants.friendly_name}
                                    placeholder={CsI18n.t("T-Shirt shipping template with 3 days delay")}
                                    onChange={this.handleChangeRule('name')}
                                    pattern="[ -~]*"
                                    maxLength="32"
                                />
                                {Constants.validation_name_required}
                                {Constants.validation_name_max_length}
                                {Constants.validation_name_pattern}
                            </CsValidation>
                        </FormLayout.Group>
                    </FormLayout>

                    <Card.Section title={CsI18n.t("Rule")}>
                        <FormLayout>
                            <FormLayout.Group>
                                <Stack wrap={true} distribution="fillEvenly">
                                    <Stack.Item>
                                        <ChoiceList
                                            title={CsI18n.t("Products must match")}
                                            choices={conditions_options}
                                            selected={this.state.rules.condition}
                                            onChange={this.handleChangeRule('condition')}
                                        />
                                    </Stack.Item>
                                </Stack>
                            </FormLayout.Group>
                        </FormLayout>
                    </Card.Section>

                    <Card.Section title={CsI18n.t("Fulfillment")}>
                        <FormLayout>
                            <FormLayout.Group>
                                <div style={{padding: "1.2rem 2rem"}}>
                                    <Select
                                        options={fulfillment_modes}
                                        onChange={this.handleChangeFulfillmentMode}
                                        value={this.state.fulfillment_mode}
                                    />
                                </div>
                            </FormLayout.Group>
                        </FormLayout>
                    </Card.Section>
                    <Card.Section title={CsI18n.t("Conditions")}>
                        <ResourceList
                            resourceName={{singular: 'condition', plural: 'conditions'}}
                            items={this.state.conditions}
                            renderItem={(item, index) => {
                                let {id, condition, rule, value} = item;


                                let empty_item = [
                                    {label: '', value: 0, disabled: true},
                                    {label: 'Any', value: 'Any'},
                                ];
                                let condition_items;

                                switch (item.condition) {
                                    case 'c':
                                        condition_items = empty_item.concat(this.rules_parameters.collections);
                                        break;
                                    case 'p':
                                        condition_items = empty_item.concat(this.rules_parameters.product_types);
                                        break;
                                    case 't':
                                        condition_items = empty_item.concat(this.rules_parameters.tags);
                                        break;
                                    case 'v':
                                        condition_items = empty_item.concat(this.rules_parameters.vendors);
                                        break;
                                    case 'm':
                                        condition_items = empty_item.concat(this.marketplaces);
                                        break;
                                    case 'sca':
                                        if(this.rules_parameters.carriers) {
                                            condition_items = empty_item.concat(this.rules_parameters.carriers);
                                        } else {
                                            condition_items = empty_item;
                                        }
                                        break;
                                    default:
                                        condition_items = [{label: '', value: 0, disabled: true}];
                                        break;
                                }
                                let rules_rules;
                                switch(item.condition) {
                                    case 'm':
                                        rules_rules = Constants.rules_rules_only_equal;
                                        break;
                                    case 't':
                                        rules_rules = Constants.rules_rules_contains;
                                        if(rule == Constants.RULE_EQUAL) {
                                            rule = Constants.RULE_CONTAINS;
                                        } else if (rule == Constants.RULE_NOT_EQUAL) {
                                            rule = Constants.RULE_NOT_CONTAINS;
                                        }
                                        break;
                                    default:
                                        rules_rules = Constants.rules_rules_std;
                                        break;

                                }
                                console.log("condition_items", condition_items);
                                console.log("selected condition", condition);
                                return (
                                    <ResourceList.Item
                                        id={index}
                                    >
                                        <Stack wrap={false} fill>
                                            <Stack.Item fill>
                                                <FormLayout>
                                                    <FormLayout.Group condensed>
                                                        <Select
                                                            label={CsI18n.t("When")}
                                                            labelHidden={true}
                                                            options={rules_conditions}
                                                            onChange={this.handleChangeCondition('condition', index)}
                                                            value={condition}
                                                        />
                                                        <Select
                                                            options={rules_rules}
                                                            onChange={this.handleChangeCondition('rule', index)}
                                                            value={parseInt(rule)}
                                                        />
                                                        {
                                                            (parseInt(rule) === Constants.RULE_EQUAL || parseInt(rule) === Constants.RULE_NOT_EQUAL)
                                                                ? (<Select
                                                                    options={condition_items}
                                                                    onChange={this.handleChangeCondition('value', index)}
                                                                    value={value}
                                                                />)
                                                                :
                                                                (<TextField
                                                                    value={value === 0? "":value}
                                                                    onChange={this.handleChangeCondition('value', index)}
                                                                />)
                                                        }
                                                    </FormLayout.Group>
                                                </FormLayout>
                                            </Stack.Item>
                                            <Stack.Item distribution="trailing">
                                                {parseInt(id) === 0 && (
                                                    <Button icon={PlusMinor} onClick={this.handleAddCondition}/>
                                                )}
                                                {parseInt(id) > 0 && (
                                                    <Button icon={DeleteMinor}
                                                            onClick={() => this.handleDeleteCondition(index)}/>
                                                )}
                                            </Stack.Item>

                                        </Stack>
                                    </ResourceList.Item>

                                );
                            }}
                        />
                    </Card.Section>

                    <Card.Section title={CsI18n.t("Action")}>
                        <ResourceList
                            resourceName={{singular: 'action', plural: 'actions'}}
                            items={this.state.actions}
                            renderItem={(item, index) => {
                                const {id, action, value, unit} = item;

                                var action_items = [];
                                var action_content = '';
                                let empty_item = [{label: '', value: 0}];
                                let unitButton = (
                                  <div className="shipping-unit">
                                      <Select
                                        options={empty_item.concat(this.unit_options)}
                                        onChange={this.handleChangeAction("unit", index)}
                                        value={unit ? unit : 0}
                                      />
                                  </div>);

                                switch (item.action) {
                                    case 'g':
                                        if(this.rules_parameters.shipping_groups) {
                                            action_items = this.rules_parameters.shipping_groups;
                                        } else {
                                            action_items = [];
                                        }
                                        action_content =
                                            <CsValidation>
                                                <CsAutoComplete
                                                    isOnlyValue={true}
                                                    options={action_items}
                                                    selected={value}
                                                    allowedInput={true}
                                                    onChange={this.handleChangeAction('value', index)}
                                                />
                                                <CsValidation.Item rule="required"
                                                                     title={CsI18n.t("Value is required")}/>
                                            </CsValidation>

                                        break;
                                    case 'ac':
                                        if(this.rules_parameters.amazon_carriers) {
                                            action_items = this.rules_parameters.amazon_carriers;
                                        } else {
                                            action_items = [];
                                        }
                                        action_content =
                                            <CsValidation>
                                                <CsAutoComplete
                                                    isOnlyValue={true}
                                                    options={action_items}
                                                    selected={value}
                                                    allowedInput={true}
                                                    onChange={this.handleChangeAction('value', index)}
                                                />
                                                <CsValidation.Item rule="required"
                                                                   title={CsI18n.t("Value is required")}/>
                                            </CsValidation>
                                        break;
                                    case 'sm':
                                        if(this.rules_parameters.shipping_methods) {
                                            action_items = this.rules_parameters.shipping_methods;
                                        } else {
                                            action_items = [];
                                        }
                                        action_content =
                                            <CsValidation>
                                                <CsAutoComplete
                                                    isOnlyValue={true}
                                                    options={action_items}
                                                    selected={value}
                                                    allowedInput={true}
                                                    onChange={this.handleChangeAction('value', index)}
                                                />
                                                <CsValidation.Item rule="required"
                                                                   title={CsI18n.t("Value is required")}/>
                                            </CsValidation>
                                        break;
                                    case 's':
                                        if(this.rules_parameters.speed_categories) {
                                            action_items = empty_item.concat(this.rules_parameters.speed_categories);
                                        } else {
                                            action_items = empty_item;
                                        }
                                        action_content =
                                            <Select
                                                options={action_items}
                                                onChange={this.handleChangeAction('value', index)}
                                                value={value}
                                            />
                                        break;
                                    case 'd':
                                        action_items = [];
                                        action_content =
                                            <CsValidation>
                                                <TextField
                                                    value={value}
                                                    placeholder="1"
                                                    onChange={this.handleChangeAction('value', index)}
                                                    pattern="^[0-9]{1,2}$"
                                                    minLength="1"
                                                    maxLength="2"
                                                />
                                                {Constants.validation_delay_required}
                                                {Constants.validation_delay_pattern}
                                                {Constants.validation_delay_max_length}
                                            </CsValidation>
                                        break;
                                    case 'w':
                                        action_items = [];
                                        action_content =
                                            <CsValidation>
                                                <TextField
                                                    value={value}
                                                    placeholder="1"
                                                    onChange={this.handleChangeAction('value', index)}
                                                    pattern="^[0-9\.]*$"
                                                    minLength="1"
                                                    maxLength="6"
                                                    connectedRight={unitButton}
                                                />
                                                {Constants.validation_weight_required}
                                                {Constants.validation_weight_pattern}
                                                {Constants.validation_weight_max_length}
                                            </CsValidation>
                                        break;
                                    default:
                                        action_content =
                                            <Select
                                                options={[]}
                                                readOnly={true}
                                                onChange={() => null}
                                            />
                                        break;
                                }
                                console.log('actions:', action_items);
                                console.log('action selected:', action);
                                return (
                                    <ResourceList.Item
                                        id={index}
                                    >
                                        <Stack wrap={false} fill>
                                            <Stack.Item fill>
                                                <FormLayout>
                                                    <FormLayout.Group condensed>
                                                        <Select
                                                            options={shipping_actions}
                                                            onChange={this.handleChangeAction('action', index)}
                                                            value={action}
                                                        />
                                                        {action_content}
                                                    </FormLayout.Group>
                                                </FormLayout>
                                            </Stack.Item>
                                            <Stack.Item distribution="trailing">
                                                {index == 0 && (
                                                    <Button icon={PlusMinor} onClick={() => this.handleAddAction()}
                                                    />
                                                )}
                                                {index > 0 && (
                                                    <Button icon={DeleteMinor} onClick={() => this.handleDeleteAction(index)}
                                                    />
                                                )}
                                            </Stack.Item>
                                        </Stack>
                                    </ResourceList.Item>

                                );
                            }
                            }
                        />
                    </Card.Section>
                </Card.Section>

                <Card.Section>
                    <CsEmbeddedModal
                        open={this.state.opendeletemodal}
                        onClose={this.handleToggleModal}
                        title={CsI18n.t("Delete")}
                        primaryAction={{
                            content: <CsI18n>Delete</CsI18n>,
                            onAction: this.handlerDelete,
                            destructive: true
                        }}
                        secondaryActions={[
                            {
                                content: <CsI18n>Cancel</CsI18n>,
                                onAction: this.handleToggleModal
                            }
                        ]}
                    >
                        <Modal.Section>
                            <TextContainer>
                                <p>{Constants.text_safe_to_delete}</p>
                            </TextContainer>
                        </Modal.Section>
                    </CsEmbeddedModal>

                    <FormLayout>
                        <FormLayout.Group>
                            <Stack wrap={false}>
                                <Stack.Item fill>
                                    {this.state.mode === States.MODE_EDIT && <Button icon={DeleteMinor} onClick={this.deleteConfirmation} loading={this.state.status === States.STATUS_DELETING } disabled={this.state.status === States.STATUS_DELETING } destructive><CsI18n>Delete</CsI18n></Button>}
                                </Stack.Item>
                                <Stack.Item>
                                    <ButtonGroup>
                                        <Button onClick={this.handlerClose}><CsI18n>Cancel</CsI18n></Button>
                                        <Button onClick={this.handlerSave} loading={this.state.status === States.STATUS_SAVING}
                                                disabled={this.state.status === States.STATUS_SAVING || this.state.status === States.STATUS_SAVED || this.state.status === States.STATUS_NORMAL} primary><CsI18n>Save</CsI18n></Button>
                                    </ButtonGroup>
                                </Stack.Item>
                            </Stack>
                        </FormLayout.Group>
                    </FormLayout>
                </Card.Section>
            </CsValidationForm>
        )
    }

    checkValidation() {
        let valueArr = this.state.items.map(function(item){ return item.rules.name });
        let isDuplicate = valueArr.some(function(item, idx){
            return valueArr.indexOf(item) != idx
        });
        if (isDuplicate) {
            this.setState({status: States.STATUS_DUPLICATED});
            return(false);
        }

        let {fulfillment_mode, actions, conditions} = this.state;
        let hasCondition = false;
        for(let condition of conditions ) {
            console.log("checkValidation", condition);
            if(condition.value != 0 && condition.value != '') {
                hasCondition = true;
                break;
            }
        }
        if (!hasCondition) {
            this.setState({status: States.STATUS_ERROR_REQUIRE_CONDITION});
            return(false);
        }
        console.log("checkValidation is true");
        if (fulfillment_mode == MERCHANT_FULFILLMENT_NETWORK && this.rules_parameters
            && this.rules_parameters.hasOwnProperty('is_mandatory_carrier_marketplace')
            && this.rules_parameters.is_mandatory_carrier_marketplace)
        {
            //check actions
            let bCarrier = false;
            let bShipMethod = false;
            for(let action of actions) {
                if(action.action == 'sm' && action.value) {
                    bShipMethod = true;
                }
                if (action.action == 'ac' && action.value) {
                    bCarrier = true;
                }
            }
            if (!bCarrier || !bShipMethod) {
                this.setState({error: {message: CsI18n.t('Action <Carrier for Amazon> and <Delivery Service/Ship-Method> are required in case Merchant Fulfillment Network.')}, status: States.STATUS_ERROR});
                return false;
            }
        }
        return(true);
    }

    handlerClose = () => {
       const {onClose} = this.props;
        if( onClose === undefined )
            return;

        onClose();
    }

    handlerFormClose = () => {
        console.log("shipping: handlerSave", this.state.data.current, this.state);

        this.updateStatus(States.EVENT_CLOSE);
    }

    handlerSave = () => {
        if( CsValidationForm.validate("shippingform") === false)
            return;

        if (!this.checkValidation()) {
            console.log("checkValidation is false");
            return;
        }

        const {onSave} = this.props;
        if( onSave === undefined )
            return;

        onSave(this.cbSaveDone, this.cbSaveError);
        this.setState({status: States.STATUS_SAVING});
    }

}
export default ShippingForm;
