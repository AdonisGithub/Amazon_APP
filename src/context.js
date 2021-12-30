import React from 'react';
import ShopifyApiCall from "./functions/shopify-api-call";
import ApplicationApiCall from './functions/application-api-call';
import Util from "./helpers/Util";
import Cache from "./helpers/Cache";
// import CheckBillingApiCall from "./functions/check-billing-api-call";
import ConfigurationApiCall from "./functions/configuration-api-call";
import ShopifySetting from "./components/shopify_setting";
import ShopifyHelper from "./helpers/ShopifyHelper";
import CsI18n from "./components/csI18n";

export const DEV_MODE = {
    DEV: 'dev',
    PROD: 'prod'
};

export const TAB = {
    MAIN_TAB: 1,
    CHILD_TAB1: 2,
    CHILD_TAB2: 3,
}

export const amazon_platforms=[
    {value:'ATVPDKIKX0DER', label:'Amazon USA', iso_code: 'us', developer_id: '0736-5586-2726'},
    {value:'A2Q3Y263D00KWC', label:'Amazon Brazil', iso_code: 'br', developer_id: '0736-5586-2726'},
    {value:'A2EUQ1WTGCTBG2', label:'Amazon Canada', iso_code: 'ca', developer_id: '0736-5586-2726'},
    {value:'A1AM78C64UM0Y8', label:'Amazon Mexico', iso_code: 'mx', developer_id: '0736-5586-2726'},

    {value:'A13V1IB3VIYZZH', label:'Amazon France', iso_code: 'fr', developer_id: '0539-0209-0467'},
    {value:'A1RKKUPIHCS9HS', label:'Amazon Spain', iso_code: 'es', developer_id: '0539-0209-0467'},
    {value: 'A1PA6795UKMFR9', label: 'Amazon Germany', iso_code: 'de', developer_id: '0539-0209-0467'},
    {value:'APJ6JRA9NG5V4', label:'Amazon Italy', iso_code: 'it', developer_id: '0539-0209-0467'},
    {value:'A1F83G8C2ARO7P', label:'Amazon United Kingdom', iso_code: 'uk', developer_id: '0539-0209-0467'},
    {value:'A1805IZSGTT6HS', label:'Amazon Netherlands', iso_code: 'nl', developer_id: '0539-0209-0467'},
    {value:'A2NODRKZP88ZB9', label:'Amazon Sweden', iso_code: 'se', developer_id: '0539-0209-0467'},
    {value: 'A33AVAJ2PDY3EV', label: 'Amazon Turkey', iso_code: 'tr', developer_id: '0539-0209-0467'},
    {value: 'A2VIGQ35RCS4UG', label: 'Amazon United Arab Emirates (U.A.E.)', iso_code: 'ae', developer_id: '0539-0209-0467'},
    {value:'A21TJRUUN4KGV', label:'Amazon India', iso_code: 'in', developer_id: '0539-0209-0467'},
    {value:'A17E79C6D8DWNP', label:'Amazon Saudi Arabia', iso_code: 'sa', developer_id: '0539-0209-0467'},
    {value:'A1C3SOZRARQ6R3', label:'Amazon Poland', iso_code: 'pl', developer_id: '0539-0209-0467'},
    {value: 'ARBP9OOSHTCHU', label: 'Amazon Egypt', iso_code: 'eg', developer_id: '0539-0209-0467'},

    {value: 'A1VC38T7YXB528', label: 'Amazon Japan', iso_code: 'jp', developer_id: '8346-4310-1679'},
    {value: 'A39IBJ37TRP1C6', label: 'Amazon Australia', iso_code: 'au', developer_id: '8346-4310-1679'},
    {value: 'A19VAU5U5O7RUS', label: 'Amazon Singapore', iso_code: 'sg', developer_id: '8346-4310-1679'},
    {value: 'AAHKV2X7AFYLW', label: 'Amazon China', iso_code: 'cn', developer_id: '8346-4310-1679'}
];

export const amazon_regions = [
    {
        value: 'na',
        label: 'North America region (including Brazil, Mexico...)',
        developer_id: '0736-5586-2726',
        available: true
    },
    {value: 'eu', label: 'Europe region (including Egypt, Turkey...)', developer_id: '0539-0209-0467', available: true},
    {
        value: 'east',
        label: 'Far East region (Australia, Japan, Singapore)',
        developer_id: '8346-4310-1679',
        available: true
    }
]

const COURSE_FULL = 1;
const COURSE_LIMITED = 2;

class ShopifyContext {
    static shared = null;

    static console_log = null;
    static console_info = null;
    static console_error = null;
    static console_warn = null;

    /**
     *
     * @returns ShopifyContext
     */
    static getShared() {
        if ( ShopifyContext.shared == null ) {
            ShopifyContext.shared = new ShopifyContext();
        }
        return ShopifyContext.shared;
    }

    constructor(){

        this.store_properties = null;
        this.money_format = "{{amount}}";

        let shopify_settings = ShopifySetting.getShared();

        this.amazon_platforms = amazon_platforms;

        this.dev = shopify_settings.dev;
        this.api_url = shopify_settings.api_url;
        // this.api_url_async = shopify_settings.api_url_async;
        this.static_content = shopify_settings.static_content;
        this.version = shopify_settings.version;
        this.domain = shopify_settings.domain;
        this.shop_domain = shopify_settings.shop_domain;
        this.api_key = shopify_settings.api_key;
        this.store = shopify_settings.store;
        this.admin_store = '';
        // this.env = shopify_settings.env;
        // this.configuration = shopify_settings.configuration;
        this.lang = "en" //default value
        this.admin = false;

        // if (navigator.userAgent.match(/Olivier/)) {
        //     //this.api_url = 'https://dev2-shopify.common-services.com:3000';
        // }

        this.section_data = {};
        this.shop = '';
        this.amazon = '';           //configuration_list //@kbug_190905
        this.amazon_default = null; //configuration_default //@kbug_190905
        this.selectedConfiguration = 0;
        this.store_billing_info = null;
        this.store_tab = null;
        this.demo_mode = false;

        this.dev_mode = shopify_settings.dev? DEV_MODE.DEV : DEV_MODE.PROD;
        this.params = new URLSearchParams(window.location.search);
        let shopify_host = this.params.get('host');
        let cs_host = this.params.get('cs_host');
        if (!shopify_host) {
            shopify_host = cs_host;
        }
        if (!shopify_host && this.dev) {
            shopify_host = "a2J1Z3N0b3JlLm15c2hvcGlmeS5jb20vYWRtaW4";
        }
        this.shopify_host = shopify_host;

        this.shopify_params = [];
        for( const [key, value] of this.params.entries() ) {
            if( key == 'redirect' || key.search('param_') !== -1 ) {
                continue;
            }
            this.shopify_params.push({key, value});
        }

        this.plan_data = {};
        //console.log("context shopify_params", this.shopify_params);
    }

    isDevMode() {
        if ( this.dev_mode == DEV_MODE.DEV) {
            return true;
        }
        return false;
    }

    setDisableConsoleLog() {
        if(!ShopifyContext.console_log) {
            ShopifyContext.console_log = window['console']['log'];
            ShopifyContext.console_info = window['console']['info'];
            ShopifyContext.console_error = window['console']['error'];
            ShopifyContext.console_warn = window['console']['warn'];
        }

        if (!this.isDevMode()) {
            let nulfunc = function () {
            };
            window['console']['log'] = nulfunc;
            window['console']['info'] = nulfunc;
            // window['console']['error'] = nulfunc; //please don't disable for tracking
            window['console']['warn'] = nulfunc;
        }
    }

    setEnableConsoleLog() {
        window['console']['log'] = ShopifyContext.console_log;
        window['console']['info'] = ShopifyContext.console_info;
        window['console']['error'] = ShopifyContext.console_error;
        window['console']['warn'] = ShopifyContext.console_warn;
    }

    getCacheNs() {
        if(this.admin && this.store != this.admin_store) {
            return `admin_${this.store}`;
        } else {
            return this.store;
        }
    }

    getShopifyHost() {
        return this.shopify_host;
    }

    getStoreDomain() {
        return this.shop_domain;
    }

    getStoreName() {
        return this.store_properties? this.store_properties.name:'';
    }

    isAdminMode() {
        return (this.admin);
    }
    isDemoMode() {
        return this.demo_mode;
    }

    init_admin(store_list) {
        if (this.store_properties.hasOwnProperty('user_admin')) {
            this.admin = this.store_properties.user_admin;
        }
        if(this.admin) {
            this.admin_store = this.store;
            if (Array.isArray(store_list) && store_list.length > 0) {
                this.store_list = store_list;
            }
            this.setEnableConsoleLog();
        } else {
            this.store_list = false;
        }


        console.log('init_admin', this.store_properties, this.store_list);
    }

    init(){
        this.store_properties = Cache.getCachedStoreInfo('store_properties');
        this.store_step = Cache.getCachedStoreInfo('store_step');

        if (this.store_properties.hasOwnProperty('user_language')) {
            this.lang = this.store_properties.user_language;
        }

        this.money_format = ShopifyHelper.parseMoneyFormat(this.store_properties.money_format);

        let params = new URLSearchParams(decodeURIComponent(window.location.search));
        let locale = params.get('locale') || "";
        let lang = (locale.length > 2)? locale.slice(0, 2) : "";
        if( lang ) {
            this.lang = lang;
        }
        if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
            if (this.store == "amazon-plus-prod") {
                // this.lang = 'fr';
            }
            console.error("init", this.store, this.lang);
        }
        console.log("init", window.location.search, locale, lang);

        this.demo_mode = this.store_properties.demo_mode? true:false;
        this.store_tab = Util.getPathName();
        console.log("init: ", this.store_tab);
    }

    changeStore(newStore) {
        ShopifySetting.getShared().store = newStore;
        this.store = newStore;
        this.amazon = [];
    }

    isLimited() {
        if( this.store_properties.course_type == COURSE_LIMITED ) {
            return true;
        } else {
            return false;
        }
    }

    //load data
    initStoreData(callback) {
        let init_data = Cache.getCachedStoreInfo('init_data');
        console.log("initStoreData", init_data);

        if (init_data) {
            console.log('initStoreData from cache');
            // Cache.setSession('global', Cache.name_store_list, init_data.store_list);
            this.initConfiguration(init_data);
            this.init();
            this.init_admin(init_data.store_list);
            callback(init_data);
        } else {
            console.log('initStoreData from server');
            this.fetchStoreData(callback, true);
        }
    }

    fetchStoreData(callback, bFirst = false) {
        let params = {};
        ApplicationApiCall.get('/application/home/load_data', params, (result) => {
            console.log("fetchStoreProperties", result);
            if (result) {
                Cache.setCachedStoreInfo('init_data', result);
                this.initConfiguration(result);
                this.init();
                if(bFirst) {
                    // Cache.setSession('global', Cache.name_store_list, result.store_list);
                    this.init_admin(result.store_list);
                }
            }
            callback(result)
        });
    }

    initConfiguration(data) {
        Cache.setCachedStoreInfo('store_properties', data.shop);
        Cache.setCachedStoreInfo('store_step', {step: data.step});
        Cache.setCachedStoreInfo('welcome', data.welcome);
        Cache.setSession(this.getCacheNs(), Cache.name_configuration_list, data.settings);
        Cache.setSession(this.getCacheNs(), Cache.name_setting_status, data.configuration_workflow);


        this.amazon = data.settings;
        this.configuration_setting_status = data.configuration_workflow;
        this.setAmazonDefault(data.configuration_default);
        this.initConfigurationSelect();

        this.setPlanData(data);
    }

    isValidConfiguration(configuration) {
        if( !this.amazon ) {
            return false;
        }
        for(let i in this.amazon) {
            if(this.amazon[i].configuration == configuration)
                return true;
        }
        return false;
    }

    setAmazonDefault(configuration) {
        if( typeof(configuration) == "string" && this.isValidConfiguration(configuration) ) {
            this.amazon_default = configuration;

            // sessionStorage.setItem(this.store +'_amazon_default', param);
            Cache.setSession(this.getCacheNs(), Cache.name_configuration_default, configuration);
        }
        console.log('setAmazonDefault', this.amazon_default)
    }

    deleteConfiguration(index) {
        if( index >= this.amazon.length )
            return;
        this.amazon.splice(index, 1);
    }

    getShopConfig(params) {
        this.shop = params.shop;
        this.api_version = params.version;
        console.log('getShopConfig', params);
    }

    setStoreTab(tab){
        console.log("setStoreTab", tab);
        this.store_tab = tab;
    }

    getTab(index){
        if ( this.store_tab instanceof Array ){
            return this.store_tab[index];
        } else {
            return this.store_tab;
        }
    }

    initTabData(section, params) {
        console.log('initTabData', params)

        if (params && params.settings) {
            // let section = params.section === "groups" ? "models" : params.section ;
            this.section_data[section] = [];

            // Init tabs
            if (!this.amazon) {
                return;
            }

            // for(let key in this.amazon) {
            //     this.tabs[section][key] = [];
            // }
            for(let row of params.settings) {
                // let configuration_index = this.amazon.findIndex(function(item, index) {
                //         return params.settings[key1].configuration === item.configuration;
                // });
                // console.log('parseTabConfig: index', configuration_index);

                if (row && row.configuration) {
                    this.section_data[section][row.configuration] = row;
                }
            }
        }
        console.log(this.section_data);
    }

    redirect(cbSuccess, cbError=null) {
        let searchParams = new URLSearchParams(decodeURIComponent(window.location.search));
        let id = searchParams.get('id');
        let shop = searchParams.get('shop');
        let configuration = 'global';

        let params = {id, shop, configuration};

        ApplicationApiCall.get('/link/order/view', params
            , (json) =>{
            if(cbSuccess){
                cbSuccess(json);
            }
        }
            , (err) => {
            if(err && cbError){
                cbError(err);
            }
        })
    }

    getAppBaseUrl() {
        // return "http://localhost/click/public/test";
        return "https://" + this.domain + "/admin/apps/" + this.api_key;
    }

    getShopUrl() {
        if( this.domain.search("http") === 0 ) {
            return this.domain;
        } else {
            return "https://" + this.domain;
        }
    }

    getMoneyStringWithStoreFormat(price, fractionDigists=2) {
        if( isNaN(price) ) {
            return "";
        }

        if( price % 1 !== 0 ) {
            price = parseFloat(price).toFixed(fractionDigists);
        } else {
            price = parseInt(price);
        }
        let format = this.money_format;
        return format.replace(/{.*}/, price);
    }

    initConfigurationSelect() {
        this.setConfigurationSelectedIndex(this.getDefaultConfigurationSelectedIndex());
    }

    setConfigurationSelectedIndex(index) {
        let cache_name = Cache.makeCacheName(Cache.type_setting, 'selectedConfiguration');
        Cache.setCachedParameter(cache_name, index, Cache.CACHE_FOREVER);
    }

    getConfigurationSelectedIndex() {
        let cache_name = Cache.makeCacheName(Cache.type_setting, 'selectedConfiguration');
        let selectedConfiguration = Cache.getCachedParameter(cache_name);
        if (selectedConfiguration === null) {
            selectedConfiguration = this.getDefaultConfigurationSelectedIndex();
            this.setConfigurationSelectedIndex(selectedConfiguration);
        }
        return(selectedConfiguration);
    }

    getConfigurationSelected() {
        return this.getConfiguration(this.getConfigurationSelectedIndex());
    }

    hasAccounts() {
        return this.amazon && this.amazon.length > 0;
    }

    getConfiguration(index) {
        if( !this.amazon || this.amazon.length === 0 || this.amazon.length < index || index === null ) {
            return false;
        }
        if (this.amazon[index]) {
            return this.amazon[index].configuration;
        }
        return false;
    }

    getAccountSelected() {
        return this.getAccount(this.getConfigurationSelectedIndex());
    }

    getAccount(index) {
        if( !this.amazon || this.amazon.length === 0 || this.amazon.length < index || index === null ) {
            return false;
        }
        return this.amazon[index];
    }

    getDefaultConfigurationSelectedIndex() {
        // let currentlySelected = sessionStorage.getItem(this.shopify.store +'_amazon_selected');
        let currentlySelected = Cache.getSession(this.getCacheNs(), Cache.name_configuration_selected);
        if (currentlySelected !== null) {
            return(parseInt(currentlySelected));
        }
        for(let i = 0; i < this.amazon.length; i++) {
            if( this.amazon[i].configuration == this.amazon_default )
                return i;
        }
        return 0;
    }

    getSelectedFeatures(configuration) {
        if( !this.configuration_setting_status ) {
            return false;
        }
        for(let i in this.configuration_setting_status ) {
            if ( this.configuration_setting_status[i].configuration == configuration ) {
                return this.configuration_setting_status[i].selected_features;
            }
        }
        return false;
    }

    updateSelectedFeatures(configuration, selected_features) {
        if( !this.configuration_setting_status ) {
            this.configuration_setting_status = [];
        }
        let bFound = false;
        for(let i in this.configuration_setting_status ) {
            if ( this.configuration_setting_status[i].configuration == configuration ) {
                this.configuration_setting_status[i].selected_features = selected_features;
                bFound = true;
                break;
            }
        }

        if(!bFound) {
            this.configuration_setting_status.push({configuration: configuration, selected_features: selected_features});
        }
        return true;
    }

    //isSettingFinished
    getSettingError() {
        let configuration = this.getConfigurationSelected();
        let selected_features = this.getSelectedFeatures(configuration);
        console.log("getSettingError", selected_features);

        if( !this.configuration_setting_status ) {
            return 1;
        }
        for(let i in this.configuration_setting_status ) {
            if ( this.configuration_setting_status[i] && this.configuration_setting_status[i].configuration == configuration ) {
                if (!this.configuration_setting_status[i].hasOwnProperty('is_exist_scheduler') || !this.configuration_setting_status[i].is_exist_scheduler ) {
                    return 1;
                }

                if (!this.configuration_setting_status[i].hasOwnProperty('selected_marketplaces') || !this.configuration_setting_status[i].selected_marketplaces ) {
                    return 2;
                }

                if( !this.configuration_setting_status[i].locations) {
                    return 3;
                }

                if( !this.configuration_setting_status[i].collections) {
                    return 4;
                }
                return 0; //setting DONE
            }
        }
        return 1;
    }

    updateSettingStatus(configuration, field, status) {
        if( !this.configuration_setting_status ) {
            this.configuration_setting_status = [];
        }
        let bFound = false;
        for(let i in this.configuration_setting_status ) {
            if ( this.configuration_setting_status[i].configuration == configuration ) {
                this.configuration_setting_status[i][field] = status;
                bFound = true;
                break;
            }
        }
        if( !bFound ) {
            this.configuration_setting_status.push({configuration: configuration, [field]: status});
        }
        Cache.setSession(this.getCacheNs(), Cache.name_setting_status, this.configuration_setting_status);
        return true;
    }

    //Don't remove for product import
    isAllowedFeature(feature) {
        if( !feature || feature === 'any' ) {
            return true;
        }
        let index = this.getConfigurationSelectedIndex();
        let configuration = this.getConfiguration(index);
        if( !configuration ) {
            return false;
        }
        let selected_features = this.getSelectedFeatures(configuration);
        console.log("isAllowedFeature", feature, selected_features);
        if( selected_features && selected_features.length > 0 && selected_features.indexOf(feature) !== -1 ) {
            return true;
        }
        return false;
    }

    //Plan data
    getPlanPrice(plan_type) {
        if (plan_type == 1) {
            return 19;
        } else if(plan_type == 2) {
            return 29;
        } else if(plan_type == 3) {
            return 59;
        }
        return 0;
    }
    setPlanData(data)
    {
        let {course_type: plan_type, course_limit: plan_limit, course_count: plan_count, trial_days, plan_info: plan_info} = data;
        this.plan_data = {plan_type, plan_limit, plan_count, trial_days, plan_info};
    }

    getPlanData()
    {
        return this.plan_data;
    }

    getPlanName() {
        let {plan_type} = this.plan_data;
        switch(parseInt(plan_type)) {
            case 0:
                return CsI18n.t('No plan');
            case 10:
                return CsI18n.t('Free plan');
            case 1:
                return CsI18n.t('19$ Basic');
            case 2:
                return CsI18n.t('29$ Advanced');
            case 3:
                return CsI18n.t('59$ Shopify pro or greater than Basic');
        }
    }

    isAllowByPlan(tab) {
        if (!tab) {
            return true;
        }
        if (!tab.hasOwnProperty('allowed_plan')) {
            return true;
        }

        let {plan_type} = this.plan_data;
        if (plan_type == 10) {
            plan_type = 0;
        }
        if (plan_type >= tab.allowed_plan) {
            return true;
        }
        return false;
    }

    // let marketplace_config_index = this.amazon.findIndex(function(item) {
    //     return params.configurations[key] === item.configuration;
    // });
    // TODO: change key=marketplace index

};

export default ShopifyContext
