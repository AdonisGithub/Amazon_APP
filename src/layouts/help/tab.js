import React from 'react'
import CsI18n from "./../../components/csI18n"

import Markdown from 'react-markdown';

import {
    Card,
    Collapsible,
    Heading,
    Icon,
    Link,
    Page,
    Stack,
    Spinner,
} from '@shopify/polaris';

import Support from "./support";
import CsHelpCenter from "../../components/csHelpCenter";
import ShopifyContext from "../../context";
import ShopifyHelper from "../../helpers/ShopifyHelper";

class HelpTab extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            lang: 'en',
            page_param: '',
        }
        this.state.page_param = this.props.page_param;
        this.state.page = this.props.page;
        this.state.lang = this.props.lang;
        this.state.section = this.props.section;
        let shopifyContext = ShopifyContext.getShared();
        this.is_admin = shopifyContext.admin;
        this.store_url = ShopifyHelper.getStoreAdminUrl(shopifyContext.store);
        console.log("domain", this.store_url);
    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.setState({page_param: nextProps.page_param, page: nextProps.page, lang: nextProps.lang, section: nextProps.section});
    }

    render() {
        return (
            <Page>
                {this.state.page === 'support'? (<Support/>):(<CsHelpCenter page={this.state.page} page_param={this.state.page_param}
                                                                            lang={this.state.lang} section={this.state.section} store_url={this.store_url} show_copy={this.is_admin}/>)}
            </Page>
        );
    }
}

export default HelpTab;
