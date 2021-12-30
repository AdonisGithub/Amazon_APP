import React from 'react';
import Constants from "../../helpers/rules/constants";
import {CsValidationForm, CsValidation} from "../../components/csValidationForm";
import {
    Button,
    Card,
    Collapsible,
    Heading,
    FormLayout,
    ResourceList,
    Select,
    Stack,
    TextField, ButtonGroup, TextStyle, Icon, Link, Thumbnail, Checkbox, Layout, Banner, Spinner, RadioButton, Tooltip
} from "@shopify/polaris";
import {
    PlusMinor,
    DeleteMinor,
    DuplicateMinor,
    ChevronDownMinor,
    ChevronUpMinor,
    CircleInformationMajorMonotone
} from "@shopify/polaris-icons";
import CsI18n from "../../components/csI18n";
// import CsDatePicker from "../../components/csDatePicker";
import Util from "../../helpers/Util";
// import CsEmbeddedModal from "../../components/csEmbeddedModal";
import States from "../../helpers/rules/states";
import CsImageModal from "../../components/csImageModal";
import CsErrorMessage from "../../components/csErrorMessage";
import ApplicationApiCall from "../../functions/application-api-call";
import {ModelContext} from "./model-context";
import ShopifyContext from "../../context";
import CsConfirmModal from "../../components/csConfirmModal";
import CsNoImage from "../../components/csNoImage";
import CsInlineHelp from "../../components/csInlineHelp/csInlineHelp";
// import {Radio} from "antd";


const DEFAULT_PAGE_COUNT = 20;
export default class MatchingGroupForm extends States {

    static contextType = ModelContext;
    state = {
        status: States.STATUS_NORMAL,
        opendeletemodal: false,
        page_item_count: DEFAULT_PAGE_COUNT,
        search: [],
        search_started: false,
        search_count: 0,
        openedSearchResult: true,
        activeImageModalIndex: "",
        load_shopify_options: false,
        error: null,
    }

    condition = {id: 0, condition: 'c', rule: 0, value: 0};

    constructor(props) {
        super(props);
        console.log("constructor", this.props);

        this.new_condition = Util.clone(this.condition);
        this.state.mode = this.props.mode;
        this.state.items = this.props.items;
        this.state.item = this.props.items[this.props.current]? Util.clone(this.props.items[this.props.current]):null;

        this.shopify = ShopifyContext.getShared();

        this.initConfig();
    }

    componentWillReceiveProps(nextProps, nextContext) {
        // this.rules_parameters = nextProps.rules_parameters;
    }

    componentWillMount() {
        let {rulesParameter} = this.context;
        this.rules_parameters = rulesParameter;
        let {conditions} = this.state.item;
        if(conditions.length > 0) {
            this.shopify_options = [];
            this.searchProductOptions();
        } else {
            if(this.rules_parameters.shopify_options) {
                let shopify_options  = this.rules_parameters.shopify_options;
                shopify_options.sort((a, b) => {
                    return a > b? 1 : -1;
                });
                this.shopify_options = shopify_options;
            } else {
                this.shopify_options = false;
            }
        }
        this.has_model = this.checkModelExisting();
    }

    initConfig() {
        if (this.state.mode === States.MODE_ADD) {
            let item = {};
            let newId = 0;
            for(const group of this.props.items) {
                if( newId < group.id ) {
                    newId = group.id;
                }
            }
            item.id = newId + 1;
            item.marketplace_id = this.props.marketplace.MarketplaceId;
            item.groupName = '';
            item.conditions = [Util.clone(this.condition)];
            // item.options = ['with_barcode', 'without_barcode'];
            item.shopify_options = [];
            item.no_option = false; //means we have to select only product that has no variant.
            item.is_barcode_only = false;
            item.fromDate = null;
            item.is_update_mode = false;
            item.customSearch = '';
            item.disabled = false;
            this.state.item = item;
        } else {
            if( this.state.item.search ) {
                delete this.state.item.search;
            }
        }
        console.log("initConfig", this.state.item);
    }

    checkModelExisting() {
        if (this.state.mode === States.MODE_ADD) {
            return false;
        }
        //todo!!!
        return true;
    }

    handleChangeCondition = (field, index) =>
        (value) => {
            let {status, item} = this.state;

            status = States.STATUS_CHANGED;

            if (field === 'condition') {
                item.conditions[index]['rule'] = 0;
                item.conditions[index]['value'] = 0;
            }
            if (field === 'rule') {
                if (parseInt(item.conditions[index]['rule']) === 0)
                    item.conditions[index]['value'] = "";
                else
                    item.conditions[index]['value'] = 0;
            }
            item.conditions[index][field] = value;
            this.searchProductOptions();
            this.setState(state => ({
                ...state,
                status,
                item,
            }));
        }

    handleAddCondition = () => {
        let {status, item} = this.state;
        status = States.STATUS_CHANGED;
        item.conditions.push({...this.new_condition, id: item.conditions.length});
        this.searchProductOptions();
        this.setState(prevState => ({
            ...prevState,
            item,
            status,
        }));
    }

    handleDeleteCondition = index => {
        let {item, status} = this.state;

        status = States.STATUS_CHANGED;
        item.conditions = item.conditions.filter((item, i) => index !== i);
        let i = 0;
        item.conditions = item.conditions.map(item => ({...item, id: i++}));
        this.searchProductOptions();
        this.setState(state => ({
            ...state,
            status,
            item,
        }));
    };

    handleChangeOptions = (field) => (value) => {
        let {item, status} = this.state;
        status = States.STATUS_CHANGED;
        item[field] = value;

        this.setState(preState => ({
            ...preState,
            item,
            status
        }));
    }

    handlerClose = () => {
        const {onClose} = this.props;
        if (onClose === undefined)
            return;

        onClose();
    }

    handlerSave = (is_edit_model = false) => () => {
        if (CsValidationForm.validate("matchingGroupForm") === false)
            return;

        let {items} = this.state;
        console.log(items);
        items[this.props.current] = this.state.item;

        let group_id = this.state.item.id;
        let is_update_mode = this.state.item.is_update_mode;

        //clear cache data in context
        let cache_group = `g${group_id}`;
        if (is_update_mode) {
            this.context.dataDefinitionForUpdate[cache_group] = [];
        } else {
            this.context.dataDefinition[cache_group] = [];
        }


        const {onSave} = this.props;
        if (onSave === undefined)
            return;
        if (is_edit_model) {
            onSave(items, null, this.cbSaveError, is_edit_model);
        } else {
            onSave(items, this.cbSaveDone, this.cbSaveError, is_edit_model);
        }
        this.setState({status: States.STATUS_SAVING});
    }

    handleDuplicated() {
        var valueArr = this.state.items.map(item => {
            return item.groupName
        }); //// fixed the error @kbug_190106

        var isDuplicate = valueArr.some(function (item, idx) {
            return valueArr.indexOf(item) != idx
        });
        if (isDuplicate) {
            this.setState({status: States.STATUS_DUPLICATED});
            return (true);
        }
        return (false);
    }


    searchProductOptions() {
        let configuration = this.props.configuration;
        let {...data} = {...this.state.item};
        ApplicationApiCall.post('/application/groups/product_options', {configuration}, data,
            (json) => {
                console.log("searchProductOptions result", json);
                this.cbSearchProductOptionSuccess(json);
            }, (err) => {
                console.log("doSearchError", err);
                this.cbSearchProductOptionError(err);
            });
        this.setState({load_shopify_options: true});
    }

    cbSearchProductOptionSuccess = (json) => {
        console.log(json);

        if (json) {
            this.shopify_options = json.shopify_options;
            let {shopify_options} = this.state.item;
            if (shopify_options) {
                shopify_options = shopify_options.filter((option) => {
                    return this.shopify_options.indexOf(option) > -1;
                });
            } else {
                shopify_options = [];
            }
            this.handleChangeOptions('shopify_options')(shopify_options);
        }
        this.setState({load_shopify_options: false});
    }

    cbSearchProductOptionError = (err) => {
        if (err) {
            this.setState({load_shopify_options: false});
        }
    }

    handleSearch = (isNew) => () => {
        console.log("handleSearch", this.state.item);
        let {item, search, search_count, page_item_count} = this.state;

        if ( (isNew === false && search.length < search_count)
         || isNew ) {
            let {...data} = {...this.state.item};
            let limit_from = isNew? 0: search.length;
            let limit_to = page_item_count;
            let q = item.customSearch;

            let configuration = this.props.configuration;

            let marketplace_id = this.props.marketplace.MarketplaceId;
            let params = {q, limit_from, limit_to, configuration, marketplace_id};

            ApplicationApiCall.post('/application/groups/products', params, data,
                (json) => {
                    console.log("doSearchSuccess", json);
                    this.cbSearchSuccess(isNew, json);
                }, (err) => {
                    console.log("doSearchError", err);
                    this.cbSearchError(err);
                });

            if(isNew) {
                search = [];
                this.setState({search_started: true, item: item, search: search, status: States.STATUS_SEARCHING});
            } else {
                this.setState({search_started: true, status: States.STATUS_SEARCHING});
            }
        }
    };

    cbSearchSuccess = (isNew, json) => {
        console.log(json);
        let {search} = this.state;

        if (json) {
            search = search.concat(json.products);
            this.setState({search, search_count: parseInt(json.count), status: States.STATUS_CHANGED});
        }
    }

    cbSearchError = (err) => {
        if (err) {
            // setTimeout(() => {
            //     this.setState({status: States.STATUS_NORMAL, error: null})
            // }, 5000);

            this.setState({status: States.STATUS_ERROR, error: err});
        }
    }

    handleToggleClick = () => {
        this.setState(({openedSearchResult}) => ({openedSearchResult: !openedSearchResult}))
    }

    handleImageModal = (id) => () => {
        this.setState({activeImageModalIndex: id});
    }

    isSelectedOption(selected_options, value) {
        if(!selected_options) {
            return false;
        }
        return selected_options.includes(value);
    }

    handleSelectOption = (option) => (value) => {
        let {shopify_options} = this.state.item;
        if(value) {
            if(!shopify_options) {
                shopify_options = [];
            }
            shopify_options.push(option);
        } else {
            const index = shopify_options.indexOf(option);
            if (index > -1) {
                shopify_options.splice(index, 1);
            }
        }
        this.handleChangeOptions('shopify_options')(shopify_options);
    }

    handleProductMode = (checked, value) => {
        console.log(checked, value);
        let is_update_mode = false;
        if (value == 'product_mode_update') {
            is_update_mode = checked;
        }
        this.handleChangeOptions('is_update_mode')(is_update_mode);
    }

    renderLoading() {
        return(
            <div align="center">
                <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")} />
            </div>
        );
    }

    renderShopifyOptions() {
        let {shopify_options: selected_shopify_options, no_option, is_barcode_only} = this.state.item;
        let shopify_options_field = false;
        //
        // if (this.shopify_options && !this.shopify_options.length)
        //     return null;

        if(this.shopify_options) {
            shopify_options_field = [];
            this.shopify_options.forEach((item) => {
                shopify_options_field.push((
                    <Stack.Item key={item}>
                        <Checkbox label={item} value={false}
                                  checked={this.isSelectedOption(selected_shopify_options, item)} disabled={no_option}
                                  onChange={this.handleSelectOption(item)} key={`option_${item}`}/>
                    </Stack.Item>
                ));
            });
        }
        let group_products_text = '';

        if (shopify_options_field !== false && this.shopify_options.length)
            group_products_text =
                <Stack.Item>
                    <span style={{position: 'relative', top: '4px'}}>&nbsp;or group products depending on their options sets:</span>
                </Stack.Item>

        let options_title =
            <Stack>
                <Stack.Item>
                    <span className={'Polaris-Subheading'}><CsI18n>Options</CsI18n></span>
                </Stack.Item>
                <Stack.Item>
                    <Tooltip
                        content={CsI18n.t("Please create one matching group per variation, eg: one for Size, another one for Size/Color")}>
                                            <span className={"help-tooltip"}>
                                                <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                            </span>
                    </Tooltip>
                </Stack.Item>
                <Stack.Item fill>
                    &nbsp;
                </Stack.Item>
            </Stack>

        let options_display;
        if (this.state.load_shopify_options) {
            options_display = this.renderLoading();
        } else {
            options_display = shopify_options_field?(<Stack>
                <Stack.Item>
                    <Checkbox label={CsI18n.t('Products without Variants only')} value={false} checked={no_option}
                              onChange={this.handleChangeOptions('no_option')}/>
                </Stack.Item>

                {group_products_text}

                <Stack.Item>
                    <Stack>{shopify_options_field}</Stack>
                </Stack.Item>
            </Stack>):null
        }

        return (<Card.Section title={options_title}>
                <div><Checkbox label={CsI18n.t('Products with barcodes only')} value={false} checked={is_barcode_only}
                               onChange={this.handleChangeOptions('is_barcode_only')}/></div>
                {options_display}
            </Card.Section>);
    }

    renderEmpty() {
        let message;
        if(this.state.search_message){
            message = this.state.search_message;
        }else{
            message = 'No products found'
        }
        return (
            <Card.Section>
                <Banner status="warning" title={CsI18n.t("No product")}>
                    <TextStyle><CsI18n>{message}</CsI18n></TextStyle>
                </Banner>
            </Card.Section>
        )
    }

    render() {
        console.log(this.state);

        let contextual_message;
        let {status, mode, search, search_started, search_count, openedSearchResult} = this.state;
        let {groupName, conditions, options, fromDate, customSearch, is_update_mode} = this.state.item;

        // const no_image_url = this.shopify.static_content + '/amazon/no-image.png';

        if (status === States.STATUS_ERROR) {
            contextual_message = this.renderError();
        } else if (status === States.STATUS_DUPLICATED) {
            contextual_message = Constants.must_be_unique;
        } else if (status === States.STATUS_SAVED) {
            contextual_message = Constants.matching_saved_successfully;
        }
        let title = <CsI18n marketplace_name={this.props.marketplace.Name}>
            {mode === States.MODE_EDIT? 'Edit matching group for {{marketplace_name}}':'New matching group for {{marketplace_name}}'}</CsI18n>;

        let is_create_mode = !!!is_update_mode;

        let other_filters =
            <Stack>
                <Stack.Item>
                    <span className={'Polaris-Subheading'}><CsI18n>Other Filters</CsI18n></span>
                </Stack.Item>
                <Stack.Item>
                    <Tooltip
                        content={CsI18n.t("You can search for a keyword in the title. It will be applied for new products as well.")}>
                                            <span className={"help-tooltip"}>
                                                <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                            </span>
                    </Tooltip>
                </Stack.Item>
                <Stack.Item fill>
                    &nbsp;
                </Stack.Item>
            </Stack>

        return (
            <CsValidationForm name="matchingGroupForm">
                <Card.Section >
                    <Heading size="large"></Heading>
                    {contextual_message}
                    <Card.Section title={CsI18n.t("Group Name")}>
                        <FormLayout>
                            <FormLayout.Group>
                                <CsValidation>
                                    <TextField
                                        value={groupName}
                                        placeholder={CsI18n.t("Electronic devices")}
                                        onChange={this.handleChangeOptions('groupName')}
                                        pattern="[ -~]*"
                                        maxLength="200"
                                    />
                                    {Constants.validation_name_required}
                                    {Constants.validation_name_max_length}
                                    {Constants.validation_name_pattern}
                                </CsValidation>
                            </FormLayout.Group>
                        </FormLayout>
                    </Card.Section>
                    <Card.Section title={CsI18n.t("Purpose")}>
                        <FormLayout>
                            <FormLayout.Group>
                                <Stack spacing="loose">
                                    <Stack.Item>
                                        <RadioButton label={CsI18n.t('Products Creation')} id="product_mode_create"
                                                     name={"product_mode"} checked={is_create_mode}
                                                     disabled={mode == States.MODE_EDIT}
                                                     onChange={this.handleProductMode}/></Stack.Item>
                                    <Tooltip
                                        content={CsI18n.t("If you intend to create products that do not exist on Amazon")}>
                                                <span className={"help-tooltip"}>
                                                    <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                                </span>
                                    </Tooltip>

                                    <Stack.Item>
                                        <RadioButton label={CsI18n.t('Products Update')} id="product_mode_update"
                                                     name={"product_mode"} checked={!is_create_mode}
                                                     disabled={mode == States.MODE_EDIT}
                                                     onChange={this.handleProductMode}/></Stack.Item>
                                    <Tooltip content={CsI18n.t("If you intend to update existing products on Amazon")}>
                                            <span className={"help-tooltip"}>
                                                <Icon source={CircleInformationMajorMonotone} color={"green"}/>
                                            </span>
                                    </Tooltip>
                                </Stack>



                            </FormLayout.Group>
                        </FormLayout>
                    </Card.Section>
                    <Card.Section title={CsI18n.t("Conditions")}>
                        <ResourceList
                            resourceName={{singular: 'condition', plural: 'conditions'}}
                            items={conditions}
                            renderItem={this.renderSearchConditionLine}
                        />
                    </Card.Section>
                    {this.renderShopifyOptions()}
                    <Card.Section title={other_filters}>
                        <Stack>
                            <Stack.Item fill>
                                <FormLayout>
                                    <FormLayout.Group condensed >
                                        <TextField
                                            value={customSearch}
                                            label={CsI18n.t("Custom search")}
                                            placeholder={CsI18n.t("Wifi")}
                                            onChange={this.handleChangeOptions('customSearch')}
                                        />
                                    </FormLayout.Group>
                                </FormLayout>
                            </Stack.Item>
                        </Stack>
                        <br/>

                        <Stack distribution="trailing" alignment="trailing">
                            <Stack.Item>
                                <Button loading={status === States.STATUS_SEARCHING}
                                        onClick={this.handleSearch(true)}><CsI18n>Search</CsI18n></Button>
                            </Stack.Item>
                        </Stack>
                    </Card.Section>
                    {(search && search.length) ?
                        <Card.Section title={CsI18n.t("Search result")}>
                            <div className="expand-search-result">
                                <Link onClick={this.handleToggleClick}>
                                    <Stack.Item>
                                        <Icon source={openedSearchResult ? ChevronUpMinor : ChevronDownMinor}/>
                                    </Stack.Item>
                                </Link>
                            </div>
                            <Collapsible open={openedSearchResult}>
                                <ResourceList
                                    items={search}
                                    renderItem={this.renderSearchResultLine}
                                />
                                {search.length < search_count ?
                                    <Stack distribution="center" alignment="center">
                                        <Stack.Item>
                                            <Button loading={status === States.STATUS_SEARCHING && search_count !== 0}
                                                    onClick={this.handleSearch(false)}
                                                    size="slim"><CsI18n>More</CsI18n></Button>
                                        </Stack.Item>
                                    </Stack> : ""}
                            </Collapsible>
                        </Card.Section> : (search_started && status != States.STATUS_SEARCHING)? this.renderEmpty():null}
                </Card.Section>

                <Card.Section>
                    <CsConfirmModal mode={CsConfirmModal.MODE_DELETE}
                                    onClose={this.handleToggleModal}
                                    onOK={this.handlerDelete}
                                    opened={this.state.opendeletemodal}
                                    title={"Delete"}
                                    message={Constants.text_safe_to_delete}
                    />
                    {mode !== States.MODE_EDIT &&
                    <CsInlineHelp
                        content={CsI18n.t("Matching groups allow to create a set of products having the same characteristics for instance to group all T-Shirts with short sleeves from a same brand.")}/>}
                    <FormLayout>
                        <FormLayout.Group>
                            <Stack wrap={false}>
                                <Stack.Item>
                                    {mode === States.MODE_EDIT &&
                                    <Button icon={DeleteMinor} onClick={this.deleteConfirmation}
                                            loading={status === States.STATUS_DELETING}
                                            disabled={status === States.STATUS_DELETING}
                                            destructive><CsI18n>Delete</CsI18n></Button>}
                                </Stack.Item>
                                <Stack.Item fill>
                                    {/*{this.has_model &&*/}
                                    {/*<Button icon={DuplicateMinor} onClick={this.duplicateConfirmation}*/}
                                    {/*        loading={status === States.STATUS_DELETING}*/}
                                    {/*        disabled={status === States.STATUS_DELETING}*/}
                                    {/*        ><CsI18n>Duplicate Matching group & Model</CsI18n></Button>}*/}
                                </Stack.Item>
                                <Stack.Item>
                                    <ButtonGroup>
                                        <Button onClick={this.handlerClose}><CsI18n>Back</CsI18n></Button>
                                        <Button onClick={this.handlerSave(false)} loading={status === States.STATUS_SAVING}
                                                disabled={status === States.STATUS_SAVING || status === States.STATUS_SAVED || status === States.STATUS_NORMAL}
                                                primary><CsI18n>Save</CsI18n></Button>
                                        <Button onClick={this.handlerSave(true)} loading={status === States.STATUS_SAVING}
                                                disabled={status === States.STATUS_SAVING || status === States.STATUS_SAVED || status === States.STATUS_NORMAL}
                                                primary><CsI18n>Save & Edit Model</CsI18n></Button>
                                    </ButtonGroup>
                                </Stack.Item>
                            </Stack>
                        </FormLayout.Group>
                    </FormLayout>
                </Card.Section>
            </CsValidationForm>
        )
    }

    renderSearchConditionLine = (item, index) => {
        let {id, condition, rule, value} = item;

        let empty_item = [
            {label: '', value: 0, disabled: true},
            {label: 'Any', value: 'Any'},
        ];
        let condition_items;
        const rules_conditions = Constants.rules_conditions;

        switch (item.condition) {
            case 'c':
                condition_items = empty_item.concat(this.rules_parameters.collections);
                break;
            case 'p':
                condition_items = empty_item.concat(this.rules_parameters.product_types);
                break;
            case 't':
                condition_items = empty_item.concat(this.rules_parameters.tags);
                break;
            case 'v':
                condition_items = empty_item.concat(this.rules_parameters.vendors);
                break;
            default:
                condition_items = [{label: '', value: 0, disabled: true}];
                break;
        }

        let rules_rules;
        switch(item.condition) {
            case 't':
                rules_rules = Constants.rules_rules_contains;
                if(rule == Constants.RULE_EQUAL) {
                    rule = Constants.RULE_CONTAINS;
                } else if (rule == Constants.RULE_NOT_EQUAL) {
                    rule = Constants.RULE_NOT_CONTAINS;
                }
                break;
            default:
                rules_rules = Constants.rules_rules_std;
        }
// console.log(condition_items)
        return (
            <ResourceList.Item
                id={index}
            >
                <Stack wrap={false} fill key={index}>
                    <Stack.Item fill>
                        <FormLayout>
                            <FormLayout.Group condensed>
                                <Select
                                    label={"When"}
                                    labelHidden={true}
                                    options={rules_conditions}
                                    onChange={this.handleChangeCondition('condition', index)}
                                    value={condition}
                                />
                                <Select
                                    label={"rule"}
                                    labelHidden={true}
                                    options={rules_rules}
                                    onChange={this.handleChangeCondition('rule', index)}
                                    value={parseInt(rule)}
                                />
                                {
                                    (parseInt(rule) === Constants.RULE_EQUAL || parseInt(rule) === Constants.RULE_NOT_EQUAL)
                                        ? (<Select
                                            label={"value"}
                                            labelHidden={true}
                                            options={condition_items}
                                            onChange={this.handleChangeCondition('value', index)}
                                            value={value}
                                        />)
                                        :
                                        (<TextField
                                            label={"value"}
                                            labelHidden={true}
                                            value={value === 0 ? "" : value}
                                            onChange={this.handleChangeCondition('value', index)}
                                        />)
                                }
                            </FormLayout.Group>
                        </FormLayout>
                    </Stack.Item>
                    <Stack.Item distribution="trailing">
                        {parseInt(id) === 0 && (
                            <Button icon={PlusMinor} onClick={this.handleAddCondition}/>
                        )}
                        {parseInt(id) > 0 && (
                            <Button icon={DeleteMinor}
                                    onClick={() => this.handleDeleteCondition(index)}/>
                        )}
                    </Stack.Item>

                </Stack>
            </ResourceList.Item>

        );
    }

    renderSearchResultLine = (item, index) => {
        const {product_id, sku, vendor, title, product_type, shopify_image_url, on_marketplaces, barcode, available, price, collection_id, tags, updated_at} = item;
        let option_field = this.buildProductOption(item);
        let tag_field = null;

        if (tags && tags.length) {
            tag_field = tags.length > 256 ? tags.substring(0, 256) : tags;
        }
        console.log(item);
        return (
            <ResourceList.Item
                id={index}
            >
                <Stack wrap={false} spacing="tight">
                    <Stack.Item>
                        {shopify_image_url ?
                            <CsImageModal
                                title={title}
                                size="large"
                                alt={title}
                                active={this.state.activeImageModalIndex == index}
                                source={shopify_image_url}
                                onToggle={this.handleImageModal(index)}
                            />
                            :
                            <CsNoImage alt={title}/>
                        }
                    </Stack.Item>
                    <Stack.Item fill>
                        <Stack vertical spacing="extraTight">
                            <Stack.Item>
                                <TextStyle variation="strong">{title}</TextStyle>
                            </Stack.Item>
                            <Stack.Item>
                                <div className="display-link">
                                    <Stack spacing="tight" vertical={true}>
                                        <Stack.Item><TextStyle>{vendor + " | " + sku + " | " + barcode}</TextStyle></Stack.Item>
                                        {option_field? <Stack.Item><TextStyle>{option_field}</TextStyle></Stack.Item>:null}
                                        {tag_field ? <Stack.Item><TextStyle
                                            variation="subdued">Tags: {tag_field}</TextStyle></Stack.Item> : null}
                                        {product_type ? <Stack.Item><TextStyle variation="subdued">Product
                                            type: {product_type}</TextStyle></Stack.Item> : null}
                                    </Stack>
                                </div>
                            </Stack.Item>

                        </Stack>
                    </Stack.Item>
                </Stack>
            </ResourceList.Item>
        );
    }

    buildProductOption(product) {
        let {option1, option2, option3, product_options} = product;
        let option_field = '';
        if(option1 && product_options && product_options.option1) {
            option_field = `${product_options.option1}: ${option1}`;
        } else {
            return null
        }
        if(option2 && product_options && product_options.option2) {
            option_field += ` / ${product_options.option2}: ${option2}`;
        }
        if(option3 && product_options && product_options.option3) {
            option_field += ` / ${product_options.option3}: ${option3}`;
        }
        return option_field;
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
