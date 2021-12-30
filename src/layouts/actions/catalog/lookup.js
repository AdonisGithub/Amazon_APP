import React from 'react'
import CsI18n from "../../../components/csI18n"


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
  ResourceList
} from '@shopify/polaris';

import ApplicationApiCall from "../../../functions/application-api-call";
import shopifyContext from "../../../context";
import AmazonTab from "../../../helpers/amazon-tab";
import "../actions.scss"
import CsErrorMessage from "../../../components/csErrorMessage";
import Util from "../../../helpers/Util"
import SearchRow from "./search/searchRow";

const DEFAULT_PAGE_COUNT = 10;
const SELECT_PAGE_OPTIONS = [
  {label: 10, value: 10},
  {label: 20, value: 20},
  {label: 30, value: 30},
  {label: 50, value: 50},
  {label: 100, value: 100},
];
// action type
const ACTION_CHECK = 1;
const ACTION_RADIO = 2;
const ACTION_REMOVE = 3;

class Lookup extends AmazonTab {

  state = {
    ...this.state,
    getStarted: true,
    pages: 0,
    page: 1,
    processing: false,
    searchList: [],
    page_item_count: DEFAULT_PAGE_COUNT,
    error: false,
    checked: [],
    radio: [],
    opened: [],
    isAllChecked: false,
    offering: false,
    offerSuccess: false,
    offerError: false,
    offeredItems: [],
  }

  constructor(props) {
    super(props);
    this.initialState = Util.clone(this.state);
    this.marketplaceInfo = props.marketplaceInfo;
    this.selectedConfiguration = this.getConfigurationSelectedIndex();
    this.shopify = shopifyContext.getShared();
    this.unMouted = false;
    //this.init();
  }

  componentWillUnmount() {
    this.unMouted = true;
  }

  componentWillReceiveProps(nextProps) {
    super.componentWillReceiveProps(nextProps);
    console.log("componentWillReceiveProps", nextProps);


    if(this.marketplaceInfo.MarketplaceId !== nextProps.marketplaceInfo.MarketplaceId ||
      this.selectedConfiguration !== this.getConfigurationSelectedIndex()){
      this.marketplaceInfo = nextProps.marketplaceInfo;
      this.selectedConfiguration = this.getConfigurationSelectedIndex();
      this.setState(this.initialState);
    }
  }

  init = () => {

    if(this.state.pages === 0 || this.state.page <= this.state.pages){
      this.setState({processing: true});
      let configuration = this.shopify.getConfigurationSelected();
      let marketplace_id = this.marketplaceInfo.MarketplaceId;
      let limit_from = this.state.searchList.length;
      let limit_to = this.state.page_item_count;

      let params = {configuration, limit_from, limit_to,  marketplace_id};

      ApplicationApiCall.get('/application/offers/lookup', params, this.cbInitData, this.cbInitError, false);
    }
  }

  cbInitData = (json) => {
    console.log("sbInitData", json);
    let radio = [];
    if (json && this.unMouted === false) {
      let pages = json.pages ? parseInt(json.pages) : 0;
      let searchList = json.products ?  this.state.searchList.concat(json.products) : this.state.searchList;
      searchList.forEach((item, index) => {
        radio[index] = 0;
      })
      this.setState(preState => ({
        ...preState,
          searchList: searchList,
          radio: radio,
          pages: pages,
          processing: false,
      }))
    }
  }

  cbInitError = (err) => {
    console.log(err);


    if(err && this.unMouted === false){
      this.setState({error: err, processing: false})
    }
  }

  cbOfferSuccess = (json) => {
    console.log("cbOfferSuccess", json);

    let offeredItems = this.state.offeredItems.concat(this.state.checked);
    this.setState({offering: false, offerSuccess: true, offeredItems: offeredItems, checked:[], isAllChecked: false});
    setTimeout(() => {
      this.setState({offerSuccess: false, processing: false});
    }, 5000);
  }

  cbOfferFail = (err) => {
    console.log("cbOfferFail", err);
    this.setState({offering: false, offerSuccess: false, offerError: err});
    // setTimeout(() => {
    //   this.setState({offerError: null, processing: false});
    // }, 5000);
  }

  handleCreateOffer = () => {

    let selectedItems = this.state.checked.sort().map(index => {
      return {sku: this.state.searchList[index].source.sku, asin: this.state.searchList[index].result[this.state.radio[index]].asin};
    })
    console.log("%cHandleCreateOffer", 'color:green', selectedItems)

    let configuration = this.shopify.getConfigurationSelected();
    let section = "amazon";
    let marketplace_id = this.marketplaceInfo.MarketplaceId;
    let params = {configuration, section, marketplace_id};
    let data = {marketplace_id, items: selectedItems};
    ApplicationApiCall.post('/application/offers/match', params, data, this.cbOfferSuccess, this.cbOfferFail, false);

    this.setState({offering: true});
  }

  handleMoreBtnClick = () => {
    this.setState(preState => ({
      ...preState,
      page: preState.page + 1,
    }), this.init);
  }

  handlePageItemCountChange = (value) => {

    this.setState({page_item_count: parseFloat(value)})
  }

  /*handleChangeRadioChecked = (index, index1) => () => {


    this.state.radio[index] = index1;
    this.setState({radio: this.state.radio})
  }*/

  handleAllCheck = (value) => {
    let {checked} = this.state;

    if(value === true){
      checked = [];
      this.state.searchList.forEach((item, index) =>{
        if(this.state.offeredItems.indexOf(parseInt(index)) === -1){
          checked.push(parseInt(index));
        }
      })
    }else{
      checked = [];
    }

    this.setState({checked: checked}, this.checkAllfn)
  }

  checkAllfn = () => {

    if (this.state.checked.length === this.state.searchList.length - this.state.offeredItems.length) {
      this.setState({isAllChecked: true});
    } else {
      this.setState({isAllChecked: false});
    }
  }

  handleSearchRowChange = (index) => (field, value) => {
    let {checked, radio} = this.state;
    if(field === ACTION_CHECK){
      if(value === true){
        checked = [...checked, index]
      }else{
        checked.splice(checked.indexOf(index), 1);
      }
      this.setState({checked: checked}, this.checkAllfn)
    }else if(field === ACTION_RADIO){
      radio[index] = value;
      checked = [...checked, index];
      this.setState({radio: radio, checked: checked}, this.checkAllfn);
    }else if(field === ACTION_REMOVE){
      console.log(field, this.state);
      radio[index] = value;
      this.setState({radio: radio});
    }
  }



  render() {
    console.log(this.state)
    let content = "";

    if (this.state.getStarted) {
      content = this.renderGetStarted()
    } else if (this.state.error) {
      content = this.renderError();
    } else if (this.state.processing && this.state.page === 1) {
      content = this.renderLoading();
    } else if (this.state.searchList.length === 0) {
      content = this.renderEmpty();
    } else {
      content = this.renderOffersTable();
    }
    return (
      <div className="lookup-table" id="cs-search">
        {content}
      </div>
    );
  }

  renderSendOffers()
  {
    if (!this.state.checked.length) {
      return '';
    }
    let action = {
      content: CsI18n.t('Send'),
      onAction: () => {
        this.handleCreateOffer()
      },
      loading: this.state.offering,
      disable: this.state.offering
    };
    return(
      <Stack vertical>
        <Stack.Item>
          <br />
        </Stack.Item>
        <Stack.Item>
          <Banner
            title={CsI18n.t("Send offers to Amazon")}
            action={action}
          >
            <p>
              <CsI18n> Once you send the offers, they will appear as inactive on Amazon.On next sync, the offers will be updated as per the rules you configured.</CsI18n>
            </p>

          </Banner>
        </Stack.Item>
        <Stack.Item>
          <br />
        </Stack.Item>
      </Stack>
    )
  }

  renderError(){
    console.log(this.state.error);

    return (
      <div>
        <br/>
        <CsErrorMessage
          errorType={this.state.error.type}
          errorMessage={this.state.error.message}
        />
        <br/>
      </div>
    )
  }

  renderGetStarted()
  {
    let action = {
      content: CsI18n.t('Get started'),
      onAction: () => {
        this.init();
        this.setState(prevState => ({...prevState, getStarted: false, processing: true}))
      },
      loading: this.state.processing,
      disable: this.state.processing
    };
    return(
      <Stack vertical>
        <Stack.Item>
          <br />
        </Stack.Item>
        <Stack.Item>
          <Banner
            title={CsI18n.t("Locate identical offers")}
            action={action}
          >
            <p>
              <CsI18n>Here will be displayed the offers without barcode that are in your store but not yet on Amazon.</CsI18n><br />
              <CsI18n>The objective is to find on Amazon products that are identical to the ones in your store by matching them visually and then create corresponding offers.</CsI18n>
            </p>

          </Banner>
        </Stack.Item>
        <Stack.Item>
          <br />
        </Stack.Item>
      </Stack>
    )
  }


  renderLoading() {
    return (
      <Layout.Section>
        <div className="loading">
          <br/>
          <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
        </div>
      </Layout.Section>
    )
  }

  renderEmpty() {
    return (
      <div>
        <br/>
        <Banner status="warning" title={CsI18n.t("No data")}>
          <TextStyle><CsI18n>No corresponding products have been found</CsI18n></TextStyle>
        </Banner>
        <br/>
      </div>
    )
  }

  renderOffersTable() {
    let notice;
    if (this.state.offerSuccess) {
      notice = (
        <div>
          <br/>
          <Banner status="success" title={CsI18n.t("Offers sent successfully, result will appear in Scheduler tab")}/>
          <br/>
        </div>
      );
    } else if ( this.state.offerError ) {
      notice = (
        <div>
          <br/>
          <CsErrorMessage
            errorType={this.state.offerError.type}
            errorMessage={this.state.offerError.message}
          />
          <br/>
        </div>
      );
    }
    let rows =[{}];
    for(let index in this.state.searchList){
      /*if(!this.checkFilter(this.state.scheduleList[index])){
        continue;
      }*/
      rows.push(this.state.searchList[index]);
    }
    return (
      <div>
        {notice}
        {this.renderSendOffers()}

        <ResourceList
          items={rows}
          renderItem={(item, index) => {

            return (
              <ResourceList.Item
                id={index}
              >
                {index == 0 ?
                  <Stack>
                    <Stack.Item><Checkbox
                      disabled={this.state.offeredItems.length === this.state.searchList.length}
                      checked={this.state.isAllChecked}
                      onChange={this.handleAllCheck}/></Stack.Item>
                    <Stack.Item fill>
                      <Stack wrap={false} distribution="fillEvenly">
                        <Stack.Item><Heading>{this.shopify.store_properties.name}</Heading></Stack.Item>
                          <Stack.Item><Heading><CsI18n>Amazon</CsI18n></Heading></Stack.Item>
                      </Stack>
                    </Stack.Item>
                  </Stack>

                  :
                  <SearchRow
                    item={item}
                    disable={this.state.offeredItems.indexOf(parseInt(index) - 1) !== -1}
                    checked={this.state.checked.indexOf(parseInt(index) - 1) !== -1}
                    radio={this.state.radio[parseInt(index) - 1]}
                    onChange={this.handleSearchRowChange(parseInt(index) - 1)}
                    marketplaceInfo={this.marketplaceInfo}
                  />}
              </ResourceList.Item>
            );
          }}
        />

        {this.state.page < this.state.pages ? this.renderOffersTableFooter() : ''}
      </div>
    );
  }

  renderOffersTableFooter() {
    console.log(this.state.error);

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

export default Lookup;
