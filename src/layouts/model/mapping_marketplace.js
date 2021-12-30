import React from 'react';
import {
    Page,
    Button,
    Card,
    ChoiceList,
    Collapsible,
    DisplayText,
    Modal,
    FormLayout,
    OptionList,
    ResourceList,
    Select,
    Stack,
    TextContainer,
    TextField, ButtonGroup, TextStyle, Tooltip, Icon, Badge, Banner, Link, Heading, Spinner, Layout, Tag
} from "@shopify/polaris";
import {ChevronDownMinor, ChevronUpMinor, ChevronRightMinor} from '@shopify/polaris-icons';

import {CsValidationForm, CsValidation} from "../../components/csValidationForm";
import CsI18n from "../../components/csI18n";
import States from "../../helpers/rules/states";
import Constants from "../../helpers/rules/constants";
import Util from "../../helpers/Util";
import MarketplaceTab from "../../helpers/marketplace-tab";

import {ModelContext} from "./model-context";
import ModelTab from "./model-context";

import ConfigurationApiCall from "../../functions/configuration-api-call";

import CsErrorMessage from "../../components/csErrorMessage";
import ApplicationApiCall from "../../functions/application-api-call";

import CsAutoComplete from '../../components/csAutocomplete';
import default_mapping_data from "./mapping_data.json";

export default class MappingMarketplace extends ModelTab {

    static contextType = ModelContext;

    state = {
        ...this.state,
        wait: true,
        updated: false,
        opened: [],
        status: States.STATUS_NORMAL,
    }

    constructor(props) {
        super(props);
        this.initialState = Util.clone(this.state);
        this.marketplace_id = this.props.marketplace_id;
        this.unMounted = false;
    }

    componentWillMount() {
        require("./mapping.css");
        this.initConfig();
        this.loadMapping();
    }

    loadMapping = () => {
        this.fetchMapping(this.marketplace_id);
    }

    componentWillUnmount() {
        this.unMounted = true;
    }

    initConfig() {
        this.defaults = {
            ...this.defaults,
            mappingData: [], //saved mapping
        };
        let initConfig = this.configurationGetCurrent();
        console.log("initConfig", initConfig, this.defaults);

        let config = {...this.defaults, ...initConfig};
        let data = Util.clone(config);
        this.setMappingData(data.mappingData);
    }

    setMappingData(data) {
        this.mappingData = [];
        for(let i in data) {
            let {marketplace_id, mapping} = data[i];
            let list = [];
            for(let mi in mapping) {

                let key = mapping[mi].product_type? this.makeKey(mapping[mi]):this.makeOldKey(mapping[mi]);
                let matched = [];
                let {option_items,...other} = mapping[mi];
                for(let oi in option_items) {
                    matched[option_items[oi].option_item] = option_items[oi].value;
                }
                list[key] = {...other, matched};
            }
            this.mappingData[marketplace_id] = list;
        }
    }

    fetchMapping(marketplace_id) {
        let {configuration, mapping} = this.context;
        if (mapping[marketplace_id] != undefined) {
            this.initMappingData(marketplace_id, this.context.mapping[marketplace_id]);
            this.setState({wait: false});
            return;
        }
        let params = {configuration, marketplace_id};
        ApplicationApiCall.get('/application/models/mapping',
            params, this.cbFetchMappingSuccess, this.cbFetchMappingError);

        this.setState({wait: true});
    }

    cbFetchMappingSuccess = (json) => {
        console.log("cbFetchMappingSuccess", json);
        if (this.unMounted)
            return;

        if (!json) {
            console.error("json is null");
            return;
        }
        let marketplace_id = json.marketplace_id;
        this.context.mapping[marketplace_id] = json.mapping;
        this.initMappingData(marketplace_id, json.mapping);
        console.log("cbFetchMappingSuccess", marketplace_id, this.mapping);
        this.setState({wait: false});
    }

    cbFetchMappingError = (err) => {
        console.log("cbFetchMappingError", err);
        if (this.unMounted) {
            return;
        }
        if (err) {
            console.log("cbFetchMappingError: show error");
            // setTimeout(() => {
            //     this.setState({error: null})
            // }, 5000);
            this.setState({error: err, wait: false});
        }
    }

    makeKey(item) {
        return item.universe + "_" + item.product_type + "_" + item.field_name + "_" + item.option_name;
    }

    makeOldKey(item) {
        return item.universe + "_" + item.field_name + "_" + item.option_name;
    }

    initMappingData(marketplace_id, mapping) {
        this.mapping = mapping.map(item => {
            let {valid_values} = item;
            // if (valid_values.length != 0) {
            //     valid_values = valid_values;
            // }
            return {...item, valid_values};
        });
        let saved_mapping_data = this.mappingData ? this.mappingData[marketplace_id] : null;
        console.log("initMappingData", mapping, saved_mapping_data);

        let mapping_data = [];
        for (let i in mapping) {
            let key = this.makeKey(mapping[i]);
            let oldKey = this.makeOldKey(mapping[i]);

            let auto_matched = [];
            let matched = [];
            mapping[i].option_items.sort();
            for (let oi in mapping[i].option_items) {
                let option_item = mapping[i].option_items[oi];

                if (saved_mapping_data && saved_mapping_data[key] && saved_mapping_data[key].matched[option_item]) {
                    if( mapping[i].field_name == 'Color' && option_item == saved_mapping_data[key].matched[option_item] ) {
                        auto_matched[option_item] = option_item;
                    } else {
                        matched[option_item] = saved_mapping_data[key].matched[option_item];
                    }
                } else if (saved_mapping_data && saved_mapping_data[oldKey] && saved_mapping_data[oldKey].matched[option_item]) {
                    if( mapping[i].field_name == 'Color' && option_item == saved_mapping_data[oldKey].matched[option_item] ) {
                        auto_matched[option_item] = option_item;
                    } else {
                        matched[option_item] = saved_mapping_data[oldKey].matched[option_item];
                    }
                } else {
                    if( mapping[i].field_name == 'Color' && mapping[i].valid_values.indexOf(option_item) !== -1 ) {
                        auto_matched[option_item] = option_item;
                    } else {
                        let default_mapping = null;
                        if(default_mapping_data && default_mapping_data[mapping[i].universe]) {
                            if (default_mapping_data[mapping[i].universe][mapping[i].xsd_mapping_field]) {
                                default_mapping = default_mapping_data[mapping[i].universe][mapping[i].xsd_mapping_field];
                            } else if (default_mapping_data[mapping[i].universe]['*']) {
                                default_mapping = default_mapping_data[mapping[i].universe]['*'];
                            }
                        }
                        let option_item_value = ("" + option_item).toLowerCase();
                        if(default_mapping && default_mapping[option_item_value]) {
                            matched[option_item] = default_mapping[option_item_value];
                        } else {
                            matched[option_item] = "";
                        }
                    }
                }
            }

            mapping_data[key] = {
                // universe_id: mapping[i].universe_id,
                universe: mapping[i].universe,
                field_name: mapping[i].field_name,
                option_name: mapping[i].option_name,
                product_type: mapping[i].product_type,
                matched,
                auto_matched,
            }
        }
        console.log("mapping_data", mapping_data);
        this.mappingData[marketplace_id] = mapping_data;

        let opened = [];
        for (let i = 0; i < this.mapping.length; i++) {
            opened.push(true);
        }
        this.setState({opened: opened});
    }

    getMappingData(mapping_item) {
        let marketplace_id = this.marketplace_id;
        let key = this.makeKey(mapping_item);
        let mappingData = this.mappingData[marketplace_id];
        if( mappingData && mappingData[key] )
            return mappingData[key];
        return null;
    }

    handleCollapse = (index) => () => {
        let {opened} = this.state;
        opened[index] = !opened[index];
        this.setState({opened: opened});
    }

    handleMappingChange = (mapping_item, option_item) => (value) => {
        console.log("handleMappingChange", mapping_item, option_item, value);

        let mappingData = this.getMappingData(mapping_item);
        mappingData.matched[option_item] = value;

        this.setState({updated: true});
    }

    handleSaveButton = () => {
        console.log('handleSaveButton', this.mappingData);

        let mappingData = [];
        for(let marketplace_id in this.mappingData) {
            let mapping = [];
            for(let key in this.mappingData[marketplace_id]) {
                let {matched, auto_matched, ...other} = this.mappingData[marketplace_id][key];
                let items = [];

                for(let option_item in auto_matched) {
                    items.push({option_item: option_item, value: auto_matched[option_item]});
                }
                for(let option_item in matched) {
                    items.push({option_item: option_item, value: matched[option_item]});
                }
                mapping.push( {
                    ...other, option_items: items
                });
            }

            mappingData.push( {
                marketplace_id, mapping
            });
        }

        let config = {
            ...this.defaults, ...this.configurationGetCurrent(),
            mappingData
        };
        console.log("handleSaveButton", config);

        let configuration = this.getSelectedConfigurationName();
        ConfigurationApiCall.post('replace', {section: "groups", configuration}, config,
            (json) => {
                if (this.unMounted) {
                    return;
                }
                console.log("formSaveSuccess", json);
                this.configurationUpdateCurrent(config);
                this.context.data = config;

                setTimeout(() => {
                    this.setState({status: States.STATUS_NORMAL});
                }, 3000);
                this.setState({status: States.STATUS_SAVED});
            }, (err) => {
                  if (this.unMounted) {
                      return;
                  }
                console.log("formSaveError", err);
                // setTimeout(() => {
                //     this.setState({error: null})
                // }, 5000);
                this.setState({error: err, status: States.STATUS_NORMAL});
            });
        this.setState({status: States.STATUS_SAVING});
    };

    render() {
        console.log("render", this.state, this.mapping, this.mappingData);
        const {status} = this.state;

        let contextual_message;
        if (status === States.STATUS_ERROR) {
            contextual_message = this.renderError();
        } else if (status === States.STATUS_SAVED) {
            contextual_message = Constants.mapping_saved_successfully;
        }
        const has_mapping  = (this.mapping && this.mapping.length > 0)? true:false;
        return (
            <Layout.Section>
                {this.state.wait ?
                    (<div align="center">
                        <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
                    </div>)
                    :
                    (<div className={"mapping"}>
                        {contextual_message}
                        {has_mapping ?
                            <React.Fragment>
                                <CsValidationForm name="MappingForm">
                                    {this.renderMapping()}
                                </CsValidationForm>
                                <Stack>
                                    <Stack.Item fill/>
                                    <Stack.Item>
                                        <Button primary={true}
                                                onClick={this.handleSaveButton}
                                                loading={this.state.status == States.STATUS_SAVING}><CsI18n>Save</CsI18n></Button></Stack.Item></Stack>
                            </React.Fragment>
                            :
                            <Banner status="warning" title={CsI18n.t("No data")}>
                                <TextStyle><CsI18n>No mapping available for the selected
                                    marketplace</CsI18n></TextStyle>
                            </Banner>
                        }
                    </div>)}
            </Layout.Section>
        )
    }

    renderMapping() {
        let mapping_view = [];
        let open = true;

        for (let i in this.mapping) {
            let item = this.mapping[i];
            mapping_view.push(<div key={"mapping-group" + i} className={"mapping-group"}>
                <div className={"mapping-group-header"} key={"mapping-group-header" + i}>
                    <Stack alignment={"trailing"}>
                        <Stack.Item fill>
                            <Heading>{item.universe_display_name + ": " + item.product_type_display_name + ", " + item.option_name + " -> " + item.field_display_name}</Heading></Stack.Item>
                        <Stack.Item>
                            <Link key={"link" + i} onClick={this.handleCollapse(i)}><Icon
                                source={this.state.opened[i] ? ChevronUpMinor : ChevronDownMinor}/></Link></Stack.Item>
                    </Stack>
                </div>
                <Collapsible open={this.state.opened[i]}>
                    <FormLayout>
                        <FormLayout.Group condensed>
                            {this.renderMappingList(i, item)}
                        </FormLayout.Group>
                    </FormLayout>
                    {this.renderAutoMappingData(i, item)}
                </Collapsible>
            </div>);
        }
        return (<React.Fragment>{mapping_view}</React.Fragment>);
    }

    renderMappingList(index, item) {
        let option_items = [];
        let mappingData = this.getMappingData(item);

        for (let i in mappingData.matched) {
            option_items.push(<div className={"mapping-item"} key={"mapping_item" + index + "-" + i}>
                <div className={"mapping-item-option"} key={"mapping_item_option" + index + '-' + i}>
                    <TextField label={"Value"} labelHidden={true} value={i} readOnly={true}/>
                </div>
                <div className={"mapping-item-icon"} key={"mapping_item_icon" + index + '-' + i}><Icon
                    source={ChevronRightMinor}/></div>
                <div className={"mapping-item-value"} key={"mapping_item_value" + index + '-' + i}>
                    {item.valid_values.length > 0 ?
                        (<CsAutoComplete
                            isOnlyValue={true}
                            options={item.valid_values}
                            onChange={this.handleMappingChange(item, i)}
                            selected={mappingData.matched[i]}
                            allowedInput={item.has_custom_value? true:false}
                        />)
                        : (<TextField label={"Value"} labelHidden={true}
                                   value={mappingData.matched[i]}
                                   onChange={this.handleMappingChange(item, i)}/>)}
                </div>
            </div>);
        }
        return (<React.Fragment>{option_items}</React.Fragment>);
    }

    handleDeleteAutoMapping = (mapping_item, value) => () => {
        let mappingData = this.getMappingData(mapping_item);
        if( !mappingData )
            return;

        if( mappingData.auto_matched[value] ) {
            delete mappingData.auto_matched[value];
        }
        mappingData.matched[value] = value;
        console.log("handleDeleteAutoMapping", mapping_item, mappingData, value);
        this.setState({updated: true});
    }

    renderAutoMappingData(index, item) {
        let auto_mapping = [];
        let mappingData = this.getMappingData(item);

        for (let i in mappingData.auto_matched) {
            auto_mapping.push(<Stack.Item key={"mapping-matched-stack-" + index + "item" + i}><Tag key={"mapping-matched" + index + "item" + i} onRemove={this.handleDeleteAutoMapping(item, mappingData.auto_matched[i])}>{mappingData.auto_matched[i]}</Tag></Stack.Item>);
        }
        if(auto_mapping.length === 0) {
            return '';
        }
        return (<div className={"mapping-matched"} key={"mapping-matched" + index}>
            <TextStyle variation="positive"><CsI18n>These values have been automatically matched</CsI18n></TextStyle>
            <Stack spacing="tight">{auto_mapping}</Stack>
        </div>);
    }

    renderError() {
        console.log(this.state.error);
        return (
            <CsErrorMessage
                errorType={this.state.error.type}
                errorMessage={this.state.error.message}
            />
        )
    }
}
