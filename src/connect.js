import React from 'react'
import CsI18n from "./components/csI18n"
import {
    Icon,
    Layout,
    Page,
    Stack,
} from '@shopify/polaris';

import ListAccounts from "./layouts/accounts/manage";
import CsHelpButton from "./components/csHelpButton";
import CsVideoTutorialButton from "./components/csVideoTutorialButton";
import VideoTutorial from "./helpers/VideoTutorial";
import ShopifyContext from "./context";

class Connect extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            connected: false,
            connecting: false,
            addAccount: false
        };

        this.shopify = ShopifyContext.getShared();
        console.log(this);
    }

    componentWillMount() {
        require('./connect.css');
    }

    render() {
        let title = <CsI18n>Account</CsI18n>;
            // <Stack spacing={'tight'} >
            //     <Stack.Item><CsI18n>Account</CsI18n></Stack.Item>
            //     <Stack.Item><CsHelpButton page={"Connect"} tag={"connect"}/>
            //     </Stack.Item><Stack.Item><CsVideoTutorialButton url={VideoTutorial.connect}/></Stack.Item>
            // </Stack>;

        return (
            <Page fullWidth>
                <div className={"cs-layout"}>
                    <Layout>
                        <Layout.AnnotatedSection
                            title={title}
                            description={CsI18n.t("Manage your Amazon accounts")}

                        >
                            <ListAccounts shopContext={this.shopify} />
                        </Layout.AnnotatedSection>
                    </Layout>
                </div>
            </Page>

        );
    }

}
export default Connect
