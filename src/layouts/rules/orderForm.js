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
    Modal,

} from "@shopify/polaris";
import {PlusMinor, DeleteMinor} from "@shopify/polaris-icons";
import Util from "../../helpers/Util";
import {CsValidationForm, CsValidation} from '../../components/csValidationForm'
import CsEmbeddedModal from "../../components/csEmbeddedModal";
import AmazonHelper from "../../helpers/AmazonHelper";
import ShopifyContext from "../../context";

class OrderForm extends States {
    static RULES = {name: '', condition: 'all'};
    static CONDITION = {id: 0, condition: '', rule: 0, value: ""};
    static ACTION = {id: 0, action: '', value: ''};
    static Empty_Item = [{label: '', value: ''}];

    state = {
        status: States.STATUS_NORMAL,
        opendeletemodal: false,
        rules: null,
        other: null,
        conditions: [],
        actions: [],
        items: [] //order list

    }
    constructor(props) {
        super(props);

        this.shopify = ShopifyContext.getShared();
        this.rules_parameters = this.props.rules_parameters;

        this.new_rule = Util.clone(OrderForm.RULES);
        this.new_condition = Util.clone(OrderForm.CONDITION);
        this.new_order = Util.clone(OrderForm.ACTION);

        this.state.rules = this.props.data.rules;
        this.state.conditions = this.props.data.conditions;
        this.state.actions = this.props.data.actions;

        this.state.mode = this.props.mode;
        this.state.updated = false;
        this.state.items = this.props.items;

        this.marketplaces = AmazonHelper.getMarketplaceOptions(this.rules_parameters.selected_marketplaces);
        console.log(this.state, this.marketplaces);
        this.initRuleConditions();
    }

    initRuleConditions() {
        this.rules_conditions = [ ...OrderForm.Empty_Item, {label: CsI18n.t('Amazon marketplace'), value: 'm'}, ...this.props.rules_parameters.orders.heading];
    }

    componentWillReceiveProps(nextProps, nextContext) {

        /*this.state.rules = nextProps.data.rules;
        this.state.conditions = nextProps.data.conditions;
        this.state.actions = nextProps.data.actions;

        this.state.items = nextProps.items;

        this.setState({mode: nextProps.mode})*/
    }

    componentWillUpdate(nextProps, nextState, nextContext) {

        const {onChange} = this.props;
        if( onChange === undefined )
            return;

        if( nextState.updated === false )
            return true;

        let data = {rules: this.state.rules, conditions: this.state.conditions, actions: this.state.actions};
        onChange(data);
        nextState.updated = false;
    }

    handleChangeRule = (field) => (value) => {
        let {status, updated, rules} = this.state;
        status = States.STATUS_CHANGED;
        updated = true;
        rules[field] = field === 'name' ?  value : value[0];

        this.setState(state => ({
            ...state,
            status,
            updated,
            rules,
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
        conditions[index][field] = value;
        console.log('handleChangeCondition, Current State:', this.state);
        console.log('Field:', field, 'Index:', index);

        if ( field === 'rule' ) {
            conditions[index]['value'] = "";
            // if (parseInt(this.state.conditions[index]['rule']) == 0)
            //     conditions[index]['value'] = ""
            // else
            //     conditions[index]['value'] = 0
        }
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
            updated,
            status,
            conditions,
        }));
    };

    handleAddAction = () => {
        let {status,updated} = this.state;
        status = States.STATUS_CHANGED;
        updated = true;
        console.log('handleAddAction, Current State:', this.state);

        this.setState(prevState => ({
            actions: [
                ...prevState.actions,
                {...this.new_order, id: prevState.actions.length}
            ],
            status,
            updated,
        }));
    }

    handleChangeAction = (field, index) => (value) => {
        console.log(field, index, value);
        let {status, updated, actions} = this.state;
        status = States.STATUS_CHANGED;
        updated = true;

        actions[index][field] = value;
        this.setState(state => ({
            ...state,
            status,
            updated,
            actions,
        }));
    }

    handleDeleteAction = index => {
        let {status, updated, conditions} = this.state;
        status = States.STATUS_CHANGED;
        updated = true;
        let actions = this.state.actions.filter((item, i) => index !== i);
        let i = 0;
        actions = actions.map(item => ({...item, id: i++}));

        this.setState(state => ({
            ...state,
            updated,
            status,
            actions,
        }));
    };


    render() {
        console.log(this.rules_parameters, this.state);
        let contextual_message = "";

        const conditions_options = Constants.conditions_conditions;
        const condition_policy = Constants.conditions_policies;
        const condition_rule = Constants.rules_policies;
        const order_actions = Constants.order_actions;
        // const rules_conditions = this.rules_parameters.orders.heading;
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

        var title = CsI18n.t('Edit order rule');
        if (this.props.mode == States.MODE_ADD)
            title = CsI18n.t('New order rule');

        return (
            <CsValidationForm name="orderform">
                <Card.Section title={title}>
                    {contextual_message}
                    <FormLayout>
                        <FormLayout.Group>
                            <CsValidation>
                                <TextField
                                    value={this.state.rules.name}
                                    label={Constants.friendly_name}
                                    placeholder={CsI18n.t('Add tag "important" to prime orders')}
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

                    <Card.Section title={CsI18n.t("Conditions")}>
                        <ResourceList
                            resourceName={{singular: 'condition', plural: 'conditions'}}
                            items={this.state.conditions}
                            renderItem={(item, index) => {
                                const {id, condition, rule, value} = item;

                                let condition_items = [];
                                let rules_rules = Constants.rules_rules_only_equal;

                                if(this.rules_parameters.orders.heading.length > 0){
                                    let [heading] = this.rules_parameters.orders.heading;
                                    console.log('heading', heading);

                                    if( condition == 'm') {
                                        rules_rules = Constants.rules_rules_only_equal;
                                        let empty_item = [
                                            {label: '', value: ''},
                                            {label: 'Any', value: 'Any'},
                                        ];
                                        condition_items = empty_item.concat(this.marketplaces);
                                    } else {
                                        if( condition ) {
                                            let selected = this.rules_parameters.orders.values[condition];
                                            if (selected.boolean) {
                                                condition_items = [...OrderForm.Empty_Item, ...Constants.yes_no];
                                                rules_rules = Constants.rules_rules_only_equal;
                                            } else if (this.rules_parameters.orders.values[condition].values !== null) {
                                                condition_items = [...OrderForm.Empty_Item, ...this.rules_parameters.orders.values[condition].values];
                                                rules_rules = Constants.rules_rules_std;
                                            } else {
                                                condition_items = [];
                                            }
                                        } else {
                                            condition_items = [];
                                        }
                                    }
                                }

                                // i18n map with local labels
                                console.log('condition_items:', condition_items);
                                if (condition_items.length) {
                                    condition_items.map((item, idx, array) => {
                                        if (!Constants.order_condition_mapping.hasOwnProperty(item.value))
                                            return;
                                        array[idx].label = Constants.order_condition_mapping[item.value] || item.label
                                        return(true);
                                    });
                                }

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
                                                            options={this.rules_conditions}
                                                            onChange={this.handleChangeCondition('condition', index)}
                                                            value={condition}
                                                        />
                                                        <Select
                                                            options={rules_rules}
                                                            onChange={this.handleChangeCondition('rule', index)}
                                                            value={parseInt(rule)}
                                                        />
                                                        {
                                                            parseInt(rule) === 0
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
                                const {id, action, value, other} = item;

                                let action_items = [];
                                let empty_item = [{label: '', value: ''}];
                                let is_input_value = false;
                                let no_value = false;
                                let placeholder = '';
                                switch (item.action) {
                                    case 't':
                                        empty_item.push({label: 'Other', value: 'other'});
                                        action_items = empty_item.concat(this.rules_parameters.order_tags);
                                        break;
                                    case 'f':
                                        action_items = empty_item.concat(this.rules_parameters.carriers);
                                        action_items = action_items.concat([{label: CsI18n.t("Other"), value: "other"}]);
                                        break;
                                    case 'uf':
                                        no_value = true;
                                        break;
                                    case 'dont-put-tag':
                                        no_value = true;
                                        break;
                                    case 'p':
                                        is_input_value = true;
                                        placeholder = '#';
                                        break;
                                    case 'dm':
                                        is_input_value = true;
                                        placeholder = '';
                                        break;
                                    default:
                                        action_items = [];
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
                                                    {no_value?
                                                        <FormLayout.Group condensed>
                                                            <Select
                                                                options={order_actions}
                                                                onChange={this.handleChangeAction('action', index)}
                                                                value={action}
                                                            />
                                                        </FormLayout.Group>
                                                        :
                                                        <FormLayout.Group condensed>
                                                            <Select
                                                                options={order_actions}
                                                                onChange={this.handleChangeAction('action', index)}
                                                                value={action}
                                                            />
                                                            {is_input_value? null:
                                                            <Select
                                                                options={action_items}
                                                                onChange={this.handleChangeAction('value', index)}
                                                                value={value}
                                                            />}
                                                            {is_input_value? null:
                                                            <TextField
                                                                disabled={value !== "other"}
                                                                value={value !== "other" ? value : other}
                                                                onChange={this.handleChangeAction('other', index)}
                                                            />}
                                                            {is_input_value? <CsValidation><TextField
                                                                placeholder={placeholder}
                                                                value={value}
                                                                onChange={this.handleChangeAction('value', index)}
                                                            />
                                                                <CsValidation.Item rule="required"
                                                                                   title={CsI18n.t("Value is required")}/>
                                                            </CsValidation>:null}
                                                        </FormLayout.Group>
                                                    }
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
                            }}
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

        let {conditions} = this.state;
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
        return(true);
    }

    handlerClose = () => {
       const {onClose} = this.props;
        if( onClose === undefined )
            return;

        onClose();
    }

    handlerFormClose = () => {

        console.log("order: handlerSave");


        this.updateStatus(States.EVENT_CLOSE);
    }

    handlerSave = () => {
        if( CsValidationForm.validate("orderform") === false)
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
export default OrderForm;
