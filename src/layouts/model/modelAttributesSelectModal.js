import React from 'react';
import Constants from "../../helpers/rules/constants";
import {
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
    TextField, ButtonGroup, TextStyle, Tooltip, Icon, Badge, Banner, Link, Heading, Spinner, DataTable, Checkbox, Layout
} from "@shopify/polaris";
import {
    SearchMinor,
} from '@shopify/polaris-icons';
import CsI18n from "../../components/csI18n";
import Util from "../../helpers/Util";
import States from "../../helpers/rules/states";
import CsErrorMessage from "../../components/csErrorMessage";
import CsEmbeddedModal from "../../components/csEmbeddedModal";
import CsButtonGroup from "../../components/csButtonGroup/csButtonGroup";
import ApplicationApiCall from "../../functions/application-api-call";
import {ModelContext} from "./model-context";

const Required_Required = 1;
const Required_Important = 2;
const Required_Optional = 3;
const Required_Preferred = 4;

const ADVANCED_ATTRIBUTES = [
    "Title", "Description", "BulletPoint", "MSRP", "SKU", "Barcode", "Price", "ConditionType", "ConditionNote",
    "MainImage", "SwatchImage", "AlternateImage", "AlternateLastImage",
    "PackageWidth", "PackageHeight", "PackageWeight", "PackageLength",
    "ItemWidth", "ItemHeight", "ItemWeight", "ItemLength",
];

export default class ModelAttributesSelectModal extends React.Component {

    static contextType = ModelContext;

    state = {
        opened: false,
        selected: [],
        searchOption: {required : false, keyword : '', important: false, advanced: false},
    }

    constructor(props) {
        super(props);

        console.log('ModelAttributesSelectModal', props)

        this.state.opened = this.props.opened;
        this.searchOptionPre = null;
    }

    componentWillMount() {
        require('./modelModal.css');
        this.initData();
    }

    compareLabel = (a, b) => {
        if(a.pinned || b.pinned) {
            if(!a.pinned) {
                return 1;
            }
            if(!b.pinned) {
                return -1;
            }
            if(a.pinned_pos != b.pinned_pos) {
                return a.pinned_pos > b.pinned_pos? 1:-1;
            }
        }
        let la = a.local_label_name;
        let lb = b.local_label_name;
        if( la === lb ) {
            return 0;
        } else if ( la > lb ) {
            return 1;
        } else {
            return -1;
        }
    }

    initData() {
        this.attributes = [];
        let {group_id, universe, product_type, data_definition} = this.props;
        let key_id = universe + "_" + product_type;
        let marketplace_id = this.getGroupMarketplaceId(group_id);
        // console.log("context", JSON.stringify(this.context.dataDefinition));
        this.dataDefinition = data_definition; //this.context.dataDefinition[marketplace_id][key_id];
        // console.log(marketplace_id, key_id, "this.dataDefinition", JSON.stringify(this.dataDefinition));
        if (!this.dataDefinition) {
            console.error("initData is null");
            return;
        }
        for (let index in this.dataDefinition.definitions) {
            let {local_label_name, attribute_name, definition_and_use, example, required, pinned, pinned_pos, xsd_element, xsd_element_origin} = this.dataDefinition.definitions[index];
            let local_label_name_lower = local_label_name.toLowerCase();
            if(!definition_and_use) {
                definition_and_use = '';
            }
            let definition_and_use_lower = definition_and_use.toLowerCase();
            if(!example) {
                example = '';
            }
            let example_lower = example? example.toLowerCase():'';
            this.attributes.push({local_label_name, attribute_name, definition_and_use, xsd_element, xsd_element_origin, example, required, local_label_name_lower, attribute_name_lower: attribute_name.toLowerCase(), definition_and_use_lower, example_lower, pinned, pinned_pos});
        }

        this.attributes.sort(this.compareLabel);
        // this.attributes.sort((a, b) => {
        //     // if( a.required < b.required ) {
        //     //     return -1;
        //     // } else if ( a.required > b.required ) {
        //     //     return 1;
        //     // }
        //     //
        //     return a.local_label_name > b.local_label_name? 1 : -1;
        // });
        this.inserted = [];
        for (let item of this.props.selected) {
            this.inserted.push(item.attribute_name);
        }
        this.is_create_mode = this.props.mode == 'create';
        console.log(this.inserted);
    }

    isInserted(attribute_name) {
        return this.inserted.indexOf(attribute_name) !== -1;
    }

    isSelected(attribute_name) {
        return this.state.selected.indexOf(attribute_name) !== -1;
    }

    handleCheckChange = (attribute_name) => (checked) => {
        if (checked) {
            this.setState(state => ({selected: [...state.selected, attribute_name]}));
        } else {
            this.setState(state => {
                let selected = [...state.selected]; // make a separate copy of the array
                let index = selected.indexOf(attribute_name);
                selected.splice(index, 1);
                return {selected: selected}
            });
        }
    }

    //@todo this function is duplicated! @kbug_190619
    getGroupMarketplaceId(groupId) {
        let {matchingGroup} = this.context.data;
        let marketplace_id = "";
        for (let item of matchingGroup) {
            if (item.id == groupId) {
                marketplace_id = item.marketplace_id;
                break;
            }
        }
        return marketplace_id;
    }

    componentWillReceiveProps(nextProps, nextContext) {
        if (nextProps.opened != this.state.opened) {
            this.setState({opened: nextProps.opened});
        }
    }

    componentWillUnmount() {
        this.unMounted = true;
    }

    handleClose = () => {
        let {onClose} = this.props;
        if (onClose) {
            onClose();
        }
    }

    handleAdd = () => {
        let {onAdd} = this.props;
        if (onAdd) {
            onAdd(this.state.selected);
        }
        console.log("handleAdd", this.state.selected);
    }

    initRows() {
        console.log("initRows", this.searchOptionPre, this.state.searchOption);
        if( this.searchOptionPre === null
            || this.searchOptionPre.keyword !== this.state.searchOption.keyword
            || this.searchOptionPre.required !== this.state.searchOption.required
          || this.searchOptionPre.important !== this.state.searchOption.important
          || this.searchOptionPre.advanced !== this.state.searchOption.advanced
        ) {
            let keyword = this.state.searchOption.keyword.toLowerCase();
            // console.log(this.attributes);
            this.rows = this.attributes.filter(item => {
                let bMatch = true;
                if (this.state.searchOption.required || this.state.searchOption.important) {
                    bMatch = false;
                    if (this.state.searchOption.required) {
                        if( item.required == Required_Required ) {
                            bMatch = true;
                        }
                    }
                    if (!bMatch) {
                        if (this.state.searchOption.important) {
                            if (item.required == Required_Important) {
                                bMatch = true;
                            }
                        }
                    }
                }
                if (!bMatch) {
                    return false;
                }

                if (this.is_create_mode) {
                    if (!this.state.searchOption.advanced) {
                        if (Util.inArray(item.xsd_element, ADVANCED_ATTRIBUTES)) {
                            return false;
                        }
                        if (item.xsd_element_origin && Util.inArray(item.xsd_element_origin, ADVANCED_ATTRIBUTES)) {
                            return false;
                        }
                    }
                }

                if (!keyword) {
                    return true;
                }

                if( item.local_label_name_lower.indexOf(keyword) !== -1 ||
                    item.definition_and_use_lower.indexOf(keyword) !== -1 ||
                    item.example_lower.indexOf(keyword) !== -1 ||
                    item.attribute_name_lower.indexOf(keyword) !== -1
                ) {
                    return true;
                }
                return false;
            });
            this.searchOptionPre = Util.clone(this.state.searchOption);
        }
    }

    handleSearchOption = (field) => (value) => {
        this.setState(preState => {
            return {
                searchOption: {...preState.searchOption, [field]:value}
            }
        });
    }

    render() {
        // console.log("render", this.state, this.attributes);
        this.initRows();
        // console.log("render", this.attributes);
        return (
            <CsEmbeddedModal
                open={this.state.opened}
                large
                onClose={this.handleClose}
                title={<Stack alignment={"center"}><Stack.Item>{CsI18n.t("Attributes")}</Stack.Item>{this.is_create_mode? <Stack.Item><Checkbox checked={this.state.searchOption.advanced}
                                                                                                   onChange={this.handleSearchOption('advanced')}
                                                                                                   label={<CsI18n>Show advanced attributes</CsI18n>}/></Stack.Item>:null}</Stack>}
                primaryAction={{
                    content: <CsI18n>Insert selected attributes to model</CsI18n>,
                    onAction: this.handleAdd,
                    disabled: this.state.selected.length === 0,

                }}
                secondaryActions={[
                    {
                        content: <CsI18n>Cancel</CsI18n>,
                        onAction: this.handleClose
                    }
                ]}
                footer={(<Stack alignment={"center"}>
                    <Stack.Item><DisplayText size={"small"}><CsI18n>Filter</CsI18n></DisplayText></Stack.Item>
                    <Stack.Item><Checkbox checked={this.state.searchOption.required}
                                          onChange={this.handleSearchOption('required')}
                                          label={<CsI18n>Required</CsI18n>}/></Stack.Item>
                    <Stack.Item><Checkbox checked={this.state.searchOption.important}
                                          onChange={this.handleSearchOption('important')}
                                          label={<CsI18n>Important</CsI18n>}/></Stack.Item>
                    <Stack.Item fill>
                        <TextField label={"Search"} labelHidden={true} placeholder={CsI18n.t("Search attribute")}
                                   value={this.state.searchOption.keyword} onChange={this.handleSearchOption('keyword')}/>
                    </Stack.Item>
                </Stack>)}
            >
                <Modal.Section>
                    {this.renderXlsFile()}
                </Modal.Section>
                <ResourceList
                    resourceName={{singular: 'attribute', plural: 'attributes'}}
                    items={this.rows}
                    renderItem={item => {
                        let required_badge='';
                        switch(item.required) {
                            case Required_Required:
                                required_badge = <Badge status={"warning"}><CsI18n>Required</CsI18n></Badge>;
                                break;
                            case Required_Important:
                                required_badge = <Badge status={"attention"}><CsI18n>Important</CsI18n></Badge>;
                                break;
                            default:
                                required_badge = '';
                        }
                        return (
                            <ResourceList.Item
                                id={item.attribute_name}
                            >
                                <div className="data-definition">
                                    <div className="data-check">
                                        <Checkbox disabled={this.isInserted(item.attribute_name)}
                                                  checked={this.isSelected(item.attribute_name)}
                                                  onChange={this.handleCheckChange(item.attribute_name)}/>
                                    </div>
                                    <div className="data-name">
                                        <b>{Util.getRawHtmlElement(item.local_label_name)}</b>&nbsp;({item.attribute_name})
                                    </div>
                                    <div className="data-required">
                                        {required_badge}
                                    </div>
                                    <div className="data-detail">
                                        <TextStyle>{Util.getRawHtmlElement(item.definition_and_use)}</TextStyle><br/>
                                        <TextStyle variation="code">{Util.getRawHtmlElement(item.example)}</TextStyle>
                                    </div>
                                </div>
                            </ResourceList.Item>
                        );
                    }}
                />

            </CsEmbeddedModal>
        );
    }

    renderXlsFile() {

        let xls_name = '';
        let xls_iso_code = this.props.marketplace.DefaultCountryCode.toLowerCase();
        let xls_universe = this.props.universe.toLowerCase();
        let xls_url = null;
        let xls_banner = null;

        console.log('XLS File', xls_iso_code, xls_universe, Constants.xls_templates_mapping);

        if (xls_iso_code in Constants.xls_templates_mapping) {
            console.log('ISO code found', xls_iso_code)

            if (xls_universe in Constants.xls_templates_mapping[xls_iso_code]) {
                let xls_url = Constants.xls_templates_mapping[xls_iso_code][xls_universe];
                let xls_link = <a href={xls_url} target="_blank">{xls_url}</a>;

                console.log('Template found', xls_url, xls_link)

                xls_banner =
                    <Modal.Section>
                        <Banner status="info" title=
                            {
                                <CsI18n>{'Please select relevant attributes'}</CsI18n>
                            }

                        >

                            <p>
                                <CsI18n xls_link={xls_link}>
                                    {'To find mandatory and relevant attributes for this product type, please refer to the template file:'}
                                </CsI18n>
                                &nbsp;{xls_link}
                                <br/>
                                <CsI18n>
                                    {'Mandatory (or might be mandatory...) are listed in the Data Definitions tab. Paradox; adding too many attributes exposes to have your feed rejected, adding not enough as well, please referer to Help > Tutorials for more accurate details.'}
                                </CsI18n><br/>
                            </p>
                        </Banner>
                    </Modal.Section>
            }
        }
        return (xls_banner);
    }

}
