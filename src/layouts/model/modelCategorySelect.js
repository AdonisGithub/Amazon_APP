import React from 'react';
import ApplicationApiCall from "../../functions/application-api-call";
import CsTreeComponent from "../../components/csTreeComponent";
import ShopifyContext from "../../context";
import CsI18n from "../../components/csI18n";

import {Spinner, Stack, Form, TextField, Button, ResourceList, Heading, Caption} from "@shopify/polaris";
import Util from "../../helpers/Util";

export class ModelCategorySelect extends React.Component {

    state = {
        category_loading: false,
        wait: true,
        keyword: '',
        searching: false,
        search_result: [],
        refresh: true,
    }
    constructor(props) {
        super(props);
        this.state.marketplace_id = this.props.marketplace_id;
        this.state.category = this.props.category;
        this.state.current_categories = {}; //[{label, value, parent, loading: true, nodes: subcategories, showlist}]
        this.root_categories = {};
        this.shopify = ShopifyContext.getShared();
        console.log("constructor", this.state);
    }

    static CategoryMap = []; //{value, label, has_children, parent, children}
    static GetCategory(marketplaceId, catValue) {
        if (!ModelCategorySelect.CategoryMap[marketplaceId] || !ModelCategorySelect.CategoryMap[marketplaceId][catValue]) {
            return null;
        }
        return ModelCategorySelect.CategoryMap[marketplaceId][catValue];
    }

    static AddCategory(marketplaceId, catValue, data) {
        if (!ModelCategorySelect.CategoryMap[marketplaceId]) {
            ModelCategorySelect.CategoryMap[marketplaceId] = [];
        }
        if (ModelCategorySelect.CategoryMap[marketplaceId][catValue]) {
            return;
        }
        ModelCategorySelect.CategoryMap[marketplaceId][catValue] = {...data, children: []};
    }

    static SetCategoryChildren(marketplaceId, catValue, children) {
        if (!ModelCategorySelect.CategoryMap[marketplaceId] || !ModelCategorySelect.CategoryMap[marketplaceId][catValue]) {
            return null;
        }
        ModelCategorySelect.CategoryMap[marketplaceId][catValue].children = children;
    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.setState({marketplace_id: nextProps.marketplace_id, category: nextProps.category});
    }

    componentDidMount() {
        this.initRootCategory();
    }

    initRootCategory() {
        let params = {
            configuration: this.shopify.getConfigurationSelected(),
            type: 'root'
        };
        ApplicationApiCall.get('/application/parameters/browsenodes', params, this.loadRootCategories, this.cbError);
    }

    loadRootCategories = (json) => {
        if (!json) {
            return;
        }
        let {marketplace_id} = this.state;
        let root_categories = json;
        for (let i = 0; i < root_categories.length; i++) {
            if(marketplace_id != root_categories[i].MarketplaceId) {
                continue;
            }
            ModelCategorySelect.AddCategory(root_categories[i].MarketplaceId, 0, {
                label: "",
                value: 0,
                parent: 0,
                has_children: root_categories[i].BrowseNodes.length > 0 ? 1 : 0
            });
            ModelCategorySelect.SetCategoryChildren(root_categories[i].MarketplaceId, 0, root_categories[i].BrowseNodes);
            if (root_categories[i].BrowseNodes && root_categories[i].BrowseNodes.length) {
                for (let node of root_categories[i].BrowseNodes) {
                    ModelCategorySelect.AddCategory(root_categories[i].MarketplaceId, node.value, node);
                }
            }

            let nodes = [];
            if(this.state.category) {
                nodes = nodes.concat(this.state.category);
                this.loadNodesCategories(nodes);
            } else {
                this.loadCategories();
            }
        }
    }

    loadCategories() {
        let catValue = 0;
        let {marketplace_id} = this.state;
        let catData = ModelCategorySelect.GetCategory(marketplace_id, catValue);
        if (catData) {
            if (catData.has_children === 0 || catData.children.length > 0) {
                this.state.current_categories.loading = false;
                this.state.current_categories.children = catData.children;
            } else {
                this.getChildCategories(catValue);
            }
        } else {
            console.error("catData is null");
        }
        this.setState({wait:false});
    }

    getChildCategories(catValue) {
        let {marketplace_id} = this.state;
        console.log("getChildCategories catValue: ", catValue);

        this.state.current_categories.loading = true;
        ApplicationApiCall.get('/application/parameters/browsenodes',
            {
                type: 'nodes',
                configuration: this.shopify.getConfigurationSelected(),
                marketplace_id: marketplace_id,
                browse_node_id: catValue
            },
            (json) => {
                this.cbLoadChildCategories(catValue, json);
            }, this.cbError);
        this.setState({refresh: true});
    }

    cbLoadChildCategories = (catValue, json) => {
        let {marketplace_id, current_categories} = this.state;

        ModelCategorySelect.SetCategoryChildren(marketplace_id, catValue, json.BrowseNodes);
        this.state.current_categories.children.forEach(item => {
            if (item.children && item.children.length) {
                this.setChildren(item, catValue, json.BrowseNodes)
            } else {
                if (item.value === catValue) {
                    item.children = json.BrowseNodes;
                }
            }
        })
        console.log("cbLoadChildCategories", json, this.state.current_categories.children)

        for (let node of json.BrowseNodes) {
            ModelCategorySelect.AddCategory(marketplace_id, node.value, node);
        }

        current_categories.loading = false;
        this.setState({current_categories});
    }

    //change select, do not change select
    handleChangeCategory = (catValue) => {
        let {onSelect} = this.props;
        onSelect(catValue);
        this.setState(state => ({
            category: catValue,
        }));
    }

    loadNodesCategories = (nodes) => {
        console.log("loadNodesCategories: ", nodes);
        let {marketplace_id} = this.state;

        let params = {
            configuration: this.shopify.getConfigurationSelected(),
            type: 'node',
            marketplace_id,
            browse_node_id: nodes.join(",")
        };
        ApplicationApiCall.get('/application/parameters/browsenodes', params, this.cbLoadNodesCategories, this.cbError);
    }

    cbLoadNodesCategories = (json) => {
        if (!json) {
            return;
        }
        json.BrowseNodes.forEach(node => {
            let catData = ModelCategorySelect.GetCategory(json.MarketplaceId, node.value);
            console.log("cbLoadNodesCategories: ", catData);

            if (!catData) {
                ModelCategorySelect.AddCategory(json.MarketplaceId, node.value, node);
            }
        });
        this.loadCategories();
        this.setState({wait: false});
    }

    handleNextCategory = (catValue, cb) => {
        console.log('handleNextCategory: value: ', catValue, ModelCategorySelect.CategoryMap);
        let {marketplace_id} = this.state;
        let catData = ModelCategorySelect.GetCategory(marketplace_id, catValue);
        if (catData) {
            console.log(" catValue: ", catValue);

            ApplicationApiCall.get('/application/parameters/browsenodes',
                {
                    type: 'nodes',
                    configuration: this.shopify.getConfigurationSelected(),
                    marketplace_id,
                    browse_node_id: catValue
                },
                (json) => {
                    this.setCbChildren(catValue, json);
                    cb(this.state.current_categories.children)
                }, this.cbError);
        } else {
            console.error("handleNextCategory catData is null");
        }
    }

    cbError = (err) => {
        console.log(err);
        if (err) {
            this.setState({error: err})
        }
    }

    setCbChildren(catValue, json) {
        let {marketplace_id} = this.state;
        ModelCategorySelect.SetCategoryChildren(marketplace_id, catValue, json.BrowseNodes);
        this.state.current_categories.children.forEach(item => {
            if (item.children && item.children.length) {
                this.setChildren(item, catValue, json.BrowseNodes)
            } else {
                if (item.value === catValue) {
                    item.children = json.BrowseNodes;
                }
            }
        })
        console.log("cbLoadChildCategories", json, this.state.current_categories.children)

        for (let node of json.BrowseNodes) {
            ModelCategorySelect.AddCategory(marketplace_id, node.value, node);
        }
    }

    setChildren(item, value, children) {
        item.children.forEach(child => {
            if (child.children && child.children.length > 0) {
                this.setChildren(child, value, children);
            } else {
                if (child.value === value) {
                    child.children = children
                }
            }
        })
    }

    handleKeywordChange = (keyword) => {
        this.setState({keyword});
    }

    searchCategories = () => {
        let {marketplace_id, keyword} = this.state;

        let params = {
            configuration: this.shopify.getConfigurationSelected(),
            keyword,
            marketplace_id
        };
        ApplicationApiCall.get('/application/parameters/search_browsenodes', params, this.cbSearchCategories, this.cbError);
        this.setState({searching: true, search_result: []});
    }

    cbSearchCategories = (json) => {
        if(json && json.nodes) {
            let search_result = json.nodes;
            let {marketplace_id} = this.state;
            json.nodes.forEach( node => {
                ModelCategorySelect.AddCategory(marketplace_id, node.value, node);
            });
            this.setState({searching: false, search_result});
        } else {
            this.setState({searching: false, search_result: []});
        }
    }

    handleSelectCategory = (category) => () => {
        let catValue = [category];
        let {onSelect} = this.props;
        onSelect(catValue);
        this.setState(state => ({
            category: catValue,
        }));
    }

    renderSearchResult() {
        console.log("renderSearchResult", this.state.search_result);
        const resourceName = {singular: 'category', plural: 'categories'};
        let {search_result} = this.state;
        return <ResourceList
            resourceName={resourceName}
            items={search_result}
            renderItem={this.renderItem}
        />
    }

    renderItem = (item, index) => {
        let {path, label, value} = item;
        let {category} = this.state;
        let is_selected = false;
        if(Array.isArray(category) && Util.inArray(value, category)) {
            is_selected = true;
        }
        return (
            <ResourceList.Item id={"model-" + item.group_id}>
                <Stack wrap={false}>
                    <Stack.Item fill>
                        <Heading>
                            {label}
                        </Heading>
                        <span>{path}</span>
                    </Stack.Item>
                    <Stack.Item>
                        {!is_selected? <Button onClick={this.handleSelectCategory(value)} size="slim"><CsI18n>Select</CsI18n></Button>:null}
                    </Stack.Item>
                </Stack>
            </ResourceList.Item>
        );
    };

    render() {
        let {wait, marketplace_id, category, current_categories} = this.state;
        console.log("render", wait, marketplace_id, category, current_categories);
        if(wait) {
            return <Spinner size="small" color="teal" accessibilityLabel={CsI18n.t("Loading")}/>
        }
        let selectedNodes = [];
        if(category) {
            category.forEach((catVal) => {
                let node = ModelCategorySelect.GetCategory(marketplace_id, catVal);
                if (node) {
                    selectedNodes.push(node);
                } else {
                    console.error("catData is null");
                }
            })
        } else {
            category = [];
        }
        return (
            <div className={'model-category'}>
                <div className={'model-search-block'}>
                <Stack spacing={"extraTight"}>
                    <Stack.Item><div className={'model-category-search'}><TextField label={'keyword'} value={this.state.keyword} labelHidden={true} onChange={this.handleKeywordChange}/></div></Stack.Item>
                    <Stack.Item><div className={'model-category-btn'}><Button onClick={this.searchCategories} loading={this.state.searching}><CsI18n>Search</CsI18n></Button></div></Stack.Item>
                </Stack>
                    {this.renderSearchResult()}
                </div>
            <CsTreeComponent
                data={current_categories}
                limit={1}
                selected={category}
                selectedNodes={selectedNodes}
                close={true}
                onChange={this.handleChangeCategory}
                onClickNext={this.handleNextCategory}
            />
            </div>
        )
    }
}