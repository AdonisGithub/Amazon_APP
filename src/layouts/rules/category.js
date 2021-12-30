import AmazonTab from '../../helpers/amazon-tab'
import React from "react";
import CsI18n from "../../components/csI18n"

import States from "../../helpers/rules/states";
import Constants from "../../helpers/rules/constants";
import ApplicationApiCall from "../../functions/application-api-call";
import RuleTab from "./rule_tab";

import {
  Banner,
  Badge,
  Button,
  ButtonGroup,
  Card,
  Caption,
  ResourceList,
  Stack,
  Spinner,
  Avatar, Heading,

} from "@shopify/polaris";


import CategoryForm from "./categoryForm";
import Util from "../../helpers/Util";
import CsErrorMessage from "../../components/csErrorMessage/csErrorMessage";
import CsVideoTutorialButton from "../../components/csVideoTutorialButton";
import VideoTutorial from "../../helpers/VideoTutorial";
import ShopifyContext from "../../context";


class CategoryRule extends RuleTab {

  static CategoryMap = []; //{value, label, has_children, parent, children}
  static GetCategory(marketplaceId, catValue) {
    if (!CategoryRule.CategoryMap[marketplaceId] || !CategoryRule.CategoryMap[marketplaceId][catValue]) {
      return null;
    }
    return CategoryRule.CategoryMap[marketplaceId][catValue];
  }

  static AddCategory(marketplaceId, catValue, data) {
    if (!CategoryRule.CategoryMap[marketplaceId]) {
      CategoryRule.CategoryMap[marketplaceId] = [];
    }
    if (CategoryRule.CategoryMap[marketplaceId][catValue]) {
      return;
    }
    CategoryRule.CategoryMap[marketplaceId][catValue] = {...data, children: []};
  }

  static SetCategoryChildren(marketplaceId, catValue, children) {
    if (!CategoryRule.CategoryMap[marketplaceId] || !CategoryRule.CategoryMap[marketplaceId][catValue]) {
      return null;
    }
    CategoryRule.CategoryMap[marketplaceId][catValue].children = children;
  }

  //add for debug
  getName() {
    return "Category";
  }

  constructor(props) {
    super(props);
    this.shopify = ShopifyContext.getShared();
    this.rules_parameters = this.props.rules_parameters;
    this.root_categories = [];
    this.defaults = {
      ...this.defaults,
      categories: [], //saved categories
    };

    this.defaults_edit =  {
      items: [], //saved_rules and editing rules
      edit: [],  //item : 1: editing, 2: saved 3: updating( edit after saved),
      current: -1, //
      status: States.STATE_EMPTY,
    };

    this.loadConfig();
  }

  loadRootCategories = () => (json) => {
    if (this.unMounted) {
      return;
    }
    if (json) {
      this.root_categories = json;
      for (let i = 0; i < this.root_categories.length; i++) {
        CategoryRule.AddCategory(this.root_categories[i].MarketplaceId, 0, {
          label: "",
          value: 0,
          parent: 0,
          has_children: this.root_categories[i].BrowseNodes.length > 0 ? 1 : 0
        });
        CategoryRule.SetCategoryChildren(this.root_categories[i].MarketplaceId, 0, this.root_categories[i].BrowseNodes);
        if (this.root_categories[i].BrowseNodes && this.root_categories[i].BrowseNodes.length) {
          for (let node of this.root_categories[i].BrowseNodes) {
            CategoryRule.AddCategory(this.root_categories[i].MarketplaceId, node.value, node);
          }
        }
      }

      if (this.state.data.categories.length === 0) {
        this.setState({wait: false});
      } else {
        this.waitcount = 0;
        for (let key in this.root_categories) {
          let nodes = [];
          this.state.data.categories.map((item) => {
              if (item.categories[key] !== undefined && item.categories[key].category.length !== undefined && item.categories[key].category.length > 0) {
              nodes = nodes.concat(item.categories[key].category);
            }
          });

          nodes = nodes.filter((node, index, self) => {
            return index === self.indexOf(node);
          })
          if (nodes.length > 0) {
            this.waitcount++;
            this.loadNodesCategories(this.root_categories[key].MarketplaceId, nodes);
          }
        }
        if (this.waitcount === 0) {
          this.setState({wait: false});
        }
      }

    }
  }

  cbLoadConfigError = (err) => {
    console.log(err);
    if(err){
      // setTimeout(() => {
      //   this.setState({error: null})
      // }, 5000)

      this.setState({error: err, wait: false})
    }
  }

  loadNodesCategories = (marketplaceId, nodes) => {
    console.log("loadNodesCategories: ", marketplaceId, nodes);

    let configuration = this.shopify.getConfigurationSelected();
    let params = {
      configuration: configuration,
      type: 'node',
      marketplace_id: marketplaceId,
      browse_node_id: nodes.join(",")
    };
    ApplicationApiCall.get('/application/parameters/browsenodes', params, this.cbLoadNodesCategories, this.cbLoadConfigError);
  }

  cbLoadNodesCategories = (json) => {
    if (this.unMounted) {
      return;
    }
    if (json) {
      json.BrowseNodes.forEach(node => {
        let catData = CategoryRule.GetCategory(json.MarketplaceId, node.value);
        console.log("cbLoadNodesCategories: ", catData);

        if (!catData) {
          CategoryRule.AddCategory(json.MarketplaceId, node.value, node);
        }
      });

      this.waitcount--;
      if (this.waitcount == 0) {
        this.setState({wait: false});
      }
    }
  }


  loadConfig() {

    let configuration = this.shopify.getConfigurationSelected();

    this.state.wait = true;
    let params = {
      configuration: configuration,
      type: 'root'
    };
    ApplicationApiCall.get('/application/parameters/browsenodes', params, this.loadRootCategories(), this.cbLoadConfigError);

    let config = this.configurationGetCurrent();

    config = {...this.defaults, ...config};
    let {categories} = Util.clone(config);
    let data_edit = Util.clone(this.defaults_edit);

    if (categories.length) {
      categories = categories.filter(item => (item.hasOwnProperty('rules') && item.rules.name.length));
      data_edit.items = Util.clone(categories);
      for (let i = 0; i < data_edit.items.length; i++) {
        data_edit.edit.push(States.EDIT_SAVED); //saved_flag
      }
      config.categories = categories;
    }
    this.state.data = config;
    this.data_edit = data_edit;
  }

  componentWillMount() {
    this.updateStatus(States.EVENT_REFRESH);
  }

  componentWillReceiveProps(nextProps) {
    // console.log("componentWillReceiveProps");

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
    // console.log("category: updateStatus", this.data_edit.status, this.state, event, id);
    // console.log(preStatus, status);


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
            if (this.state.data.categories.length > 0) {
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
            if (parseInt(current) !== id) {
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
          case States.STATE_EDIT: {
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
            break;
        }
      }
        break;
      case States.EVENT_CLOSE: {
        switch (preStatus) {
          case States.STATE_ADD:
          case States.STATE_EDIT: {
            this.doClose(data);
            current = -1;
            if (this.state.data.categories.length > 0) {
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
        if (this.state.data.categories.length > 0) {
          if (current !== -1 && event !== States.EVENT_REFRESH) {
            status = States.STATE_EDIT;//Editing
          } else {
            status = States.STATE_NORMAL;
            current = -1;
          }
        } else {
          status = this.rules_parameters.shopify_inventory_loaded === 0 ? States.NONE : States.STATE_EMPTY ;
        }
      }
        break;
    }
    this.data_edit.current = current;
    this.data_edit.status = status;
    this.saveState();
    this.setState(state => ({
      ...state,
        data,
    }));
  }


  doAdd = (data) => {
    let category = {
      rules: CategoryForm.RULES,
      conditions: [CategoryForm.CONDITION],
      categories: [],
    };

    for (let key in this.root_categories) {
      category.categories[key] = CategoryForm.CATEGORY;
    }

    let id = this.state.data.categories.length;
    data.categories[id] = Util.clone(category);
    this.data_edit.items[id] = Util.clone(category);
    this.data_edit.edit[id] = States.EDIT_NEW;
    return id;
  }

  doDelete = (data) => {
    let id = parseInt(this.data_edit.current);
    // console.log("category: updateStatus", this.data_edit.status, this.state, event, id);
    // console.log(preStatus, status);

    const categories = this.state.data.categories.filter((item, i) => id !== i);
    // console.log(this.state.data.categories, categories);

    data.categories = categories;
    const items = this.data_edit.items.filter((item, i) => (id !== i));
    this.data_edit.items = items;
    const edit = this.data_edit.edit.filter((item, i) => id !== i);
    this.data_edit.edit = edit;
  }

  doSave = (data) => {
    // console.log("category: doSave", id);
    let id = parseInt(this.data_edit.current);
    data.categories[id] = Util.clone(this.data_edit.items[id]);
    this.data_edit.edit[id] = States.EDIT_SAVED;
  }

  doClose = (data) => {
    // console.log("category: doClose", id)

    let id = parseInt(this.data_edit.current);
    if (this.data_edit.edit[id] === States.EDIT_NEW) {
      data.categories = this.state.data.categories.filter((item, i) => id !== i);
      this.data_edit.items = this.data_edit.items.filter((item, i) => (id !== i));
      this.data_edit.edit = this.data_edit.edit.filter((item, i) => id !== i);
    } else {
      this.data_edit.items[id] = Util.clone(this.state.data.categories[id]);
      this.data_edit.edit[id] = States.EDIT_SAVED;
    }
  }

  handlerAddButton = () => {
    this.updateStatus(States.EVENT_ADD);
  }

  handlerEdit(id) {
    // console.log("category: doClose", id)

    this.updateStatus(States.EVENT_EDIT, parseInt(id));
  };

  handlerFormSave = (cbSuccess, cbError) => {
    // console.log("category: doClose", id)


    const id = parseInt(this.data_edit.current);
    let categories = [];
    for (let i = 0; i < this.state.data.categories.length; i++) {
      if (i === id) {
        categories.push(this.data_edit.items[i]);
      } else {
        if (this.data_edit.edit[i] < States.EDIT_SAVED)
          continue;

        categories.push(this.state.data.categories[i]);
      }
    }

    let configData = {...this.defaults, ...this.configurationGetCurrent(), categories};

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
    // console.log("category: handlerSave", this.data_edit.current, this.state);

    this.updateStatus(States.EVENT_CLOSE);
  }

  handlerFormDelete = () => {
    // console.log("category: handlerSave", this.data_edit.current);

    const id = parseInt(this.data_edit.current);
    let categories = [];
    if (this.data_edit.edit[id] < States.EDIT_SAVED) {
      this.updateStatus(States.EVENT_DELETE_DONE);
    } else {
      for (let i = 0; i < this.state.data.categories.length; i++) {
        if (this.data_edit.edit[i] < States.EDIT_SAVED)
          continue;

        if (i === id)
          continue;
        categories.push(this.state.data.categories[i]);
      }

      let configData = {...this.defaults, ...this.configurationGetCurrent(), categories};

      const {onSave} = this.props;

      onSave(configData, () => {
        this.updateStatus(States.EVENT_DELETE_DONE);
      });
    }
  }

  handlerFormChange = (data) => {
    // console.log("category: handlerFormChange", this.data_edit.current);

    const id = parseInt(this.data_edit.current);
    this.data_edit.items[id] = data;
    if (this.data_edit.edit[id] === States.EDIT_SAVED) {
      this.data_edit.edit[id] = States.EDIT_UPDATING;
    }
    this.saveState();
  }

  render() {
    if(this.state.error){
      return (this.renderError());
    }else if (this.state.wait) {
      return (this.renderWait());
    } else {
      return (this.renderPage());
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

  renderPage() {
    const status = this.data_edit.status;
    if (this.state.wait) {
      return (
        <Card>
          <div align="center">
            <br/>
            <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
          </div>
        </Card>
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
      <CategoryForm
        mode={mode}
        data={data}
        items={this.data_edit.items}
        selectedNodes={this.state.selectedNodes}
        rules_parameters={this.rules_parameters}
        root_categories={this.root_categories}
        shopifyContext={this.shopify}
        onSave={this.handlerFormSave}
        onClose={this.handlerFormClose}
        onDelete={this.handlerFormDelete}
        onChange={this.handlerFormChange}
      />
    );
  }

  renderList() {
    const resourceName = {singular: 'category', plural: 'categories'};

    const items = this.state.data.categories;
    const hasContent = items.length;
    const status = this.data_edit.status;

    console.log("Category List:", this.state.data.categories);

    if (hasContent && !(status === States.STATE_EDIT || status === States.STATE_ADD)) {

      // Sorting alphabetically
      items.sort(function (a, b) {
        if (a.rules.name < b.rules.name) {
          return -1;
        }
        if (a.rules.name > b.rules.name) {
          return 1;
        }
        return 0;
      })


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
        let heading =
            <Stack>
                <Stack.Item>
                    <Heading element="h3">{CsI18n.t("No category rule configured yet")}</Heading>
                </Stack.Item>
                <Stack.Item>
                        <span className={"csRulesVideoEmptyState"}>
                            <CsVideoTutorialButton url={VideoTutorial.rules_categories}/>
                        </span>
                </Stack.Item>
            </Stack>

      return (
        <Card.Section>
          <Banner
            status="default"
            action={{content: <CsI18n>Add category rule</CsI18n>, onAction: this.handlerAddButton.bind(this)}}
          >
              {heading}
            <p><CsI18n>A rule for a category is used to configure its specific workflow
            </CsI18n></p>
          </Banner>
        </Card.Section>
      );
    }
  }

  renderTags(id){

    return this.data_edit.items[id].categories.map((item, index) => {
      console.log(this.root_categories[index], id);
      if (item.category.length > 0 && this.root_categories[index]) {
        let iso_code = this.root_categories[index].DefaultCountryCode.toLowerCase();
        const image_url = this.shopify.static_content + '/amazon/flags/flag_' + iso_code + '_64px.png'
        let selectedNodes = []
        for (let catIndex in item.category) {
          let node = CategoryRule.GetCategory(this.root_categories[index].MarketplaceId, item.category[catIndex])
          if (node) {
            selectedNodes.push(<Badge key={node.value}>{node.label}</Badge>);
          } else {
             console.error("catData is null");
          }
        }
        return(
          <Stack.Item key={index}>
            <Stack wrap={false} spacing="extraLoose" alignment="center">
              <Stack.Item><Avatar customer size="small" source={image_url}/></Stack.Item>
              <Stack.Item fill>{selectedNodes}</Stack.Item>
            </Stack>
          </Stack.Item>
        );
      }
    })
  }

  renderItem = (item, id) => {
    let display_name = '';
    const {name} = item.rules;

    let selectedBadge = [];


    if (!name.length) { // filter empty items
      return;
    }

    // let condition = item.rules.condition.toString();
    // condition = condition === 'all' ? CsI18n.t('All Conditions') : CsI18n.t('Any Condition');

    // let category_category = [];
    // let selected_category_category = category_category.label !== undefined && category_category.label.length ?
    //category_category.label : '';
    //

    return (
      <ResourceList.Item id={id}>
        <Stack wrap={false}>
          <Stack.Item fill>
            <Stack vertical>
              <Stack.Item>
                <Heading>{name}</Heading>
                <Caption>
                  {/*<CsI18n>Product must match:</CsI18n>*/}
                  {/*{item.category.ptc.length || selected_category_category.length ? CsI18n.t('Category') + ': ' : ''}*/}
                  {/*{item.category.ptc.length ? item.category.ptc : ''}*/}
                  {/*{selected_category_category.length && item.category.ptc.length ? ', ' : ''}*/}
                  {/*{selected_category_category.length ? selected_category_category : ''}*/}
                </Caption>
              </Stack.Item>
              <Stack.Item>
                <Stack vertical spacing="tight">
                  {this.renderTags(id)}
                </Stack>
              </Stack.Item>
            </Stack>
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

export default CategoryRule;
