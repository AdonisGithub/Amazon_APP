import React from "react";
import CsI18n from "./../../components/csI18n";
import {
  Avatar, Badge,
  Card,
  DataTable,
  Heading, Icon, Layout, Link,
  Stack,
  TextStyle,
} from '@shopify/polaris';
import {ChevronLeftMinor} from "@shopify/polaris-icons";
import shopifycontext from "../../context";
import Util from "../../helpers/Util";

export default class OrderDetail extends React.Component {
  state = {
    order: [],
    shipping: [],
    items: [],
  }

  constructor(props) {
    super(props);
    this.shopify = shopifycontext.getShared();
    this.init();
  }

  init() {

    this.state.order = this.props.data.orders.filter((order) => {
      return order.amazon_order_id === this.props.amazonOrderId;
    })
    this.state.shipping = this.props.data.shipping.filter((shipping) => {
      return shipping.amazon_order_id === this.props.amazonOrderId;
    })
    this.state.items = this.props.data.items.filter((item) => {
      return item.amazon_order_id === this.props.amazonOrderId;
    })
  }

  handleSummaryBack = () => {
    const {back} = this.props;
    back();
  }

  render() {

    return (
      <Layout.Section>
        <div className="tax-detail">
          {this.renderOrderDetail()}
          {this.renderShipping()}
          {this.renderItems()}
        </div>
      </Layout.Section>
    )
  }

  renderOrderDetail() {
    let {store_order_total, store_order_tax, sales_channel, store_currency_symbol, store_currency, purchase_date, name, amazon_order_id, is_premium_order, is_business_order, is_prime, fulfillment_channel} = this.state.order[0];
    const text_order_total = Util.isNumber(store_order_total)? (store_currency_symbol + " " + parseFloat(store_order_total).toFixed(2)):'';
    const text_order_tax = Util.isNumber(store_order_tax)? (store_currency_symbol + " " + parseFloat(store_order_tax).toFixed(2)):'';

    let marks = [];
    if(fulfillment_channel == 'AFN') {
      marks.push(<Badge status={"info"} key={amazon_order_id + "fba"}><CsI18n>FBA</CsI18n></Badge>);
    }
    if(is_business_order == 1) {
      marks.push(<Badge status={"info"} key={amazon_order_id + "business"}><CsI18n>Business</CsI18n></Badge>);
    }
    if(is_premium_order == 1) {
      marks.push(<Badge status={"info"} key={amazon_order_id + "premium"}><CsI18n>Premium</CsI18n></Badge>);
    }
    if(is_prime == 1) {
      marks.push(<Badge status={"info"} key={amazon_order_id + "prime"}><CsI18n>Prime</CsI18n></Badge>);
    }
    return (
      <Card sectioned>
        <Stack vertical spacing="tight">
          <Stack.Item>
            <Stack>
              <Stack.Item>
                <Link onClick={this.handleSummaryBack}><Icon source={ChevronLeftMinor}
                                                             color="inkLighter"/><CsI18n>Details</CsI18n></Link>
              </Stack.Item>
            </Stack>
          </Stack.Item>
          <Stack.Item>
            <Stack alignment={"center"}>
              <Stack.Item>
                <TextStyle variation="strong">#{amazon_order_id}</TextStyle>
              </Stack.Item>
              {marks.length > 0? <Stack.Item><Stack spacing={"extraTight"}>{marks}</Stack></Stack.Item>:null}
            </Stack>
          </Stack.Item>
          <Stack.Item>
            <Stack distribution="fillEvenly">
              <Stack.Item>
                <div className="date">
                  <Stack vertical spacing="tight">
                    <Stack.Item>
                      <Stack>
                        <Stack.Item>
                          <div className="tax-key">
                            <TextStyle><CsI18n>Purchase Date</CsI18n></TextStyle>
                          </div>
                        </Stack.Item>
                        <Stack.Item>
                          <TextStyle>{purchase_date}</TextStyle>
                        </Stack.Item>
                      </Stack>
                    </Stack.Item>
                    <Stack.Item>
                      <Stack>
                        <Stack.Item>
                          <div className="tax-key">
                            <TextStyle><CsI18n>Name</CsI18n></TextStyle>
                          </div>
                        </Stack.Item>
                        <Stack.Item>
                          <TextStyle>{name}</TextStyle>
                        </Stack.Item>
                      </Stack>
                    </Stack.Item>
                    <Stack.Item>
                      <Stack>
                        <Stack.Item>
                          <div className="tax-key">
                            <TextStyle><CsI18n>Sale Channel</CsI18n></TextStyle>
                          </div>
                        </Stack.Item>
                        <Stack.Item>
                          <TextStyle>{sales_channel}</TextStyle>
                        </Stack.Item>
                      </Stack>
                    </Stack.Item>
                  </Stack>
                </div>
              </Stack.Item>
              <Stack.Item>
                <Stack vertical spacing="tight">
                  <Stack.Item>
                    <Stack>
                      <Stack.Item>
                        <div className="tax-key">
                          <TextStyle><CsI18n>Amount</CsI18n></TextStyle>
                        </div>
                      </Stack.Item>
                      <Stack.Item>
                        <TextStyle>{text_order_total}</TextStyle>
                      </Stack.Item>
                    </Stack>
                  </Stack.Item>
                  <Stack.Item>
                    <Stack>
                      <Stack.Item>
                        <div className="tax-key">
                          <TextStyle><CsI18n>Total Tax</CsI18n></TextStyle>
                        </div>
                      </Stack.Item>
                      <Stack.Item>
                        <TextStyle>{text_order_tax}</TextStyle>
                      </Stack.Item>
                    </Stack>
                  </Stack.Item>
                  <Stack.Item>
                    <Stack>
                      <Stack.Item>
                        <div className="tax-key">
                          <TextStyle><CsI18n>Currency</CsI18n></TextStyle>
                        </div>
                      </Stack.Item>
                      <Stack.Item>
                        <TextStyle>{store_currency}</TextStyle>
                      </Stack.Item>
                    </Stack>
                  </Stack.Item>
                </Stack>
              </Stack.Item>
            </Stack>
          </Stack.Item>
        </Stack>
      </Card>
    )
  }

  renderShipping() {
    let {is_included_tax} = this.state.order[0];
    let {country_code, city, address_line_1, address_line_2, store_currency_symbol, taxable_amount, country_tax_rate, tax_collectable, currency_rate_usd} = this.state.shipping[0];
    const image_url = country_code? (this.shopify.static_content + '/amazon/flags/flag_' + country_code.toLowerCase() + '_64px.png'):'';
    let text_store_shipping_total;
    if( is_included_tax == 1 ) {
      text_store_shipping_total = Util.isNumber(taxable_amount)? (store_currency_symbol + " " + parseFloat(taxable_amount).toFixed(2)):'';
    } else {
      text_store_shipping_total = Util.isNumber(taxable_amount)? (store_currency_symbol + " " + parseFloat(parseFloat(taxable_amount) + parseFloat(tax_collectable)).toFixed(2)):'';
    }
    const text_country_tax_rate = Util.isNumber(country_tax_rate)? (country_tax_rate * 100 + "%"):"";
    const text_tax = (Util.isNumber(tax_collectable))? (store_currency_symbol + " " + parseFloat(tax_collectable).toFixed(2)):'';
    return (
      <Card sectioned>
        <Stack distribution="fillEvenly">
          <Stack.Item>
            <div className="address">
              <Stack>
                <Stack.Item>
                  <div className="flag">
                    {image_url? <Avatar source={image_url} size="small"/>:''}
                  </div>
                </Stack.Item>
                <Stack.Item>
                  <Stack vertical spacing="tight">
                    <Stack.Item>
                      <Stack>
                        <Stack.Item>
                          <div className="tax-flag-key">
                            <CsI18n>Address</CsI18n>
                          </div>
                        </Stack.Item>
                        <Stack.Item>
                          {address_line_1? <Stack><Stack.Item>{address_line_1}</Stack.Item></Stack>: ""}
                          {address_line_2? <Stack><Stack.Item>{address_line_2}</Stack.Item></Stack>: ""}
                        </Stack.Item>
                      </Stack>
                    </Stack.Item>
                    <Stack.Item>
                      <Stack>
                        <Stack.Item>
                          <div className="tax-flag-key">
                            <CsI18n>City</CsI18n>
                          </div>
                        </Stack.Item>
                        <Stack.Item>
                          {city? city:""}
                        </Stack.Item>
                      </Stack>
                    </Stack.Item>
                  </Stack>
                </Stack.Item>
              </Stack>

            </div>
          </Stack.Item>

          <Stack.Item>
            <Stack vertical spacing="tight">
              <Stack.Item>
                <Stack>
                  <Stack.Item>
                    <div className="tax-key">
                      <CsI18n>Shipping Total</CsI18n>
                    </div>
                  </Stack.Item>
                  <Stack.Item>
                    {text_store_shipping_total}
                  </Stack.Item>
                </Stack>
              </Stack.Item>
              <Stack.Item>
                <Stack>
                  <Stack.Item>
                    <div className="tax-key">
                      <CsI18n>Shipping Tax Rate</CsI18n>
                    </div>
                  </Stack.Item>
                  <Stack.Item>
                    {text_country_tax_rate}
                  </Stack.Item>
                </Stack>
              </Stack.Item>
              <Stack.Item>
                <Stack>
                  <Stack.Item>
                    <div className="tax-key">
                      <CsI18n>Shipping Tax</CsI18n>
                    </div>
                  </Stack.Item>
                  <Stack.Item>
                    {text_tax}
                  </Stack.Item>
                </Stack>
              </Stack.Item>
            </Stack>
          </Stack.Item>
        </Stack>
      </Card>
    )
  }

  static renderOrderStatus(order_status) {
    switch (order_status) {
      case 'Shipped':
        return <Badge status="success"><CsI18n>Shipped</CsI18n></Badge>;
      case 'Unshipped':
        return <Badge status="attention"><CsI18n>Unshipped</CsI18n></Badge>;
      case 'PartiallyShipped':
        return <Badge status="attention"><CsI18n>Partially shipped</CsI18n></Badge>;
      case 'Pending':
        return <Badge><CsI18n>Pending</CsI18n></Badge>;
      case 'Canceled':
        return <Badge><CsI18n>Canceled</CsI18n></Badge>;
      default:
        return <Badge><CsI18n>{order_status}</CsI18n></Badge>;
    }
  }

  renderItems() {
    let rows = [];
    let {is_included_tax} = this.state.order[0];
    let order_status = OrderDetail.renderOrderStatus(this.state.order[0].order_status);

    for (let index in this.state.items) {
      let item = this.state.items[index];
      let {sku, quantity, store_currency_symbol, store_price, store_tax_rate, store_tax} = item;
      const text_price = Util.isNumber(store_price)? (store_currency_symbol + " " + parseFloat(store_price).toFixed(2)):'';
      const text_tax_rate = Util.isNumber(store_tax_rate)? (parseInt(store_tax_rate * 100) + "%"):'';
      const text_store_tax = Util.isNumber(store_tax)? (store_currency_symbol + " " + parseFloat(store_tax).toFixed(2)):'';
      let text_total_store_price;
      if( is_included_tax == 1 ) {
        text_total_store_price = (Util.isNumber(store_price) && Util.isNumber(quantity) && Util.isNumber(store_tax))? (store_currency_symbol + " " + parseFloat(quantity * parseFloat(store_price) ).toFixed(2)):'';
      } else {
        text_total_store_price = (Util.isNumber(store_price) && Util.isNumber(quantity) && Util.isNumber(store_tax))? (store_currency_symbol + " " + parseFloat(quantity * parseFloat(store_price) + parseFloat(store_tax)).toFixed(2)):'';
      }

      console.log("renderItems", is_included_tax, text_total_store_price, item);


      rows[index] = [
        sku,
        order_status,
        quantity,
        text_price,
        text_tax_rate,
        <TextStyle>{text_store_tax}</TextStyle>,
        text_total_store_price,
      ]
    }
    return (
      <Card sectioned>
        <DataTable
          columnContentTypes={[
            'text',
            'text',
            'numeric',
            'numeric',
            'numeric',
            'numeric',
            'numeric',
          ]}
          headings={[
            <Heading><CsI18n>SKU</CsI18n></Heading>,
            <Heading><CsI18n>Status</CsI18n></Heading>,
            <Heading><CsI18n>QTY</CsI18n></Heading>,
            <Heading><CsI18n>Price</CsI18n></Heading>,
            <Heading><CsI18n>Rate</CsI18n></Heading>,
            <Heading><CsI18n>Tax</CsI18n></Heading>,
            <Heading><CsI18n>Total</CsI18n></Heading>,
          ]}
          rows={rows}
        />
      </Card>
    )
  }
}
