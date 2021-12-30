import React from 'react'
import Context from "../context";
import ShopifyApiCall from './../functions/shopify-api-call';
import Util from "./Util";
import Cache from "./Cache";
import ApplicationApiCall from "../functions/application-api-call";

class AmazonTab extends React.Component {

    //add for debug
    getName() {
        return "AmazonTab";
    }
    constructor(props) {
        super(props);
        this.shopify = Context.getShared();
        this.defaults = [];
        let selectedConfiguration = this.getConfigurationSelectedIndex();

        this.state = {
            selectedTab:0,
            selectedConfiguration:selectedConfiguration,
            configuration: "",
            saving: false,
            saved: false,
            data: null,
        };
        this.selectedConfiguration = selectedConfiguration;
        this.unMounted = false;
        this.section = null;
        console.log("[AmazonTab:constructor]", this.props)
    }

    //added by @kbug 2019-01-23
    checkConfig() {
        return true;
    }

    componentWillMount() {
        this.configurationLoad();
    }

    componentWillUnmount() {
        this.unMounted = true;
    }

    //added by @kbug 2019-01-25
    isDataInit(config) {
        return true;
    }

    setSection(section) {
        this.section = section;
    }

    componentWillReceiveProps(nextProps) {
        // console.log(this.getName() + " componentWillReceiveProps", nextProps);
        //
        // if (typeof nextProps.config == "object" && nextProps.config.data !== this.props.config.data) {
        //     if (Object.keys(nextProps.config.data).length === 0) {
        //         console.log(" Data is Null ");
        //         this.setState({data: Util.clone(this.defaults)});
        //     } else {
        //         console.log(nextProps.config.data);
        //         this.setState({data: nextProps.config.data});
        //     }
        // }
        this.configurationLoad();
    }

    configurationInitAll() {
        console.log(this.getName(), "configurationInitAll");
        if (!this.shopify.amazon) {
            return;
        }
        for (let row of this.shopify.amazon) {
            this.configurationInit(row.configuration);
        }
    }

    configurationInit(configuration) {
        if (!this.section) {
            return;
        }
        let section = this.section;
        let initial_config = this.shopify.section_data[section][configuration] ?? {};

        let defaults = Util.clone(this.defaults);
        this.shopify.section_data[section][configuration] = {...defaults,...initial_config};
    }

    configurationLoad()
    {
        if (!this.section) {
            return;
        }
        let config = this.configurationGetCurrent(); // configuration from localstorage
        let defaults = Util.clone(this.defaults);
        console.log(this.getName(), "configurationLoad", defaults, config)
        this.state.data = {...defaults, ...config};

        this.setState({refresh:1});
    }

    configurationUpdate(configuration, data) {
        if (!this.section || !configuration || !this.shopify.section_data[this.section]) {
            return;
        }
        this.shopify.section_data[this.section][configuration] = data;
    }

    configurationGet(configuration) {
        if (!this.section || !configuration || !this.shopify.section_data[this.section]) {
            return {};
        }
        return this.shopify.section_data[this.section][configuration] ?? {};
    }

    configurationUpdateCurrent(data) {
        let selectedConfiguration = this.shopify.getConfigurationSelected();
        if (!this.section || !selectedConfiguration || !this.shopify.section_data[this.section]) {
            return;
        }
        this.shopify.section_data[this.section][selectedConfiguration] = data;
    }

    configurationGetCurrent() {
        let selectedConfiguration = this.shopify.getConfigurationSelected();
        if (!this.section || !selectedConfiguration || !this.shopify.section_data[this.section]) {
            return {};
        }

        return this.shopify.section_data[this.section][selectedConfiguration] ?? {};
    }

    setConfigurationSelectedIndex(index) {
        this.shopify.setConfigurationSelectedIndex(index);
    }

    getConfigurationSelectedIndex() {
        return this.shopify.getConfigurationSelectedIndex();
    }

    //@kbug_190218
    getConfigurationForCache(index) {
        const shopify = Context.getShared();
        // console.log(index, shopify.amazon.length);
        if( index >= shopify.amazon.length ) {
            console.error(this.getName(), "getConfigurationForCache, index error ", index, shopify.amazon.length);
        }
        if ( !shopify.amazon[index] ) {

            console.error(this.getName(), "getConfigurationForCache, index error ", index, shopify.amazon);
            return "";
        }
        return shopify.amazon[index].configuration? shopify.amazon[index].configuration : shopify.amazon[index].name;
    }

    //added namespace @kbug_190219
    getCachedSetting(name) {
        const cache_name = Cache.makeCacheName(Cache.type_setting, name, this.getConfigurationForCache(this.getConfigurationSelectedIndex()));
        return Cache.getCachedParameter(cache_name);
    }

    setCachedSetting(name, data, expires = 3600000) {
        const cache_name = Cache.makeCacheName(Cache.type_setting, name, this.getConfigurationForCache(this.getConfigurationSelectedIndex()));
        return Cache.setCachedParameter(cache_name, data, expires);
    }

    removeCachedSetting(name) {
        const cache_name = Cache.makeCacheName(Cache.type_setting, name, this.getConfigurationForCache(this.getConfigurationSelectedIndex()));
        Cache.removeCachedParameter(cache_name);
    }

    removeCachedAllSetting() {
        Cache.removeCachedAll(Cache.type_setting, this.getConfigurationForCache(this.getConfigurationSelectedIndex()));
        Cache.removeCachedStoreInfo('init_data');
    }

    fetchLocationsListing(callback, pending = false) {
        var now = new Date().valueOf();
        var locations_listing = Cache.getCachedStoreInfo('locations_listing')

        if (locations_listing !== null) {

            callback(locations_listing);
        } else if (pending) {

            setTimeout(() => {
                this.fetchLocationsListing(callback, true)
            }, 1000);
        } else {
            ShopifyApiCall.get('locations/get', {}, this.fetchLocationsListingCallback.bind(this));
            setTimeout(() => {
                this.fetchLocationsListing(callback, true)
            }, 1000);
        }
    }

    fetchLocationsListingCallback(result) {
        if (result instanceof Object && result.hasOwnProperty('locations') && result.locations !== null) {
            Cache.setCachedStoreInfo('locations_listing', result.locations);
        }
    }

    fetchCollectionsListing(callback, pending = false) {
        var now = new Date().valueOf();
        var shop_collections = Cache.getCachedStoreInfo('shop_collections');

        if (shop_collections !== null) {
            callback(shop_collections);
        } else if (pending) {
            setTimeout(() => {
                this.fetchCollectionsListing(callback, true)
            }, 1000);
        } else {
            ShopifyApiCall.get('collections/get', {},  this.fetchCollectionsListingCallback.bind(this));

            setTimeout(() => {
                this.fetchCollectionsListing(callback, true)
            }, 1000);
        }
    }
    fetchCollectionsListingCallback(result) {

        if (result instanceof Object && result.hasOwnProperty('shop_collections')) {
            result.shop_collections.sort((a, b) => {
                let labelA = (typeof a.title === 'string')? a.title.toLowerCase():"";
                let labelB = (typeof b.title === 'string')? b.title.toLowerCase():"";
                if( labelA === labelB ) {
                    return 0;
                } else if ( labelA > labelB ) {
                    return 1;
                } else {
                    return -1;
                }
            });

            Cache.setCachedStoreInfo('shop_collections', result.shop_collections)
        }
    }

    saveState = () => {
        this.configurationUpdateCurrent(this.state.data);
    }

    valueUpdater(target_field) {
        return value => {
            // let configurationData={...this.defaults,...this.configurationGetCurrent()};

            // Ensure we cleanup the target field to prevent to save old configuration (case of arrays)
            // configurationData[target_field] = null;

            this.setState(prevState => {
                return {
                    data: {
                        // ...this.defaults,
                        ...prevState.data,
                        [target_field]: value
                    }
                }
            }, this.saveState);
        }
    }

    getActiveMarketplaceList(marketplaceList) {
        let result = marketplaceList.filter( item => {
            if( item.Filtered )
                return false;
            return true;
        });
        return result;
    }

    fetchMarketplaceList( cbSuccess, cbError){
        let marketplaceList = this.getCachedSetting('marketplace_parameters');
        console.log('%cfetchMarketplaceList', 'color:green', marketplaceList);

        if( !marketplaceList || marketplaceList.length === 0 ) {
            let params = {
                configuration: this.shopify.getConfigurationSelected()
            };
            ApplicationApiCall.get('/application/parameters/marketplaces', params,
                (json) => {
                    marketplaceList = json && json.length > 0 ? json : [];
                    this.setCachedSetting('marketplace_parameters', marketplaceList);
                    cbSuccess(marketplaceList);
                },
                cbError
            );
            return false;
        } else {
            cbSuccess(marketplaceList);
            return true;
        }
    }

    fetchRulesParameters(cbSuccess, cbError) {
        let rules_parameters = this.getCachedSetting('rules_parameters');
        if( rules_parameters === null ){
            let params = {
                configuration: this.shopify.getConfigurationSelected()
            };

            ApplicationApiCall.get('/application/rules/parameters', params,
                (result) => {
                    rules_parameters = result;
                    let rule_fields = ['collections', 'order_tags', 'product_types', 'tags', 'vendors', 'carriers', 'shipping_groups', 'tax_categories'];
                    console.log("rules_parameters", rules_parameters);
                    for(let field of rule_fields) {
                        if( !rules_parameters[field] || !Array.isArray(rules_parameters[field]) ) {
                            console.log("rules_parameters: field is not array", field);
                            continue;
                        }
                        rules_parameters[field].sort((a, b) => {
                            let a_priority = 0;
                            let b_priority = 0;
                            if(field == 'taxes' || field == 'tax_categories') {
                                switch(a.value) {
                                    case 'A_GEN_NOTAX':
                                    case 'none':
                                        a_priority = 4;
                                        break;
                                    case 'none_shipping':
                                        a_priority = 3;
                                        break;
                                    case 'A_GEN_TAX':
                                    case 'A_GEN_STANDARD':
                                        a_priority = 2;
                                        break;
                                    default:
                                        a_priority = 0;
                                }
                                switch(b.value) {
                                    case 'A_GEN_NOTAX':
                                    case 'none':
                                        b_priority = 4;
                                        break;
                                    case 'none_shipping':
                                        b_priority = 3;
                                        break;
                                    case 'A_GEN_TAX':
                                    case 'A_GEN_STANDARD':
                                        b_priority = 2;
                                        break;
                                    default:
                                        b_priority = 0;
                                }
                            }
                            if(a_priority > b_priority) {
                                return -1;
                            } else if(a_priority < b_priority) {
                                return 1;
                            }

                            let labelA = (typeof a.label === 'string')? a.label.toLowerCase():"";
                            let labelB = (typeof b.label === 'string')? b.label.toLowerCase():"";
                            if( labelA === labelB ) {
                                return 0;
                            } else if ( labelA > labelB ) {
                                return 1;
                            } else {
                                return -1;
                            }
                        });
                    }
                    if( rules_parameters.amazon_inventory_loaded !== 0 && rules_parameters.shopify_inventory_loaded !== 0 && rules_parameters.collections && rules_parameters.collections.length ) {
                        this.setCachedSetting('rules_parameters', rules_parameters);
                    }
                    cbSuccess(rules_parameters);
                },
                cbError
            );
            return false;
        }else{
            cbSuccess(rules_parameters)
            return true;
        }

    }
}

export default AmazonTab;
