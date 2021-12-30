import React from 'react';
import {ActionList, Button, Icon, Popover, Stack} from '@shopify/polaris';
import {TickSmallMinor} from "@shopify/polaris-icons";
import "./csMultiSelect.css"

export default class CsMultiSelect extends React.Component {
    state = {
        active: false,
        options: [],
        update: false,
    };

    constructor(props) {
        super(props)
        this.state.options = props.options;
        this.state.active = false;
        this.state.update = false;
    }

    togglePopover = () => {
        

            this.setState(({active}) => {
                return {active: !active};
            });

    };


    handleItemClick = (item, idx) => () => {
        let {options} = this.state;
        options[idx].checked = !this.state.options[idx].checked;

        this.props.onSelect(this.state.options);
        this.setState({options: options, update: true})
    }

    render() {
        let self = this;
        const items = []

        this.state.options.forEach((item, index) => {

            items.push({
                content: <Stack spacing="extraTight">
                    <Stack.Item>
                        <div className={item.checked ? "checked" : "unChecked"}><Icon source={TickSmallMinor}/></div>
                    </Stack.Item>
                    <Stack.Item>{item.label}</Stack.Item></Stack>,
                onAction: self.handleItemClick(item, index)
            })
        })
        const activator = (
            <Button onClick={this.togglePopover}>Edit Columns</Button>
        );

        return (
            <Popover
                preferredAlignment="left"
                active={this.state.active}
                activator={activator}
                onClose={this.togglePopover}
            >
                <div className="csMultiSelect">
                    <ActionList
                        items={items}
                    />
                </div>
            </Popover>

        );
    }
}
