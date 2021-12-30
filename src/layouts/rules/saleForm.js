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
    Heading,
    ResourceList,
    Select,
    Stack,
    TextField,
    TextStyle, TextContainer,
    Modal, Icon,

} from "@shopify/polaris";

import {
    AlertMinor
} from '@shopify/polaris-icons';

import Util from "../../helpers/Util";
import {CsValidationForm, CsValidation} from '../../components/csValidationForm'
import Simulator from "./sumulator/simulator";
import CsEmbeddedModal from "../../components/csEmbeddedModal";
import {DeleteMinor, PlusMinor} from "@shopify/polaris-icons";
import CsDatePicker from "../../components/csDatePicker";
import AmazonHelper from "../../helpers/AmazonHelper";
import ShopifyContext from "../../context";
import {debounce} from "lodash";

class SaleForm extends States {
    static RULES = {name: '', condition: 'all', date_from: false, date_to: false};
    static CONDITION = {id: 0, condition: 'c', rule: 0, value: 0};
    static SALE = {id: 0, price: "1", rule: "%", value: "1"};


    state = {
        status: States.STATUS_NORMAL,
        opendeletemodal: false,
        rules: null,
        conditions: [],
        sales: [],
        items: [], //sale list
        simulator: null,
        simulating: false,
    }
    constructor(props) {
        super(props);

        this.shopify = ShopifyContext.getShared();
        this.rules_parameters = this.props.rules_parameters;

        // this.new_rule = Util.clone(SaleForm.RULES);
        this.new_condition = Util.clone(SaleForm.CONDITION);
        this.new_sale = Util.clone(SaleForm.SALE);

        this.state.rules = this.props.data.rules;
        this.state.conditions = this.props.data.conditions;
        this.state.sales = this.props.data.sales;

        this.state.mode = this.props.mode;
        this.state.updated = null;
        this.state.items = this.props.items;

        this.marketplaces = AmazonHelper.getMarketplaceOptions(this.rules_parameters.selected_marketplaces);

        this.debounceHandle = debounce(() => {
            this.handleDoSimulate();
        }, 2000);
        // console.log(this.state);
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
        console.log(nextState.sales);
        let data = {rules: nextState.rules, conditions: nextState.conditions, sales: nextState.sales};
        onChange(data);

        if(!(nextState.updated === 'name' || nextState.updated === 'addCondition')){
            this.handleSimulate();
        }
        nextState.updated = null;
    }

    getName(){
        return "saleForm"
    }

    handleChangeRule = (field) => (value) => {

        let {status, updated, rules} = this.state;
        status = States.STATUS_CHANGED;
        updated = field;
        rules[field] = field === 'name' ?  value : value[0];

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

    handleAddSale = () => {
        let {status, updated} = this.state;
        status = States.STATUS_CHANGED;
        updated = "addSales";

        this.setState(prevState => ({
            sales: [
                ...prevState.sales,
                {...this.new_sale, id: prevState.sales.length}
            ],
            status,
            updated,
        }));
    }

    handleChangeDateRange = (field) => (value) => {
        console.log('handleChangeDateRange', field, value);
        let {status, updated, rules} = this.state;
        status = States.STATUS_CHANGED;
        updated = field;
        rules[field] = Util.getDateString(value);


        console.log('handleChangeRue, Current State:', this.state);
        console.log('Field:', field);


        this.setState(state => ({
            ...state,
            status,
            updated,
            rules,
            input_date_error: false,
        }));
    }

    handleChangeSale = (field, index) => (value) => {
        console.log("handleChangeSale", field, index, value);
        let {status, updated, sales} = this.state;
        status = States.STATUS_CHANGED;
        updated = field;
        sales[index][field] = value;
        this.setState(state => ({
            ...state,
            status,
            updated,
            sales,
        }));
    }

    handleDeleteSale = index => {
        let {status, updated, sales} = this.state;
        console.log("handleDeleteSale", index);
        status = States.STATUS_CHANGED;
        updated = "deleteSale";
        sales = this.state.sales.filter((item, i) => index !== i);
        let i = 0;
        sales = sales.map(item => ({...item, id: i++}));
        this.setState(state => ({
           ...state,
            status,
            updated,
            sales,
        }));
    };

    render() {
        console.log(this.state);
        let contextual_message = "";

        const conditions_options = Constants.conditions_conditions;
        const condition_policy = Constants.conditions_policies;
        const sale_methods = Constants.sale_methods;
        const rules_conditions = Constants.rules_conditions;
        // const video = <CsVideoTutorialButton url={VideoTutorial.rules_sales}/>

        let prices = [];
        let i = 0;

        let date_from = new Date(this.state.rules.date_from);
        let date_to = new Date(this.state.rules.date_to);
        // let currency = '$'; // Default currency
        // if (this.shopify.hasOwnProperty('store_properties') && this.shopify.store_properties.hasOwnProperty('money_format')) {
        //     // Store default currency
        //     currency = this.shopify.store_properties.money_format;
        // }

        while (i < 2000) {
            i += i < 50 ? 1 : i < 100 ? 5 : 10;
            prices[i] = {value: i.toString(), label: this.shopify.getMoneyStringWithStoreFormat(i)};
        }

        let percentages = [];
        for (let i = 1; i < 100; i++) {
            percentages[i] = {value: i.toString(), label: i + ' %'};
        }


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
            title = CsI18n.t('New Sale');
        else {
            title = CsI18n.t('Edit Sale');
        }
        heading =
            <Stack>
                <Stack.Item>
                    <Heading element="h3">{title}</Heading>
                </Stack.Item>
                {/*<Stack.Item>
                    <span className={"csRulesVideo"}>
                    {video}
                    </span>
                </Stack.Item>*/}
            </Stack>

        return (
            <CsValidationForm name="saleform">
                <Card.Section>
                    {heading}
                    {contextual_message}
                    <FormLayout>
                        <FormLayout.Group>
                            <CsValidation>
                                <TextField
                                    value={this.state.rules.name}
                                    label={Constants.friendly_name}
                                    placeholder={CsI18n.t("Increase T-Shirt price by 10%")}
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
                        <TextStyle><CsI18n>Example</CsI18n><Caption><CsI18n>Apply for this rule and specified conditions, a sale as configured below</CsI18n></Caption></TextStyle>
                    </Card.Section>

                    <Card.Section title={CsI18n.t("Date range")}>
                        <FormLayout>
                            <FormLayout.Group>
                                <div style={{padding: "0rem 2rem"}}>
                                    <Stack alignment="center" spacing="extraLoose">
                                        <Stack.Item>
                                            <TextStyle variation="strong"><CsI18n>From</CsI18n></TextStyle>
                                        </Stack.Item>
                                        <Stack.Item>
                                            <CsDatePicker date={Util.getDateString(date_from)}
                                                          onChange={this.handleChangeDateRange('date_from')}/>
                                        </Stack.Item>
                                        <Stack.Item>
                                            <TextStyle variation="strong"><CsI18n>To</CsI18n></TextStyle>
                                        </Stack.Item>
                                        <Stack.Item fill>
                                            <CsDatePicker date={Util.getDateString(date_to)}
                                                          onChange={this.handleChangeDateRange('date_to')}/>
                                        </Stack.Item>
                                    </Stack>
                                    {this.state.input_date_error? (<div className="Polaris-Labelled__Error">
                                        <div id="TextField1Error" className="Polaris-InlineError">
                                            <div className="Polaris-InlineError__Icon"><Icon source={AlertMinor} /></div>{CsI18n.t("Date range is invalid")}</div>
                                    </div>):''}
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
                        <TextStyle><CsI18n>Example</CsI18n><Caption><CsI18n>For Levi's products in Clothes Collection, apply the sale below</CsI18n></Caption></TextStyle>
                    </Card.Section>

                    <Card.Section title={CsI18n.t("Sale")}>
                        <ResourceList
                            resourceName={{singular: 'sale', plural: 'sales'}}
                            items={this.state.sales}
                            renderItem={(item, index) => {
                                const {id, price, rule, value} = item;

                                var prices_or_percentages = percentages;
                                if (item.rule === '$') {
                                    prices_or_percentages = [];
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
                                                            options={prices}
                                                            onChange={this.handleChangeSale('price', index)}
                                                            value={price}
                                                        />
                                                        <Select
                                                            label={CsI18n.t("Use")} labelInline
                                                            options={sale_methods}
                                                            onChange={this.handleChangeSale('rule', index)}
                                                            value={rule}
                                                        />
                                                        <Select
                                                            disabled={item.rule === '$'}
                                                            options={prices_or_percentages}
                                                            onChange={this.handleChangeSale('value', index)}
                                                            value={value}
                                                        />
                                                    </FormLayout.Group>
                                                </FormLayout>
                                            </Stack.Item>
                                            <Stack.Item distribution="trailing">
                                                {index == 0 && (
                                                    <Button icon={PlusMinor} onClick={() => this.handleAddSale()}
                                                    />
                                                )}
                                                {index > 0 && (
                                                    <Button icon={DeleteMinor} onClick={() => this.handleDeleteSale(index)}
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
                                <CsI18n label10={prices[10].label} label50={prices[50].label}>
                                    {"From {{label10}}, sale by 10%, from {{label50}}, sale by 15%"}

                                </CsI18n>
                            </Caption>
                        </TextStyle>
                    </Card.Section>

                    <Simulator
                      data={this.state}
                      name={this.getName()}
                      rulesParameter={this.rules_parameters}
                      simulator={this.state.simulator}
                      loading={this.state.simulating}/>

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

        console.log("sale: handlerSave", this.state.data.current, this.state);

        this.updateStatus(States.EVENT_CLOSE);
    }

    handlerSave = () => {
        if( CsValidationForm.validate("saleform") === false)
            return;

        if (!this.checkValidation()) {
            console.log("checkValidation is false");
            return;
        }

        if ( !this.state.rules.date_from || !this.state.rules.date_to || this.state.rules.date_to < this.state.rules.date_from ) {
            this.setState({input_date_error: true});
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
        console.log('Simulate', this.state);
        for(let index in this.state.conditions){
            if(this.state.conditions[index].value === 0){
                return;
            }
        }

        this.setState({simulating: true, simulator: null});
        this.props.onSimulate(this.cbSimulateSuccess, this.cbSimulateError);

    }

}
export default SaleForm;
