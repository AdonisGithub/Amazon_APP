import ShopifyContext from "../context";
import React from 'react';
import dotenv from "dotenv";
import ls from "../components/csLocalStorage/csLocalStorage";
// import ls from "local-storage";

export default class Cache {
    //Session Storage values
    static name_configuration_selected  = 'cfg_sel';
    static name_configuration_default   = 'cfg_default';
    static name_store_list              = 'store_list';
    static name_configuration_list      = 'configuration_list';
    static name_features                = 'features';
    static name_setting_status                  = 'setting_status';

    //Local Storage type
    //format: [AppName]_[StoreName]_[configuration|GLOBAL]_[type]_[name]
    static type_setting   = 'setting';
    static type_info      = 'info';
    static type_store     = 'store_info';
    static type_page      = 'page';
    static type_file_version = 'file_version';
    static type_last_setting_date = 'last_setting_date';

    static ns_session = "s_";

    static CACHE_FOREVER = -1;
    static _appName = null;

    static ignoreCache()
    {
        let shopify = ShopifyContext.getShared();

        if (!shopify.hasOwnProperty('api_version') || !parseInt(shopify.api_version)) {
            return(false);
        }

        let api_version = parseInt(shopify.api_version);
        let app_version = parseInt(shopify.version);

        if (api_version !== app_version) {
            console.log('%cApp version and API version differs, ignoring cached parameters', 'color:orange');

            return(true);
        } else {
            return(false);
        }
    }

    static get_app_domain_prefix() {
        if( this._appName === null ) {
            dotenv.config();
            this._appName = process.env.REACT_APP_APP_NAME? process.env.REACT_APP_APP_NAME:'';
        }
        return this._appName + '_';
    }

    static _makeKey(ns, name, is_session = false) {
        return Cache.get_app_domain_prefix() + (is_session? Cache.ns_session:'') + ns +'_'+name;
    }

    static _makeCacheKey(name) {
        const shopify = ShopifyContext.getShared();
        return Cache._makeKey(shopify.getCacheNs(),  name);
    }

    static makeCacheName(type, name, configuration = 'GLOBAL') {
        return `${configuration}_${type}_${name}`;
    }

    static getCachedStoreInfo(name) {
        const cache_name = this.makeCacheName(this.type_store, name);
        return this.getCachedParameter(cache_name);
    }

    static setCachedStoreInfo(name, data, expires = 1000000) {
        const cache_name = this.makeCacheName(this.type_store, name);
        this.setCachedParameter(cache_name, data, expires);
    }

    static removeCachedStoreInfo(name) {
        const cache_name = this.makeCacheName(this.type_store, name);
        this.removeCachedParameter(cache_name);
    }

    static removeCachedGlobal(type) {
        this.removeCachedAll(type, 'GLOBAL');
    }

    static removeCachedAll(type, configuration) {
        console.log('removeCachedAll', type, configuration);
        const cache_key = Cache._makeCacheKey(this.makeCacheName(type, "", configuration));
        Cache.removeByNS(cache_key);
    }

    static removeByNS(ns) {
        let backend = ls.backend();
        let found = [];
        for(let key in backend) {
            if( key.search(ns) === 0) {
                found.push(key);
            }
        }
        for(let key of found) {
            ls.remove(key);
        }
    }

    static getCachedParameter(name) {
        const now = new Date().valueOf();
        const cache_name = Cache._makeCacheKey(name);
        const parameters = ls.get(cache_name);

        // console.log('getCachedParameter', cache_name, parameters);
        if (!Cache.ignoreCache() && parameters !== null && (parameters.expires === Cache.CACHE_FOREVER || now < parameters.expires) ) {
            // console.log(cache_name, parameters.value);
            return(parameters.value);
        } else {
            return(null);
        }
    }

    static setCachedParameter(name, data, expires = 1000000)
    {
        const cache_name = Cache._makeCacheKey(name);
        let parameters = {};
        parameters.value = data;
        if( expires === Cache.CACHE_FOREVER ) {
            parameters.expires = Cache.CACHE_FOREVER;
        } else {
            parameters.expires = new Date().valueOf()+expires;
        }

        let result = ls.set(cache_name, parameters);
        // console.log('setCachedParameter', parameters, result)

        return(result);
    }

    static removeCachedParameter(name) {
        const cache_name = Cache._makeCacheKey(name);
        ls.remove(cache_name);
    }

    static getSession(ns, name) {
        let key = Cache._makeKey(ns, name, true);
        let now = new Date().valueOf();
        let parameters = ls.get(key);
        // console.log('getSession', key, parameters);
        if ( typeof(parameters) === 'string' && parameters ) {
            try {
                parameters = JSON.parse(parameters);
            } catch (e) {
                parameters = null;
            }
        }

        // console.log('getSession', key, parameters);
        if ( !Cache.ignoreCache() && typeof(parameters) === "object" && parameters !== null && parameters.value !== undefined && parameters.expires !== undefined && now < parameters.expires) {
            // console.log(parameters.value);
            return(parameters.value);
        } else {
            return (null);
        }
    }

    static setSession(ns, name, data, expires=86400000) {
        let key = Cache._makeKey(ns, name, true);
        let s_data = {};
        s_data.value = data;
        s_data.expires = new Date().valueOf()+expires;
        // console.log("setSession", key, s_data);
        ls.set(key, JSON.stringify(s_data));
    }

    static removeSession(ns, name) {
        let key = Cache._makeKey(ns, name, true);
        ls.remove(key);
    }

    static clearSessionByNs(ns) {
        let cache_key = Cache._makeKey(ns, "", true);
        Cache.removeByNS(cache_key);
    }

    static onDeleteConfiguration() {

    }

    static getCachedFileVersion() {
        return ls.get(Cache._makeKey('version', Cache.type_file_version));
    }

    static setFileVersion(version) {
        return ls.set(Cache._makeKey('version', Cache.type_file_version), version);
    }

    static clearAppCache() {
        let ns = Cache.get_app_domain_prefix();
        Cache.removeByNS(ns);
    }

    static clearAll() {
        ls.clear();
        // sessionStorage.clear();
    }

    static getCachedLastSettingDate() {
        return ls.get(Cache._makeKey('version', Cache.type_last_setting_date));
    }

    static setLastSettingDate(date) {
        return ls.set(Cache._makeKey('version', Cache.type_last_setting_date), date);
    }

}
