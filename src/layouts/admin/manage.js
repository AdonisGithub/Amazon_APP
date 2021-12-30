import React from 'react'
import CsI18n from "../../components/csI18n"


import {
    Button,
    Banner,
    Heading,
    Stack,
    ResourceList,
    Spinner, Layout, TextStyle, FilterType, Select, Page,
} from '@shopify/polaris';
import Util from '../../helpers/Util';
import AmazonTab from "../../helpers/amazon-tab";
import shopifyContext from "../../context";
import ApplicationApiCall from "../../functions/application-api-call";
import CsErrorMessage from "../../components/csErrorMessage";

import "./actions.scss"


const FILTER = {title: "0", message: "1", stop: "2"};

const DEFAULT_PAGE_ITEM_COUNT = 10;
const ADMIN_PAGE_ITEM_COUNT = 100;
const SELECT_PAGE_OPTIONS = [
    {label: 10, value: 10},
    {label: 50, value: 50},
    {label: 100, value: 100},
]

class FailuresTab extends AmazonTab {

    state = {
        ...this.state,
        processing: false,
        error: false,
        page: 1,
        count: 0,
        failureList: [],
        page_item_count: DEFAULT_PAGE_ITEM_COUNT,
        appliedFilters: [],
        searchValue: '',
    }
    constructor(props) {
        super(props);

        if (this.shopify.admin) {
            this.state.page_item_count = ADMIN_PAGE_ITEM_COUNT;
        }
        this.initialState = Util.clone(this.state);
        this.selectedConfiguration = this.getConfigurationSelectedIndex();
        this.shopify = shopifyContext.getShared();
        this.unMounted = false;
    }

    componentDidMount() {
        this.init();
    }

    componentWillUnmount() {
        this.unMounted = true;
    }

    componentWillReceiveProps(nextProps) {
        super.componentWillReceiveProps(nextProps);

        if(this.selectedConfiguration !== this.getConfigurationSelectedIndex()){
            this.selectedConfiguration = this.getConfigurationSelectedIndex();
            this.setState(Util.clone(this.initialState), this.init);
        }
    }

    init = () => {
        console.log(this.state.failureList, this.state.refreshing);


        if(this.state.count === 0 || this.state.failureList.length <= this.state.count){

            if(!this.state.refreshing){
                this.setState({processing: true});
            }

            let limit_from = this.state.failureList.length;
            let limit_to = this.state.page_item_count;
            let configuration = this.shopify.getConfigurationSelected();
            let admin = this.shopify.admin;

            let params = {configuration, limit_from, limit_to, admin};

            ApplicationApiCall.get('/application/scheduler/failures', params, this.cbInit, this.cbInitError)
        }
    }

    cbInit = (json) => {
        console.log(json);


        if(json && this.unMounted === false){

            let failureList = json.details && json.details.length > 0 ? this.state.failureList.concat(json.details) : this.state.failureList;
            let count = json.count ? parseInt(json.count) : 0;

            this.setState(preState => ({
                processing: false,
                refreshing: false,
                failureList: failureList,
                count: count}))
        }

    }

    cbInitError = (err) => {
        console.log(err);

        if(err && this.unMounted === false){
            this.setState({error: err, processing: false, refreshing: false})
        }
    }

    handlePageItemCountChange = (value) => {
        this.setState({page_item_count: parseFloat(value)})
    }

    handleMoreBtnClick = () => {
        this.init();
        this.setState(({page}) => ({page: page + 1}));
    }

    handleSearchChange = (value) => {
        this.setState({searchValue: value});
    }


    handleFiltersChange = (appliedFilters) => {
        this.setState({appliedFilters: appliedFilters});
    }

    handleRefresh = () => {
        this.state.refreshing = true;
        this.setState(Util.clone(this.initialState), this.init);
    }

    isCheckBool = (value) => {
        return value == true
    }

    isEveryBool = (array) => {
        return array.every(this.isCheckBool)
    }

    isNextPage(){
        return this.state.count !== 0 && this.state.failureList.length < this.state.count;
    }

    checkFilter = (item) => {

        let array = [];

        array = this.checkFilterOptions(item);

        return ((item.title && item.title.toLowerCase().indexOf(this.state.searchValue.toLowerCase()) !== -1) ||
            (item.message && item.message.toLowerCase().indexOf(this.state.searchValue.toLowerCase()) !== -1)) && this.isEveryBool(array);
    }

    checkFilterOptions = (item) => {
        let array = [];

        this.state.appliedFilters.forEach((filter) => {
            if(filter.key === FILTER.title){
                if(filter.value && item.title && item.title.toLowerCase().indexOf(filter.value.toLowerCase()) !== -1){
                    array.push(true);
                }else{
                    array.push(false);
                }
            }
            if (filter.key === FILTER.message) {
                if (filter.value && item.message && item.message.toLowerCase().indexOf(filter.value.toLowerCase()) !== -1) {
                    array.push(true);
                } else {
                    array.push(false);
                }
            }else if (filter.key === FILTER.stop) {
                let date_stop = item.date_stop ? Util.getDateString(new Date(item.date_stop)) : null;

                if (filter.value && date_stop && date_stop === filter.value) {
                    array.push(true);
                } else {
                    array.push(false);
                }
            }

        })
        return array;
    }


    render() {

        let content;

        if (this.state.error) {
            content = this.renderError();
        } else if (this.state.processing && this.state.failureList.length === 0) {
            content = this.renderLoading();
        }else if(this.state.failureList.length === 0 && !this.state.refreshing){
            content = this.renderEmpty();
        } else {
            content = this.renderFailure();
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

    renderError(){
        console.log(this.state.error);


        return(
            <CsErrorMessage
                errorType={this.state.error.type}
                errorMessage={this.state.error.message}
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
        let title = 'No Failure';
        let message = 'Fortunately, no failure has been recorded so far';

        return (
            <div>
                <Banner status="success" title={CsI18n.t(title)}>
                    <TextStyle>{CsI18n.t(message)}</TextStyle>
                </Banner>
            </div>
        )
    }


    renderFiler() {
        const filters = [
            {
                key: FILTER.title,
                label: CsI18n.t('Title'),
                operatorText: CsI18n.t('Contains'),
                type: FilterType.TextField,
            },
            {
                key: FILTER.message,
                label: CsI18n.t('Message'),
                operatorText: CsI18n.t('Contains'),
                type: FilterType.TextField,
            },
            {
                key: FILTER.stop,
                label: CsI18n.t('StopDate'),
                operatorText: CsI18n.t('is'),
                type: FilterType.TextField,
                textFieldType: 'date',
            }
        ];

        return (

            <ResourceList.FilterControl
                filters={filters}
                appliedFilters={this.state.appliedFilters}
                onFiltersChange={this.handleFiltersChange}
                searchValue={this.state.searchValue}
                onSearchChange={this.handleSearchChange}
            />
        );
    }

    renderFailure(){

        let content;

        if(this.state.refreshing) {
            content = this.renderLoading();
        } else{
            content = this.renderFailureTable();
        }
        return (
            <div>
                <Stack>
                    <Stack.Item fill>{this.renderFiler()}</Stack.Item>
                    <Stack.Item><Button disabled={this.state.refreshing === true} onClick={this.handleRefresh}><CsI18n>Refresh</CsI18n></Button></Stack.Item>
                </Stack>
                <div className="failure-table">
                    {content}
                </div>
            </div>
        )
    }

    renderFailureTable(){

        let rows =[{}];
        for(let index in this.state.failureList){
            if(!this.checkFilter(this.state.failureList[index])){
                continue;
            }
            rows.push(this.state.failureList[index]);
        }

        return(
            <div>
                <ResourceList
                    resourceName={{singular: 'customer', plural: 'customers'}}
                    items={rows}

                    renderItem={(item, index) => {
                        return (
                            <ResourceList.Item
                                id={index}
                            >
                                {index == 0 ?
                                    <div className="list">
                                        <div className="title"><Heading><CsI18n>Title</CsI18n></Heading></div>
                                        <div className="message"><Heading><CsI18n>Message</CsI18n></Heading></div>
                                        <div className="stop-date"><Heading><CsI18n>Date</CsI18n></Heading></div>
                                    </div>
                                    :
                                    <div className="list">
                                        <div className="title"><TextStyle>{item.title}</TextStyle></div>
                                        <div className="message"><TextStyle>{item.message}</TextStyle></div>
                                        <div className="stop-date"><TextStyle>{item.date_stop}</TextStyle></div>
                                    </div>}
                            </ResourceList.Item>
                        );
                    }}
                />

                {this.isNextPage() ? this.renderFailureTableFooter() : ''}
            </div>
        )
    }

    renderFailureTableFooter() {

        return(
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
export default FailuresTab;
