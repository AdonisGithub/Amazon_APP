import React from "react";
import CsI18n from "./../../components/csI18n"


import {
    Banner,
    Card,
    ChoiceList, Collapsible, Heading, Icon, Link, Stack, Tooltip
} from "@shopify/polaris";
import {ChevronDownMinor, ChevronUpMinor, CircleInformationMajorMonotone} from "@shopify/polaris-icons";
import ShopifyContext from "../../context";
import Util from "../../helpers/Util";
import WorkflowTab from "./workflow_tab";

class Orders extends WorkflowTab {

    static default_values = {
        orders_import: [],
        import_options: [],
        advanced_import_options: ["dont_import_fulfilled"],
        advanced_sync_order_cancel: [],
        advanced_behaviors: ['trash', 'move-phone'],
        orders_use_fba_multichannel: [],
        advanced_sync_shipping_status: [],
        order_inventory_policy: ['app'],
        order_tags_policy: ['amazon', 'amazon_sale_channel', 'amazon_order_id'],
        order_aid_option: [],
        vcs: [],
        vcs_actions: ['upload_invoice'],
        orders_admin_options: []
    }

    constructor(props) {
        super(props);

        this.shopify = ShopifyContext.getShared();
        this.state.advanced_active = false;

        this.defaults = Util.clone(Orders.default_values);
        if ( !this.props.config.hasOwnProperty('data') || !this.props.config.data)
            this.configurationUpdateCurrent(this.defaults);

        if ( this.shopify.store_properties.hasOwnProperty('currency')) {
            this.currency = this.shopify.store_properties.currency;
        } else {
            this.currency = 'USD';
        }
        console.log('Orders constructor:', this);

        this.handleChange = this.handleChange.bind(this);
    }

    getName() {
        return "orders";
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

    handleTabChange = selectedTabIndex => {
        console.log(selectedTabIndex);

        this.setState({saved: false});
        this.setState({selectedTab: parseInt(selectedTabIndex)});
    };

    handleChange(ev) {
        console.log(ev);
    }

    isAllowedFeature(feature) {
        return true;
        // let selected_features;
        // if(this.state.data.hasOwnProperty('selected_features') && this.state.data.selected_features !== null){
        //     selected_features = this.state.data.selected_features;
        // } else {
        //     selected_features = [];
        // }
        // return selected_features.indexOf(feature) !== -1;
    }

    handleAdvancedOpen = () => {
        this.setState(prev => {
            return {advanced_active: !prev.advanced_active}
        })
    }

    handleAdvancedImportOption = (value) => {
        let options = this.convertToDontAdvancedImportOption(value);
        this.valueUpdater("advanced_import_options")(options);
    }

    handleImportOption = (value) => {
        let options = this.convertToDontImportOption(value);
        this.valueUpdater("import_options")(options);
    }

    convertToDontAdvancedImportOption(options) {
        let advanced_import = [];
        let bImportPrime = true;
        let bImportBusiness = true;
        let bImportFulfilled = true;
        let bImportUnfulfilled = true;
        for(let item of options) {
            switch (item) {
                case "import_prime":
                    bImportPrime = false;
                    break;
                case "import_business":
                    bImportBusiness = false;
                    break;
                case "import_fulfilled":
                    bImportFulfilled = false;
                    break;
                case "import_unfulfilled":
                    bImportUnfulfilled = false;
                    break;
            }
        }
        if(bImportPrime)
            advanced_import.push('dont_import_prime');
        if(bImportBusiness)
            advanced_import.push('dont_import_business');
        if(bImportFulfilled)
            advanced_import.push('dont_import_fulfilled');
        if(bImportUnfulfilled)
            advanced_import.push('dont_import_unfulfilled');

        return advanced_import;
    }

    convertToAdvancedImportOption(advanced_import_options) {
        let advanced_import = [];
        let bImportPrime = true;
        let bImportBusiness = true;
        let bImportFulfilled = true;
        let bImportUnfulfilled = true;
        for(let item of advanced_import_options) {
            switch (item) {
                case "dont_import_prime":
                    bImportPrime = false;
                    break;
                case "dont_import_business":
                    bImportBusiness = false;
                    break;
                case "dont_import_fulfilled":
                    bImportFulfilled = false;
                    break;
                case "dont_import_unfulfilled":
                    bImportUnfulfilled = false;
                    break;
            }
        }
        if(bImportPrime)
            advanced_import.push('import_prime');
        if(bImportBusiness)
            advanced_import.push('import_business');
        if(bImportFulfilled)
            advanced_import.push('import_fulfilled');
        if(bImportUnfulfilled)
            advanced_import.push('import_unfulfilled');

        return advanced_import;
    }

    convertToDontImportOption(options) {
        let converted_options = [];
        let bDontImportMfn = true;
        for(let item of options) {
            switch (item) {
                case "import_mfn":
                    bDontImportMfn = false;
                    break;
                default:
                    converted_options.push(item);
            }
        }
        if(bDontImportMfn) {
            converted_options.push("dont_import_mfn");
        }
        return converted_options;
    }

    convertToImportOption(import_options) {
        let converted_import_options = [];
        let bImportMfn = true;
        for(let item of import_options) {
            switch (item) {
                case "dont_import_mfn":
                    bImportMfn = false;
                    break;
                default:
                    converted_import_options.push(item);
            }
        }
        if(bImportMfn) {
            converted_import_options.push("import_mfn");
        }
        return converted_import_options;
    }

    handleAdvancedBehaviors = (value) => {
        let options = this.convertToDontAdvancedBehaviors(value);
        this.valueUpdater("advanced_behaviors")(options);
    }

    convertToDontAdvancedBehaviors(options) {
        let converted_options = [];
        let bDontCalcSmartTax = true;
        for(let item of options) {
            switch (item) {
                case "calc-smart-tax":
                    bDontCalcSmartTax = false;
                    break;
                default:
                    converted_options.push(item);
            }
        }
        if(bDontCalcSmartTax) {
            converted_options.push("dont-calc-smart-tax");
        }
        return converted_options;
    }

    convertToAdvancedBehaviors(import_options) {
        let converted_import_options = [];
        let bDontCalcSmartTax = true;
        for(let item of import_options) {
            switch (item) {
                case "dont-calc-smart-tax":
                    bDontCalcSmartTax = false;
                    break;
                default:
                    converted_import_options.push(item);
            }
        }
        if(bDontCalcSmartTax) {
            converted_import_options.push("calc-smart-tax");
        }
        return converted_import_options;
    }

    render() {
        console.log("render", this.state);

        // let contextual_message = "";
        let isAllowedFeature = this.isAllowedFeature('order');

        return (
            <Card.Section>
                <ChoiceList
                    allowMultiple
                    title={CsI18n.t("Orders")}
                    choices={[
                        {
                            label: CsI18n.t("Import"),
                            value: "import",
                            disabled: !isAllowedFeature,
                            helpText: CsI18n.t("Orders will be imported from Amazon to your store"),
                            renderChildren: isSelected => {
                                return isSelected && this.renderOrdersImportPreferences();
                            }
                        }
                    ]}
                    selected={ isAllowedFeature? this.state.data.orders_import:[] }
                    onChange={this.valueUpdater("orders_import")}
                />

                <div className={"mt-2"}>
                    <ChoiceList
                        allowMultiple={true}
                        disabled={true} //todo false
                        title={CsI18n.t("Amazon VCS (VAT Calculation Service)")}
                        choices={[
                            {
                                label: CsI18n.t("Use VCS for invoice (disabled so far. Please contact us to use it)"),
                                value: "use-vcs",
                                renderChildren: isSelected => {
                                    return isSelected && this.renderVcsActions();
                                }
                            }
                        ]}
                        selected={[]} //this.state.data.vcs //todo restore
                        onChange={this.valueUpdater("vcs")}
                    />

                </div>
                {this.renderAdvancedOptions()}
            </Card.Section>
        );
    }

    renderVcsActions() {
        let label_upload_invoice =
            <Stack
                spacing="tight"><Stack.Item>{CsI18n.t("Upload VAT Invoice automatically")}</Stack.Item>
                {/*<Stack.Item fill>*/}
                {/*    <Tooltip*/}
                {/*        content={CsI18n.t("Split the 5 first description lines into 5 bullet points")}>*/}
                {/*        <span className={"help-tooltip"}>*/}
                {/*            <Icon source={CircleInformationMajorMonotone} color={"green"}/>*/}
                {/*        </span>*/}
                {/*    </Tooltip>*/}
                {/*</Stack.Item>*/}
            </Stack>;

        return (
            <ChoiceList
                allowMultiple
                choices={[
                    {
                        label: label_upload_invoice,
                        value: 'upload_invoice',
                    }
                ]}
                selected={this.state.data.vcs_actions}
                onChange={this.valueUpdater("vcs_actions")}/>)
    }

    renderAdvancedImportOptions() {
        let is_admin = false;
        if (this.shopify.isAdminMode()) {
            is_admin = true;
        }
        let isAllowedOrder = this.isAllowedFeature('order');
        let advanced_import = this.convertToAdvancedImportOption(this.state.data.advanced_import_options);
        let advanced_choices = [];
        if (is_admin) {
            advanced_choices.push({
                label: CsI18n.t("Prime") + "(Admin option)",
                value: "import_prime",
                helpText: <CsI18n>Import prime orders</CsI18n>
            });
        }

        if (is_admin) {
            advanced_choices.push({
                label: CsI18n.t("Business") + "(Admin option)",
                value: "import_business",
                helpText: <CsI18n>Import business orders</CsI18n>
            });
        }
        advanced_choices.push({
            label: CsI18n.t("Fulfilled"),
            value: "import_fulfilled",
            helpText: <CsI18n>Import fulfilled orders</CsI18n>
        });

        if (is_admin) {
            advanced_choices.push({
                label: CsI18n.t("Unfulfilled") + "(Admin option)",
                value: "import_unfulfilled",
                helpText: <CsI18n>Import unfulfilled orders</CsI18n>
            });
        }
        return (<ChoiceList
            allowMultiple
            disabled={!isAllowedOrder}
            title=""
            titleHidden={true}
            choices={advanced_choices}
            selected={advanced_import}
            onChange={this.handleAdvancedImportOption}
        />);

    }

    renderOrdersImportPreferences() {
        let isAllowedOrder = this.isAllowedFeature('order');
        let imported_options = this.convertToImportOption(this.state.data.import_options);

        let choices = [
            {
                label: CsI18n.t("Do not update fulfillment status"),
                value: "do_not_update_fulfillment",
                helpText: ''
            },
            {
                label: CsI18n.t("Convert currencies"),
                value: "convert_currencies",
                helpText: <CsI18n currency={this.currency}>{"Currencies of imported orders will be converted to {{currency}}"}</CsI18n>
            },
        ];

        choices.push({
            label: CsI18n.t("MFN"),
            value: "import_mfn",
            helpText: <CsI18n>{"Import regular orders (Merchant fulfilled)"}</CsI18n>
        });

        choices.push({
            label: CsI18n.t("FBA"),
            value: "import_fba",
            helpText: <CsI18n>{"Import Fulfilled By Amazon (FBA) orders"}</CsI18n>
        });

        return (
            <React.Fragment>
                <ChoiceList
                    allowMultiple
                    disabled={!isAllowedOrder}
                    title={CsI18n.t("Preferences")}
                    choices={choices}
                    selected={imported_options}
                    onChange={this.handleImportOption}
                />
                {this.renderAdvancedImportOptions()}
            </React.Fragment>
        );
    }

    renderAdvancedOptions() {
        let is_admin = false;
        if (this.shopify.isAdminMode()) {
            is_admin = true;
        }
        let advanced_behaviors = this.convertToAdvancedBehaviors(this.state.data.advanced_behaviors);
        return (<div className={"mt-3"}>
            <Stack alignment={"leading"}>
                <Stack.Item><Heading>{CsI18n.t('Advanced')}</Heading></Stack.Item>
                <Stack.Item><Link onClick={this.handleAdvancedOpen}><Icon
                    source={this.state.advanced_active ? ChevronUpMinor : ChevronDownMinor}/></Link></Stack.Item>
            </Stack>
            <Collapsible open={this.state.advanced_active} id="advanced-collapsible">
                <div className={"ml-6 mt-2"}>
                    <div className={"mt-2"}>
                        <ChoiceList
                            allowMultiple
                            title={CsI18n.t("Orders cancellation")}
                            choices={[
                                {
                                    label: CsI18n.t("Bi-directional orders cancellation"),
                                    value: 'sync',
                                }
                            ]}
                            selected={this.state.data.advanced_sync_order_cancel}
                            onChange={this.valueUpdater("advanced_sync_order_cancel")}
                        />
                    </div>
                    <div className={"mt-2"}>
                        <ChoiceList
                            allowMultiple
                            title={CsI18n.t("Behaviors")}
                            choices={[
                                {
                                    label: <Stack
                                        spacing="tight"><Stack.Item>{CsI18n.t("Move email into additional details")}</Stack.Item>
                                        <Stack.Item fill>
                                            <Tooltip
                                                content={CsI18n.t("Useful when you can't inhibit the mailing function of your shipping App, it redirects the emails to a bin")}>
                                                    <span className={"help-tooltip"}>
                                                        <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                                    </span>
                                            </Tooltip>
                                        </Stack.Item></Stack>,
                                    value: 'trash',
                                },
                                {
                                    label: <Stack
                                        spacing="tight"><Stack.Item>{CsI18n.t("Move phone number into additional details")}</Stack.Item>
                                        <Stack.Item fill>
                                            <Tooltip
                                                content={CsI18n.t("Prevent other Apps to SMS the customer, move the phone number into additional details")}>
                                                    <span className={"help-tooltip"}>
                                                        <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                                    </span>
                                            </Tooltip>
                                        </Stack.Item></Stack>,
                                    value: 'move-phone',
                                },
                                {
                                    label: <Stack
                                        spacing="tight"><Stack.Item>{CsI18n.t("Skip orders with non-synced products")}</Stack.Item>
                                        <Stack.Item fill>
                                            <Tooltip
                                                content={CsI18n.t("If an order contains a non-synced product or non-existing product in the store, skip it.")}>
                                                    <span className={"help-tooltip"}>
                                                        <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                                    </span>
                                            </Tooltip>
                                        </Stack.Item></Stack>,
                                    value: 'skip-orders-with-non-existing-sku',
                                },
                                {
                                    label: <Stack
                                        spacing="tight"><Stack.Item>{CsI18n.t("Decrease stock for AFN orders")}</Stack.Item>
                                        <Stack.Item fill>
                                            <Tooltip
                                                content={CsI18n.t("Don't use it if you are using FBA sync feature of the App!")}>
                                                    <span className={"help-tooltip"}>
                                                        <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                                    </span>
                                            </Tooltip>
                                        </Stack.Item></Stack>,
                                    value: 'decrease-stock-for-afn-orders',
                                },
                                {
                                    label: <Stack
                                        spacing="tight"><Stack.Item>{CsI18n.t("Don't decrease stock")}</Stack.Item>
                                        <Stack.Item fill>
                                            <Tooltip
                                                content={CsI18n.t("Don't decrease stock when any order is imported")}>
                                                    <span className={"help-tooltip"}>
                                                        <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                                    </span>
                                            </Tooltip>
                                        </Stack.Item></Stack>,
                                    value: 'dont-decrease-stock',
                                },
                                {
                                    label: <Stack
                                        spacing="tight"><Stack.Item>{CsI18n.t("Amazon order ID instead of Shopify order ID")}</Stack.Item>
                                        <Stack.Item fill>
                                            <Tooltip
                                                content={CsI18n.t("When importing order, use the Amazon order ID as order ID")}>
                                                    <span className={"help-tooltip"}>
                                                        <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                                    </span>
                                            </Tooltip>
                                        </Stack.Item>

                                    </Stack>,
                                    value: 'use-aid-for-name',
                                    renderChildren: isSelected => {
                                        return isSelected && this.renderChildForAid();
                                    }
                                },
                                {
                                    label: <Stack
                                        spacing="tight"><Stack.Item>{CsI18n.t("Send shopify Order Number to Amazon")}</Stack.Item>
                                        <Stack.Item fill>
                                            <Tooltip
                                                content={CsI18n.t("Instead of order ID, send the Shopify order number to Amazon")}>
                                                    <span className={"help-tooltip"}>
                                                        <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                                    </span>
                                            </Tooltip>
                                        </Stack.Item></Stack>,
                                    value: 'send-number-to-amazon',
                                },
                                {
                                    label: <Stack
                                        spacing="tight"><Stack.Item>{CsI18n.t("Smart taxes calculation")}</Stack.Item>
                                        <Stack.Item fill>
                                            <Tooltip
                                                content={CsI18n.t("Automatically calculate taxes if they aren't provided by Amazon")}>
                                                    <span className={"help-tooltip"}>
                                                        <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                                    </span>
                                            </Tooltip>
                                        </Stack.Item></Stack>,
                                    value: 'calc-smart-tax',
                                },
                                {
                                    label: <Stack
                                        spacing="tight"><Stack.Item>{CsI18n.t("Add Ordered Amazon Item ID on Shopify")}</Stack.Item>
                                        <Stack.Item fill>
                                            <Tooltip
                                                content={CsI18n.t("Add Ordered Amazon Item ID on Shopify")}>
                                                    <span className={"help-tooltip"}>
                                                        <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                                    </span>
                                            </Tooltip>
                                        </Stack.Item></Stack>,
                                    value: 'add-order-item-id',
                                }
                            ]}
                            selected={advanced_behaviors}
                            onChange={this.handleAdvancedBehaviors}/>
                    </div>

                    <div className={"mt-2 multiple-choices"}>
                        <ChoiceList
                            allowMultiple={true}
                            title={CsI18n.t("Tags")}
                            choices={[
                                {
                                    label: <Stack
                                        spacing="tight"><Stack.Item>{CsI18n.t("Amazon")}</Stack.Item>
                                        <Stack.Item fill>
                                            <Tooltip
                                                content={CsI18n.t("Tag the order as Amazon")}>
                                                    <span className={"help-tooltip"}>
                                                        <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                                    </span>
                                            </Tooltip>
                                        </Stack.Item></Stack>,
                                    value: 'amazon',
                                },
                                {
                                    label: <Stack
                                        spacing="tight"><Stack.Item>{CsI18n.t("Sale Channel")}</Stack.Item>
                                        <Stack.Item fill>
                                            <Tooltip
                                                content={CsI18n.t("Tag the channel the order has been placed to, eg: Amazon.com, Amazon.co.uk, Mystore.com")}>
                                                    <span className={"help-tooltip"}>
                                                        <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                                    </span>
                                            </Tooltip>
                                        </Stack.Item></Stack>,
                                    value: 'amazon_sale_channel',
                                },
                                {
                                    label: <Stack
                                        spacing="tight"><Stack.Item>{CsI18n.t("Amazon Order ID")}</Stack.Item>
                                        <Stack.Item fill>
                                            <Tooltip
                                                content={CsI18n.t("Tag the order with Amazon Order ID, eg: #123-1112255-3355678")}>
                                                    <span className={"help-tooltip"}>
                                                        <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                                    </span>
                                            </Tooltip>
                                        </Stack.Item></Stack>,
                                    value: 'amazon_order_id',
                                },
                                {
                                    label: <Stack
                                        spacing="tight"><Stack.Item>{CsI18n.t("Account name")}</Stack.Item>
                                        <Stack.Item fill>
                                            <Tooltip
                                                content={CsI18n.t("Configuration name given in the Connect tab, eg: Amazon USA")}>
                                                    <span className={"help-tooltip"}>
                                                        <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                                    </span>
                                            </Tooltip>
                                        </Stack.Item></Stack>,
                                    value: 'configuration_name',
                                }
                            ]}
                            selected={this.state.data.order_tags_policy}
                            onChange={this.valueUpdater("order_tags_policy")}
                        />
                    </div>

                    <div className={"mt-2 multiple-choices"}>
                        <ChoiceList
                            title={CsI18n.t("When importing orders")}
                            choices={[
                                {
                                    label: CsI18n.t("Use App location policies"),
                                    value: 'app',
                                },
                                {
                                    label: CsI18n.t("Use Shopify location policies"),
                                    value: 'shopify',
                                }
                            ]}
                            selected={this.state.data.order_inventory_policy}
                            onChange={this.valueUpdater("order_inventory_policy")}
                        />
                    </div>

                    {is_admin ?
                        <div className={"mt-2 multiple-choices"}>
                            <ChoiceList
                                allowMultiple
                                title={CsI18n.t("Admin options")}
                                choices={[
                                    {
                                        label: CsI18n.t("Use shipping address as billing address"),
                                        value: 'billing_address_as_shipping_address',
                                    }
                                ]}
                                selected={this.state.data.orders_admin_options}
                                onChange={this.valueUpdater("orders_admin_options")}
                            />
                        </div>
                        : ''
                    }
                </div>
                {/*<div className={"ml-6 mt-2"}>*/}
                {/*    <ChoiceList*/}
                {/*        allowMultiple*/}
                {/*        title={CsI18n.t("Send shipping status on Amazon")}*/}
                {/*        choices={[*/}
                {/*            {*/}
                {/*                label: CsI18n.t("Don't send shipping status"),*/}
                {/*                value: "no-send",*/}
                {/*            }*/}
                {/*        ]}*/}
                {/*        selected={this.state.data.advanced_sync_shipping_status}*/}
                {/*        onChange={this.valueUpdater("advanced_sync_shipping_status")}*/}
                {/*    />*/}
                {/*</div>*/}
            </Collapsible>
        </div>);
    }

    renderChildForAid() {
        let label_for_swipe =
            <Stack
                spacing="tight"><Stack.Item>{CsI18n.t("Swipe leading hash tag from the Amazon Order ID")}</Stack.Item>
                {/*<Stack.Item fill>
                    <Tooltip
                        content={CsI18n.t("")}>
                        <span className={"help-tooltip"}>
                            <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                        </span>
                    </Tooltip>
                </Stack.Item>*/}</Stack>;

        return (
            <ChoiceList
                allowMultiple={true}
                choices={[
                    {
                        label: label_for_swipe,
                        value: 'aid-swipe-hash',
                    }
                ]}
                selected={this.state.data.order_aid_option}
                onChange={this.valueUpdater("order_aid_option")}/>)
    }
}
export default Orders;
