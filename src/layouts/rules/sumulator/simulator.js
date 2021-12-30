import React from 'react';
import CsI18n from "../../../components/csI18n";
import {Caption, Stack, TextStyle, Card, Banner, Spinner, Tag, Heading, DataTable} from "@shopify/polaris";
import Util from "../../../helpers/Util";
import Constants from "../../../helpers/rules/constants";
import ShopifyContext from "../../../context";

export default class Simulator extends React.Component{

  constructor(props) {
    super(props);
    this.condition_section = [];
    this.rows = [];
    console.log(props);
  }

  compare = (a, b) => {
    if(parseInt(a["price"]) < parseInt(b["price"])){
      return -1;
    }

    if(parseInt(a["price"]) > parseInt(b["price"])){
      return 1;
    }

    return 0;
  }

  getCollectionLabel(value){

    let label;
    this.props.rulesParameter.collections.forEach(item => {
      if(item.value == value){
        label = item.label;
      }
    })

    return label;

  }

  getQuantityLabel(condition){
    console.log(condition);
    if(condition.rule === "2"){
      return CsI18n.t("is equal to") + " " + condition.value;
    } else if(condition.rule === "3"){
      return CsI18n.t("is less than") + " " + condition.value;
    } else if(condition.rule === "4"){
      return CsI18n.t("is greater than") + " " + condition.value;
    }
  }


  initRow(){
    const {conditions} = this.props.data;
    this.condition_section = [];
    this.rows = [];

    /* conditions */
    // let product_type = [];
    // let tag = [];
    // let collection = [];
    // let vendor = [];
    // let quantity;

    let condition_label = [];

    console.log("initRow", conditions);
    conditions.forEach(condition => {
      let label = '';
      if( condition.rule == 1 ) { //contains
        label = CsI18n.t("contains") + " " + condition.value;
      } else {
        if( condition.value == 'Any') {
            label = CsI18n.t('any');
        } else {
          switch (condition.condition) {
            case 'p':
            case 't':
            case 'v':
              label = condition.value;
              break;
            case 'c':
              label = this.getCollectionLabel(condition.value);
              break;
            case 'q':
              label = this.getQuantityLabel(condition);
              break;
          }
        }
      }
      if( !condition_label[condition.condition] ) {
        condition_label[condition.condition] = [];
      }
      condition_label[condition.condition].push(label);
    });

    console.log(condition_label['p']);
    if ( condition_label['p'] && condition_label['p'].length > 0) {
      this.condition_section.push(<Stack.Item
          key="p"><Caption>[{CsI18n.t("Product type")}] {condition_label['p'].join(', ')}</Caption></Stack.Item>);
    }
    if ( condition_label['c'] && condition_label['c'].length > 0) {
      this.condition_section.push(<Stack.Item
          key="c"><Caption>[{CsI18n.t("Collections")} ] {condition_label['c'].join(', ')}</Caption></Stack.Item>);
    }
    if ( condition_label['t'] && condition_label['t'].length > 0) {
      this.condition_section.push(<Stack.Item
          key="t"><Caption>[{CsI18n.t("Tag")} ] {condition_label['t'].join(', ')}</Caption></Stack.Item>);
    }
    if ( condition_label['v'] && condition_label['v'].length > 0) {
      this.condition_section.push(<Stack.Item
          key="v"><Caption>[{CsI18n.t("Vendor")} ] {condition_label['v'].join(', ')}</Caption></Stack.Item>);
    }
    if (condition_label['q']){
      this.condition_section.push(<Stack.Item
          key="q"><Caption>[{CsI18n.t("Quantity")} ] {condition_label['q'].join(', ')}</Caption></Stack.Item>)
    }

    if(this.props.name === "markupForm"){
     this.initMarkup();
    } else if (this.props.name === "saleForm") {
      this.initSale();
    } else if (this.props.name === "filtersForm") {
      this.initFilter();
    } else if (this.props.name === "businessForm") {
      this.initBusiness();
    } else {
      this.initInventory();
    }
  }

  initMarkup(){

    const {rules, markups} = this.props.data;
    let sorted_markups = [...markups];

    let shopify = ShopifyContext.getShared();

    sorted_markups.sort(this.compare).forEach((markup, index)  => {
      let row = [];
      let example = null;
      let nextMarkup = sorted_markups[parseInt(index) + 1];

      row.push(<div key={index + "markup"} className="markup"><Caption> {rules.rule + markup.value + markup.rule}</Caption></div>);
      row.push(<div key={index + "from"} className="from"><Caption>{shopify.getMoneyStringWithStoreFormat(markup.price)}</Caption></div>);
      row.push(<div key={index + "to"} className="to"><Caption>{nextMarkup ?  shopify.getMoneyStringWithStoreFormat(nextMarkup.price - .01) : '~'}</Caption></div>);

      if(this.props.simulator){
        Object.keys(this.props.simulator).map(key => {

          if(nextMarkup !== undefined && (parseFloat(markup.price) < parseFloat(this.props.simulator[key].price) && parseFloat(this.props.simulator[key].price) < parseFloat(nextMarkup.price))){
            example = this.props.simulator[key];
          } else if (nextMarkup === undefined && (parseFloat(markup.price) < parseFloat(this.props.simulator[key].price))){
            example = this.props.simulator[key];
          }
        });

        row.push(<div key={index + "example"} className="example"><Caption> {example ? example.title : "none"}</Caption></div>);
          row.push(<div key={index + "price"} className="price">
              <Caption> {example ? shopify.getMoneyStringWithStoreFormat(example.price) : ""} </Caption></div>);
        row.push(<div key={index + "sale"} className="sale"><Caption> {example ? shopify.getMoneyStringWithStoreFormat(example.markup) : ""} </Caption></div>);
      } else {
        row.push(<div key={index + "example"} className="example"/>);
          row.push(<div key={index + "price"} className="price"/>);
        row.push(<div key={index + "sale"} className="sale"/>);
      }
      this.rows.push(
          <Stack.Item key={index}>
            <div className="markup-list">{row}</div>
          </Stack.Item>
      )
    });
  }

  initSale(){

    const {rules, sales} = this.props.data;
    console.log("initSale", rules, sales, this.props.simulator);
    let sorted_sales = [...sales];

    let shopify = ShopifyContext.getShared();

    sorted_sales.sort(this.compare).forEach((sale, index)  => {
      let row = [];
      let example = null;
      let nextSale = sorted_sales[parseInt(index) + 1];

      row.push(<div key={index + "from"} className="sale-from"><Caption>{shopify.getMoneyStringWithStoreFormat(sale.price)}</Caption></div>);
      row.push(<div key={index + "to"} className="sale-to"><Caption>{nextSale ?  shopify.getMoneyStringWithStoreFormat(nextSale.price - 0.01) : '~'}</Caption></div>);

      if(this.props.simulator){
        Object.keys(this.props.simulator).map(key => {

          if(nextSale !== undefined && (parseFloat(sale.price) < parseFloat(this.props.simulator[key].price) && parseFloat(this.props.simulator[key].price) < parseFloat(nextSale.price))){
            example = this.props.simulator[key];
          } else if (nextSale === undefined && (parseFloat(sale.price) < parseFloat(this.props.simulator[key].price))){
            example = this.props.simulator[key];
          }
        });
        if(example && example.sale) {
          row.push(<div key={index + "example"} className="sale-example"><Caption> {example.title}</Caption></div>);
          row.push(<div key={index + "price"} className="sale-price"><Caption> {CsI18n.t("Price:") + " " + shopify.getMoneyStringWithStoreFormat(example.sale.price)} </Caption></div>);
          row.push(<div key={index + "sale"} className="sale-sale-price"><Caption> {CsI18n.t("Sale price:") + " " + shopify.getMoneyStringWithStoreFormat(example.sale.sale_price)} </Caption></div>);
        }
      } else {
        row.push(<div key={index + "example"} className="sale-example"/>);
        row.push(<div key={index + "price"} className="sale-price"/>);
        row.push(<div key={index + "sale"} className="sale-sale-sale"/>);
      }

      this.rows.push(
          <Stack.Item key={index}>
            <div className="sale-list">{row}</div>
          </Stack.Item>
      )
    });
  }

  initFilter(){


    Object.keys(this.props.simulator).forEach(key  => {
      let example = this.props.simulator[key];
      let row = [];

      row.push(<div key={key + "title"} className="example"><Caption> {example.title}</Caption></div>);
      row.push(<div key={key + "action"} className="action"><Caption><CsI18n> Yes</CsI18n></Caption></div>);

      this.rows.push(
          <Stack.Item key={key}>
            <div className="filter-list">{row}</div>
          </Stack.Item>
      )
    });

  }

  initInventory(){
    const {action} = this.props.data;

    Object.keys(this.props.simulator).forEach(key => {
      let example = this.props.simulator[key];
      let row = [];

      row.push(<div key={key + "title"} className="example"><Caption> {example.title}</Caption></div>);
      row.push(<div key={key + "action"} className="action"><Caption><CsI18n>{" will be " + action.action + " by"}</CsI18n></Caption></div>);
      row.push(<div key={key + "quantity"} className="quantity"><Caption><CsI18n
          units={action.quantity}>{"{{units}} units"}</CsI18n></Caption></div>);

      this.rows.push(
          <Stack.Item key={key}>
            <div className="inventory-list">{row}</div>
          </Stack.Item>
      )
    })

  }

  initBusiness() {
    let shopify = ShopifyContext.getShared();
    Object.keys(this.props.simulator).forEach(key => {
      let example = this.props.simulator[key];
      let row = [];

      row.push(<div key={key + "title"} className="example"><Caption> {example.title}</Caption></div>);
      row.push(<div key={key + "price"} className="price"><Caption>{shopify.getMoneyStringWithStoreFormat(example.price)}</Caption></div>);
      row.push(<div key={key + "business_price"} className="business-price"><Caption>{shopify.getMoneyStringWithStoreFormat(example.business_price)}</Caption></div>);
      let quantity_discounts = [];
      for(let quantity_discount of example.quantity_discounts) {
        let discount_type = quantity_discount.discounted_rule == '%'? (`${quantity_discount.value}${quantity_discount.discounted_rule}`):shopify.getMoneyStringWithStoreFormat(quantity_discount.value);
        let discounted_price = shopify.getMoneyStringWithStoreFormat(quantity_discount.discounted_price);
        quantity_discounts.push(<Stack.Item key={`quantity-discount-${quantity_discount.value}`}>
          {CsI18n.t("From {{quantity}}unit/s get {{discount}} off", {quantity: quantity_discount.quantity, discount: discount_type}) + ` => ${discounted_price}`}</Stack.Item>);
      }
      row.push(<div key={key + "quantity_discounts"} className={"quantity-discounts"}><Stack vertical={true} spacing={"extraTight"}>{quantity_discounts}</Stack></div>)

      this.rows.push(
          <Stack.Item key={key}>
            <div className="business-list">{row}</div>

          </Stack.Item>
      )
    })
  }

  renderSimulator(){

    this.initRow();

    return(
      <div>
        <div style={{margin: "1.8rem 0"}}>

          {this.renderHeading()}

        </div>
        <Stack vertical spacing="extraTight">
          {this.rows}
        </Stack>
      </div>

    )
  }

  renderAction(){

    if(this.props.name === "markupForm"){
      return <Stack.Item><Caption><CsI18n>, apply selected markups.</CsI18n></Caption></Stack.Item>
    } else if (this.props.name === "filtersForm"){
      return <Stack.Item><Caption><b><CsI18n>will be excluded.</CsI18n></b></Caption></Stack.Item>
    } else {
      return <Stack.Item><Caption><CsI18n>, apply selected actions.</CsI18n></Caption></Stack.Item>
    }
  }

  renderHeading(){

    if(this.props.name === "markupForm"){
      return(
          <div className="markup-list">
            <div className="markup"><Caption><CsI18n>Markup</CsI18n></Caption></div>
            <div className="from"><Caption><CsI18n>From</CsI18n></Caption></div>
            <div className="to"><Caption><CsI18n>To</CsI18n></Caption></div>
            <div className="example"><Caption><CsI18n>Product</CsI18n></Caption></div>
              <div className="price"><Caption><CsI18n>Price</CsI18n></Caption></div>
            <div className="sale"><Caption><CsI18n>Sale price</CsI18n></Caption></div>
          </div>
      )
    } else if (this.props.name === "filtersForm") {
      return(
          <div className="filter-list">
            <div className="example"><Caption><CsI18n>Product</CsI18n></Caption></div>
            <div className="action"><Caption><CsI18n>Excluded</CsI18n></Caption></div>
          </div>
      )
    } else if (this.props.name === "inventoryForm") {
      return(
          <div className="inventory-list">
            <div className="example"><Caption><CsI18n>Product</CsI18n></Caption></div>
            <div className="action"><Caption><CsI18n>Action</CsI18n></Caption></div>
            <div className="quantity"><Caption><CsI18n>Quantity</CsI18n></Caption></div>
          </div>
      )
    } else if (this.props.name === 'businessForm') {
      return(
          <div className="business-list">
            <div className="example"><Caption><CsI18n>Product</CsI18n></Caption></div>
            <div className="price"><Caption><CsI18n>Price</CsI18n></Caption></div>
            <div className="business-price"><Caption><CsI18n>Business price</CsI18n></Caption></div>
            <div className="quantity-discounts"><Caption><CsI18n>Quantity discounts</CsI18n></Caption></div>
          </div>
      )
    }
  }

  render(){
      let heading;
    let content;
    let condition_invalid;
    let { conditions } = this.props.data;

    conditions.forEach(condition => {
      if(condition.value === 0){
        condition_invalid = true;
      }
    });

      console.log('conditions', conditions);

    if (this.props.loading === true) {
      content = this.renderLoading();
    } else if (condition_invalid === true) {
      content = this.renderInvalid()
    } else if(!this.props.simulator || this.props.simulator instanceof Array === true && !this.props.simulator.length) {
      content = this.renderEmpty();
    } else {
      content = this.renderSimulator();
    }


      if (!condition_invalid) {
          heading =
              <Stack spacing="tight">
                  <Stack.Item>
                      <Caption><CsI18n>Your products matching with</CsI18n></Caption>
                  </Stack.Item>
                  {this.condition_section}
                  {this.renderAction()}
              </Stack>
      }

    return(
        <Card.Section title={CsI18n.t("Simulation")}>
            {heading}
        {content}
      </Card.Section>
      )
  }

  renderLoading(){

    return(
        <div align="center">
          <br/>
          <Spinner size="small" color="teal" />
          <br/>
        </div>
    )
  }

  renderInvalid(){

    return(
        <div align="center">
          <br/>
          <Banner status="info">
            <Caption><CsI18n>Please select condition to simulate</CsI18n></Caption>
          </Banner>
          <br/>
        </div>
    )
  }

  renderEmpty() {
    let title = 'No example product to simulate';
    let message = 'Sorry, you  have no example product to simulate yet !';

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
}

