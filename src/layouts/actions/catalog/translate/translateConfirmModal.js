import React from 'react'
import CsI18n from "../../../../components/csI18n"

import {
    Heading,
    Stack,
    Banner,
    Spinner,
    Layout,
    TextStyle,
    Button,
    Card,
    ResourceList, Tooltip, Icon,
    Badge, DisplayText, Checkbox, TextField
} from '@shopify/polaris';

import Util from "../../../../helpers/Util"

import {ModelContext} from "../../../model/model-context";
import CsEmbeddedModal from "../../../../components/csEmbeddedModal";

const LIMIT_LOW_PRICE = 0.5

class TranslateConfirmModal extends React.Component {

    static contextType = ModelContext;

    state = {
        opened: false,
        is_agree: false,
        count: 0,
        price: 0,
    }

    constructor(props) {
        super(props);
        this.state.opened = this.props.opened;
        this.state.count = this.props.count;
        this.state.price = this.props.price;
    }

    componentWillMount() {
        require("./translate.scss");
    }

    handleClose = () => {
        let {onClose} = this.props;
        if (onClose) {
            onClose();
        }
    }

    handleOk = () => {
        let {onOk} = this.props;
        if (onOk) {
            onOk();
        }
    }

    handleAgreeCheck = (value) => {
        this.setState({is_agree: value});
    }

    calcTotalPrice(count, unit_price) {
        let total_price = count * unit_price;
        if(total_price < LIMIT_LOW_PRICE) {
            total_price = LIMIT_LOW_PRICE;
        }
        total_price = total_price.toFixed(2);
        return total_price;
    }

    render() {
        let {is_agree, count, price} = this.state;
        price = price.toFixed(2);
        let total_price = this.calcTotalPrice(count, price);
        console.log("render", total_price);
        return (
            <CsEmbeddedModal
                open={this.state.opened}
                onClose={this.handleClose}
                title={CsI18n.t("Confirm")}
                primaryAction={{
                    content: <CsI18n>I accept</CsI18n>,
                    onAction: this.handleOk,
                    disabled: !is_agree,

                }}
                secondaryActions={[
                    {
                        content: <CsI18n>Cancel</CsI18n>,
                        onAction: this.handleClose
                    }
                ]}
            >
                <div className={"translate-confirm-modal"}>
                    <Layout.Section>
                        <div className={'title'}>
                            <Heading element={"h1"}><CsI18n>Translation the title and the description confirmation</CsI18n></Heading>
                        </div>
                        <div className={'translate-selected'}>
                            <span className={'select-title'}><CsI18n>You selected</CsI18n></span><br/>
                            <span className={'select-body'}>{CsI18n.t('{{count}} products', {count: count})}</span><br/>
                        </div>
                        <div className={'translate-price'}>
                            <Stack>
                                <Stack.Item>{CsI18n.t('Qty: {{qty}}', {qty: count})}</Stack.Item>
                                <Stack.Item>{CsI18n.t('Unit Price: ${{unit_price}}', {unit_price: price})}</Stack.Item>
                                <Stack.Item>{CsI18n.t('Total: ${{total_price}}', {total_price})} {CsI18n.t('(The minimum price is $0.5)')}</Stack.Item>
                            </Stack>
                        </div>
                        <div className={'translate-agree'}>
                            <Checkbox label={CsI18n.t('I accept to be charged ${{total_price}} for translation', {total_price})} checked={is_agree} onChange={this.handleAgreeCheck} />
                        </div>
                        {/*<div className={'image-note'}>*/}
                        {/*    <CsI18n>{"Notice of warranty: Removing background doesn't give you any insurance that the target images will be the ones displayed on Amazon," +*/}
                        {/*    "as Amazon automatically select images depending on their own criteria."}</CsI18n>&nbsp;*/}
                        {/*    <CsI18n>{"However, as best as is the image, as best as it is eligible to be displayed in priority on Amazon"}</CsI18n>*/}
                        {/*</div>*/}
                    </Layout.Section>
                </div>
            </CsEmbeddedModal>
        );
    }
}

export default TranslateConfirmModal;
