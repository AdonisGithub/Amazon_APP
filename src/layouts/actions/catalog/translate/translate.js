import React from 'react'
import CsI18n from "../../../../components/csI18n"

import {
    Heading,
    Stack,
    Banner,
    Spinner,
    Layout,
    TextStyle,
    Button,
    Card,
    ResourceList, Tooltip, Icon,
    Select,
    Badge, Checkbox, Link, Pagination
} from '@shopify/polaris';

import ApplicationApiCall from "../../../../functions/application-api-call";
import shopifyContext from "../../../../context";
import CsErrorMessage from "../../../../components/csErrorMessage";
import Util from "../../../../helpers/Util"
import CsImageModal from '../../../../components/csImageModal'
import CsNoImage from "../../../../components/csNoImage";
import "../../actions.scss";

import TranslateConfirmModal from "./translateConfirmModal";
import TranslateDetailViewModal from "./translateDetailViewModal";
import {ErrorType} from "../../../../components/csErrorMessage/csErrorMessage";

const PREV_BTN = 1;
const NEXT_BTN = 2;

const DEFAULT_PAGE_COUNT = 50;
// const DEFAULT_PAGE_COUNT = 5;
const SELECT_PAGE_OPTIONS = [
    {label: 50, value: 50},
    {label: 100, value: 100},
    {label: 200, value: 200},
];

const SEARCH = 0;
const CANDIDATE = 1;

const STEP_NONE = 0;
const STEP_GET_STARTED = 1;
const STEP_WORK = 2;

export default class Translate extends React.Component {

    state = {
        //status
        step: STEP_NONE,
        loading: true,
        processing: false,
        searching: false,
        global_error: false,
        process_success: false,
        process_error: false,
        activeProductModalIndex: "",

        //search params
        translate_confirm_opened: false,
        translate_mode: 'all', //'select'
        total_count: 0,
        pages: 0,
        page: 1,
        max_page_loaded: 1,

        count_per_page: DEFAULT_PAGE_COUNT,
        search_keyword: '',
        search_collection_id: '',
        search_group_id: false,
        search_untranslated: false,

        searched_options: {},
        // search_untranslated_lang: '',

        //translate option
        store_language: 'en',
        lang_src: 'en',
        lang_dst: 'en',
        languages: [],

        //data
        search_list: [],
        candidate_list: [],
        refresh: true,

        //detail_view
        detail_view: null,
        open_detail_view: false,

        //value
        price: 0,
    }

    constructor(props) {
        super(props);
        this.initialState = Util.clone(this.state);
        this.shopify = shopifyContext.getShared();
        this.unMouted = false;
        this.collections = [{label: '', value: ''}];
        this.groups = [{label: '', value: ''}];
        this.cached_list = [];

        let initPath = this.shopify.getTab(3);
        if(initPath == 'translate') {
            this.state.step = STEP_GET_STARTED;
        }
    }

    componentWillMount() {
        require("./translate.scss");
        window.addEventListener('keypress', this.handleEnterKey);
    }

    componentWillUnmount() {
        this.unMouted = true;
        window.removeEventListener('keypress', this.handleEnterKey);
    }

    componentDidMount() {
        this.getParam();
    }

    handleEnterKey = (e) => {
        if (e.keyCode === 13 && !this.state.open_detail_view) {
            // console.log('Enter key')
            if (this.state.searchValue !== '' && !this.state.processing) {
                this.searchProduct(true);
            }
        }
    }

    getParam() {
        let configuration = this.shopify.getConfigurationSelected();
        let params = {configuration};
        ApplicationApiCall.get('/application/translate/get_param', params, this.cbGetParamSuccess, this.cbGetParamError, false);
    }

    cbGetParamSuccess = (json) => {
        // console.log("cbGetParamSuccess", json);
        let collections = [{label: 'Any', value: 'any'}];

        for (let collection of json.collections) {
            collections.push({label: collection.label, value: "" + collection.value});
        }
        this.collections = collections;

        if( json.groups && json.groups.length > 0 ) {

            // Sorting alphabetically
            json.groups.sort(function (a, b) {
                if (a.name < b.name) {
                    return -1;
                }
                if (a.name > b.name) {
                    return 1;
                }
                return 0;
            })

            this.groups = [ {label:"Any", value:0}, ...json.groups.map(a => { return {label: a.name, value: a.id}; })];
            console.log("groups", this.groups);
        }
        let process_success = false;
        let {price, is_triggered, store_language, languages} = json;
        languages = languages.map((language) => {
            return {label: language.name, value: language.code}
        });
        console.log("cbGetParamSuccess", languages, store_language, price);
        if(is_triggered) {
            process_success = CsI18n.t('Translating in the background, results will be available in Scheduler tab');
            let {candidate_list} = this.state;
            for(let item of candidate_list) {
                item.translating = true;
            }
            setTimeout(() => {
                this.setState({process_success: false});
            }, 3000);
        } else {
            process_success = false;
        }

        this.setState({loading: false, price, process_success, store_language, languages, lang_dst: store_language, lang_src: store_language});
    }

    cbGetParamError = (err) => {
        // console.log("cbGetParamError", err);
        this.setState({loading: false, global_error: err});
    }

    searchProduct(isNew = false) {
        let configuration = this.shopify.getConfigurationSelected();
        let {search_keyword, search_collection_id, search_group_id, search_untranslated, lang_dst, page, count_per_page} = this.state;
        if(isNew) {
            page = 1;
        }
        if (!search_untranslated) {
            lang_dst = '';
        }
        let params = {configuration, keyword: search_keyword, collection_id: search_collection_id,
            group_id: search_group_id,
            untranslated_lang: lang_dst, page, count_per_page};

        let searched_options = {
            keyword: search_keyword, collection_id: search_collection_id,
            group_id: search_group_id,
            untranslated_lang: lang_dst
        }
        this.setState({searched_options, searching: true});

        ApplicationApiCall.get('/application/translate/search', params, (json) => {
            this.cbSearchProductSuccess(json, isNew);
        }, this.cbSearchProductError,
        false);
    }

    addListCache(products) {
        this.cached_list = this.cached_list.concat(products);
    }

    resetListCache() {
        this.cached_list = [];
    }

    readListCache(page) {
        let list = [];
        let {count_per_page} = this.state;
        for(let i = 0; i < count_per_page; i++) {
            if(this.cached_list.length > i+(page-1) * count_per_page) {
                list.push(this.cached_list[i+(page-1) * count_per_page]);
            }
        }
        return list;
    }

    cbSearchProductSuccess = (json, isNew) => {
        console.info("cbSearchProductSuccess", json);

        if (!json || this.unMouted !== false) {
            return;
        }

        let {page, max_page_loaded, candidate_list} = this.state;
        let pages = json.pages ? parseInt(json.pages) : 0;
        let products = json.products ? json.products : [];
        if(isNew) {
            page = 1;
            max_page_loaded = 1;
            this.resetListCache();
        } else {
            max_page_loaded = page;
        }
        for(let item of products) {
            for(let candidate of candidate_list) {
                if(item.product_id == candidate.product_id) {
                    let candidate_count = Array.isArray(candidate.translated_lang)? candidate.translated_lang.length:0;
                    let new_count = Array.isArray(item.translated_lang)? item.translated_lang.length:0;
                    console.info("cbSearchProductSuccess", candidate.product_id, candidate_count, new_count);
                    if (candidate_count <= new_count) {
                        candidate.translated_lang = item.translated_lang;
                        candidate.translated_data = item.translated_data;
                        candidate.translating = false;
                    }
                    break;
                }
            }
        }

        this.addListCache(products);
        this.setState({
            total_count: json.total_count,
            search_list: products,
            candidate_list: candidate_list,
            pages: pages,
            page: page,
            max_page_loaded: max_page_loaded,
            refresh: false,
            searching: false,
            step: STEP_WORK
        });
    }

    cbSearchProductError = (err) => {
        // console.log(err);
        if (err && this.unMouted === false) {
            this.setState({global_error: err, searching: false})
        }
    }

    handleProductTranslate = () => {
        let products = [];
        let {lang_src, lang_dst, candidate_list, translate_mode, searched_options, total_count} = this.state;
        console.log("candidate_list", candidate_list);
        if (translate_mode == 'select') {
            candidate_list.map((item) => {
                // if (!Util.inArray(lang_dst, item.translated_lang)) {
                //     products.push(item.product_id);
                // }
                products.push(item.product_id);
            });
        }

        let configuration = this.shopify.getConfigurationSelected();
        let params = {configuration};
        let data = {translate_mode, products, lang_src: lang_src, lang_dst: lang_dst, configuration, searched_options, searched_count: total_count};
        ApplicationApiCall.post('/application/translate/translate', params, data, (json) => {
            this.cbProductTranslateSuccess(translate_mode, json)
        }, this.cbProductTranslateFail, false);

        this.setState({processing: true});
    }

    cbProductTranslateSuccess = (translate_mode, json) => {
        // console.log("cbProductTranslateSuccess", json);
        if(json.success) {
            if(json.is_admin) {
                let {lang_dst} = json;
                let process_success = CsI18n.t('Translating products in the background, results will be available in Scheduler tab');
                let {candidate_list, search_list} = this.state;
                if (translate_mode == 'all') {
                    for(let item of search_list) {
                        if (!Util.inArray(lang_dst, item.translated_lang)) {
                            item.translated_lang.push(lang_dst);
                        }
                        item.translating = true;
                    }
                }
                for(let item of candidate_list) {
                    if (!Util.inArray(lang_dst, item.translated_lang)) {
                        item.translated_lang.push(lang_dst);
                    }
                    item.translating = true;
                }
                setTimeout(() => {
                    this.setState({process_success: false});
                }, 3000);
                this.setState({processing: false, process_success: process_success, candidate_list});
            } else {
                Util.redirect(json.url);
            }
        } else {
            this.setState({processing: false, process_success: false,
                process_error: {type: ErrorType.CUSTOM, title: json.error_message}});
        }
    }

    cbProductTranslateFail = (err) => {
        console.error(err);
        this.setState({processing: false, process_success: false, process_error: err});
    }

    handleSearchChange = (value) => {
        this.setState({search_keyword: value});
    }

    handleCollectionChange = (value) => {
        // console.log("handleCollectionChange", value);
        this.setState({search_collection_id: value});
    }

    handleSearchBtnClick = () => {
        this.searchProduct(true);
    }

    handleAdd = (item) => () => {
        let {candidate_list} = this.state;
        candidate_list.push(item);
        // console.log("handleAdd", candidate_list);
        this.setState({
            candidate_list,
        });
    }

    handleAddAll = () => {
        let {search_list, candidate_list} = this.state;
        for(let item of search_list) {
            if(this.isExistingCandidate(item)) {
                continue;
            }

            candidate_list.push(item);
        }
        this.setState({
            candidate_list,
        });
    }

    handleRemove = (item) => () => {
        let {candidate_list} = this.state;
        for(let index in candidate_list) {
            if( candidate_list[index].product_id == item.product_id ) {
                candidate_list.splice(index, 1);
                this.setState({
                    candidate_list,
                });
                break;
            }
        }
    }

    handleRemoveAll = () => {
        this.setState({
            candidate_list: [],
        });
    }

    handleViewDetail = (item) => () => {
        this.setState({detail_view: item, open_detail_view: true});
    }

    cbSaveProductSuccess = (json, data) => {
        if(json.success) {

            let process_success = CsI18n.t('Translation saved');
            setTimeout(() => {
                this.setState({process_success: false});
            }, 3000);

            let {search_list, candidate_list} = this.state;
            for(let item of search_list) {
                item.translated_data = data.translated_data;
            }

            for(let item of candidate_list) {
                item.translated_data = data.translated_data;
            }
            this.setState({open_detail_view: false, detail_view: null, process_success: process_success, search_list, candidate_list});

        } else {
            this.setState({open_detail_view: false, detail_view: null, process_success: false,
                process_error: {type: ErrorType.CUSTOM, title: json.error_message}});
            setTimeout(() => {
                this.setState({process_error: false});
            }, 7000);
        }
    }

    cbSaveProductFail = (err) => {
        this.setState({open_detail_view: false, detail_view: null, process_error: err});
    }

    handleViewDetailModalSave = (data) => {
        let {translated_data, product_id} = data;
        let configuration = this.shopify.getConfigurationSelected();
        let params = {configuration};
        ApplicationApiCall.post('/application/translate/save_product', params,
            {translated_data, product_id},
            (json) => {this.cbSaveProductSuccess(json, data);},
            this.cbSaveProductFail,
            false
        );

    }

    handleViewDetailModalCancel = () => {
        this.setState({open_detail_view: false, detail_view: null});
    }

    isExistingCandidate(item) {
        let {product_id} = item;
        let {candidate_list} = this.state;
        let existing = false;

        for(let candidate of candidate_list) {
            if(candidate.product_id == product_id) {
                existing = true;
            }
        }
        return existing;
    }

    handleModalOk = () => {
        // console.log("handleModalOk");
        this.handleProductTranslate();
        this.setState({translate_confirm_opened: false});
    }

    handleModalCancel = () => {
        // console.log("handleModalCancel");
        this.setState({translate_confirm_opened: false})
    }

    getNoTranslatedCountOnCandidate() {
        let count = 0;
        let {candidate_list, lang_dst} = this.state;
        candidate_list.forEach(item => {
            if(!Util.inArray(lang_dst, item.translated_lang)) {
                count++;
            }
        });
        return count;
    }

    handleChangeOptionSrc = (value) => {
        this.setState({lang_src: value});
    }

    handleChangeOptionDst = (value) => {
        this.setState({lang_dst: value});
    }

    handlePageItemCountChange = (value) => {
        // this.setState({page_item_count: value});
        this.setState({processing: true, page_item_count: value}, this.refresh);
    }

    handlePaginationBtnClick = (btn) => () => {
        let {page, pages, max_page_loaded} = this.state;
        if (btn === PREV_BTN) {
            page--;
        } else {
            page++;
        }
        if(max_page_loaded >= page) {
            let list = this.readListCache(page);
            this.setState({search_list: list, page});
        } else {
            this.setState({page}, () => {this.searchProduct()});
        }
    }

    renderGetStarted()
    {
        let action = {
            content: CsI18n.t('Get started'),
            onAction: () => {
                this.setState({step: STEP_GET_STARTED});
            },
        };
        return(
            <Stack vertical>
                <Stack.Item>
                    <br />
                </Stack.Item>
                <Stack.Item>
                    <Banner
                        title={CsI18n.t("Translate automatically titles and descriptions")}
                        action={action}
                    >
                        <p>
                            <CsI18n>This feature uses AI to translate your products titles and descriptions to the
                                target language.</CsI18n><br/>
                            <CsI18n>When you will send your offers, the translation will be automatically sent.</CsI18n>
                        </p>
                    </Banner>
                </Stack.Item>
            </Stack>
        )
    }

    render() {
        // console.log(this.state)
        if(this.state.step == STEP_NONE) {
            return this.renderGetStarted();
        }

        if(this.state.loading) {
            return this.renderLoading();
        } else if(this.state.global_error) {
            return (this.renderError());
        }
        return (
            <div className="translate-page" id="translate_page">
                {this.renderListData()}
            </div>
        );
    }

    renderSearchOption() {
        // console.log("renderSearchOption", this.collections);
        let {languages, lang_src, lang_dst} = this.state;
        let filter_languages = languages;
        return (<div className="search-option mb-3">
            <div className={"mb-2"}>
                <Stack>
                    <Stack.Item><Select label={'Collection'} labelHidden={true}
                                        value={this.state.search_collection_id}
                                        options={this.collections}
                                        placeholder={CsI18n.t('Select a collection')}
                                        onChange={this.handleCollectionChange} /></Stack.Item>
                    <Stack.Item><Select label={"Matching Group"} labelHidden={true}
                                        value={this.state.search_group_id}
                                        options={this.groups}
                                        placeholder={CsI18n.t('Select a matching group')}
                                        onChange={(value) => {this.setState({search_group_id: parseInt(value)})}}
                    /></Stack.Item>
                    <Stack.Item fill>
                        <Stack distribution={"trailing"} alignment={"center"}>
                            <Stack.Item>
                                <div className={"select-language"}>
                                <Stack alignment={"center"}>
                                    <TextStyle><CsI18n>From</CsI18n></TextStyle>
                                    <Select label={"From"} labelHidden={true} options={languages} value={lang_src} onChange={this.handleChangeOptionSrc}/>
                                    <TextStyle><CsI18n>To</CsI18n></TextStyle>
                                    <Select label={"To"} labelHidden={true} error={lang_src == lang_dst} options={languages} value={lang_dst} onChange={this.handleChangeOptionDst}/>
                                </Stack>
                                </div>
                            </Stack.Item>
                            <Stack.Item>
                                <Checkbox label={CsI18n.t("Only the untranslated products")} checked={this.state.search_untranslated}
                                          onChange={(value) => {this.setState({search_untranslated: value})}}
                                />
                            </Stack.Item>
                            {/*<Stack.Item>*/}
                            {/*    <Select label={"Language"} labelHidden={true}*/}
                            {/*                    value={this.state.search_untranslated_lang}*/}
                            {/*                    disabled={!this.state.search_untranslated}*/}
                            {/*                    options={filter_languages}*/}
                            {/*                    placeholder={CsI18n.t('Select a language')}*/}
                            {/*                    onChange={(value) => {this.setState({search_untranslated_lang: value})}}*/}
                            {/*            />*/}
                            {/*</Stack.Item>*/}
                        </Stack>
                    </Stack.Item>

                </Stack>
            </div>
            <div className={"mb-3"}>
                <Stack>
                    <Stack.Item fill>
                        <ResourceList.FilterControl
                          searchValue={this.state.search_keyword}
                          onSearchChange={this.handleSearchChange}
                          additionalAction={{
                              content: CsI18n.t('Search'),
                              loading: this.state.searching,
                              disabled: this.state.searching || this.state.processing,
                              onAction: () => this.handleSearchBtnClick(),
                          }}
                        />
                    </Stack.Item>
                </Stack>
            </div>
        </div>);
    }

    renderTranslateOption() {
        // let count_no_translated = this.getNoTranslatedCountOnCandidate();
        let {languages, lang_src, lang_dst, total_count, translate_mode} = this.state;
        let selected_count = this.state.candidate_list.length;
        let count = translate_mode == 'all'? total_count:selected_count;
        return (
            <div className="convert-option mb-3">
                <Card>
                    <Card.Section>
                    <Stack distribution={"equalSpacing"} >
                        <Stack.Item>
                            <Button size="slim"
                                    loading={this.state.processing}
                                    disabled={total_count < 1 || lang_dst == lang_src}
                                    onClick={() => {
                                        this.setState({translate_mode: 'all', translate_confirm_opened: true});
                                    }}><CsI18n>Translate all</CsI18n></Button>
                        </Stack.Item>
                        <Stack.Item>
                            <Button size="slim"
                                    loading={this.state.processing}
                                    disabled={selected_count == 0 || this.state.searching || this.state.processing || lang_dst == lang_src}
                                    onClick={() => {
                                        this.setState({translate_mode: 'select', translate_confirm_opened: true});
                                    }}><CsI18n>Translate selection</CsI18n></Button>
                        </Stack.Item>
                    </Stack>
                        {this.state.translate_confirm_opened? <TranslateConfirmModal
                            onOk={this.handleModalOk}
                            onClose={this.handleModalCancel}
                            opened={this.state.translate_confirm_opened}
                            price={this.state.price}
                            count={count}
                        />:''}
                    </Card.Section>
                </Card>
            </div>
        )
    }

    renderError() {
        let type;
        let title = '';
        let message;

        if (this.state.process_error) {
            type = this.state.process_error.type;
            message = this.state.process_error.title;
        } else if (this.state.global_error) {
            type = this.state.global_error.type;
            title = this.state.global_error.title;
            message = this.state.global_error.message;
        }
        return (
            <div>
                <CsErrorMessage
                    errorType={type}
                    errorTitle={title}
                    errorMessage={message}
                />
                <br/>
            </div>
        )
    }

    renderLoading() {
        return (
            <Layout.Section>
                <div className="loading">
                    <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}/>
                </div>
            </Layout.Section>
        )
    }

    renderEmpty(type) {
        let {step} = this.state;
        let title;
        let message;
        let status;

        if (type === SEARCH) {
            if(step == STEP_GET_STARTED) {
                title = "No result";
                message = "Please search products!";
                status = 'new';
            } else {
                title = "No search result";
                message = "Sorry, you have no result yet!";
                status = 'warning';
            }
        } else if (type === CANDIDATE) {
            title = "Empty";
            message = "Please select the products to translate";
            status = 'info';
        }
        return (
            <div style={{margin: '1rem 0'}}>
                <Banner status={status} title={CsI18n.t(title)}>
                    <TextStyle><CsI18n>{message}</CsI18n></TextStyle>
                </Banner>
            </div>
        )
    }

    renderListData() {
        let notice;
        if (this.state.process_success) {
            notice = (
                <div>
                    <Banner status="success"
                            title={this.state.process_success}/>
                    <br/>
                </div>
            );
        } else if (this.state.process_error) {
            notice = this.renderError();
        }

        return (
            <div className="table">
                {this.renderSearchOption()}
                {this.renderTranslateOption()}
                {notice}
                <Layout>
                    <Layout.Section oneHalf>
                        <div className="search-list">{this.renderSearchResultTable()}</div>
                        {this.renderListFooter()}
                    </Layout.Section>
                    <Layout.Section oneHalf>
                        <div className="candidate-list">{this.renderCandidateListTable()}</div>
                    </Layout.Section>
                </Layout>
                {this.state.open_detail_view? <TranslateDetailViewModal
                    data={this.state.detail_view}
                    store_language={this.state.store_language}
                    languages={this.state.languages}
                    onSave={this.handleViewDetailModalSave}
                    onClose={this.handleViewDetailModalCancel}
                    opened={this.state.open_detail_view}
                />:null}
            </div>
        )
    }

    renderListFooter() {
        let {pages, page, searching} = this.state;
        let hasPrev = pages && page > 1;
        let hasNext = page < pages;
        if(pages <= 1) {
            return '';
        }
        return (
            <div className="product-pagination">
                <Pagination
                    hasPrevious={hasPrev && !searching}
                    onPrevious={this.handlePaginationBtnClick(PREV_BTN)}
                    hasNext={hasNext && !searching}
                    onNext={this.handlePaginationBtnClick(NEXT_BTN)}

                />
            </div>
        )
    }

    renderSearchResultTable() {
        let {search_list} = this.state;
        let rows = [];
        for(let item of search_list) {
            if(this.isExistingCandidate(item)) {
                continue;
            }
            rows.push(item);
        }
        let total_count = this.state.total_count;
        let showing_count = this.state.search_list.length;
        let selected_count = this.state.candidate_list.length;
        return (
            <div>
                <div>
                    <Stack alignment={"center"}>
                        <Stack.Item fill>
                            <Stack alignment={"center"}>
                                <Stack.Item><Heading><CsI18n>Search result</CsI18n></Heading></Stack.Item>
                                <Stack.Item>
                                    <Stack alignment={"center"}>
                                        <Stack.Item><span>{CsI18n.t('Total') + ": " + total_count}</span></Stack.Item>
                                        <Stack.Item><span>{CsI18n.t('Showing') + ": " + showing_count}</span></Stack.Item>
                                        <Stack.Item><span>{CsI18n.t('Selected') + ": " + selected_count}</span></Stack.Item>
                                    </Stack>
                                </Stack.Item>
                            </Stack>
                        </Stack.Item>
                        <Stack.Item><Button size="slim" onClick={this.handleAddAll} disabled={search_list.length == 0}><CsI18n>Add all</CsI18n></Button></Stack.Item>
                    </Stack>
                </div>
                <div>
                    {search_list.length === 0 ?
                        this.renderEmpty(SEARCH)
                        :
                        <ResourceList
                            items={rows}
                            renderItem={this.renderSearchListItem}
                            loading={this.state.searching}
                        />
                    }
                </div>
            </div>
        );
    }

    handleProductModal = (id) => () => {
        this.setState({activeProductModalIndex: id});
    }

    renderItem(item, index, list_type) {
        let {title, image_url, translated_lang, tags, vendor, product_type, translating, product_id} = item;
        let item_detail = '';
        for(let i of [product_id, vendor, product_type, tags]) {
            if (!i) {
                continue;
            }
            if(item_detail) {
                item_detail += " | " + i;
            } else {
                item_detail += i;
            }
        }

        let translated_lang_field = false;
        let has_translated_lang = false;
        if(translated_lang && translated_lang.length > 0) {
            translated_lang_field = [];
            for(let lang of translated_lang) {
                translated_lang_field.push(<Badge status={"success"} key={`badge_${product_id}_${lang}`}>{lang.toUpperCase()}</Badge>);
                has_translated_lang = true;
            }
        }

        return (<Stack wrap={false} spacing="tight">
            <Stack.Item>
                {image_url ?
                    <CsImageModal
                        title={title}
                        size="large"
                        alt={title}
                        active={this.state.activeProductModalIndex == (list_type + index)}
                        onToggle={this.handleProductModal(list_type + index)}
                        source={image_url}
                        source_large={image_url}
                        key={list_type+product_id}
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
                            <Stack spacing="tight">
                                <Stack.Item><TextStyle>{item_detail}</TextStyle></Stack.Item>
                            </Stack>
                        </div>
                    </Stack.Item>
                    {translated_lang_field? <Stack.Item><Stack>{translated_lang_field}</Stack></Stack.Item>:''}
                </Stack>
            </Stack.Item>
            <Stack.Item>
                <Stack vertical={true}>
                    {translating? <Stack.Item><Badge status="success"><CsI18n>Translating</CsI18n></Badge></Stack.Item>:''}
                    <Stack.Item>
                        {list_type == 'search'?
                            <Button size="slim" onClick={this.handleAdd(item)}><CsI18n>Add</CsI18n></Button>
                            :
                            <Button size="slim" onClick={this.handleRemove(item)}><CsI18n>Remove</CsI18n></Button>
                        }
                    </Stack.Item>
                    {!translating && has_translated_lang? <Stack.Item><Button size="slim" onClick={this.handleViewDetail(item)}><CsI18n>View</CsI18n></Button></Stack.Item>:null}
                </Stack>
            </Stack.Item>
        </Stack>);
    }

    renderSearchListItem = (item, index) => {
        return (
            <ResourceList.Item id={index}>
                {this.renderItem(item, index, 'search')}
            </ResourceList.Item>
        );
    }

    renderCandidateListTable() {
        let {candidate_list} = this.state;
        console.log("candidate_list", candidate_list);
        return (
            <div>
                <Stack>
                    <Stack.Item fill><Heading><CsI18n>Selected list</CsI18n></Heading></Stack.Item>
                    <Stack.Item><Button size="slim" onClick={this.handleRemoveAll} disabled={candidate_list.length == 0}><CsI18n>Remove all</CsI18n></Button></Stack.Item>
                </Stack>
                {candidate_list.length === 0 ?
                    this.renderEmpty(CANDIDATE)
                    :
                    <ResourceList
                        items={candidate_list}
                        renderItem={this.renderCandidateListItem}
                    />
                }
            </div>
        );
    }

    renderCandidateListItem = (item, index) => {
        return (
            <ResourceList.Item id={index} >
                {this.renderItem(item, index, 'candidate')}
            </ResourceList.Item>
        );
    }
}

