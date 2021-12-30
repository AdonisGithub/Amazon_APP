import React from "react";
import {
    Card, Checkbox,
    ResourceList,
    TextStyle
} from "@shopify/polaris";

import "./test_resourcelist.css"
import test_import from "../testData/test_import";

export default class TestResourceList extends React.Component {

    constructor(props){
        super(props);
        this.auto_id = 1;
    }

    state = {
        selectedItems: [],
    };

    products = test_import.data.details;

    handleSelectionChange = (selectedItems) =>{
        console.log(selectedItems);
        this.setState({selectedItems});
    };

    render(){
        const resourceName = {
            singular: 'product',
            plural: 'products'
        };

        const resourceListHeadings = (
            <div className="Polaris-ResourceList-Item__Container OrderCard-Headings" >
                <div className="Polaris-ResourceList-Item__Owned">
                    <div className="Polaris-ResourceList-Item__Handle"/>
                </div>
                <div className="Polaris-ResourceList-Item__Content OrderCard-Wrapper">
                    <div className="OrderCard-Start">
                        <TextStyle variation="strong">SKU</TextStyle>
                    </div>
                    <div className="OrderCard-Asin">
                        <TextStyle variation="strong">Asin</TextStyle>
                    </div>
                    <div className="OrderCard-Name">
                        <TextStyle variation="strong">Name</TextStyle>
                    </div>
                    <div className="OrderCard-Price">
                        <TextStyle variation="strong">Price</TextStyle>
                    </div>
                    <div className="OrderCard-Qty">
                        <TextStyle variation="strong">Qty</TextStyle>
                    </div>
                </div>
            </div>
        );

        const new_products = this.products.map(item => {
            if( !item.auto_id ) {
                item.auto_id = this.getAutoId();
            }
            return {id: item.auto_id, ...item};

        });

        return (
            <Card>
                <div className="OrderCard-Headings">{this.auto_id - 1}/500 Products</div>
                {resourceListHeadings}
                <ResourceList
                    resourceName={resourceName}
                    items={new_products}
                    renderItem={this.renderItem}
                    selectedItems={this.state.selectedItems}
                    onSelectionChange={this.handleSelectionChange}
                    resolveItemId={this.resolveItemIds}
                    selectable
                    showHeader
                />
            </Card>
        );
    };

    renderItem = (item, _, index) => {
        const {id, product_id, sku, asin, name, price, quantity} = item;

        return (
            <ResourceList.Item id={id} sortOrder={index}>
                <div className="OrderCard-Wrapper">
                    <div className="OrderCard-Start">{sku}</div>
                    <div className="OrderCard-Asin">{asin}</div>
                    <div className="OrderCard-Name">{name}</div>
                    <div className="OrderCard-Price">{price}</div>
                    <div className="OrderCard-Qty">{quantity}</div>
                </div>
            </ResourceList.Item>
        );
    };

    getAutoId() {
        return this.auto_id++;
    }

    resolveItemIds = ({id}) => {
        return id;
    };
}
