import React from "react";
import CsI18n from "../../../components/csI18n";
import {Button, Modal, TextField, TextStyle, Stack, ResourceList} from "@shopify/polaris";
import "./orders.css";
import CsEmbeddedModal from "../../../components/csEmbeddedModal";

export default class CancelItemModal extends React.Component {
    state = {
        items: [],
        item_qty: [],
    }
    total_items = 0;

    constructor(props) {
        super(props);
        this.init();
    }

    init() {

        this.state.items = [];
        this.state.item_qty = [];
        this.props.checked.sort().forEach((index) => {

            if (this.props.line_items[index].quantity != 0) {
                this.state.items.push({sku:this.props.line_items[index].sku, name:this.props.line_items[index].name});
                this.state.item_qty.push(this.props.line_items[index].quantity);
            }
        })
    }

    handleClick = (action) => () => {
        if (action === 'close') {
            const {onClose} = this.props;
            onClose();
        }
        if (action === 'cancel') {
            let line_items = this.props.line_items;
            this.props.checked.forEach((item, index) => {
                line_items[item].quantity -= this.state.item_qty[index];
            })
            const {onChange} = this.props;
            onChange(line_items);
        }
    }

    handleChange = (idx) => (value) => {

        this.setState((state) => {
            return state.item_qty[idx] = parseFloat(value);
        });
    }

    render() {

        this.total_items = 0;
        this.state.item_qty.forEach((item) => {
            this.total_items += item;
        })
        return (
            <CsEmbeddedModal
                open={true}
                onClose={this.handleClick('close')}
                title={CsI18n.t("Cancel Order Items")}
            >
                <Modal.Section>
                    <Stack vertical>
                        <Stack.Item>
                            <ResourceList
                                items={this.state.items}
                                renderItem={(item, index) => {
                                    const {name, sku} = item;

                                    return (
                                        <ResourceList.Item id={index}>
                                            <Stack>
                                                <Stack.Item fill>
                                                    <div className="modal-item-name">
                                                        <Stack>
                                                            <TextStyle>{name}</TextStyle>
                                                        </Stack>
                                                        <Stack>
                                                            <TextStyle><CsI18n sku={sku}>{"SKU: {{sku}}"}</CsI18n></TextStyle>
                                                        </Stack>
                                                    </div>
                                                </Stack.Item>
                                                <Stack.Item>
                                                    <div className="modal-item-qty">
                                                        <TextField value={this.state.item_qty[index]} type="number"
                                                                   min="0"
                                                                   max={this.props.line_items[this.props.checked[index]].quantity}
                                                                   onChange={this.handleChange(index)}/>
                                                    </div>
                                                </Stack.Item>
                                            </Stack>
                                        </ResourceList.Item>
                                    )
                                }}/>

                        </Stack.Item>
                        <Stack.Item>
                            <Stack distribution="trailing">
                                <Stack.Item>
                                    <Button onClick={this.handleClick('close')}><CsI18n>Close</CsI18n></Button>
                                </Stack.Item>
                                <Stack.Item>
                                    <Button
                                        disabled={this.total_items === 0}
                                        onClick={this.handleClick('cancel')}
                                        destructive><CsI18n>Cancel Order</CsI18n></Button>
                                </Stack.Item>
                            </Stack>
                        </Stack.Item>
                    </Stack>
                </Modal.Section>
            </CsEmbeddedModal>
        )
    }
}