import React from 'react';
import CsErrorMessage from "../../../components/csErrorMessage";
import {
  Badge,
  Banner,
  Button,
  Card,
  DataTable,
  Stack,
  TextStyle,
  Select,
  Heading,
  Tooltip,
} from "@shopify/polaris";
import shopifyContext from "../../../context";
import ApplicationApiCall from "../../../functions/application-api-call";
import "../actions.scss"
import Util from "../../../helpers/Util";
import CsI18n from "../../../components/csI18n"
import {ReactComponent as DownloadIcon} from "../../../resource/download.svg";

const SELECT_PAGE_OPTIONS = [
  {label: 10, value: 10},
  {label: 50, value: 50},
  {label: 100, value: 100},
];

export default class ScheduleRow extends React.Component{

  state = {
    ...this.state,
    selected: false,
    processing: false,
    summary: null,
    page_item_count: 10,
    summaryLogs: [],
    schedulerID: null,
    initialLogCount: 0,
    count: 0,
    more: 0,
    moreBtnClicked: false,
  }
  constructor(props){
    super(props);
    this.shopify = shopifyContext.getShared();
    this.unMounted = false;
    this.rowData = [];
    this.state.schedulerID = props.item.idx;
    this.state.summaryLogs = props.item.log.details;
    this.state.initialLogCount = props.item.log.details ? props.item.log.details.length : 0;
    this.state.more = props.item.log.more;
    this.state.selected = props.item.log.collapse;
  }

  componentWillMount() {

  }

  componentWillUnmount() {
    this.unMounted = true;
  }

  componentWillReceiveProps(nextProps, nextContext) {

  }

  getName(){
    return 'ScheduleRow';
  }

  loadMoreDetails(){
    if(this.state.summaryLogs.length === this.state.initialLogCount || (this.state.summaryLogs.length - this.state.initialLogCount) < this.state.count){
      this.setState({processing: true});
      let params = {
        configuration: this.shopify.getConfigurationSelected(),
        limit_from: this.state.summaryLogs.length - this.state.initialLogCount,
        limit_to: this.state.page_item_count,
        scheduler: this.state.schedulerID,
      };
      ApplicationApiCall.get('/application/scheduler/moredetails', params, this.cbMoreDetails, this.cbMoreDetailsError);
    }
  }

  cbMoreDetails = (json) => {
    //console.log(this.state.summaryLogs, json)
    if(json && this.unMounted === false){
      let summaryLogs = json.details ? this.state.summaryLogs.concat(json.details) : this.state.summaryLogs;
      let count = json.count ? parseInt(json.count) : 0;
      this.setState(preState => ({
        ...preState,
        summaryLogs: summaryLogs,
        count: count,
        processing: false,
        more: false}))
    }
  }

  cbMoreDetailsError = (error) => {
    if(error && this.unMounted === false){
      // setTimeout(() => {
      //   this.setState({error: null})
      // })
      this.setState({error:error, processing: false})
    }
  }

  handleViewBtnClick = () => {
    this.setState(({selected}) => ({selected: !selected}));
  }

  handleDownloadBtnClick = (batch) => () => {
    // console.log(batch);
    let fileName = batch + ".log";
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
    //   this.setState({downloadError: null})
    // }, 5000)
    this.setState({error: err, downloading: null});
  }

  handleMoreBtnClick = () => {
    this.state.moreBtnClicked = true;
    this.loadMoreDetails();
  }

  handlePageItemCountChange = (value) => {

    this.setState({page_item_count: parseFloat(value)})
  }

  hasMore(){
    if(this.state.more === 1 || this.state.summaryLogs.length - this.state.initialLogCount < this.state.count){
      return true;
    }
    return false;
  }

  parseMarketplaceName(message){
    let exp = /(\{marketplace_id\}([^\{]+)\{\/marketplace_id\})/;
    let marketplaceName;
    let match;
    let foundMarketplaceid = false;

    if(match = exp.exec(message)){

      this.props.marketplaceInfoList.forEach(info => {
        if(info.MarketplaceId === match[2]){
          marketplaceName = info.Name;
          foundMarketplaceid = true;
        }
      });
      if( foundMarketplaceid === false )
        return null;

      message = message.replace(match[1], marketplaceName);
      return message;
    } else {
      return null;
    }
  }

  removeHightlighMark(text) {
    return text.split("@@@").join("");
  }
  renderHighlight(text) {
    let tmp = text.split("@@@");
    let items = [];
    if( tmp.length == 1)
      return text;
    else {
      let i = 0;
      for( ; i < (tmp.length - 1); i+=2 ) {
        items.push(tmp[i]);
        items.push(<span key={"span" + tmp[i+1] + i} className="highlight">{tmp[i+1]}</span>);
      }
      items.push(tmp[tmp.length-1]);
      return (<React.Fragment key={"fragment" + text} >{items}</React.Fragment>);
    }
  }
  parseAmazonOrder(message) {
    let exp = /^\{amazon_order_id\:([^\}]+)\}([^\{]+)\{\/amazon_order_id\}$/;
    let match;

    if (match = exp.exec(message)) {
      let url;
      let result;

      let param1 = match[1];
      let param2 = match[2];

      let marketplaceId = this.removeHightlighMark(param1);

      let amazonOrderId = this.removeHightlighMark(param2);

      let foundMarketplaceid = false;

      this.props.marketplaceInfoList.forEach(info => {
        if(info.MarketplaceId === marketplaceId){
          url = "https://sellercentral." + info.Name + "/orders-v3/order/" + amazonOrderId;
          foundMarketplaceid = true;
        }
      });
      if( foundMarketplaceid === false )
        return null;

      result = ( <Tooltip
          key={url}
          content="Show on Amazon"
          active={false} preferredPosition="above">
        <a className="info"  href={url} target="_blank">{this.renderHighlight(param2)}</a>
      </Tooltip>);
      return result;
    } else {
      return null;
    }
  }

  parseShopifyOrder(message) {
    let exp = /^\{order_id\}([^\{]+)\{\/order_id\}$/;
    let match;

    if(match = exp.exec(message)){
      let url;
      let result;
      let param1 = match[1];
      url = this.shopify.getShopUrl() + '/admin/orders/' + this.removeHightlighMark(param1);

      result = (<Tooltip
          key={"tooltip_"+param1}
          content={CsI18n.t("Show on Shopify")}
          active={false} preferredPosition="above">
        <a className="info"  href={url} target="_blank">{this.renderHighlight(param1)}</a>
      </Tooltip>);
      return result;
    }else{
      return null;
    }
  }

  parseAmazonProduct(message) {
    // let exp_amazon_product = /^(.*)\{asin\}([^\{]+)\{\/asin\}(.*){marketplace_id\}([^\{]+)\{\/marketplace_id\}(.*)$/;
    let exp = /^\{asin\:([^\}]+)\}([^\{]+)\{\/asin\}$/;
    let match;
    let url;
    let result;

    if (match = exp.exec(message)) {
      let param1 = this.removeHightlighMark(match[1]);
      let param2 = match[2];

      let asin = this.removeHightlighMark(param2);

      let marketplaceName = "";
      let foundMarketplaceid = false;

      this.props.marketplaceInfoList.forEach(info => {
        if (info.MarketplaceId === param1) {
          url = "https://" + info.DomainName + "/dp/" + this.removeHightlighMark(asin);
          marketplaceName = info.Name;
          foundMarketplaceid = true;
        }
      });
      if( foundMarketplaceid === false )
        return null;

      result = ( <Tooltip
        key={url}
        content={CsI18n.t("Show on Amazon")}
        active={false} preferredPosition="above">
        <a className="info"  href={url} target="_blank">{this.renderHighlight(param2)}</a>
      </Tooltip>);
      return result;
    } else {
      return null;
    }
  }

  parseShopifyProduct(message) {
    let exp = /^\{sku\:([^\}]+)\}([^\{]+)\{\/sku\}$/;
    let match;
    let url;
    let result;

    if(match = exp.exec(message)){
      let param1 = match[1];
      let param2 = match[2];
      url = this.shopify.getShopUrl() + "/admin/products/" + param1;

      result = (<Tooltip
        key={"tooltip_"+param1}
        content={CsI18n.t("Show on Shopify")}
        active={false} preferredPosition="above">
        <a className="info"  href={url} target="_blank">{this.renderHighlight(param2)}</a>
      </Tooltip>);
      return result;
    }else{
      return null;
    }
  }

  parseLink(message){
    //message = "asin: {asin:A13V1IB3VIYZZH}B0{highlight}ABC{/highlight}71LB7{highlight}ABC{/highlight}{/asin} quantity: 0 price: 0.00 marketplace: {marketplace_id}A13V1IB3VIYZZH{/marketplace_id} amazon order:  {amazon_order_id:A13V1IB3VIYZZH}123{highlight}ABC{/highlight}{/amazon_order_id} sku: {sku:12345678}AS{highlight}ABC{/highlight}{/sku} shopify order {order_id}1241324{highlight}ABC{/highlight}{/order_id} end{highlight}ABC{/highlight}";
    let key = message;
    let exp_highlight = /(\{highlight\}([^\{]+)\{\/highlight\})/;
    let match;
    let items = [];
    while (match = exp_highlight.exec(message)) {
      message = message.replace(match[1], "@@@"+match[2]+"@@@");
    }

    let exp_mark = /\{[^\{\}]+\}[^\{\}]+\{\/[^\{\}]+\}/;
    let nMatchPos;
    let tmp;
    let result;

    while( match = exp_mark.exec(message) ) {
      nMatchPos = match.index;
      tmp = message.slice(0, nMatchPos);
      items.push(this.renderHighlight(tmp));
      tmp = match[0];
      message = message.slice(nMatchPos + tmp.length );

      if ( result = this.parseShopifyProduct(tmp) ) {
        items.push(result);
      } else if ( result =  this.parseAmazonProduct(tmp) ) {
        items.push(result);
      } else if ( result =  this.parseShopifyOrder(tmp) ) {
        items.push(result);
      } else if ( result =  this.parseAmazonOrder(tmp) ) {
        items.push(result);
      } else if ( result =  this.parseMarketplaceName(tmp) ) {
        items.push(result);
      } else {
        items.push(this.renderHighlight(tmp));
      }
    }
    items.push(this.renderHighlight(message));

    return <React.Fragment key={key}>{items}</React.Fragment>
  }

  getLogsCount(){
    let count = 0;
    this.state.summaryLogs.forEach(item => {
      if(parseInt(item.is_summary) !== 1){
        count ++;
      }
    })
    return count;
  }

  initRow(){

    let idx = 0;
    let message;
    let shopifyProduct;
    this.dataRows = [];

    this.state.summaryLogs.forEach((item)  => {

      if(parseInt(item.is_summary) === 1){
        this.state.summary = item;
      } else {
        this.rowData[idx] = [];
        if(item.message){
          message = this.parseLink(item.message);
        }else{
          message = '';
        }

        let successes = item.successes ? <Badge key={idx + item.successes} status="success">{item.successes}</Badge> : '';
        let warnings = item.warnings ? <Badge key={idx + item.warnings} status="attention">{item.warnings}</Badge> : '';
        let errors = item.errors ? <Badge key={idx + item.errors} status="warning">{item.errors}</Badge> : '';

        let date_start = item.date_start ? Util.getTimeString(new Date(item.date_start)) : '';
        let date_stop  = item.date_stop ? Util.getTimeString(new Date(item.date_stop)) : '';
        let duration = item.duration == '-' ? item.duration :item.duration.toString() + '"';

        this.rowData[idx].push(message);
        this.rowData[idx].push(successes);
        this.rowData[idx].push(warnings);
        this.rowData[idx].push(errors);
        this.rowData[idx].push(date_start);
        this.rowData[idx].push(date_stop);
        this.rowData[idx].push(duration);

        idx ++;
      }

    })

  }

  render(){

    const {idx, section, operation, action, title, created_at, executed_at,  log} = this.props.item;
    const {completed} = log;

    let flag;
    if(parseInt(completed) !== 1){
      flag = <span className="processing">&#9654;</span>
    }else if(parseInt(log.errors) === 0){
      flag = <span className="success">&#10003;</span>
    }else{
      flag = <span className="warning">&#9888;</span>
    }

    console.log("Log:", log, "Completed:", completed);

    return(
      <div id={idx}>
        <div className="list-body">

          <div className="flag">{log.length !== 0 ? flag : ''}</div>
          <div className="section"><TextStyle>{section}</TextStyle></div>
          <div className="operation"><TextStyle>{operation}</TextStyle></div>
          <div className="action"><TextStyle>{action}</TextStyle></div>
          <div className="title"><TextStyle>{title}</TextStyle></div>
          <div className="created"><TextStyle>{created_at}</TextStyle></div>
          <div className="next-exe"><TextStyle>{executed_at}</TextStyle></div>
          <div className="view">
            {log.length !== 0 ?
            <Button
              size="slim"
              disabled={completed === 0}
              onClick={this.handleViewBtnClick}>{completed === 1 ? this.state.selected === false ? 'View' : 'Close' : 'Processing'}</Button>
            : ''}
          </div>
        </div>

        {this.state.selected === true ?
          this.renderScheduleDetail()
          : ''
        }
      </div>
    );
  }

  renderEmpty() {

    return (
      <div>
        <Banner status="warning" title={CsI18n.t('No Schedule Detail Data')}>
          <TextStyle><CsI18n>Sorry, you have no detail of schedule data yet !</CsI18n></TextStyle>
        </Banner>
      </div>
    )
  }

  renderError(){
        return(

      <CsErrorMessage
        errorType={this.state.error.type}
        errorMessage={this.state.error.message}
      />

    )
  }

  renderScheduleDetail(){
    let content;

    if(!this.state.summaryLogs || this.state.summaryLogs.length === 0){
      content = this.renderEmpty()
    }else{
      content = <div className="report-detail">
                    {this.renderData()}
                </div>;
    }

    return(
      <Card sectioned>
        {content}
      </Card>
    )

  }

  renderData(){
    this.initRow();
    return(
      <div>
        {this.state.summary ? this.renderSummary() : ''}
        {this.getLogsCount() > 0 ? this.renderSummaryLogs() : ''}
        {this.hasMore() ? this.renderMore() : ''}
      </div>
    )
  }

  renderSummary(){
    let successes = <Badge status="success">{this.state.summary.successes}</Badge>
    let warnings = <Badge status="attention">{this.state.summary.warnings}</Badge>
    let errors = <Badge status="warning">{this.state.summary.errors}</Badge>
    let duration = this.state.summary.duration === '-' ? this.state.summary.duration : this.state.summary.duration.toString() + '"';
    const {batch} =  this.props.item.log;
    return (
      <div className="schedule-detail-summary">
      <Stack>
        <Heading><CsI18n>Summary</CsI18n></Heading>
      </Stack>
      <br />
      <Stack distribution="fillEvenly">
        <Stack.Item>
          <Stack vertical spacing="tight">
            <Stack.Item>
              <Stack>
                <Stack.Item>
                  <div className="schedule-detail-key"><CsI18n>Title</CsI18n></div>
                </Stack.Item>
                <Stack.Item>{this.state.summary.title}</Stack.Item>
              </Stack>
            </Stack.Item>
            <Stack.Item>
              <Stack>
                <Stack.Item>
                  <div className="schedule-detail-key"><CsI18n>Message</CsI18n></div>
                </Stack.Item>
                <Stack.Item>{this.state.summary.message}</Stack.Item>
              </Stack>
            </Stack.Item>
            <Stack.Item>
              <Stack>
                <Stack.Item>
                  <div className="schedule-detail-key"><CsI18n>Batch Id</CsI18n></div>
                </Stack.Item>
                <Stack.Item>{ batch }</Stack.Item>
                {this.shopify.admin ?
                <Stack.Item><Button plain
                                    onClick={this.handleDownloadBtnClick(batch)}>
                  <DownloadIcon />
                </Button></Stack.Item>
                    : ""}
              </Stack>
            </Stack.Item>
          </Stack>
        </Stack.Item>
        <Stack.Item>
          <Stack vertical spacing="tight">
            <Stack.Item>
              <Stack>
                <Stack.Item>
                  <div className="schedule-detail-key"><CsI18n>Success</CsI18n></div>
                </Stack.Item>
                <Stack.Item>{successes}</Stack.Item>
              </Stack>
            </Stack.Item>
            <Stack.Item>
              <Stack>
                <Stack.Item>
                  <div className="schedule-detail-key"><CsI18n>Warning</CsI18n></div>
                </Stack.Item>
                <Stack.Item>{warnings}</Stack.Item>
              </Stack>
            </Stack.Item>
            <Stack.Item>
              <Stack>
                <Stack.Item>
                  <div className="schedule-detail-key"><CsI18n>Error</CsI18n></div>
                </Stack.Item>
                <Stack.Item>{errors}</Stack.Item>
              </Stack>
            </Stack.Item>
          </Stack>
        </Stack.Item>
        <Stack.Item>
          <Stack vertical spacing="tight">
            <Stack.Item>
              <Stack>
                <Stack.Item>
                  <div className="schedule-detail-key"><CsI18n>Start</CsI18n></div>
                </Stack.Item>
                <Stack.Item>{this.state.summary.date_start}</Stack.Item>
              </Stack>
            </Stack.Item>
            <Stack.Item>
              <Stack>
                <Stack.Item>
                  <div className="schedule-detail-key"><CsI18n>Stop</CsI18n></div>
                </Stack.Item>
                <Stack.Item>{this.state.summary.date_stop}</Stack.Item>
              </Stack>
            </Stack.Item>
            <Stack.Item>
              <Stack>
                <Stack.Item>
                  <div className="schedule-detail-key">&#9201;</div>
                </Stack.Item>
                <Stack.Item>{duration}</Stack.Item>
              </Stack>
            </Stack.Item>
          </Stack>
        </Stack.Item>
      </Stack>
      </div>
    )
  }

  renderSummaryLogs(){

    return(
        <div className="detail-log-table">
          <DataTable
            columnContentTypes={[
              'text',
              'text',
              'text',
              'text',
              'text',
              'text',
              'numeric',

            ]}
            headings={[
              <TextStyle variation="strong"><CsI18n>Messages</CsI18n></TextStyle>,
              <Badge status="success"><span className="symbol">&#10003;</span></Badge>,
              <Badge status="attention"><span className="symbol">&#9872;</span></Badge>,
              <Badge status="warning"><span className="error">&#9888;</span></Badge>,
              <TextStyle variation="strong"><CsI18n>Start</CsI18n></TextStyle>,
              <TextStyle variation="strong"><CsI18n>Stop</CsI18n></TextStyle>,
              <TextStyle variation="strong">&#9201;</TextStyle>,
            ]}
            rows={this.rowData}
          />
        </div>
    )
  }

  renderMore(){
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


