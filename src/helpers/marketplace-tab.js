import React from 'react'


import {
  Stack,
  Tabs,
  TextStyle,
  Avatar,
} from '@shopify/polaris';
import shopifyContext from "../context";

class MarketplaceTab extends React.Component {

  state = {
    selectedMarketplaceTab : 0,
  }
  constructor(props) {
    super(props);
  }

  handleMarketplaceTabChange = (selectedMarketplageTab) => {
    this.props.onChange(selectedMarketplageTab);
    this.setState({selectedMarketplaceTab: selectedMarketplageTab});
  }

  render(){

    const {selectedMarketplaceTab} = this.props;
    const tabs = [];

    this.props.marketplaceList.forEach(function(marketplace, index) {
      let name = marketplace.Name;
      let iso_code = marketplace.DefaultCountryCode.toLowerCase();
      let flag_url = shopifyContext.getShared().static_content + '/amazon/flags/flag_' + iso_code + '_64px.png';
      let title =
        <Stack horizontal alignment="center">
          <Stack.Item>
            <Avatar source={flag_url} alt={iso_code} size="small"/>
          </Stack.Item>
          <Stack.Item>
            <TextStyle>
              {name}
            </TextStyle>
          </Stack.Item>
        </Stack>

      tabs[index] = {
        id:marketplace.MarketplaceId,
        content:title,
        panelID:marketplace.MarketplaceId,
      }
    });



    return(
       <Tabs tabs={tabs} selected={selectedMarketplaceTab} onSelect={this.handleMarketplaceTabChange}>{this.props.children}</Tabs>
    )
  }
}

export default MarketplaceTab;