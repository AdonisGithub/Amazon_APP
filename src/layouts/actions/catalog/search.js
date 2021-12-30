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
  Link,
  ResourceList, RadioButton, Tooltip, Icon, Badge
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

const DEFAULT_PAGE_COUNT = 20;
const SELECT_PAGE_OPTIONS = [
  {label: 20, value: 20},
  {label: 50, value: 50},
  {label: 100, value: 100},
];
const ADD = 0;
const REMOVE = 1;
const SEARCH = 0;
const OFFER = 1;

class Search extends AmazonTab {

  state = {
    ...this.state,
    getStarted: true,
    pages: 0,
    processing: false,
    page: 1,
    searchList: [],
    searchValue: '',
    page_item_count: DEFAULT_PAGE_COUNT,
    error: false,
    offering: false,
    offerSuccess: false,
    offerError: false,
    refresh: true,
    offeredItems: [],
    offerList:[],
    activeImageModalIndex: "",
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

  componentWillMount() {
    window.addEventListener('keypress', this.handleEnterKey);
  }

  componentWillUnmount() {
    this.unMouted = true;
    window.removeEventListener('keypress', this.handleEnterKey);
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

  handleEnterKey = (e) => {
    if(e.keyCode === 13){
      // console.log('Enter key')
      if(this.state.searchValue !== '' && !this.state.processing){
        this.search();
      }
    }
  }

  search() {

    if(this.state.pages === 0 || this.state.page <= this.state.pages){
      this.setState({processing: true});
      let configuration = this.shopify.getConfigurationSelected();
      let marketplace_id = this.marketplaceInfo.MarketplaceId;
      let q = this.state.searchValue;
      let params = {configuration, marketplace_id, q};

      ApplicationApiCall.get('/application/offers/search', params, this.cbSearchData(), this.cbSearchError, false);
    }
  }

  cbSearchData = () => (json) => {

    console.info("sbInitData", json);


    if (json && this.unMouted === false) {

      let pages = json.pages ? parseInt(json.pages) : 0;
      let products = json.products ? json.products : [];
      this.setState(preState => ({
          ...preState,
          searchList: products,
          pages: pages,
          refresh: false,
          processing: false,
      }))
    }
  }

  cbSearchError = (err) => {
    console.log(err);

    if(err && this.unMouted === false){

      this.setState({error: err, processing: false})
    }
  }

  cbOfferSuccess = (json) => {

    console.info("cbOfferSuccess", json);

    this.state.offerList.forEach(item => {
      item.offered = true;
    })

    this.setState({offering: false, offerSuccess: true, offerList: this.state.offerList});
    setTimeout(() => {
      this.setState({offerSuccess: false, processing: false});
    }, 5000);
  }

  cbOfferFail = (err) => {
    console.error(err);
    this.setState({offering: false, offerSuccess: false, offerError: err});
    // setTimeout(() => {
    //   this.setState({offerError: null, processing: false});
    // }, 5000);
  }

  handleCreateOffer = () => {

    let offerItems = [];
    this.state.offerList.map((product) => {
      if(product.offered === false){
        offerItems.push({asin:product.asin}) ;
      }
    });

    let configuration = this.shopify.getConfigurationSelected();
    let section = "amazon";
    let marketplace_id = this.marketplaceInfo.MarketplaceId;
    let params = {configuration, section, marketplace_id};
    let data = {marketplace_id, items: offerItems};
    ApplicationApiCall.post('/application/offers/search', params, data, this.cbOfferSuccess, this.cbOfferFail, false);

    this.setState({offering: true});
  }

  handleSearchChange = (value) => {
    this.setState({searchValue: value});
  }

  handleSearchBtnClick = () => {
    // console.log('handleSearchBtnClick')
    if(this.state.searchValue !== ''){
      this.search();
    }
  }

  handleAddOfferList = (action, index) => () => {
    let {searchList, offerList} = this.state;
    if(action === ADD){
      searchList[index].offered = false;
      offerList = [searchList[index], ...offerList];
      searchList.splice(index, 1);
    }else{
      searchList.push(this.state.offerList[index]);
      offerList.splice(index, 1);
    }
    this.setState(preState => ({
        ...preState,
        searchList: searchList,
        offerList: offerList,
    }))
  }

  handleRefresh = () => {
    this.setState({searchValue: '', refresh:true, searchList: [], offerList:[], offeredItems: []});
  }

  render() {

    console.log(this.state)

    let content = "";

    if (this.state.getStarted) {
      content = this.renderGetStarted()
    } else {
      content = this.renderOffersData();
    }
    return (
      <div className="search-table" id="cs-search">
        {content}
      </div>
    );
  }

  renderSearchOffers()
  {
    let count = 0;

    this.state.offerList.forEach(item => {
      if(item.offered === false){
        count++;
      }
    })
    let offer = {
      content: CsI18n.t('Send'),
      onAction: () => {
        this.handleCreateOffer()
      },
      loading: this.state.offering,
      disable: this.state.processing
    };
    return (
      <div className="search-bar">
      <Stack vertical spacing="loose">
        <Stack.Item>
          <ResourceList.FilterControl
            searchValue={this.state.searchValue}
            onSearchChange={this.handleSearchChange}
            additionalAction={{
              content: CsI18n.t('Search'),
              loading: this.state.processing,
              disabled: this.state.offering || this.state.processing,
              onAction: () => this.handleSearchBtnClick(),
            }}
          />
        </Stack.Item>
        {count > 0 ?
        <Stack.Item>
          <Banner
            title={CsI18n.t("Send offers to Amazon")}
            action={offer}
          >
            <p>
              <CsI18n>The offers, once sent will appear as inactive on Amazon. Then, on the next sync, they will be updated based on the configuration of your rules.</CsI18n>
            </p>

          </Banner>
        </Stack.Item>
          : ''}
      </Stack>
      </div>
    )
  }

  renderError(){

    let type;
    let title;
    let message;

    if (this.state.offerError) {
      type = this.state.offerError.type;
      message = this.state.offerError.title;
    } else if (this.state.error) {
      type = this.state.error.type;
      title = this.state.error.title;
      message = this.state.error.message;
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

  renderGetStarted()
  {
    let action = {
      content: CsI18n.t('Get started'),
      onAction: () => {
        this.setState(prevState => ({...prevState, getStarted: false}))
      },
    };
    return(
      <Stack vertical>
        <Stack.Item>
          <br />
        </Stack.Item>
        <Stack.Item>
          <Banner
            title={CsI18n.t("Search for offers")}
            action={action}
          >
            <p>
              <CsI18n>You can search for any offer by name, ASIN, GTIN (EAN/UPC).</CsI18n><br />
              <CsI18n>The purpose is to find products on Amazon and automatically create new offers for them.</CsI18n>
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
          <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
        </div>
      </Layout.Section>
    )
  }

  renderEmpty(type) {
    let title;
    let message;
    let status;

    if(type === SEARCH){
      title = "No search result";
      message = "Sorry, you have no result yet !";
      status='warning';
    }else if(type === OFFER){
      title = "Empty";
      message = "You didn't select any offer yet.";
      status='info';
    }
    return (
      <div style={{margin: '1rem 0'}}>
        <Banner status={status} title={CsI18n.t(title)}>
          <TextStyle><CsI18n>{message}</CsI18n></TextStyle>
        </Banner>
      </div>
    )
  }

  renderOffersData(){
    let notice;
    let content;

    if (this.state.offerSuccess) {
      notice = (
        <div>
          <Banner status="success" title={CsI18n.t("Offers sent successfully, result will appear in Scheduler tab")}/>
          <br/>
        </div>
      );
    } else if ( this.state.offerError || this.state.error) {
      notice = this.renderError();
    }

    if(this.state.refresh === false){
      content = (
        <div>
          <div className="search-result">{this.renderSearchResultTable()}</div>
          <div className="offer-table">{this.renderOfferListTable()}</div>
        </div>
      )
    }
    let rows = [];
    for(let index in this.state.searchList){
      rows.push(this.state.searchList[index]);
    }
    return (
      <div className="table">
        {this.renderSearchOffers()}
        {notice}
        {content}
      </div>
    )
  }

  renderSearchResultTable() {
    let rows = [];
    for(let index in this.state.searchList){
      rows.push(this.state.searchList[index]);
    }
    return (
        <div>
          <div>
            <Heading><CsI18n>Search result</CsI18n></Heading>
          </div>
          <div>
            {this.state.searchList.length === 0 ?
              this.renderEmpty(SEARCH)
              :
              <ResourceList
                items={rows}
                renderItem={(item, index) => {
                  const {name, image_url, large_image_url, brand, asin, offered} = item;
                  let amazon_link = 'https://' + this.marketplaceInfo.DomainName + '/dp/' + asin;
                  let oberlo_link = 'https://app.oberlo.com/explore?&keyords=' + this.state.searchValue;
                  return (
                    <ResourceList.Item
                      id={index}
                    >
                      <Stack wrap={false} spacing="tight">
                        <Stack.Item>
                          {image_url ?
                              <CsImageModal
                                  title={name}
                                  size="large"
                                  alt={name}
                                  active={this.state.activeImageModalIndex == ("search" + index)}
                                  onToggle={this.handleImageModal("search" + index)}
                                  source={image_url}
                                  source_large={large_image_url}
                              />
                              :
                              <CsNoImage alt={name}/>
                          }
                        </Stack.Item>
                        <Stack.Item fill>
                          <Stack vertical spacing="extraTight">
                            <Stack.Item>
                              <TextStyle variation="strong">{name}</TextStyle>
                            </Stack.Item>
                            <Stack.Item>
                              <div className="display-link">
                                <Stack spacing="tight">
                                  <Stack.Item><TextStyle>{brand + " | " + asin}</TextStyle></Stack.Item>
                                  <Stack.Item><Tooltip content={CsI18n.t("View on Amazon")} preferredPosition="above"><a
                                    href={amazon_link} target="_blank"><Icon
                                    source={ViewMinor}
                                    color="inkLighter"/></a>
                                  </Tooltip></Stack.Item>
                                </Stack>
                              </div>
                            </Stack.Item>
                            <Stack.Item>
                              {/*<a className="Polaris-Link" href={oberlo_link} target="_blank">Search on Oberlo</a>*/}
                            </Stack.Item>
                          </Stack>
                        </Stack.Item>
                        <Stack.Item>
                            <Button size="slim"
                                    onClick={this.handleAddOfferList(ADD, parseInt(index))}><CsI18n>Add</CsI18n></Button>

                        </Stack.Item>
                      </Stack>
                    </ResourceList.Item>
                  );
                }}
              />
            }

          </div>
        </div>
     );
  }

  handleImageModal = (id) => () => {
    this.setState({activeImageModalIndex: id});
  }

  renderOfferListTable() {

    let rows =[];
    for(let index in this.state.offerList){
      rows.push(this.state.offerList[index]);
    }
    return (
      <div>
        <Heading><CsI18n>Offer list</CsI18n></Heading>
        {this.state.offerList.length === 0 ?
          this.renderEmpty(OFFER)
          :
          <ResourceList
            items={rows}
            renderItem={(item, index) => {
              const {name, image_url, large_image_url, brand, asin, offered} = item;
              let amazon_link = 'https://' + this.marketplaceInfo.DomainName + '/dp/' + asin;
              let oberlo_link = 'https://app.oberlo.com/explore?&keyords=' + this.state.searchValue;
              return (
                <ResourceList.Item
                  id={index}
                >
                  <Stack wrap={false} spacing="tight">
                    <Stack.Item>
                      {image_url?
                          <CsImageModal
                        title={name}
                        size="large"
                        alt={name}
                        source={image_url}
                        source_large={large_image_url}
                        active={this.state.activeImageModalIndex == ("offer"+index) }
                        onToggle={this.handleImageModal("offer"+index)}
                      />
                          :
                          <CsNoImage alt={name}/>}
                    </Stack.Item>
                    <Stack.Item fill>
                      <Stack vertical spacing="extraTight">
                        <Stack.Item>
                          <TextStyle variation="strong">{name}</TextStyle>
                        </Stack.Item>
                        <Stack.Item>
                          <div className="display-link">
                            <Stack spacing="tight">
                              <Stack.Item><TextStyle>{brand + " | " + asin}</TextStyle></Stack.Item>
                              <Stack.Item><Tooltip content={CsI18n.t("View on Amazon")} preferredPosition="above"><a
                                href={amazon_link} target="_blank"><Icon
                                source={ViewMinor}
                                color="inkLighter"/></a>
                              </Tooltip></Stack.Item>
                            </Stack>
                          </div>
                        </Stack.Item>
                        <Stack.Item>
                          {/*<a className="Polaris-Link" href={oberlo_link} target="_blank">Search on Oberlo</a>*/}
                        </Stack.Item>
                      </Stack>
                    </Stack.Item>
                    <Stack.Item>
                      {offered === false ?
                        <Button size="slim"
                                onClick={this.handleAddOfferList(REMOVE, parseInt(index))}><CsI18n>Remove</CsI18n></Button>
                        :
                        <Badge status="success"><CsI18n>Sent</CsI18n></Badge>
                      }
                    </Stack.Item>
                  </Stack>
                </ResourceList.Item>
              );
            }}
          />
        }
      </div>
    );
  }
}

export default Search;
