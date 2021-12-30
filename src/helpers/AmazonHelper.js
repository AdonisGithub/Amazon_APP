import React from 'react';
import ShopifyContext from "../context";

export default class AmazonHelper {
    static getMarketplaceOptions(marketplaces) {
        let shopify = ShopifyContext.getShared();
        let options = [];
        for(let item of shopify.amazon_platforms) {
            if( marketplaces.indexOf(item.value) !== -1 ) {
                options.push({value: item.value, label: item.label});
            }
        }
        return options;
    }

    static getMarketplaceName(marketplace) {
        let shopify = ShopifyContext.getShared();
        for(let item of shopify.amazon_platforms) {
            if( marketplace == item.value ) {
                return item.label;
            }
        }
        return '';
    }

    static getProductPage(domain, asin) {
        return 'https://' + domain + '/dp/' + asin;
    }
}
