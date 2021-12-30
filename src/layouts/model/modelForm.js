import React from 'react';
import Constants from "../../helpers/rules/constants";
import {CsValidationForm, CsValidation} from "../../components/csValidationForm";

import {
    Button, Card, Heading, FormLayout, ResourceList, Select,
    Stack, TextField, ButtonGroup, TextStyle, Tooltip, Icon, Badge, Banner, Link, Spinner, Toast, Avatar,
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
    DuplicateMinor,
    AlertMinor, CircleChevronRightMinor,
    CircleInformationMajorMonotone
} from '@shopify/polaris-icons';
import {scroller, Element} from 'react-scroll';

import CsI18n from "../../components/csI18n";
import Util from "../../helpers/Util";
import States from "../../helpers/rules/states";
import CsErrorMessage from "../../components/csErrorMessage";
import ShopifyContext from "../../context";
import ApplicationApiCall from "../../functions/application-api-call";
import ModelProductTypeModal from "./modelProductTypeModal"
import ModelAttributesSelectModal from "./modelAttributesSelectModal"
import CsConfirmModal from "../../components/csConfirmModal";
import {ModelContext} from "./model-context";
import ModelAttributeEditModal from "./modelAttributeEditModal";
import CsAutoComplete from '../../components/csAutocomplete/';

import Help from "../../help";
import CsInlineHelp from "../../components/csInlineHelp/csInlineHelp";
// import CsEmbeddedModal from "../../components/csEmbeddedModal";
import ModelDuplicateModal from "./modelDuplicateModal";
import CsToggleButton from "../../components/csToggleButton";
import {ModelCategorySelect} from "./modelCategorySelect";
// import {pageLabels} from "../../constant/main";
import ModelTemplateSaveModal from "./modelTemplateSaveModal";
import shopifyContext from "../../context";

const DEFAULT_PAGE_COUNT = 20;
const OPTION_DEFAULT_VALUE = "default_value";

const PRODUCT_CODE_EXEMPTION = [
    "None",
    "Model Number",
    "Model Name",
    "Manufacturer Part Number",
    "Catalog Number",
    "Style Number",
    "EAN/UPC",
    "Generic",
];

const DESCRIPTION_ELEMENTS = ["Title", "Description", "BulletPoint", "Price", "MSRP",
    "PackageWidth", "PackageHeight", "PackageWeight", "PackageLength",
    "ItemWidth", "ItemHeight", "ItemWeight", "ItemLength",
    "PackageWeight", "ShippingWeight", "MerchantCatalogNumber", "Manufacturer",
    "MfrPartNumber", "SearchTerms", "ItemType", "TargetAudience", "IsGiftWrapAvailable", "MerchantShippingGroupName"];

const PINNED_ATTRIBUTES = ['Title', 'ProductName', 'Description', 'BulletPoint'];

const OPTION_Values_For_Brand = [
    {label: "Don't send", value: ''},
    {label: 'Vendor', value: '{{Vendor}}'},
];

const STATE_TEMPLATE_SAVING = 'tpl_saving';
const STATE_TEMPLATE_LOADING = 'tpl_loading';
const STATE_TEMPLATE_DELETING = 'tpl_deleting';

export default class ModelForm extends States {

    static contextType = ModelContext;

    state = {
        status: States.STATUS_NORMAL,
        attributeModal: false,
        opendeletemodal: false,
        openDuplicateModal: false,
        openedProductTypeModal: false,
        openedAttributeModal: false,
        wait_data: false,
        form_attribute_error: false,
        variationAdvancedMode: false,
        brand_selection: '',
        brand_input: '',
        manufacturer_selection: '',
        manufacturer_input: '',
        template_status: null,
        template_selection: '',
        template_options: [],
        modal_template_delete_open: false,
        modal_template_save_open: false,
        modal_template_load_open: false,
        template_is_list_loading: false,
        //template property
        template_name: '',
        template_is_admin_only: true,
        //Toast
        show_toast: null,
        toast_is_error: false,
        toast_message: '',
    }

    constructor(props) {
        super(props);
        console.log("ModelForm constructor", this.props);

        this.state.mode = this.props.mode;
        this.state.items = this.props.items;
        this.state.item = this.props.items[this.props.current] ? Util.clone(this.props.items[this.props.current]) : null;
        this.options_product_code_exemption = PRODUCT_CODE_EXEMPTION.map((item) => {
            return CsI18n.t(item);
        });

        this.marketplace = this.props.marketplace;
        this.shopify = ShopifyContext.getShared();

        this.help_tutorials = <a className="Polaris-Link" href={Help.getHelpUrl('tutorials')}
                                 target="_top|_blank">{CsI18n.t('Tutorials')}</a>;

        this.variationTheme = null;
        this.unMounted = false;
        // console.log("constructor", JSON.stringify(this.state.item));

        this.initConfig();
    }

    /**************************
     * @function - init function of config value
     */
    initConfig() {
        if (this.state.mode !== States.MODE_ADD) {
            this.state.item.attributes.sort(this.compareLabel);
            return;
        }
        let item = {};
        item.group_id = this.props.group_id > -1 ? this.props.group_id : 0;
        item.universe = "";
        item.universe_display_name = "";
        item.product_type = "";
        item.xsd_product_type = "";
        item.product_type_display_name = "";
        item.product_code_exemption = "None";
        item.brand = '';
        item.manufacturer = '';
        item.category = false;
        item.category2 = false;
        item.attributes = [];
        item.variation = {theme: "", fields: []};
        this.state.item = item;
    }

    initOverrideOptions()
    {
        let {brand, manufacturer} = this.state.item;
        let {metaFieldsProduct, metaFieldsVariant} = this.context;
        this.metaFieldsProduct = metaFieldsProduct;
        this.metaFieldsVariant = metaFieldsVariant;

        this.brand_options = OPTION_Values_For_Brand.map((item) => {
            return {label: CsI18n.t(item.label), value: item.value}
        });

        this.brand_options.push({
            label: CsI18n.t("-- Input a fixed value --"),
            value: "--input-value--",
            disabled: true
        });
        this.brand_options.push({label: CsI18n.t("[Fixed value]"), value: OPTION_DEFAULT_VALUE});

        if (this.metaFieldsProduct.length > 0) {
            this.brand_options.push({
                label: CsI18n.t("-- Product meta fields --"),
                value: "--product metafield--",
                disabled: true
            });
            for (let item of this.metaFieldsProduct) {
                this.brand_options.push({label: item, value: "{{" + item + "}}"});
            }
        }

        if (this.metaFieldsVariant.length > 0) {
            this.brand_options.push({
                label: CsI18n.t("-- Variant meta fields --"),
                value: "--variant metafield--",
                disabled: true
            });
            for(let item of this.metaFieldsVariant) {
                this.brand_options.push({label: item, value: "{{"+item+"}}"});
            }
        }

        let brand_selection = OPTION_DEFAULT_VALUE;
        let brand_input = brand;
        let manufacturer_selection = OPTION_DEFAULT_VALUE;
        let manufacturer_input = manufacturer;
        for(let item of this.brand_options) {
            if (item.value == manufacturer) {
                manufacturer_selection = item.value;
                manufacturer_input = '';
                break;
            }
        }
        for(let item of this.brand_options) {
            if (item.value == brand) {
                brand_selection = item.value;
                brand_input = '';
                break;
            }
        }
        return {brand_selection, brand_input, manufacturer_selection, manufacturer_input};
    }

    componentWillMount() {
        require('./modelModal.css');
        let {item, status} = this.state;
        status = States.STATUS_CHANGED;

        if (item.group_id && item.product_type) {
            this.fetchDataDefinitions(item.group_id, item.universe, item.product_type);
        }
        let result = this.initOverrideOptions();
        this.setState({...result});
    }

    componentWillReceiveProps(nextProps, nextContext) {
    }

    componentWillUnmount() {
        this.unMounted = true;
    }

    handlerClose = () => {
        const {onClose} = this.props;
        if (onClose === undefined)
            return;

        onClose();
    }

    duplicateConfirmation = () => {
        this.handleToggleDuplicateModal();
    }

    handleToggleDuplicateModal = () => {
        this.setState(({openDuplicateModal}) => ({
            openDuplicateModal: !openDuplicateModal
        }));
    };

    handlerDuplicate = (groupId) => {
        console.log("handlerDuplicate", groupId);
        const {onDuplicate} = this.props;
        if (onDuplicate === undefined)
            return;
        onDuplicate(this.state.item.group_id, groupId, this.cbDuplicateDone, this.cbDuplicateError);
    }

    cbDuplicateDone = () => {
        this.setState({
            openDuplicateModal: false
        });
    }

    cbDuplicateError = () => {
        this.setState({
            openDuplicateModal: false
        });
    }

    initPinnedAttributes() {
        let {item} = this.state;
        let attributes = item.attributes;

        //add pinned attributes
        for(let index in this.dataDefinition.definitions) {
            let {valid_values, ...attribute} = this.dataDefinition.definitions[index]; //remove valid values
            let xsd_element = attribute.xsd_element_origin? attribute.xsd_element_origin : attribute.xsd_element;
            let pos = PINNED_ATTRIBUTES.indexOf(xsd_element);
            if (pos !== -1) {
                this.dataDefinition.definitions[index].pinned = true;
                this.dataDefinition.definitions[index].pinned_pos = pos;
            }
        }
        attributes.sort(this.compareLabel);
        this.dataDefinition.definitions.sort(this.compareLabel);
        // console.log("initPinnedAttributes", JSON.stringify(attributes), this.dataDefinition);
    }

    checkAttributeError()
    {
        console.log("checkAttributeError", this.state);
        let {attributes, variation} = this.state.item;
        if (variation.fields && variation.fields.length > 0) {
            let count_shopify_option = 0;
            for( let variation_field of variation.fields ) {
                if (variation_field.option != OPTION_DEFAULT_VALUE) {
                    count_shopify_option++;
                }
            }
            if (count_shopify_option == 0) {
                return CsI18n.t("At least, one Amazon attribute should be mapped to a Shopify field to be allowed to use a Default Value");
            }
        }

        if (attributes.length === 0) {
            let form_attribute_error = CsI18n.t("Please add an attribute.");
            return form_attribute_error;
        }

        let {group_id, universe, product_type} = this.state.item;
        let key_id = universe + "_" + product_type;
        let marketplace_id = this.getGroupMarketplaceId(group_id);
        let cache_group = `g${group_id}`;
        // console.log("context", JSON.stringify(this.context.dataDefinition));
        let dataDefinition = this.context.dataDefinition[cache_group][key_id];
        if (dataDefinition) {
            for (let index in dataDefinition.definitions) {
                let {local_label_name, attribute_name, required} = dataDefinition.definitions[index];
                if( required != 1 ) { //if attribute isn't required, continue;
                    continue;
                }
                let bFound = false;
                for(let i in attributes) {
                    if( attribute_name == attributes[i].attribute_name ) {
                        if(attributes[i].default_value === undefined && attributes[i].default_value2 === undefined) {
                            return CsI18n.t("Attribute({{attribute}}) is not configured!", {attribute: local_label_name});
                        }
                        bFound = true;
                        break;
                    }
                }
                if( !bFound ) {
                    return CsI18n.t("Attribute({{attribute}}) is required!", {attribute: local_label_name});
                }
            }
        }

        let count_product_data_attributes = 0;
        let common_fields = '';
        let not_configured = false;
        let invalid_values = false;

        for(let attribute of attributes) {
            let {xsd_element, xsd_element_origin, local_label_name, default_value, default_value2} = attribute;
            let element = xsd_element_origin? xsd_element_origin:xsd_element;
            if (DESCRIPTION_ELEMENTS.find(item => element == item)) {
                common_fields += common_fields? `, ${local_label_name}`:local_label_name;
            } else {
                count_product_data_attributes++;
            }

            if (!default_value && !default_value2 && !not_configured) {
                not_configured = CsI18n.t("Attribute({{attribute}}) is NOT configured!", {attribute: local_label_name});
            }
            if (xsd_element == "Title" && default_value == "{{Title}}") {
                invalid_values = CsI18n.t("This mapping is useless {{item}} is already mapped to {{item}}", {item: "Title"});
            }
            if (xsd_element == "Description" && default_value == "{{Description}}") {
                invalid_values = CsI18n.t("This mapping is useless {{item}} is already mapped to {{item}}", {item: "Description"});
            }

        }
        if (count_product_data_attributes == 0) {
            return CsI18n.t("You have selected {{common_fields}}, these are common fields, not attributes, please insert at least 1 attribute in your model.", {common_fields});
        }

        if (not_configured) {
            return not_configured;
        }

        if (invalid_values) {
            return invalid_values;
        }

        return false;
    }

    handlerSave = () => {
        if (CsValidationForm.validate("modelForm") === false)
            return;

        let form_attribute_error = this.checkAttributeError();
        if( form_attribute_error ) {
            setTimeout(() => {this.setState({form_attribute_error: false})}, 10000);
            this.setState({form_attribute_error}, () => {
                scroller.scrollTo('model_form_error', {duration: 300, delay: 100, smooth: true, offset: -20});
            });
            return;
        }
        let {items} = this.state;
        items[this.props.current] = this.state.item;

        const {onSave} = this.props;
        if (onSave === undefined)
            return;
        onSave(items, this.cbSaveDone, this.cbSaveError);
        //reset extraFields(Overrides fields)
        this.context.extraData = [];
        this.context.mapping = [];
        this.setState({status: States.STATUS_SAVING});
    }

    /**************************
     * @function - handler when you open the Product Type Modal
     */
    handleProductTypeModalOpen = () => {
        this.setState({openedProductTypeModal: true});
    }

    /**************************
     * @function - handler when you close the Product Type Modal
     */
    handleProductTypeModalClose = () => {
        this.setState({openedProductTypeModal: false});
    }

    handleProductTypeModalChange = (group_id, universe, product_type, universe_data) => {
        console.log("handleProductTypeModalChange", group_id, universe, product_type, universe_data);
        let {item, status} = this.state;
        status = States.STATUS_CHANGED;

        if (group_id != item.group_id || universe != item.universe || product_type != item.product_type) {
            item.variation = { theme: "", fields: []};
            item.attributes = []; //remove all of old attributes.

            let types = universe_data.product_types;
            for (let type of universe_data.product_types) {
                if (type.name == product_type) {
                    item.product_type = type.name;
                    item.xsd_product_type = type.xsd_product_type;
                    item.product_type_display_name = type.display_name;
                }
            }
            this.fetchDataDefinitions(group_id, universe, product_type);
        }
        item.group_id = group_id;
        // item.universe_id = parseInt(universe_id);
        item.universe = universe_data.universe;
        item.universe_display_name = universe_data.display_name;
        // item.product_type_id = parseInt(product_type_id);

        console.log("handleProductTypeModalChange: item", item);

        this.setState({item, openedProductTypeModal: false, status: status});
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

    fetchDataDefinitions(group_id, universe, product_type) {
        group_id = parseInt(group_id);
        // universe_id = parseInt(universe_id);
        // product_type_id = parseInt(product_type_id);
        let marketplace_id = this.getGroupMarketplaceId(group_id);
        let cache_group = `g${group_id}`;
        let {configuration, dataDefinition} = this.context;
        if (dataDefinition[cache_group] == undefined) {
            dataDefinition[cache_group] = [];
        }
        let key_id = universe + "_" + product_type;
        if (dataDefinition[cache_group][key_id] != undefined) {
            this.dataDefinition = this.context.dataDefinition[cache_group][key_id];
            this.getTemplateList();
            this.initVariationData();
            return;
        }
        let params = {
            configuration: configuration,
            group_id: group_id,
            universe: universe,
            product_type: product_type,
        };
        ApplicationApiCall.get('/application/models/definitions',
            params, this.cbFetchDataDefinitionsSuccess, this.cbFetchDataDefinitionsError);

        this.setState({wait_data: true});
    }

    cbFetchDataDefinitionsSuccess = (json) => {
        console.log("cbFetchDataDefinitionsSuccess", json);
        if (this.unMounted)
            return;

        if (!json) {
            console.error("json is null");
            return;
        }
        let {item, status} = this.state;
        let {group_id, universe, product_type} = item;
        let key_id = universe + "_" + product_type;
        let marketplace_id = this.getGroupMarketplaceId(group_id);
        let {definitions, metafields_product, metafields_variant, ...other} = json;
        let definitions_new = [];
        for(let key in definitions) {
            definitions_new[definitions[key].xsd_element] = definitions[key];
        }
        let cache_group = `g${group_id}`;
        this.context.dataDefinition[cache_group][key_id] = {...other, definitions: definitions_new};
        this.context.metaFieldsProduct = metafields_product;
        this.context.metaFieldsVariant = metafields_variant;
        this.dataDefinition = this.context.dataDefinition[cache_group][key_id];
        this.initVariationData();
        console.log("cbFetchDataDefinitionsSuccess", marketplace_id, key_id, this.context.dataDefinition);

        this.getTemplateList();
        this.initPinnedAttributes();
        this.correctAttributes();
        let result = this.initOverrideOptions();
        this.setState({wait_data: false, ...result});
    }

    correctAttributes() {
        let {item} = this.state;
        console.log("correctAttributes", item, this.dataDefinition.definitions);
        if(!item.attributes) {
            return;
        }
        let bFixed = false;
        let fixed_attributes = [];
        for( let index in item.attributes ) {
            let attribute = item.attributes[index];
            if(this.dataDefinition.definitions[attribute.xsd_element]) {
                fixed_attributes.push(attribute);
                continue;
            }
            if(this.dataDefinition.definitions[attribute.xsd_element + '1']) { //for occurs
                let definition = this.dataDefinition.definitions[attribute.xsd_element + '1'];
                item.attributes[index].attribute_name = definition.attribute_name;
                item.attributes[index].xsd_element = definition.xsd_element;
                item.attributes[index].xsd_element_origin = definition.xsd_element_origin;
                item.attributes[index].local_label_name = definition.local_label_name;
                bFixed = true;
                fixed_attributes.push(item);
            } else {
                bFixed = true;
            }
        }
        if(bFixed) {
            item.attributes = fixed_attributes;
            this.setState({item});
        }
    }

    initVariationData() {
        this.shopify_options = null;
        this.shopify_options = [{label: "", value:""}];
        if(this.dataDefinition.shopify_options ) {
            for(let key in this.dataDefinition.shopify_options ) {
                this.shopify_options.push({label: key, value: key});
            }
        }
        this.shopify_options.push({label: CsI18n.t("[Default Value]"), value: OPTION_DEFAULT_VALUE}); //

        let variationData = this.dataDefinition.variation;
        if (variationData && this.shopify_options) {
            this.variationTheme = [{label: "", value: ""}];
            for (let key in variationData.theme) {
                this.variationTheme.push({
                    label: variationData.theme[key].display_name,
                    value: variationData.theme[key].name
                });
            }
        } else {
            this.variationTheme = null;
        }

        this.variationFields = [];
        let {item} = this.state;
        let variationAdvancedMode = false;
        if( item.variation ) {
            let bError = false;
            for(let index in item.variation.fields) {
                let variation_field = item.variation.fields[index];
                let {name: field_name, option2} = variation_field;
                // console.log("index", field_name);
                if( this.shopify_options && variationData && variationData.fields && variationData.fields[field_name] ) {
                    this.variationFields[index] = {
                        // valid_values: variationData.fields[field_name].valid_values.length? ["", ...variationData.fields[field_name].valid_values.map(item => item.attribute_value)]:false,
                        valid_values: variationData.fields[field_name].valid_values.length? variationData.fields[field_name].valid_values:false,
                        attributes: variationData.fields[field_name].attributes && variationData.fields[field_name].attributes.length? ["", ...variationData.fields[field_name].attributes]:false,
                        has_custom_value: variationData.fields[field_name].has_custom_value,
                    };
                } else {
                    bError = true;
                    break;
                }
                if(option2) {
                    variationAdvancedMode = true;
                }
            }

            if( bError ) {
                item.variation = { theme: "", fields: []};
            }
        }
        console.log("initVariationData", item, this.shopify_options, this.variationTheme, this.variationFields, variationAdvancedMode);
        this.setState({variationAdvancedMode});
    }

    /**************************
     * @callback - error function of getting Universe and Product Type
     * @param err
     */
    cbFetchDataDefinitionsError = (err) => {
        console.log("cbFetchDataDefinitionsError", err);
        if (err && this.unMounted === false) {
            console.log("cbFetchDataDefinitionsError: show error");
            // setTimeout(() => {
            //     this.setState({error: null})
            // }, 5000);
            this.setState({error: err, wait_data: false});
        }
    }

    handleAttributeRemove = attribute_name => () => {
        console.log("handleAttributeRemove", attribute_name);
        let {item, status} = this.state;
        status = States.STATUS_CHANGED;
        let new_attributes = item.attributes.filter(attribute => {
            return attribute.attribute_name != attribute_name;
        });
        item.attributes = new_attributes;
        console.log("handleAttributeRemove", item);
        this.setState({item: item, status: status});
    }

    handleAttributeEdit = attribute_name => () => {
        this.attribute = null;
        let {item} = this.state;
        console.log("handleAttributeEdit", item);
        for( let index in item.attributes ) {
            if( item.attributes[index].attribute_name == attribute_name ) {
                let attribute = Util.clone(item.attributes[index]);
                let attribute_new = this.dataDefinition.definitions[attribute.xsd_element];
                attribute.has_custom_value = attribute_new.has_custom_value;
                attribute.valid_values = attribute_new.valid_values;
                attribute.has_valid_values = attribute_new.has_valid_values;
                attribute.required = attribute_new.required;
                attribute.special_attributes = attribute_new.special_attributes;
                this.attribute = attribute;
                break;
            }
        }
        if( !this.attribute ) {
            console.error("handleAttributeEdit: attribute is invalid", attribute_name);
        }

        this.setState({openedAttributeEditModal: true});
    }

    handleAttributeEditModalSave = (attribute_name, attribute_value) => {
        console.log("handleAttributeEditModalSave", attribute_name, attribute_value);
        let {item, status} = this.state;
        status = States.STATUS_CHANGED;

        for(let index in item.attributes) {
            if( item.attributes[index].attribute_name == attribute_name ) {
                let new_attribute_value = {...item.attributes[index], ...attribute_value};
                new_attribute_value.default_value = attribute_value.default_value !== undefined? attribute_value.default_value:"";
                new_attribute_value.default_value2 = attribute_value.default_value2 !== undefined? attribute_value.default_value2:"";
                if( attribute_value.special_value !== undefined ) {
                    new_attribute_value.special_value = attribute_value.special_value;
                }
                new_attribute_value.options = attribute_value.options;
                item.attributes[index] = new_attribute_value;
                break;
            }
        }
        console.log("handleAttributeEditModalSave -- done: ", attribute_name, attribute_value, item);

        this.setState({item, openedAttributeEditModal: false, status: status});
    }

    getMatchingGroup(groupId) {
        let {matchingGroup} = this.context.data;
        for(let i in matchingGroup) {
            if( matchingGroup[i].id == groupId)
                return matchingGroup[i];
        }
        return null;
    }

    handleAttributeEditModalAddValue = (attribute_name, values) => {
        console.log("handleAttributeEditModalAddValue", attribute_name, values);
        let {item} = this.state;
        let attribute = null;
        for(let index in item.attributes) {
            if( item.attributes[index].attribute_name == attribute_name ) {
                attribute = item.attributes[index];
                break;
            }
        }
        if( !attribute ) {
            return;
        }

        this.dataDefinition.definitions[attribute.xsd_element].valid_values = values;
        let {group_id, universe, product_type} = item;
        let key_id = universe + "_" + product_type;
        let marketplace_id = this.getGroupMarketplaceId(group_id);
        let cache_group = `g${group_id}`;
        this.context.dataDefinition[cache_group][key_id] = this.dataDefinition;

        let matchingGroup = this.getMatchingGroup(item.group_id);
        if( !matchingGroup) {
            return;
        }
        let extrafield = {
            universe: item.universe,
            name: attribute.xsd_element,
            values: values,
        };

        let {configuration} = this.context;
        let params = {configuration}
        ApplicationApiCall.post('/application/models/saveextra',
            params,
            extrafield,
            (result) => {}
            );

    }

    handleAttributeEditModalClose = () => {
        this.setState({openedAttributeEditModal: false});
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

    handleAttributeAdd = (attributes) => {
        console.log("handleAttributeAdd", attributes);
        let {item, status} = this.state;
        status = States.STATUS_CHANGED;

        for(let index in this.dataDefinition.definitions) {
            let {valid_values, ...attribute} = this.dataDefinition.definitions[index]; //remove valid values
            if( attributes.indexOf(attribute.attribute_name) !== -1 ) {
                console.log("handleAttributeAdd", valid_values, attribute);
                if(valid_values && Array.isArray(valid_values) && valid_values.length == 1) {
                    attribute.default_value2 = valid_values[0];
                }
                item.attributes.push(attribute);
            }
        }
        item.attributes.sort(this.compareLabel);

        console.log("handleAttributeAdd: item", item);
        this.setState({item, openedAttributeModal: false, status: status});
    }

    setVariationFields(item, value, fields = []) {
        item.variation.theme = value;
        item.variation.fields = [];
        let variationData = this.dataDefinition.variation;

        this.variationFields = [];
        console.log("setVariationFields: ", value, variationData);
        if( value ) {
            for(let index in variationData.theme[value]['fields']) {
                let field_name = variationData.theme[value]['fields'][index];
                let default_field = {name: field_name, option: "", default_value: "", attribute: ""};
                for( let f of fields){
                    if (f.name == field_name) {
                        default_field = {...default_field, ...f};
                        break;
                    }
                }
                item.variation.fields.push(default_field);
                // console.log("index", field_name);
                this.variationFields[index] = {
                    // valid_values: variationData.fields[field_name].valid_values.length? ["", ...variationData.fields[field_name].valid_values.map(item => item.attribute_value)]:false,
                    valid_values: variationData.fields[field_name].valid_values.length? variationData.fields[field_name].valid_values:false,
                    attributes: variationData.fields[field_name].attributes && variationData.fields[field_name].attributes.length? ["", ...variationData.fields[field_name].attributes]:false,
                    has_custom_value: variationData.fields[field_name].has_custom_value,
                };
            }
        }
        return item;
    }

    handleChangeVariationTheme = (value) => {
        let status = States.STATUS_CHANGED;
        let item = this.setVariationFields(this.state.item, value);
        this.setState({item, status: status});
    }

    handleAddSecondVariationField = (index) => () => {
        let {item, status} = this.state;
        status = States.STATUS_CHANGED;

        item.variation.fields[index].option2 = "";
        item.variation.fields[index].default_value2 = "";

        this.setState({item, status: status});
    }

    handleDeleteSecondVariationField = (index) => () => {
        let {item, status} = this.state;
        status = States.STATUS_CHANGED;

        delete item.variation.fields[index].option2;
        delete item.variation.fields[index].default_value2;

        this.setState({item, status: status});
    }

    handleChangeVariationField = (index, second = false) => (value) => {
        let {item, status} = this.state;
        status = States.STATUS_CHANGED;

        if(second) {
            item.variation.fields[index].option2 = value;
        } else {
            item.variation.fields[index].option = value;
        }

        this.setState({item, status: status});
    }

    handlerVariationAdvance = (value) => {
        let {item, status} = this.state;

        if(!value && item.variation && item.fields) {
            item.variation.fields[0].option2 = null;
            item.variation.fields[1].option2 = null;
        }

        this.setState({item, variationAdvancedMode: value});
    }

    handleChangeVariationDefaultValue = (index, second = false) => (value) => {
        let {item, status} = this.state;
        status = States.STATUS_CHANGED;
        if(second) {
            item.variation.fields[index].default_value2 = value;
        } else {
            item.variation.fields[index].default_value = value;
        }
        this.setState({item, status: status});
    }

    handleChangeVariationAttribute = (index) => (value) => {
        let {item, status} = this.state;
        status = States.STATUS_CHANGED;

        item.variation.fields[index].attribute = value;

        this.setState({item, status: status});
    }

    /**************************
     * @function - handler when you open the Attribute Modal
     */
    handleAttributeModalOpen = () => {
        this.setState({openedAttributeModal: true});
    }

    /**************************
     * @function - handler when you close the Attribute Modal
     */
    handleAttributeModalClose = () => {
        this.setState({openedAttributeModal: false});
    }

    handleChangeProductOverride = (field) => (value) => {
        let {item, status} = this.state;
        status = States.STATUS_CHANGED;
        item[field] = value;
        this.setState({item, status: status});
    }

    handleChangeOverrideVendorSelection = (field, selection) => (value) => {
        let {item, status} = this.state;
        let field_input = `${field}_input`;
        status = States.STATUS_CHANGED;
        if (selection == OPTION_DEFAULT_VALUE) {
            item[field] = '';
        } else {
            item[field] = value;
        }
        this.setState({item, status: status, [selection]: value, [field_input]: ''});
    }

    handleChangeOverrideVendorInput = (field, input) => (value) => {
        let {item, status} = this.state;
        let field_input = `${field}_input`;
        status = States.STATUS_CHANGED;
        item[field] = value;
        this.setState({item, status: status, [field_input]: value});
    }

    handleSelectCategory = (category_key) => (category) => {
        console.log("handleSelectCategory", category_key, category);
        let {item, status} = this.state;
        status = States.STATUS_CHANGED;
        item[category_key] = category;
        this.setState({item, status: status});
    }

    saveTemplate = (name, is_admin_only) => {
        console.log('saveTemplate', name, is_admin_only);
        let {group_id} = this.state.item;
        let marketplace_id = this.getGroupMarketplaceId(group_id);
        let data = {
            name: name,
            is_admin_only,
            marketplace_id,
            model: this.state.item,
        };
        let {configuration} = this.context;
        ApplicationApiCall.post('/application/save_template',
            {configuration}, data,
            (result) => {
                this.cbTemplateList(result);
                this.setState({template_status: null, show_toast: true, toast_is_error: false, toast_message: CsI18n.t('Template saved successfully')});
            },
            (err) => {
                this.setState({template_status: null, show_toast: true, toast_is_error: true, toast_message: CsI18n.t('Failed to save the template')});
            });
        this.setState({modal_template_save_open: false, template_status: STATE_TEMPLATE_SAVING, template_name: name, template_is_admin_only: is_admin_only});
    }

    getTemplateList() {
        let {configuration} = this.context;
        let {universe, xsd_product_type} = this.state.item;
        let {group_id} = this.state.item;
        let marketplace_id = this.getGroupMarketplaceId(group_id);

        ApplicationApiCall.get('/application/get_template_names',
            {configuration, universe, xsd_product_type, marketplace_id}, this.cbTemplateList, (err) => {
                this.setState({show_toast: true, toast_is_error: true, toast_message: CsI18n.t('Failed to fetch the template list'), template_is_list_loading: false})
            });
        this.setState({template_is_list_loading: true});
    }

    compareTemplate = (a, b) => {
        let la = a.name;
        let lb = b.name;
        if( la === lb ) {
            return 0;
        } else if ( la > lb ) {
            return 1;
        } else {
            return -1;
        }
    }

    cbTemplateList = (result) => {
        console.log("cbTemplateList", result);
        if (this.unMounted) {
            return;
        }
        let template_options = [{label: CsI18n.t("Select a template"), value: ''}];
        let {normal, sample} = result;

        if (normal && Array.isArray(normal)) {
            normal.sort(this.compareTemplate)
            normal.forEach((row) => {
                template_options.push({label: row.name, value: `n_${row.key}`});
            })
        }
        if (template_options.length > 1) {
            template_options.push({label: CsI18n.t("-- Sample --"), value: "--sample-value--", disabled: true});
        }
        if (sample && Array.isArray(sample)) {
            sample.sort(this.compareTemplate)
            sample.forEach((row) => {
                template_options.push({label: row.name + (row.is_admin_only? '(Admin only)':''), value: `s_${row.key}`});
            })
        }
        this.setState({template_is_list_loading: false, template_options});
    }

    loadTemplate = () => {
        let {configuration} = this.context;
        let {universe, xsd_product_type} = this.state.item;
        let {group_id} = this.state.item;
        let marketplace_id = this.getGroupMarketplaceId(group_id);
        ApplicationApiCall.get('/application/get_template',
            {configuration, universe, xsd_product_type, marketplace_id, template_key: this.state.template_selection}, this.cbTemplateLoad, (err) => {
                this.setState({template_status: null, show_toast: true, toast_is_error: true, toast_message: CsI18n.t('Failed to load the template')});
            });
        this.setState({modal_template_load_open: false, template_status: STATE_TEMPLATE_LOADING});
    }

    cbTemplateLoad = (result) => {
        console.log('cbTemplateLoad', result, this.dataDefinition.definitions);
        if (this.unMounted) {
            return;
        }
        let {item, status} = this.state;
        status = States.STATUS_CHANGED;
        let {name: template_name, is_admin_only: template_is_admin_only, model: template, is_sample} = result;
        let {attributes: template_attributes, variation: template_variation, product_code_exemption, brand, manufacturer, category, category2} = template;

        item.attributes = []; //remove all of old attributes.
        template_attributes.forEach((template_attribute) => {
            for(let index in this.dataDefinition.definitions) {
                let {valid_values, ...attribute} = this.dataDefinition.definitions[index]; //remove valid values
                if( template_attribute.xsd_element == attribute.xsd_element ) {
                    attribute = {...attribute, ...template_attribute};
                    item.attributes.push(attribute);
                }
            }
        })
        item.attributes.sort(this.compareLabel);

        item.category = category? category:false;
        item.category2 = category2? category2:false;

        item.product_code_exemption = product_code_exemption;
        if (!is_sample) {
            item.brand = brand;
            item.manufacturer = manufacturer;
        }
        if (template_variation) {
            let {theme, fields} = template_variation;
            this.setVariationFields(item, theme, fields);
        } else {
            this.setVariationFields(item, '');
        }
        this.setState({template_status: null,
                template_name,
                template_is_admin_only,
                status, item,
                show_toast: true, toast_is_error: false, toast_message: CsI18n.t('Template loaded.')},
            () => {
                if(!is_sample) {
                    let result = this.initOverrideOptions();
                    this.setState({...result});
                }
            });
    }

    deleteTemplate = () => {
        let {configuration} = this.context;
        let {universe, xsd_product_type} = this.state.item;
        let {group_id} = this.state.item;
        let marketplace_id = this.getGroupMarketplaceId(group_id);
        ApplicationApiCall.get('/application/delete_template',
            {configuration, universe, xsd_product_type, marketplace_id, template_key: this.state.template_selection},
            (result) => {
                this.cbTemplateList(result);
                this.setState({template_status: null, template_selection: '', show_toast: true, toast_is_error: false, toast_message: CsI18n.t('Template deleted')});
            }, (err) => {
                this.setState({template_status: null, show_toast: true, toast_is_error: true, toast_message: CsI18n.t('Failed to delete the template')});
            });
        this.setState({modal_template_delete_open: false, template_status: STATE_TEMPLATE_DELETING});
    }

    render() {
        let contextual_message;
        let {status, mode} = this.state;

        let {variation} = this.state.item;

        if (this.state.error) {
            contextual_message = this.renderError();
        } else if (this.state.status === States.STATUS_SAVED) {
            contextual_message = Constants.models_saved_successfully;
        }
        let modelData = this.state.item;

        // let {dataDefinition} = this.context;
        // console.log("render", "modelData", JSON.stringify(modelData), "dataDefinition", JSON.stringify(this.dataDefinition));
        console.log(variation, this.shopify_options, "this.variationFields", this.variationFields);
        let variation_fields = [];
        if( !this.state.error && this.state.wait_data == false && variation && variation.fields.length && this.dataDefinition ) {
            for(let index in variation.fields) {
                variation_fields.push(this.renderVariationField(variation.fields[index], index));
            }
        }
        let groupName = Util.getRawHtmlElement(this.state.item.groupName)
        console.log("this.state.item", this.state.item, "item", groupName);


        let button_product_type =
            <Stack.Item>
                <Button
                    onClick={this.handleProductTypeModalOpen}><CsI18n>{!modelData.product_type ? CsI18n.t("Select") : CsI18n.t("Change Product Type")}</CsI18n></Button>
                {this.state.openedProductTypeModal ? (
                    <ModelProductTypeModal
                        opened={this.state.openedProductTypeModal}
                        onClose={this.handleProductTypeModalClose}
                        onChange={this.handleProductTypeModalChange}
                        marketplace_id={this.props.marketplace.MarketplaceId}
                        group_id={modelData.group_id}
                        universe={modelData.universe}
                        product_type={modelData.product_type}
                    />) : ''}
            </Stack.Item>

        let iso_code = this.props.marketplace.DefaultCountryCode.toLowerCase();
        let flag_url = shopifyContext.getShared().static_content + '/amazon/flags/flag_' + iso_code + '_64px.png';

        return (
            <div className="model-form">
                <CsValidationForm name="modelForm">
                    {contextual_message}
                    {this.renderToast()}

                    <div className="model-heading">
                        <Heading>
                            <Stack alignment="center" spacing="tight">
                                <Avatar source={flag_url} alt={iso_code} size="small"/>
                                <CsI18n>
                                    {mode === States.MODE_EDIT ? 'Edit a model' : 'Create a model'}
                                </CsI18n>
                            </Stack>
                        </Heading>
                        <CsInlineHelp
                            content={CsI18n.t("Models allow to enrich data of matching groups (set of products). You must configure the product type, universe and mandatory attributes.")}/>

                    </div>

                    <Card.Section alignment={"center"}>
                        <Stack alignment={"center"}>
                            <Stack.Item fill>
                                {modelData.product_type ? (
                                    <Stack.Item fill>
                                        <Stack alignment="center">
                                            <Stack.Item>
                                                <Heading>{CsI18n.t("Model Name")}</Heading>
                                                {groupName}
                                            </Stack.Item>
                                            <Stack.Item>
                                                <Heading>{CsI18n.t("Product Type")}</Heading>
                                                {modelData.product_type ?
                                                    Util.getRawHtmlElement(modelData.universe_display_name + ' - ' + modelData.product_type_display_name) : ''}
                                            </Stack.Item>
                                        </Stack>
                                    </Stack.Item>
                                ) : (
                                    <Stack.Item fill>
                                        <Stack alignment="center">
                                            <Stack.Item>
                                                <Heading>{CsI18n.t("Select a product type")}</Heading>
                                            </Stack.Item>
                                        </Stack>
                                    </Stack.Item>
                                )
                                }
                            </Stack.Item>
                            {button_product_type}
                        </Stack>

                    </Card.Section>
                    {this.state.wait_data ?
                        (<Card.Section><div align="center">
                            <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
                        </div></Card.Section>)
                        :
                        (<React.Fragment>
                            {this.variationTheme? (<Card.Section><div className="section-variation">
                                <div className="variation-theme">
                                    <Stack alignment={"center"}>
                                        <Stack.Item>
                                            <Heading>{CsI18n.t("Variation theme")}</Heading>
                                        </Stack.Item>
                                        <Stack.Item>
                                            <Tooltip
                                                content={CsI18n.t('If you have products with Options/Variants, it allows to create variants as well on Amazon')}>
                                                    <span className={"help-tooltip"}>
                                                        <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                                    </span>
                                            </Tooltip>
                                        </Stack.Item>
                                        <Stack.Item>
                                            <div className={"variation-theme-field"}><Select label="Value"
                                                                                             options={this.variationTheme}
                                                                                             onChange={this.handleChangeVariationTheme}
                                                                                             value={variation.theme}
                                                                                             labelHidden={true}/></div>
                                        </Stack.Item>
                                    </Stack>
                                </div>
                                {variation.theme? variation_fields:''}
                                {this.renderVariationAdvance()}
                            </div></Card.Section>):''}
                            <Card.Section>
                                <Stack>
                                    <Stack.Item fill>
                                        {this.state.form_attribute_error ? (
                                            <Element name={"model_form_error"}><Banner icon={AlertMinor} status="critical"
                                                                         title={this.state.form_attribute_error}/></Element>
                                            )
                                            :
                                            (
                                                <Banner status="info"
                                                        title={(<CsI18n
                                                            tutorials={this.help_tutorials}>{'You should select at least one relevant attribute (ie: not Title or Description). Please refer to the Help > {{tutorials}} section.'}</CsI18n>)}/>
                                            )
                                        }
                                    </Stack.Item>
                                </Stack>

                                <br/>

                                <Stack wrap={false}>
                                    <Stack.Item>
                                        <Heading>{CsI18n.t("Attributes")}</Heading>
                                    </Stack.Item>
                                    <Stack.Item>
                                        <Tooltip
                                            content={CsI18n.t("Use to associate Amazon attributes to your store values, additional information in Help > Tutorials section")}>
                                                <span className={"help-tooltip"}>
                                                    <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                                </span>
                                        </Tooltip>
                                    </Stack.Item>
                                    <Stack.Item fill>
                                        &nbsp;
                                    </Stack.Item>
                                    <Stack.Item>
                                        <Button onClick={this.handleAttributeModalOpen}
                                                disabled={!modelData.product_type}><CsI18n>Add</CsI18n></Button>
                                    </Stack.Item>
                                </Stack>


                                {modelData.attributes.length != 0 ?
                                (<ResourceList
                                        resourceName={{singular: 'attribute', plural: 'attributes'}}
                                        items={modelData.attributes}
                                        renderItem={this.renderModelAttribute}
                                    />
                                ) :
                                    (
                                        null
                                    )
                            }
                            </Card.Section>
                            {this.state.openedAttributeEditModal ? (
                                <ModelAttributeEditModal
                                    opened={this.state.openedAttributeEditModal}
                                    onClose={this.handleAttributeEditModalClose}
                                    onSave={this.handleAttributeEditModalSave}
                                    onAddValue = {this.handleAttributeEditModalAddValue}
                                    shopify_options={this.dataDefinition.shopify_options}
                                    universe={modelData.universe}
                                    attribute={this.attribute}
                                    marketplace={this.marketplace}
                                />) : ''
                            }

                            {this.state.openedAttributeModal ? (
                                <ModelAttributesSelectModal
                                    key={"select-modal" + modelData.universe + modelData.product_type}
                                    opened={this.state.openedAttributeModal}
                                    onClose={this.handleAttributeModalClose}
                                    onAdd={this.handleAttributeAdd}
                                    selected={modelData.attributes}
                                    group_id={modelData.group_id}
                                    universe={modelData.universe}
                                    product_type={modelData.product_type}
                                    data_definition = {this.dataDefinition}
                                    marketplace={this.marketplace}
                                    mode={'create'}
                                />) : ''
                            }
                        </React.Fragment>)
                    }
                    {this.renderOverrideFields()}
                    {this.state.template_status != STATE_TEMPLATE_LOADING && this.renderCategory()}

                    <Card.Section>
                        <CsConfirmModal mode={CsConfirmModal.MODE_DELETE}
                                        onClose={this.handleToggleModal}
                                        onOK={this.handlerDelete}
                                        opened={this.state.opendeletemodal}
                                        title={"Delete"}
                                        message={Constants.text_safe_to_delete}
                        />
                        {this.state.openDuplicateModal ? (
                            <ModelDuplicateModal
                                opened={this.state.openDuplicateModal}
                                onClose={this.handleToggleDuplicateModal}
                                onDuplicate={this.handlerDuplicate}
                                marketplace_id={this.props.marketplace.MarketplaceId}
                            />) : ''}

                        <Stack wrap={false}>
                            <Stack.Item>
                                {mode === States.MODE_EDIT &&
                                <ButtonGroup>
                                    <Button icon={DeleteMinor} onClick={this.deleteConfirmation}
                                            loading={status === States.STATUS_DELETING}
                                            disabled={status === States.STATUS_DELETING}
                                            destructive><CsI18n>Delete</CsI18n></Button>
                                    <Button icon={DuplicateMinor}
                                            onClick={this.duplicateConfirmation}><CsI18n>Duplicate</CsI18n></Button>
                                </ButtonGroup>
                                }
                            </Stack.Item>
                            <Stack.Item fill>
                                {modelData.universe > '' && this.renderTemplate()}
                            </Stack.Item>
                            <Stack.Item>
                                <ButtonGroup>
                                    <Button onClick={this.handlerClose}><CsI18n>Cancel</CsI18n></Button>
                                    <Button onClick={this.handlerSave} loading={status === States.STATUS_SAVING}
                                            disabled={status === States.STATUS_SAVING || status === States.STATUS_SAVED || status === States.STATUS_NORMAL}
                                            primary><CsI18n>Save</CsI18n></Button>
                                </ButtonGroup>
                            </Stack.Item>
                        </Stack>

                        {this.renderTemplateModal()}
                    </Card.Section>
                </CsValidationForm>
            </div>
        );
    }

    renderToast() {
        let {show_toast, toast_is_error, toast_message} = this.state;
        if (!show_toast) {
            return null;
        }
        return <Toast content={toast_message} error={toast_is_error} onDismiss={() => {this.setState({show_toast: false})}} />
    }

    renderTemplateModal() {
        let {modal_template_delete_open, modal_template_load_open, modal_template_save_open, template_name, template_is_admin_only} = this.state;
        let groupName = this.state.item.groupName;

        return <React.Fragment>
            {modal_template_delete_open? <CsConfirmModal mode={CsConfirmModal.MODE_DELETE}
                            ref={"template-delete"}
                            onClose={() => this.setState({modal_template_delete_open: false})}
                            onOK={this.deleteTemplate}
                            opened={this.state.modal_template_delete_open}
                            title={"Delete"}
                            message={CsI18n.t('Are you sure to delete?')}
            />:null}
            {modal_template_load_open? <CsConfirmModal mode={CsConfirmModal.MODE_CONFIRM} ref={"template-load"}
                                                         onClose={() => this.setState({modal_template_load_open: false})}
                                                         onOK={this.loadTemplate}
                                                         opened={this.state.modal_template_load_open}
                                                         title={"Confirm"}
                                                         message={CsI18n.t('Are you sure to load the template?')}
            />:null}
            {modal_template_save_open ? (
                <ModelTemplateSaveModal
                    opened={true}
                    onClose={() => this.setState({modal_template_save_open: false})}
                    onSave={this.saveTemplate}
                    name={template_name == ''? groupName:template_name}
                    is_admin_only={template_is_admin_only}
                />) : ''}
        </React.Fragment>
    }

    renderTemplate() {
        let {template_selection, template_options, template_status} = this.state;
        let is_admin = this.shopify.isAdminMode();
        return <Stack>
            <Stack.Item>
                <Button onClick={() => this.setState({modal_template_save_open: true})}
                        loading={template_status === STATE_TEMPLATE_SAVING}
                        disabled={template_status === STATE_TEMPLATE_SAVING
                        || template_status == STATE_TEMPLATE_DELETING
                        || template_status == STATE_TEMPLATE_LOADING}
                ><CsI18n>Save as template</CsI18n></Button>
            </Stack.Item>
            <Stack.Item>
                <div className={"model-template"}><Select label="Template"
                        options={template_options}
                        onChange={(value) => {this.setState({template_selection: value})}}
                        value={template_selection}
                        labelHidden={true}/></div>
            </Stack.Item>
            <Stack.Item>
                <Button onClick={() => this.setState({modal_template_load_open: true})}
                        loading={template_status === STATE_TEMPLATE_LOADING}
                        disabled={template_selection == '' || template_status === STATE_TEMPLATE_SAVING
                        || template_status == STATE_TEMPLATE_DELETING
                        || template_status == STATE_TEMPLATE_LOADING}
                ><CsI18n>Load</CsI18n></Button>
            </Stack.Item>
            {is_admin? <Stack.Item>
                <Button icon={DeleteMinor} onClick={() => this.setState({modal_template_delete_open: true})}
                        loading={template_status === STATE_TEMPLATE_DELETING}
                        disabled={template_selection == '' || template_status === STATE_TEMPLATE_SAVING
                        || template_status == STATE_TEMPLATE_DELETING
                        || template_status == STATE_TEMPLATE_LOADING}
                ><CsI18n>Delete template</CsI18n></Button>
            </Stack.Item>:null}
        </Stack>
    }

    renderModelAttribute = (item, index) => {
        let {is_dont_convert_currency} = item;
        return (
            <ResourceList.Item
                key={index+item.xsd_element}
            >
                <Stack wrap={false} fill key={"attribute-" + item.attribute_name}>
                    <Stack.Item fill>
                        <Stack vertical={true} spacing={"tight"}>
                            <Stack.Item>
                                <TextStyle variation={"strong"}>{Util.getRawHtmlElement(item.local_label_name)}&nbsp;({item.attribute_name})</TextStyle>
                            </Stack.Item>
                            <Stack.Item fill>
                                <Stack vertical={false}>
                                    <Stack.Item><TextStyle variation={"subdued"}><CsI18n>Value</CsI18n></TextStyle></Stack.Item>
                                    <Stack.Item>{(item.default_value || item.default_value2)? (<TextStyle variation={"code"}>{item.default_value}{item.default_value2? ((item.default_value? ", ":'') + item.default_value2):''}</TextStyle>):(<TextStyle variation={"negative"}><CsI18n>No configured</CsI18n></TextStyle>)}</Stack.Item>
                                    {item.special_attributes? (<Stack.Item fill><Stack vertical={false}>
                                        <Stack.Item><TextStyle variation={"subdued"}><CsI18n>Attribute</CsI18n></TextStyle></Stack.Item>
                                        <Stack.Item>{item.special_value? (<TextStyle variation={"code"}>{item.special_value}</TextStyle>):(<TextStyle variation={"negative"}><CsI18n>No configured</CsI18n></TextStyle>)}</Stack.Item>
                                    </Stack></Stack.Item>):null}
                                    {is_dont_convert_currency? <Stack.Item><TextStyle variation={"code"}><CsI18n>Don't convert the currency</CsI18n></TextStyle></Stack.Item>:null}
                                </Stack>
                            </Stack.Item>
                        </Stack>
                    </Stack.Item>
                    <Stack.Item>
                        {/*<Button size="slim" destructive={true} disabled={item.pinned}*/}
                        {/*        onClick={this.handleAttributeRemove(item.attribute_name)}><CsI18n>Remove</CsI18n></Button>*/}
                        <Button size="slim" destructive={true}
                                onClick={this.handleAttributeRemove(item.attribute_name)}><CsI18n>Remove</CsI18n></Button>
                    </Stack.Item>
                    <Stack.Item>
                        <Button size="slim"
                                onClick={this.handleAttributeEdit(item.attribute_name)}><CsI18n>Edit</CsI18n></Button>
                    </Stack.Item>
                </Stack>
            </ResourceList.Item>
        );
    }

    renderVariationField(variation_field, index) {
        let variationData = this.dataDefinition.variation;
        let {name: field_name, option: field_option, default_value, option2: field_option2, default_value2, attribute: field_attribute} = variation_field;
        let hasOption2 = field_option2 || field_option2 === "";
        return ( <div className="variation-field" key={"variation-field-"+field_name}><Stack alignment="center" key={"field-"+field_name}>
            <Stack.Item><div className="variation-field-label" key={"label-"+field_name}>
                <Stack spacing={"tight"} key={"field-"+field_name+"tooltip"}>
                    <Stack.Item>{variationData.fields[field_name].display_name}</Stack.Item>
                    <Stack.Item>
                        <Tooltip
                            content={CsI18n.t("{{option_name}} option field on store side", {option_name: variationData.fields[field_name].display_name})}
                            preferredPosition={"above"}>
                            <span className={"help-tooltip"}><Icon source={QuestionMarkMajorMonotone}
                                                                   color="green"/></span>
                        </Tooltip>
                    </Stack.Item>
                </Stack></div>
            </Stack.Item>
            <Stack.Item><div className="variation-field-option"  key={"option-"+field_name}>
                <CsValidation>
                    <Select label="Option"
                            key={"option-select"+field_name}
                            options={this.shopify_options}
                            onChange={this.handleChangeVariationField(index)}
                            value={field_option}
                            labelHidden={true}/>
                    <CsValidation.Item rule="required"
                                       title={CsI18n.t("Option is required")}/>
                </CsValidation>
            </div></Stack.Item>
            {field_option == OPTION_DEFAULT_VALUE?
                (<Stack.Item><div className="variation-field-value" key={"valid-value-"+field_name}>
                    {this.variationFields[index].valid_values?
                        (<CsValidation>
                            <CsAutoComplete
                                isOnlyValue={true}
                                key={"valid-value-select"+field_name}
                                options={this.variationFields[index].valid_values}
                                onChange={this.handleChangeVariationDefaultValue(index)}
                                selected={default_value}
                                allowedInput={this.variationFields[index].has_custom_value? true:false}
                            />
                            <CsValidation.Item rule="required"
                                               title={CsI18n.t("Default value is required")}/>
                        </CsValidation>):
                        (<CsValidation>
                            <TextField label="Default Value"
                                       key={"valid-value-text"+field_name}
                                       onChange={this.handleChangeVariationDefaultValue(index)}
                                       value={default_value}
                                       labelHidden={true}/>
                            <CsValidation.Item rule="required"
                                               title={CsI18n.t("Default value is required")}/>
                        </CsValidation>)
                    }
                </div></Stack.Item>):''}
            {this.variationFields[index].attributes?
                <Stack.Item>
                    <div className="variation-field-attribute" key={"attribute-"+field_name}>
                        <CsValidation>
                            <Select label="Attribute"
                                    key={"attribute-select"+field_name}
                                    options={this.variationFields[index].attributes}
                                    onChange={this.handleChangeVariationAttribute(index)}
                                    value={field_attribute}
                                    labelHidden={true}/>
                            <CsValidation.Item rule="required"
                                               title={CsI18n.t("Attribute is required")}/>
                        </CsValidation>
                    </div>
                </Stack.Item>:''}
            {hasOption2? <Stack.Item><div className="variation-field-option"  key={"option-"+field_name}>
                    <CsValidation>
                        <Select label="Option"
                                key={"option-select"+field_name}
                                options={this.shopify_options}
                                onChange={this.handleChangeVariationField(index, true)}
                                value={field_option2}
                                labelHidden={true}/>
                        <CsValidation.Item rule="required"
                                           title={CsI18n.t("Option is required")}/>
                    </CsValidation>
                </div></Stack.Item>:''}
                {hasOption2 && field_option2 == OPTION_DEFAULT_VALUE?
                    (<Stack.Item><div className="variation-field-value" key={"valid-value-"+field_name}>
                        {this.variationFields[index].valid_values?
                            (<CsValidation>
                                <CsAutoComplete
                                    isOnlyValue={true}
                                    key={"valid-value-select2"+field_name}
                                    options={this.variationFields[index].valid_values}
                                    onChange={this.handleChangeVariationDefaultValue(index, true)}
                                    selected={default_value2}
                                    allowedInput={this.variationFields[index].has_custom_value? true:false}
                                />
                                <CsValidation.Item rule="required"
                                                   title={CsI18n.t("Default value is required")}/>
                            </CsValidation>):
                            (<CsValidation>
                                <TextField label="Default Value"
                                           key={"valid-value-text2"+field_name}
                                           onChange={this.handleChangeVariationDefaultValue(index, true)}
                                           value={default_value2}
                                           labelHidden={true}/>
                                <CsValidation.Item rule="required"
                                                   title={CsI18n.t("Default value is required")}/>
                            </CsValidation>)
                        }
                    </div></Stack.Item>):''}
            {hasOption2? <Stack.Item><Button icon={DeleteMinor} onClick={this.handleDeleteSecondVariationField(index)}/></Stack.Item>
                :
                this.state.variationAdvancedMode? <Button icon={PlusMinor} onClick={this.handleAddSecondVariationField(index)}/>:''}
        </Stack></div> );
    }

    renderVariationAdvance() {
        return (<div className={"mt-4"}><Stack wrap={false} alignment={"center"}>
            <Stack.Item>
                <CsToggleButton checked={this.state.variationAdvancedMode} key={"variation-advance"} onChange={this.handlerVariationAdvance}/>
            </Stack.Item>
            <Stack.Item fill>
                    {CsI18n.t('Advanced')}
            </Stack.Item></Stack></div>);

    }

    renderOverrideField(field) {
        let field_selection = `${field}_selection`;
        let field_input = `${field}_input`;
        let selection = this.state[field_selection];
        let input = this.state[field_input];
        return (<Stack alignment="center" key={`override-field-${field}`}>
            <Stack.Item><div className="override-field-option"  key={`option-${field}}`}>
                <Select label="Option"
                        key={`option-select-${field}`}
                        options={this.brand_options}
                        onChange={this.handleChangeOverrideVendorSelection(field, field_selection)}
                        value={selection}
                        labelHidden={true}/>
        </div></Stack.Item>
        {selection === OPTION_DEFAULT_VALUE?
            (<Stack.Item><div className="override-field-value" key={"valid-value-"+field}>
                <CsValidation>
                    <TextField label="Fixed Value"
                               key={`override-value-text-${field}`}
                               onChange={this.handleChangeOverrideVendorInput(field, field_input)}
                               value={input}
                               labelHidden={true}/>
                    <CsValidation.Item rule="required"
                                       title={CsI18n.t("Fixed value is required")}/>
                    </CsValidation>
            </div></Stack.Item>):''}
        </Stack>);
    }

    renderOverrideFields() {
        let {product_code_exemption, brand, manufacturer} = this.state.item;
        console.log("renderOverrideFields", this.state);
        return <Card.Section>
            <div className="override-fields">
                <table>
                    <tbody>
                    <tr>
                        <th>
                            <Stack distribution='trailing' nowrap={true}>
                                <Stack.Item>
                                    <Heading>{CsI18n.t("Barcode exemption")}</Heading>
                                </Stack.Item>
                                <Stack.Item>
                                    <Tooltip
                                        content={CsI18n.t('Barcodes (GTIN or EAN/UPC) exemption tutorial is available in the Help > Tutorials section')}>
                                        <span className={"help-tooltip"}>
                                            <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                        </span>
                                    </Tooltip>
                                </Stack.Item>
                            </Stack>
                        </th>
                        <td><div className={"override-field-option"}><Select label="Barcode exemption"
                                    options={this.options_product_code_exemption}
                                    onChange={this.handleChangeProductOverride('product_code_exemption')}
                                    value={product_code_exemption}
                                    labelHidden={true}/></div></td>
                    </tr>
                    <tr>
                        <th>
                            <Stack distribution='trailing' nowrap={true}>
                                <Stack.Item>
                                    <Heading>{CsI18n.t("Brand override")}</Heading>
                                </Stack.Item>
                                <Stack.Item>
                                    <Tooltip
                                        content={CsI18n.t("By default, the Shopify field Vendor is sent as Brand, you can change it here")}>
                                        <span className={"help-tooltip"}>
                                            <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                        </span>
                                    </Tooltip>
                                </Stack.Item>
                            </Stack>

                        </th>
                        <td className={"text-input"}>
                            {this.renderOverrideField('brand')}
                        </td>
                    </tr>
                    <tr>
                        <th>
                            <Stack distribution='trailing' nowrap={true}>
                                <Stack.Item>
                                    <Heading>{CsI18n.t("Manufacturer override")}</Heading>
                                </Stack.Item>
                                <Stack.Item>
                                    <Tooltip
                                        content={CsI18n.t("By default, the Shopify field Vendor is sent as Manufacturer, you can change it here")}>
                                            <span className={"help-tooltip"}>
                                                <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                            </span>
                                    </Tooltip>
                                </Stack.Item>
                            </Stack>
                        </th>

                        <td className={"text-input"}>{this.renderOverrideField('manufacturer')}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </Card.Section>
    }

    renderCategory() {
        let {category, category2, group_id} = this.state.item;
        if(!group_id) {
            return null;
        }
        let marketplace_id = this.getGroupMarketplaceId(group_id);

        return <Card.Section>
            <Heading>
                {CsI18n.t("Categories")}
            </Heading>
            <TextStyle variation="subdued">
                Amazon recommended browse nodes
            </TextStyle>

            <div className="model-category-field">
                <table>
                    <tbody>
                    <tr>
                        <th>
                            <Stack distribution='trailing'>
                                <Stack.Item>
                                    <Heading>
                                        {CsI18n.t("Category")} 1
                                    </Heading>
                                </Stack.Item>
                                <Stack.Item>
                                    <Tooltip
                                        content={CsI18n.t("Recommended Browse Node in Amazon jargon, important for your products classification")}>
                                        <span className={"help-tooltip"}>
                                            <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                        </span>
                                    </Tooltip>
                                </Stack.Item>
                            </Stack>

                        </th>
                        <td><ModelCategorySelect category={category} marketplace_id={marketplace_id} onSelect={this.handleSelectCategory('category')}/></td>
                    </tr>
                    <tr>
                        <th>
                            <Stack distribution='trailing'>
                                <Stack.Item>
                                    <Heading>
                                        {CsI18n.t("Category")} 2
                                    </Heading>
                                </Stack.Item>
                                <Stack.Item>
                                    <Tooltip
                                        content={CsI18n.t("Recommended Browse Node in Amazon jargon, important for your products classification")}>
                                        <span className={"help-tooltip"}>
                                            <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                        </span>
                                    </Tooltip>
                                </Stack.Item>
                            </Stack>

                        </th>
                        <td><ModelCategorySelect category={category2} marketplace_id={marketplace_id} onSelect={this.handleSelectCategory('category2')}/></td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </Card.Section>
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
