import React from 'react'
import CsI18n from "../../../components/csI18n"


import {
  Button,
  Card,
  Banner,
  Badge,
  Heading,
  Page,
  Stack,
  ResourceList,
  Spinner, Layout, DataTable, TextStyle, Icon, Link, Tooltip, FilterType, Select, Avatar,
} from '@shopify/polaris';
import {ChevronLeftMinor} from "@shopify/polaris-icons";
import Util from '../../../helpers/Util';
import AmazonTab from "../../../helpers/amazon-tab";
import shopifyContext from "../../../context";
import ApplicationApiCall from "../../../functions/application-api-call";
import CsErrorMessage from "../../../components/csErrorMessage";
//import TestData from "../../../testData";
import "./feeds.scss";
import "../actions.scss";
import {ReactComponent as DownloadIcon} from "../../../resource/download.svg";

//report type
const FEED_TYPE = [
  {value: "product",    label: CsI18n.t('Product')},
  {value: "relationship",    label: CsI18n.t('Relationship')},
  {value: "price",      label: CsI18n.t('Price')},
  {value: "inventory",  label: CsI18n.t('Inventory')},
  {value: "orderacknowledgement", label: CsI18n.t('Order Acknowledgement')},
  {value: "orderfulfillment",     label: CsI18n.t('Order Fulfillment')},
  {value: "image",      label: CsI18n.t('Image')},
  {value: "delete",     label: CsI18n.t('Delete')}
];

//report status
const FEED_STATUS = [
  {value: 'done',                                         label: CsI18n.t('Done'), status: 'success'},
  {value: 'in_progress',                                  label: CsI18n.t('Progress'), status: 'attention'},
  {value: 'cancelled',                                    label: CsI18n.t('Cancelled'), status: 'warning'},
  {value: 'awaiting_asynchronous_reply',                  label:CsI18n.t('Awaiting'), status: 'info'},
  {value: 'in_safety_net',                                label:CsI18n.t('Safety'), status: 'info'},
  {value: 'submitted',                                    label: CsI18n.t('Submitted'), status: 'info'},
  {value: 'unconfirmed',                                  label: CsI18n.t('Unconfirmed'), status: 'attention'}
]

const FILTER = {id: "0", status: "1", type: "2", submittedDate: "3", startedDate: "4", completedDate: "5"};

const ERROR = 'error';
const WARNING = 'warning';
const SUCCESS = 'success';
const RESOVLED = 'resolved';

const STATUS_DONE = '_DONE_';

const DEFAULT_PAGE_COUNT = 20;
const SELECT_PAGE_OPTIONS = [
  {label: 20, value: 20},
  {label: 50, value: 50},
  {label: 100, value: 100},
]


class FeedList extends AmazonTab {

  state = {
    ...this.state,
    processing: true,
    error: false,
    allCount:0,
    count: 0,
    reportList: [],
    selectedMarketplaceTab: 0,
    reportDetail: false,
    appliedFilters: [],
    searchValue: '',
    page_item_count : DEFAULT_PAGE_COUNT,
    search_more: false
  }

  constructor(props) {
    super(props);

    this.initialState = Util.clone(this.state);
    this.dataRows = [];
    this.filteredRows = [];
    this.selectedConfiguration = this.getConfigurationSelectedIndex();
    this.shopify = shopifyContext.getShared();
    this.unMounted = false;
  }

  componentWillUpdate(nextProps, nextState, nextContext) {
  }

  componentDidMount() {
    this.fetchFeeds(true);
  }

  componentWillUnmount() {
    this.unMounted = true;
  }

  componentWillReceiveProps(nextProps) {
    super.componentWillReceiveProps(nextProps);
    if (this.unMounted) {
      return;
    }
    if(this.selectedConfiguration !== this.getConfigurationSelectedIndex()){
      this.selectedConfiguration = this.getConfigurationSelectedIndex();
      this.init();
    }
  }

  init = () => {
    this.dataRows = [];
    this.filteredRows = [];
    this.setState(Util.clone(this.initialState));
  }

  fetchFeeds(isNew=false) {
    let configuration = this.shopify.getConfigurationSelected();
    let limit_from = isNew? 0:this.state.reportList.length;
    let limit_to = this.state.page_item_count;

    let params = {configuration, limit_from, limit_to, search: this.state.searchValue};
    ApplicationApiCall.get('/application/offers/feeds', params, (data) => { this.cbInit(isNew, data) }, this.cbInitError);
    if( isNew ) {
      this.setState({processing: true});
    } else {
      this.setState({search_more: true});
    }
  }

  cbInit = (isNew, json) => {
    console.log(this.shopify, this.state);

    if(!json || this.unMounted) {
      return;
    }

    let count = json.count ? parseInt(json.count) : 0;
    let allCount = this.state.searchValue === ''? count:this.state.allCount;
    let reportList;
    let selected;

    if( isNew ) {
      reportList = json.data;
    } else {
      reportList = json.data ? this.state.reportList.concat(json.data) : this.state.reportList;
    }

    this.filterRows(this.state.appliedFilters, reportList);

    this.setState({
      allCount: allCount,
      count: count,
      processing: false,
      reportList: reportList,
      search_more: false,
    });

  }

  cbInitError = (err) => {
    console.log(err);
    if (this.unMounted) {
      return;
    }

    if(err){
      this.setState({error: err, processing: false, search_more: false})
    }
  }

  compare = (a, b) => {
    if(parseInt(a["MessageID"]) < parseInt(b["MessageID"])){
      return -1;
    }
    if(parseInt(a["MessageID"]) > parseInt(b["MessageID"])){
      return 1;
    }
    return 0;
  }

  getReportDetail = (item) => () => {
    console.log("getReportDetail", item);
    this.setState({reportDetail : item})
  }

  handleRefresh = () => {
    this.fetchFeeds(true);
  }

  handleBackToReportList = () => {
    this.setState({reportDetail : false});
  }

  handleSearchChange = (value) => {
    this.setState({searchValue: value});
  }

  handleSearchClick = () => {
    this.fetchFeeds(true);
  }

  handleFiltersChange = (appliedFilters) => {
    this.filterRows(appliedFilters, this.state.reportList);
    this.setState({appliedFilters: appliedFilters});
  }

  handleMoreBtnClick = () => {
    this.fetchFeeds(false);
  }

  isCheckBool = (value) => {
    return value == true;
  }

  hasMore() {
    return this.state.reportList.length < this.state.count;
  }

  isEveryBool = (array) => {
    return array.every(this.isCheckBool)
  }

  handlePageItemCountChange = (value) => {
    this.setState({page_item_count: parseInt(value)})
  }

  handleDownloadBtnClick = (submissiont_id) => () => {
    // console.log(batch);
    let fileName = "xml_" + submissiont_id + ".log";
    ApplicationApiCall.downloadOnlyOnChrome('/logs/' + fileName , {}, fileName, this.downloadSuccess, this.downloadFail);
  }

  downloadSuccess = () => {
  }

  downloadFail = (err) => {
  }

  filterRows(appliedFilters, reportList) {
    console.log("filterRows", appliedFilters, reportList);
    this.filteredRows = [];
    // this.filteredRows_selected = [];
    for (let index in reportList) {
      let item = reportList[index];

      if (!this.checkFilter(appliedFilters, item)) {
        continue;
      }
      this.filteredRows.push(item);
      // this.filteredRows_selected.push(selected[index]);
    }
    console.log("filterRows", this.filteredRows);
  }

  checkFilter(appliedFilters, item) {
    let arr = this.checkFilterOptions(appliedFilters, item);
    console.log("checkFilter", arr);
    return this.isEveryBool(arr);
  }

  checkFilterOptions(appliedFilters, item) {
    let array = [];
    appliedFilters.forEach((filter) => {
      if(filter.key === FILTER.id){
        console.log("FILTER.id", filter, item);
        if(filter.value && item.FeedSubmissionId && item.FeedSubmissionId.toLowerCase().indexOf(filter.value.toLowerCase()) !== -1 ){
          array.push(true);
        }else{
          array.push(false);
        }
      } else if (filter.key === FILTER.status) {
        if (filter.value && item.FeedProcessingStatus && item.FeedProcessingStatus.toLowerCase().indexOf(filter.value.toLowerCase()) !== -1) {
          array.push(true);
        } else {
          array.push(false);
        }
      } else if (filter.key === FILTER.type) {
        if (filter.value && item.FeedType && item.FeedType.toLowerCase().indexOf(filter.value.toLowerCase()) !== -1) {
          array.push(true);
        } else {
          array.push(false);
        }
      } else if (filter.key === FILTER.submittedDate) {
          let submittedDate = item.SubmittedDate ? item.SubmittedDate : null;

        if (filter.value && submittedDate && submittedDate === filter.value) {
          array.push(true);
        } else {
          array.push(false);
        }

      } else if (filter.key === FILTER.startedDate) {
        let startDate = item.StartedProcessingDate ? Util.getDateString(new Date(item.StartedProcessingDate)) : null;

        if (filter.value && startDate && startDate === filter.value) {
          array.push(true);
        } else {
          array.push(false);
        }

      } else if (filter.key === FILTER.completedDate) {
        let completeDate = item.completedDate ? Util.getDateString(new Date(item.completedDate)) : null;

        if (filter.value && completeDate && completeDate === filter.value) {
          array.push(true);
        } else {
          array.push(false);
        }

      }
    });

    return array;
  }

  initRow() {
    this.dataRows = [];

    for(let index in this.filteredRows){
      let item = this.filteredRows[index];
      let processing = false;

      let status = <Badge key={index}>{item.FeedProcessingStatus}</Badge>;
      let type = item.FeedType;

      FEED_STATUS.map(field => {
        if(item.FeedProcessingStatus.toLowerCase().indexOf(field.value) !== -1){
          status = <Badge key={index} status={field.status}>{ field.label}</Badge>
        }
      });

      if( item.FeedProcessingStatus != STATUS_DONE){
        processing = true;
      }

      FEED_TYPE.map(field => {
        if(item.FeedType.toLowerCase().indexOf(field.value) !== -1){
          type = field.label;
        }
      });

      let duration = Util.getDuration(item.StartedProcessingDate, item.CompletedProcessingDate);
      duration = duration !== false? duration + '"':'-';
      let humanTimeElapsed = item.humanTimeElapsed;
      let messageSuccess = '';
      let messageError = '';
      let messageWarining = '';

      if( item.MessagesSuccessful ) {
        messageSuccess = <Badge status="success">{item.MessagesSuccessful}</Badge>;
      }
      if( item.MessagesWithWarning && item.MessagesWithWarning > 0 ) {
        messageWarining = <Badge status="attention">{item.MessagesWithWarning}</Badge>;
      }
      if( item.MessagesWithError && item.MessagesWithError > 0 ) {
        messageError    =  <Badge status="warning">{item.MessagesWithError}</Badge>
      }

      let has_detail = item.feedResult.length? true:false;
      let view_buttton = '';
      if( has_detail ) {
        view_buttton = <Button size="slim" onClick={this.getReportDetail(item)}><CsI18n>View</CsI18n></Button>;
      }

      let marketplace_codes = item.MarketplaceCodes;
      let codes = [];
      for(let iso_code of marketplace_codes) {
        let flag_url = this.shopify.static_content + '/amazon/flags/flag_' + iso_code + '_64px.png';
        codes.push(<Stack.Item key={item.FeedSubmissionId + "_" + iso_code}><Avatar source={flag_url} alt={iso_code} size="small"/></Stack.Item>)
      }

      this.dataRows[index] = [];
      this.dataRows[index].push(<Stack spacing={"extraTight"}>{codes}</Stack>);
      this.dataRows[index].push(
        <Stack wrap={false}>
          <Stack.Item>{item.FeedSubmissionId}</Stack.Item>
          {this.shopify.admin ?
              <Stack.Item><Button plain onClick={this.handleDownloadBtnClick(item.FeedSubmissionId)}>
                <span className={"download-button"}><DownloadIcon /></span>
              </Button></Stack.Item>
              : ""}
        </Stack>
        );
      this.dataRows[index].push(status);
      this.dataRows[index].push(type);
      this.dataRows[index].push(messageSuccess);
      this.dataRows[index].push(messageError);
      this.dataRows[index].push(messageWarining);
      this.dataRows[index].push(item.SubmittedDate)
      this.dataRows[index].push(humanTimeElapsed)
      this.dataRows[index].push(duration !== '' ? duration : '')
      this.dataRows[index].push(view_buttton);
    }
  }

  render() {
    let content;

    if (this.state.error) {
      content = this.renderError();
    } else if (this.state.reportDetail) {
      content = this.renderReportDetail();
    } else {
      content = this.renderReportData();
    }
    return (
      <div className="feed-list">
        {content}
      </div>
    );
  }

  renderError(){

    let errorType;
    let errorMessage;

    if(this.state.error){
      errorType = this.state.error.type;
      errorMessage = this.state.error.message
    }else if(this.state.reportDetailError){
      errorType = this.state.reportDetailError.type;
      errorMessage = this.state.reportDetailError.message
    }

    return(

        <CsErrorMessage
          errorType={errorType}
          errorMessage={errorMessage}
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
    return (
      <div>
        <br/>
        <Banner status="warning" title={CsI18n.t("No data")}>
          <TextStyle><CsI18n>No feed available</CsI18n></TextStyle>
        </Banner>
        <br/>
      </div>
    )
  }

  renderFiler() {

    const reportFilters = [
      {
        key: FILTER.id,
        label: CsI18n.t('Submission ID'),
        operatorText: CsI18n.t('Contains'),
        type: FilterType.TextField,
      },
      {
        key: FILTER.status,
        label: CsI18n.t('Status'),
        operatorText: CsI18n.t('Contains'),
        type: FilterType.Select,
        options: [CsI18n.t('Done'), CsI18n.t('Failed'), CsI18n.t('Progress')],
      },
      {
        key: FILTER.type,
        label: CsI18n.t('Type'),
        operatorText: CsI18n.t('Contains'),
        type: FilterType.TextField,
      },
      {
        key: FILTER.submittedDate,
        label: CsI18n.t('Submitted'),
        operatorText: CsI18n.t('is'),
        type: FilterType.TextField,
        textFieldType: 'date',
      },
      {
        key: FILTER.startedDate,
        label: CsI18n.t('Started'),
        operatorText: CsI18n.t('is'),
        type: FilterType.TextField,
        textFieldType: 'date',
      },
      {
        key: FILTER.completedDate,
        label: CsI18n.t('Completed'),
        operatorText: CsI18n.t('is'),
        type: FilterType.TextField,
        textFieldType: 'date',
      }
    ];

    const action = {
      content: CsI18n.t("Search"),
      onAction: this.handleSearchClick,
      loading: this.state.processing === true
    }

    return (
          <ResourceList.FilterControl
            filters={reportFilters}
            appliedFilters={this.state.appliedFilters}
            onFiltersChange={this.handleFiltersChange}
            searchValue={this.state.searchValue}
            onSearchChange={this.handleSearchChange}
            additionalAction={{
              content: CsI18n.t('Search'),
              loading: this.state.processing,
              disabled: this.state.processing,
              onAction: () => this.handleSearchClick(),
            }}
          />

    );
  }

  renderReportData(){

    let content;
    if( this.state.refreshing === true || this.state.processing === true ) {
      content = this.renderLoading();
    } else if(this.state.reportList.length === 0) {
      content = this.renderEmpty();
    } else {
      content = this.renderReportTable();
    }
    return(
      <div>
        {this.renderFiler()}
        {content}
      </div>
    )
  }

  renderReportTable(){

    this.initRow();

    return(
      <div className="report-table feeds-list">
        <DataTable
          columnContentTypes={[
            'text',
            'text',
            'text',
            'text',
            'text',
            'text',
            'text',
            'text',
            'text',
            'text',
            'numeric',
          ]}
          headings={[
            <Heading></Heading>,
            <Heading><CsI18n>Submission ID</CsI18n></Heading>,
            <Heading><CsI18n>Status</CsI18n></Heading>,
            <Heading><CsI18n>Type</CsI18n></Heading>,
            <Badge status="success"><span className="symbol">&#10003;</span></Badge>,
            <Badge status="warning"><span className="error">&#9888;</span></Badge>,
            <Badge status="attention"><span className="symbol">&#9872;</span></Badge>,
            <Heading><CsI18n>&#9200;</CsI18n></Heading>,
            <Heading><CsI18n>&#128197;</CsI18n></Heading>,
            <Heading>&#9201;</Heading>,
            <Button disabled={this.state.refreshing === true} onClick={this.handleRefresh}><CsI18n>Refresh</CsI18n></Button>
          ]}
          rows={this.dataRows}/>
          {this.hasMore() ? this.renderFeedsTableFooter() : ''}
      </div>
    )
  }

  renderFeedsTableFooter() {
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
              <Button loading={this.state.search_more} onClick={this.handleMoreBtnClick}><CsI18n>More</CsI18n></Button>
            </Stack.Item>
          </Stack>
        </div>
    )
  }

  renderReportDetail(){
    let item = this.state.reportDetail;


    let content;

    if(this.state.reportDetailError){
      content = this.renderError();
    }else if(this.state.reportDetail.length === 0){
      content = this.renderEmpty();
    }else{
      content = (<div className="report-detail-message">
        <Card sectioned>
          <Stack vertical>
            <Stack.Item>
              <Stack distribution="fillEvenly">
                <Stack.Item>
                  <Stack vertical spacing="tight">
                    <Stack.Item>
                      <Stack>
                        <Stack.Item>
                          <div className="report-detail-key"><TextStyle variation="strong"><CsI18n>Submission ID</CsI18n></TextStyle></div>
                        </Stack.Item>
                        <Stack.Item>{item.FeedSubmissionId}</Stack.Item>
                      </Stack>
                    </Stack.Item>
                    <Stack.Item>
                      <Stack>
                        <Stack.Item>
                          <div className="report-detail-key"><TextStyle variation="strong"><CsI18n>Batch ID</CsI18n></TextStyle></div>
                        </Stack.Item>
                        <Stack.Item>{item.BatchId}</Stack.Item>
                      </Stack>
                    </Stack.Item>
                  </Stack>
                </Stack.Item>
                <Stack.Item>
                  <Stack vertical spacing="tight">
                    <Stack.Item>
                      <Stack>
                        <Stack.Item>
                          <div className="report-detail-key"><CsI18n>Entries Processed</CsI18n></div>
                        </Stack.Item>
                        <Stack.Item><Badge
                            status="info">{item.MessagesProcessed}</Badge></Stack.Item>
                      </Stack>
                    </Stack.Item>
                    <Stack.Item>
                      <Stack>
                        <Stack.Item>
                          <div className="report-detail-key"><CsI18n>Entries Successful</CsI18n></div>
                        </Stack.Item>
                        <Stack.Item><Badge
                            status="success">{item.MessagesSuccessful}</Badge></Stack.Item>
                      </Stack>
                    </Stack.Item>
                  </Stack>
                </Stack.Item>
                <Stack.Item>
                  <Stack vertical spacing="tight">
                    <Stack.Item>
                      <Stack>
                        <Stack.Item>
                          <div className="report-detail-key"><CsI18n>Entries with Error</CsI18n></div>
                        </Stack.Item>
                        <Stack.Item><Badge
                            status="warning">{item.MessagesWithError}</Badge></Stack.Item>
                      </Stack>
                    </Stack.Item>
                    <Stack.Item>
                      <Stack>
                        <Stack.Item>
                          <div className="report-detail-key"><CsI18n>Entries with Warning</CsI18n></div>
                        </Stack.Item>
                        <Stack.Item><Badge
                            status="attention">{item.MessagesWithWarning}</Badge></Stack.Item>
                      </Stack>
                    </Stack.Item>
                  </Stack>
                </Stack.Item>
              </Stack>
            </Stack.Item>
            <Stack.Item>
              {this.renderLogs(item)}
            </Stack.Item>
          </Stack>
        </Card>
      </div>);
    }

    return(
      <div className="report-detail">
        <div className={"btn-link mb-2"}><Link onClick={this.handleBackToReportList}><Icon source={ChevronLeftMinor} color="inkLighter"/><CsI18n>Feeds</CsI18n></Link></div>
        {content}
      </div>
    )
  }

  renderLogs(feedSubmission){

    let rows = [];
    // let reportList= [];

    // if(!feedSubmission.Result.length) {
    //   reportList.push(feedSubmission.Result);
    // }else{
    //   reportList = feedSubmission.Result;
    // }
    //
    for(let index in feedSubmission.feedResult) {
      let result = feedSubmission.feedResult[index];
      rows[index] = []

      // let additionalInfo = [];
      let resultCode;
      // for (let key in result.sku){
      //   additionalInfo.push(<Stack.Item key={index + key}>
      //     <Stack wrap={false} distribution="trailing" spacing="tight">
      //       <Stack.Item>{key + ":"}</Stack.Item>
      //       <Stack.Item>{result.AdditionalInfo[key]}</Stack.Item>
      //     </Stack>
      //   </Stack.Item>);
      // }

      let result_code = result.result_code.toLowerCase();
      if ( result_code === ERROR) {
        resultCode = <Badge status="warning">{result.result_code}</Badge>
      } else if (result_code === SUCCESS ) {
        resultCode = <Badge status="success">{result.result_code}</Badge>
      } else if (result_code === WARNING) {
        resultCode = <Badge status="attention">{result.result_code}</Badge>
      } else if ( result_code === RESOVLED ) {
        resultCode = <Badge>{result.result_code}</Badge>
      }

      rows[index].push(result.id_message);
      rows[index].push(resultCode);
      rows[index].push(result.result_message_code);
      rows[index].push(result.result_description);
      rows[index].push(result.sku);
    }


    return(
      <div className="report-detail-table">
        <DataTable
          columnContentTypes={[
            'text',
            'text',
            'text',
            'text',
            'text',
          ]}
          headings={[
            <Heading><CsI18n>ID</CsI18n></Heading>,
            <Heading><CsI18n>Result</CsI18n></Heading>,
            <Heading><CsI18n>Code</CsI18n></Heading>,
            <Heading><CsI18n>Description</CsI18n></Heading>,
            <Heading><CsI18n>SKU</CsI18n></Heading>,
          ]}
          rows={rows}
        />
      </div>
    )
  }

}
export default FeedList;
