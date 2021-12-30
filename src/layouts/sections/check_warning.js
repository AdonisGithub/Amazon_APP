import React from 'react';
import {
  Banner,
  List, Toast
} from '@shopify/polaris';
import CsI18n from "../../components/csI18n";
import ApplicationApiCall from "../../functions/application-api-call";
import Cache from "../../helpers/Cache";

export default class CheckWarning extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      warning: '',
    };
    this.checkAmazonChannel();
  }

  checkAmazonChannel() {
    //deprecated!
    // ApplicationApiCall.get('/application/home/check_channel', [], (result) => {
    //   console.log("checkAmazonChannel", result);
    //   let error_message = result.is_exist_amazon_channel? CsI18n.t('Amazon Sales Channel App is installed, it might consume API quota and create malfunctions with this App'):'';
    //   this.setState({warning: error_message});
    // });
  }

  render() {
    if(!this.state.warning) {
      return '';
    }
    return <Toast content={this.state.warning} error={false} duration={60000} onDismiss={()=>{this.setState({warning: ''})} } />;
  }
}
