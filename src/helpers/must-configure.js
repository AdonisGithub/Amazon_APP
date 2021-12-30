import React from 'react';
import CsI18n from "./../components/csI18n";
import {
    AppProvider,
    Banner,
    Card,
    Page,
    TextStyle

} from '@shopify/polaris';

import ShopifyContext from "../context";
import Util from "./Util";

function checkGlobalConfig() {
    this.shopify = ShopifyContext.getShared();
    //let pathname = window.location.pathname.replace(/\/welcome\/[0-9]/, '/welcome');
    let pathname = this.shopify.store_tab;
    console.log("checkGlobalConfig", pathname);
    if (Array.isArray(pathname) && pathname.length >= 2) {
        pathname = pathname[1];
    }

    switch(pathname)
    {
        case 'connect':
        case 'welcome':
        case 'help':
                return true;

    }

    if ( this.shopify.amazon && this.shopify.amazon.length > 0) {
        return true;
    }

    return false;
}

class MustConfigure extends React.Component {
    static checkGlobalConfig = checkGlobalConfig;
    constructor(props) {
        super(props);

        this.shopify = ShopifyContext.getShared();
    }
    render(){
        return(

          <Page>
              <Card>
                  <Banner status="critical" title={CsI18n.t("Missing configuration")}>
                      <TextStyle variation="negative"><CsI18n>Please configure your connector</CsI18n></TextStyle>
                  </Banner>
              </Card>
          </Page>
        );
    }
}
export default MustConfigure;
