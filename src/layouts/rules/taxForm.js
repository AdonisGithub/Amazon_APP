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
import CsAutoComplete from '../../components/csAutocomplete/csAutocomplete';
import Context from "../../context";
import CsEmbeddedModal from "../../components/csEmbeddedModal";
import {DeleteMinor, PlusMinor} from "@shopify/polaris-icons";
import CsVideoTutorialButton from "../../components/csVideoTutorialButton";
import VideoTutorial from "../../helpers/VideoTutorial";
import AmazonHelper from "../../helpers/AmazonHelper";

class TaxForm extends States {
    static RULES = {name: '', condition: 'all', scope: 'product'};
    static CONDITION = {id: 0, condition: 'c', rule: 0, value: 0};
    static CONDITION_FOR_ORDER = {id: 0, condition: 'osa', rule: 0, value: '', currency: ''}; //order
    static TAX = {ptc: 'A_GEN_NOTAX', tax_category: 'none', item_tax_rate: 0, shipping_tax_rate: 0};

    state = {
        status: States.STATUS_NORMAL,
        opendeletemodal: false,
        rules: null,
        conditions: [],
        tax: {},
        items: [], //tax list
        tax_loading: false,
    }
    constructor(props) {
        super(props);
        this.shopify = Context.getShared();
        this.rules_parameters = this.props.rules_parameters;

        this.new_rule = Util.clone(TaxForm.RULES);
        this.new_condition = Util.clone(TaxForm.CONDITION);
        this.new_tax = Util.clone(TaxForm.TAX);

        this.state.rules = this.props.data.rules;
        this.state.conditions = this.props.data.conditions;
        this.state.tax = this.props.data.tax;

        this.state.mode = this.props.mode;
        this.state.updated = false;
        this.state.items = this.props.items;

        let marketplaces = AmazonHelper.getMarketplaceOptions(this.rules_parameters.selected_marketplaces);

        this.marketplaces = marketplaces;

        if (this.rules_parameters.currency_list) {
            this.currency_list = [{label: 'Any', value:''}, ...this.rules_parameters.currency_list];
        } else {
            this.currency_list = [{label: 'Any', value:''}];
        }

        this.product_tax_codes = [];
        this.tax_category_codes = [];
        if (this.rules_parameters.hasOwnProperty('taxes')) {
            this.state.tax_loading = false;
            this.product_tax_codes = this.rules_parameters.taxes;
            this.tax_category_codes = [{label: '', value: ''}].concat(this.rules_parameters.tax_categories);
        }
        console.log(this.state, this.marketplaces, this.product_tax_codes, this.tax_category_codes);
    }

    componentWillReceiveProps(nextProps, nextContext) {

        /*this.state.rules = nextProps.data.rules;
        this.state.conditions = nextProps.data.conditions;
        this.state.tax = nextProps.data.tax;

        this.state.items = nextProps.items;

        this.setState({mode: nextProps.mode})*/
    }

    componentWillUpdate(nextProps, nextState, nextContext) {

        const {onChange} = this.props;
        if( onChange === undefined )
            return;

        if( nextState.updated === false )
            return true;

        let data = {rules: nextState.rules, conditions: nextState.conditions, tax: nextState.tax};
        onChange(data);
        nextState.updated = false;
    }

    handleChangeRule = (field) => (value) => {
        let {updated, status, rules} = this.state;
        console.log(field, rules);
        updated = true;
        status = States.STATUS_CHANGED;
        rules[field] = field === 'name' ?  value : value[0];
        if (field == 'scope') {
            let conditions = [Util.clone(value == 'product'? TaxForm.CONDITION:TaxForm.CONDITION_FOR_ORDER)];
            let tax = Util.clone(TaxForm.TAX);
            this.setState({
                rules,
                conditions,
                tax
            });
        } else {
            this.setState(state => ({
                ...state,
                updated,
                status,
                rules,
            }));
        }
    }

    handleAddCondition = () => {
        let {updated, status} = this.state;
        updated = true;
        status = States.STATUS_CHANGED;

        this.setState(prevState => ({
            conditions: [
                ...prevState.conditions,
                {...this.new_condition, id: prevState.conditions.length},
            ],
            updated,
            status,
        }));
    }

    handleChangeCondition = (field, index) => (value) => {
        let {updated, status, conditions} = this.state;
        updated = true;
        status = States.STATUS_CHANGED;

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
            updated,
            status,
            conditions,
        }));
    }

    handleDeleteCondition = index => {
        let {updated, status, conditions} = this.state;
        conditions = this.state.conditions.filter((item, i) => index !== i);
        let i = 0;
        updated = true;
        status = States.STATUS_CHANGED;
        conditions = conditions.map(item => ({...item, id: i++}));
        this.setState(state => ({
          ...state,
            updated,
            status,
            conditions,
        }));
    };

    handleChangeTax = (field) => (value) => {
        let {updated, status, tax} = this.state;
        updated = true;
        status = States.STATUS_CHANGED;
        tax[field] = value;

        this.setState(state => ({
            ...state,
            updated,
            status,
        }));
    }


    render() {
        console.log("render", this.state);

        let contextual_message = "";

        const conditions_options = Constants.conditions_conditions;
        const video = <CsVideoTutorialButton url={VideoTutorial.rules_taxes}/>

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
            title = CsI18n.t('New Tax Rule');
        else {
            title = CsI18n.t('Edit Tax Rule');
        }
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

        const tax_block = this.state.rules.scope === 'order'? this.renderTaxRateBlock(): this.renderTaxCodeBlock();

        return (
            <div className={"tax-rule-form"}>
            <CsValidationForm name="taxform">
                <Card.Section>
                    {heading}
                    {contextual_message}
                    <FormLayout>
                        <FormLayout.Group>
                            <CsValidation>
                                <TextField
                                    value={this.state.rules.name}
                                    label={Constants.friendly_name}
                                    placeholder={CsI18n.t("Export offers having stock level > 10")}
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
                                            title={CsI18n.t("Must match")}
                                            choices={conditions_options}
                                            selected={this.state.rules.condition}
                                            onChange={this.handleChangeRule('condition')}
                                        />
                                    </Stack.Item>
                                    <Stack.Item>
                                        <ChoiceList
                                            title={CsI18n.t("Scope")}
                                            choices={[
                                                {label: CsI18n.t('Product'), value: 'product'},
                                                {label: CsI18n.t('Order'), value: 'order'},
                                            ]}
                                            selected={this.state.rules.scope? this.state.rules.scope:'product'}
                                            onChange={this.handleChangeRule('scope')}
                                        />
                                    </Stack.Item>
                                </Stack>
                            </FormLayout.Group>
                            <TextStyle><CsI18n>Example</CsI18n><Caption><CsI18n>Apply for this rule and specified conditions, a tax as configured below</CsI18n></Caption></TextStyle>
                        </FormLayout>

                    </Card.Section>

                    {this.renderConditionsBlock()}

                    {tax_block}
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
            </div>
        )
    }

    renderConditionsBlock() {
        const rules_conditions = this.state.rules.scope === 'order'? Constants.rules_tax_rate_conditions:Constants.rules_conditions;

        return (<Card.Section title={CsI18n.t("Conditions")}>
            <ResourceList
                resourceName={{singular: 'condition', plural: 'conditions'}}
                items={this.state.conditions}
                renderItem={(item, index) => {
                    let {id, condition, rule, value} = item;

                    let empty_item = [
                        {label: '', value: 0, disabled: true},
                        {label: 'Any', value: 'Any'},
                    ];
                    let empty_item_any = [
                        {label: '', value: ''},
                        {label: 'Any', value: 'Any'},
                    ]
                    let condition_items;
                    let rules_rules;

                    const conditions_rule_2 = Constants.rules_rules_std;

                    switch (item.condition) {
                        case 'c':
                            condition_items = empty_item.concat(this.rules_parameters.collections);
                            rules_rules = conditions_rule_2;
                            break;
                        case 'p':
                            condition_items = empty_item.concat(this.rules_parameters.product_types);
                            rules_rules = conditions_rule_2;
                            break;
                        case 't':
                            condition_items = empty_item.concat(this.rules_parameters.tags);
                            rules_rules = Constants.rules_rules_contains;
                            if(rule == Constants.RULE_EQUAL) {
                                rule = Constants.RULE_CONTAINS;
                            } else if (rule == Constants.RULE_NOT_EQUAL) {
                                rule = Constants.RULE_NOT_CONTAINS;
                            }
                            break;
                        case 'v':
                            condition_items = empty_item.concat(this.rules_parameters.vendors);
                            rules_rules = conditions_rule_2;
                            break;
                        case 'm':
                            condition_items = empty_item.concat(this.marketplaces);
                            rules_rules = Constants.rules_rules_only_equal;
                            break;
                        case 'osa':
                            condition_items = empty_item_any.concat(Constants.SHIPPING_AREA);
                            rules_rules = Constants.rules_rules_only_equal;
                            break;
                        case 'ita':
                            condition_items = empty_item_any;
                            rules_rules = Constants.rules_rules_only_less_greater_mark;
                            break;
                        case 'sl':
                            condition_items = empty_item_any.concat(this.rules_parameters.locations);
                            rules_rules = Constants.rules_rules_only_equal;
                            break;
                        default:
                            condition_items = [{label: '', value: 0, disabled: true}];
                            rules_rules = conditions_rule_2;
                            break;
                    }

                    let value_field = null;
                    if (item.condition == 'ita') {
                        let currencyButton = (
                            <div className="currency">
                                <Select
                                    label={"Currency"}
                                    labelInline={true}
                                    options={this.currency_list}
                                    onChange={this.handleChangeCondition("currency", index)}
                                    value={item.currency}
                                />
                            </div>);
                        value_field = (<CsValidation>
                            <TextField
                            label={'value'}
                            labelHidden={true}
                            type={"number"}
                            value={value === 0? "":value}
                            min="0"
                            onChange={this.handleChangeCondition('value', index)}
                            connectedLeft={currencyButton}
                        />
                            <CsValidation.Item rule="required" title={CsI18n.t("Value can't be empty")}/>
                        </CsValidation>);
                    } else if (parseInt(rule) === Constants.RULE_EQUAL || parseInt(rule) === Constants.RULE_NOT_EQUAL) {
                        value_field = (<Select
                            label={'value'}
                            labelHidden={true}
                            options={condition_items}
                            onChange={this.handleChangeCondition('value', index)}
                            value={value}
                        />);
                    } else {
                        value_field = (<TextField
                            label={'value'}
                            labelHidden={true}
                            value={value === 0? "":value}
                            onChange={this.handleChangeCondition('value', index)}
                        />);
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
                                                options={rules_conditions}
                                                onChange={this.handleChangeCondition('condition', index)}
                                                value={condition}
                                            />
                                            <Select
                                                label={'rule'}
                                                labelHidden={true}
                                                options={rules_rules}
                                                onChange={this.handleChangeCondition('rule', index)}
                                                value={parseInt(rule)}
                                            />
                                            {value_field}
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
            <FormLayout>
                <TextStyle><CsI18n>Example</CsI18n><Caption><CsI18n>For products from clothes collection, apply the product tax code below</CsI18n></Caption></TextStyle>
            </FormLayout>
        </Card.Section>);
    }

    renderTaxCodeBlock() {
        let product_tax_code = this.state.tax.ptc;
        let tax_category = this.state.tax.tax_category;

        return (<Card.Section title={CsI18n.t("Taxes")}>
            <FormLayout>
                <FormLayout.Group>
                    <Stack vertical spacing="tight">
                        <Stack.Item>
                            <CsAutoComplete
                                options={this.product_tax_codes}
                                onChange={this.handleChangeTax('ptc')}
                                selected={product_tax_code}
                                loading={this.state.tax_loading}
                            />
                        </Stack.Item>
                        <Stack.Item>
                            <Caption><CsI18n>Tax code to be applied to products and that must be provided to Amazon
                            </CsI18n></Caption>
                        </Stack.Item>
                    </Stack>
                </FormLayout.Group>

                <FormLayout.Group>
                    <Stack vertical spacing="tight">
                        <Stack.Item>
                            <CsAutoComplete
                                options={this.tax_category_codes}
                                onChange={this.handleChangeTax('tax_category')}
                                selected={tax_category}
                                loading={this.state.tax_loading}
                            />
                        </Stack.Item>
                        <Stack.Item>
                            <Caption><CsI18n>Generic tax scope that will be applied to order imports
                            </CsI18n></Caption>
                        </Stack.Item>
                    </Stack>
                </FormLayout.Group>

            </FormLayout>


        </Card.Section>);
    }

    renderTaxRateBlock() {
        let {tax} = this.state;
        return (<Card.Section title={CsI18n.t("Tax rate")}>
            <FormLayout>
                <FormLayout.Group>
                    <div className={"tax-rate-input"}>
                        <Stack distribution={"fillEvenly"}>
                            <Stack.Item>
                                <Stack spacing={"extraTight"} alignment={"trailing"}>
                                    <Stack.Item>
                                        <CsValidation>
                                            <TextField
                                                label={CsI18n.t("Item tax rate")}
                                                labelHidden={false}
                                                value={tax.item_tax_rate}
                                                type={"number"}
                                                placeholder="1"
                                                onChange={this.handleChangeTax('item_tax_rate')}
                                                min="0"
                                                max="100"
                                            />
                                            <CsValidation.Item rule="min" title={CsI18n.t("Item tax rate is invalid")}/>
                                            <CsValidation.Item rule="max" title={CsI18n.t("Item tax rate is invalid")}/>
                                        </CsValidation>
                                    </Stack.Item>
                                    <Stack.Item>%</Stack.Item>
                                </Stack>
                            </Stack.Item>
                            <Stack.Item>
                                <Stack spacing={"extraTight"} alignment={"trailing"}>
                                    <Stack.Item>
                                        <CsValidation>
                                            <TextField
                                                label={CsI18n.t("Shipping tax rate")}
                                                labelHidden={false}
                                                value={tax.shipping_tax_rate}
                                                type={"number"}
                                                placeholder="1"
                                                onChange={this.handleChangeTax('shipping_tax_rate')}
                                                min="0"
                                                max="100"
                                            />
                                            <CsValidation.Item rule="min" title={CsI18n.t("Shipping tax rate is invalid")}/>
                                            <CsValidation.Item rule="max" title={CsI18n.t("Shipping tax rate is invalid")}/>
                                        </CsValidation>
                                    </Stack.Item>
                                    <Stack.Item>%</Stack.Item>
                                </Stack>
                            </Stack.Item>
                        </Stack>
                    </div>
                </FormLayout.Group>
            </FormLayout>
        </Card.Section>);
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

        this.updateStatus(States.EVENT_CLOSE);
    }

    handlerSave = () => {
        if( CsValidationForm.validate("taxform") === false)
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
export default TaxForm;
