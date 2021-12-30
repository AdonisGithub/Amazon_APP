import React from 'react';
import BaseApiCall from "./base-api-call";

export default class ShopifyApiCall extends BaseApiCall {
    static API_PATH = '/shopify/';

    static onResponse(json, cbSuccess, cbError, devTest) {
        cbSuccess(json);
    }
}
