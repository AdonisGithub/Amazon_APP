import React from "react";
import CsI18n from "../../components/csI18n"

import States from "../../helpers/rules/states";
import Constants from "../../helpers/rules/constants";
import ApplicationApiCall from "../../functions/application-api-call";

import {
  Avatar,
  Button,
  ButtonGroup,
  Card,
  Caption,
  ChoiceList,
  FormLayout,
  ResourceList,
  Select,
  Stack,
  Spinner,
  TextField,
  TextStyle, TextContainer,
  Modal, Heading,
} from "@shopify/polaris";

import Util from "../../helpers/Util";
import {CsValidationForm, CsValidation} from '../../components/csValidationForm'
import CategoryRule from "./category";
import CsTreeComponent from "../../components/csTreeComponent";
import CsErrorMessage from "../../components/csErrorMessage/csErrorMessage"
import CsEmbeddedModal from "../../components/csEmbeddedModal";
import {DeleteMinor, PlusMinor} from "@shopify/polaris-icons";
import CsVideoTutorialButton from "../../components/csVideoTutorialButton";
import VideoTutorial from "../../helpers/VideoTutorial";
import ShopifyContext from "../../context";

const LIMIT = 1;              // limit of selection of CsTreeComponent

class CategoryForm extends States {
  static RULES = {name: '', condition: 'all'};
  static CONDITION = {id: 0, condition: 'c', rule: 0, value: 0};
  static CATEGORY = {category: []};

  state = {
    status: States.STATUS_NORMAL,
    opendeletemodal: false,
    items: [], //category list
    category_loading: false,
    wait: true,
    refresh: 1,
  }

  constructor(props) {
    super(props);
    this.shopify = ShopifyContext.getShared();
    this.rules_parameters = this.props.rules_parameters;

    this.new_rule = Util.clone(CategoryForm.RULES);
    this.new_condition = Util.clone(CategoryForm.CONDITION);
    this.new_category = Util.clone(CategoryForm.CATEGORY);

    this.state.rules = this.props.data.rules;
    this.state.conditions = this.props.data.conditions;
    this.state.categories = this.props.data.categories;
    this.state.mode = this.props.mode;
    this.state.updated = false;
    this.state.items = this.props.items;

    this.root_categories = [];
    this.state.current_categories = []; //[{label, value, parent, loading: true, nodes: subcategories, showlist}]

    if (this.props.root_categories.length) {
      this.root_categories = this.props.root_categories;
      this.root_categories.forEach((item, index) => {
        if (this.state.categories[index] !== undefined && !this.state.categories[index].hasOwnProperty('marketplace_id')) {
          this.state.categories[index].marketplace_id = item.MarketplaceId;
        }
      });
      this.state.wait = false;
    }
    this.unMounted = false;
    // console.log('CategoryForm constructor', this.state, this.props.root_categories, this.props.data, this.state.categories);
  }

  componentWillReceiveProps(nextProps, nextContext) {
    console.log("componentWillReceiveProps", nextProps);


    /*let rules = nextProps.data.rules;
    let conditions = nextProps.data.conditions;
    let categories = nextProps.data.categories;

    let items = nextProps.items;


    this.setState(state =>({
      ...state,
      rules,
      conditions,
      categories,
      mode: nextProps.mode
    }));*/


  }

  componentWillMount() {
    for (let key in this.root_categories) {
      this.state.current_categories[key] = {};
      this.loadCategories(key);
    }
    console.log("componentWillMount: ", this.state);

  }

  componentWillUnmount() {
    this.unMounted = true;
  }

  componentWillUpdate(nextProps, nextState, nextContext) {
    console.log("categoryForm: componentWillUpdate", nextState.updated);


    const {onChange} = this.props;
    if (onChange === undefined)
      return;

    if (nextState.updated === false)
      return true;

    let data = {rules: nextState.rules, conditions: nextState.conditions, categories: nextState.categories};
    onChange(data);

    nextState.updated = false;
  }

  handleChangeRule = (field) => (value) => {
    let {updated, status, rules} = this.state;
    updated = true;
    status = States.STATUS_CHANGED;
    rules[field] = field === 'name' ? value : value[0]
    // console.log('handleChangeRue, Current State:', this.state);
    // console.log('Field:', field);


    this.setState(state => ({
      ...state,
      updated,
      status,
      rules
    }));
  }

  handleAddCondition = () => {
    let {updated, status} = this.state;
    updated = true;
    status = States.STATUS_CHANGED;
    // console.log('handleAddCondition, Current State:', this.state.conditions);

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
    // console.log('handleChangeCondition, Current State:', this.state);
    // console.log('Field:', field, 'Index:', index);
    conditions[index][field] = value

    if(field === 'condition'){
      conditions[index]['rule'] = 0;
      conditions[index]['value'] = 0;
    }
    if (field == 'rule') {
      if (parseInt(this.state.conditions[index]['rule']) == 0)
        conditions[index]['value'] = ""
      else
        conditions[index]['value'] = 0
    }
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

  getChildCategories(index, catValue) {
    let marketplaceId = this.root_categories[index].MarketplaceId;
    console.log('current_category:', index, " catValue: ", catValue);

    let configuration = this.shopify.getConfigurationSelected();
    this.state.current_categories[index].loading = true;
    ApplicationApiCall.get('/application/parameters/browsenodes',
      {
        type: 'nodes',
        configuration: configuration,
        marketplace_id: marketplaceId, browse_node_id: catValue},
      (json) => {
        this.cbLoadChildCategories(index, catValue, json);
      }, this.cbGetNodesError);
    this.setState({refresh: 1});
  }

  loadCategories(index) {
    let catValue = 0;//this.state.categories[index].category;
    let marketplaceId = this.root_categories[index].MarketplaceId;
    let catData = CategoryRule.GetCategory(marketplaceId, catValue);
    if (catData) {
      /*this.state.current_categories[index].label = catData.label;
      this.state.current_categories[index].value = catData.value;
      this.state.current_categories[index].parent = catData.parent;
      this.state.current_categories[index].showlist = false;*/

      if (catData.has_children === 0 || catData.children.length > 0) {
        this.state.current_categories[index].loading = false;
        this.state.current_categories[index].children = catData.children;
        this.state.children = catData.children;
      } else {
        this.getChildCategories(index, catValue);
      }
    } else {
      console.error("catData is null");
    }
  }

  cbLoadChildCategories = (index, catValue, json) => {
    if (this.unMounted) {
      return;
    }
    let {current_categories} = this.state;
    let marketplace_index = this.root_categories.findIndex(function (item) {
      return json.MarketplaceId === item.MarketplaceId;
    });
    if (marketplace_index != index) {
      console.error('cbLoadChildCategories No Matched: ', index, ", cb_marketplace_id: ", marketplace_index);
    }
    console.log('cbLoadChildCategories', index, catValue, json);


    CategoryRule.SetCategoryChildren(this.root_categories[index].MarketplaceId, catValue, json.BrowseNodes);
    this.state.current_categories[index].children.forEach(item => {
      if(item.children && item.children.length){
        this.setChildren(item, catValue, json.BrowseNodes)
      }else{
        if(item.value === catValue){
          item.children = json.BrowseNodes;
        }
      }
    })
    console.log("cbLoadChildCategories", json, this.state.current_categories[index].children)

    for ( let node of json.BrowseNodes) {
      CategoryRule.AddCategory(this.root_categories[index].MarketplaceId, node.value, node);
    }

    current_categories[index].loading = false;
    this.setState(state => ({
      ...state,
      current_categories,
      refresh: 1
    }));
  }

  //change select, do not change select
  handleChangeCategory = (field, index) => (catValue) => {
    let {updated, status, categories} = this.state;
    updated = true;
    status = States.STATUS_CHANGED
    categories[index][field] = catValue;
    let marketplaceId = this.root_categories[index].MarketplaceId;
    categories[index]['marketplace_id'] = marketplaceId;

    this.setState(state => ({
      ...state,
      updated,
      status,
      categories,
    }));
  }

  handlePrevCategory = (field, index) => () => {
    let {updated, status, current_categories, categories} = this.state;
    updated = true;
    status = States.STATUS_CHANGED;

    console.log("handlePrevCategory", field, index);

    let marketplaceId = this.root_categories[index].MarketplaceId;
    let parentValue = this.state.current_categories[index].parent;
    let catData = CategoryRule.GetCategory(marketplaceId, parentValue);
    if (catData) {
      let grandParent = CategoryRule.GetCategory(marketplaceId, catData.parent);
      current_categories[index].label = catData.label;
      current_categories[index].value = catData.value;
      current_categories[index].parent = catData.parent;
      current_categories[index].showlist = true;

      categories[index][field] = parentValue;

      if( !grandParent ) {
        console.error("grandParent is null");
      }
      if ( grandParent.has_children === 0 || grandParent.children.length > 0 ) {
        current_categories[index].loading = false;
        current_categories[index].nodes = grandParent.children;
      } else {
        this.getChildCategories(index, grandParent.value);
      }
      this.setState(state => ({
        ...state,
        updated,
        status,
        current_categories,
        categories,
      }));
    } else {
      console.error("handlePrevCategory catData is null");
    }
  }


  handleNextCategory = (field, index) => (catValue, cb) => {

    this.state.updated = true;
    this.state.status = States.STATUS_CHANGED;

    console.log('handleNextCategory:', field, ", index ", index, " value: ", catValue, CategoryRule.CategoryMap);

    let marketplaceId = this.root_categories[index].MarketplaceId;
    let catData = CategoryRule.GetCategory(marketplaceId, catValue);
    if (catData) {
        console.log('current_category:', index, " catValue: ", catValue);
        let configuration = this.shopify.getConfigurationSelected();
        ApplicationApiCall.get('/application/parameters/browsenodes',
          {
            type: 'nodes',
            configuration,
            marketplace_id: marketplaceId, browse_node_id: catValue},
          (json) => {
            this.setCbChildren(index, catValue, json);
            cb(this.state.current_categories[index].children)
          }, this.cbGetNodesError);
    } else {
      console.error("handleNextCategory catData is null");
    }
  }

  cbGetNodesError = (err) => {
    console.log(err);


    if(err){
      // setTimeout(() => {
      //   this.setState({error: null})
      // }, 5000)

      this.setState({error: err})
    }
  }

  setCbChildren(index, catValue, json){
    CategoryRule.SetCategoryChildren(this.root_categories[index].MarketplaceId, catValue, json.BrowseNodes);
    this.state.current_categories[index].children.forEach(item => {
      if(item.children && item.children.length){
        this.setChildren(item, catValue, json.BrowseNodes)
      }else{
        if(item.value === catValue){
          item.children = json.BrowseNodes;
        }
      }
    })
    console.log("cbLoadChildCategories", json, this.state.current_categories[index].children)

    for ( let node of json.BrowseNodes) {
      CategoryRule.AddCategory(this.root_categories[index].MarketplaceId, node.value, node);
    }
  }

  setChildren(item, value, children){
    item.children.forEach(child => {
      if(child.children && child.children.length > 0){
        this.setChildren(child, value, children);
      }else{
        if(child.value === value){
          child.children = children
        }
      }
    })
  }

  render() {
    if(this.state.error){
      return (this.renderError());
    }
    if (this.state.wait) {
      return (this.renderWait());
    } else {
      return (this.renderForm());
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

  renderWait() {
    return (
      <Card>
        <Card.Section>
          <div align="center">
            <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
          </div>
        </Card.Section>
      </Card>
    );
  }

  renderForm() {
    let contextual_message = "";

    const conditions_options = Constants.conditions_conditions;
    const rounding_modes = Constants.rounding_modes;
    const rules_conditions = Constants.rules_conditions;
    const video = <CsVideoTutorialButton url={VideoTutorial.rules_categories}/>

    console.log("category", this.state.categories, "current_categories", this.state.current_categories);

    if (this.state.status == States.STATUS_DUPLICATED) {
      contextual_message = Constants.must_be_unique;
    } else if (this.state.status == States.STATUS_ERROR_REQUIRE_CONDITION) {
      contextual_message = Constants.must_select_condition;
    } else if (this.state.status == States.STATUS_ERROR) {
      contextual_message = this.renderError();
    } else if (this.state.status == States.STATUS_SAVED) {
      contextual_message = Constants.saved_successfully;
    }
    let title;
    let heading;

    if (this.props.mode == States.MODE_ADD)
      title = CsI18n.t('New Category Rule');
    else
      title = CsI18n.t('Edit Category Rule');

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
      <CsValidationForm name="categoryform">
        <Card.Section>
          {heading}
          {contextual_message}
          <FormLayout>
            <FormLayout.Group>
              <CsValidation>
                <TextField
                  value={this.state.rules.name}
                  label={Constants.friendly_name}
                  placeholder={CsI18n.t("Associate T-Shirt categories")}
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
              <TextStyle><CsI18n>Example</CsI18n><Caption><CsI18n>Apply for this rule and specified conditions, a
                category as configured below</CsI18n></Caption></TextStyle>
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

                const conditions_rule_1 = [
                  {label: CsI18n.t('is equal to'), value: 2},
                  {label: CsI18n.t('is less than'), value: 3},
                  {label: CsI18n.t('is greater than'), value: 4}
                ];
                const conditions_rule_2 = [
                  {label: CsI18n.t('is equal to'), value: 0},
                  {label: CsI18n.t('contains'), value: 1}
                ];

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
                  default:
                    condition_items = [{label: '', value: 0, disabled: true}];
                    rules_rules = conditions_rule_2;
                    break;
                }
                // console.log("item", item);
                // console.log("condition_items", condition_items);
                // console.log("rules_rules", rules_rules);
                // console.log("rule", rule);


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
                              parseInt(rule) === 0
                                ? (<Select
                                  options={condition_items}
                                  onChange={this.handleChangeCondition('value', index)}
                                  value={value}
                                />)
                                :
                                (<TextField
                                  value={value === 0 ? "" : value}
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
            <FormLayout>
              <TextStyle><CsI18n>Example</CsI18n><Caption><CsI18n>For products from clothes collection, apply the
                product category code below</CsI18n></Caption></TextStyle>
            </FormLayout>
          </Card.Section>


          <Card.Section title={CsI18n.t("Categories for")}>
            <FormLayout>
              <FormLayout.Group>
                <ResourceList
                  resourceName={{singular: 'marketplace', plural: 'marketplaces'}}
                  items={this.root_categories}
                  renderItem={(item, index) => {
                    const {BrowseNodes, DefaultCountryCode, DefaultCurrencyCode, DefaultLanguageCode, DomainName, MarketplaceId, Name} = item;

                    let iso_code = DefaultCountryCode.toLowerCase();
                    const image_url = this.shopify.static_content + '/amazon/flags/flag_' + iso_code + '_64px.png'
                    const media = <Avatar customer size="medium" name={Name} source={image_url}/>;

                    if (this.state.categories[index] === undefined || this.state.categories[index].category === undefined)
                      return (null);

                    let category = this.state.categories[index].category;

                    let selectedNodes = [];
                    category.forEach((catVal) => {
                      let node = CategoryRule.GetCategory(this.root_categories[index].MarketplaceId, catVal);
                      if(node){
                        selectedNodes.push(node);
                      }else{
                        console.error("catData is null");
                      }
                    })
                    //let selectedNodes = this.state.selectedNodes[index];

                    /*let loading = this.state.current_categories[index].loading;
                    let bShowPrev = this.state.current_categories[index].parent != 0;
                    let bShowList = this.state.current_categories[index].showlist;
                    let categories = this.state.current_categories[index].nodes;

                    if (categories && categories.length) {
                        categories = categories.map((item) => ({
                            label: item.label,
                            value: item.value,
                            next: item.has_children == 1? true : false
                        }));
                    } else {
                      categories = [];
                    }*/
                    console.log(this.state.current_categories[index], category, selectedNodes);
                    return (
                      <ResourceList.Item
                        id={index}
                      >
                        <Stack vertical wrap={false}>
                          <Stack.Item>
                            <Stack alignment="center">>
                              <Stack.Item>
                                {media}
                              </Stack.Item>
                              <Stack.Item>
                                {DomainName}
                              </Stack.Item>
                            </Stack>
                          </Stack.Item>
                          <Stack.Item>
                            <Stack>
                              <Stack.Item fill>
                                {/*<CsAutoComplete
                                  options={categories}
                                  onChange={this.handleChangeCategory('category', index)}
                                  selected={category}
                                  loading={loading}
                                  showPrev={bShowPrev}
                                  onClickPrev={this.handlePrevCategory('category', index)}
                                  showNext={true}
                                  onClickNext={this.handleNextCategory('category', index)}
                                  showList={bShowList}
                                />*/}
                                <CsTreeComponent
                                  data={this.state.current_categories[index]}
                                  limit={LIMIT}
                                  selected={category}
                                  selectedNodes={selectedNodes}
                                  close={true}
                                  onChange={this.handleChangeCategory('category', index)}
                                  onClickNext={this.handleNextCategory('category', index)}
                                />
                              </Stack.Item>
                            </Stack>
                          </Stack.Item>
                        </Stack>
                        {/*<Stack wrap={false} fill>*/}
                        {/*<Stack.Item fill>*/}
                        {/*<FormLayout>*/}
                        {/*<FormLayout.Group condensed>*/}
                        {/*<Select*/}
                        {/*label={CsI18n.t("When")} labelInline*/}
                        {/*options={rules_conditions}*/}
                        {/*onChange={this.handleChangeCondition('condition', index)}*/}
                        {/*value={condition}*/}
                        {/*/>*/}
                        {/*<Select*/}
                        {/*options={rules_rules}*/}
                        {/*onChange={this.handleChangeCondition('rule', index)}*/}
                        {/*value={parseInt(rule)}*/}
                        {/*/>*/}
                        {/*{*/}
                        {/*parseInt(rule) === 0*/}
                        {/*? (<Select*/}
                        {/*options={condition_items}*/}
                        {/*onChange={this.handleChangeCondition('value', index)}*/}
                        {/*value={value}*/}
                        {/*/>)*/}
                        {/*:*/}
                        {/*(<TextField*/}
                        {/*value={value === 0? "":value}*/}
                        {/*onChange={this.handleChangeCondition('value', index)}*/}
                        {/*/>)*/}
                        {/*}*/}
                        {/*</FormLayout.Group>*/}
                        {/*</FormLayout>*/}
                        {/*</Stack.Item>*/}
                        {/*<Stack.Item distribution="trailing">*/}
                        {/*{parseInt(id) === 0 && (*/}
                        {/*<Button icon={PlusMinor} onClick={this.handleAddCondition}/>*/}
                        {/*)}*/}
                        {/*{parseInt(id) > 0 && (*/}
                        {/*<Button icon={DeleteMinor}*/}
                        {/*onClick={() => this.handleDeleteCondition(index)}/>*/}
                        {/*)}*/}
                        {/*</Stack.Item>*/}

                        {/*</Stack>*/}
                      </ResourceList.Item>

                    );
                  }}
                />
              </FormLayout.Group>

            </FormLayout>
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
                  {this.state.mode === States.MODE_EDIT && <Button icon={DeleteMinor} onClick={this.deleteConfirmation}
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
    if (onClose === undefined)
      return;

    onClose();
  }

  handlerFormClose = () => {

    this.updateStatus(States.EVENT_CLOSE);
  }

  handlerSave = () => {
    if (CsValidationForm.validate("categoryform") === false)
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

}

export default CategoryForm;
