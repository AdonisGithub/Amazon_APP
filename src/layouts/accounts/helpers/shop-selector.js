import React from "react";
import CsI18n from "./../../../components/csI18n"

import AmazonTab from './../../../helpers/amazon-tab';
import {Layout, Card, Select, Stack, Icon, Popover, ChoiceList, Button, Autocomplete} from "@shopify/polaris";
import {CaretDownMinor, SearchMinor} from '@shopify/polaris-icons';
import {CsSelectorSvg} from '../../../resource/cs-selector.js'
import ShopifyContext from "../../../context";


class ShopSelector extends AmazonTab {
    //add for debug
    getName() {
        return "ShopSelector";
    }

    state = {
        ...this.state,
        selected: null,
        active: false,
        inputText: '',
        stores: null,
        filtered_stores: null,
    }

    constructor(props) {
        super(props);
        this.shopify = ShopifyContext.getShared();
        this.state.selected = this.shopify.store;
        this.state.inputText = this.shopify.store;

        let stores = [];
        if (this.shopify.store_list) {
            let display_color = {color: 'grey'};
            let stores_list = this.shopify.store_list;

            stores = this.shopify.store_list.map((store) => {
                if (store && store.hasOwnProperty('valid') && parseInt(store.valid) === 1) {

                    if (stores_list) {
                        let plan = store.shopify_plan;
                        let display_color = 'grey';
                        let store_display_text = store.store;

                        if (store && store.hasOwnProperty('valid') && parseInt(store.valid) === 1) {
                            switch (plan) {
                                case 'partner_test':
                                case 'affiliate':
                                    display_color = 'lightgrey';
                                case 'basic':
                                    display_color = 'darkgreen'
                                    break;
                                case 'professional':
                                    display_color = 'darkblue'
                                    break;
                                case 'shopify_plus':
                                case 'unlimited':
                                    display_color = 'darkorange'
                                    break;
                                default:
                                    if (store.hasOwnProperty('course_type') && parseInt(store.course_type)) {
                                        plan = 'unknown';
                                        display_color = 'darkgreen';
                                    } else {
                                        plan = 'default';
                                        display_color = 'darkgrey';
                                    }
                                    break;
                            }

                            store_display_text =
                                <span className='plan-test'
                                      style={{color: display_color}}>{store.store} ({store.id})</span>;

                            return {value: store.store, label: store_display_text, value_ex: `${store.store} (${store.id})`}
                        }
                    }

                }

                console.log('Stores:', stores, this.state.store);
            });

        }
        stores.sort((a, b) => {
            return a.value > b.value ? 1 : -1;
        });
        this.stores = stores;
        this.state.filtered_stores = this.filterStores(this.state.inputText);
        require("./helper.scss");
    }

    togglePopover = () => {
        this.setState(({active}) => ({active: !active}));
    }

    handleChange = newValue => {
        console.log('Selected Marketplace', newValue);
        this.shopify.changeStore(newValue[0]);
        this.props.onChange();

        this.setState({selected: newValue, active: false});
    };

    render() {
        console.log(this.state)

        return (
            <div className={"store-selector"}>
            {this.shopSelector()}
            </div>
        );
    }

    updateText = (newValue) => {
        this.filterAndUpdateStores(newValue);
    };

    onBlueText = () => {
        this.filterAndUpdateStores(this.state.inputText);
    }

    filterStores(inputString) {
        const filterRegex = new RegExp(inputString, 'i');
        return this.stores.filter((store) =>
            store.value_ex.match(filterRegex),
        );
    }

    filterAndUpdateStores = (inputString) => {
        console.log("filterAndUpdateStores", inputString);
        if (inputString === '' || inputString.length < 2) {
            this.setState({
                filtered_stores: [],
                inputText: inputString
            });
            return;
        }

        this.setState({
            filtered_stores: this.filterStores(inputString),
            inputText: inputString
        });
    };

    shopSelector() {

        return (<Autocomplete
            className='store-selector-autocomplete'
            options={this.state.filtered_stores}
            selected={this.state.selected}
            textField={
                <Autocomplete.TextField
                    onChange={this.updateText}
                    onBlur={this.onBlueText}
                    label=""
                    labelHidden={true}
                    prefix={<Icon source={SearchMinor} color="inkLighter"/>}
                    value={this.state.inputText/*this.state.selected_id ? this.state.inputText + ' (' + this.state.selected_id + ')' : this.state.inputText*/}
                />
            }
            onSelect={this.handleChange}
        />);
    }
}
export default ShopSelector;
