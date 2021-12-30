import React, {Component} from 'react';
import {
    Form,
    FormLayout,
    Modal,
    TextField,
    ButtonGroup,
    DropZone,
    Button,
    InlineError,
    Banner,
    List,
    Stack,
    Thumbnail,
    Caption, AppProvider
} from "@shopify/polaris";

import {DeleteMinor, PlusMinor} from "@shopify/polaris-icons";

import {RoadmapContext} from "../roadmap-context";
import RoadmapApiCall from "../functions/roadmp-api-call";
import {CsValidationForm, CsValidation} from "../../csValidationForm";
import Const from "../Const";

class IdeaForm extends Component {

    static contextType = RoadmapContext;

    constructor(props) {
        super(props);
        this.state = {
            priority: 1,
            subject: '',
            content: "",
            email: '',
            picture: '',
            files: [],
            rejectedFiles: [],
            hasUploadError: false,
            saving: false,
            error: false,
            successMessage: '',
        }
    }

    componentWillMount() {
        this.CsI18n = this.context.CsI18n;
        this.state.active = this.props.active;
    }

    componentWillReceiveProps(nextProps, nextContext) {
        if (nextProps.active != this.props.active) {
            this.setState({active: nextProps.active});
        }
    }

    handleNice = () => {
        this.setState({
            priority: 1
        })
    };
    handleImportant = () => {
        this.setState({
            priority: 2
        })
    };
    handleCritical = () => {
        this.setState({
            priority: 3
        })
    };

    handleClose = () => {
        let {onClose} = this.props;
        onClose();
    }


    remove = () => {
        this.setState({
            files: [],
            rejectedFiles: [],
            hasUploadError: false
        });
    };

    cbSaveSuccess = () => {
        console.log("cbSaveSuccess is success");
        let {onSubmit} = this.props;
        onSubmit();
    }

    cbSaveError = (err) => {
        console.log("cbSaveError ");
        this.setState({saving: false, error: err});
    }

    handleSubmit = () => {
        if (CsValidationForm.validate("IdeaForm") === false)
            return false;

        let file = null;
        //if( this.state.picture_update )
        {
            let [file_img] = this.state.files;
            file = file_img;
        }
        let formData = new FormData();
        formData.append('subject', this.state.subject);
        formData.append('priority', this.state.priority);
        formData.append('content', this.state.content);
        formData.append('email', 'test@test.com');

        if (file) {
            formData.append('picture', file)
        }

        let operation = this.context.AppName + '/inbox/post';
        RoadmapApiCall.post(operation, formData, this.cbSaveSuccess, this.cbSaveError);

        this.setState({saving: true});
        return true;
    };

    render() {
        console.log("IdeaForm: render", this.state);
        const {files, hasUploadError, rejectedFiles} = this.state;

        const fileUpload = !files.length && <DropZone.FileUpload/>;
        const uploadedFiles = files.length > 0 && (
            <div style={{padding: 50}}>
                <Stack vertical distribution="center" alignment="center">
                    {files.map(file => (
                        <Stack vertical distribution="center" alignment="center" key={file.name}>
                            <Stack.Item>
                                <Thumbnail size="large" alt={file.name} source={window.URL.createObjectURL(file)}/>
                            </Stack.Item>
                            <Stack.Item>
                                {file.name} <Caption>{file.size} bytes</Caption>
                            </Stack.Item>
                            <Stack.Item>
                                <Stack distribution="fillEvenly" alignment="center">
                                    <Stack.Item>
                                        {this.state.files.length > 0 && (
                                            <Button icon={DeleteMinor} destructive
                                                    onClick={this.remove}>{this.CsI18n.t("Remove")}</Button>
                                        )}
                                    </Stack.Item>

                                </Stack>
                            </Stack.Item>

                        </Stack>
                    ))}
                </Stack>
            </div>
        );

        const errorMessage = hasUploadError &&
            <Banner title={this.CsI18n.t("The following images could not be uploaded:")} status="critical">
                <List type="bullet">
                    {rejectedFiles.map((file, index) => <List.Item key={index}>
                        <this.CsI18n
                            filename={file.name}>{"{{filename}} is not supported. File type must be .gif, .jpg, .png or .svg."}</this.CsI18n>
                    </List.Item>)}
                </List>
            </Banner>;

        var help_link = <a className="Polaris-Link" href={Const.URL_TermsOfUse}
                           target="_blank">{this.CsI18n.t("Terms of Use")}</a>;

        return (
            <AppProvider>
                <Modal open={this.state.active}
                       onClose={this.props.onClose}
                       title={this.CsI18n.t("Submit new idea")}
                >
                    <Modal.Section>
                        <CsValidationForm name="IdeaForm">
                            <FormLayout>
                                <CsValidation>
                                    <TextField
                                        value={this.state.subject}
                                        onChange={(value) => {
                                            this.setState({subject: value})
                                        }}
                                        name="subject"
                                        label={this.CsI18n.t("Subject")}
                                        minLength="3"
                                    />
                                    <CsValidation.Item rule="required" title={this.CsI18n.t("Subejct is required")}/>
                                    <CsValidation.Item rule="minlength"
                                                       title={this.CsI18n.t("Subject must be more than 3 characters in length!")}/>
                                </CsValidation>
                                <CsValidation>
                                    <TextField
                                        value={this.state.content}
                                        type="text"
                                        onChange={(value) => {
                                            this.setState({content: value})
                                        }}
                                        name="content"
                                        label="Content"
                                        labelHidden={true}
                                        showCharacterCount={this.state.content.length > 0 ? true : false}
                                        // placeholder={this.CsI18n.t("What would you like to be able to do? How would that help you?")}
                                        minLength="50"
                                        multiline={5}
                                    />
                                    <CsValidation.Item rule="required" title={this.CsI18n.t("Content is required")}/>
                                    <CsValidation.Item rule="minlength"
                                                       title={this.CsI18n.t("Content must be more than 50 characters in length!")}/>
                                </CsValidation>
                                <Stack vertical>
                                    {errorMessage}
                                    <DropZone accept="image/*" type="image"
                                              onDrop={(files, acceptedFiles, rejectedFiles) => {
                                                  this.setState({
                                                      files: [...this.state.files, ...acceptedFiles],
                                                      rejectedFiles: rejectedFiles,
                                                      hasError: rejectedFiles.length > 0
                                                  });
                                              }} allowMultiple={this.state.files.length > 0 ? false : true}>
                                        {uploadedFiles}
                                        {fileUpload}
                                    </DropZone>
                                </Stack>
                                <ButtonGroup segmented>
                                    <p style={{fontWeight: "bold"}}>{this.CsI18n.t("How important is this to you?")}&nbsp;&nbsp;</p>
                                    <div className="roadmap-idea-btn"><Button monochrome={this.state.priority == 1}
                                                                              outline={this.state.priority == 1}
                                                                              onClick={this.handleNice}>{this.CsI18n.t("NICE-TO-HAVE")}</Button>
                                    </div>
                                    <Button primary={this.state.priority == 2} outline={this.state.priority != 2}
                                            onClick={this.handleImportant}>{this.CsI18n.t("IMPORTANT")}</Button>
                                    <Button destructive={this.state.priority == 3} outline={this.state.priority != 3}
                                            onClick={this.handleCritical}>{this.CsI18n.t("CRITICAL")}</Button>
                                </ButtonGroup>
                                <hr/>

                                {/*<TextField value={this.state.email} type="email" placeholder="E-Mail address" id="email" name="email" onChange={(value, id) => {this.setState({email: value})}} error={this.state.errors.email.length > 0} />*/}
                                {/*{this.state.errors.email.length > 0 ? (*/}
                                {/*    <InlineError message={this.state.errors.email} fieldID="email"/>*/}
                                {/*) : ""}*/}
                                <p>
                                    <this.CsI18n
                                        help_link={help_link}>{"By submitting you agree to the {{help_link}}"}</this.CsI18n>
                                </p>
                                <Stack>
                                    <Stack.Item fill/>
                                    <Stack.Item><Button
                                        onClick={this.props.onClose}>{this.CsI18n.t("Close")}</Button></Stack.Item>
                                    <Stack.Item>
                                        <Button primary={true} onClick={this.handleSubmit} disabled={this.state.saving}
                                                loading={this.state.saving}>{this.CsI18n.t("Sumbit")}</Button>
                                    </Stack.Item>
                                </Stack>
                            </FormLayout>
                        </CsValidationForm>
                    </Modal.Section>
                </Modal>
            </AppProvider>
        );
    }
}

export default IdeaForm;