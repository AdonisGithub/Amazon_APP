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
    Heading,
    ResourceList,
    Select,
    Stack,
    TextField,
    TextStyle, TextContainer,
    Modal,
    Icon,
    Tooltip

} from "@shopify/polaris";
import Util from "../../helpers/Util";
import {CsValidationForm, CsValidation} from '../../components/csValidationForm'
import Simulator from "./sumulator/simulator";
import CsEmbeddedModal from "../../components/csEmbeddedModal";
import {CircleInformationMajorMonotone, DeleteMinor, PlusMinor} from "@shopify/polaris-icons";
import CsVideoTutorialButton from "../../components/csVideoTutorialButton";
import VideoTutorial from "../../helpers/VideoTutorial";
import AmazonHelper from "../../helpers/AmazonHelper";
import ShopifyContext from "../../context";

const DEFAULT_SAFEGUARD = {min: 10, max: 20};

class MarkupForm extends States {
    static RULES = {name: '', condition: 'all', rule: '+', rounding: 'n', options: [], msrp: ['compare-at'], safeguard: {...DEFAULT_SAFEGUARD}};
    static CONDITION = {id: 0, condition: 'c', rule: 0, value: 0};
    static MARKUP = {id: 0, price: "0", rule: "%", value: "1"};

    state = {
        status: States.STATUS_NORMAL,
        opendeletemodal: false,
        rules: null,
        conditions: [],
        markups: [],
        items: [], //markup list
        simulator: null,
        simulating: false,
    }
    constructor(props) {
        super(props);

        this.shopify = ShopifyContext.getShared();
        this.rules_parameters = this.props.rules_parameters;

        this.new_rule = Util.clone(MarkupForm.RULES);
        this.new_condition = Util.clone(MarkupForm.CONDITION);
        this.new_markup = Util.clone(MarkupForm.MARKUP);

        this.state.rules = this.props.data.rules;
        this.state.conditions = this.props.data.conditions;
        this.state.markups = this.props.data.markups;

        this.state.mode = this.props.mode;
        this.state.updated = null;
        this.state.items = this.props.items;

        let marketplaces = AmazonHelper.getMarketplaceOptions(this.rules_parameters.selected_marketplaces);

        if (!this.state.rules.safeguard) {
            this.state.rules.safeguard = {...DEFAULT_SAFEGUARD};
        }

        this.marketplaces = marketplaces;

        this.debounceHandle = debounce(() => {
            this.handleDoSimulate();
        }, 2000);
        console.log(this.state, this.marketplaces);
    }

    componentDidMount() {
        this.handleSimulate();
    }

    componentWillReceiveProps(nextProps, nextContext) {

        console.log("componentWillReceiveProps", nextProps);

        /*this.state.rules = nextProps.data.rules;
        this.state.conditions = nextProps.data.conditions;
        this.state.markups = nextProps.data.markups;

        this.state.items = nextProps.items;

        this.setState({mode: nextProps.mode})*/
    }

    componentWillUpdate(nextProps, nextState, nextContext) {

        const {onChange} = this.props;
        if( onChange === undefined )
            return;

        if( nextState.updated === null )
            return true;
        console.log(nextState.markups);
        let data = {rules: nextState.rules, conditions: nextState.conditions, markups: nextState.markups};
        onChange(data);

        if(!(nextState.updated === 'name' || nextState.updated === 'addCondition')){
            this.handleSimulate();
        }
        nextState.updated = null;
    }

    getName(){
        return "markupForm"
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

    handleChangeSafeguardRule = (field) => (value) => {
        let {rules} = this.state;
        let status = States.STATUS_CHANGED;
        rules.safeguard[field] = value;
        this.setState({status, rules});
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

    handleAddMarkup = () => {
        let {status, updated} = this.state;
        status = States.STATUS_CHANGED;
        updated = "addMarkups";

        this.setState(prevState => ({
            markups: [
                ...prevState.markups,
                {...this.new_markup, id: prevState.markups.length}
            ],
            status,
            updated,
        }));
    }


    handleChangeMarkup = (field, index) => (value) => {
        console.log("handleChangeMarkup", field, index, value);
        let {status, updated, markups} = this.state;
        status = States.STATUS_CHANGED;
        updated = field;
        markups[index][field] = value;
        this.setState(state => ({
            ...state,
            status,
            updated,
            markups,
        }));
    }

    handleDeleteMarkup = index => {
        let {status, updated, markups} = this.state;
        console.log("handleDeleteMarkup", index);
        status = States.STATUS_CHANGED;
        updated = "deleteMarkup";
        markups = this.state.markups.filter((item, i) => index !== i);
        let i = 0;
        markups = markups.map(item => ({...item, id: i++}));
        this.setState(state => ({
           ...state,
            status,
            updated,
            markups,
        }));
    };

    render() {
        console.log(this.state);
        let contextual_message = "";

        const conditions_options = Constants.conditions_conditions;
        const condition_policy = Constants.conditions_policies;
        const condition_rule = Constants.rules_policies_v2;
        const rules_conditions = Constants.rules_conditions_markup;
        const rounding_modes = Constants.rounding_modes;

        const video = <CsVideoTutorialButton url={VideoTutorial.rules_markups}/>

        let rounding_mode = this.state.rules.rounding? this.state.rules.rounding:'n';

        let options = this.state.rules.options? this.state.rules.options:[];

        let prices = [];
        let i = 0;

        while (i <= 2000) {
            prices[i] = {value: i.toString(), label: this.shopify.getMoneyStringWithStoreFormat(i)};
            i += i < 50 ? 1 : i < 100 ? 5 : 10;
        }

        let percentages = [];
        for (let i = 0; i < 100; i++) {
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
            title = CsI18n.t('New Markup');
        else {
            title = CsI18n.t('Edit Markup');
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

        return (
            <CsValidationForm name="markupform">
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
                                            <Stack.Item>
                                                <ChoiceList
                                                    title={CsI18n.t("Then")}
                                                    choices={condition_policy}
                                                    selected={this.state.rules.rule}
                                                    onChange={this.handleChangeRule('rule')}
                                                />
                                            </Stack.Item>
                                        </Stack>
                                    </Stack.Item>
                                    <Stack.Item>
                                        <Stack wrap={true} vertical>
                                            <Stack.Item>
                                                <ChoiceList
                                                    title={CsI18n.t("Price rounding mode")}
                                                    choices={[
                                                        {
                                                            label: <Stack spacing={"tight"}><Stack.Item>{CsI18n.t('Smart rounding')}</Stack.Item><Stack.Item><Tooltip content={CsI18n.t("It would adjusts 10.57 to 10.59, 12.51 to 12.49")}>
                                                                <span className={"help-tooltip"}>
                                                                    <Icon source={CircleInformationMajorMonotone}
                                                                          color={"green"}/>
                                                                </span>
                                                            </Tooltip></Stack.Item></Stack>,
                                                            value: 's',
                                                        },
                                                        {label: CsI18n.t('Regular, 2 decimals'), value: 'r'},
                                                        {label: CsI18n.t('None, keep prices "as is"'), value: 'n'},
                                                    ]}
                                                    selected={rounding_mode}
                                                    onChange={this.handleChangeRule('rounding')}
                                                />
                                            </Stack.Item>
                                            <Stack.Item>
                                                <ChoiceList
                                                    allowMultiple
                                                    title={CsI18n.t("Options")}
                                                    choices={[
                                                        {
                                                            label: <Stack spacing={"tight"}><Stack.Item>{CsI18n.t("Send MSRP")}</Stack.Item><Stack.Item><Tooltip content={CsI18n.t("Send price before markup as MSRP(manufacturer's suggested retail price)")}>
                                                                <span className={"help-tooltip"}>
                                                                    <Icon source={CircleInformationMajorMonotone}
                                                                          color={"green"}/>
                                                                </span>
                                                            </Tooltip></Stack.Item></Stack>,
                                                            value: "msrp",
                                                            helpText: CsI18n.t(""),
                                                            renderChildren: isSelected => {
                                                                return isSelected && this.renderMsrpOptions();
                                                            }
                                                        },
                                                        {
                                                            label: <Stack
                                                                spacing={"tight"}><Stack.Item>{CsI18n.t("Safeguard")}</Stack.Item><Stack.Item><Tooltip
                                                                content={CsI18n.t("Minimum and Maximum price the item can be sold, useful when using Competitive Price Rule by Amazon")}>
                                                                <span className={"help-tooltip"}>
                                                                    <Icon source={CircleInformationMajorMonotone}
                                                                          color={"green"}/>
                                                                </span>
                                                            </Tooltip></Stack.Item></Stack>,
                                                            value: "safeguard",
                                                            helpText: CsI18n.t(""),
                                                            renderChildren: isSelected => {
                                                                return isSelected && this.renderSafeguardOptions();
                                                            }
                                                        }
                                                    ]}
                                                    selected={ options }
                                                    onChange={this.handleChangeRule('options')}
                                                />
                                            </Stack.Item>
                                        </Stack>
                                    </Stack.Item>
                                </Stack>
                            </FormLayout.Group>
                        </FormLayout>
                        <TextStyle><CsI18n>Example</CsI18n><Caption><CsI18n>Apply for this rule and specified conditions, a markup as configured below</CsI18n></Caption></TextStyle>
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
                                    case 'mfc':
                                        /* Notes
                                            Could you tell me more about the Price workflow?
                                            What happen to the product when they are switched from AFN to MFN and the inverse?

                                            Kbug  6 minutes ago
                                            if there is a rule for AFN, the rule won't be applied when it is switched to MFN,
                                            so the price will be the same than the shopify.

                                            Olivier Baquet  < 1 minute ago
                                            The rule is applied only when the product is switched to AFN if I understand well?

                                            Kbug  < 1 minute ago
                                            yes,

                                            Olivier Baquet  < 1 minute ago
                                            Thanks :wink:
                                         */
                                        condition_items = [
                                            {label: '', value: 0, disabled: true},
                                            {label: 'AFN', value: 'afn'},
                                            {label: 'MFN', value: 'mfn'},
                                        ]
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
                                    case 'mfc':
                                        rules_rules = [
                                            {label: CsI18n.t('is equal to'), value: 0},
                                        ];
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
                        <TextStyle><CsI18n>Example</CsI18n><Caption><CsI18n>For Levi's products in Clothes Collection, apply the markup below</CsI18n></Caption></TextStyle>
                    </Card.Section>

                    <Card.Section title={CsI18n.t("Markup")}>
                        <ResourceList
                            resourceName={{singular: 'markup', plural: 'markups'}}
                            items={this.state.markups}
                            renderItem={(item, index) => {
                                const {id, price, rule, value} = item;

                                var prices_or_percentages = percentages;
                                if (item.rule === '$' || item.rule === '$+' || item.rule === '$-') {
                                    prices_or_percentages = prices;
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
                                                            onChange={this.handleChangeMarkup('price', index)}
                                                            value={price}
                                                        />
                                                        <Select
                                                            label={CsI18n.t("Apply a")} labelInline
                                                            options={condition_rule}
                                                            onChange={this.handleChangeMarkup('rule', index)}
                                                            value={rule}
                                                        />
                                                        {(item.rule === '%' || item.rule === '%+' || item.rule == '%-')? (<Select
                                                            options={prices_or_percentages}
                                                            onChange={this.handleChangeMarkup('value', index)}
                                                            value={value}
                                                        />):(<CsValidation>
                                                            <TextField
                                                            value={value}
                                                            pattern="^[\.0-9]*$"
                                                            onChange={this.handleChangeMarkup('value', index)}
                                                        />
                                                            <CsValidation.Item rule="required" title={CsI18n.t("The value is required")}/>
                                                            <CsValidation.Item rule="pattern" title={CsI18n.t("This value must be numeric")}/>
                                                        </CsValidation>)}

                                                    </FormLayout.Group>
                                                </FormLayout>
                                            </Stack.Item>
                                            <Stack.Item distribution="trailing">
                                                {index == 0 && (
                                                    <Button icon={PlusMinor} onClick={() => this.handleAddMarkup()}
                                                    />
                                                )}
                                                {index > 0 && (
                                                    <Button icon={DeleteMinor} onClick={() => this.handleDeleteMarkup(index)}
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
                                    {"From {{label10}}, increase by 15%, from {{label50}}, increase by 10%"}

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

    renderMsrpOptions() {
        let msrp = this.state.rules.msrp? this.state.rules.msrp:['compare-at'];
        let choices = [
            {
                label: CsI18n.t('Send "Compare at price"'),
                value: "compare-at",
                helpText: ''
            },
            {
                label: CsI18n.t("Send price before markup"),
                value: "before-markup",
                helpText: ''
            },
        ];
        return (
            <ChoiceList
                title={CsI18n.t("Preferences")}
                titleHidden={true}
                choices={choices}
                selected={msrp}
                onChange={this.handleChangeRule('msrp')}
            />
        );
    }

    renderSafeguardOptions() {
        let safeguard = this.state.rules.safeguard? this.state.rules.safeguard:{min: 10, max: 20};

        return (
            <div className={"safe-options"}>
                <div className={"safe-option"}>
                    <span className={"field-label"}><CsI18n>Min</CsI18n></span>
                    <CsValidation>
                    <TextField
                        value={safeguard.min}
                        label={'Min'}
                        labelHidden={true}
                        placeholder={"10%"}
                        onChange={this.handleChangeSafeguardRule('min')}
                        min={0}
                        max={100}
                        type={"number"}
                        suffix={"% Under"}
                    />
                        <CsValidation.Item rule="min" title={CsI18n.t("Invalid value")}/>
                        <CsValidation.Item rule="max" title={CsI18n.t("Invalid value")}/>
                    </CsValidation>
                </div>
                <div className={"safe-option"}>
                    <span className={"field-label"}><CsI18n>Max</CsI18n></span>
                    <CsValidation>
                        <TextField
                            value={safeguard.max}
                            label={'Max'}
                            labelHidden={true}
                            placeholder={"20%"}
                            onChange={this.handleChangeSafeguardRule('max')}
                            min={0}
                            max={100}
                            type={"number"}
                            suffix={"% Higher"}
                        />
                        <CsValidation.Item rule="min" title={CsI18n.t("Invalid value")}/>
                        <CsValidation.Item rule="max" title={CsI18n.t("Invalid value")}/>
                    </CsValidation>
                </div>
            </div>
        );
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

        console.log("markup: handlerSave", this.state.data.current, this.state);

        this.updateStatus(States.EVENT_CLOSE);
    }

    handlerSave = () => {
        if( CsValidationForm.validate("markupform") === false)
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
export default MarkupForm;
