import React from "react";
import CsI18n from "./../../components/csI18n"

import States from "../../helpers/rules/states";
import Constants from "../../helpers/rules/constants";
import {debounce} from "lodash";
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
import Util from "../../helpers/Util";
import {CsValidationForm, CsValidation} from '../../components/csValidationForm'
import Context from "../../context";
import Simulator from "./sumulator/simulator";
import CsEmbeddedModal from "../../components/csEmbeddedModal";
import {DeleteMinor, PlusMinor} from "@shopify/polaris-icons";
import AmazonHelper from "../../helpers/AmazonHelper";
import CsAutoComplete from "../../components/csAutocomplete";
import country_iso_codes from "../../constant/country_iso_codes.json";

class InventoryForm extends States {
    static RULES = {name: '', condition: 'all'};
    static CONDITION = {id: 0, condition: 'c', rule: 0, value: 0};
    static INVENTORY = {action: "Decrease", quantity: 0};
    static PRODUCT_PROPERTY = {property: "", value: ""}


    state = {
        status: States.STATUS_NORMAL,
        opendeletemodal: false,
        rules: null,
        conditions: [],
        action: {},
        items: [] //inventory list

    }

    constructor(props) {
        super(props);
        this.shopify = Context.getShared();
        this.rules_parameters = this.props.rules_parameters;

        this.new_rule = Util.clone(InventoryForm.RULES);
        this.new_condition = Util.clone(InventoryForm.CONDITION);
        this.new_inventory = Util.clone(InventoryForm.INVENTORY);
        this.new_product_property = Util.clone(InventoryForm.PRODUCT_PROPERTY);

        this.state.rules = this.props.data.rules;
        this.state.conditions = this.props.data.conditions;
        this.state.action = this.props.data.action;
        this.state.product_property = this.props.data.product_property ? this.props.data.product_property : [Util.clone(InventoryForm.PRODUCT_PROPERTY)];

        this.state.mode = this.props.mode;
        this.state.updated = false;
        this.state.items = this.props.items;

        this.rules_conditions = Util.clone(Constants.rules_conditions);
        this.rules_conditions.push({label: 'Quantity', value: 'q'}); // Additional option quantity
        this.rules_conditions.push({label: 'Inventory Policy', value: 'ip'}); // Additional option quantity
        this.rules_conditions.push({label: 'Option', value: 'opt'}); // Additional option option

        this.meta_keys = [''];
        this.sku_candidates = ['', '{{Barcode}}'];
        this.barcode_candidates = ['', '{{SKU}}'];
        let country_origin_options = [{label: '{{CountryOfOrigin}}', value: '{{CountryOfOrigin}}'}];
        for(let meta of this.rules_parameters.meta_keys) {
            this.meta_keys.push(`{{${meta}}}`);
            this.sku_candidates.push(`{{${meta}}}`);
            this.barcode_candidates.push(`{{${meta}}}`);
            country_origin_options.push({label: `{{${meta}}}`, value: `{{${meta}}}`});
        }
        this.country_origin_options = [...country_origin_options, ...country_iso_codes];

        this.rules_inventory_policy = [
            {label: CsI18n.t('Continue selling'), value: 'continue'},
            {label: CsI18n.t('Stop selling'), value: 'deny'}
        ];

        this.marketplaces = AmazonHelper.getMarketplaceOptions(this.rules_parameters.selected_marketplaces);

        this.debounceHandle = debounce(() => {
            this.handleDoSimulate();
        }, 2000);
        console.log(this.state, this.marketplaces);
    }

    componentWillReceiveProps(nextProps, nextContext) {

        /*this.state.rules = nextProps.data.rules;
        this.state.conditions = nextProps.data.conditions;
        this.state.action = nextProps.data.action;

        this.state.items = nextProps.items;

        this.setState({mode: nextProps.mode})*/
    }

    componentWillUpdate(nextProps, nextState, nextContext) {

        const {onChange} = this.props;
        if (onChange === undefined)
            return;

        if (nextState.updated === false)
            return true;

        let data = {
            rules: nextState.rules,
            conditions: nextState.conditions,
            action: nextState.action,
            product_property: nextState.product_property
        };
        onChange(data);

        if (!(nextState.updated === 'name' || nextState.updated === 'addCondition')) {
            this.handleSimulate();
        }
        nextState.updated = false;
    }

    componentDidMount() {
        this.handleSimulate();
    }

    getName() {
        return "inventoryForm";
    }

    handleChangeRule = (field) => (value) => {
        let {status, updated, rules} = this.state;
        updated = true;
        status = States.STATUS_CHANGED;
        rules[field] = field === 'name' ? value : value[0];
        console.log("inventoryForm: componentWillUpdate", this.state.updated, this.shopify);

        this.setState(state => ({
            ...state,
            updated,
            status,
            rules,
        }));
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
        let {status, updated, conditions} = this.state;

        updated = true;
        status = States.STATUS_CHANGED;

        if (field === 'condition') {
            conditions[index]['rule'] = value === 'q' ? "2" : 0;
            conditions[index]['value'] = 0;
        }
        if (field === 'rule') {
            let rule = parseInt(this.state.conditions[index]['rule']);
            if (rule === Constants.RULE_EQUAL || rule == Constants.RULE_NOT_EQUAL)
                conditions[index]['value'] = ""
            else
                conditions[index]['value'] = 0
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
        this.setState(state => {
            this.state.updated = true;
            this.state.status = States.STATUS_CHANGED;
            let conditions = state.conditions.filter((item, i) => index !== i);
            let i = 0;
            conditions = conditions.map(item => ({...item, id: i++}));
            return {
                conditions,
            };
        });
    };

    handleChangeInventory = (field, index) => (value) => {
        let {updated, status, action} = this.state;
        updated = true;
        status = States.STATUS_CHANGED;
        action[field] = value;
        this.setState(state => ({
            ...state,
            updated,
            status,
            action,
        }));
    }

    handleAddProperty = () => {
        let {status, updated} = this.state;
        status = States.STATUS_CHANGED;
        updated = true;
        console.log('handleAddAction, Current State:', this.state);

        this.setState(prevState => ({
            product_property: [
                ...prevState.product_property,
                {...this.new_product_property, id: prevState.product_property.length}
            ],
            status,
            updated,
        }));
    }

    handleChangeProperty = (field, index) => (value) => {
        let {status, updated, product_property} = this.state;
        status = States.STATUS_CHANGED;
        updated = true;
        product_property[index][field] = value;
        if (field == 'property') {
            product_property[index]['value'] = '';
        }

        console.log('handleChangeProperty, Current State:', this.state);
        console.log('Field:', field, 'Index:', index, value);

        this.setState(state => ({
            ...state,
            status,
            updated,
            product_property,
        }));
    }

    handleDeleteProperty = index => {
        let {status, updated, product_property} = this.state;
        status = States.STATUS_CHANGED;
        updated = true;
        product_property = product_property.filter((item, i) => index !== i);
        let i = 0;
        product_property = product_property.map(item => ({...item, id: i++}));

        this.setState(state => ({
            ...state,
            status,
            updated,
            product_property,
        }));
    };

    render() {
        const conditions_options = Constants.conditions_conditions;

        let contextual_message = "";
        let rules_conditions = this.rules_conditions;
        let units = [];
        let i = 0;
        while (i < 2000) {
            units[i] = {
                value: i.toString(),
                label: i.toString() + ((i == 0 || i == 1) ? " " + CsI18n.t('Unit') : " " + CsI18n.t('Units'))
            };
            i += i < 50 ? 1 : (i < 100 ? 5 : 10);
        }
        i = 3000;
        units[i] = {value: i.toString(), label: i.toString() + (" " + CsI18n.t('Units'))};
        i = 4000;
        units[i] = {value: i.toString(), label: i.toString() + (" " + CsI18n.t('Units'))};
        i = 5000;
        units[i] = {value: i.toString(), label: i.toString() + (" " + CsI18n.t('Units'))};
        i = 10000;
        units[i] = {value: i.toString(), label: i.toString() + (" " + CsI18n.t('Units'))};
        i = 50000;
        units[i] = {value: i.toString(), label: i.toString() + (" " + CsI18n.t('Units'))};
        i = 100000;
        units[i] = {value: i.toString(), label: i.toString() + (" " + CsI18n.t('Units'))};

        console.log('markForm: render');
        console.log('rules params:', this.rules_parameters);
        console.log('rules:', this.state.rules);
        console.log('conditions:', this.state.conditions);
        console.log('action:', this.state.action);

        let action = this.state.action.action;
        let quantity = this.state.action.quantity;

        if (this.state.status == States.STATUS_DUPLICATED) {
            contextual_message = Constants.must_be_unique;
        } else if (this.state.status == States.STATUS_ERROR_REQUIRE_CONDITION) {
            contextual_message = Constants.must_select_condition;
        } else if (this.state.status == States.STATUS_ERROR) {
            contextual_message = this.renderError();
        } else if (this.state.status == States.STATUS_SAVED) {
            contextual_message = Constants.saved_successfully;
        }

        let title = CsI18n.t("Edit Inventory Rule");
        if (this.props.mode == States.MODE_ADD)
            title = CsI18n.t("New Inventory Rule");

        return (
            <CsValidationForm name="inventoryform">
                <Card.Section title={title}>
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
                                let {id, condition, rule, value} = item;

                                let empty_item = [
                                    {label: '', value: 0, disabled: true},
                                    {label: 'Any', value: 'Any'},
                                ];
                                let condition_items;
                                let rules_rules;

                                switch (item.condition) {
                                    case 'c':
                                        condition_items = empty_item.concat(this.rules_parameters.collections);
                                        rules_rules = Constants.rules_rules_std;
                                        break;
                                    case 'p':
                                        condition_items = empty_item.concat(this.rules_parameters.product_types);
                                        rules_rules = Constants.rules_rules_std;
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
                                        rules_rules = Constants.rules_rules_std;
                                        break;
                                    case 'm':
                                        condition_items = empty_item.concat(this.marketplaces);
                                        rules_rules = Constants.rules_rules_only_equal;
                                        break;
                                    case 'q':
                                        condition_items = empty_item;
                                        rules_rules = Constants.rules_rules_less_greater_equal;
                                        break;
                                    case 'ip':
                                        condition_items = empty_item.concat(this.rules_inventory_policy);
                                        rules_rules = Constants.rules_rules_only_equal;
                                        break;
                                    case 'opt':
                                        condition_items = empty_item;
                                        rules_rules = [
                                            {label: CsI18n.t('is equal to'), value: 0},
                                        ];
                                        break;
                                    default:
                                        condition_items = [{label: '', value: 0, disabled: true}];
                                        rules_rules = Constants.rules_rules_std;
                                        break;
                                }
                                console.log(rules_conditions);

                                return (
                                    <ResourceList.Item
                                        id={index}
                                    >
                                        <Stack wrap={false} fill key={index}>
                                            <Stack.Item fill>
                                                <FormLayout>
                                                    <FormLayout.Group condensed>
                                                        <Select
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
                                                            item.condition === 'opt'? (<CsValidation>
                                                                <TextField
                                                                    key={'then' + index}
                                                                    value={value === 0 ? "" : value}
                                                                    onChange={this.handleChangeCondition('value', index, condition)}
                                                                />
                                                                <CsValidation.Item rule="required"
                                                                                   title={CsI18n.t("Value is required")}/>
                                                            </CsValidation>):(
                                                                (parseInt(rule) === Constants.RULE_EQUAL || parseInt(rule) === Constants.RULE_NOT_EQUAL) ?
                                                                    item.condition === 'q' ?
                                                                        (<CsValidation>
                                                                            <TextField
                                                                                key={'then' + index}
                                                                                value={value === 0 ? "" : value}
                                                                                onChange={this.handleChangeCondition('value', index, condition)}
                                                                                pattern="^[0-9]*$"
                                                                            />
                                                                            <CsValidation.Item rule="pattern"
                                                                                               title={CsI18n.t("This field must be numeric")}/>
                                                                        </CsValidation>)
                                                                        :
                                                                        (<CsValidation><Select
                                                                            key={'then' + index}
                                                                            options={condition_items}
                                                                            onChange={this.handleChangeCondition('value', index)}
                                                                            value={value}
                                                                        />
                                                                            <CsValidation.Item rule="required"
                                                                                               title={CsI18n.t("Select a value")}/>
                                                                        </CsValidation>)
                                                                    :
                                                                    item.condition === 'q' ?
                                                                        (<CsValidation>
                                                                            <TextField
                                                                                key={'then' + index}
                                                                                value={value === 0 ? "" : value}
                                                                                onChange={this.handleChangeCondition('value', index, condition)}
                                                                                pattern="^[0-9]*$"
                                                                            />
                                                                            <CsValidation.Item rule="pattern"
                                                                                               title={CsI18n.t("This field must be numeric")}/>
                                                                        </CsValidation>)
                                                                        :
                                                                        (<TextField
                                                                            key={'then' + index}
                                                                            value={value === 0 ? "" : value}
                                                                            onChange={this.handleChangeCondition('value', index)}
                                                                        />)
                                                            )
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

                        <Stack wrap={false} fill>
                            <Stack.Item fill>
                                <FormLayout>
                                    <FormLayout.Group condensed>
                                        <Select
                                            options={[{label: CsI18n.t("Decrease"), value: 'Decrease'},
                                                {label: CsI18n.t("Increase"), value: 'Increase'},
                                                {label: CsI18n.t("Set"), value: 'Set'}
                                            ]}
                                            onChange={this.handleChangeInventory('action')}
                                            value={action}
                                        />
                                        <Select
                                            options={units}
                                            onChange={this.handleChangeInventory('quantity')}
                                            value={quantity}
                                        />
                                    </FormLayout.Group>
                                </FormLayout>
                            </Stack.Item>
                        </Stack>

                        <TextStyle><CsI18n>Example</CsI18n><Caption><CsI18n>When quantity is greater than 10, decrease
                            it by 10</CsI18n></Caption></TextStyle>
                    </Card.Section>

                    <Card.Section title={CsI18n.t("Properties")}>
                        <ResourceList
                            resourceName={{singular: 'property', plural: 'properties'}}
                            items={this.state.product_property}
                            renderItem={(item, index) => {
                                const {id, property, value} = item;
                                console.log("property-renderItem", item);
                                let action_content = '';

                                switch (item.property) {
                                    case 'cond':
                                        action_content =
                                            <CsValidation><Select
                                                key={'cond' + index}
                                                options={Constants.amazon_product_conditions}
                                                onChange={this.handleChangeProperty('value', index)}
                                                value={value}
                                            /><CsValidation.Item rule="required"
                                                                 title={CsI18n.t("Select a condition")}/></CsValidation>
                                        break;
                                    case 'note':
                                        action_content =
                                            <CsValidation>
                                                <CsAutoComplete
                                                    key={"note"+index}
                                                    isOnlyValue={true}
                                                    options={this.meta_keys}
                                                    onChange={this.handleChangeProperty('value', index)}
                                                    selected={value === 0 ? "" : value}
                                                    allowedInput={true}
                                                    placeholder={CsI18n.t('Select meta field or input custom value')}
                                                />
                                                    <CsValidation.Item rule="required"
                                                                       title={CsI18n.t("Note is required")}/>
                                            </CsValidation>
                                        break;
                                    case 'sku':
                                        action_content =
                                            <CsValidation>
                                                <CsAutoComplete
                                                    key={"note"+index}
                                                    isOnlyValue={true}
                                                    options={this.sku_candidates}
                                                    onChange={this.handleChangeProperty('value', index)}
                                                    selected={value === 0 ? "" : value}
                                                    allowedInput={false}
                                                    placeholder={CsI18n.t("Select a value")}
                                                />
                                                <CsValidation.Item rule="required"
                                                                   title={CsI18n.t("SKU is required")}/>
                                            </CsValidation>
                                        break;
                                    case 'barcode':
                                        action_content =
                                            <CsValidation>
                                                <CsAutoComplete
                                                    key={"note"+index}
                                                    isOnlyValue={true}
                                                    options={this.barcode_candidates}
                                                    onChange={this.handleChangeProperty('value', index)}
                                                    selected={value === 0 ? "" : value}
                                                    allowedInput={false}
                                                    placeholder={CsI18n.t("Select a value")}
                                                />
                                                <CsValidation.Item rule="required"
                                                                   title={CsI18n.t("Barcode is required")}/>
                                            </CsValidation>
                                        break;
                                    case 'gift_wrap':
                                        action_content =
                                            <CsValidation><Select
                                                key={'gift_wrap' + index}
                                                options={Constants.gift_wrap_values}
                                                onChange={this.handleChangeProperty('value', index)}
                                                value={value}
                                            /><CsValidation.Item rule="required"
                                                                 title={CsI18n.t("Select a value")}/></CsValidation>
                                        break;
                                    case 'country_of_origin':
                                        action_content =
                                            <CsValidation>
                                                <CsAutoComplete
                                                    key={"country_of_origin" + index}
                                                    // isOnlyValue={true}
                                                    options={this.country_origin_options}
                                                    onChange={this.handleChangeProperty('value', index)}
                                                    selected={value === 0 ? "" : value}
                                                    allowedInput={true}
                                                    // placeholder={CsI18n.t('Select meta field or input custom value')}
                                                    // pattern="[A-Za-z][A-Za-z]"
                                                />
                                                {/*<CsValidation.Item rule="pattern"*/}
                                                {/*                   title={CsI18n.t("Country of origin must be an country ISO code (eg: US, UK, DE...)")}/>*/}
                                                <CsValidation.Item rule="required"
                                                                   title={CsI18n.t("Country of origin is required")}/>
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

                                return (
                                    <ResourceList.Item
                                        id={index}
                                    >
                                        <Stack wrap={false} fill>
                                            <Stack.Item fill>
                                                <FormLayout>
                                                    <FormLayout.Group condensed>
                                                        <Select
                                                            options={Constants.product_properties}
                                                            onChange={this.handleChangeProperty('property', index)}
                                                            value={property}
                                                        />
                                                        {action_content}
                                                    </FormLayout.Group>
                                                </FormLayout>
                                            </Stack.Item>
                                            <Stack.Item distribution="trailing">
                                                {index == 0 && (
                                                    <Button icon={PlusMinor} onClick={() => this.handleAddProperty()}
                                                    />
                                                )}
                                                {index > 0 && (
                                                    <Button icon={DeleteMinor}
                                                            onClick={() => this.handleDeleteProperty(index)}
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
                            {this.state.mode === States.MODE_EDIT &&
                            <Button icon={DeleteMinor} onClick={this.deleteConfirmation}
                                    loading={this.state.status === States.STATUS_DELETING}
                                    disabled={this.state.status === States.STATUS_DELETING}
                                    destructive><CsI18n>Delete</CsI18n></Button>}
                        </Stack.Item>
                        <Stack.Item>
                            <ButtonGroup>
                                <Button onClick={this.handlerClose}><CsI18n>Cancel</CsI18n></Button>
                                <Button onClick={this.handlerSave} loading={this.state.status === States.STATUS_SAVING}
                                        disabled={this.state.status === States.STATUS_SAVING || this.state.status === States.STATUS_SAVED || this.state.status === States.STATUS_NORMAL}
                                        primary><CsI18n>Save</CsI18n></Button>
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
        let valueArr = this.state.items.map(function (item) {
            return item.rules.name
        });
        let isDuplicate = valueArr.some(function (item, idx) {
            return valueArr.indexOf(item) != idx
        });
        if (isDuplicate) {
            this.setState({status: States.STATUS_DUPLICATED});
            return (false);
        }

        let {conditions} = this.state;
        let hasCondition = false;
        for (let condition of conditions) {
            console.log("checkValidation", condition);
            if ((condition.condition != 'q' && condition.value == 0) ||
                condition.value == '') {
                continue;
            }
            hasCondition = true;
            break;
        }
        if (!hasCondition) {
            this.setState({status: States.STATUS_ERROR_REQUIRE_CONDITION});
            return (false);
        }
        console.log("checkValidation is true");
        return (true);
    }

    handlerClose = () => {
        const {onClose} = this.props;
        if (onClose === undefined)
            return;

        onClose();
    }

    handlerFormClose = () => {

        this.updateStatus(States.EVENT_CLOSE);
    }

    handlerSave = () => {
        if (CsValidationForm.validate("inventoryform") === false)
            return;

        if (!this.checkValidation()) {
            console.log("checkValidation is false");
            return;
        }

        const {onSave} = this.props;
        if (onSave === undefined)
            return;

        onSave(this.cbSaveDone, this.cbSaveError);
        this.setState({status: States.STATUS_SAVING});
    }

    handleSimulate() {
        this.debounceHandle();
    }

    handleDoSimulate = () => {
        console.log('Simulate', this.state);
        for (let index in this.state.conditions) {
            if (this.state.conditions[index].value === 0) {
                return;
            }
        }

        this.setState({simulating: true, simulator: null});
        this.props.onSimulate(this.cbSimulateSuccess, this.cbSimulateError);

    }

}

export default InventoryForm;
