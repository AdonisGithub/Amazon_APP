import React from 'react';
import {
    Popover, Thumbnail, Button, Modal, Stack, TextContainer

} from '@shopify/polaris';
import CsI18n from "../../components/csI18n";
import CsEmbeddedModal from "../../components/csEmbeddedModal";

export default class CsConfirmModal extends React.Component {

    static MODE_DELETE = 1;
    static MODE_CONFIRM = 2;
    static defaultProps = {
        opened: false,
        title: "",
        message: "",
        onOK: null,
        onCancel: null,
        mode: CsConfirmModal.MODE_DELETE,
    }
    state = {
        opened: false,
        refresh: true,
    }

    constructor(props) {
        super(props);
        this.state.opened = this.props.opened;
    }

    componentWillMount() {
        require('./csConfirmModal.css');
    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.setState({refresh: true});
    }


    handlerClose = () => {
        let {onClose} = this.props;
        if( onClose ) {
            onClose();
        }
        this.setState({ opened: false } );

    };

    handlerConfirm = () => {
        let {onOK} = this.props;
        if( onOK ) {
            onOK();
        }
        this.setState({ opened: false } );
    };

    render() {
        let buttonConfirmName = "OK";
        if( this.props.mode == CsConfirmModal.MODE_DELETE )
            buttonConfirmName = "Delete";

        return (
            <CsEmbeddedModal
                open={this.props.opened}
                onClose={this.handlerClose}
                title={this.props.title}
                primaryAction={{
                    content: <CsI18n>{buttonConfirmName}</CsI18n>,
                    onAction: this.handlerConfirm,
                    destructive: this.props.mode == CsConfirmModal.MODE_DELETE
                }}
                secondaryActions={[
                    {
                        content: <CsI18n>Cancel</CsI18n>,
                        onAction: this.handlerClose
                    }
                ]}
            >
                <Modal.Section>
                    <TextContainer>
                        <p>{this.props.message}</p>
                    </TextContainer>
                </Modal.Section>
            </CsEmbeddedModal>
        );
    }
}