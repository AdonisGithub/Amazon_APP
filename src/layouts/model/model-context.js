import React from 'react';
import AmazonTab from "../../helpers/amazon-tab";
import ShopifyContext from "../../context";
import Util from "../../helpers/Util";

export const ModelContext = React.createContext();

export default class ModelTab extends AmazonTab {
    static SECTION = 'models';
    constructor(props) {
        super(props);
        this.unMounted = false;
        this.shopify = ShopifyContext.getShared();
        this.setSection(ModelTab.SECTION);
    }

    componentWillUnmount() {
        this.unMounted = true;
    }

    //Don't Remove this function. this is override AmazonTab //@kbug_190611
    componentWillReceiveProps(nextProps, nextContext) {
    }

    //Don't Remove this function. this is override AmazonTab //@kbug_190611
    componentWillMount() {
    }

    getSelectedConfigurationIndex() {
        return this.getConfigurationSelectedIndex();
    }

    getSelectedConfigurationName() {
        return this.shopify.getConfigurationSelected();
    }
}
