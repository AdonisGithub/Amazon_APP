import React, {Component} from 'react'
import {
    AppProvider,
    Banner,
    Button,
    Caption,
    Card,
    Heading,
    List,
    DropZone,
    Page,
    Spinner,
    Stack,
    TextStyle,
    Thumbnail, ResourceList, ButtonGroup,
    Layout,
    Avatar,
} from '@shopify/polaris';

class TestKbug extends Component {
    state = {
    };

    constructor(props) {
        super(props);

        // this.shopify = ShopifyContext.getShared();
    }

    render() {
        console.log("render", this.props.value);
        const resourceName = {singular: 'matching', plural: 'matching-group'};
        let matchingGroup = [{groupName: "test1", disabled: true, id: 1}, {groupName: "test2", disabled: false, id: 2}, {groupName: "test3", disabled: true, id: 3}];

        return (<Card>
                <ResourceList
                    resourceName={{singular: 'customer', plural: 'customers'}}
                    items={[
                        {
                            id: 341,
                            url: 'customers/341',
                            name: 'Mae Jemison',
                            location: 'Decatur, USA',
                        },
                        {
                            id: 256,
                            url: 'customers/256',
                            name: 'Ellen Ochoa',
                            location: 'Los Angeles, USA',
                        },
                    ]}
                    renderItem={(item) => {
                        const {id, url, name, location} = item;
                        const media = <Avatar customer size="medium" name={name} />;
                        console.log(name, location);
                        return (
                            <ResourceList.Item
                                id={id}
                                url={url}
                                media={media}
                                accessibilityLabel={`View details for ${name}`}
                            >
                                <h3>
                                    <TextStyle variation="strong">{name}</TextStyle>
                                </h3>
                                <div>{location}</div>
                            </ResourceList.Item>
                        );
                    }}
                />
            </Card>

        );

    }
    handleChange = (id) => {

    }
    handlerEdit = (id) => {

    }
    renderItem = (item) => {
        let display_name = '';
        const {groupName, disabled, id} = item;
        console.log(id, item);
        return (
            <ResourceList.Item id={"matching-" + this.static_count}>
                <div>
                    {groupName}
                </div>
            </ResourceList.Item>
        );
    };


}
export default TestKbug;