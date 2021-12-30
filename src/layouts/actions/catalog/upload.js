import React from 'react'
import {
    Banner,
    Button,
    Caption,
    Card,
    Heading,
    List,
    DropZone,
    Spinner,
    Stack,
    TextStyle,
    Thumbnail,
} from '@shopify/polaris';
import {DeleteMinor, PlusMinor} from "@shopify/polaris-icons";
import CsI18n from "../../../components/csI18n"

import AmazonTab from "../../../helpers/amazon-tab";
import Util from "../../../helpers/Util";
import ShopifyContext from "../../../context";
import ApplicationApiCall from "../../../functions/application-api-call";

import CsErrorMessage from "../../../components/csErrorMessage";

const STEP_GET_STARTED = 0;
const STEP_UPLOAD = 1;
const STEP_UPLOADING = 2;
const STEP_UPLOADED = 3;
const STEP_PARSE = 4;
const STEP_PARSED = 5;
const STEP_POSTING = 6;
const STEP_POSTED = 7;
const UPLOAD = 1;
const PARSE = 2;
const POSTOFFERS = 3;

class Upload extends AmazonTab {
    state = {
        files: [],
        rejectedFiles: [],
        summary: {},
        result: {},
        hasError: false,
        uploadError: false,
        uploadSuccess: false,
    };

    constructor(props) {
        super(props);

        this.shopify = ShopifyContext.getShared();
        this.initialState = Util.clone(this.state);
        this.state.step = STEP_GET_STARTED;
        this.marketplaceInfo = props.marketplaceInfo;
        this.selectedConfiguration = this.getConfigurationSelectedIndex();
        this.unMounted = false;
    }

    componentWillUnmount() {
        this.unMounted = true;
    }

    componentWillReceiveProps(nextProps) {
        super.componentWillReceiveProps(nextProps);
        console.log("componentWillReceiveProps", nextProps);

        if (this.marketplaceInfo.MarketplaceId !== nextProps.marketplaceInfo.MarketplaceId || this.selectedConfiguration !== this.getConfigurationSelectedIndex()) {
            this.marketplaceInfo = nextProps.marketplaceInfo;
            this.selectedConfiguration = this.getConfigurationSelectedIndex();
            this.setState({...Util.clone(this.initialState), step: STEP_GET_STARTED});
        }
    }

    getFileIcon = (file) => {
        let img = null;
        switch (this.getFileType(file)) {
            case 'zip':
                img = ShopifyContext.getShared().static_content + '/amazon/zip.png';
                break;
            case 'csv':
                img = ShopifyContext.getShared().static_content + '/amazon/csv.png';
                break;
        }
        return (img);
    }

    upload() {

        this.setState({step: STEP_UPLOADING});
        var [file] = this.state.files;
        console.log('Upload:', file);


        let params = {
            configuration: this.shopify.getConfigurationSelected(),
            operation: 'upload',
            type: this.getFileType(file)
        };
        ApplicationApiCall.upload('/application/offers/upload', params, file, this.cbUpload, this.cbUploadError(UPLOAD));
    }

    cbUpload = (res) => {
        let result = JSON.parse(res.text)
        console.log('Upload:', result);


        if (result.status === 'Ok' && this.unMounted === false) {
            this.displaySuccess();
            if (result.data.processed && result.data.file.length) {

                this.setState({toProcess: result.data.file});
                this.setState({step: STEP_UPLOADED});
            }
        }
    }

    parse() {
        var file = this.state.toProcess;
        console.log('Parse:', file);


        let params = {
            configuration: this.shopify.getConfigurationSelected(),
            marketplace_id: this.marketplaceInfo.MarketplaceId,
            operation: 'parse',
            file: file
        };
        ApplicationApiCall.upload('/application/offers/upload', params, file, this.cbParse, this.cbUploadError(PARSE));
        this.setState({step: STEP_PARSE});
    }

    cbParse = (res) => {
        let result = JSON.parse(res.text)
        if(this.unMounted === false){
            if (result.hasOwnProperty('data')) {
                this.state.summary.count = result.data.count;
                this.state.summary.items = result.data.items;
            }
            this.setState({step: STEP_PARSED});
            console.log('API result:', result);

        }
    }


    postOffers() {
        var file = this.state.toProcess;
        console.log('postOffers:', file);


        let params = {
            configuration: this.shopify.getConfigurationSelected(),
            marketplace_id: this.marketplaceInfo.MarketplaceId,
            operation: 'send',
            file: file
        };
        ApplicationApiCall.get('/application/offers/upload', params, this.cbPostOffers, this.cbUploadError(POSTOFFERS), false);

        this.setState({step: STEP_POSTING});
    }



    cbPostOffers = (result) => {
        console.log(result);

        if(this.unMounted === false){
            this.state.result.message = result;
            this.setState({step: STEP_POSTED});
            console.log('API result:', result);
        }
    }

    cbUploadError = (type) => (err) => {
        console.log(err);


        let errorTitle = '';

        if(err && this.unMounted === false){
            setTimeout(() => {
                this.setState({...Util.clone(this.initialState), step: STEP_UPLOAD});
            }, 5000)

            switch (type) {
                case UPLOAD:
                    errorTitle = CsI18n.t('The following file couldn\'t be uploaded');
                    break;
                case PARSE:
                    errorTitle = CsI18n.t('Failed to download summary');
                    break;
                case POSTOFFERS:
                    errorTitle = CsI18n.t('Failed to create offers on Amazon');
                    break;
            }

            let uploadError = <CsErrorMessage
                                errorTitle={errorTitle}
                                errorMessage={err.message}
                                />

            this.setState({uploadError: uploadError, step: UPLOAD});
        }
    }

    displaySuccess = () => {
        var [file] = this.state.files;
        const successMessage = (
            <Banner
                title={CsI18n.t("{{filename}} has been uploaded successfully", {filename: file.name})}
                status="success"
            >
            </Banner>
        );

        this.setState({uploadSuccess: successMessage},
            () => setTimeout(function () {
                this.setState({uploadSuccess: false});
            }.bind(this), 5000)
        );

    }

    getFileType = (file) => {
        switch (file.type) {
            case 'application/zip':
            case 'application/octet-stream':
            case 'application/x-zip-compressed':
            case 'multipart/x-zip':
                return ('zip');
            case 'application/vnd.ms-excel':
                return 'csv';
        }

        return file.name && file.name.match(/\.csv$/gi) ? 'csv' : false;
    }

    customValidator = (file) => {
        if (file instanceof DataTransferItem && !file.type.length) // case of csv dropped
            return (true);
        let file_type = this.getFileType(file);
        return file_type? true : false;
    };

    remove = () => {
        this.setState({...Util.clone(this.initialState), step: STEP_UPLOAD});
    };


    renderParsed() {
        console.log(this.state.summary);

        let summary = '';
        let text;
        let list = [];
        let banner_content = '';
        let message;

        if (this.state.step == STEP_POSTED && this.state.result.hasOwnProperty('message')) {
            text = this.state.result.message;
            return (
                <Stack vertical>
                    <Stack.Item>
                        <div style={{padding: '15px 0 0 0'}}>
                            <Banner
                                title={text}
                                status="success"
                                onDismiss={() => {
                                    this.setState({...Util.clone(this.initialState), step: STEP_UPLOAD});
                                }}

                            />
                        </div>
                    </Stack.Item>
                </Stack>
            )
        } else if (this.state.summary.hasOwnProperty('count')) {

            if (this.state.summary.count == 1)
                text = CsI18n.t(`1 offer is eligible and can be created on Amazon`)
            else
                text = CsI18n.t(`{{summary_count}} offers are eligible and can be created on Amazon`,{summary_count: this.state.summary.count})

            if(this.state.summary.count === 0){
                message = "Sorry, we didn't find any offer in your file.";
            }else{
                message = "Once you will send the offers, they will appear as inactive on Amazon, then, on the next sync, as you configured your Rules, they will be updated consequently.";
            }


            banner_content =
                <p>
                    <CsI18n>{message}</CsI18n>
                </p>

            this.state.summary.items.forEach(function (item, index) {
                list.push(
                    <List.Item key={index}>
                        {item.sku}{' - '}{item.title}
                    </List.Item>
                )
            });

        }
        let action = null;
        let status = null;

        if (this.state.step !== STEP_POSTED) {
            if (this.state.summary.count !== 0) {
                action = {
                    content: 'Create offers on Amazon',
                    onAction: this.postOffers.bind(this),
                    loading: this.state.step == STEP_POSTING,
                    disable: this.state.step === STEP_POSTING
                };
                status = 'success';
            }else{
                status = 'warning';
            }
        }

        return (
            <div style={{margin: '15px 0 0 0'}}>
                <Card>
                    <Stack vertical>
                        <Stack.Item>
                            <div style={{padding: '15px 50px 15px 50px'}}>
                                <Banner
                                    title={text}
                                    status={status}
                                    action={action}
                                    onDismiss={() => {
                                        this.setState({...Util.clone(this.initialState), step: STEP_UPLOAD});
                                    }} >
                                    {banner_content}
                                </Banner>
                            </div>
                        </Stack.Item>

                        <Stack.Item>
                            {this.state.step != STEP_POSTED && this.state.summary.count !== 0 ?
                                <div style={{padding: '0 50px 50px 50px'}}>
                                    <Heading><CsI18n>Sample eligible products</CsI18n></Heading>
                                    <List type="bullet">
                                        {list}
                                    </List>
                                </div>
                                : ''
                            }
                        </Stack.Item>

                    </Stack>
                </Card>
            </div>
        )
    }

    renderProcessing() {
        return (
            <div align="center" style={{margin: '15px 0 0 0'}}>
                <Card>
                    <div align="center" style={{padding: 50}}>
                        <Stack vertical distribution="center">
                            <Stack.Item>
                                <TextStyle>{CsI18n.t("Processing")}</TextStyle>
                            </Stack.Item>
                            <Stack.Item>
                                <Spinner size="large" color="teal"
                                         accessibilityLabel={CsI18n.t("Processing")}></Spinner>
                            </Stack.Item>
                        </Stack>
                    </div>
                </Card>
            </div>

        )
    }


    renderGetStarted()
    {
        let action = {
            content: CsI18n.t('Get started'),
            onAction: () => {
                this.setState(prevState => ({...prevState, step: STEP_UPLOAD}))
            },
            loading: false,
            disable: false
        };
        return(
            <Stack vertical>
                <Stack.Item>
                    <br />
                </Stack.Item>
                <Stack.Item>
                    <Banner
                        title={CsI18n.t("Upload offers")}
                        action={action}
                    >
                        <p>
                            <CsI18n>You can upload a CSV or ZIP file containing your offers.</CsI18n><br />
                            <CsI18n>The file should contain the SKU, EAN or ASIN. Once the file uploaded, offers will be created automatically on Amazon.</CsI18n>
                        </p>

                    </Banner>
                </Stack.Item>
                <Stack.Item>
                    <br />
                </Stack.Item>
            </Stack>
        )
    }

    render() {
        console.log('render() - state:', this.state);

        var rendered = '';

        switch (this.state.step) {
            case STEP_GET_STARTED:
                return(this.renderGetStarted());

            case STEP_UPLOADED:
                this.parse();

                // setTimeout(() => {
                //     this.setState({step: STEP_PARSE});
                // }, 1000);
                break;
            case STEP_PARSE:
                rendered = this.renderProcessing();
                break;
            case STEP_PARSED:
            case STEP_POSTING:
            case STEP_POSTED:
                rendered = this.renderParsed();
                break;
        }


        const {files, hasError, rejectedFiles} = this.state;

        const fileUpload = !files.length && (
                <DropZone.FileUpload
                    actionHint={CsI18n.t("Drop here a single file (Zip or CSV)")}
                    actionTitle={CsI18n.t("Select file")}
                />
            );

        const inactive_buttons = this.state.step !== STEP_UPLOAD;

        const uploadedFiles = files.length > 0 && (
                <div style={{padding: 50}}>
                    <Stack vertical distribution="center" alignment="center">
                        {files.map(file => (
                            <Stack vertical distribution="center" alignment="center" key={file.name}>
                                <Stack.Item>
                                    <Thumbnail
                                        size="large"
                                        alt={file.name}
                                        source={this.getFileIcon(file)}
                                    />
                                </Stack.Item>
                                <Stack.Item>
                                    {file.name} <Caption>{file.size} bytes</Caption>
                                </Stack.Item>
                                <Stack.Item>
                                    <Stack distribution="fillEvenly" alignment="center">
                                        <Stack.Item>
                                            {this.state.files.length > 0 && (
                                                <Button icon={DeleteMinor} disabled={inactive_buttons} destructive
                                                        onClick={this.remove}><CsI18n>Remove</CsI18n></Button>
                                            )}
                                        </Stack.Item>
                                        <Stack.Item>
                                            {this.state.files.length > 0 && (
                                                <Button primary
                                                        loading={this.state.step === STEP_UPLOADING ? true : false}
                                                        disabled={inactive_buttons}
                                                        onClick={() => this.upload()}><CsI18n>Upload</CsI18n></Button>
                                            )}
                                        </Stack.Item>
                                    </Stack>
                                </Stack.Item>

                            </Stack>
                        ))}
                    </Stack>
                </div>
            );

        const errorMessage = hasError && (
                <Banner
                    title={CsI18n.t("The following file couldn’t be uploaded:")}
                    status="critical"
                >
                    <List type="bullet">
                        {rejectedFiles.map((file, index) => (
                            <List.Item key={index}>
                                <CsI18n filename={file.name}>{`"{{filename}}" is not supported. File type must be .zip, .csv`}</CsI18n>
                            </List.Item>
                        ))}
                    </List>
                </Banner>
            );

        return (
                <Stack>
                    <Stack.Item fill>
                        <div style={{display: 'none'}}>
                            {/* Purpose of those thumbnails is to cache the images */}
                            <Thumbnail source={this.getFileIcon({name: 'sample.csv', type: 'csv'})}/>
                            <Thumbnail source={this.getFileIcon({name: 'sample.zip', type: 'zip'})}/>
                        </div>
                        <br />


                        {this.state.uploadError ? this.state.uploadError : ''}
                        {!this.state.uploadError ? this.state.uploadSuccess : ''}
                        {errorMessage}
                        <DropZone
                            label={CsI18n.t("Upload an inventory file to create automatically offers on Amazon")}
                            dropOnPage={true}
                            allowMultiple={files.length == 0}
                            customValidator={this.customValidator}
                            accept={".csv,.zip,application/vnd.ms-excel,application/zip,application/octet-stream,application/x-zip-compressed,multipart/x-zip"}
                            onDrop={(files, acceptedFiles, rejectedFiles) => {
                                console.log("onDrop", files, acceptedFiles, rejectedFiles);

                                this.setState(
                                    {
                                        files: [...acceptedFiles],
                                        rejectedFiles: rejectedFiles,
                                        hasError: rejectedFiles.length > 0
                                    },
                                );
                            }}
                        >
                            {uploadedFiles}
                            {fileUpload}

                        </DropZone>
                        {rendered}
                    </Stack.Item>
                </Stack>
        );
    }

}
export default Upload;
