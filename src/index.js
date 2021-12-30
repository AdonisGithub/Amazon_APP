import React from 'react';
import ReactDOM from 'react-dom';
import * as Sentry from "@sentry/react";
import {Integrations} from "@sentry/tracing";
import {
    AppProvider,
    Frame,
} from '@shopify/polaris';
import dotenv from 'dotenv';
import '@shopify/polaris/styles.css';
import CsSkeletonLoading from "./components/csSkeletonLoading";

import {Provider} from '@shopify/app-bridge-react';

const file_version = "21100601";

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {

    // Sentry.init({
    //     dsn: "https://de0a1315ad28472aadc259fc1cb3de08@o468350.ingest.sentry.io/5738885",
    //     integrations: [new Integrations.BrowserTracing()],
    //
    //     // Set tracesSampleRate to 1.0 to capture 100%
    //     // of transactions for performance monitoring.
    //     // We recommend adjusting this value in production
    //     tracesSampleRate: 1.0,
    //     release: "amazon-app@" + file_version,
    //     environment: "development",
    // });
    console.log('Sentry is disabled in development');
    // console.log('Start Sentry in development')

} else {

    Sentry.init({
        dsn: "https://de0a1315ad28472aadc259fc1cb3de08@o468350.ingest.sentry.io/5738885",
        integrations: [new Integrations.BrowserTracing()],

        // Set tracesSampleRate to 1.0 to capture 100%
        // of transactions for performance monitoring.
        // We recommend adjusting this value in production
        tracesSampleRate: 1.0,
        release: "amazon-app@" + file_version,
        environment: "production",
    });
    console.log('Start Sentry in production')
}




class Loader extends React.Component{

    state = {
        wait : true,
        AmazonApp: null,
    }

    constructor(props) {
        super(props);
        import('./AmazonApp').then(({ default: AmazonApp }) => {
            this.setState({
                AmazonApp,
                wait: false
            });
        });

        dotenv.config();
        let shop_url;
        if( process.env.REACT_APP_MODE && process.env.REACT_APP_MODE === 'local') {
            shop_url = "https://" + process.env.REACT_APP_DEV_STORE + ".myshopify.com";
        } else {
            if (window.location.ancestorOrigins && window.location.ancestorOrigins.length) {
                shop_url = new URL(window.location.ancestorOrigins[0]).origin;
            } else {
                shop_url = new URLSearchParams(decodeURIComponent(window.location.search)).get('shop');
            }
        }


        if( shop_url.search("https://") !== 0 ) {
            shop_url = "https://" + shop_url;
        }
        shop_url = new URL(shop_url);
        let subdomain = shop_url.hostname.split('.')[0];
        let isDev = (subdomain === process.env.REACT_APP_DEV_STORE || subdomain === 'kbugstore');
        this.domain = subdomain + ".myshopify.com";
        this.api_key = isDev? process.env.REACT_APP_SHOPIFY_API_KEY_DEV : process.env.REACT_APP_SHOPIFY_API_KEY;

        let params = new URLSearchParams(window.location.search);
        let shopify_host = params.get('host');
        let cs_host = params.get('cs_host');
        if (!shopify_host) {
            shopify_host = cs_host;
        }
        if (!shopify_host && isDev) {
            shopify_host = "a2J1Z3N0b3JlLm15c2hvcGlmeS5jb20vYWRtaW4";
        }
        this.shopify_host = shopify_host;
    }

    componentWillMount() {
    }

    componentDidMount() {
        let loader = document.getElementById('CsLoadingBar');
        if( loader ) {
            loader.style.display = "none";
        }
    }

    handleLoaded = () => {
        this.setState({wait: false});
    }

    render() {
        const config={ apiKey: this.api_key, shopOrigin: this.domain, host: this.shopify_host };
        const { AmazonApp, wait } = this.state;

        return (<Provider config={config}>
            {wait?
            <AppProvider>
                <Frame>
                    <CsSkeletonLoading/>
                </Frame>
            </AppProvider>:''}
            {AmazonApp && <AmazonApp onLoaded={this.handleLoaded} showloading={wait? false:true}/>}
        </Provider>);
    }
}

ReactDOM.render(<Loader />, document.getElementById('root'));
