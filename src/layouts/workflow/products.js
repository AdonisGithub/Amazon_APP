import React from "react";
import CsI18n from "./../../components/csI18n"

import {
    Card,
    ChoiceList, Collapsible, Heading, Icon, Link, Stack, Tooltip
} from "@shopify/polaris";
import {ChevronDownMinor, ChevronUpMinor, CircleInformationMajorMonotone} from "@shopify/polaris-icons";
import ShopifyContext from "../../context";
import Util from "../../helpers/Util";
import WorkflowTab from "./workflow_tab";

class Products extends WorkflowTab {

    static default_values = {
        products_import: [],
        import_sync: [],
        products_feature: [],
        products_keyword: [],
        products_delete: [],
        product_title_prefix: [],
        product_description_option: ['wipe-table'],
        product_parent: [],
    };

    constructor(props) {
        super(props);

        this.shopify = ShopifyContext.getShared();
        this.state.advanced_active = false;
        this.defaults = Util.clone(Products.default_values);
        if (!this.props.config.hasOwnProperty('data') || !this.props.config.data)
            this.configurationUpdateCurrent(this.defaults);
        // console.log(this);
        this.handleChange = this.handleChange.bind(this);
    }

    getName() {
        return "products";
    }

    handleChange(ev) {
        console.log(ev);
    }

    loadConfig() {
        this.configurationLoad();
        this.configurationUpdateCurrent(this.state.data);
    }

    isAllowedFeature(feature) {
        return true;
        // let selected_features = [];
        // if(this.state.data.hasOwnProperty('selected_features') && this.state.data.selected_features !== null){
        //     selected_features = this.state.data.selected_features;
        // }else{
        //     selected_features = [];
        // }
        // if( selected_features.indexOf(feature) !== -1 ) {
        //     return true;
        // }
        // return false;
    }

    componentWillMount() {
        console.log("componentWillMount");

        this.loadConfig();
        if( this.state.data && this.state.data.products_feature && this.state.data.products_feature.length > 0 ) {
            this.state.bullet_send = ["send"];
        } else {
            this.state.bullet_send = [];
        }
    }

    componentWillReceiveProps(nextProps) {
        console.log("componentWillReceiveProps");

        this.loadConfig();
    }
    handleAdvancedOpen = () => {
        this.setState(prev => {
            return {advanced_active: !prev.advanced_active}
        })
    }

    handleBulletSend = (value) => {
        // console.log("handleBulletSend", value);
        if( !value || value.length == 0 ) {
            this.valueUpdater("products_feature")([]);
        } else {
            this.valueUpdater("products_feature")(["bullet-description"]);
        }
        this.setState( {bullet_send: value});
    }
    
    renderBulletSend() {
        let label_extract_from_desc =
            <Stack
                spacing="tight"><Stack.Item>{CsI18n.t("Extract from product description")}</Stack.Item>
                <Stack.Item fill>
                    <Tooltip
                        content={CsI18n.t("Split the 5 first description lines into 5 bullet points")}>
                        <span className={"help-tooltip"}>
                            <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                        </span>
                    </Tooltip>
                </Stack.Item></Stack>;

        let label_send_options =
            <Stack
                spacing="tight"><Stack.Item>{CsI18n.t("Send Options")}</Stack.Item>
                <Stack.Item fill>
                    <Tooltip
                        content={CsI18n.t("Send the option names and values, example: Size: S - Color: Blue")}>
                        <span className={"help-tooltip"}>
                            <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                        </span>
                    </Tooltip>
                </Stack.Item></Stack>;


        return (
            <ChoiceList
                choices={[
                    {
                        label: label_extract_from_desc,
                        value: 'bullet-description',
                    },
                    {
                        label: label_send_options,
                        value: 'bullet-options',
                    }
                ]}
                selected={this.state.data.products_feature}
                onChange={this.valueUpdater("products_feature")}/>)
    }
    render() {
        const selected = parseInt(this.state.selectedTab)
        console.log(selected, this.state);
        // let isAllowedFeature = this.isAllowedFeature('advanced');
        let isAdmin = this.shopify.admin;
        return (
            <Card.Section>
                <div className={"ml-6 mt-2"}>
                    <ChoiceList
                        allowMultiple={true}
                        choices={[
                            {
                                label: CsI18n.t("Bullet Points / Product key features"),
                                value: "send",
                                renderChildren: isSelected => {
                                    return isSelected && this.renderBulletSend();
                                }
                            }
                        ]}
                        selected={this.state.bullet_send}
                        onChange={this.handleBulletSend}
                    />
                </div>
                <div className={"ml-6 mt-3"}>
                    <ChoiceList
                        allowMultiple
                        title={CsI18n.t("Search keywords")}
                        choices={[
                            {
                                label: CsI18n.t("Send product tags"),
                                value: 'send-product-tag',
                            }
                        ]}
                        selected={this.state.data.products_keyword}
                        onChange={this.valueUpdater("products_keyword")}
                    />
                </div>
                <div className={"ml-6 mt-3"}>
                    <ChoiceList
                        allowMultiple
                        title={CsI18n.t("When products are deleted on Shopify")}
                        choices={[
                            {
                                label: CsI18n.t("Do not delete products on Amazon"),
                                value: 'dont-delete',
                            }
                        ]}
                        selected={this.state.data.products_delete}
                        onChange={this.valueUpdater("products_delete")}
                    />
                </div>
                <div className={"ml-6 mt-3"}>
                    <ChoiceList
                        allowMultiple
                        title={<Stack spacing="tight">
                            <Stack.Item>{CsI18n.t("Product title prefix")}</Stack.Item>
                        <Stack.Item fill><Tooltip content={CsI18n.t("Example, your vendor is Apple, title is iPhone, the name sent will be Apple - iPhone")}>
                            <span className={"help-tooltip"}>
                                <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                            </span>
                        </Tooltip></Stack.Item>
                        </Stack>}
                        choices={[
                            {
                                label: CsI18n.t("Send vendor"),
                                value: 'title-vendor',
                            },
                            {
                                label: CsI18n.t("Send product type"),
                                value: 'title-product-type',
                            },
                            {
                                label: CsI18n.t("Send collection"),
                                value: 'title-collection',
                            },
                        ]}
                        selected={this.state.data.product_title_prefix}
                        onChange={this.valueUpdater("product_title_prefix")}
                    />
                </div>
                {/*<div className={"ml-6 mt-3"}>*/}
                {/*    <ChoiceList*/}
                {/*        allowMultiple*/}
                {/*        title={<Stack spacing="tight"><Stack.Item>{CsI18n.t("Product description")}</Stack.Item></Stack>}*/}
                {/*        choices={[*/}
                {/*            {*/}
                {/*                label: CsI18n.t("Wipe tables from descriptions"),*/}
                {/*                value: 'wipe-table',*/}
                {/*            },*/}
                {/*        ]}*/}
                {/*        selected={this.state.data.product_description_option}*/}
                {/*        onChange={this.valueUpdater("product_description_option")}*/}
                {/*    />*/}
                {/*</div>*/}
                {isAdmin?
                <div className={"ml-6 mt-3"}>
                    <ChoiceList
                        allowMultiple
                        title={CsI18n.t("For parent product's SKU")}
                        choices={[
                            {
                                label: CsI18n.t("Use product handle"),
                                value: 'parent-product-handle',
                            }
                        ]}
                        selected={this.state.data.product_parent}
                        onChange={this.valueUpdater("product_parent")}
                    />
                </div>:''}
            </Card.Section>
        );
    }

    renderProductImportPreferences() {
        return (
            <ChoiceList
                allowMultiple
                title={CsI18n.t("Preferences")}
                disabled={this.isAllowedFeature('advanced')? false:true}
                choices={[
                    {
                        label: CsI18n.t("Continuous update"),
                        value: "import_sync",
                        helpText: CsI18n.t("After import, products are included in inventory management")
                    }
                ]}
                selected={this.state.data.import_sync}
                onChange={this.valueUpdater("import_sync")}
            />
        );
    }

}
export default Products;
