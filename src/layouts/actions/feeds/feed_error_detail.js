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
  Spinner, Layout, DataTable, TextStyle, Icon, Link, Tooltip, FilterType, DisplayText, Select, Checkbox, TextField, Avatar,
} from '@shopify/polaris';
import {
  ChevronDownMinor,
  ChevronLeftMinor,
  ChevronUpMinor,
  CircleChevronRightMinor,
  MarkFulfilledMinor
} from "@shopify/polaris-icons";
import Util from '../../../helpers/Util';
import shopifyContext from "../../../context";
import ApplicationApiCall from "../../../functions/application-api-call";
import CsErrorMessage from "../../../components/csErrorMessage";
import "../actions.scss";
import "./feeds.scss";

import {ERROR_ACTION_TYPE} from "../../../constant/actions/feeds";
import ErrorType1 from "./error_list/error_type1";
import ErrorType2 from "./error_list/error_type2";

import FeedContext from "./feed-context";
import Help from "../../../help";

const DEFAULT_PAGE_COUNT = 20;
const SELECT_PAGE_OPTIONS = [
  {label: 20, value: 20},
  {label: 50, value: 50},
  {label: 100, value: 100},
];

class FeedErrorDetail extends React.Component {
  static contextType = FeedContext;
  state = {
    ...this.state,
    loading: true,
    error: false,
    count: 0,
    errorDetail: false,
    itemList: [],
    page_item_count : DEFAULT_PAGE_COUNT,
    search_more: false
  }

  constructor(props) {
    super(props);

    this.initialState = Util.clone(this.state);
    this.error_data = this.props.error_data;
    this.page_type = this.props.page_type;
    this.shopify = shopifyContext.getShared();


    this.unMounted = false;
  }

  componentWillUpdate(nextProps, nextState, nextContext) {
  }

  componentDidMount() {
    if( this.context.errorItemList[this.error_data.error_code] ) {
      let data = this.context.errorItemList[this.error_data.error_code];
      this.setState({count: data.count, itemList: data.items, loading: false});
    } else {
      this.fetchItems(true);
    }
  }

  fetchItems(isNew=false) {
    let configuration = this.shopify.getConfigurationSelected();
    let limit_from = isNew? 0:this.state.itemList.length;
    let limit_to = this.state.page_item_count;

    let params = {configuration, limit_from, limit_to, error_code: this.error_data.error_code, page_type: this.props.page_type, action_type: this.error_data.error_solved_type};
    ApplicationApiCall.get('/application/offers/feeds_error_details', params, (data) => { this.cbInit(isNew, data) }, this.cbInitError);
    if( isNew ) {
      this.setState({loading: true});
    } else {
      this.setState({search_more: true});
    }
  }

  updateContext(count, itemList) {
    this.context.errorItemList[this.error_data.error_code] = {count: count, items: itemList}
  }

  cbInit = (isNew, json) => {
    console.log("cbInit", isNew, json, this.state);

    if(!json || this.unMounted !== false) {
      return;
    }

    let count = json.count ? parseInt(json.count) : 0;
    let itemList;

    let errors = [];
    if( json.errors ) {
      for(let i = 0; i < json.errors.length; i++ ) {
        let {id_log, ...item} = json.errors[i];
        item.disabled = false;
        item.id = id_log;
        errors.push(item);
      }
    }

    if( isNew ) {
      itemList = errors;
    } else {
      itemList = this.state.itemList.concat(errors);
    }

    this.updateContext(count, itemList);
    // console.log("cbInit setState", count, itemList);

    this.setState({
      count: count,
      itemList: itemList,
      loading: false,
      search_more: false,
    });

  }

  cbInitError = (err) => {
    console.log(err);

    if(err && this.unMounted === false){
      this.setState({error: err, loading: false, search_more: false})
    }
  }

  componentWillUnmount() {
    this.unMounted = true;
  }

  handleBack = () => {
    let {onBack} = this.props;
    if( onBack ) {
      onBack();
    }
  }

  setDisable(ids) {
    let itemList = this.state.itemList;
    console.log("setDisable", ids, itemList);
    for(let index in ids) {
      for(let i = 0; i < itemList.length; i++) {
        if( itemList[i].id == ids[index].id ) {
          itemList[i].disabled = true;
        }
      }
    }
    this.updateContext(this.state.count, itemList);
    this.setState({itemList: itemList});
  }

  handleAction = (action_type, selected, cbSuccess, cbError) => {
    console.log("handleAction", action_type, selected);
    let configuration = this.shopify.getConfigurationSelected();

    let params = {configuration, error_code: this.error_data.error_code, page_type: this.props.page_type, action_type};

    ///*
    ApplicationApiCall.post('/application/offers/feeds_action', params, { items: selected},
        (data) => {
          cbSuccess(data);
          this.setDisable(selected);
        },
        (error) => {
          cbError(error);
        });
        //*/
    // setTimeout(() => {
    //   cbSuccess("Successful processed");
    //   this.setDisable(selected);
    // }, 200);
  }

  handleMoreBtnClick = () => {
    this.fetchItems(false);
  }

  hasMore() {
    return this.state.itemList.length < this.state.count;
  }

  handlePageItemCountChange = (value) => {
    this.setState({page_item_count: parseInt(value)})
  }

  //{help_link:tag}tutorial{/help_link}
  parseErrorDetail(message) {
    let exp = /\{help_link\:([^\}]+)\}([^\{]+)\{\/help_link\}/;
    let match;

    if (match = exp.exec(message)) {
      let url;
      let result = [];
      let tag_param1 = match[1];
      let text_param2 = match[2];
      let help_url = Help.getHelpUrl('feed')+"/"+tag_param1;

      let nMatchPos = match.index;
      let tmp1 = message.slice(0, nMatchPos);
      let tmp2 = "<a href='"+help_url+"' target='_blank'>"+text_param2+"</a>";
      let tmp3 = message.slice(nMatchPos + match[0].length );

      message = tmp1 + tmp2 + tmp3;
    }
    return React.createElement("p", { dangerouslySetInnerHTML: { __html: message } });
  }

  render() {
    let error_data = this.error_data;
    return (
      <div className="feed_error-detail">
        <div className="feeds-error-detail">
          <div className={"btn-link mb-2"}><Link onClick={this.handleBack}><Icon source={ChevronLeftMinor} color="inkLighter"/><CsI18n>List</CsI18n></Link></div>
          <Card sectioned>
            <Heading><CsI18n>Diagnosis</CsI18n></Heading>
            <div className={"error-diagnosis mt-1"}>
              {React.createElement("p", { dangerouslySetInnerHTML: { __html: error_data.error_details } })}
            </div>
            {error_data.error_resolution? (<React.Fragment>
              <br/>
              <Heading><CsI18n>Solution</CsI18n></Heading>
              <div className={"error-solution mt-1"}>
                {this.parseErrorDetail(error_data.error_resolution)}
              </div></React.Fragment>):''}

            {this.renderErrorItems()}
          </Card>
        </div>
      </div>
    );
  }

  renderError(){
    let errorType;
    let errorMessage;
    if(this.state.error){
      errorType = this.state.error.type;
      errorMessage = this.state.error.message
    }
    return( <CsErrorMessage errorType={errorType} errorMessage={errorMessage} /> );
  }

  renderLoading() {
    return (
        <div className="loading">
          <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
        </div>
    )
  }

  renderErrorItems() {
    let error_message = '';
    if ( this.state.error ) {
      error_message = this.renderError();
    }

    let contents = '';
    if( this.state.loading ) {
      contents = this.renderLoading();
    } else {
      let error_data = this.error_data;
      let error_items = this.state.itemList;
      switch(error_data.error_solved_type) {
        case ERROR_ACTION_TYPE.Confirm_ASIN:
          contents = (<ErrorType1 action_type={error_data.error_solved_type} data={error_items} onAction={this.handleAction} />);
          break;

        case ERROR_ACTION_TYPE.Solved:
        default:
          contents = (<ErrorType2 action_type={error_data.error_solved_type} data={error_items} onAction={this.handleAction} />);
          break;
      }
    }

    return (<React.Fragment>
      {error_message}
      {contents}
      { (this.state.loading === false && this.hasMore()) ? this.renderTableFooter() : ''}
    </React.Fragment>);
  }

  renderTableFooter() {
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
}
export default FeedErrorDetail;
