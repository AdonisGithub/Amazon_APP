import React from "react";
import CsI18n from "./../../components/csI18n"


import {
    Card,
    Checkbox,
    ChoiceList, Collapsible, Heading, Icon, Link, Select, Spinner, Stack, Tooltip
} from "@shopify/polaris";
import {ChevronDownMinor, ChevronUpMinor, CircleInformationMajorMonotone} from "@shopify/polaris-icons";
import ShopifyContext from "../../context";
import Util from "../../helpers/Util";
import ShopifyApiCall from "../../functions/shopify-api-call";
import WorkflowTab from "./workflow_tab";

class Fba extends WorkflowTab {

    static default_values = {
        fba_option: [],
        fba_sync_option: ['one'],
        fba_order_option: [],
        advanced_fba_option: ['auto-switch', 'auto-mfn-switch'],
        advanced_mcf_option: ['not-auto-send-risk'],
        fba_sync_location: ''
    }

    constructor(props) {
        super(props);

        this.shopify = ShopifyContext.getShared();
        this.state.advanced_active = false;
        this.state.loading = true;
        this.state.locations = [];
        this.defaults = Util.clone(Fba.default_values);
        if ( !this.props.config.hasOwnProperty('data') || !this.props.config.data)
            this.configurationUpdateCurrent(this.defaults);

        this.handleChange = this.handleChange.bind(this);
    }

    getName() {
        return "fba";
    }

    loadConfig() {
        this.configurationLoad();
        this.configurationUpdateCurrent(this.state.data);
    }

    componentWillMount() {
        console.log("componentWillMount");
        this.loadConfig();
        this.fetchNormalLocations();
    }

    fetchNormalLocations() {
        ShopifyApiCall.get('locations/get_normal', {}, this.handleLocations, () => {this.setState({loading:false, locations: []});});
    }

    handleLocations = (locations_listings) => {
        if (this.unMounted) {
            return;
        }
        console.log(locations_listings);
        if (locations_listings !== undefined) {
            console.log('parsing locations');
            let locations = [{label: CsI18n.t('Please select a location'), value:''}];
            locations_listings.forEach((elm)=>{
                if (!elm.hasOwnProperty('name')) return;
                let option = {value:elm.id.toString(), label:elm.name.toString()};
                locations.push(option);
            })
            this.setState({loading:false, locations: locations});
        }
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

    handleChangeLocation = (location) => {
        let configurationData={...this.defaults,...this.configurationGetCurrent()};

        // Ensure we cleanup the target field to prevent to save old configuration (case of arrays)
        configurationData['fba_sync_location'] = null;

        this.setState(prevState => {
            return {
                data: {
                    ...this.defaults,
                    ...configurationData,
                    fba_sync_location: location,
                }
            }
        }, this.saveState);
    }
    //
    // isAllowedFeature(feature) {
    //     let selected_features = [];
    //     if(this.state.data.hasOwnProperty('selected_features') && this.state.data.selected_features !== null){
    //         selected_features = this.state.data.selected_features;
    //     }else{
    //         selected_features = [];
    //     }
    //     if( selected_features.indexOf(feature) !== -1 ) {
    //         return true;
    //     }
    //     return false;
    // }

    handleAdvancedOpen = () => {
        this.setState(prev => {
            return {advanced_active: !prev.advanced_active}
        })
    }

    render() {
        console.log(this.state);
        if (this.state.loading) {
            return this.renderLoading();
        } else {
            return this.renderData();
        }
    }

    renderLoading() {
        return(
            <div align="center">
                <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")} ></Spinner>
            </div>
        );
    }

    renderData() {
        const selected = parseInt(this.state.selectedTab);
        console.log(this);

        var contextual_message = "";
        let isAllowedFeature = true;
        let isActiveSyncStock = Util.inArray('sync_stock', this.state.data.fba_option);
        let isMultiSyncStock = isActiveSyncStock && Util.inArray('multi', this.state.data.fba_sync_option);

        let label_fba_mcf =
            <Stack
                spacing="tight"><Stack.Item>{CsI18n.t("Use Amazon FBA Multichannel (MCF)")}</Stack.Item>
                <Stack.Item fill>
                    <Tooltip
                        content={CsI18n.t("Allow to trigger a shipment through Amazon FBA.") + CsI18n.t("This option is available only when <Sync inventory levels from FBA> is activated")}>
                        <span className={"help-tooltip"}>
                            <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                        </span>
                    </Tooltip>
                </Stack.Item></Stack>;
        let label_fba_sync =
            <Stack
                spacing="tight"><Stack.Item>{CsI18n.t("Sync inventory levels from FBA")}</Stack.Item>
                <Stack.Item fill>
                    <Tooltip
                        content={CsI18n.t("It automatically creates a location for Amazon FBA, and place your Amazon FBA inventory there.")}>
                        <span className={"help-tooltip"}>
                            <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                        </span>
                    </Tooltip>
                </Stack.Item></Stack>;


        let label_fba_import =
            <Stack
                spacing="tight"><Stack.Item>{CsI18n.t("Create unknown products on Shopify returned by Amazon FBA")}</Stack.Item>
                <Stack.Item fill>
                    <Tooltip
                        content={CsI18n.t("Import the non-existing inventories returned by Amazon FBA, create corresponding products in your store.")}>
                        <span className={"help-tooltip"}>
                            <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                        </span>
                    </Tooltip>
                </Stack.Item></Stack>;

        let label_fba_mcf_risk =
            <Stack
                spacing="tight"><Stack.Item>{CsI18n.t("Hold risky orders")}</Stack.Item>
                <Stack.Item fill>
                    <Tooltip
                        content={CsI18n.t("Don't send the FBA order automatically if there is a risk on the order.")}>
                        <span className={"help-tooltip"}>
                            <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                        </span>
                    </Tooltip>
                </Stack.Item>
            </Stack>;

        let label_switch_afn_to_mfn = <Stack
            spacing="tight"><Stack.Item>{CsI18n.t("Switch AFN to MFN automatically when Amazon FBA is out of stock")}</Stack.Item>
            <Stack.Item fill>
                <Tooltip
                    content={CsI18n.t("This option is available when using multi location.")}>
                        <span className={"help-tooltip"}>
                            <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                        </span>
                </Tooltip>
            </Stack.Item></Stack>;

        return (
            <Card.Section>
                <ChoiceList
                    allowMultiple
                    title={CsI18n.t("FBA Multichannel")}
                    choices={[
                        {
                            label: label_fba_sync,
                            value: "sync_stock",
                            disabled: isAllowedFeature ? false : true,
                            renderChildren: isSelected => {
                                return isSelected && this.renderSyncStockChild();
                            }
                        },
                        {
                            label: label_fba_mcf,
                            value: "fba",
                            disabled: !isActiveSyncStock,
                            helpText: CsI18n.t(""),
                            renderChildren: isSelected => {
                                return isSelected && this.renderMCFPreferences();
                            }
                        },
                    ]}
                    selected={ isAllowedFeature? this.state.data.fba_option:[] }
                    onChange={this.valueUpdater("fba_option")}
                />
                <div className={"mt-3"}>
                    <Stack alignment={"leading"}>
                        <Stack.Item><Heading>{CsI18n.t('Advanced')}</Heading></Stack.Item>
                        <Stack.Item><Link onClick={this.handleAdvancedOpen}><Icon source={this.state.advanced_active? ChevronUpMinor:ChevronDownMinor}/></Link></Stack.Item>
                    </Stack>
                    <Collapsible open={this.state.advanced_active} id="advanced-collapsible">
                        <div className={"ml-6 mt-2"}>
                            <ChoiceList
                                allowMultiple
                                title={CsI18n.t("Product")}
                                choices={[
                                    {
                                        label: label_fba_import,
                                        value: 'auto-import',
                                    },
                                    {
                                        label: CsI18n.t("Switch MFN to AFN automatically when Amazon FBA stock is available."),
                                        value: 'auto-switch',
                                    },
                                    {
                                        label: label_switch_afn_to_mfn, //CsI18n.t("Switch AFN to MFN automatically when Amazon FBA is out of stock"),
                                        value: 'auto-mfn-switch',
                                        disabled: !isMultiSyncStock
                                    }
                                ]}
                                disabled={!isActiveSyncStock}
                                selected={this.state.data.advanced_fba_option}
                                onChange={this.valueUpdater("advanced_fba_option")}
                            />
                        </div>
                        <div className={"ml-6 mt-2"}>
                            <ChoiceList
                                allowMultiple
                                title={CsI18n.t("MCF")}
                                choices={[
                                    {
                                        label: label_fba_mcf_risk,
                                        value: 'not-auto-send-risk',
                                    }
                                ]}
                                disabled={!isActiveSyncStock}
                                selected={this.state.data.advanced_mcf_option}
                                onChange={this.valueUpdater("advanced_mcf_option")}
                            />
                        </div>
                    </Collapsible>
                </div>
            </Card.Section>
        );
    }

    renderMCFPreferences() {
        let choices = [];
        let isActiveSyncStock = Util.inArray('sync_stock', this.state.data.fba_option);
        let label_fba_mcf_auto =
            <Stack
                spacing="tight"><Stack.Item>{CsI18n.t("Create fulfillments on Amazon")}</Stack.Item>
                <Stack.Item fill>
                    <Tooltip
                        content={CsI18n.t("An MCF shipment will be triggered automatically for eligible & paid orders placed on your store.")}>
                        <span className={"help-tooltip"}>
                            <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                        </span>
                    </Tooltip>
                </Stack.Item></Stack>;

        choices.push({
            label: label_fba_mcf_auto,
            value: "fba_auto_fulfill",
        });

        return (
            <React.Fragment>
                <ChoiceList
                    allowMultiple
                    title={CsI18n.t("Preferences")}
                    choices={choices}
                    disabled={!isActiveSyncStock}
                    selected={this.state.data.fba_order_option}
                    onChange={this.valueUpdater("fba_order_option")}
                />
            </React.Fragment>
        );
    }

    convertToFbaSyncOption(fba_sync_option) {
        let options = [];
        if(fba_sync_option && fba_sync_option.length > 0 ) {
            options.push(fba_sync_option[0]);
        } else {
            options.push('one');
        }
        return options;
    }

    renderSyncStockChild() {
        let fba_sync_option = this.convertToFbaSyncOption(this.state.data.fba_sync_option);
        console.log("renderSyncStockChild", fba_sync_option);
        return (
            <React.Fragment>
                <ChoiceList
                    title=''
                    choices={[
                        {
                            label: CsI18n.t('Use one location for FBA product.(The location will be created automatically)'),
                            value: "one",
                        },
                        {
                            label: CsI18n.t('Use multi location for FBA product.'),
                            value: "multi",
                            renderChildren: isSelected => {
                                return this.renderSyncStockManual(isSelected);
                            }
                        },
                    ]}
                    selected={fba_sync_option}
                    onChange={this.valueUpdater("fba_sync_option")}
                />
            </React.Fragment>
        );
    }

    renderSyncStockManual(isSelected) {
        let {locations} = this.state;
        return (
            <React.Fragment>
                <div className={"wd-40rem"}>
                <Select
                    disabled={!isSelected}
                    options={locations}
                    value={this.state.data.fba_sync_location}
                    onChange={this.valueUpdater("fba_sync_location")}
                />
                </div>
            </React.Fragment>
        );
    }
}
export default Fba;
