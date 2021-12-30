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
    Modal, Tooltip, Icon,

} from "@shopify/polaris";
import Util from "../../helpers/Util";
import {CsValidationForm, CsValidation} from '../../components/csValidationForm'
import Context from "../../context";
import Simulator from "./sumulator/simulator";
import CsEmbeddedModal from "../../components/csEmbeddedModal";
import {CircleInformationMajorMonotone, DeleteMinor, PlusMinor} from "@shopify/polaris-icons";
import AmazonHelper from "../../helpers/AmazonHelper";
import {debounce} from "lodash";

class FilterForm extends States {
    static RULES = {name: '', condition: 'all', rule: '+', options: ['delete']};
    static CONDITION = {id: 0, condition: 'c', rule: 0, value: 0, unit: ''};
    static FILTER = {id: 0, price: "1", rule: 0, value: 0};


    state = {
        status: States.STATUS_NORMAL,
        opendeletemodal: false,
        rules: null,
        conditions: [],
        filters: [],
        items: [] //filter list

    }
    constructor(props) {
        super(props);

        this.shopify = Context.getShared();
        this.rules_parameters = this.props.rules_parameters;

        this.new_rule = Util.clone(FilterForm.RULES);
        this.new_condition = Util.clone(FilterForm.CONDITION);
        this.new_filter = Util.clone(FilterForm.FILTER);

        this.state.rules = this.props.data.rules;
        this.state.conditions = this.props.data.conditions;

        this.state.mode = this.props.mode;
        this.state.updated = false;
        this.state.items = this.props.items

        let marketplaces = AmazonHelper.getMarketplaceOptions(this.rules_parameters.selected_marketplaces);

        this.marketplaces = marketplaces;

        this.debounceHandle = debounce(() => {
            this.handleDoSimulate();
        }, 2000);
        console.log(this.state, this.marketplaces);
    }

    componentWillReceiveProps(nextProps, nextContext) {

        /*this.state.rules = nextProps.data.rules;
        this.state.conditions = nextProps.data.conditions;

        this.state.items = nextProps.items;

        this.setState({mode: nextProps.mode})*/
    }

    componentDidMount() {
        this.handleSimulate();
    }

    componentWillUpdate(nextProps, nextState, nextContext) {

        const {onChange} = this.props;
        if( onChange === undefined )
            return;

        if( nextState.updated === false )
            return true;

        let data = {rules: nextState.rules, conditions: nextState.conditions};
        onChange(data);

        if(!(nextState.updated === 'name' || nextState.updated === 'addCondition')){
            this.handleSimulate();
        }
        nextState.updated = false;
    }

    getName(){
        return "filtersForm";
    }

    handleChangeRule = (field) => (value) => {
        let {updated, status, rules} = this.state;
        updated = true;
        status = States.STATUS_CHANGED;
        rules[field] = field === 'name' ?  value : value[0];
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

    handleChangeCondition = (field, index) =>
        (value) => {
            let {updated, status, conditions} = this.state;
            updated = true;
            status = States.STATUS_CHANGED;

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
                updated,
                status,
                conditions,
            }));
        }

    handleDeleteCondition = index => {
        let {updated, status, conditions} = this.state;
        updated = true;
        status = States.STATUS_CHANGED;
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


    render() {

        console.log(this.state);
        let contextual_message = "";
        const conditions_options = Constants.conditions_conditions;
        const rules_conditions = Constants.rules_conditions_filter;

        let options = this.state.rules.options? this.state.rules.options:[];
        let i = 0;

        if (this.state.status == States.STATUS_DUPLICATED) {
            contextual_message = Constants.must_be_unique;
        } else if (this.state.status == States.STATUS_ERROR_REQUIRE_CONDITION) {
            contextual_message = Constants.must_select_condition;
        } else if (this.state.status == States.STATUS_ERROR) {
            contextual_message = this.renderError();
        } else if (this.state.status ==  States.STATUS_SAVED) {
            contextual_message = Constants.saved_successfully;
        }

        var title = CsI18n.t('Edit Filter');
        if (this.props.mode == States.MODE_ADD)
            title = CsI18n.t('New Filter');

        return (
            <CsValidationForm name="filterform">
                <Card.Section title={title}>
                    {contextual_message}
                    <FormLayout>
                        <FormLayout.Group>
                            <CsValidation>
                                <TextField
                                    value={this.state.rules.name}
                                    label={Constants.friendly_name}
                                    placeholder={CsI18n.t("Exclude Levi’s T-Shirts from export")}
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
                                    <Stack.Item>
                                        <ChoiceList
                                            allowMultiple
                                            title={CsI18n.t("Options")}
                                            choices={[
                                                {
                                                    label: CsI18n.t("Delete corresponding offers from Amazon"),
                                                    value: "delete",
                                                    helpText: CsI18n.t(""),
                                                }
                                            ]}
                                            selected={ options }
                                            onChange={this.handleChangeRule('options')}
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
                                    case 'w':
                                        condition_items = empty_item;
                                        break;
                                    case 'm':
                                        condition_items = empty_item.concat(this.marketplaces);
                                        break;
                                    case 'svo': //variant option
                                        condition_items = empty_item;
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
                                    case 'svo':
                                    case 't':
                                        rules_rules = Constants.rules_rules_contains;
                                        if(rule == Constants.RULE_EQUAL) {
                                            rule = Constants.RULE_CONTAINS;
                                        } else if (rule == Constants.RULE_NOT_EQUAL) {
                                            rule = Constants.RULE_NOT_CONTAINS;
                                        }
                                        break;
                                    case 'w':
                                        rules_rules = Constants.rules_rules_only_less_greater;
                                        break;
                                    default:
                                        rules_rules = Constants.rules_rules_std;
                                        break;

                                }

                                let unitButton = (
                                    <div className="shipping-unit">
                                        <Select
                                            options={Constants.UNIT_OF_WEIGHT}
                                            onChange={this.handleChangeCondition("unit", index)}
                                            value={item.unit ? item.unit : 'kg'}
                                        />
                                    </div>);
                                console.log(condition_items)
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
                                                        {(() => {
                                                            if(item.condition === 'w') {
                                                                return (<CsValidation>
                                                                    <TextField
                                                                        key={'then' + index}
                                                                        value={value === 0 ? "" : value}
                                                                        placeholder="10"
                                                                        onChange={this.handleChangeCondition('value', index)}
                                                                        pattern="^[0-9\.]*$"
                                                                        minLength="1"
                                                                        maxLength="6"
                                                                        connectedRight={unitButton}
                                                                    />
                                                                    {Constants.validation_weight_required}
                                                                    {Constants.validation_weight_pattern}
                                                                    {Constants.validation_weight_max_length}
                                                                </CsValidation>)
                                                            } else {
                                                                return (parseInt(rule) === Constants.RULE_EQUAL || parseInt(rule) === Constants.RULE_NOT_EQUAL)
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

                                                        })()
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

                    <Simulator
                      data={this.state}
                      name={this.getName()}
                      rulesParameter={this.rules_parameters}
                      simulator={this.state.simulator}
                      loading={this.state.simulating}/>

                    {this.displayActions()}
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


    displayActions()
    {
        var action_list = [];
        var condition_items = null;
        var label = null;
        var results = [];
        var i = 0;

        if (this.state.conditions.length) {
            this.state.conditions.forEach(item => {

                switch(item.condition) {
                    case 'c':
                        condition_items = this.rules_parameters.collections;
                        label = <CsI18n>Collection</CsI18n>;
                        break;
                    case 'p':
                        condition_items = this.rules_parameters.product_types;
                        label = <CsI18n>Product Type</CsI18n>;
                        break;
                    case 't':
                        condition_items = this.rules_parameters.tags;
                        label = <CsI18n>Tag</CsI18n>;
                        break;
                    case 'v':
                        condition_items = this.rules_parameters.vendors;
                        label = <CsI18n>Vendor</CsI18n>;
                        break;
                    default:
                        return;
                }
                var current_value;
                if( parseInt(item.rule) === 0 ) {
                    current_value = condition_items.find(function (element) {

                        return element.value === item.value;
                    });
                } else if (item.hasOwnProperty('value ') && item.value ) {
                    current_value = {label: item.value, value: item.value}
                }

                if (!results.hasOwnProperty(label)) {
                     results[label] = [];
                }

                if (current_value !== undefined) {
                    results[label].push(current_value);
                }
            });


        }

        var current_conditions = this.state.rules.condition;

        [CsI18n.t('Collection'), CsI18n.t('Product Type'), CsI18n.t('Tag'), CsI18n.t('Vendor')].forEach(
            function(element) {
                console.log(results[element])
                if (results[element] !== undefined && results[element].length) {
                    var items = '';
                    let arr = results[element];

                    arr.forEach(item => {
                        if (item.label === null) return;
                        items += item.label + (current_conditions == 'any' ? ' or ' : ' and ');
                    });

                    if (items) {
                        let list = items.replace(/(\s)*(and|or)\s*$/, '');
                        let is_or_are = results[element].length > 1 ? CsI18n.t('{{element}}s are',{element:element}) : CsI18n.t('{{element}} is',{element:element});

                        let key=element+i.toString();
                        action_list.push(<TextStyle key={key} variation="positive">&nbsp;&nbsp;&nbsp;<CsI18n is_or_are={is_or_are} list={list}>{"When {{is_or_are}}: {{list}}"}</CsI18n><br /></TextStyle>);
                        i++;
                    }
                }
            }
        );



        if (action_list.length) {
                var action_list_display = action_list.map((l) => l);

                return(
                    <Card.Section title={CsI18n.t("Action")}>
                        <TextStyle><CsI18n>Your rule:</CsI18n></TextStyle><br />
                        {action_list_display}
                        <TextStyle><CsI18n>Then:</CsI18n></TextStyle><br />
                        <TextStyle variation="negative">&nbsp;&nbsp;&nbsp;<CsI18n>Products will be ignored</CsI18n></TextStyle><br />
                    </Card.Section>
                )
        }
        return('');
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
        if( CsValidationForm.validate("filterform") === false)
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
export default FilterForm;
