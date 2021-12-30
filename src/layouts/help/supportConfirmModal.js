import React from 'react'
import CsI18n from "../../components/csI18n"

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

import Util from "../../helpers/Util"

import CsEmbeddedModal from "../../components/csEmbeddedModal";

const LIMIT_LOW_PRICE = 0.5

class SupportConfirmModal extends React.Component {

    state = {
        opened: false,
        is_agree: false,
        price: 0,
        contents: '',
    }

    constructor(props) {
        super(props);
        this.state.opened = this.props.opened;
        this.state.price = this.props.price;
        this.state.contents = this.props.contents;
    }

    componentWillMount() {
        require("./support.scss");
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

    render() {
        let {is_agree, price, contents} = this.state;
        let total_price = price;
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
                <div className={"support-confirm-modal"}>
                    <Layout.Section>
                        <div className={'title'}>
                            <Heading element={"h1"}><CsI18n>Paying support confirmation</CsI18n></Heading>
                        </div>
                        <div className={'support-selected'}>
                            <span className={'select-title'}><CsI18n>You selected</CsI18n></span><br/>
                            <span className={'select-body'}>{contents}</span><br/>
                        </div>
                        <div className={'support-price'}>
                            <Stack>
                                <Stack.Item>{CsI18n.t('Price: ${{total_price}}', {total_price})}</Stack.Item>
                            </Stack>
                        </div>
                        <div className={'translate-agree'}>
                            <Checkbox label={CsI18n.t('I accept to be charged ${{total_price}} for support', {total_price})} checked={is_agree} onChange={this.handleAgreeCheck} />
                        </div>
                    </Layout.Section>
                </div>
            </CsEmbeddedModal>
        );
    }
}

export default SupportConfirmModal;
