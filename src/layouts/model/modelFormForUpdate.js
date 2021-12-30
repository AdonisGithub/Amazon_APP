import React from 'react';
import Constants from "../../helpers/rules/constants";
import {CsValidationForm, CsValidation} from "../../components/csValidationForm";
import {
    Button,    Card,    Heading,    FormLayout,    ResourceList,    Select,
    Stack,    TextField, ButtonGroup, TextStyle, Tooltip, Icon, Badge, Banner, Link, Spinner,
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
    AlertMinor, CircleChevronRightMinor, CircleInformationMajorMonotone,
} from '@shopify/polaris-icons';

import CsI18n from "../../components/csI18n";
import Util from "../../helpers/Util";
import States from "../../helpers/rules/states";
import CsErrorMessage from "../../components/csErrorMessage";
import ShopifyContext from "../../context";
import ApplicationApiCall from "../../functions/application-api-call";
import ModelAttributesSelectModal from "./modelAttributesSelectModal"
import CsConfirmModal from "../../components/csConfirmModal";
import {ModelContext} from "./model-context";
import ModelAttributeEditModal from "./modelAttributeEditModal";

import CsInlineHelp from "../../components/csInlineHelp/csInlineHelp";
import ModelDuplicateModal from "./modelDuplicateModal";
import {ModelCategorySelect} from "./modelCategorySelect";
import ModelProductTypeModal from "./modelProductTypeModal";

const PINNED_ATTRIBUTES = ['Title', 'ProductName', 'Description', 'BulletPoint'];

export default class ModelFormForUpdate extends States {

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
    }

    constructor(props) {
        super(props);
        console.log("constructor", this.props);

        this.state.mode = this.props.mode;
        this.state.items = this.props.items;
        this.state.item = this.props.items[this.props.current] ? Util.clone(this.props.items[this.props.current]) : null;
        this.shopify = ShopifyContext.getShared();

        this.marketplace = this.props.marketplace;
        this.unMounted = false;
        this.marketplace_id = this.props.marketplace.MarketplaceId;
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
        item.group_id = this.props.group_id > -1? this.props.group_id:0;
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
        item.variation = { theme: "", fields: []};
        this.state.item = item;
    }

    componentWillMount() {
        require('./modelModal.css');
        let {item, status} = this.state;
        status = States.STATUS_CHANGED;

        if (item.group_id && item.product_type) {
            this.fetchDataDefinitionsForUpdate(item.group_id, item.universe, item.product_type);
        }
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
        for(let index in this.dataDefinitionForUpdate.definitions) {
            let {valid_values, ...attribute} = this.dataDefinitionForUpdate.definitions[index]; //remove valid values
            let xsd_element = attribute.xsd_element_origin? attribute.xsd_element_origin : attribute.xsd_element;
            let pos = PINNED_ATTRIBUTES.indexOf(xsd_element);
            if (pos !== -1) {
                this.dataDefinitionForUpdate.definitions[index].pinned = true;
                this.dataDefinitionForUpdate.definitions[index].pinned_pos = pos;
            }
        }
        attributes.sort(this.compareLabel);
        this.dataDefinitionForUpdate.definitions.sort(this.compareLabel);
        console.log("initPinnedAttributes", attributes, this.dataDefinitionForUpdate);
    }

    checkAttributeError()
    {
        console.log("checkAttributeError", this.state);
        let {attributes} = this.state.item;
        if (attributes.length === 0) {
            let form_attribute_error = CsI18n.t("Please add an attribute.");
            return form_attribute_error;
        }

        let {group_id, universe, product_type} = this.state.item;
        let key_id = universe + "_" + product_type;
        let cache_group = `g${group_id}`;
        let dataDefinitionForUpdate = this.context.dataDefinitionForUpdate[cache_group][key_id];
        for (let index in dataDefinitionForUpdate.definitions) {
            let {local_label_name, attribute_name, required} = dataDefinitionForUpdate.definitions[index];
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

        let not_configured = false;
        let invalid_values = false;
        for(let attribute of attributes) {
            let {xsd_element, xsd_element_origin, local_label_name, default_value, default_value2} = attribute;
            if (!default_value && !default_value2 && !not_configured) {
                not_configured = CsI18n.t("Attribute({{attribute}}) is NOT configured!", {attribute: local_label_name});
                break;
            }
            if (xsd_element == "Title" && default_value == "{{Title}}") {
                invalid_values = CsI18n.t("This mapping is useless {{item}} is already mapped to {{item}}", {item: "Title"});
                break;
            }
            if (xsd_element == "Description" && default_value == "{{Description}}") {
                invalid_values = CsI18n.t("This mapping is useless {{item}} is already mapped to {{item}}", {item: "Description"});
                break;
            }
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
            setTimeout(() => {this.setState({form_attribute_error: false})}, 5000);
            this.setState({form_attribute_error});
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
            this.fetchDataDefinitionsForUpdate(group_id, universe, product_type);
        }
        item.group_id = group_id;
        // item.universe_id = parseInt(universe_id);
        item.universe = universe_data.universe;
        item.universe_display_name = universe_data.display_name;
        // item.product_type_id = parseInt(product_type_id);

        console.log("handleProductTypeModalChange: item", item);

        this.setState({item, openedProductTypeModal: false, status: status});
    }

    fetchDataDefinitionsForUpdate(group_id, universe, product_type) {
        let marketplace_id = this.marketplace_id;
        let cache_group = `g${group_id}`;
        let {configuration, dataDefinitionForUpdate} = this.context;
        if (dataDefinitionForUpdate[cache_group] == undefined) {
            dataDefinitionForUpdate[cache_group] = [];
        }
        let key_id = universe + "_" + product_type;
        if (dataDefinitionForUpdate[cache_group][key_id] != undefined) {
            this.dataDefinitionForUpdate = this.context.dataDefinitionForUpdate[cache_group][key_id];
            return;
        }
        let params = {
            configuration: configuration,
            group_id: group_id,
            universe: universe,
            product_type: product_type,
            marketplace_id: marketplace_id,
        };

        ApplicationApiCall.get('/application/models/definitions_for_update',
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
        let marketplace_id = this.marketplace_id;
        let {definitions, metafields_product, metafields_variant, ...other} = json;
        let definitions_new = [];
        for(let key in definitions) {
            definitions_new[definitions[key].xsd_element] = definitions[key];
        }
        let cache_group = `g${group_id}`;
        this.context.dataDefinitionForUpdate[cache_group][key_id] = {...other, definitions: definitions_new};
        this.context.metaFieldsProduct = metafields_product;
        this.context.metaFieldsVariant = metafields_variant;
        this.dataDefinitionForUpdate = this.context.dataDefinitionForUpdate[cache_group][key_id];
        console.log("cbFetchDataDefinitionsSuccess", marketplace_id, this.dataDefinitionForUpdate);
        this.initPinnedAttributes();
        this.correctAttributes();
        this.setState({wait_data: false});
    }

    correctAttributes() {
        let {item} = this.state;
        console.log("correctAttributes", item);
        if(!item.attributes) {
            return;
        }
        let bFixed = false;
        let fixed_attributes = [];
        for( let index in item.attributes ) {
            let attribute = item.attributes[index];
            if(this.dataDefinitionForUpdate.definitions[attribute.xsd_element]) {
                fixed_attributes.push(attribute);
                continue;
            }
            if(this.dataDefinitionForUpdate.definitions[attribute.xsd_element + '1']) { //for occurs
                let definition = this.dataDefinitionForUpdate.definitions[attribute.xsd_element + '1'];
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
        if (bFixed) {
            item.attributes = fixed_attributes;
            this.setState({item});
        }
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
                let attribute_new = this.dataDefinitionForUpdate.definitions[attribute.xsd_element];
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

        this.dataDefinitionForUpdate.definitions[attribute.xsd_element].valid_values = values;
        let {group_id, universe, product_type} = item;
        let key_id = universe + "_" + product_type;
        let marketplace_id = this.marketplace_id;
        let cache_group = `g${group_id}`;
        this.context.dataDefinitionForUpdate[cache_group][key_id] = this.dataDefinitionForUpdate;

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

        for(let index in this.dataDefinitionForUpdate.definitions) {
            let {valid_values, ...attribute} = this.dataDefinitionForUpdate.definitions[index]; //remove valid values
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

    handleSelectCategory = (category_key) => (category) => {
        console.log("handleSelectCategory", category_key, category);
        let {item, status} = this.state;
        status = States.STATUS_CHANGED;
        item[category_key] = category;
        this.setState({item, status: status});
    }

    render() {
        let contextual_message;
        let {status, mode} = this.state;

        if (this.state.error) {
            contextual_message = this.renderError();
        } else if (this.state.status === States.STATUS_SAVED) {
            contextual_message = Constants.models_saved_successfully;
        }
        let modelData = this.state.item;

        console.log(modelData);

        return (
            <CsValidationForm name="modelForm">
                <Card.Section>
                    <Heading><CsI18n>{mode === States.MODE_EDIT ? 'Edit a model' : 'Create a model'}</CsI18n></Heading>
                    {contextual_message}
                    <Card.Section>
                        <Stack alignment={"center"}>
                            <Stack.Item>
                                <Heading>{CsI18n.t("Product Type")}</Heading>
                            </Stack.Item>
                            <Stack.Item fill>
                                {modelData.product_type ?
                                    Util.getRawHtmlElement(modelData.universe_display_name + ' - ' + modelData.product_type_display_name)
                                    :
                                    CsI18n.t("Select Product Type")}
                            </Stack.Item>
                            <Stack.Item>
                                <Button onClick={this.handleProductTypeModalOpen}><CsI18n>Select</CsI18n></Button>
                                {this.state.openedProductTypeModal ? (
                                    <ModelProductTypeModal
                                        opened={this.state.openedProductTypeModal}
                                        onClose={this.handleProductTypeModalClose}
                                        onChange={this.handleProductTypeModalChange}
                                        marketplace_id={this.marketplace_id}
                                        group_id={modelData.group_id}
                                        universe={modelData.universe}
                                        product_type={modelData.product_type}
                                        is_update_mode={true}
                                    />) : ''}
                            </Stack.Item>
                        </Stack>
                    </Card.Section>
                    {this.state.wait_data ?
                        (<Card.Section><div align="center">
                            <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
                        </div></Card.Section>)
                        :
                        (<React.Fragment>
                            <Card.Section>
                                <Stack>
                                    <Stack.Item fill>
                                        <Heading>{CsI18n.t("Attributes")}</Heading>
                                    </Stack.Item>
                                    <Stack.Item>
                                        <Button onClick={this.handleAttributeModalOpen}><CsI18n>Add</CsI18n></Button>
                                    </Stack.Item>
                                </Stack>
                                {this.state.form_attribute_error? <Banner icon={AlertMinor} status="critical" title={this.state.form_attribute_error}/>:''}

                            {modelData.attributes.length != 0 ?
                                (<ResourceList
                                        resourceName={{singular: 'attribute', plural: 'attributes'}}
                                        items={modelData.attributes}
                                        renderItem={this.renderModelAttribute}
                                    />
                                ) : null
                            }
                            </Card.Section>
                            {this.state.openedAttributeEditModal ? (
                                <ModelAttributeEditModal
                                    opened={this.state.openedAttributeEditModal}
                                    onClose={this.handleAttributeEditModalClose}
                                    onSave={this.handleAttributeEditModalSave}
                                    onAddValue = {this.handleAttributeEditModalAddValue}
                                    shopify_options={this.dataDefinitionForUpdate.shopify_options}
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
                                    data_definition = {this.dataDefinitionForUpdate}
                                    marketplace={this.marketplace}
                                    mode={'update'}
                                />) : ''
                            }
                        </React.Fragment>)
                    }
                    {this.renderCategory()}
                    <CsInlineHelp
                        content={CsI18n.t("Models allow to enrich data of matching groups (set of products)")}/>
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
                                marketplace_id={this.marketplace_id}
                                is_update_mode={true}
                            />) : ''}
                        <FormLayout>
                            <FormLayout.Group>
                                <Stack wrap={false}>
                                    <Stack.Item fill>
                                        {mode === States.MODE_EDIT &&
                                        <ButtonGroup>
                                            <Button icon={DeleteMinor} onClick={this.deleteConfirmation}
                                                loading={status === States.STATUS_DELETING}
                                                disabled={status === States.STATUS_DELETING}
                                                destructive><CsI18n>Delete</CsI18n></Button>
                                            <Button icon={DuplicateMinor} onClick={this.duplicateConfirmation}><CsI18n>Duplicate</CsI18n></Button>
                                        </ButtonGroup>
                                            }
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
                            </FormLayout.Group>
                        </FormLayout>
                    </Card.Section>
                </Card.Section>
            </CsValidationForm>
        );
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

    renderCategory() {
        let {category, category2, group_id} = this.state.item;
        if(!group_id) {
            return null;
        }
        let marketplace_id = this.marketplace_id;

        return <Card.Section>
            <div className="model-category-field">
                <table>
                    <tbody>
                    <tr>
                        <th><Stack distribution='trailing'>
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
                        </Stack></th>
                        <td><ModelCategorySelect category={category} marketplace_id={marketplace_id} onSelect={this.handleSelectCategory('category')}/></td>
                    </tr>
                    <tr>
                        <th><Stack distribution='trailing'>
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
                        </Stack></th>
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
