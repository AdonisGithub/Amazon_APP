import React from "react";
import {debounce} from 'lodash';
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
    Heading,
    ResourceList,
    Select,
    Stack,
    TextField,
    TextStyle, TextContainer,
    Modal,
    Icon,
    Tooltip,
} from "@shopify/polaris";
import Util from "../../helpers/Util";
import {CsValidationForm, CsValidation} from '../../components/csValidationForm'
import Simulator from "./sumulator/simulator";
import CsEmbeddedModal from "../../components/csEmbeddedModal";
import {AlertMinor, CircleInformationMajorMonotone, DeleteMinor, PlusMinor} from "@shopify/polaris-icons";
import CsVideoTutorialButton from "../../components/csVideoTutorialButton";
import VideoTutorial from "../../helpers/VideoTutorial";
import AmazonHelper from "../../helpers/AmazonHelper";
import ShopifyContext from "../../context";
import CsDatePicker from "../../components/csDatePicker";

class BusinessForm extends States {
    static RULES = {name: '', condition: 'all'};
    static CONDITION = {id: 0, condition: 'c', rule: 0, value: 0};
    static BUSINESS_PRICE = {rule: '%', value: "0", quantity_price_rule: '%'}
    static QUANTITY_DISCOUNT = {id: 0, quantity: "0", value: "1"};

    state = {
        status: States.STATUS_NORMAL,
        opendeletemodal: false,
        rules: null,
        conditions: [],
        business_price: null,
        quantity_discounts: [],
        items: [], //markup list
        simulator: null,
        simulating: false,
    }
    constructor(props) {
        super(props);

        this.shopify = ShopifyContext.getShared();
        this.rules_parameters = this.props.rules_parameters;

        this.new_rule = Util.clone(BusinessForm.RULES);
        this.new_condition = Util.clone(BusinessForm.CONDITION);
        this.new_business_price = Util.clone(BusinessForm.BUSINESS_PRICE);
        this.new_quantity_discount = Util.clone(BusinessForm.QUANTITY_DISCOUNT);

        this.state.rules = this.props.data.rules;
        this.state.conditions = this.props.data.conditions;
        this.state.business_price = this.props.data.business_price;
        this.state.quantity_discounts = this.props.data.quantity_discounts;

        this.state.mode = this.props.mode;
        this.state.updated = null;
        this.state.items = this.props.items;
        this.initValues();

        this.debounceHandle = debounce(() => {
            this.handleDoSimulate();
        }, 2000);

        this.marketplaces = AmazonHelper.getMarketplaceOptions(this.rules_parameters.selected_marketplaces);

        console.log(this.state, this.marketplaces);
    }

    initValues() {
        let quantity_candidates = [];
        let i = 0;

        while (i <= 2000) {
            quantity_candidates[i] = {value: i.toString(), label: i.toString()};
            i += i < 50 ? 1 : i < 100 ? 5 : 10;
        }
        this.quantity_candidates = quantity_candidates;

        let percentages = [];
        for (let i = 0; i < 100; i++) {
            percentages[i] = {value: i.toString(), label: i + ' %'};
        }
        this.percentages = percentages;
    }

    componentDidMount() {
        this.handleSimulate();
    }

    componentWillReceiveProps(nextProps, nextContext) {
        console.log("componentWillReceiveProps", nextProps);
    }

    componentWillUpdate(nextProps, nextState, nextContext) {

        const {onChange} = this.props;
        if( onChange === undefined )
            return;

        if( nextState.updated === null )
            return true;
        console.log(nextState.quantity_discounts);
        let data = {rules: nextState.rules, conditions: nextState.conditions, business_price: nextState.business_price, quantity_discounts: nextState.quantity_discounts};
        onChange(data);

        if(!(nextState.updated === 'name' || nextState.updated === 'addCondition')){
            this.handleSimulate();
        }
        nextState.updated = null;
    }

    getName(){
        return "businessForm"
    }

    handleChangeRule = (field) => (value) => {

        let {status, updated, rules} = this.state;
        status = States.STATUS_CHANGED;
        updated = field;
        if(field == 'options') {
            rules[field] = value;
        } else {
            rules[field] = field === 'name' ?  value : value[0];
        }

        console.log('handleChangeRue, Current State:', this.state);
        console.log('Field:', field);

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
        updated = "addCondition";

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
        updated = field;
        if(field === 'condition'){
            conditions[index]['rule'] = 0;
            conditions[index]['value'] = 0;
        }
        if ( field === 'rule' ) {
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
        updated = "deleteCondition";
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

    handleChangeBusinessPrice = (field) => (value) => {
        console.log("handleChangeBusinessPrice", field, value);
        let {status, updated, business_price} = this.state;
        status = States.STATUS_CHANGED;
        updated = field;
        business_price[field] = value;
        this.setState(state => ({
            ...state,
            status,
            updated,
            business_price,
        }));
    }

    handleAddQuantityPrice = () => {
        let {status, updated} = this.state;
        status = States.STATUS_CHANGED;
        updated = "addQuantityPrice";

        this.setState(prevState => ({
            quantity_discounts: [
                ...prevState.quantity_discounts,
                {...this.new_quantity_discount, id: prevState.quantity_discounts.length}
            ],
            status,
            updated,
        }));
    }


    handleChangeQuantityPrice = (field, index) => (value) => {
        console.log("handleChangeMarkup", field, index, value);
        let {status, updated, quantity_discounts} = this.state;
        status = States.STATUS_CHANGED;
        updated = field;
        quantity_discounts[index][field] = value;
        this.setState(state => ({
            ...state,
            status,
            updated,
            quantity_discounts: quantity_discounts,
        }));
    }

    handleDeleteQuantityPrice = index => {
        let {status, updated, quantity_discounts} = this.state;
        console.log("handleDeleteMarkup", index);
        status = States.STATUS_CHANGED;
        updated = "deleteMarkup";
        quantity_discounts = this.state.quantity_discounts.filter((item, i) => index !== i);
        let i = 0;
        quantity_discounts = quantity_discounts.map(item => ({...item, id: i++}));
        this.setState(state => ({
           ...state,
            status,
            updated,
            quantity_discounts: quantity_discounts,
        }));
    };

    render() {
        console.log(this.state);
        let contextual_message = "";

        const conditions_options = Constants.conditions_conditions;
        const condition_rule = Constants.rules_policies;
        const rules_conditions = Constants.rules_conditions;

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
            title = CsI18n.t('New Business rule');
        else {
            title = CsI18n.t('Edit Business rule');
        }
        heading =
            <Stack>
                <Stack.Item>
                    <Heading element="h3">{title}</Heading>
                </Stack.Item>
            </Stack>

        return (
            <CsValidationForm name="business_form">
                <Card.Section>
                    {heading}
                    {contextual_message}
                    <FormLayout>
                        <FormLayout.Group>
                            <CsValidation>
                                <TextField
                                    value={this.state.rules.name}
                                    label={Constants.friendly_name}
                                    placeholder={CsI18n.t("Discount T-Shirt price by 10%")}
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
                                <Stack distribution={"fillEvenly"}>
                                    <Stack.Item>
                                        <Stack wrap={true} vertical>
                                            <Stack.Item>
                                                <ChoiceList
                                                    title={CsI18n.t("Products must match")}
                                                    choices={conditions_options}
                                                    selected={this.state.rules.condition}
                                                    onChange={this.handleChangeRule('condition')}
                                                />
                                            </Stack.Item>
                                        </Stack>
                                    </Stack.Item>
                                </Stack>
                            </FormLayout.Group>
                        </FormLayout>
                        <TextStyle><CsI18n>Example</CsI18n><Caption><CsI18n>Apply for this rule and specified conditions, a quantity discount as configured below</CsI18n></Caption></TextStyle>
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
                                // console.log(condition_items)
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
                        <TextStyle><CsI18n>Example</CsI18n><Caption><CsI18n>For Levi's products in Clothes Collection, apply the Business price and quantity discounts below</CsI18n></Caption></TextStyle>
                    </Card.Section>
                    {this.renderBusinessPriceEdit()}
                    {this.renderQuantityDiscounts()}

                    {<Simulator
                      data={this.state}
                      name={this.getName()}
                      rulesParameter={this.rules_parameters}
                      simulator={this.state.simulator}
                      loading={this.state.simulating}/>}

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

    renderBusinessPriceEdit() {
        const condition_rule = Constants.rules_policies;
        let {business_price} = this.state;
        return (<Card.Section title={CsI18n.t("Business price")}>

            <Stack wrap={false} fill>
                <Stack.Item fill>
                    <FormLayout>
                        <FormLayout.Group condensed>
                            <Select
                                label={CsI18n.t("Discount")} labelInline
                                options={condition_rule}
                                onChange={this.handleChangeBusinessPrice('rule')}
                                value={business_price? business_price.rule:''}
                            />
                            <CsValidation>
                                <TextField
                                    value={business_price? business_price.value:''}
                                    pattern="^[\.0-9]*$"
                                    onChange={this.handleChangeBusinessPrice('value')}
                                />
                                <CsValidation.Item rule="required" title={CsI18n.t("The value is required")}/>
                                <CsValidation.Item rule="pattern" title={CsI18n.t("This value must be numeric")}/>
                            </CsValidation>
                        </FormLayout.Group>
                    </FormLayout>
                </Stack.Item>
            </Stack>
        </Card.Section>);
    }

    renderQuantityDiscounts() {
        const condition_rule = Constants.rules_policies;
        let {business_price} = this.state;
        let quantity_price_rule = business_price? business_price.quantity_price_rule:'';
        return (<Card.Section title={CsI18n.t("Quantity discounts")}>
            <FormLayout>
                <FormLayout.Group>
                    <div style={{padding: "0rem 2rem"}}>
                        <Stack alignment="center" spacing="extraLoose">
                            <Stack.Item>
                                <TextStyle variation="strong"><CsI18n>Discount price type</CsI18n></TextStyle>
                            </Stack.Item>
                            <Stack.Item>
                                <Select
                                    label={CsI18n.t("Apply a")}
                                    labelHidden={true}
                                    options={condition_rule}
                                    onChange={this.handleChangeBusinessPrice('quantity_price_rule')}
                                    value={quantity_price_rule}
                                    />
                            </Stack.Item>
                        </Stack>
                        {this.state.input_date_error? (<div className="Polaris-Labelled__Error">
                            <div id="TextField1Error" className="Polaris-InlineError">
                                <div className="Polaris-InlineError__Icon"><Icon source={AlertMinor} /></div>{CsI18n.t("Date range is invalid")}</div>
                        </div>):''}
                    </div>
                </FormLayout.Group>
            </FormLayout>
            <ResourceList
                resourceName={{singular: 'quantity discount', plural: 'quantity discounts'}}
                items={this.state.quantity_discounts}
                renderItem={(item, index) => {
                    const {id, quantity, value} = item;

                    let prices_or_percentages = this.percentages;
                    if (quantity_price_rule === '$') {
                        prices_or_percentages = this.quantity_candidates;
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
                                                label={CsI18n.t("From")} labelInline
                                                options={this.quantity_candidates}
                                                onChange={this.handleChangeQuantityPrice('quantity', index)}
                                                value={quantity}
                                            />

                                            {quantity_price_rule === '$'? (<CsValidation>
                                                <TextField
                                                    value={value}
                                                    pattern="^[\.0-9]*$"
                                                    onChange={this.handleChangeQuantityPrice('value', index)}
                                                />
                                                <CsValidation.Item rule="required" title={CsI18n.t("The value is required")}/>
                                                <CsValidation.Item rule="pattern" title={CsI18n.t("This value must be numeric")}/>
                                            </CsValidation>):(<Select
                                                options={prices_or_percentages}
                                                onChange={this.handleChangeQuantityPrice('value', index)}
                                                value={value}
                                            />)}

                                        </FormLayout.Group>
                                    </FormLayout>
                                </Stack.Item>
                                <Stack.Item distribution="trailing">
                                    {index == 0 && (
                                        <Button icon={PlusMinor} onClick={() => this.handleAddQuantityPrice()}
                                        />
                                    )}
                                    {index > 0 && (
                                        <Button icon={DeleteMinor} onClick={() => this.handleDeleteQuantityPrice(index)}
                                        />
                                    )}
                                </Stack.Item>
                            </Stack>
                        </ResourceList.Item>

                    );
                }}
            />
            <TextStyle>
                <CsI18n>Example</CsI18n>
                <Caption>
                    <CsI18n label10={this.quantity_candidates[10].label} label50={this.quantity_candidates[50].label}>
                        {"From {{label10}}, discount by 10%, From {{label50}}, discount by 15%"}

                    </CsI18n>
                </Caption>
            </TextStyle>
        </Card.Section>);
    }

    checkValidation() {
        let valueArr = this.state.items.map(function(item){ return item.rules.name });
        let isDuplicate = valueArr.some(function(item, idx){
            return valueArr.indexOf(item) != idx
        });
        if (isDuplicate) {
            this.setState({status: States.STATUS_DUPLICATED});
            return false;
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
            return false;
        }
        console.log("checkValidation is true");
        return true;
    }

    handlerClose = () => {
       const {onClose} = this.props;
        if( onClose === undefined )
            return;

        onClose();
    }

    handlerFormClose = () => {

        console.log("business form: handlerSave", this.state.data.current, this.state);

        this.updateStatus(States.EVENT_CLOSE);
    }

    handlerSave = () => {
        if( CsValidationForm.validate("business_form") === false)
            return;

        console.log("handlerSave", this.state);
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

    handleSimulate() {
        this.debounceHandle();
    }

    handleDoSimulate = () => {
        for(let index in this.state.conditions){
            if(this.state.conditions[index].value === 0){
                return;
            }
        }

        this.setState({simulating: true, simulator: null});
        this.props.onSimulate(this.cbSimulateSuccess, this.cbSimulateError);

    }

}
export default BusinessForm;
