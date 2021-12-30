import React from "react";
import {
    Avatar,
    Card,
    ResourceList,
    TextStyle
} from "@shopify/polaris";
import TestAutoComplete from "./test_component/test_autocomplete";
import TestResourceList from "./test_component/test_resourcelist";
import CsDataTable from "./components/csDataTable/csDataTable";
// import DateTime from "react-datetime";
// import moment from "moment";
import test_import from "./testData/test_import";


export default class Samples extends React.Component {
    state = {
        selectedItems: []
    };

    render() {
        // let raw = 'Sat, Feb 1, 2020 12:15 PM';
        // let a = moment.utc(raw);
        // a.utcOffset(8);
        // let tz_a1 = a.format("YYYY-MM-DD");
        // let tz_a2 = a.format("llll");

        const imports = test_import.data.details;
        return (
            <Card>
                {/*<div>{raw}</div>*/}
                {/*<div>{tz_a1}</div>*/}
                {/*<div>{tz_a2}</div>*/}
                {/*<TestResourceList/>*/}
                {/*<TestAutoComplete/>*/}
                {/*<ResourceList*/}
                {/*    resourceName={resourceName}*/}
                {/*    items={items}*/}
                {/*    renderItem={this.renderItem}*/}
                {/*    selectedItems={this.state.selectedItems}*/}
                {/*    onSelectionChange={this.handleSelectionChange}*/}
                {/*    resolveItemId={this.resolveItemIds}*/}
                {/*    selectable*/}
                {/*/>*/}
            </Card>
        );
    }
}
