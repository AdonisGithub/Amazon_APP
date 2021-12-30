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

import "./charge_modal.scss";
import CsEmbeddedModal from "../../components/csEmbeddedModal";

class ChargeConfirmModal extends React.Component {
    state = {
        opened: false,
        is_agree: false,
        price: 0,
        trial_days: 0,
        processing: false,
        course_type: -1,
    }
    static defaultProps = {
        course_type: -1,
    }
    constructor(props) {
        super(props);
        this.state.opened = this.props.opened;
        this.state.price = this.props.price;
        this.state.trial_days = this.props.trial_days;
        this.state.course_type = this.props.course_type;
    }

    componentWillMount() {
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
        this.setState({processing: true});
    }

    handleAgreeCheck = (value) => {
        this.setState({is_agree: value});
    }

    render() {
        let {is_agree, price, trial_days, processing, course_type} = this.state;
        price = price.toFixed(2);
        let course_note = null;
        let accept_label = '';
        if (course_type == 10) {
            course_note = <div className={"title"}>2% fees per order imported</div>;
            accept_label = CsI18n.t('I accept');
        } else {
            accept_label = CsI18n.t('I will be charged monthly, I accept the recurring charge');
        }
        return (
            <CsEmbeddedModal
                open={this.state.opened}
                onClose={this.handleClose}
                title={CsI18n.t("Confirmation")}
                primaryAction={{
                    content: <CsI18n>Approve</CsI18n>,
                    onAction: this.handleOk,
                    loading: processing,
                    disabled: !is_agree || processing,

                }}
                secondaryActions={[
                    {
                        content: <CsI18n>Cancel</CsI18n>,
                        onAction: this.handleClose,
                        disabled: processing
                    }
                ]}
            >
                <div className={"charge-confirm-modal"}>
                    <Layout.Section>
                        {course_note? <div>
                            {course_note}
                        </div>:null}
                        <div className={'charge-price'}>
                            <Stack vertical={true}>
                                {course_type != 10? <Stack.Item>{CsI18n.t('Price: ${{price}}', {price: price})}</Stack.Item>:null}
                                <Stack.Item>{CsI18n.t('Free trial: {{trial_days}} days', {trial_days})}</Stack.Item>
                            </Stack>
                        </div>
                        <div className={'charge-agree'}>
                            <Checkbox label={accept_label} checked={is_agree} onChange={this.handleAgreeCheck} />
                        </div>
                    </Layout.Section>
                </div>
            </CsEmbeddedModal>
        );
    }
}

export default ChargeConfirmModal;
