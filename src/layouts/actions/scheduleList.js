import React from 'react'
import CsI18n from "../../components/csI18n"


import {
    Button,
    Banner,
    Heading,
    Stack,
    ResourceList,
    Spinner, Layout, TextStyle, Select, Page, Checkbox, Tag,
} from '@shopify/polaris';
import Util from '../../helpers/Util';
import AmazonTab from "../../helpers/amazon-tab";
import shopifyContext from "../../context";
import ApplicationApiCall from "../../functions/application-api-call";
import CsErrorMessage from "../../components/csErrorMessage";
import ScheduleRow from './scheduler/scheduleRow'
import "./actions.scss"
// import ScheduleFilter from "./scheduler/scheduleFilter";
import {ErrorType} from "../../components/csErrorMessage/csErrorMessage";
import Constants from "../../helpers/rules/constants";
import CsFastFilter from "../../components/csFastFilter";

// import testData from "../../testData/test_scheduler.json";

const DEFAULT_PAGE_ITEM_COUNT = 10;
const SELECT_PAGE_OPTIONS = [
    {label: 10, value: 10},
    {label: 50, value: 50},
    {label: 100, value: 100},
]

const SEARCH = 1;

const SEARCH_FILTER_SECTION = 0;
const SEARCH_FILTER_OPERATION = 1;
const SEARCH_FILTER_ACTION = 2;

const FILTER_OPTIONS = {is_excluding_empty: "exclude_empty", is_only_errors: "only_errors"};

class ScheduleList extends AmazonTab {

    state = {
        ...this.state,
        processing: false,
        error: null,
        page: 1,
        count: 0,
        collapse: 0,
        scheduleList: [],
        page_item_count: DEFAULT_PAGE_ITEM_COUNT,
        searchValue: '',
        section: '',
        operation: '',
        action: '',
        has_errors: false,
        has_feeds: false,
        filterChanged: false,
        searchBtnClicked: false,
        appliedFilters: [],
    }

    constructor(props) {
        super(props);

        this.initialState = Util.clone(this.state);
        this.state.refreshing = false;
        this.state.search = false;
        this.selectedConfiguration = this.getConfigurationSelectedIndex();
        this.marketplaceList = [];
        this.filteredRows = [];
        this.filterOptions = null;
        this.shopify = shopifyContext.getShared();
        this.unMounted = false;
    }

    componentDidMount() {
        this.initMarketplaceList();
        window.addEventListener('keypress', this.handleSearchKeypress);
    }

    componentWillUnmount() {
        this.unMounted = true;
        window.removeEventListener('keypress', this.handleSearchKeypress);
    }

    componentWillReceiveProps(nextProps) {
        super.componentWillReceiveProps(nextProps);

        if (this.selectedConfiguration !== this.getConfigurationSelectedIndex()) {
            this.selectedConfiguration = this.getConfigurationSelectedIndex();
            this.setState(Util.clone(this.initialState), this.initMarketplaceList);
        }
    }

    getName() {
        return 'ScheduleList';
    }

    initMarketplaceList = () => {
        this.setState({processing: true});
        this.fetchMarketplaceList(this.cbMarketplacesSuccess, this.cbMarketplaceError);
    }

    cbMarketplacesSuccess = (json) => {
        if (json && this.unMounted === false) {
            this.marketplaceList = this.getActiveMarketplaceList(json);
            this.getScheduleList();
            // if( this.marketplaceList.length > 0 ) {
            //   this.getScheduleList();
            // } else {
            //   this.cbMarketplaceError({type: ErrorType.INVALID_PARAM, message: Constants.must_be_selected_marketplace});
            // }
        }
    }

    cbMarketplaceError = (err) => {
        if (err && this.unMounted === false) {
            // setTimeout(( ) => {
            //   this.setState({error: null})
            // }, 5000)
            this.setState({error: err, processing: false})
        }
    }

    getScheduleList = () => {
        console.log(this.state);

        if (this.state.count === 0 || this.state.scheduleList.length <= this.state.count) {

            if (this.state.search === false) {
                this.setState({processing: true})
            }


            let params;
            let limit_from = this.state.scheduleList.length;
            let limit_to = this.state.page_item_count;
            let search = this.state.searchValue;
            let has_errors = this.state.has_errors;
            let has_feeds = this.state.has_feeds;
            let section = this.state.section;
            let operation = this.state.operation;
            let action = this.state.action;
            let configuration = this.shopify.getConfigurationSelected();

            params = {configuration, limit_from, limit_to, search, section, operation, action, has_errors, has_feeds};

            ApplicationApiCall.get('/application/scheduler/report', params, this.cbSchedulerSuccess, this.cbInitError);
            // setTimeout(() => {
            //     this.cbSchedulerSuccess(testData.data);
            // }, 100);
        }
    }

    cbSchedulerSuccess = (json) => {

        console.log(this.getName() + ':cbSchedulerSuccess', json);

        let scheduleList = [];

        if (json && this.unMounted === false) {
            if (json.details && json.details.length > 0) {
                json.details.forEach((item, index) => {
                    scheduleList[index] = {};
                    Object.keys(item).forEach(key => {
                        if (key === 'id') {
                            scheduleList[index]['idx'] = item.id;
                        } else {
                            scheduleList[index][key] = item[key];
                        }
                    })
                })
            } else {
                scheduleList = [];
            }

            if (this.state.filterChanged === false) {
                scheduleList = this.state.scheduleList.concat(scheduleList);
            }
            this.filterRows(this.state.appliedFilters, scheduleList);


            this.filterOptions = json.hasOwnProperty("columns") ? json.columns : null;

            console.log(this.filterOptions);

            let count = json.count ? json.count : 0;
            let collapse = json.collapse ? json.collapse : 0;

            this.setState(preState => ({
                ...preState,
                processing: false,
                refreshing: false,
                search: false,
                scheduleList: scheduleList,
                count: count,
                collapse: collapse,
                filterChanged: false,
            }))
        }

    }

    cbInitError = (err) => {
        console.log('[Schedule:Err]', err);

        if (err && this.unMounted === false) {
            this.setState(preState => ({
                ...preState,
                error: err,
                processing: false,
                refreshing: false,
                search: false,
                filterChanged: false,
            }))
        }
    }

    isSomeBool = (array) => {
        return array.some(this.isCheckBool)
    }

    filterRows(appliedFilters, rows) {
        this.filteredRows = [];
        for (let index in rows) {
            let item = rows[index];

            if (!this.checkFilter(appliedFilters, item)) {
                continue;
            }
            this.filteredRows.push(item);
        }
    }

    checkFilter(appliedFilters, item) {
        let array = [];
        array = this.checkFilterOptions(appliedFilters, item);
        return this.isEveryBool(array);
    }

    checkFilterOptions(appliedFilters, item) {
        let array = [];
        let {log} = item;
        let item_details = null;
        let summaryLog = null;
        if (log && log.completed) {
            item_details = log.details;
            summaryLog = null;
            if (item_details) {
                for (let item_detail of item_details) {
                    if (item_detail.is_summary == 1) {
                        summaryLog = item_detail;
                        break;
                    }
                }
            }
        }

        appliedFilters.forEach((filter) => {
            if (filter.value === FILTER_OPTIONS.is_excluding_empty) {
                if (log && log.completed) {
                    console.log("summaryLog", summaryLog)
                    if ( summaryLog && (summaryLog.errors > 0 || summaryLog.successes > 0)) {
                        array.push(true);
                    } else {
                        array.push(false);
                    }
                } else {
                    array.push(false);
                }
            }
            if(filter.value === FILTER_OPTIONS.is_only_errors){
                if (log && log.completed) {
                    console.log("summaryLog", summaryLog)
                    if (summaryLog && summaryLog.errors > 0) {
                        array.push(true);
                    } else {
                        array.push(false);
                    }
                } else {
                    array.push(false);
                }
            }
        });
        console.log(array);
        return array;
    }

    handleFiltersChange = (appliedFilters) => {
        this.filterRows(appliedFilters, this.state.scheduleList);
        this.setState({appliedFilters: appliedFilters});
    }

    handleRemoveFilter = (value) => () => {
        let idx;
        let {appliedFilters} = this.state;

        this.state.appliedFilters.forEach((filter, index) => {
            if(filter.value === value){
                idx = index;
            }
        });
        appliedFilters.splice(idx, 1);
        this.filterRows(appliedFilters, this.state.scheduleList);
        this.setState({appliedFilters: appliedFilters});
    }

    handleSearchFilterChange = (type) => (value) => {
        let {section, operation, action} = this.state;

        if (type === SEARCH_FILTER_SECTION) {
            section = value;
            operation = '';
            action = '';
        } else if (type === SEARCH_FILTER_OPERATION) {
            operation = value;
            action = ''
        } else if (type === SEARCH_FILTER_ACTION) {
            action = value;
        }

        this.setState({
            section: section,
            operation: operation,
            action: action,
            filterChanged: true,
            scheduleList: [],
            page: 1,
        }, this.getScheduleList);
    }

    handleChangeSearchOption = field => (value) => {
        console.log("handleChangeSearchOption", field, value);
        let {search_option} = this.state;
        search_option[field] = value;
        this.fetchProducts(true, search_option);
    }

    handleHasErrors = () => {
        this.setState(preState => ({
                ...preState,
                search: true,
                page: 1,
                scheduleList: [],
                count: 0,
                has_errors: !this.state.has_errors,
                searchBtnClicked: true
            }),
            this.getScheduleList);
    }

    handleHasFeeds = () => {
        this.setState(preState => ({
                ...preState,
                search: true,
                page: 1,
                scheduleList: [],
                count: 0,
                has_feeds: !this.state.has_feeds,
                searchBtnClicked: true
            }),
            this.getScheduleList);
    }

    handlePageItemCountChange = (value) => {
        this.setState({page_item_count: parseFloat(value)})
    }

    handleMoreBtnClick = () => {
        this.getScheduleList();
        this.setState(({page}) => ({page: page + 1}));
    }

    handleSearchChange = (value) => {
        this.setState({searchValue: value});
    }

    handleSearchKeypress = (e) => {
        if (e.keyCode === 13) {
            this.handleSearchBtnClick();
        }
    }

    handleSearchBtnClick = () => {
        // if(this.state.searchValue === ''){
        //   return false;
        // }
        this.setState(preState => ({
                ...preState,
                search: true,
                page: 1,
                scheduleList: [],
                count: 0,
                searchBtnClicked: true
            }),
            this.getScheduleList);
    }

    handleRefresh = () => {
        this.state.refreshing = true;
        this.setState(Util.clone(this.initialState), this.getScheduleList);
    }

    isCheckBool = (value) => {
        return value == true
    }

    isEveryBool = (array) => {
        return array.every(this.isCheckBool)
    }

    isNextPage() {
        return this.state.count !== 0 && this.state.scheduleList.length < this.state.count && this.state.filterChanged === false;
    }

    ucFirst(string) {
        return string.replace(/^\w/, c => c.toLocaleUpperCase());
    }


    render() {

        console.log(this.state);
        let content;

        if (this.state.error && this.state.refreshing === false && this.state.searchBtnClicked === false) {
            content = this.renderError();
        } else if (this.state.processing === true && this.state.scheduleList.length === 0 && this.state.filterChanged === false && this.state.refreshing === false) {
            content = this.renderLoading();
        } else {
            content = this.renderSchedule();
        }
        return (
            <div className="actions">
                <Page fullWidth>
                    <Layout>
                        <Layout.Section>

                            <div className="schedule-list">
                                {content}
                            </div>

                        </Layout.Section>
                    </Layout>
                </Page>
            </div>
        );
    }

    renderError(type = null) {

        let errorType;
        let errorTitle;
        let errorMessage;

        if (type === SEARCH) {
            errorTitle = "No result";
            errorMessage = "You don't have any entry matching these search terms";
        } else {
            errorType = this.state.error.type;
            errorMessage = this.state.error.message;
        }

        return (
            <CsErrorMessage
                errorType={errorType}
                errorTitle={CsI18n.t(errorTitle)}
                errorMessage={CsI18n.t(errorMessage)}
            />

        )
    }

    renderLoading() {
        return (
            <div className="loading">
                <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
            </div>
        )
    }

    renderEmpty() {
        let title = 'No result';
        let message = 'You don\'t have any action scheduled yet';

        return (
            <div>
                <br/>
                <Banner status="warning" title={CsI18n.t(title)}>
                    <TextStyle><CsI18n>{message}</CsI18n></TextStyle>
                </Banner>
                <br/>
            </div>
        )
    }

    renderFiler() {
        const filters = [
            {
                value: FILTER_OPTIONS.is_excluding_empty,
                label: CsI18n.t("Don't show the empty schedule"),
            },
            {
                value: FILTER_OPTIONS.is_only_errors,
                label: CsI18n.t('Show only the schedule having errors'),
            },
        ];

        let filterTags = [];
        if (this.state.appliedFilters.length) {
            this.state.appliedFilters.forEach((filter, index) => {
                filterTags.push(
                    <Stack.Item key={index}>
                        <Tag onRemove={this.handleRemoveFilter(filter.value)}>{filter.label}</Tag>
                    </Stack.Item>
                );
            })
        }
        return (<Stack vertical spacing="tight">
                <Stack.Item>
                    <Stack spacing={"extraLoose"} alignment={"center"}>
                        <Stack.Item fill>
                            <Stack spacing="none">
                                <Stack.Item>
                                    <div className="export-filter">
                                        <CsFastFilter
                                            filters={filters}
                                            appliedFilters={this.state.appliedFilters}
                                            onFiltersChange={this.handleFiltersChange}
                                        />
                                    </div>
                                </Stack.Item>
                                <Stack.Item fill>
                                    <ResourceList.FilterControl
                                        searchValue={this.state.searchValue}
                                        onSearchChange={this.handleSearchChange}
                                        additionalAction={{
                                            content: CsI18n.t('Search'),
                                            loading: this.state.processing && this.state.search,
                                            onAction: () => this.handleSearchBtnClick(),
                                        }}
                                    />
                                </Stack.Item>
                            </Stack>
                        </Stack.Item>
                        <Stack.Item>
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        </Stack.Item>
                        <Stack.Item>
                            <Checkbox label={CsI18n.t("Tasks with errors")} checked={this.state.has_errors}
                                      onChange={this.handleHasErrors}/>&nbsp;&nbsp;&nbsp;
                            <Checkbox label={CsI18n.t("Tasks with feeds")} checked={this.state.has_feeds}
                                      onChange={this.handleHasFeeds}/>
                        </Stack.Item>
                    </Stack>
                </Stack.Item>
                {this.state.appliedFilters.length ?
                    <Stack.Item>
                        <Stack spacing="tight">
                            {filterTags}
                        </Stack>
                    </Stack.Item>
                    : ''}
            </Stack>
        );
    }

    renderSchedule() {

        let content;
        if (this.state.error && this.state.searchBtnClicked === true) {
            content = this.renderError(SEARCH);

            setTimeout(() => {
                this.handleRefresh()
            }, 5000)

        } else if (this.state.search === true) {
            content = this.renderLoading();
        } else if (this.filterOptions === null) {
            content = this.renderEmpty();
        } else {
            content = this.renderScheduleTable();
        }
        return (
            <div>
                {this.renderFiler()}
                <div className="schedule-table">
                    {content}
                </div>
            </div>
        )
    }

    renderScheduleTable() {

        let rows = [{}];
        for (let index in this.filteredRows) {
            rows.push(this.filteredRows[index]);
        }

        let sectionOptions = [{label: "Select", value: "", disabled: true}];
        let operationOptions = [{label: "Select", value: "", disabled: true}];
        let actionOptions = [{label: "Select", value: "", disabled: true}];


        console.log("renderScheduleTable", this.filteredRows, this.filterOptions.filters);

        this.filterOptions.sections.forEach(item => {
            sectionOptions.push({label: this.ucFirst(item), value: this.ucFirst(item)});
        })

        if (this.state.section !== '') {
            Object.keys(this.filterOptions.filters[this.state.section]).forEach(item => {
                operationOptions.push({label: this.ucFirst(item), value: this.ucFirst(item)});
            })
        }

        if (this.state.operation !== '') {
            this.filterOptions.filters[this.state.section][this.state.operation].forEach(item => {
                actionOptions.push({label: this.ucFirst(item), value: this.ucFirst(item)});
            })
        }
        console.log(sectionOptions, operationOptions, actionOptions)

        let sectionSelect = (
            <Select options={sectionOptions} value={this.state.section}
                    onChange={this.handleSearchFilterChange(SEARCH_FILTER_SECTION)}/>
        )

        let operationSelect = (
            <Select options={operationOptions} value={this.state.operation}
                    onChange={this.handleSearchFilterChange(SEARCH_FILTER_OPERATION)}/>
        )

        let actionSelect = (
            <Select options={actionOptions} value={this.state.action}
                    onChange={this.handleSearchFilterChange(SEARCH_FILTER_ACTION)}/>
        )

        return (
            <div>
                <ResourceList
                    resourceName={{singular: 'schedule', plural: 'schedules'}}
                    items={rows}
                    renderItem={(item, index) => {

                        return (
                            <ResourceList.Item
                                id={index}
                            >
                                {index == 0 ?
                                    <div className="list-header">
                                        <div className="flag">&#10003;</div>
                                        <div className="section">{sectionSelect}</div>
                                        <div className="operation">{operationSelect}</div>
                                        <div className="action">{actionSelect}</div>
                                        <div className="title"><Heading><CsI18n>Title</CsI18n></Heading></div>
                                        <div className="created"><Heading><CsI18n>&#128197;</CsI18n></Heading></div>
                                        <div className="next-exe"><Heading>&#9200;</Heading></div>
                                        <div className="view"><Button size='slim'
                                                                      disabled={this.state.refreshing === true}
                                                                      onClick={this.handleRefresh}><CsI18n>Refresh</CsI18n></Button>
                                        </div>
                                    </div>
                                    :
                                    <ScheduleRow
                                        item={item}
                                        key={item.idx}
                                        collapse={this.state.collapse}
                                        selectedConfiguration={this.selectedConfiguration}
                                        marketplaceInfoList={this.marketplaceList}
                                    />}
                            </ResourceList.Item>
                        );
                    }}
                />
                {this.state.refreshing === true || this.state.filterChanged === true ? this.renderLoading() : ''}
                {this.state.scheduleList.length === 0 && this.state.processing === false ? this.renderEmpty() : ''}
                {this.isNextPage() ? this.renderScheduleTableFooter() : ''}
            </div>
        )
    }

    renderScheduleTableFooter() {

        return (
            <div className="pagination">
                <Stack wrap={false} alignment="center">
                    <Stack.Item>
                        <TextStyle><CsI18n>Showing</CsI18n></TextStyle>
                        <div className="pagination-select">
                            <Select
                                options={SELECT_PAGE_OPTIONS}
                                value={this.state.page_item_count}
                                onChange={this.handlePageItemCountChange}
                            ></Select>
                        </div>
                        <TextStyle><CsI18n>Items</CsI18n></TextStyle>
                    </Stack.Item>
                    <Stack.Item>
                        <Button loading={this.state.processing} onClick={this.handleMoreBtnClick}><CsI18n>More</CsI18n></Button>
                    </Stack.Item>
                </Stack>
            </div>
        )
    }
}

export default ScheduleList;
