import React from "react";
import CsI18n from "./../../components/csI18n"

import {
    Card,
    ChoiceList,
    Checkbox,
    Collapsible,
    Link,
    Icon,
    Stack, Heading, Spinner, Select, Banner, Tooltip,
    TextField,
} from "@shopify/polaris";

import {
    ChevronUpMinor, ChevronDownMinor, CircleInformationMajorMonotone
} from '@shopify/polaris-icons';
import ShopifyContext from "../../context";
import Util from "../../helpers/Util";
import WorkflowTab from "./workflow_tab";

class Inventory extends WorkflowTab {
    // tabs
    static sync_send = 1;
    static sync_receive = 2;
    static sync_none = 0;

    static sku_use_sku = 0;
    static sku_use_handle = 1;

    getName() {
        return "Inventory";
    }

    static default_values = {
        sync_way: [1],
        // sync_shopify: ['when-order'],
        // sync_shopify_location: '',
        // send_stock_policies: ["stock", "prices", "create"],
        send_stock_policies: ["stock", "prices"], //disable to create automatically offers //@kbug_191012
        send_sync_stock_options: {handling_time: 3, is_gift_wrap: true, is_gift_message: false},
        receive_stock_policies: [],
        inventory_sku_mode: [0], // 0: SKU mode, 1: Handle mode
        advanced_offer: [],
        inventory_admin_option: []
    };

    constructor(props) {
        super(props);
        this.shopify = ShopifyContext.getShared();
        this.state.advanced_active = false;
        // this.state.loading = true;
        this.state.locations = [];
        // let send_stock_policies = ["stock", "prices"/*, "auto-create"*/];
        this.defaults = Util.clone(Inventory.default_values);
        if ( !this.props.config.hasOwnProperty('data') || !this.props.config.data)
            this.configurationUpdateCurrent(this.defaults);
        console.log("inventory constructor: ", this);

    }

    loadConfig() {
        this.configurationLoad();
        this.configurationUpdateCurrent(this.state.data);
    }

    componentWillMount() {
        console.log("componentWillMount");

        this.loadConfig();
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

    handleUpdateSyncStockOptions = (field) => (value) => {
        let {send_sync_stock_options} = this.state.data;
        send_sync_stock_options[field] = value;
        this.valueUpdater("send_sync_stock_options")(send_sync_stock_options);
    }

    renderLoading() {
        return(
            <div align="center">
                <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")} ></Spinner>
            </div>
        );
    }

    render() {
        // if (this.state.loading) {
        //     return this.renderLoading();
        // }
        let choices = [];

        if (this.shopify.isAdminMode()) {
            choices.push({
                label: CsI18n.t("Do not send title"),
                value: 'not-title',
            });
            choices.push(
                {
                    label: CsI18n.t("Do not send description"),
                    value: 'not-description',
                });
            choices.push(
                {
                    label: CsI18n.t("Create offers automatically"),
                    value: "auto-create",
                    helpText: CsI18n.t("The App will try to create new offers automatically for products having barcodes or ASIN")
                }
            );
        }

        let admin_choices = [];
        admin_choices.push({
            label: CsI18n.t("Make the SwitchFulfillmentTo value MFN when syncing the stock to Amazon (Admin)"),
            value: 'send-switch-mfn',
        });

        return (
            <Card.Section>
                <ChoiceList
                    title={<Heading>{CsI18n.t("Sync Amazon")}</Heading>}
                    choices={[
                        {
                            label: CsI18n.t("Sending"),
                            value: Inventory.sync_send,
                            helpText: CsI18n.t("Send inventory from your store to Amazon"),
                            renderChildren: isSelected => {
                                return isSelected && this.renderSendModeParameters();
                            }
                        },
                        // {
                        //     label: CsI18n.t("Receiving (coming soon...)"),
                        //     value: Inventory.sync_receive,
                        //     disabled:true,
                        //     helpText: CsI18n.t("Receive inventory from Amazon to your store"),
                        //     renderChildren: isSelected => {
                        //         return isSelected && this.renderReceiveModeParameters();
                        //     }
                        // },
                        {
                            label: CsI18n.t("None"),
                            value: Inventory.sync_none,
                            helpText: CsI18n.t("Inventory will never be synced"),
                        }
                    ]}
                    selected={this.state.data.sync_way}
                    onChange={this.valueUpdater("sync_way")}
                />
                {/*{this.renderSyncShopify()}*/}

                <div className={"mt-3"}>
                    <Stack alignment={"leading"}>
                        <Stack.Item><Heading>{CsI18n.t('Advanced')}</Heading></Stack.Item>
                        <Stack.Item><Link onClick={this.handleAdvancedOpen}><Icon source={this.state.advanced_active? ChevronUpMinor:ChevronDownMinor}/></Link></Stack.Item>
                    </Stack>
                    <Collapsible open={this.state.advanced_active} id="advanced-collapsible">
                        <div className={"ml-6 mt-2"}>
                            <ChoiceList
                                title={CsI18n.t("SKU")}
                                choices={[
                                    {
                                        label: CsI18n.t("Use store SKU as SKU on Amazon (recommended)"),
                                        value: Inventory.sku_use_sku,
                                        helpText: CsI18n.t("If you store has SKUs, no one is empty and all they are unique"),
                                    },
                                    {
                                        label: CsI18n.t("Use store handle as SKU on Amazon"),
                                        value: Inventory.sku_use_handle,
                                        helpText: CsI18n.t("Choose this option if your store doesn't have any SKUs"),
                                    }
                                ]}
                                selected={this.state.data.inventory_sku_mode}
                                onChange={this.valueUpdater("inventory_sku_mode")}
                            />
                            <ChoiceList
                                allowMultiple
                                title={CsI18n.t("Offer")}
                                choices={choices}
                                selected={this.state.data.advanced_offer}
                                onChange={this.valueUpdater("advanced_offer")}
                            />
                            {this.shopify.isAdminMode()? <ChoiceList
                                allowMultiple
                                title={CsI18n.t("Admin Option")}
                                choices={admin_choices}
                                selected={this.state.data.inventory_admin_option}
                                onChange={this.valueUpdater("inventory_admin_option")}
                            />:null}
                        </div>
                    </Collapsible>
                </div>
            </Card.Section>
        );
    }

    renderSendModeParameters() {
        let is_limited_mode = false;
        let label_dont_send_product_data =
            <Stack
                spacing="tight"><Stack.Item>{CsI18n.t("Don't send any product data")}</Stack.Item>
                <Stack.Item fill>
                    <Tooltip
                        content={CsI18n.t("Don't send to Amazon; Title, Description, Brand, etc.")}>
                        <span className={"help-tooltip"}>
                            <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                        </span>
                    </Tooltip>
                </Stack.Item></Stack>;

        return (
            <ChoiceList
                allowMultiple
                title={CsI18n.t("Preferences")}
                disabled={is_limited_mode? true:false}
                choices={[
                    {
                        label: CsI18n.t("Update stocks"),
                        value: "stock",
                        helpText: CsI18n.t("Send your inventory, after applying rules, from your store to Amazon"),
                        renderChildren: isSelected => {
                            return isSelected && this.renderChildUpdateStocks();
                        }
                    },
                    {
                        label: CsI18n.t("Update prices"),
                        value: "prices",
                        helpText: CsI18n.t("Send your prices, after applying rules, from your store to Amazon")
                    },
                    {
                        label: label_dont_send_product_data,
                        value: "no-sync-data",
                    }
                    /*, //removed the create offers option @kbug_191012
                    {
                        label: CsI18n.t("Create new offers"),
                        value: "create",
                        helpText: CsI18n.t("Create automatically new offers on Amazon")
                    }*/
                ]}
                selected={this.state.data.send_stock_policies}
                onChange={this.valueUpdater("send_stock_policies")}
            />
        );
    }

    renderChildUpdateStocks() {
        let {send_sync_stock_options} = this.state.data;
        return (<Stack vertical={true} spacing={"extraTight"}>
                <div className={"cs-form-field-wrapper"}>
                    <span className={"cs-field-label"}><CsI18n>Handling time</CsI18n></span>
                    <Stack
                        spacing="tight" distribution={"leading"} alignment={"center"}><Stack.Item><div style={{width: '100px'}}><TextField label={CsI18n.t('Handling time')} type={"number"} labelHidden={true} value={send_sync_stock_options.handling_time} suffix={CsI18n.t("days")} onChange={this.handleUpdateSyncStockOptions('handling_time')} min={0} /></div></Stack.Item>
                        <Stack.Item>
                            <Tooltip
                                content={CsI18n.t("Handling time")}>
                    <span className={"help-tooltip"}>
                        <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                    </span>
                            </Tooltip>
                        </Stack.Item></Stack>
                </div>
                <Stack
                    spacing="tight" distribution={"leading"} alignment={"center"}><Stack.Item><Checkbox label={CsI18n.t('Gift wrap available.')} onChange={this.handleUpdateSyncStockOptions('is_gift_wrap')} checked={send_sync_stock_options.is_gift_wrap}/></Stack.Item>
                    <Stack.Item>
                        <Tooltip
                            content={CsI18n.t("Gift wrap available.")}>
                        <span className={"help-tooltip"}>
                            <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                        </span>
                        </Tooltip>
                    </Stack.Item></Stack>
                <Stack
                    spacing="tight" distribution={"leading"} alignment={"center"}><Stack.Item><Checkbox label={CsI18n.t('Gift message available')} onChange={this.handleUpdateSyncStockOptions('is_gift_message')} checked={send_sync_stock_options.is_gift_message}/></Stack.Item>
                    <Stack.Item>
                        <Tooltip
                            content={CsI18n.t("Gift message available.")}>
                        <span className={"help-tooltip"}>
                            <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                        </span>
                        </Tooltip>
                    </Stack.Item></Stack>

            </Stack>
            )
    }

    renderReceiveModeParameters() {
        return (
            <ChoiceList
                allowMultiple
                title={CsI18n.t("Inventory Preferences")}
                choices={[
                    {
                        label: CsI18n.t("Update stock level"),
                        value: "stock",
                        helpText:
                            CsI18n.t("Update my store's stock level accordingly, from Amazon to my store")
                    }
                ]}
                selected={this.state.data.receive_stock_policies}
                onChange={this.valueUpdater("receive_stock_policies")}
            />
        );
    }
}
export default Inventory;
