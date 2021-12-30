import React from 'react'
import CsI18n from "../../../components/csI18n"


import {
  Card,
  Heading,
  Select,
  Stack,
  ResourceList,
  Spinner,
  Layout,
  DataTable,
  TextStyle,
  Button,
  FilterType,
  Banner,
  Checkbox,
  Modal,
  RadioButton,
  TextContainer, Tag, Badge, FormLayout, List,
} from '@shopify/polaris';

import ApplicationApiCall from "../../../functions/application-api-call";
import Util from "../../../helpers/Util";
import shopifyContext from "../../../context";
import CsErrorMessage from "../../../components/csErrorMessage";
import CsFastFilter from "../../../components/csFastFilter";
import CsEmbeddedModal from "../../../components/csEmbeddedModal";
import CsDataTable from "../../../components/csDataTable";
import CsDatePicker from "../../../components/csDatePicker";
import {ErrorType} from "../../../components/csErrorMessage/csErrorMessage";
// import fulfillment from "../../../testData/fulfillment.json";

const DEFAULT_PAGE_COUNT = 20;
// const DEFAULT_PAGE_COUNT = 2; //

const SELECT_PAGE_OPTIONS = [
  {label: 20, value: 20},
  {label: 50, value: 50},
  {label: 100, value: 100},
];

const FILTER = {name: "filter_name", title: "filter_title", sku: "filter_sku"};

const MCF_FULFILLMENT_STATUS = {
  RECEIVED: 'RECEIVED',
  INVALID: 'INVALID',
  PLANNING: 'PLANNING',
  PROCESSING: 'PROCESSING',
  CANCELLED: 'CANCELLED',
  COMPLETE: 'COMPLETE',
  COMPLETE_PARTIALLED: 'COMPLETE_PARTIALLED',
  UNFULFILLABLE: 'UNFULFILLABLE',
}

class FbaShipped extends React.Component {

  state = {
    count: 0,
    wait: true,
    active_modal: false,        // modal is active if true
    error: null,
    selected: [],
    search_option: {keyword: '', date_from: '', date_to: ''},
    searching: false,
    processing: false,
    appliedFilters: [],
    keywordFilter: '',
    page_item_count : DEFAULT_PAGE_COUNT,
    orderList: [],
    postError: null,
    retrySuccess: null,
    postSuccess: null,
    search_more: false
  };

  constructor(props) {
    super(props);
    this.state.search_option.date_to = Util.getDateString(new Date());
    let date_from = new Date();
    date_from.setDate(1);
    this.state.search_option.date_from = Util.getDateString(date_from);
    this.initialState = Util.clone(this.state);
    this.dataRows = [];
    this.filteredRows = [];
    this.shopify = shopifyContext.getShared();
    this.selectedConfiguration = this.shopify.getConfigurationSelectedIndex();
    this.unMounted = false;
  }

  componentDidMount() {
    this.fetchOrders(true, this.state.search_option);
    require("./fba.scss");
  }

  componentWillUnmount() {
    this.unMounted = true;
  }

  componentWillReceiveProps(nextProps) {
    console.log("%cComponentWillReceiveProps", 'color:green', this.initialState);

    if(this.selectedConfiguration !== this.shopify.getConfigurationSelectedIndex() ){
      this.selectedConfiguration = this.shopify.getConfigurationSelectedIndex();
      this.init();
    }
  }

  init() {
    this.dataRows = [];
    this.filteredRows = [];
    this.setState(Util.clone(this.initialState), () => {
      this.fetchOrders(true, this.state.search_option)
    });
  }

  fetchOrders(isNew=false, search_option) {
    let limit_from = isNew? 0:this.state.orderList.length;
    let limit_to = this.state.page_item_count;
    let configuration = this.shopify.getConfigurationSelected();
    let params = {
      configuration, limit_from, limit_to, keyword: search_option.keyword,
      date_from: search_option.date_from, date_to: search_option.date_to
    };

    ApplicationApiCall.get('/application/fba/shipped', params, (json) => { this.cbInitData(isNew, json) }, this.cbInitError, false);
    if( isNew ) {
      this.setState({searching: true, search_option});
    } else {
      this.setState({search_more: true, search_option});
    }
  }

  cbInitData = (isNew, json) => {
    // json = fulfillment.data;
    console.log("cbInitData", json);

    if (json && this.unMounted === false) {
      let count = json.count ? parseInt(json.count) : 0;
      let orderList;
      let selected;

      if( isNew ) {
        orderList = json.orders;
        selected = [];
      } else {
        selected = this.state.selected;
        orderList = json.orders ? this.state.orderList.concat(json.orders) : this.state.orderList;
      }
      if( json.orders ) {
        let prev_count = selected.length;
        for (let index in json.orders) {
          selected.push({id: prev_count + Number(index), disabled: false, checked: false});
        }
      }
      let message = json.message ? json.message : '';

      this.filterRows(this.state.keywordFilter, this.state.appliedFilters, orderList, selected);
      this.setState( preState => ({
        ...preState,
        wait: false,
        count: count,
        selected: selected,
        orderList: orderList,
        message: message,
        searching: false,
        search_more: false,
      }));
    }
  }

  cbInitError = (err) => {
    console.log(err);
    if(err){
      this.setState({wait: false, error: err, search_more: false});
    }
  }

  postSelectedOrders = () => {
    let shopify_order_ids = [];
    this.state.selected.forEach(item => {
      if( item.checked ) {
        let line_items = [];
        for(let line of this.state.orderList[item.id].line_items) {
          line_items.push({variant_id: line.variant_id, sku: line.sku, fulfillable_quantity: line.available >= line.fulfillable_quantity? line.fulfillable_quantity:line.available });
        }
        shopify_order_ids.push({
          shopify_order_id: this.state.orderList[item.id].shopify_order_id,
          line_items
        });
      }
    });

    let configuration = this.shopify.getConfigurationSelected();
    let params = {configuration};
    ApplicationApiCall.post('/application/fba/send', params, {orders: shopify_order_ids}, this.cbPostSuccess, this.cbPostError, false);
    //this.cbPostSuccess('Success');

    this.setState({active_modal: false, processing: true});
  }

  cbPostSuccess = (json) => {
    console.log("cbPostSuccess", json);
    if (json && !this.unMounted) {
      if(!json.success) {
        this.cbPostError(json.results);
        return;
      }
      let success = [];
      let fail = [];
      let error_messages = [];
      for(let row of json.results) {
        if(row.success) {
          success.push("" + row.shopify_order_id);
        } else {
          fail.push(row.shopify_order_id);
          error_messages.push(row.error_message);
        }
      }
      let {selected} = this.state;
      if(success.length) {
        selected.map(item => {
          if( item.checked ) {
            if(success.indexOf(this.state.orderList[item.id].shopify_order_id) !== -1 ) {
              item.checked = false;
              item.disabled = true;
            }
          }
        });
      }

      let postSuccess = {success, fail, error_messages};
      if(fail.length == 0) {
        setTimeout(() => {
          this.setState({postSuccess: null})
        }, 5000);
      }
      console.log(postSuccess);
      this.setState( preState => ({
        ...preState,
        selected: selected,
        postSuccess: postSuccess,
        processing: false
      }))
    }
  }

  cbPostError = (err) => {
    console.log(err)

    this.setState({
      postError: err,
    });
  }

  isCheckBool = (value) => {
    return value == true
  }

  isEveryBool = (array) => {
    return array.every(this.isCheckBool)
  }

  isSomeBool = (array) => {
    return array.some(this.isCheckBool)
  }

  checkFilter(appliedFilters, item) {
    let array = [];
    let sku = [];

    array = this.checkFilterOptions(appliedFilters, item);
    return this.isEveryBool(array);
  }

  checkKeywordFilter(keyword, item) {
    if(!keyword) {
      return true;
    }
    let filter_value = keyword.toLowerCase();

    let fields = [];
    let shopifyOrder = item.shopify_order.data.order;
    if(shopifyOrder.customer) {
      fields = [shopifyOrder.customer.first_name, shopifyOrder.customer.last_name];
    }
    for(let line of shopifyOrder.line_items) {
      fields.push(line.title);
      fields.push(line.sku);
    }

    for(let field of fields) {
      if((field && field.toLowerCase().indexOf(filter_value) !== -1)) {
        return true;
      }
    }
    return false;
  }

  hasMore() {
    return this.state.orderList.length < this.state.count;
  }

  checkFilterOptions(appliedFilters, item) {
    let array = [];
    appliedFilters.forEach((filter) => {
      if(!filter.value) {
        return;
      }
      let shopifyOrder = item.shopify_order.data.order;

      let filter_value = filter.value.toLowerCase();
      let fields = [];
      switch(filter.key) {
        case FILTER.name:
          if(shopifyOrder.customer) {
            fields = [shopifyOrder.customer.first_name, shopifyOrder.customer.last_name];
          }
          break;
        case FILTER.title:
          for(let line of shopifyOrder.line_items) {
            fields.push(line.title);
          }
          break;
        case FILTER.sku:
          for(let line of shopifyOrder.line_items) {
            fields.push(line.sku);
          }
          break;
      }
      for(let field of fields) {
        if((field && field.toLowerCase().indexOf(filter_value) !== -1)) {
          array.push(true);
          return;
        }
      }
      array.push(false);
    })
    return array;
  }

  handleSearchChange = (value) => {
    let {search_option} = this.state;
    search_option.keyword = value;
    this.setState({search_option});
  }

  handleSearchClick = () => {
    this.fetchOrders(true, this.state.search_option);
  }

  handleSearchDateChange = (field) => (date) => {
    let {search_option} = this.state;
    search_option[field] = Util.getDateString(date);
    this.setState({search_option});
  }

  handleFiltersChange = (appliedFilters) => {
    this.filterRows(this.state.keywordFilter, appliedFilters, this.state.orderList, this.state.selected);
    this.setState({appliedFilters: appliedFilters});
  }

  handleKeywordFilterChange = (keywordFilter) => {
    this.filterRows(keywordFilter, this.state.appliedFilters, this.state.orderList, this.state.selected);
    this.setState({keywordFilter});
  };

  handleMoreBtnClick = () => {
    this.fetchOrders(false, this.state.search_option);
  }

  handlePageItemCountChange = (value) => {
    this.setState({page_item_count: parseInt(value)})
  }

  handleItemCheck = (row_selected) =>{
    let {selected} = this.state;
    for(let i in row_selected) {
      selected[row_selected[i].id] = row_selected[i];
    }
    console.log("handleItemCheck", row_selected, selected);
    this.filteredRows_selected = row_selected;
    this.setState({selected});
  };

  handleToggleModal = () => {
    this.setState( ({
      active_modal: false,
    }));
  };

  handleRetrySyncBtnClick = (shopify_order_id) => () => {
    let configuration = this.shopify.getConfigurationSelected();
    let params = {
      configuration
    };
    ApplicationApiCall.post('/application/fba/retry_sync', params, {orders: [{shopify_order_id}]}, this.cbRetrySuccess, this.cbRetryError, false);
    this.setState({processing: true});
  }

  cbRetrySuccess = (json) => {
    console.log("cbRetrySuccess", json);
    if (json && !this.unMounted) {
      if(!json.success) {
        this.cbRetryError(json.error_message);
        return;
      }

      setTimeout(() => {
        this.setState({retrySuccess: null});
      }, 5000);

      this.setState( {
        retrySuccess: 'Tracking info synced',
        processing: false
      });
    }
  }

  cbRetryError = (err) => {
    console.log(err)

    this.setState({
      error: {type:ErrorType.INVALID_PARAM, message: err},
      processing: false
    });
  }

  handleChangeGroup = (group_id) => {
    console.log("handleChangeGroup", parseInt(group_id));
    let {search_option} = this.state;
    search_option.group_id = parseInt(group_id);
    this.fetchOrders(true, search_option);
  }

  handleChangeSearchOption = field => (value) => {
    console.log("handleChangeSearchOption", field, value);
    let {search_option} = this.state;
    search_option[field] = value;
    this.fetchOrders(true, search_option);
  }

  filterRows(keywordFilter, appliedFilters, orderList, selected) {
    this.filteredRows = [];
    this.filteredRows_selected = [];
    for (let index in orderList) {
      let item = orderList[index];

      if(!this.checkKeywordFilter(keywordFilter, item)) {
        continue;
      }

      if (!this.checkFilter(appliedFilters, item)) {
        continue;
      }
      this.filteredRows.push(item);
      this.filteredRows_selected.push(selected[index]);
    }
  }

  renderDataItem()
  {
    let dataItem = [];
    for( let index in this.filteredRows) {
      let item = this.filteredRows[index];
      let shopifyOrder = item.shopify_order.data.order;
      let customer_name = '';
      if(shopifyOrder.customer) {
        customer_name = shopifyOrder.customer.first_name + " " + shopifyOrder.customer.last_name;
      }

      let order_info = (<Stack wrap={true} vertical spacing="extraTight">
        <Stack.Item>{shopifyOrder.name}</Stack.Item>
        <Stack.Item><Heading>{customer_name}</Heading></Stack.Item>
        <Stack.Item>{parseFloat(shopifyOrder.total_price).toFixed(2) + " " + shopifyOrder.currency}</Stack.Item>
      </Stack>);
      let order_lines = [];
      for(let line of shopifyOrder.line_items) {
        order_lines.push(<Stack.Item key={"item-title-" + line.sku}><TextStyle>{line.title}</TextStyle></Stack.Item>)
        order_lines.push(<Stack.Item key={"item-" + line.sku}><TextStyle>{line.quantity} x {line.sku}</TextStyle></Stack.Item>)
      }
      let items_info = (<Stack spacing="extraTight" vertical>{order_lines}</Stack>);

      let unprocessed_lines = [];

      // console.log('item', item);
      let shipped_lines = [];
      let processed_items = [];
      if(item.mcf_fulfillment && item.mcf_fulfillment.tracking_infos) {
        let index = 1;
        let bHasSyncError = false;
        for(let tracking_info of item.mcf_fulfillment.tracking_infos) {
          if (index > 1) {
            shipped_lines.push(<Stack.Item key={`shipped-${index}-hr`}><hr/></Stack.Item>);
          }
          let tracking = [];

          let {items} = tracking_info;
          let sub_index = 1;
          for(let tracking_info_item of items) {
            tracking.push(<Stack.Item key={`shipped-${index}-${sub_index}-${tracking_info_item.sku}`}><TextStyle variation="positive">{tracking_info_item.quantity} x {tracking_info_item.sku}</TextStyle></Stack.Item>);
            if (processed_items[tracking_info_item.sku]) {
              processed_items[tracking_info_item.sku] += tracking_info_item.quantity;
            } else {
              processed_items[tracking_info_item.sku] = tracking_info_item.quantity;
            }
            sub_index++;
          }

          let sub_badge_status;
          if(tracking_info.status == "SHIPPED") {
            sub_badge_status = "success";
          } else {
            sub_badge_status = "attention";
          }
          tracking.push(<Stack.Item key={`shipped-${index}-status`}><Badge status={sub_badge_status}>{tracking_info.status}</Badge></Stack.Item>);
          if(tracking_info.status == "SHIPPED") {
            let synced = tracking_info.shopify_fulfillment_id? <Badge status="success">{CsI18n.t("Synced")}</Badge>:<Badge status="critical">{CsI18n.t("Sync Error")}</Badge>;
            if (!tracking_info.shopify_fulfillment_id) {
              bHasSyncError = true;
            }
            tracking.push(<Stack.Item key={`shipped-${index}-tracking-info`}>{tracking_info.carrier_code + " " + tracking_info.tracking_number} {synced}</Stack.Item>);
          }
          if(tracking.length > 0) {
            shipped_lines.push(<Stack key={`shipped-${index}-stack`} spacing={"extraTight"} vertical>{tracking}</Stack>);
          }
          index++;
        }

        let isAdmin = this.shopify.admin;
        if (isAdmin) {
          if (bHasSyncError) {
            shipped_lines.push(<Button key={`resync-${item.shopify_order_id}`} size="slim" loading={this.state.processing} disabled={this.state.processing} onClick={this.handleRetrySyncBtnClick(item.shopify_order_id)}>Retry sync</Button>);
          }
        }
      }

      let is_need_hr = true;
      if(shipped_lines.length == 0) {
        is_need_hr = false;
      }

      let unshipped_lines = [];

      for(let line of item.shipped_items) {
        if(processed_items[line.sku] == line.shipped_quantity) {
          continue;
        }
        let unshipped_quantity = line.shipped_quantity;
        if (processed_items[line.sku]) {
          unshipped_quantity -= processed_items[line.sku];
        }
        unshipped_lines.push(<Stack.Item key={`unshipped-${line.sku}`}><TextStyle variation="negative">{unshipped_quantity} x {line.sku}</TextStyle></Stack.Item>);
      }
      if (is_need_hr && unshipped_lines.length) {
        is_need_hr = false;
        shipped_lines.push(<Stack.Item key={`unshipped-hr`}><hr/></Stack.Item>);
      }
      if (unshipped_lines.length) {
        shipped_lines.push(<Stack key={`shipped-unshipped`} spacing={"extraTight"} vertical>{unshipped_lines}</Stack>);
      }

      let shipped_info = <Stack spacing="extraTight" vertical>{shipped_lines}</Stack>;

      // let action = <Button size="slim"
      //                      loading={this.state.processing}
      //                      disabled={this.state.processing}
      //                      onClick={this.handleCreateFulfillmentBtnClick}><CsI18n>Create</CsI18n></Button>;
      let badge_status = '';
      let progress = '';
      let status_banner = '';
      if(item.mcf_fulfillment) {
        switch(item.mcf_fulfillment.fulfillment_order_status) {
          case MCF_FULFILLMENT_STATUS.RECEIVED:
          case MCF_FULFILLMENT_STATUS.PLANNING:
            badge_status = "info";
            break;
          case MCF_FULFILLMENT_STATUS.INVALID:
          case MCF_FULFILLMENT_STATUS.CANCELLED:
          case MCF_FULFILLMENT_STATUS.UNFULFILLABLE:
            badge_status = false;
            break;
          case MCF_FULFILLMENT_STATUS.PROCESSING:
          case MCF_FULFILLMENT_STATUS.COMPLETE:
          case MCF_FULFILLMENT_STATUS.COMPLETE_PARTIALLED:
            badge_status = "success";
            break;
        }
        status_banner = <Badge status={badge_status}>{item.mcf_fulfillment.fulfillment_order_status}</Badge>;
      }


      dataItem[index] = [];
      dataItem[index].push(order_info);
      dataItem[index].push(item.display_processed_at);
      dataItem[index].push(items_info);
      dataItem[index].push(shipped_info);
      dataItem[index].push(status_banner);
    }
    return dataItem;
  }

  render() {
    let content = "";
    if(this.state.wait) {
      content = this.renderLoading();
    }else if(this.state.error ){
      content = this.renderError();
    }else if(this.state.orderList.length == 0) {
      content = this.renderEmpty();
    } else {
      content = this.renderDataList();
    }

    return (
        <div className="fba-orders">
          <Layout>
            {this.renderSearchBlock()}
            {this.renderFilter()}
            {content}
            {this.state.active_modal === true ? this.renderModal() : ''}
          </Layout>
        </div>
    );
  }

  renderOrderTableInfo() {
    let selectedCount = this.getSelectedCount();
    return(
        <Stack vertical>
          <Stack.Item>
            <Stack>
              <Stack.Item fill>
                <Stack alignment={"center"}>
                  <Stack.Item>
                    <Heading><CsI18n>Orders</CsI18n></Heading>
                  </Stack.Item>
                  <Stack.Item>
                    <CsI18n count={this.state.count}>{"Total: {{count}}"}</CsI18n>
                  </Stack.Item>
                  <Stack.Item>
                    <CsI18n count={this.filteredRows.length}>{"Showing: {{count}}"}</CsI18n>
                  </Stack.Item>
                  <Stack.Item>
                    <CsI18n count={this.getSelectedCount()}>{"Selected: {{count}}"}</CsI18n>
                  </Stack.Item>
                </Stack>
              </Stack.Item>
              <Stack.Item></Stack.Item>
            </Stack>
          </Stack.Item>
        </Stack>
    );
  }

  getSelectedCount() {
    let selected = this.state.selected;
    let count = 0;
    selected.forEach(item => {
      if( item.checked ) {
        count++;
      }
    });
    return count;
  }
  //
  // renderExportOptions(){
  //   let selectedCount = this.getSelectedCount();
  //   return(
  //     <Layout.Section>
  //       <Card>
  //         <Card.Section>
  //
  //         </Card.Section>
  //       </Card>
  //       <div className={"export-search-box"}>
  //         {this.renderFilter()}
  //       </div>
  //     </Layout.Section>
  //   )
  // }

  renderModal(){
    let selected_count = this.getSelectedCount();
    return(
        <CsEmbeddedModal
            open={true}
            onClose={this.handleToggleModal}
            title={CsI18n.t("Create fulfillment")}
            primaryAction={{
              content: <CsI18n>OK</CsI18n>,
              onAction: this.postSelectedOrders,
            }}
            secondaryActions={[
              {
                content: <CsI18n>Cancel</CsI18n>,
                onAction: this.handleToggleModal
              }
            ]}
        >
          <Modal.Section>
            <TextContainer>
              <p><CsI18n>Do you still want to continue?</CsI18n></p>
            </TextContainer>
          </Modal.Section>
        </CsEmbeddedModal>
    )
  }

  renderError(){
    let errorType;
    let errorTitle;
    let errorMessage;

    if(this.state.postError){
      errorType = this.state.postError.type;
      errorTitle = CsI18n.t("Failed to create fulfillment");
    } else if (this.state.error){
      errorType = this.state.error.type;
      errorMessage = this.state.error.message;
    }

    return(
        <Layout.Section>
          <CsErrorMessage
              errorType={errorType}
              errorTitle={errorTitle}
              errorMessage={errorMessage}
          />
          <br/>
        </Layout.Section>
    )
  }

  renderProcessSuccess(){
    console.log('renderProcessSuccess', this.state.postSuccess);
    let {success, fail, error_messages} = this.state.postSuccess;
    let message = '';
    let details = '';
    let has_error = false;
    if(fail.length && error_messages.length) {
      message = CsI18n.t("Request is processed. succeeded: {{succeeded_count}}, failed: {{failed_count}}", {succeeded_count: success.length, failed_count: fail.length});
      let lines = [];
      let key = 0;
      for(let line of error_messages) {
        lines.push(<List.Item key={'error-message' + key++}>
          {line}
        </List.Item>);
      }
      details = (<List type="bullet">{lines}</List>);
      has_error = true;
    } else {
      message = CsI18n.t("Request successfully processed");
    }
    return(
        <div>
          <Banner status={has_error? "warning":"success"} title={message}>{details}</Banner>
          <br/>
        </div>
    )
  }

  renderRetrySuccess() {
    return(
        <div>
          <Banner status={"success"} title={this.state.retrySuccess} />
          <br/>
        </div>
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

  renderEmpty() {
    let message;
    if(this.state.message){
      message = this.state.message;
    }else{
      message = 'No orders found'
    }
    return (
        <Layout.Section>
          <Banner status="warning" title={CsI18n.t("No order")}>
            <TextStyle><CsI18n>{message}</CsI18n></TextStyle>
          </Banner>
        </Layout.Section>
    )
  }

  renderDataList() {
    return (
        <Layout.Section>
          {this.state.postSuccess ? this.renderProcessSuccess() : ''}
          {this.state.retrySuccess? this.renderRetrySuccess() : ''}
          {this.state.error || this.state.postError ? this.renderError() : ''}
          {this.renderOrderTableInfo()}
          {this.renderOrderTable()}
          {this.hasMore() ? this.renderOrderTableFooter() : ''}
        </Layout.Section>
    )
  }

  renderSearchBlock() {
    let {date_from, date_to} = this.state.search_option;
    return (
        <Layout.Section>
          <div className={"mt-5"}>
            <Stack alignment="center" spacing="tight">
              <Stack.Item>
                <TextStyle variation="strong"><CsI18n>From</CsI18n></TextStyle>
              </Stack.Item>
              <Stack.Item>
                <CsDatePicker date={Util.getDateString(new Date(date_from))}
                              onChange={this.handleSearchDateChange('date_from')}/>
              </Stack.Item>
              <Stack.Item>
                <TextStyle variation="strong"><CsI18n>To</CsI18n></TextStyle>
              </Stack.Item>
              <Stack.Item>
                <CsDatePicker date={Util.getDateString(new Date(date_to))}
                              onChange={this.handleSearchDateChange('date_to')}/>
              </Stack.Item>
              <Stack.Item>
                <Button
                    disabled={this.state.processing || this.state.searching || this.state.search_more}
                    loading={this.state.searching }
                    onClick={this.handleSearchClick}
                > <CsI18n>Search</CsI18n>
                </Button>
              </Stack.Item>
            </Stack>
          </div>
        </Layout.Section>
    );

  }

  renderFilter() {
    const filters = [
      {
        key: FILTER.name,
        label: CsI18n.t('Name'),
        operatorText: CsI18n.t('Contains'),
        type: FilterType.TextField,
      }, {
        key: FILTER.title,
        label: CsI18n.t('Title'),
        operatorText: CsI18n.t('Contains'),
        type: FilterType.TextField,
      }, {
        key: FILTER.sku,
        label: CsI18n.t('SKU'),
        operatorText: CsI18n.t('Contains'),
        type: FilterType.TextField,
      }
    ];

    return (
        <Layout.Section>
          <div className={"mt-3 mb-3"}>
            <ResourceList.FilterControl
                filters={filters}
                appliedFilters={this.state.appliedFilters}
                onFiltersChange={this.handleFiltersChange}
                searchValue={this.state.keywordFilter}
                onSearchChange={this.handleKeywordFilterChange}
            />
          </div>
        </Layout.Section>
    );
  }

  renderOrderTableFooter() {
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

  renderOrderTable() {
    let dataItem = this.renderDataItem();
    for(let i in this.filteredRows_selected) {
      this.filteredRows_selected[i] = this.state.selected[this.filteredRows_selected[i].id];
    }
    console.log("renderOrderTable", this.state.selected, this.filteredRows_selected)
    return (
        <div className={'fba-shipped'}>
          <CsDataTable
              onChange={this.handleItemCheck}
              columnContentType={[
                'text',
                'text',
                'text',
                'text',
                'text',
                'text',
              ]}
              headers={[
                <Heading><CsI18n>Order</CsI18n></Heading>,
                <Heading>&#128197;</Heading>,
                <Heading><CsI18n>Items</CsI18n></Heading>,
                <Heading><CsI18n>Shipped</CsI18n></Heading>,
                <Heading><CsI18n>Status</CsI18n></Heading>]}
              dataItem={dataItem}
              selected={this.filteredRows_selected}/>
        </div>
    );
  }
}

export default FbaShipped;
