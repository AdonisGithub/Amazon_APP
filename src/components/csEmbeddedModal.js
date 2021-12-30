import React, {Component} from 'react';
import {
    AppProvider,
    Modal, TextContainer,
} from '@shopify/polaris';
import Context from "../context";
import CsI18n from "../components/csI18n";


export default class CsEmbeddedModal extends React.Component {
    state = {
        modalOpen: true,
    };

    constructor(props) {
        super(props);
        this.shopify = Context.getShared();

    }

    render() {

        return (
            <AppProvider>
                <Modal
                    {...this.props}
                >
                </Modal>
            </AppProvider>
        );
    }
}
