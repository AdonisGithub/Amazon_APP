import React from 'react'
import CsI18n from "./../../components/csI18n"
import "./support.scss";

import {
  Banner,
  Button,
  Card,
  List,
  TextField,
  DisplayText, Page,
  Heading,
  Stack, Toast
} from '@shopify/polaris';

import Context from '../../context';
import {DuplicateMinor} from "@shopify/polaris-icons";
import SupportConfirmModal from "./supportConfirmModal";
import ApplicationApiCall from "../../functions/application-api-call";
import Util from "../../helpers/Util";
import {ErrorType} from "../../components/csErrorMessage/csErrorMessage";
import CsErrorMessage from "../../components/csErrorMessage";


class Support extends React.Component {
  constructor(props) {

    super(props);
    this.state = {
      copySuccess: '',
      support_confirm_opened: false,
      selected_support: 0,
      sent_request: false,
      processing: false,
    };
    this.shopify = Context.getShared();
    this.unMounted = false;

      console.log(this.shopify);
  }

  componentDidMount() {
    const head = document.querySelector('head');
    const script = document.createElement('script');
    //script.setAttribute('src',  'https://assets.calendly.com/assets/external/widget.js');
    //head.appendChild(script);

    let configuration = this.shopify.getConfigurationSelected();
    let params = {configuration};
    ApplicationApiCall.get('/application/support/notice', params, this.cbGetParamSuccess, this.cbGetParamError, false);
  }

  componentWillUnmount() {
    this.unMounted = true;
  }

  cbProceedSuccess() {
    this.setState({process_success: CsI18n.t('The support request has sent.')});
    setTimeout(() => {
      if (this.unMounted) {
        return;
      }
      this.setState({process_success: null});
    }, 7000);
  }

  cbGetParamSuccess = (json) => {
    if (this.unMounted) {
      return;
    }
    if (json.is_triggered) {
      this.cbProceedSuccess();
    }
  }

  cbGetParamError = (err) => {
    // console.log("cbGetParamError", err);
    this.setState({loading: false, global_error: err});
  }

  handleClip = (e) => {
    let clipbaord = document.getElementById('clipboard');

    clipbaord.select();
    document.execCommand('copy');
    e.target.focus();
    this.setState({copySuccess: 'Copied successfully!'});
  }

  onHandleSupportProcess = (mode) => () => {
    if (mode == 0) {
      this.setState({selected_support: mode}, () => {this.processSupport()});
    } else {
      this.setState({selected_support: mode, support_confirm_opened: true});
    }
  }

  handleModalOk = () => {
    // console.log("handleModalOk");
    this.processSupport();
    this.setState({support_confirm_opened: false});
  }

  handleModalCancel = () => {
    // console.log("handleModalCancel");
    this.setState({support_confirm_opened: false})
  }

  processSupport() {
    let {selected_support} = this.state;
    let configuration = this.shopify.getConfigurationSelected();
    let params = {configuration, selected_support};
    ApplicationApiCall.get('/application/support/request', params, (json) => {
      this.cbSupportSuccess(selected_support, json)
    }, this.cbSupportFail, false);

    this.setState({processing: true});
  }


  cbSupportSuccess = (selected_support, json) => {
    // console.log("cbSupportSuccess", json);
    if (this.unMounted) {
      return;
    }
    if(json.success) {
      if (selected_support == 0) {
        this.cbProceedSuccess();
        this.setState({processing: false, sent_request: true});
      } else {
        Util.redirect(json.url);
      }
    } else {
      this.setState({processing: false, process_success: false,
        process_error: {type: ErrorType.CUSTOM, title: json.error_message}});
    }
  }

  cbSupportFail = (err) => {
    console.error(err);
    this.setState({processing: false, process_success: false, process_error: err});
  }

  renderError() {
    let type;
    let title = '';
    let message;

    type = this.state.process_error.type;
    message = this.state.process_error.title;

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

  render() {
    let {selected_support, support_confirm_opened} = this.state;
    let connected = <Button icon={DuplicateMinor} onClick={this.handleClip}/>

    let support_prices =
      [
        {price: 0, contents: CsI18n.t('')},
        {price: 100, contents: CsI18n.t('100 SKU or less')},
        {price: 300, contents: CsI18n.t('1,000 SKU or less')},
        {price: 500, contents: CsI18n.t('10,000 SKU or less')},
      ];

    let selected_support_price;
    let selected_support_contents;

    if (support_confirm_opened) {
      selected_support = parseInt(selected_support);
      selected_support_price = support_prices[selected_support].price;
      selected_support_contents = support_prices[selected_support].contents;
    }

    let notice = null;
    if (this.state.process_success) {
      notice = (
        <Toast duration={7000} content={this.state.process_success} onDismiss={()=>{ this.setState({process_success: false}) } } />
      );
    } else if (this.state.process_error) {
      notice = this.renderError();
    }

    return (
      <Page>
        <div className={"mt-3"}>
          <Card>
            <Banner title={CsI18n.t("Free Support Request")} status="info">
              <br/>
              <p>
                <CsI18n>Technical support is available by e-mail via our helpdesk.</CsI18n>
              </p>
              <p>
                <CsI18n>Please provide us:</CsI18n>
              </p>
              <br/>
              <List type="bullet">
                <List.Item><CsI18n>A relevant description of the trouble</CsI18n></List.Item>
                <List.Item><CsI18n>Your name</CsI18n></List.Item>
                <List.Item>
                  <CsI18n>Your Store URL</CsI18n>
                  <span
                    style={{"color": "#108043"}}>{" : http://" + this.shopify.store_properties.myshopify_domain}</span>
                </List.Item>
                <List.Item><CsI18n>Screenshot if applicable</CsI18n></List.Item>
              </List>
              <br/>

              <TextField
                label={CsI18n.t("Support Email")}
                type="email"
                id="clipboard"
                readOnly
                value="support.amazon-app@common-services.com"
                connectedRight={connected}
              />
              <span style={{"color": "#108043"}}>{CsI18n.t(this.state.copySuccess)}</span>
              <br/>
            </Banner>
          </Card>

          <Card>
            <div style={{"margin": "4rem"}}>
              {notice}
              <Heading>{CsI18n.t("Paying support request")}</Heading>
              <br/>
              <p>
                <CsI18n>We can provide paying integration and its support according to your need. Satisfied or
                  refunded.</CsI18n>
              </p>
              <p>
                <CsI18n>Requirements;</CsI18n>
              </p>
              <br/>
              <p>
                <CsI18n>Products creation for GS1 Official barcodes owners;</CsI18n><br/>
                  <CsI18n>First please ensure that you have grants to list products with this GS1 range</CsI18n><br/>
                  <CsI18n>or that your brand is registered to Amazon Brand Registry;</CsI18n><br/>
                <a href="https://brandservices.amazon.com/"
                   target="_blank">https://brandservices.amazon.com/</a> (<CsI18n>replace .com by your region
                TLD</CsI18n>)
              </p>
              <br/>
              <p>
                <CsI18n>Products creation for merchants without barcodes;</CsI18n><br/>
                <CsI18n>Please ask for a barcode exemption;</CsI18n><br/>
                <a href="https://sellercentral.amazon.com/gtinx"
                   target="_blank">https://sellercentral.amazon.com/gtinx</a> (<CsI18n>replace .com by your region
                TLD</CsI18n>)
              </p>

              <br/>
              <div className={"support-price-list"}>
                <Stack alignment={"center"}>
                  <Stack.Item>
                    <p className={"label"}>{CsI18n.t('100 SKU or less')}</p>
                  </Stack.Item>
                  <Stack.Item>
                    <p className={"price"}>$100</p>
                  </Stack.Item>
                  <Stack.Item><Button
                    onClick={this.onHandleSupportProcess(1)}
                    disabled={this.state.processing}
                    loading={this.state.processing && this.state.selected_support == 1}
                  ><CsI18n>Proceed to checkout</CsI18n></Button></Stack.Item>
                </Stack>
                <Stack alignment={"center"}>
                  <Stack.Item>
                    <p className={"label"}>{CsI18n.t('1,000 SKU or less')}</p>
                  </Stack.Item>
                  <Stack.Item>
                    <p className={"price"}>$300</p>
                  </Stack.Item>
                  <Stack.Item><Button
                    onClick={this.onHandleSupportProcess(2)}
                    disabled={this.state.processing}
                    loading={this.state.processing && this.state.selected_support == 2}
                  ><CsI18n>Proceed to checkout</CsI18n></Button></Stack.Item>
                </Stack>
                <Stack alignment={"center"}>
                  <Stack.Item>
                    <p className={"label"}>
                      <CsI18n>10,000 SKU or less</CsI18n><br/>
                      <CsI18n>Maximum of 20 collections</CsI18n>
                    </p>
                  </Stack.Item>
                  <Stack.Item>
                    <p className={"price"}>$500</p>
                  </Stack.Item>
                  <Stack.Item><Button
                    onClick={this.onHandleSupportProcess(3)}
                    disabled={this.state.processing}
                    loading={this.state.processing && this.state.selected_support == 3}
                  ><CsI18n>Proceed to checkout</CsI18n></Button></Stack.Item>
                </Stack>
              </div>
              <div className={"support-custom"}>
                <Stack alignment={"center"}>
                  <Stack.Item>
                    <p className={"label"}>
                      <CsI18n>Custom integration, please send us an inquiry</CsI18n><br/>
                    </p>
                  </Stack.Item>
                  <Stack.Item><Button
                    onClick={this.onHandleSupportProcess(0)}
                    disabled={this.state.processing || this.state.sent_request}
                    loading={this.state.processing && this.state.selected_support == 0}
                  ><CsI18n>Send support inquiry</CsI18n></Button></Stack.Item>
                </Stack>
              </div>
              {this.state.support_confirm_opened? <SupportConfirmModal
                onOk={this.handleModalOk}
                onClose={this.handleModalCancel}
                opened={this.state.support_confirm_opened}
                price={selected_support_price}
                contents={selected_support_contents}
              />:''}
            </div>
          </Card>
          {/*<br/>*/}
          {/*<DisplayText size="medium"><CsI18n>Or</CsI18n></DisplayText>*/}
          {/*<br/>*/}
          {/*  <Card title={CsI18n.t("Integrate to Amazon without hassle")}>*/}
          {/*    <Card.Section>*/}
          {/*        <CsI18n>This is a paying service, we integrate on your behalf your store to Amazon, satisfied or*/}
          {/*            refunded.</CsI18n><br/>*/}
          {/*        <CsI18n>We do warmly recommend you to read this page:</CsI18n><br/>*/}
          {/*        <a href="https://blog.common-services.com/post/prestashop-ean-barcodes-and-marketplaces" target="_blank"*/}
          {/*           title="Barcodes (EAN/UPC/GTIN) for Ecommerce solutions and Marketplaces">Barcodes (EAN/UPC/GTIN) or*/}
          {/*            exemptions for Ecommerce solutions and Marketplaces</a>*/}
          {/*    </Card.Section>*/}
          {/*    <Card.Section>*/}
          {/*        <div*/}
          {/*            className="calendly-inline-widget"*/}
          {/*            data-url="https://calendly.com/common-services/amazon-integration-assistance"*/}
          {/*            style={{minWidth: '320px', height: '1300px'}}/>*/}
          {/*    </Card.Section>*/}
          {/*</Card>*/}
        </div>
      </Page>
    )
  }

}

export default Support;
