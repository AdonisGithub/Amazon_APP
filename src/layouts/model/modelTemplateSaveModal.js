import React from 'react';
import Constants from "../../helpers/rules/constants";
import {
    Button,
    Card,
    ChoiceList,
    Collapsible,
    DisplayText,
    Modal,
    FormLayout,
    OptionList,
    ResourceList,
    Select,
    Stack,
    TextContainer,
    TextField, ButtonGroup, TextStyle, Tooltip, Icon, Badge, Banner, Link, Heading, Spinner, Checkbox,
} from "@shopify/polaris";
import CsI18n from "../../components/csI18n";
import Util from "../../helpers/Util";
import CsEmbeddedModal from "../../components/csEmbeddedModal";
import ApplicationApiCall from "../../functions/application-api-call";
import {ModelContext} from "./model-context";
import {CsValidationForm, CsValidation} from "../../components/csValidationForm";
import ShopifyContext from "../../context";

export default class ModelTemplateSaveModal extends React.Component {

    static contextType = ModelContext;

    state = {
        opened: false,
        processing: false,
        name: '',
        is_admin_only: true,
    }

    constructor(props) {
        super(props);
        this.state.opened = this.props.opened;
        this.state.name = this.props.name;
        this.is_admin = ShopifyContext.getShared().isAdminMode();
        this.is_admin_only = this.props.is_admin_only;
    }

    componentWillMount() {
        require('./modelModal.css');
    }

    componentWillReceiveProps(nextProps, nextContext) {
        if (nextProps.opened != this.state.opened) {
            this.setState({opened: nextProps.opened});
        }
    }

    handleClose = () => {
        let {onClose} = this.props;
        if (onClose) {
            onClose();
        }
    }

    handleSave =  () => {
        if (CsValidationForm.validate("templateForm") === false)
            return;

        let {onSave} = this.props;
        if (onSave) {
            onSave(this.state.name, this.state.is_admin_only);
        }
        this.setState({processing: true});
    }

    render() {
        console.log("render", this.state);
        let {name, is_admin_only} = this.state;
        return (
            <CsEmbeddedModal
                open={this.state.opened}
                onClose={this.handleClose}
                title={CsI18n.t('Save this model as template')}
                primaryAction={{
                    content: <CsI18n>Save</CsI18n>,
                    onAction: this.handleSave,
                    loading: this.state.processing
                }}
                secondaryActions={[
                    {
                        content: <CsI18n>Cancel</CsI18n>,
                        onAction: this.handleClose,
                        disabled: this.state.processing
                    }
                ]}>
                <Modal.Section>
                    <CsValidationForm name="templateForm">
                    <div className="model-template-container">
                        <div className={"label"}>
                            <Heading>{CsI18n.t('Template name')}</Heading>
                        </div>
                        <div className={"field"}>
                            <CsValidation>
                                <TextField label="name"
                                           onChange={(value) => this.setState({name: value})}
                                           value={name}
                                           labelHidden={true}/>
                                <CsValidation.Item rule="required"
                                                   title={CsI18n.t("Name is required")}/>
                            </CsValidation>
                        </div>
                        {this.is_admin ? <Checkbox label={"Show only to Admin (Admin option)"} checked={is_admin_only}
                                                   onChange={(value) => this.setState({is_admin_only: value})}/> : null}
                    </div>
                    </CsValidationForm>
                </Modal.Section>
            </CsEmbeddedModal>
        );
    }

}
