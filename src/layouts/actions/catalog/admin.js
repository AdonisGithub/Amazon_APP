import React from 'react'
import CsI18n from "../../../components/csI18n"
import Prism from 'prismjs';
// import xml_data from "../../../testData/xml_data.json"

import {
  Heading,
  Stack,
  Banner,
  Spinner,
  Layout,
  TextStyle,
  Checkbox,
  Button,
  Select,
  Link,
  ResourceList, RadioButton, Tooltip, Icon, Badge,
  TextField, DisplayText
} from '@shopify/polaris';

import {ViewMinor} from "@shopify/polaris-icons";

import ApplicationApiCall from "../../../functions/application-api-call";
import shopifyContext from "../../../context";
import AmazonTab from "../../../helpers/amazon-tab";
import "../actions.scss"
import CsErrorMessage from "../../../components/csErrorMessage";
import Util from "../../../helpers/Util"
import CsImageModal from '../../../components/csImageModal'
import States from "../../../helpers/rules/states";
import CsNoImage from "../../../components/csNoImage";

class Admin extends AmazonTab {

  state = {
    processing: false,
    searchValue: '',
    searchType: '',
    searchResult: '',
    error: false,
    refresh: true,
  }

  constructor(props) {
    super(props);
    this.initialState = Util.clone(this.state);
    this.marketplaceInfo = props.marketplaceInfo;
    this.selectedConfiguration = this.getConfigurationSelectedIndex();
    this.shopify = shopifyContext.getShared();
  }

  componentWillMount() {
    window.addEventListener('keypress', this.handleEnterKey);
    require('prismjs/themes/prism-funky.css');
  }

  componentWillUnmount() {
    this.unMouted = true;
    window.removeEventListener('keypress', this.handleEnterKey);
  }

  handleEnterKey = (e) => {
    if(e.keyCode === 13){
      // console.log('Enter key')
      if(this.state.searchValue !== '' && !this.state.processing){
        this.search();
      }
    }
  }

  search() {
      this.setState({processing: true});
      let configuration = this.shopify.getConfigurationSelected();
      let marketplace_id = this.props.marketplaceInfo.MarketplaceId;
      let q = this.state.searchValue;
      let params = {configuration, marketplace_id, q};

      ApplicationApiCall.get('/application/admin_tool/search', params, this.cbSearchData, this.cbSearchError, false);
      // setTimeout(() => {
      //   this.cbSearchData(xml_data.data);
      // }, 100);
  }

  cbSearchData = (json) => {
    console.info("cbSearchData", json);
    if (json && this.unMounted === false) {
      let searchResult = Prism.highlight(json.result, Prism.languages.xml, 'language-xml');
      this.setState({
          searchType: json.query_type,
          searchResult: searchResult,
          refresh: false,
          processing: false,
      });
    }
  }

  cbSearchError = (err) => {
    console.log(err);

    if(err && this.unMounted === false){

      this.setState({error: err, processing: false})
    }
  }

  handleSearchChange = (value) => {
    this.setState({searchValue: value});
  }

  handleSearchBtnClick = () => {
    if(this.state.searchValue !== ''){
      this.search();
    }
  }

  render() {
    return (
      <div className="admin-tool" id="cs-search">
        {this.renderSearchBox()}
        {this.renderResultBox()}
      </div>
    );
  }

  renderSearchBox()
  {
    let count = 0;

    return (
      <div className="search-box">
          <ResourceList.FilterControl
            searchValue={this.state.searchValue}
            placeholder={"SKU, ASIN, EAN"}
            onSearchChange={this.handleSearchChange}
            additionalAction={{
              content: CsI18n.t('Search'),
              loading: this.state.processing,
              disabled: this.state.processing,
              onAction: () => this.handleSearchBtnClick(),
            }}
          />
      </div>
    )
  }

  renderResultBox()
  {
    let {searchResult, searchType} = this.state;
    if (!searchResult) {
      return null;
    }
    return (<div className={"search-result"}>
      {/*{React.createElement("p", { dangerouslySetInnerHTML: { __html: searchResult } })}*/}
      <Heading>Type: {searchType}</Heading>
      {/*<TextField labelHidden={true} label={"Result"} multiline={10} value={searchResult} readOnly={true} />*/}
      <pre>{React.createElement("code", { dangerouslySetInnerHTML: { __html: searchResult }, className:"language-xml" })}</pre>
    </div>);
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

}

export default Admin;
