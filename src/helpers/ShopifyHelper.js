import React from 'react';
import Util from "./Util";

export default class ShopifyHelper {

    static getProductVariantPage(domain, product_id, variant_id) {
        return `https://${domain}/admin/products/${product_id}/variants/${variant_id}`;
    }

    static getProductPage(domain, product_id) {
        return 'https://' + domain + '/admin/products/' + product_id;
    }

    static getStoreAdminUrl(store) {
        return 'https://' + store + '.myshopify.com/admin';
    }

    static parseMoneyFormat(money_format) {
        let format = money_format;
        // let format = "<span class=money>&pound;{{amount}}</span>";
        try {
            format = format.replace(/<[^>]*>?/gm, '');
            format = Util.decodeHtmlEntities(format);
        } catch (e) {
            console.error("parseMoneyFormat", e);
        }
        return format;
    }
}
