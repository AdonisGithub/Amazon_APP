import React from "react";
import CsI18n from "./../../components/csI18n"
import Util from "../../helpers/Util";

import {
    Card,
    Tag,
    TextContainer,
    Stack,
    Autocomplete,
    Spinner,
    Select,
    Layout, Heading, Link, Icon, Collapsible, ChoiceList, Avatar, Checkbox
} from '@shopify/polaris';
import ShopifyContext from "../../context";
import {ChevronDownMinor, ChevronRightMinor, ChevronUpMinor} from "@shopify/polaris-icons";
import shopifyContext from "../../context";
import CsToggleButton from "../../components/csToggleButton";
import WorkflowTab from "./workflow_tab";

const ANY = "any";
class LocationSelector extends WorkflowTab {
    constructor(props) {
        super(props);
        this.shopify = ShopifyContext.getShared();
        this.marketplaceList = this.props.marketplaceList;

        this.state.advanced_active = false;
        this.state.options = [];
        this.options = [];

        this.defaults = {
            ...this.defaults,
            locations: [],
            marketplace_locations: [],
            order_not_allow_another_location: false,
            order_not_allow_no_location: false,
        };
        if (!this.props.config.hasOwnProperty('data') || !this.props.config.data) {
            this.configurationUpdateCurrent(this.defaults);
        }
        console.log(this.marketplaceList);
    }

    getName() {
        return "locations";
    }

    loadConfig() {
        this.configurationLoad();
        this.configurationUpdateCurrent(this.state.data);
    }

    componentWillReceiveProps(nextProps) {
        console.log("componentWillReceiveProps");

        this.loadConfig();
    }

    componentWillMount() {
        console.log("componentWillMount");

        this.loadConfig();
        this.setState({loading: true, selected: []});

        this.fetchLocationsListing(this.cbFetchLocations);
    }

    cbFetchLocations = (locations_listings) => {
        if (this.unMounted) {
            return;
        }
        console.log(locations_listings);
        if (locations_listings !== undefined) {
            console.log('parsing locations');
            locations_listings.forEach((elm) => {
                console.log(elm);
                if (!elm.hasOwnProperty('name')) return;
                var option = {value: elm.id.toString(), label: elm.name.toString()};
                this.options.push(option);
            })
            let {data} = this.state;
            let {locations} = data;
            let bUseAll = this.isUseAll(locations);
            if (!bUseAll) {
                locations = this.convertLocationData(this.options, locations);
            }
            data.locations = locations;
            console.log("cbFetchLocations", data, locations, this.options);

            this.setState({loading: false, options: this.options, data});
        }
    }

    handleUseAll = (value) => {
        if(value) {
            this.valueUpdater("locations")([ANY]);
        } else {
            this.valueUpdater("locations")([]);
        }
    }

    convertLocationData(options, locations) {
        let filtered_locations = [];
        for (let location of locations) {
            for (let item of options) {
                if (item.value == location) {
                    filtered_locations.push(item.value);
                    break;
                }
            }
        }
        return filtered_locations;
    }

    handleSelectLocation = (selected_locations) => {
        let {locations} = this.state.data;
        console.log("handleSelectLocation", locations, selected_locations);
        if(!locations) {
            locations = [];
        }
        if(!selected_locations) {
            selected_locations = [];
        }

        let index = -1;
        let deleted_indexes = [];
        //search deleted locations
        for(let i in locations) {
            index = Util.indexOf(selected_locations, locations[i]);
            if(index == -1) {
                deleted_indexes.push(i);
            }
        }
        deleted_indexes = deleted_indexes.reverse();
        if(deleted_indexes.length > 0) {
            for(let index of deleted_indexes) {
                locations.splice(index, 1);
            }
        }
        //search added locations
        for(let selected_location of selected_locations) {
            index = Util.indexOf(locations, selected_location);
            if(index == -1) {
                locations.push(selected_location);
            }
        }
        console.log("handleSelectLocation", locations);
        this.valueUpdater("locations")(locations);
    }

    handleAdvancedOpen = () => {
        this.setState(prev => {
            return {advanced_active: !prev.advanced_active}
        })
    }

    handleChangeMarketplaceLocation = (marketplace_id) => (value) => {
        let marketplace_locations = this.state.data.marketplace_locations;
        let bFound = false;
        for(let i in marketplace_locations) {
            if(marketplace_locations[i].marketplace_id == marketplace_id) {
                bFound = true;
                marketplace_locations[i].location = value;
                break;
            }
        }
        if(!bFound) {
            marketplace_locations.push({marketplace_id, location: value});
        }
        this.valueUpdater("marketplace_locations")(marketplace_locations);
    }

    render() {
        console.log(this.state);
        if (this.state.loading) {
            return (this.renderLoading());
        } else {
            return (this.renderBody())
        }
    }

    isUseAll(locations) {
        let bUseAll = false;
        if(locations.length == 1 && locations[0] == ANY) {
            bUseAll = true;
        }
        return bUseAll;
    }

    addSpecialLocations(locations) {
        console.log('addSpecialLocations', locations);
        if (this.isUseAll(locations)) {
            return locations;
        }
        if (this.state.data.fba_sync_option && this.state.data.fba_sync_option[0] == 'multi') {
            let location = this.state.data.fba_sync_location ? this.state.data.fba_sync_location : false;
            if (location && !locations.includes(location)) {
                locations.push(location);
                console.log('addSpecialLocations-add1', locations);
            }
        }

        if (this.state.data.sync_shopify && this.state.data.sync_shopify[0] == 'when-inventory-import') {
            let location = this.state.data.sync_shopify_location ? this.state.data.sync_shopify_location : false;
            if (location && !locations.includes(location)) {
                locations.push(location);
                console.log('addSpecialLocations-add2', locations);
            }
        }
        console.log('addSpecialLocations', locations);
        return locations;
    }

    renderBody() {
        console.log('renderBody', this.state);
        let locations = this.addSpecialLocations(this.state.data.locations);
        let bUseAll = this.isUseAll(locations);
        return (
            <Card.Section>
                <Layout>
                    <Layout.Section>
                        <TextContainer>
                            <CsI18n>Set the locations you will ship from for this account</CsI18n>
                        </TextContainer>
                    </Layout.Section>
                    <Layout.Section>
                        <Checkbox label={CsI18n.t("Use all locations")} checked={bUseAll} onChange={this.handleUseAll} />
                    </Layout.Section>
                    {
                        bUseAll? '':(<Layout.Section>
                            <TextContainer>
                                <Stack>{this.renderTags()}</Stack>
                            </TextContainer>
                        </Layout.Section>)
                    }
                    {
                        bUseAll? '':(<Layout.Section>
                        <Autocomplete
                            allowMultiple
                            options={this.state.options}
                            selected={locations}
                            textField={
                                <Autocomplete.TextField
                                    onChange={this.updateText}
                                    label=""
                                    value={this.state.inputText}
                                    placeholder={CsI18n.t("New York, Paris, London")}
                                />
                            }
                            onSelect={this.handleSelectLocation}
                            listTitle={CsI18n.t("Suggested Locations")}
                        />
                        </Layout.Section>)
                    }
                </Layout>
                <div className={"mt-3"}>
                    <Stack alignment={"leading"}>
                        <Stack.Item><Heading>{CsI18n.t('Advanced')}</Heading></Stack.Item>
                        <Stack.Item><Link onClick={this.handleAdvancedOpen}><Icon source={this.state.advanced_active? ChevronUpMinor:ChevronDownMinor}/></Link></Stack.Item>
                    </Stack>
                    <Collapsible open={this.state.advanced_active} id="advanced-collapsible">
                        <div className={"ml-6 mt-2"}>
                            {this.renderMarketplaceMap()}
                        </div>
                    </Collapsible>
                </div>
            </Card.Section>
        );
    }

    renderLoading() {
        return (
            <div align="center">
                <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}/>
            </div>
        );

    }

    updateText = (newValue) => {
        this.setState({inputText: newValue});
        this.filterAndUpdateOptions(newValue);
    };

    removeTag = (tag) => {
        let newSelected = this.state.data.locations;
        newSelected.splice(newSelected.indexOf(tag), 1);
        this.setState(prevState => ({
            ...prevState,
            data: {
                ...prevState.data,
                locations: newSelected
            }
        }), this.saveState)
    };

    renderTags = () => {
        return this.state.data.locations.map((option) => {
            let tagLabel = '';
            let currentOption = this.options.filter((item) => {
                return item.value == option
            });
            console.log(option, currentOption);

            if (currentOption.length && currentOption[0].hasOwnProperty('label')) {

                console.log(currentOption);

                let tagLabel = currentOption[0].label;
                //tagLabel = option.replace('_', ' ');
                //tagLabel = titleCase(tagLabel);
                return (
                    <Tag key={'option' + option} onRemove={() => this.removeTag(option)}>
                        {tagLabel}
                    </Tag>
                );
            }
        });
    };

    filterAndUpdateOptions = (inputString) => {
        if (inputString === '') {
            this.setState({
                options: this.options,
            });
            return;
        }

        const filterRegex = new RegExp(inputString, 'i');
        const resultOptions = this.options.filter((option) =>
            option.label.match(filterRegex),
        );
        console.log(resultOptions)

        let endIndex = resultOptions.length - 1;
        if (resultOptions.length === 0) {
            endIndex = 0;
        }
        this.setState({
            options: resultOptions,
        });
    };

    updateSelection = (updatedSelection) => {
        this.setState({selected: updatedSelection});
    };

    renderMarketplaceMap() {
        let {selected_marketplaces, locations: selected_locations, order_not_allow_another_location, order_not_allow_no_location} = this.state.data;
        if(!Array.isArray(selected_marketplaces) || selected_marketplaces.length == 0) {
            return '';
        }
        let bUseAll = this.isUseAll(selected_locations);

        let locations = [{label: 'Any', value: 'any'}];
        for(let item of this.options) {
            if(bUseAll || selected_locations.includes(item.value)) {
                locations.push(item);
            }
        }

        let marketplaces = [];
        for(let marketplace_info of this.marketplaceList) {
            let {MarketplaceId} = marketplace_info;
            if(!selected_marketplaces.includes(MarketplaceId)) {
                continue;
            }
            marketplaces.push(this.renderMarketplaceLine(marketplace_info, locations));
        }

        return (<div>
            {marketplaces}
            <div className={"mt-4"}><Stack wrap={false} alignment={"center"}>
                <Stack.Item>
                    <CsToggleButton checked={!order_not_allow_another_location} onChange={(value) => {
                        this.valueUpdater("order_not_allow_another_location")(!value)
                    }}/>
                </Stack.Item>
                <Stack.Item fill>
                    {CsI18n.t('Allow to import orders if the product is not available at this location but available from another one')}
                </Stack.Item></Stack>
            </div>
            <div className={"mt-4"}><Stack wrap={false} alignment={"center"}>
                <Stack.Item>
                    <CsToggleButton checked={!order_not_allow_no_location} onChange={ (value) => {
                        this.valueUpdater("order_not_allow_no_location")(!value);
                    }}/>
                </Stack.Item>
                <Stack.Item fill>
                    {CsI18n.t('Allow to import orders if the product is not available at any location')}
                </Stack.Item></Stack></div>
        </div>);
    }

    renderMarketplaceLine(marketplace_info, locations) {
        const {MarketplaceId, DefaultCountryCode, Name} = marketplace_info;
        let {marketplace_locations} = this.state.data;
        let flag_url = shopifyContext.getShared().static_content + '/amazon/flags/flag_' + DefaultCountryCode.toLowerCase() + '_64px.png';

        let selected_location = 'any';
        for(let row of marketplace_locations) {
            if(row.marketplace_id == MarketplaceId) {
                selected_location = row.location;
            }
        }
        return <Stack alignment={"center"} key={`marketplace_${MarketplaceId}`}>
            <Stack.Item>
                <Avatar source={flag_url} alt={DefaultCountryCode}/>
            </Stack.Item>
            <Stack.Item ><div className={"wd-120"} >{Name}</div></Stack.Item>
            <Stack.Item><Icon source={ChevronRightMinor} /> </Stack.Item>
            <Stack.Item><div className={"marketplace-location"}><Select label="Location"
                                options={locations}
                                onChange={this.handleChangeMarketplaceLocation(MarketplaceId)}
                                value={selected_location}
                                labelHidden={true}/></div></Stack.Item>
        </Stack>;
    }

}
//
// function titleCase(string) {
//     string = string
//         .toLowerCase()
//         .split(' ')
//         .map(function (word) {
//             return word.replace(word[0], word[0].toUpperCase());
//         });
//     return string.join(' ');
// }

export default LocationSelector;
