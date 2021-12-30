import React from 'react';
import CsI18n from "./../components/csI18n";
import {
    AppProvider,
    Banner,
    Card,
    Page,
    TextStyle,
  Layout

} from '@shopify/polaris';
import ShopifyContext from "../context";

class FeatureLimited extends React.Component {
    render(){
      let plan_name = ShopifyContext.getShared().getPlanName();
      return(
        <div style={{padding: '2rem', width: '100%'}}>
          <Banner status="critical" title={CsI18n.t("This feature is not available on {{plan_name}}", {plan_name})}>
              <TextStyle variation="negative"><CsI18n>Please upgrade the plan on Connect tab</CsI18n></TextStyle>
          </Banner>
        </div>
      );
    }
}
export default FeatureLimited;
