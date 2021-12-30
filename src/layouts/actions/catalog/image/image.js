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
    Badge, Checkbox, Link, Pagination, TextField
} from '@shopify/polaris';

import {ChevronDownMinor, ChevronUpMinor, ViewMinor} from "@shopify/polaris-icons";

import ApplicationApiCall from "../../../../functions/application-api-call";
import shopifyContext from "../../../../context";
import CsErrorMessage from "../../../../components/csErrorMessage";
import Util from "../../../../helpers/Util"
import CsImageModal from '../../../../components/csImageModal'
import CsNoImage from "../../../../components/csNoImage";
import "../../actions.scss";
import "./image.scss";
import ImageConvertConfirmModal from "./imageConvertConfirmModal";
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

class Image extends React.Component {

    state = {
        //status
        step: STEP_NONE,
        loading: true,
        processing: false,
        searching: false,
        global_error: false,
        process_success: false,
        process_error: false,
        activeImageModalIndex: "",

        //search params
        opened: false,
        pages: 0,
        page: 1,
        max_page_loaded: 1,

        count_per_page: DEFAULT_PAGE_COUNT,
        search_keyword: '',
        search_collection_id: '',
        search_group_id: false,
        search_is_main_image: false,
        //convert option
        option_update_shopify: false,
        option_crop_margin: false,
        option_crop_margin_value: 10,

        //data
        search_list: [],
        candidate_list: [],
        refresh: true,

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
        //this.init();
        let initPath = this.shopify.getTab(3);
        if(initPath == 'image') {
            this.state.step = STEP_GET_STARTED;
        }
    }

    componentWillMount() {
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
        if (e.keyCode === 13) {
            // console.log('Enter key')
            if (this.state.searchValue !== '' && !this.state.processing) {
                this.searchProductImage(true);
            }
        }
    }

    getParam() {
        let configuration = this.shopify.getConfigurationSelected();
        let params = {configuration};
        ApplicationApiCall.get('/application/image/get_param', params, this.cbGetParamSuccess, this.cbGetParamError, false);
    }

    cbGetParamSuccess = (json) => {
        if (this.unMouted) {
            return;
        }
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
        if(json.is_triggered) {
            process_success = CsI18n.t('Converting images in the background, results will be available in Scheduler tab');
            let {candidate_list} = this.state;
            for(let item of candidate_list) {
                item.converted = true;
            }
            setTimeout(() => {
                this.setState({process_success: false});
            }, 3000);
        } else {
            process_success = false;
        }

        let price = json.price;
        this.setState({loading: false, price, process_success});
    }

    cbGetParamError = (err) => {
        // console.log("cbGetParamError", err);
        this.setState({loading: false, global_error: err});
    }

    searchProductImage(isNew = false) {
        this.setState({searching: true});
        let configuration = this.shopify.getConfigurationSelected();
        let {search_keyword, search_collection_id, search_group_id, search_is_main_image, page, count_per_page} = this.state;
        if(isNew) {
            page = 1;
        }
        let params = {configuration, keyword: search_keyword, collection_id: search_collection_id, group_id: search_group_id, is_main_image: search_is_main_image? 1:0, page, count_per_page};

        ApplicationApiCall.get('/application/image/search', params, (json) => {
            this.cbSearchProductImageSuccess(json, isNew);
        }, this.cbSearchProductImageError,
        false);
    }

    addListCache(images) {
        this.cached_list = this.cached_list.concat(images);
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

    cbSearchProductImageSuccess = (json, isNew) => {
        console.info("cbSearchProductImageSuccess", json);

        if (json && this.unMouted === false) {
            let {page, max_page_loaded, candidate_list} = this.state;
            let pages = json.pages ? parseInt(json.pages) : 0;
            let images = json.images ? json.images : [];
            if(isNew) {
                page = 1;
                max_page_loaded = 1;
                this.resetListCache();
            } else {
                max_page_loaded = page;
            }
            for(let item of images) {
                for(let candidate of candidate_list) {
                    if(item.image_id == candidate.image_id) {
                        candidate.src_converted = item.src_converted;
                    }
                }
            }
            this.addListCache(images);
            this.setState({
                search_list: images,
                candidate_list: candidate_list,
                pages: pages,
                page: page,
                max_page_loaded: max_page_loaded,
                refresh: false,
                searching: false,
                step: STEP_WORK
            });
        }
    }

    cbSearchProductImageError = (err) => {
        // console.log(err);
        if (err && this.unMouted === false) {
            this.setState({global_error: err, searching: false})
        }
    }

    handleImageConvert = () => {
        let images = [];
        this.state.candidate_list.map((item) => {
            if (!item.converted) {
                images.push(item);
            }
        });
        let {option_update_shopify: update_shopify, option_crop_margin: crop_margin, option_crop_margin_value: crop_margin_value} = this.state;

        let options = {update_shopify, crop_margin, crop_margin_value};

        let configuration = this.shopify.getConfigurationSelected();
        let params = {configuration};
        let data = {images, options};
        ApplicationApiCall.post('/application/image/convert', params, data, this.cbImageConvertSuccess, this.cbImageConvertFail, false);

        this.setState({processing: true});
    }

    cbImageConvertSuccess = (json) => {
        // console.log("cbImageConvertSuccess", json);
        if(json.success) {
            if(json.is_admin) {
                let process_success = CsI18n.t('Converting images in the background, results will be available in Scheduler tab');
                let {candidate_list} = this.state;
                for(let item of candidate_list) {
                    item.converted = true;
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

    cbImageConvertFail = (err) => {
        console.error(err);
        this.setState({processing: false, process_success: false, process_error: err});
    }

    handlePutOnShopify = async () => {
        let images = [];
        this.state.candidate_list.map((item) => {
            if (item.converted && !item.synced && item.src_converted) {
                images.push(item);
            }
        });

        let configuration = this.shopify.getConfigurationSelected();
        let success_count = 0;
        let total_count = images.length;
        this.setState({processing: true});
        await Util.asyncForChunk(images, 2, async sub_images => {
            let params = {configuration};
            let data = {images: sub_images};
            let res = await ApplicationApiCall.asyncPost('/application/image/put_shopify', params, data);
            // let res = {success: true}
            if(res.success) {
                success_count += this.cbPutOnShopifySuccess(res);
            } else {

            }
            // console.log("importProducts- result", res);
        });

        if(total_count == success_count) {
            let process_success = CsI18n.t('Images are successfully updated to Shopify.');
            this.setState({processing: false, process_success});
        } else {
            let process_error = CsI18n.t('Updating to Shopify is failed');
            this.setState({processing: false, process_error: {type: ErrorType.CUSTOM, title: process_error}});
        }
    }

    cbPutOnShopifySuccess = (json) => {
        // console.log("cbPutOnShopifySuccess", json);
        let {candidate_list, search_list} = this.state;
        let count = 0;
        for(let item of json.items) {
            if(!item.success) {
                continue;
            }
            count++;
            for(let candidate of candidate_list) {
                if(item.image_id == candidate.image_id) {
                    candidate.image_id = item.new_image_id;
                    candidate.src = candidate.src_converted;
                    candidate.src_converted_org = candidate.src_converted;
                    candidate.synced = true;
                }
            }
            for(let candidate of search_list) {
                if(item.image_id == candidate.image_id) {
                    candidate.image_id = item.new_image_id;
                    candidate.src = candidate.src_converted;
                    candidate.src_converted_org = candidate.src_converted;
                    candidate.synced = true;
                }
            }
        }
        this.setState({candidate_list, search_list});
        return count;
    }

    handleSearchChange = (value) => {
        this.setState({search_keyword: value});
    }

    handleCollectionChange = (value) => {
        // console.log("handleCollectionChange", value);
        this.setState({search_collection_id: value});
    }

    handleSearchBtnClick = () => {
        this.searchProductImage(true);
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
            let {converted, synced} = item;
            if(converted && synced) {
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
            if( candidate_list[index].image_id == item.image_id ) {
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

    isExistingCandidate(item) {
        let {image_id} = item;
        let {candidate_list} = this.state;
        let existing = false;

        for(let candidate of candidate_list) {
            if(candidate.image_id == image_id) {
                existing = true;
            }
        }
        return existing;
    }

    handleModalOk = () => {
        // console.log("handleModalOk");
        this.handleImageConvert();
        this.setState({opened: false});
    }

    handleModalCancel = () => {
        // console.log("handleModalCancel");
        this.setState({opened: false})
    }

    getNoConvertedCountOnCandidate() {
        let count = 0;
        let {candidate_list} = this.state;
        candidate_list.forEach(item => {
            if (!item.converted) {
                count++;
            }
        });
        return count;
    }

    getNoSyncedCountOnCandidate() {
        let count = 0;
        let {candidate_list} = this.state;
        candidate_list.forEach(item => {
            if (item.converted && !item.synced && item.src_converted) {
                count++;
            }
        });
        return count;
    }

    handleOptionCheck = (value) => {
        this.setState({option_update_shopify: value});
    }

    handleOptionCropMargin = (value) => {
        this.setState({option_crop_margin: value});
    }

    handleOptionCropMarginValue = (value) => {
        this.setState({option_crop_margin_value: value});
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
            this.setState({page}, () => {this.searchProductImage()});
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
                        title={CsI18n.t("Images background remover\n")}
                        action={action}
                    >
                        <p>
                            <CsI18n>Amazon requires to have images on a neutral or white background.</CsI18n><br />
                            <CsI18n>This bot will update your images to comply with this restriction.</CsI18n>
                        </p>
                    </Banner>
                </Stack.Item>
                <Stack.Item>
                    <br />
                </Stack.Item>
            </Stack>
        )
    }

    render() {
        // console.log(this.state)
        if(this.state.step == STEP_NONE) {
            return this.renderGetStarted();
        }

        let count_no_converted = this.getNoConvertedCountOnCandidate();
        let count_no_synced = this.getNoSyncedCountOnCandidate();
        if(this.state.loading) {
            return this.renderLoading();
        } else if(this.state.global_error) {
            return (this.renderError());
        }
        return (
            <div className="image-page" id="image_page">
                {this.state.opened? <ImageConvertConfirmModal
                    onOk={this.handleModalOk}
                    onClose={this.handleModalCancel}
                    opened={this.state.opened}
                    price={this.state.price}
                    count={count_no_converted}
                />:''}
                {this.renderListData()}
            </div>
        );
    }

    renderSearchOption() {
        // console.log("renderSearchOption", this.collections);
        console.log("renderSearchOption", this.state, this.groups);
        return (<div className="search-option mb-3">
            <div className={"mb-2"}>
                <Stack alignment={"center"}>
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
                    <Stack.Item>
                        <Checkbox label={CsI18n.t("List only main images")} checked={this.state.search_is_main_image}
                                  onChange={(value) => {this.setState({search_is_main_image: value})}}
                        />
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

    renderConvertOption() {
        let count_no_converted = this.getNoConvertedCountOnCandidate();
        let count_no_synced = this.getNoSyncedCountOnCandidate();
        return (
            <div className="convert-option mb-3">
                <Card>
                    <Card.Section>
                    <Stack >
                        <Stack.Item>
                            <Checkbox checked={this.state.option_update_shopify} label={CsI18n.t('Once processed, update it to on the store as well.')}
                                      onChange={this.handleOptionCheck}/>
                        </Stack.Item>
                        <Stack.Item>
                            <Stack alignment={"center"} spacing={"extraTight"}>
                                <Stack.Item><Checkbox checked={this.state.option_crop_margin} label={CsI18n.t('Crop the margin')}
                                                      onChange={this.handleOptionCropMargin}/></Stack.Item>
                                <Stack.Item>
                                    <div className={"crop-margin-value"}><TextField
                                        labelHidden={true}
                                        label={'margin_value'}
                                        value={this.state.option_crop_margin_value}
                                        type={"number"}
                                        disabled={!this.state.option_crop_margin}
                                        min={0} max={30} connectedRight={'%'}
                                                      onChange={this.handleOptionCropMarginValue}
                                /></div></Stack.Item>
                            </Stack>
                        </Stack.Item>
                        <Stack.Item fill/>
                        <Stack.Item>
                            <Button size="slim"
                                    loading={this.state.processing}
                                    disabled={count_no_converted == 0 || this.state.searching || this.state.processing}
                                    onClick={() => {
                                        this.setState({opened: true});
                                    }}><CsI18n>Convert</CsI18n></Button>
                        </Stack.Item>
                        <Stack.Item>
                            <Button size="slim"
                                    loading={this.state.processing}
                                    disabled={count_no_synced == 0 || this.state.searching || this.state.processing}
                                    onClick={this.handlePutOnShopify}><CsI18n>Put on Shopify</CsI18n></Button>
                        </Stack.Item>
                    </Stack>
                    </Card.Section>
                </Card>
            </div>
        )
    }

    renderError() {

        let type;
        let title;
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
                message = "Please search images!";
                status = 'new';
            } else {
                title = "No search result";
                message = "Sorry, you have no result yet!";
                status = 'warning';
            }
        } else if (type === CANDIDATE) {
            title = "Empty";
            message = "Please select the images to convert";
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
                {this.renderConvertOption()}
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
            <div className="image-pagination">
                    {/*<Stack.Item>*/}
                    {/*    <TextStyle><CsI18n>Showing</CsI18n></TextStyle>*/}
                    {/*    <div className="pagination-select">*/}
                    {/*        <Select*/}
                    {/*            lable={''}*/}
                    {/*            labelHidden={true}*/}
                    {/*            options={SELECT_PAGE_OPTIONS}*/}
                    {/*            value={this.state.page_item_count}*/}
                    {/*            onChange={this.handlePageItemCountChange}*/}
                    {/*        />*/}
                    {/*    </div>*/}
                    {/*    <TextStyle><CsI18n>Items</CsI18n></TextStyle>*/}
                    {/*</Stack.Item>*/}
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

        let class_name = this.state.searching? "disabled-block":"";
        return (
            <div>
                <div>
                    <Stack>
                        <Stack.Item fill><Heading><CsI18n>Search result</CsI18n></Heading></Stack.Item>
                        <Stack.Item><Button size="slim" onClick={this.handleAddAll} disabled={search_list.length == 0}><CsI18n>Add all</CsI18n></Button></Stack.Item>
                    </Stack>
                </div>
                <div className={class_name}>
                    {search_list.length === 0 ?
                        this.renderEmpty(SEARCH)
                        :
                        this.renderList(rows, 'search')
                    }
                </div>
            </div>
        );
    }

    renderList(rows, type) {
        let list = [];
        for(let index in rows) {
            list.push(this.renderItem(rows[index], index, type));
        }
        return list;
    }

    handleImageModal = (id) => () => {
        this.setState({activeImageModalIndex: id});
    }

    renderItem(item, index, list_type) {
        const {title, src: image_url, src_converted: image_url_converted, tags, vendor, product_type, converted, synced, image_id} = item;
        let item_detail = '';
        for(let i of [vendor, product_type, tags]) {
            if (!i) {
                continue;
            }
            if(item_detail) {
                item_detail += " | " + i;
            } else {
                item_detail += i;
            }
        }

        return (<div className={"item-image-container"} key={`container-${list_type}_${image_id}`}><Stack wrap={false} spacing="tight">
            <Stack.Item>
                {image_url ?
                    <CsImageModal
                        title={title}
                        size="large"
                        alt={title}
                        active={this.state.activeImageModalIndex == (list_type + index)}
                        onToggle={this.handleImageModal(list_type + index)}
                        source={image_url}
                        source_large={image_url}
                        key={list_type+image_id}
                    />
                    :
                    <CsNoImage alt={title}/>
                }
            </Stack.Item>
            {converted && image_url_converted? <Stack.Item><CsImageModal
                title={title}
                size="large"
                alt={title}
                active={this.state.activeImageModalIndex == (list_type + "_2_" + index)}
                onToggle={this.handleImageModal(list_type + "_2_" + index)}
                source={image_url_converted}
                source_large={image_url_converted}
                key={list_type+image_id+'_converted'}
            /></Stack.Item>:''}
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
                </Stack>
            </Stack.Item>
            <Stack.Item>
                <Stack vertical={true}>
                    {converted? <Stack.Item><Badge status="success"><CsI18n>Done</CsI18n></Badge></Stack.Item>:''}
                    <Stack.Item>
                        {list_type == 'search'?
                            (!converted || !synced?
                                <Button size="slim" onClick={this.handleAdd(item)}><CsI18n>Add</CsI18n></Button>
                                :
                                ''
                            ):
                            (<Button size="slim" onClick={this.handleRemove(item)}><CsI18n>Remove</CsI18n></Button>)
                        }
                    </Stack.Item>
                </Stack>
            </Stack.Item>
        </Stack></div>);
    }

    renderCandidateListTable() {
        let {candidate_list} = this.state;
        return (
            <div>
                <Stack>
                    <Stack.Item fill><Heading><CsI18n>Candidate list</CsI18n></Heading></Stack.Item>
                    <Stack.Item><Button size="slim" onClick={this.handleRemoveAll} disabled={candidate_list.length == 0}><CsI18n>Remove all</CsI18n></Button></Stack.Item>
                </Stack>
                {candidate_list.length === 0 ?
                    this.renderEmpty(CANDIDATE)
                    :
                    this.renderList(candidate_list, 'candidate')
                }
            </div>
        );
    }
}

export default Image;
