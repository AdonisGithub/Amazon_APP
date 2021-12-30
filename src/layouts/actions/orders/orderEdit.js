import React from 'react';
import CsI18n from "../../../components/csI18n";
import {
    Layout,
    Page,
    Card,
    Checkbox,
    Badge,
    Banner,
    Button,
    DataTable,
    Modal,
    Heading,
    Icon,
    Link,
    Stack,
    TextStyle, Tooltip,

} from '@shopify/polaris';

import AmazonTab from "../../../helpers/amazon-tab";
import "./orders.css";
import Util from "../../../helpers/Util";
import ShopifyContext from "../../../context";
import CancelItemModal from "./cancelItemModal";
import ApplicationApiCall from "../../../functions/application-api-call";
import CsErrorMessage from "../../../components/csErrorMessage/csErrorMessage";
import CsEmbeddedModal from "../../../components/csEmbeddedModal";
import {ChevronLeftMinor, CircleChevronRightMinor, DeleteMinor, PrintMinor} from "@shopify/polaris-icons";




const STATUS_UNTREATED = 1;
const STATUS_FULFILLED = 2;
const STATUS_PARTICIAL = 3;


export default class orderEdit extends AmazonTab {

    state = {
        data: {},
        shopify_order: {},
        shipping_address: {},
        currency: '',
        item_checked: [],
        item_modal_active: false,
        cancel_modal_active: false,
        shopify_order_edit: {},
        buttonLoading: {
            cancelOrder: false,
            cancelItem: false,
        },
    }

    getName() {
        return "orderEdit";
    }

    constructor(props) {
        super(props);

        this.itemRows = [];
        this.init_total_items = 0;
        this.edit_total_items = 0;
        this.refundedItemRows = [];
        this.state.data = props.data;
        this.state.shopify_order = props.data.shopify_order;
        this.state.shipping_address = props.data.shopify_order.shipping_address
        this.state.currency = this.state.shopify_order.order.currency;
        this.state.item_checked = [];
        this.shopify = ShopifyContext.getShared();
        this.state.shopify_order_edit = Util.clone(this.state.shopify_order.order)
        this.getInitTotalItems();

    }

    componentWillMount() {
    }

    getInitTotalItems() {
        this.init_total_items = 0;
        this.state.shopify_order_edit.line_items.forEach((item) => {
            this.init_total_items += parseInt(item.quantity);
        })
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

    getFulfillStatus() {

        if (this.state.shopify_order_edit.fulfillment_status) {
            switch (this.state.shopify_order_edit.fulfillment_status) {
                case 'fulfilled':
                    return STATUS_FULFILLED;
                case 'particial':
                    return STATUS_PARTICIAL;
            }
        } else {
            return STATUS_UNTREATED;
        }

    }

    checkArray = (array, key) => {
        return array.indexOf(key) != -1;
    }

    init() {
        console.log('orderEdit:init', this.state.shopify_order);

        this.itemrows = [];
        this.refundedItemRows = [];
        this.edit_total_items = 0;

        for (let index in this.state.shopify_order_edit.line_items) {
            let item = this.state.shopify_order_edit.line_items[index];

            this.edit_total_items += parseInt(item.quantity);
            this.itemrows[index] = [
                <Checkbox
                    disabled={item.quantity == 0 || this.getFulfillStatus() === STATUS_FULFILLED}
                    checked={this.checkArray(this.state.item_checked, index)}
                    onChange={this.handleCheckChange(index)}/>,
                <p>{item.title}</p>,
                item.sku,
                item.quantity,
                Util.getCurrency(item.price, this.state.currency),
                Util.getCurrency(item.quantity * item.price, this.state.currency),
            ]

        }
    }

    handleOrdersBack = () => {

        const {ordersBack} = this.props;
        ordersBack();
    }

    handleCheckChange = (idx) => (value) => {

        if (value) {
            let item_checked = [...this.state.item_checked, idx];
            this.setState({item_checked: item_checked.sort()})
        } else {
            let array = this.state.item_checked;
            let index = array.indexOf(idx)
            array.splice(index, 1);
            this.setState(state => (state.selected = array, state), this.checkAllfn);
        }

    }

    handleItemModalActive = (action) => () => {
        if (action === 'open') {
            this.setState({item_modal_active: true});
        }
        if (action === 'close') {
            this.setState({item_modal_active: false});
        }

    };

    handleItemModalChange = (items) => {

        this.state.shopify_order_edit.line_items = items;
        let {buttonLoading} = this.state;
        buttonLoading.cancelItem = true;
        let order_items = [];
        for (let index in this.state.shopify_order.line_items) {
            let item = this.state.shopify_order.line_items[index];
            if (item.quantity != this.state.shopify_order_edit.line_items[index].quantity) {
                order_items.push({id: item.product_id, quantity: item.quantity});
            }
        }
        ApplicationApiCall.post('/application/orders/cancelitems', {configuration: this.shopify.getConfigurationSelected()}, {
            amazon_order_id: this.state.data.amazon_order_id,
            order_items: order_items
        }, this.cbCancelOrder('cancelItems'), this.cbInitError);

        const {onCancelItems} = this.props;
        onCancelItems(this.state.shopify_order_edit);

        this.setState({
            item_modal_active: false,
            item_checked: [],
            buttonLoading,
        });
    }

    cbInitError = (err) => {
        console.log(err);


        if(err){
            // setTimeout(() => {
            //     this.setState({error: null})
            // }, 5000)

            this.setState({error: err, processing: false})
        }
    }

    handleCancelModalActive = (action) => () => {

        let {buttonLoading} = this.state;
        if (action === 'open') {
            this.setState({cancel_modal_active: true});
        }
        if (action === 'close') {
            this.setState({cancel_modal_active: false});
        }
        if (action === 'confirm') {
            buttonLoading.cancelOrder = true;
            ApplicationApiCall.post('/application/orders/cancel', {configuration: this.shopify.getConfigurationSelected()}, {amazon_order_id: this.state.data.amazon_order_id}, this.cbCancelOrder('cancel'));
            const {onCancel} = this.props;
            onCancel();
            this.setState({
                cancel_modal_active: false,
                buttonLoading: buttonLoading,
            });
        }
    }

    cbCancelOrder = (op) => (json) => {
        let {buttonLoading} = this.state;
        if (op === 'cancel') {
            if (json) {
                buttonLoading.cancelOrder = false;
                this.setState((preState) => ({
                    preState,
                    buttonLoading: buttonLoading,
                }))
            }
        }

        if (op === 'cancelItems') {
            if (json) {
                buttonLoading.cancelItem = false;
                this.setState((preState) => ({
                    preState,
                    buttonLoading: buttonLoading,
                }))
            }
        }

    }

    checkItemsChange() {
        for (let idx in this.state.shopify_order_edit.line_items) {
            if (this.state.shopify_order_edit.line_items[idx].quantity != this.state.shopify_order.line_items[idx].quantity) {
                return true;
            }
        }

        return false;
    }

    render() {
        console.log('render:', this.state);

        this.init();
        const order_link = this.shopify.getShopUrl() + '/admin/orders/' + this.state.data.shopify_order_id;
        let status;
        switch (this.getFulfillStatus()) {
            case STATUS_FULFILLED:
                status = <Badge status="success" progress="complete"><CsI18n>Fulfilled</CsI18n></Badge>;
                break;
            case STATUS_PARTICIAL:
                status = <Badge status="warning" progress="partiallyComplete"><CsI18n>Particial</CsI18n></Badge>;
                break;
            case STATUS_UNTREATED:
                status = <Badge status="attention" progress="incomplete"><CsI18n>Untreated</CsI18n></Badge>;
                break;
        }
        return (
            <div className="order-detail">
                <Page fullWidth>
                    <Layout>
                        <Layout.Section>
                            {this.state.error ? this.renderError() : ''}
                            <Card>
                                <Card.Section>
                                    <div className="header">
                                        <Stack vertical>
                                            <Stack.Item>
                                            </Stack.Item>
                                            <Stack.Item>
                                                <Stack alignment="center">
                                                    <Stack.Item fill>
                                                        <Link onClick={this.handleOrdersBack}><Icon source={ChevronLeftMinor} color="inkLighter"/><CsI18n>Orders</CsI18n></Link>
                                                    </Stack.Item>
                                                    <Stack.Item>
                                                        {status}
                                                    </Stack.Item>
                                                </Stack>
                                            </Stack.Item>
                                            <Stack.Item>
                                                <Stack>
                                                    <Stack.Item>
                                                        <div className="order-key">
                                                            <TextStyle variation="strong"><CsI18n>Amazon Order ID:</CsI18n></TextStyle>
                                                        </div>
                                                    </Stack.Item>
                                                    <Stack.Item>
                                                        <TextStyle
                                                            variation="strong">#{this.state.data.amazon_order_id}</TextStyle>
                                                    </Stack.Item>

                                                </Stack>
                                                <Stack>
                                                    <Stack.Item>
                                                        <div className="order-key">
                                                            <TextStyle variation="strong"><CsI18n>Shopify Order ID:</CsI18n></TextStyle>
                                                        </div>
                                                    </Stack.Item>
                                                    <Stack.Item>
                                                        <TextStyle
                                                            variation="strong">#{this.state.data.shopify_order_id}</TextStyle>
                                                        <Tooltip content={CsI18n.t("Shopify Order")} preferredPosition="above"><a
                                                            href={order_link} target="_blank"><Icon
                                                            source={CircleChevronRightMinor}
                                                            color="inkLighter"/></a></Tooltip>
                                                    </Stack.Item>
                                                </Stack>
                                            </Stack.Item>
                                        </Stack>
                                    </div>
                                </Card.Section>
                            </Card>
                            {this.renderOrderStatus()}
                            {this.renderItems()}
                            {/*this.init_total_items !== this.edit_total_items ? this.renderRefundedItems() : ''*/}
                            {this.renderPayment()}
                        </Layout.Section>
                        {this.renderCustomer()}
                        {this.state.item_modal_active === true ?
                            <CancelItemModal
                                line_items={this.state.shopify_order_edit.line_items}
                                checked={this.state.item_checked}
                                onClose={this.handleItemModalActive('close')}
                                onChange={this.handleItemModalChange}
                            /> : ''}
                    </Layout>
                    <CsEmbeddedModal
                        open={this.state.cancel_modal_active}
                        onClose={this.handleCancelModalActive('close')}
                        title={CsI18n.t('Cancel Order')}
                        primaryAction={{
                            content: <CsI18n>Confirm</CsI18n>,
                            onAction: this.handleCancelModalActive('confirm'),
                            destructive: true
                        }}
                        secondaryActions={[
                            {
                                content: <CsI18n>close</CsI18n>,
                                onAction: this.handleCancelModalActive('close'),
                            },
                        ]}
                    >
                        <Modal.Section>
                            <Heading><CsI18n>Do you really cancel order?</CsI18n></Heading>
                        </Modal.Section>
                    </CsEmbeddedModal>
                </Page>
            </div>
        );
    }

    renderError(){

        return(
          <CsErrorMessage
            errorType={this.state.error.type}
            errorMessage={this.state.error.message}
          />
        )
    }

    renderOrderStatus() {
        const print_url = "https://orderprinter.shopifyapps.com/orders?shop=" + this.shopify.store + "&id=" + this.state.data.shopify_order_id;
        return (
            <Card sectioned>
                <Stack vertical spacing="tight">
                    <Stack.Item>
                        <Stack>
                            <Stack.Item>
                                <div className="order-key">
                                    <TextStyle><CsI18n>Purchase Date:</CsI18n></TextStyle>
                                </div>
                            </Stack.Item>
                            <Stack.Item>
                                <TextStyle>{this.state.data.display_date}</TextStyle>
                            </Stack.Item>
                        </Stack>
                        <Stack>
                            <Stack.Item>
                                <div className="order-key">
                                    <TextStyle><CsI18n>Sale Channel:</CsI18n></TextStyle>
                                </div>
                            </Stack.Item>
                            <Stack.Item>
                                <TextStyle>{this.state.data.sales_channel}</TextStyle>
                            </Stack.Item>
                        </Stack>
                        <Stack>
                            <Stack.Item>
                                <div className="order-key">
                                    <TextStyle><CsI18n>Shipping:</CsI18n></TextStyle>
                                </div>
                            </Stack.Item>
                            <Stack.Item>
                                <TextStyle>{this.state.data.shipment_service_level_category}</TextStyle>
                            </Stack.Item>
                        </Stack>
                    </Stack.Item>
                    {this.state.data.is_business_order == 1 || this.state.data.is_premium_order == 1 || this.state.data.is_prime == 1 ?
                        <Stack.Item>
                            <Stack>
                                <Stack.Item>
                                    {this.state.data.is_business_order == 1 ? <Badge status="success"><CsI18n>Business Order</CsI18n></Badge> : ''}
                                    {this.state.data.is_premium_order == 1 ? <Badge status="success"><CsI18n>Premium Order</CsI18n></Badge> : ''}
                                    {this.state.data.is_prime == 1 ? <Badge status="success"><CsI18n>Prime Order</CsI18n></Badge> : ''}
                                </Stack.Item>
                            </Stack>
                        </Stack.Item>
                        : ''}
                    <Stack.Item>
                        <Stack>
                            <Stack.Item fill>
                                {/*{this.getFulfillStatus() === STATUS_UNTREATED ?*/}
                                    {/*<Button loading={this.state.buttonLoading.cancelOrder}*/}
                                            {/*onClick={this.handleCancelModalActive('open')} icon={DeleteMinor}*/}
                                            {/*destructive><CsI18n>Cancel</CsI18n></Button>*/}
                                    {/*: ''}*/}
                            </Stack.Item>
                            <Stack.Item>
                                <a className="Polaris-Link"
                                   href={print_url}
                                   target="_blank"><Icon source={PrintMinor} color="inkLighter"/><CsI18n>Print Order</CsI18n></a>
                            </Stack.Item>
                        </Stack>
                    </Stack.Item>
                </Stack>
            </Card>
        )
    }

    renderItems() {
        return (
            <Card sectioned>
                <Stack vertical spacing="tight">
                    <Stack.Item>
                        <div className="table">
                            <DataTable
                                columnContentTypes={[
                                    'text',
                                    'text',
                                    'text',
                                    'numeric',
                                    'numeric',
                                    'numeric',
                                ]}
                                headings={[
                                    '',
                                    <Heading><CsI18n>Title</CsI18n></Heading>,
                                    <Heading><CsI18n>SKU</CsI18n></Heading>,
                                    <Heading><CsI18n>QTY</CsI18n></Heading>,
                                    <Heading><CsI18n>Price</CsI18n></Heading>,
                                    <Heading><CsI18n>Total</CsI18n></Heading>,
                                ]}
                                rows={this.itemrows}
                            />
                        </div>
                    </Stack.Item>
                    {/*{this.getFulfillStatus() !== STATUS_FULFILLED ?*/}
                        {/*<Stack.Item>*/}
                            {/*<Button disabled={this.state.item_checked.length === 0}*/}
                                    {/*loading={this.state.buttonLoading.cancelItem}*/}
                                    {/*icon={DeleteMinor}*/}
                                    {/*onClick={this.handleItemModalActive('open')}*/}
                                    {/*destructive><CsI18n>Cancel</CsI18n></Button>*/}
                        {/*</Stack.Item>*/}
                        {/*: ''}*/}
                </Stack>
            </Card>
        )
    }

    renderRefundedItems() {
        return (
            <Card sectioned>
                <Stack vertical spacing="tight">
                    <Stack.Item>
                        <Banner status="success"
                                title={CsI18n.t("Refunded items ({{refunded_items}})",{refunded_items:(this.init_total_items - this.edit_total_items)})}/>
                    </Stack.Item>
                </Stack>
                <div className="table">
                    <DataTable
                        columnContentTypes={[
                            'text',
                            'text',
                            'numeric',
                            'numeric',
                            'numeric',
                        ]}
                        headings={[
                            <Heading><CsI18n>Title</CsI18n></Heading>,
                            <Heading><CsI18n>SKU</CsI18n></Heading>,
                            <Heading><CsI18n>QTY</CsI18n></Heading>,
                            <Heading><CsI18n>Price</CsI18n></Heading>,
                            <Heading><CsI18n>Total</CsI18n></Heading>,
                        ]}
                        rows={this.refundedItemRows}
                    />
                </div>
            </Card>
        )
    }

    renderPayment() {
        let total_shipping_price = 0;
        // let total_shipping_tax_price = 0;
        // let shipping_rate = 0;
        // let item_tax_rate = 0;
        // if( this.state.shopify_order_edit.tax_lines && this.state.shopify_order_edit.tax_lines.length > 0 ) {
        //     item_tax_rate = parseInt(this.state.shopify_order_edit.tax_lines[0].rate * 100);
        // }

        for (let index in this.state.shopify_order_edit.shipping_lines) {
            let shipping = this.state.shopify_order_edit.shipping_lines[index];
            total_shipping_price += shipping.price;
            //tax_lines has only one record. //@kbug_190929
            // if (shipping.tax_lines && shipping.tax_lines.length > 0 ) {
            //     total_shipping_tax_price += shipping.tax_lines[0].price;
            //     shipping_rate = shipping.tax_lines[0].rate;
            // }
        }

        // shipping_rate = parseInt(shipping_rate * 100);
        // console.log('renderPayment', this.state.shopify_order_edit, shipping_rate, item_tax_rate);
        let isIncludedTax = this.state.shopify_order_edit.taxes_included;
        let taxes = this.state.shopify_order_edit.tax_lines.map((item, index) => {
            let tax_rate = parseInt(item.rate * 100);
            return (<Stack key={'tax-line-'+index}>
                <Stack.Item fill>{item.title + ' ' + tax_rate + "%" + (isIncludedTax? (" (" + CsI18n.t("Included") + ")"): "")}</Stack.Item>
                <Stack.Item>{Util.getCurrency(item.price_set.shop_money.amount, item.price_set.shop_money.currency_code)} </Stack.Item>
            </Stack>);
        });

        const shipping = this.state.shopify_order_edit.shipping_lines.map((item, index) =>
            <Stack key={index}>
                <Stack.Item fill>
                    {item.title}({parseFloat(this.state.shopify_order_edit.total_weight / 1000).toFixed(2)}Kg)
                </Stack.Item>
                <Stack.Item>
                    {Util.getCurrency(item.price, this.state.currency)}
                </Stack.Item>
            </Stack>
        );

        let payment_status_banner = '';
        switch (this.state.shopify_order_edit.financial_status) {
            case 'unpaid':
                payment_status_banner = <Badge status="warning"><CsI18n>Unpaid</CsI18n></Badge>//<Banner status='warning' title='Unpaid'/>
                break;
            case 'paid':
                payment_status_banner = <Badge status="success" progress="complete"><CsI18n>Paid</CsI18n></Badge>// <Banner status='success' title='Paid'/>
                break;
            case 'Refunded':
                payment_status_banner = <Badge><CsI18n>Refunded</CsI18n></Badge>//<Banner status='success' title='Refunded'/>
                break;
            case 'partly refunded':
                payment_status_banner =
                    <Badge status="info" progress="partiallyComplete"><CsI18n>Partly Refunded</CsI18n></Badge>//<Banner status='warning' title='Partly Refunded'/>
                break;
        }


        return (
            <Card sectioned>
                <Stack vertical spacing="tight">
                    <Stack.Item>
                        <Stack>
                            {payment_status_banner}
                        </Stack>
                    </Stack.Item>
                    <Stack.Item>
                        <Stack>
                            <Stack.Item>
                                <div className="order-key"><CsI18n>Sub-Total</CsI18n></div>
                            </Stack.Item>
                            <Stack.Item fill>{this.state.shopify_order_edit.line_items.length > 1 ? CsI18n.t('{{line_items}} articles', {line_items : this.state.shopify_order_edit.line_items.length}) : (this.init_total_items > 1 ? CsI18n.t('{{init_total_items}} items',{init_total_items : this.init_total_items}) : CsI18n.t('{{init_total_items}} item',{init_total_items : this.init_total_items}))}</Stack.Item>
                            <Stack.Item>
                                {Util.getCurrency(this.state.shopify_order_edit.subtotal_price, this.state.currency)}
                            </Stack.Item>
                        </Stack>
                    </Stack.Item>
                    <Stack.Item>
                        <Stack>
                            <Stack.Item>
                                <div className="order-key"><CsI18n>Shipping</CsI18n></div>
                            </Stack.Item>
                            <Stack.Item fill>
                                {shipping}
                            </Stack.Item>
                        </Stack>
                    </Stack.Item>
                    <Stack.Item>
                        <Stack>
                            <Stack.Item>
                                <div className="order-key"><CsI18n>Tax</CsI18n></div>
                            </Stack.Item>
                            <Stack.Item fill>
                                {taxes}
                            </Stack.Item>
                        </Stack>
                    </Stack.Item>
                    <Stack.Item>
                        <Stack alignment="center">
                            <Stack.Item fill>
                                <Heading><CsI18n>Total</CsI18n></Heading>
                            </Stack.Item>
                            <Stack.Item>
                                <Heading>{Util.getCurrency(this.state.shopify_order_edit.total_price, this.state.currency)}</Heading>
                            </Stack.Item>
                        </Stack>
                    </Stack.Item>
                    <Stack.Item>
                        <Stack alignment="center">
                            <Stack.Item fill>
                                <CsI18n>Paid by the customer</CsI18n>
                            </Stack.Item>
                            <Stack.Item>
                                {Util.getCurrency(this.state.data.total_price, this.state.currency)}
                            </Stack.Item>
                        </Stack>
                    </Stack.Item>
                    {/*{this.init_total_items !== this.edit_total_items ?
                        <div>
                            <Stack.Item>
                                <Stack alignment="center">
                                    <Stack.Item>
                                        <div className="order-key">
                                            <CsI18n>Refunded</CsI18n>
                                        </div>
                                    </Stack.Item>
                                    <Stack.Item fill>
                                        -
                                    </Stack.Item>
                                    <Stack.Item>
                                        {Util.getCurrency(total_refunded_item_price, this.state.currency)}
                                    </Stack.Item>
                                </Stack>
                            </Stack.Item><Stack.Item>
                            <Stack alignment="center">
                                <Stack.Item fill>
                                    <div className="order-key">
                                        <TextStyle variation="strong"><CsI18n>Net payment</CsI18n></TextStyle>
                                    </div>
                                </Stack.Item>
                                <Stack.Item>
                                    {Util.getCurrency(parseFloat(total_price) - parseFloat(total_refunded_item_price),  this.state.currency)}
                                </Stack.Item>
                            </Stack>
                        </Stack.Item></div> : ''}*/}
                </Stack>
            </Card>
        )
    }

    renderCustomer() {
        return (
            <Layout.Section secondary>
                <Card sectioned>
                    <Card.Section>
                        <Stack vertical spacing="tight">
                            <Stack.Item>
                                <TextStyle variation="strong"><CsI18n>COMMENT</CsI18n></TextStyle>
                            </Stack.Item>
                            <Stack.Item>
                                <Stack>
                                    <Stack.Item>
                                        {this.state.shopify_order_edit.note}
                                    </Stack.Item>
                                </Stack>
                            </Stack.Item>
                        </Stack>
                    </Card.Section>
                </Card>
                <Card sectioned>
                    <Card.Section>
                        <Stack vertical spacing="tight">
                            <Stack.Item>
                                <Stack>
                                    <Stack.Item>
                                        <TextStyle variation="strong"><CsI18n>CUSTOMER</CsI18n></TextStyle>
                                    </Stack.Item>
                                </Stack>
                            </Stack.Item>
                            <Stack.Item>
                                {this.state.data.name}
                            </Stack.Item>
                        </Stack>
                    </Card.Section>
                    <Card.Section>
                        <Stack vertical spacing="tight">
                            <Stack.Item>
                                <Stack wrap={false}>
                                    <Stack.Item fill><TextStyle variation="strong"><CsI18n>CONTACT INFORMATION</CsI18n></TextStyle></Stack.Item>
                                </Stack>
                            </Stack.Item>
                            <Stack.Item>
                                {this.state.shopify_order_edit.email}
                            </Stack.Item>
                            <Stack.Item>
                                {this.state.shopify_order_edit.shipping_address.phone}
                            </Stack.Item>
                        </Stack>
                    </Card.Section>
                    <Card.Section>
                        <Stack vertical spacing="tight">
                            <Stack.Item>
                                <Stack>
                                    <Stack.Item fill><TextStyle variation="strong"><CsI18n>SHIPPING ADDRESS</CsI18n></TextStyle></Stack.Item>
                                </Stack>
                            </Stack.Item>
                            <Stack.Item>
                                {this.state.shopify_order_edit.shipping_address.name}
                            </Stack.Item>
                            <Stack.Item>
                                {this.state.shopify_order_edit.shipping_address.address1}
                            </Stack.Item>
                            <Stack.Item>
                                {this.state.shopify_order_edit.shipping_address.zip} {this.state.shopify_order_edit.shipping_address.city}
                            </Stack.Item>
                            <Stack.Item>
                                {this.state.shopify_order_edit.shipping_address.country}
                            </Stack.Item>
                            <Stack.Item>
                                {this.state.shopify_order_edit.shipping_address.phone}
                            </Stack.Item>
                        </Stack>
                    </Card.Section>
                    <Card.Section>
                        <Stack vertical spacing="tight">
                            <Stack.Item>
                                <Stack>
                                    <Stack.Item><TextStyle variation="strong"><CsI18n>BILLING ADDRESS</CsI18n></TextStyle></Stack.Item>
                                </Stack>
                            </Stack.Item>
                            <Stack.Item>
                                <CsI18n>No billing address</CsI18n>
                            </Stack.Item>
                        </Stack>
                    </Card.Section>
                </Card>

            </Layout.Section>
        )
    }

}
