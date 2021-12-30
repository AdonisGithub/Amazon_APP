import React from 'react';
import Constants from "../../helpers/rules/constants";
import {
    Button,
    Caption,
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
    TextField,
    ButtonGroup,
    TextStyle,
    Tooltip,
    Icon,
    Badge,
    Banner,
    Link,
    Heading,
    Spinner,
    DataTable,
    Checkbox,
    Layout,
    Label
} from "@shopify/polaris";

import {
    ChevronDownMinor,
    ChevronUpMinor,
    QuestionMarkMajorMonotone,
    PlusMinor,
    DeleteMinor,
    CirclePlusMajorMonotone,
    CirclePlusMinor,
    CircleMinusMinor,
} from '@shopify/polaris-icons';
import CsI18n from "../../components/csI18n";
import Util from "../../helpers/Util";
import States from "../../helpers/rules/states";
import CsErrorMessage from "../../components/csErrorMessage";
import CsEmbeddedModal from "../../components/csEmbeddedModal";
import CsButtonGroup from "../../components/csButtonGroup/csButtonGroup";
import ApplicationApiCall from "../../functions/application-api-call";
import {ModelContext} from "./model-context";
import {CsValidationForm, CsValidation} from "../../components/csValidationForm";
import Help from "../../help";

import CsAutoComplete from '../../components/csAutocomplete/csAutocomplete';
import country_iso_codes from "../../constant/country_iso_codes.json";


const SHOPIFY_VALUE_TITLE = '{{Title}}';

const OPTION_Shopify_Values = [
    {label: '', value: ''},
    {label: 'SKU', value: '{{SKU}}'},
    {label: 'Title', value: '{{Title}}'},
    {label: 'Description', value: '{{Description}}'},
    {label: 'Tags', value: '{{Tags}}'},
    {label: 'Vendor', value: '{{Vendor}}'},
    {label: 'Price', value: '{{Price}}'},
    {label: 'CompareAtPrice', value: '{{CompareAtPrice}}'},
    {label: 'Product Type', value: '{{Product Type}}'},
    {label: 'Weight', value: '{{Weight}}'},
    {label: 'Barcode', value: '{{Barcode}}'},
    {label: 'Main image', value: '{{MainImage}}'},
    {label: 'Variant image', value: '{{VariantImage}}'},
    {label: 'Variant values', value: '{{Variant values}}'},
    {label: 'Country of origin', value: '{{CountryOfOrigin}}'},
    {label: 'HS code', value: '{{HSCode}}'},
];

const SUFFIX_VARIANT_NAME = ' - {{Variant Name}}';

export default class ModelAttributeEditModal extends React.Component {

    static contextType = ModelContext;

    state = {
        opened: false,
        validValue: "",
        shopify_option: "",
        shopify_advanced_open: false,
        shopify_advanced_option: "",
        shopify_advanced_text: "",
        // is_use_exist_value: true,

        is_add_variant_name: false,
        is_title_attribute: false,
        default_shopify_value: "",

        is_dont_convert_currency: false,
        //@kbug_211118 if you add an option, you should add it in template.
    }

    condition = {id: 0, condition: 'c', rule: 0, value: 0};

    constructor(props) {
        super(props);
        this.state.opened = this.props.opened;
        this.marketplace = this.props.marketplace;
        this.universe = this.props.universe;

        this.is_country_origin = this.props.attribute.xsd_element == 'CountryOfOrigin';

        console.log(this.props);
        console.log(this.marketplace);
    }

    componentWillMount() {
        require('./modelModal.css');
        this.initData();
    }

    initData() {
        let {rulesParameter} = this.context;
        this.rules_parameters = rulesParameter;

        let {metaFieldsProduct, metaFieldsVariant} = this.context;
        this.metaFieldsProduct = metaFieldsProduct;
        this.metaFieldsVariant = metaFieldsVariant;

        this.shopify_values = OPTION_Shopify_Values.map((item) => {
            return {label: CsI18n.t(item.label), value: item.value}
        } );
        let {shopify_options} = this.props;
        if(shopify_options) {
            let bFirst = true;
            for(let key in shopify_options ) {
                if(bFirst) {
                    this.shopify_values.push({label: CsI18n.t("-- Product options --"), value: "--options--", disabled: true});
                    bFirst = false;
                }
                let option = CsI18n.t("Option");
                this.shopify_values.push({label: option + "/" + key, value: "{{Option/"+key+"}}"});
            }
        }
        if( this.metaFieldsProduct.length > 0 ) {
            this.shopify_values.push({label: CsI18n.t("-- Product meta fields --"), value: "--product metafield--", disabled: true});
            for(let item of this.metaFieldsProduct) {
                this.shopify_values.push({label: item, value: "{{"+item+"}}"});
            }
        }

        if( this.metaFieldsVariant.length > 0 ) {
            this.shopify_values.push({label: CsI18n.t("-- Variant meta fields --"), value: "--variant metafield--", disabled: true});
            for(let item of this.metaFieldsVariant) {
                this.shopify_values.push({label: item, value: "{{"+item+"}}"});
            }
        }

        let {attribute} = this.props;
        console.log("initData", attribute);

        let valid_value_options = attribute.has_valid_values ? attribute.valid_values.map(item => {
            return item;
        }) : [];
        this.valid_value_options = valid_value_options;
        this.country_origin_options = [...country_iso_codes];

        let {special_attributes} = attribute;
        let special_valid_value;
        if (special_attributes && special_attributes.has_valid_values) {
            special_valid_value = special_attributes.valid_values.map(item => {
                return item;
            });
        } else {
            special_valid_value = [];
        }

        this.special_valid_value_options = [...special_valid_value];

        //BOC: Fix default value, default value2
        //Old mode: default value is shopify value or custom value
        //New mode: default value is shopify value, default value2 is custom value
        let default_shopify_value = '';
        let default_value = '';
        let is_add_variant_name = false;
        let is_title_attribute = false;
        // let is_use_exist_value = true;

        if (attribute.default_value !== undefined) {
            default_value = attribute.default_value;
        }

        if(default_value) {
            if(default_value.indexOf(SUFFIX_VARIANT_NAME) !== -1) {
                is_add_variant_name = true;
                default_value = default_value.replace(SUFFIX_VARIANT_NAME, '');
            }
        }
        if (default_value == SHOPIFY_VALUE_TITLE) {
            is_title_attribute = true;
        } else {
            is_title_attribute = false;
        }

        // if(this.state.default_value) {
        //     is_use_exist_value = false;
        // }
        for(let item of this.shopify_values) {
            if(item.value == default_value) {
                // is_use_exist_value = true;
                default_shopify_value = default_value;
                default_value = "";
                break;
            }
        }
        if (attribute.default_value2) {
            default_value = attribute.default_value2;
        }
        this.state.default_shopify_value = default_shopify_value;
        this.state.default_value = default_value;
        this.state.is_add_variant_name = is_add_variant_name;
        this.state.is_title_attribute = is_title_attribute;
        //EOC

        if (attribute.special_value !== undefined) {
            this.state.special_value = attribute.special_value;
        } else if( special_attributes && special_attributes.has_valid_values ) {
            this.state.special_value = special_attributes.valid_values[0];
        }

        this.new_option = {option: [Util.clone(this.condition)], value: "", special_value: ""};

        this.state.options = (attribute.options) ? attribute.options : [Util.clone(this.new_option)];

        if (attribute.xsd_element == "Price" || attribute.xsd_element == "MSRP") {
            this.state.is_dont_convert_currency = !!attribute.is_dont_convert_currency;
        }

        // let shopify_options = this.props.shopify_options ? this.props.shopify_options.map(item => {
        //     return item.option_name;
        // }) : [];
        // this.shopify_options = ["", ...shopify_options];
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

    handleDefaultValueChange = (value) => {
        console.log("handleDefaultValueChange", value);
        this.setState({default_value: value});
    }

    handleValidValueAdd = (value) => {
        console.log("handleValidValueAdd", value);
        this.valid_value_options.push(value);
        this.setState({default_value: value});
        let {onAddValue, attribute} = this.props;
        if (onAddValue) {
            onAddValue(attribute.attribute_name, this.valid_value_options);
        }
    }

    handleChangeOption = (field) => (value) => {
        this.setState({[field]: value});
    }
    //
    // handleUseExistValue = (value) => {
    //     this.setState({is_use_exist_value: value});
    // }

    handleAddVariantName = (value) => {
        this.setState({is_add_variant_name: value});
    }

    handleDefaultShopifyValue = (value) => {
        if(value == SHOPIFY_VALUE_TITLE) {
            this.setState({default_shopify_value: value, is_title_attribute: true});
        } else {
            this.setState({default_shopify_value: value, is_title_attribute: false});
        }
    }

    handleSpecialValidValueChange = (value) => {
        this.setState({special_value: value});
    }

    handleShopifyOptionChange = (value) => {
        this.setState({shopify_option: value});
    }

    handleShopifyAdvancedOpenClick = (event) => {
        console.log("handleShopifyAdvancedOpenClick", event);
        this.setState((state) => {
            return {shopify_advanced_open: !state.shopify_advanced_open}
        });
        return false;
    }

    handleShopifyAdvancedOptionChange = (value) => {
        this.setState({shopify_advanced_option: value});
    }

    handleShopifyAdvancedTextChange = (value) => {
        this.setState({shopify_advanced_text: value});
    }

    handleSave = () => {
        if (CsValidationForm.validate("AttributeEditForm") === false)
            return;
        let {onSave, attribute} = this.props;
        let {default_value, special_value, options, is_title_attribute, is_add_variant_name, default_shopify_value, is_dont_convert_currency} = this.state;
        // if(is_use_exist_value) {
        //     default_value = default_shopify_value;
        // }

        if(is_add_variant_name && is_title_attribute) { //this is ony for Title
            default_shopify_value = default_shopify_value + SUFFIX_VARIANT_NAME;
        }

        if (onSave) {
            onSave(attribute.attribute_name, {default_value: default_shopify_value, default_value2: default_value, special_value, options, is_dont_convert_currency});
        }
        console.log("handleSave");
    }

    render() {
        console.log("render", this.props, this.state, this.valid_value_options);
        let {attribute} = this.props;
        let {special_attributes} = attribute;

        /*
                console.log(this.props);
                let xls_name = null;
                let xls_iso_code = this.marketplace.DefaultCountryCode.toLowerCase();
                let xls_universe = this.universe.toLowerCase();
                let xls_url = null;
                let xls_banner = '';

                console.log('XLS File', xls_iso_code, xls_universe, Constants.xls_templates_mapping);

                //TODO: Olivier, display the help banner.
                if (xls_iso_code in Constants.xls_templates_mapping)
                {
                    console.log('ISO code found', xls_iso_code)

                    if (xls_iso_code in Constants.xls_templates_mapping)
                    {
                        console.log('ISO code found', xls_iso_code)

                        if (xls_universe in Constants.xls_templates_mapping[xls_iso_code])
                        {
                            let xls_url = Constants.xls_templates_mapping[xls_iso_code][xls_universe];
                            let xls_link = <a href='"'{xls_url}'"' target="_blank">{xls_url}</a>;

                            console.log('Template found', xls_url, xls_link)

                            xls_banner =
                                <Modal.Section>
                                    <Banner status="info" title=
                                        {
                                            (
                                                <div>
                                                    <CsI18n xls_link={xls_link}>
                                                        {'To find value values for this attribute, please refer to the template file:'}
                                                    </CsI18n>
                                                    &nbsp;{xls_link}
                                                    <br />
                                                    <CsI18n xls_link={xls_link}>
                                                        {'Values are listed in the Valid Values tab.'}
                                                    </CsI18n>
                                                </div>
                                            )
                                        }
                                    />
                                </Modal.Section>
                        }
                }*/
        return (
            <CsEmbeddedModal
                open={this.state.opened}
                large
                onClose={this.handleClose}
                title={Util.getRawHtmlElement(attribute.local_label_name + " ("+attribute.attribute_name+")")}
                primaryAction={{
                    content: <CsI18n>Save</CsI18n>,
                    onAction: this.handleSave,
                }}
                secondaryActions={[
                    {
                        content: <CsI18n>Cancel</CsI18n>,
                        onAction: this.handleClose
                    }
                ]}>
                <Modal.Section>
                    <CsValidationForm name="AttributeEditForm">

                        <Heading><CsI18n>Edit attribute</CsI18n></Heading>
                        {this.renderXlsFile()}
                        {this.renderDefaultValue()}
                        {special_attributes ? this.renderSpecial() : null}
                        {attribute.example ?
                            (<div className="data-example mt-2">
                                <Stack wrap={true}>
                                    <Stack.Item>
                                        <TextStyle><CsI18n>Example</CsI18n>:</TextStyle>
                                    </Stack.Item>
                                    <Stack.Item>
                                        <TextStyle
                                            variation="code">{Util.getRawHtmlElement(attribute.example)}</TextStyle>
                                    </Stack.Item>
                                </Stack>
                            </div>) : ''}
                        <div className="data-accepted-value mt-2">
                            <Stack wrap={true} vertical>
                                <Stack.Item>
                                    {Util.getRawHtmlElement(attribute.definition_and_use)}
                                </Stack.Item>
                                <Stack.Item>
                                    <TextStyle
                                        variation="subdued">{Util.getRawHtmlElement(attribute.accepted_values)}</TextStyle>
                                </Stack.Item>
                            </Stack>
                        </div>
                        {/*{this.renderDataMatching()}*/}
                        {/*{this.renderAdvancedUsages()}*/}
                    </CsValidationForm>
                </Modal.Section>

            </CsEmbeddedModal>
        );
    }

    renderXlsFile() {
        let {attribute} = this.props;

        if (attribute.hasOwnProperty('valid_values') && typeof (attribute.valid_values) != "undefined" && attribute.valid_values.length) {
            console.log('renderXlsFile, attributes has existing values, no XLS needed');
            return ('');
        }

        let xls_name = '';
        let xls_iso_code = this.marketplace.DefaultCountryCode.toLowerCase();
        let xls_universe = this.universe.toLowerCase();
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
                                <CsI18n>{'Please enter valid values'}</CsI18n>
                            }

                        >

                            <p>
                                <CsI18n xls_link={xls_link}>
                                    {'To find value values for this attribute, please refer to the template file:'}
                                </CsI18n>
                                &nbsp;{xls_link}
                                <br/>
                                <CsI18n>
                                    {'Values are listed in the Valid Values tab. Please referer to Help > Tutorials for more details.'}
                                </CsI18n>
                            </p>
                        </Banner>
                    </Modal.Section>
            }
        }
        return (xls_banner);
    }

    renderDefaultValue() {
        let {attribute} = this.props;
        let required = attribute.required == 1;
        let {default_shopify_value, default_value, is_add_variant_name, is_title_attribute} = this.state;
        console.log("renderDefaultValue", this.state, attribute);

        return (
            <React.Fragment>
            <div className={"data-edit-section mt-2"}>
                <div className={"data-label"}>
                    <CsI18n>Existing value</CsI18n>
                </div>
                <div className={"data-field"}>
                    <Stack vertical={true}>
                        <Stack.Item>
                            <Select

                                label="Exist Value" labelHidden={true}
                                options={this.shopify_values}
                                onChange={this.handleDefaultShopifyValue}
                                value={default_shopify_value}
                            />
                        </Stack.Item>
                        {is_title_attribute? <Stack.Item>
                            <Stack>
                                <Stack.Item><Checkbox label={CsI18n.t("Add variant name to title")} checked={is_add_variant_name} onChange={this.handleAddVariantName}/></Stack.Item>
                            </Stack>
                        </Stack.Item>:null}
                    </Stack>
                </div>
            </div>
            <div className={"data-edit-section mt-2"}>
                <div className={"data-label"}>
                    <Tooltip
                        content="If the field doesn't have any matching metafield, this value will be used by default">
                        <Link>{CsI18n.t("Default value")}</Link>
                    </Tooltip>
                </div>
                <div className={"data-field"}>
                    <Stack vertical={true} spacing={"tight"}>
                        <Stack.Item>
                            <CsValidation>
                                {this.is_country_origin? <CsAutoComplete
                                    options={this.country_origin_options}
                                    onChange={this.handleDefaultValueChange}
                                    selected={default_value}
                                    allowedInput={true}
                                />:<CsAutoComplete
                                    isOnlyValue={true}
                                    options={this.valid_value_options}
                                    onChange={this.handleDefaultValueChange}
                                    onAdd={this.handleValidValueAdd}
                                    selected={default_value}
                                    allowedInput={attribute.has_custom_value? true:false}
                                    allowedAddNew={true}
                                />}
                                {/*{(required && !is_use_exist_value) ? (<CsValidation.Item rule="required"*/}
                                {/*                                                         title={CsI18n.t("Default value is required")}/>) : null}*/}
                            </CsValidation>
                        </Stack.Item>
                        {this.renderPriceOption()}
                    </Stack>
                </div>
            </div>
            </React.Fragment>);
    }

    renderPriceOption() {
        let {attribute} = this.props;
        if (attribute.xsd_element != 'Price' && attribute.xsd_element != 'MSRP') {
            return;
        }
        let {is_dont_convert_currency} = this.state;
        return (<Stack.Item><Checkbox checked={is_dont_convert_currency}
                              label={CsI18n.t('Don\'t convert the currency')}
                              onChange={this.handleChangeOption('is_dont_convert_currency')} /></Stack.Item>);
    }

    renderSpecial() {
        let {attribute} = this.props;
        let {special_attributes} = attribute;
        let {has_valid_values} = special_attributes;
        let required = special_attributes.required == 1;

        return (<React.Fragment>
            {has_valid_values ?
                (<div className={"data-edit-section mt-2"}>
                    <div className={"data-label"}>
                        <span>{CsI18n.t("Attribute")}</span>
                        <Caption>Attribute on Amazon side</Caption>
                    </div>
                    <div className={"data-field"}>
                        <CsValidation>
                            <Select label="Attribute" options={this.special_valid_value_options}
                                    onChange={this.handleSpecialValidValueChange} value={this.state.special_value}
                                    name="special_value"
                                    labelHidden={true}/>
                            {required ? (
                                <CsValidation.Item rule="required" title={CsI18n.t("Value is required")}/>) : ''}
                        </CsValidation>
                    </div>
                </div>)
                :
                (<div className={"data-edit-section mt-2"}>
                    <div className={"data-label"}><span>{CsI18n.t("Attribute")}</span></div>
                    <div className={"data-field"}>
                        <CsValidation>
                            <TextField label={"Attribute"} name="special_value" labelHidden={true}
                                       value={this.state.special_value}
                                       onChange={this.handleSpecialValidValueChange}/>
                            {required ? (
                                <CsValidation.Item rule="required" title={CsI18n.t("Value is required")}/>) : ''}
                        </CsValidation>
                    </div>
                </div>)
            }
        </React.Fragment>);
    }
}
