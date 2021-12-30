import React from "react";
import CsI18n from "./../../../components/csI18n"

import AmazonTab from './../../../helpers/amazon-tab';
import {Layout, Card, Select, Stack, Icon, Popover, ChoiceList, Button} from "@shopify/polaris";

import {CaretDownMinor} from '@shopify/polaris-icons';
import {CsSelectorSvg} from '../../../resource/cs-selector.js'
import Util from '../../../helpers/Util';
import Cache from '../../../helpers/Cache';
import ShopifyContext from "../../../context";
class AccountSelector extends AmazonTab {
  //add for debug
  getName() {
    return "AccountSelector";
  }

  state = {
      ...this.state,
    selected: null,
    active: false,
  }

  constructor(props) {
    super(props);
    this.shopify = ShopifyContext.getShared();;
    this.state.selected = this.shopify.getConfigurationSelectedIndex();
    this.state.active = false;
    // console.log(this.shopify, this.state);
  }

  componentWillReceiveProps(nextProps) {
    let selectedIndex = this.shopify.getConfigurationSelectedIndex();
    this.setState({selected: selectedIndex, active: false});
  }

  togglePopover = () => {
    this.setState(({active}) => ({active: !active}));
  }

  changeConfiguration(selected) {
    console.log("changeConfiguration", selected, this.state.selectedConfiguration);
    let selectedConfiguration = parseInt(selected);

    if (this.shopify.amazon[selectedConfiguration] === undefined) {
      this.setState({selectedConfiguration: -1});
      return;
    }

    this.shopify.setConfigurationSelectedIndex(selectedConfiguration);

    this.setState({selectedConfiguration: selectedConfiguration});
  }

  handleChangeConfiguration = newValue => {
    console.log('handleChange', newValue);

    // sessionStorage.setItem(this.shopify.store+'_amazon_selected', newValue[0]);
    Cache.setSession(this.shopify.getCacheNs(), Cache.name_configuration_selected, newValue[0]);
    this.setState({ selected: newValue[0]});
    this.changeConfiguration(newValue[0])
    this.props.onChange();
    this.togglePopover();
  };

  render() {
    console.log(this.state);
      return (
        <div>
          {this.renderAccountSelector()}
        </div>
      );
  }

  renderAccountSelector() {
    let options = [];

    let name = '';
    const selected = this.state.selected;

    // Return the default one (selected in connect tab)
    for (var index in this.shopify.amazon) {
      options.push({ value: index.toString(), label: this.shopify.amazon[index].name});
    }

    if (this.shopify.amazon[selected] !== undefined && this.shopify.amazon[selected].hasOwnProperty('name')) {
      name = this.shopify.amazon[selected].name;
    }

    console.log("account list: ", options, selected, name);
    const activator = (
      <a onClick={this.togglePopover}>
        <span className="location"><CsSelectorSvg/></span>
        {name}
        <Icon source={CaretDownMinor}/>
      </a>
    );

    return (

      <Popover
        fullWidth
        fullHeight
        active={this.state.active}
        activator={activator}
        onClose={this.togglePopover}
      >

        <ChoiceList
          choices={options}
          selected={selected.toString()}
          onChange={this.handleChangeConfiguration}
        />
      </Popover>
    );
  }
}
export default AccountSelector;
