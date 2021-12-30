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
    Badge, DisplayText, Checkbox, TextField,
    Modal, ButtonGroup
} from '@shopify/polaris';

import Util from "../../helpers/Util"
import "./review.scss";
import CsEmbeddedModal from "../../components/csEmbeddedModal";

class ReviewModal extends React.Component {

    state = {
        opened: false,
        step: 1,
    }

    constructor(props) {
        super(props);
        this.state.opened = this.props.opened;
        console.log("---start---");
    }

    componentWillMount() {
    }

    componentDidMount() {
        // window.setTimeout(() => {
        //     let modal = document.querySelector('.Polaris-Modal-Dialog__Modal');
        //     console.log("componentDidMount", modal);
        //     if (modal) {
        //         modal.className += " review-modal-box";
        //     }
        // }, 300);
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

    handleGotoSupport = () => {
        let {onGotoSupport} = this.props;
        if (onGotoSupport) {
            onGotoSupport();
        }
    }

    handleGotoReview = () => {
        let {onGotoReview} = this.props;
        if (onGotoReview) {
            onGotoReview();
        }
    }

    handleShowReview = () => {
        this.setState({step: 2});
    }

    render() {
        let contents;
        let title;
        if (this.state.step == 1) {
            contents = this.renderStep1();
            title = <span className={"review-title"}>{CsI18n.t("Congratulation!")}&nbsp;&#128077;</span>
        } else {
            contents = this.renderStepDone();
            title = <span className={"review-title"}>{CsI18n.t("How was your experience")}&nbsp;&#128522;</span>
        }
        return (
            <Modal
                open={this.state.opened}
                onClose={this.handleClose}
                children={"here"}
                title={title}
                secondaryActions={[
                    {
                        content: <CsI18n>Close</CsI18n>,
                        onAction: this.handleClose
                    }
                ]}
            >
                {contents}
            </Modal>
        );
    }

    renderStep1() {
        return (<div className={"review-modal-step1"}>
            <Layout.Section>
                <div className={'review-subtitle'}>
                    <span><CsI18n>App started working</CsI18n></span>
                </div>
                <div className={'review-text'}>
                    <span><CsI18n>Everything works well as you want?</CsI18n></span>
                </div>
                <div className={'review-button'}>
                    <Button primary onClick={this.handleShowReview}><CsI18n>Yes, Thank you!</CsI18n></Button>
                    <Button destructive onClick={this.handleGotoSupport}><CsI18n>No, please help!</CsI18n></Button>
                </div>
            </Layout.Section>
        </div>);
    }

    renderStepDone() {
        return (<div className={"review-modal-step-done"}>
            <Layout.Section>
                <div className={'review-subtitle'}>
                    <span><CsI18n>We value feedback!</CsI18n></span>
                </div>
                <div className={'review-text'}>
                    <span><CsI18n>It helps us make our product better and keeps us energized.</CsI18n></span>
                </div>
                <div className={'review-button'}>
                    <Button primary onClick={this.handleGotoReview}><CsI18n>Yes, Sure!</CsI18n>&nbsp;&#128521;</Button>
                </div>
            </Layout.Section>
        </div>);
    }
}

export default ReviewModal;
