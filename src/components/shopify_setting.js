import React from 'react';
import dotenv from 'dotenv';

const shopify_settings = {
    dev: false,
    domain: '',
    shop_domain: '',
    store: '',
    api_url: '',
    api_key: '',
    static_content: '',
    version: '21100601',
};

class ShopifySetting {
    static shared = null;
    static getShared() {
        if ( ShopifySetting.shared == null ) {
            ShopifySetting.shared = new ShopifySetting();
        }
        return ShopifySetting.shared;
    }

    constructor() {
        let domain;
        let subdomain;

        dotenv.config();

        let shop_url;

        // if ( window.location.ancestorOrigins && window.location.ancestorOrigins.length ) {
        //     var [uriTop] = window.location.ancestorOrigins;
        //     if( uriTop != "http://localhost" ) {
        //         var [domain] = url.parse(uriTop).hostname.split('/');
        //         var [subdomain] = url.parse(uriTop).hostname.split('.');
        //     } else {
        //         subdomain = process.env.REACT_APP_DEV_STORE;
        //         domain = subdomain + ".myshopify.com";
        //     }
        // } else
        // if(window.location.search && window.location.pathname !== '/help'){
        //     let fulldomain = new URLSearchParams(decodeURIComponent(window.location.search)).get('shop');
        //
        //     if (fulldomain && fulldomain.length) {
        //         domain = fulldomain;
        //         subdomain = domain.replace('.myshopify.com', '');
        //     }
        // } else {
        //     subdomain = process.env.REACT_APP_DEV_STORE;
        //     domain = subdomain + ".myshopify.com";
        // }

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
        // console.log(shop_url);
        shop_url = new URL(shop_url);
        domain = shop_url.hostname;
        subdomain = shop_url.hostname.split('.')[0];

        this.dev = (subdomain === process.env.REACT_APP_DEV_STORE || subdomain === 'kbugstore');
        this.domain = subdomain + ".myshopify.com";
        this.shop_domain = subdomain+".myshopify.com";
        this.store = subdomain;

        this.api_url = shopify_settings.api_url;
        if( !this.api_url ) {
            this.api_url = this.dev? process.env.REACT_APP_URL_DEV_API:process.env.REACT_APP_URL_API;
        }

        this.api_key = shopify_settings.api_key;
        if( !this.api_key ) {
            this.api_key = this.dev? process.env.REACT_APP_SHOPIFY_API_KEY_DEV : process.env.REACT_APP_SHOPIFY_API_KEY;
        }

        this.static_content = shopify_settings.static_content;
        if( !this.static_content ) {
            this.static_content = this.dev? process.env.REACT_APP_URL_DEV_STATIC_CONTENT:process.env.REACT_APP_URL_STATIC_CONTENT;
        }

        this.version = shopify_settings.version;
        if( !this.version ) {
            this.version = this.dev? process.env.REACT_APP_VERSION_DEV:process.env.REACT_APP_VERSION;
        }

        if(this.dev) {
            console.log("window.location:", window.location);
            console.log('shopUrl:', new URLSearchParams(decodeURIComponent(window.location.search)).get('shop'));
            console.log("domain:", domain, "store: ", this.store);
            // console.log("shopify_setting:", this);
        }
    }
};

export default ShopifySetting;
