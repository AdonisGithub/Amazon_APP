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
import "./admin.css";

const FILTER = {title: "0", message: "1", stop: "2"};
const FILTER_SHOP = 0;
const FILTER_CONF = 1;

const DEFAULT_PAGE_ITEM_COUNT = 10;
const ADMIN_PAGE_ITEM_COUNT = 100;
const SELECT_PAGE_OPTIONS = [
    {label: 10, value: 10},
    {label: 50, value: 50},
    {label: 100, value: 100},
]

class LogTab extends AmazonTab {

    state = {
        ...this.state,
        processing: false,
        error: false,
        page: 1,
        count: 0,
        failureList: [],
        page_item_count: DEFAULT_PAGE_ITEM_COUNT,
        selectedStore: '',
        selectedConf: '',
        appliedFilters: [],
        downloading: null,
        searchValue: '',
        filtering: false,
    }
    constructor(props) {
        super(props);
        if (this.shopify.admin) {
            this.state.page_item_count = ADMIN_PAGE_ITEM_COUNT;
        }
        this.initialState = Util.clone(this.state);
        this.selectedConfiguration = this.getConfigurationSelectedIndex();
        this.selectedShop = this.shopify.adminStore;
        this.shopify = shopifyContext.getShared();
        this.jsonData = null;

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

        if( this.selectedConfiguration !== this.getConfigurationSelectedIndex() ||
            this.selectedShop !== this.shopify.adminStore){
            this.selectedConfiguration = this.getConfigurationSelectedIndex();
            this.selectedShop = this.shopify.adminStore;
            this.setState(Util.clone(this.initialState), this.init);
        }
    }



    init = () => {
        console.log(this.state);


        if(this.state.count === 0 || this.state.failureList.length <= this.state.count){

            if(!this.state.refreshing){
                this.setState({processing: true});
            }

            let limit_from = this.state.failureList.length;
            let limit_to = this.state.page_item_count;
            let configuration = this.shopify.getConfigurationSelected();
            let admin = this.shopify.admin;
            let filter_store = this.state.selectedStore;
            let filter_configuration = this.state.selectedConf;
            let scope = this.state.selectedStore === '' ? 'all' : '';

            let params = {configuration, limit_from, limit_to, admin, scope, filter_configuration, filter_store};

            ApplicationApiCall.get('/application/scheduler/failures', params, this.cbInit, this.cbInitError)
        }
    }

    cbInit = (json) => {
        console.log(json);


        if(json && this.unMounted === false){

            this.jsonData = json;
            let failureList = json.details && json.details.length > 0 ? this.state.failureList.concat(json.details) : this.state.failureList;
            let count = json.count ? parseInt(json.count) : 0;

            this.setState(preState => ({
                processing: false,
                refreshing: false,
                filtering: false,
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

        this.setState({
            ...Util.clone(this.initialState),
            refreshing: true,
        }, this.init);
    }

    handleColumnFilterChange = (type) => (value) => {
        if(type === FILTER_SHOP){
            this.setState({selectedStore: value, selectedConf:'', failureList: [], filtering: true}, this.init);
        } else if (type === FILTER_CONF) {
            this.setState({selectedConf: value, failureList:[], filtering: true}, this.init);
        }
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

    handleDownloadBtnClick = (index) => () => {
        console.log(index);
        this.setState({downloading: index});

        let fileName = this.state.failureList[index].logfile + ".log";
        ApplicationApiCall.downloadOnlyOnChrome('/logs/' + fileName , {}, fileName, this.downloadSuccess, this.downloadFail);
    }

    downloadSuccess = () => {
        this.setState({downloadSuccess: true, downloading: null})
        setTimeout(() => {
            this.setState({downloadSuccess: false});
        }, 5000)
    }

    downloadFail = (err) => {
        console.log(err);


        // setTimeout(() => {
        //     this.setState({downloadError: null})
        // }, 5000)
        this.setState({downloadError: err, downloading: null});
    }

    render() {
        console.log(this.state);
        let content;

        if (this.state.error) {
            content = this.renderError();
        } else if (this.state.processing && this.state.failureList.length === 0 && this.state.filtering === false) {
            content = this.renderLoading();
        }else if(!this.jsonData && !this.state.processing){
            content = this.renderEmpty();
        } else {
            content = this.renderFailure();
        }

        return (
            <div className="admin">
                <Page fullWidth>
                    <Layout>
                        <Layout.Section>
                            <div className="log-list">
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

        if(this.state.refreshing === true) {
            content = this.renderLoading();
        } else if (this.state.failureList.length === 0 && this.state.filtering === false){
            content = this.renderEmpty();
        }else{
            content = this.renderFailureTable();
        }
        return (
            <div>
                <Stack>
                    <Stack.Item fill>{this.renderFiler()}</Stack.Item>
                    <Stack.Item><Button disabled={this.state.refreshing === true} onClick={this.handleRefresh}><CsI18n>Refresh</CsI18n></Button></Stack.Item>
                </Stack>
                <div className="log-table">
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

        var has_store = false;
        var has_configuration = false;

        if (rows.length) {
            let last_row = rows[rows.length - 1];
            has_store = last_row.hasOwnProperty('store');
            has_configuration = last_row.hasOwnProperty('configuration');
        }

        let store_options = [{label: "Select", value: ""}];
        let conf_options = [{label: "Select", value: ""}];

        this.shopify.store_list.forEach(store => {
            store_options.push({label: store.store, value: store.store});
        })

        if(this.state.selectedStore !== '' && this.jsonData.configurations.hasOwnProperty(this.state.selectedStore)){
            this.jsonData.configurations[this.state.selectedStore].forEach(conf => {
                conf_options.push({label: conf, value: conf});
            })
        }

        return(
            <div>
                <ResourceList
                    resourceName={{singular: 'customer', plural: 'customers'}}
                    items={rows}

                    renderItem={(item, index) => {

                        //if (item.hasOwnProperty('store'))

                        var row = [];
                        var col = 0;

                        if (index == 0) {
                            if (has_store)
                                row.push(
                                    <div className="store" key={col++}>
                                        <Select options={store_options} value={this.state.selectedStore} onChange={this.handleColumnFilterChange(FILTER_SHOP)}/>
                                    </div>
                                );
                            if (has_configuration)
                                row.push(
                                    <div className="configuration" key={col++}>
                                        <Select options={conf_options} value={this.state.selectedConf} onChange={this.handleColumnFilterChange(FILTER_CONF)}/>
                                    </div>
                                );
                            row.push(
                                <div className="title" key={col++}><Heading><CsI18n>Title</CsI18n></Heading></div>
                            );
                            row.push(
                                <div className="message" key={col++}><Heading><CsI18n>Message</CsI18n></Heading></div>
                            );
                            row.push(
                                <div className="date" key={col++}><Heading><CsI18n>Date</CsI18n></Heading></div>
                            );
                            row.push(
                                <div className="download" key={col++}>Download</div>
                            );
                        } else {
                            if (has_store)
                                row.push(
                                    <div className="store" key={col++}><TextStyle>{item.store}</TextStyle></div>
                                );
                            if (has_configuration)
                                row.push(
                                    <div className="configuration" key={col++}><TextStyle>{item.configuration}</TextStyle></div>
                                );
                            row.push(
                                <div className="title" key={col++}><TextStyle>{item.title}</TextStyle></div>
                            );
                            row.push(
                                <div className="message" key={col++}><TextStyle>{item.message}</TextStyle></div>
                            );
                            row.push(
                                <div className="date" key={col++}><TextStyle>{item.date_stop}</TextStyle></div>
                            );
                            row.push(
                                <div className="download" key={col++}>
                                    <Button plain
                                            onClick={this.handleDownloadBtnClick(parseInt(index) - 1)}>
                                        <svg viewBox="0 0 60 60" className="Polaris-Icon__Svg" focusable="false"
                                             aria-hidden="true">
                                            <path d="M50.976,20.694c-0.528-9-7.947-16.194-16.892-16.194c-5.43,0-10.688,2.663-13.945,7.008
		c-0.075-0.039-0.154-0.066-0.23-0.102c-0.198-0.096-0.399-0.187-0.604-0.269c-0.114-0.045-0.228-0.086-0.343-0.126
		c-0.203-0.071-0.409-0.134-0.619-0.191c-0.115-0.031-0.229-0.063-0.345-0.089c-0.225-0.051-0.455-0.09-0.687-0.125
		c-0.101-0.015-0.2-0.035-0.302-0.046C16.677,10.523,16.341,10.5,16,10.5c-4.963,0-9,4.037-9,9c0,0.129,0.008,0.255,0.017,0.381
		C2.857,22.148,0,26.899,0,31.654C0,38.737,5.762,44.5,12.845,44.5H18c0.553,0,1-0.447,1-1s-0.447-1-1-1h-5.155
		C6.865,42.5,2,37.635,2,31.654c0-4.154,2.705-8.466,6.433-10.253L9,21.13V20.5c0-0.12,0.008-0.242,0.015-0.365l0.011-0.185
		l-0.013-0.194C9.007,19.671,9,19.586,9,19.5c0-3.859,3.141-7,7-7c0.309,0,0.614,0.027,0.917,0.067
		c0.078,0.01,0.156,0.023,0.233,0.036c0.267,0.044,0.53,0.102,0.789,0.177c0.035,0.01,0.071,0.017,0.106,0.027
		c0.285,0.087,0.563,0.197,0.835,0.321c0.071,0.032,0.14,0.067,0.21,0.101c0.24,0.119,0.475,0.249,0.702,0.396
		C21.719,14.873,23,17.038,23,19.5c0,0.553,0.447,1,1,1s1-0.447,1-1c0-2.754-1.246-5.219-3.2-6.871
		C24.667,8.879,29.388,6.5,34.084,6.5c7.745,0,14.178,6.135,14.849,13.888c-1.021-0.072-2.552-0.109-4.083,0.124
		c-0.546,0.083-0.921,0.593-0.838,1.139c0.075,0.495,0.501,0.85,0.987,0.85c0.05,0,0.101-0.004,0.151-0.012
		c2.227-0.337,4.548-0.021,4.684-0.002C54.49,23.372,58,27.661,58,32.472C58,38.001,53.501,42.5,47.972,42.5H44
		c-0.553,0-1,0.447-1,1s0.447,1,1,1h3.972C54.604,44.5,60,39.104,60,32.472C60,26.983,56.173,22.06,50.976,20.694z"/>
                                            <path d="M38.293,45.793L32,52.086V31.5c0-0.553-0.447-1-1-1s-1,0.447-1,1v20.586l-6.293-6.293c-0.391-0.391-1.023-0.391-1.414,0
		s-0.391,1.023,0,1.414l7.999,7.999c0.092,0.093,0.203,0.166,0.326,0.217C30.74,55.474,30.87,55.5,31,55.5s0.26-0.026,0.382-0.077
		c0.123-0.051,0.234-0.124,0.326-0.217l7.999-7.999c0.391-0.391,0.391-1.023,0-1.414S38.684,45.402,38.293,45.793z"/>
                                        </svg>
                                    </Button>
                                </div>
                            );

                        }

                        var key = "row" + index;
                        var line = <div className="list" key={key}>
                            {row}
                        </div>

                        return (
                            <ResourceList.Item
                                id={index}

                            >
                                {line}
                            </ResourceList.Item>
                        );
                    }}
                />
                {this.state.processing && this.state.filtering === true ? this.renderLoading() : ''}
                {this.state.failureList.length === 0 && this.state.filtering === false ? this.renderEmpty() : ''}
                {this.isNextPage() && this.state.refreshing === false && this.state.filtering === false? this.renderFailureTableFooter() : ''}
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
                        <Button loading={this.state.processing && this.state.refreshing === false && this.state.filtering === false} onClick={this.handleMoreBtnClick}><CsI18n>More</CsI18n></Button>
                    </Stack.Item>
                </Stack>
            </div>
        )
    }
}
export default LogTab;
