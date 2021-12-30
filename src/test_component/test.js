import React from 'react'
import {
    AppProvider,
    Banner,
    Button,
    Caption,
    Card,
    Heading,
    List,
    DropZone,
    Page,
    Spinner,
    Stack,
    TextStyle,
    Thumbnail,
} from '@shopify/polaris';
import CsI18n from "../components/csI18n"

import AmazonTab from "../helpers/amazon-tab";
import ShopifyContext from "../context";
import ApplicationApiCall from "../functions/application-api-call";


// import CsTreeComponent from "./components/csTreeComponent"
import {Tree} from "antd";

import request from "superagent";

const STEP_UPLOAD = 1;
const STEP_UPLOADING = 2;
const STEP_UPLOADED = 3;
const STEP_PARSE = 4;
const STEP_PARSED = 5;
const STEP_POSTING = 6;
const STEP_POSTED = 7;

class Test extends AmazonTab {
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
        this.initialState = this.state;
        this.state.step = STEP_UPLOAD;

        let params = {
            configuration: this.shopify.getConfigurationSelected(),
            type: 'root'
        };
        ApplicationApiCall.get('/application/parameters/marketplaces', params, this.cbMarketplaces);
    }

    cbMarketplaces = (result) => {
        console.log('Marketplaces:', result);
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
            operation:'upload',
            type: this.getFileType(file)
        };
        ApplicationApiCall.upload('/application/offers/upload', params, file, this.cbUpload);

    }

    cbUpload = (err, res) => {
        let result = JSON.parse(res.text)

        console.log('API result:', result);

        if (result.status === 'Error') {
            this.displayError("The following file couln't be uploaded", result.message)
        } else {
            this.displaySuccess();
            if (result.data.processed && result.data.file.length) {
                console.log('processing', result.data.file);
                this.setState({toProcess:result.data.file});
                this.setState({step:STEP_UPLOADED});
            }
        }
    }

    parse() {
        var file = this.state.toProcess;

        console.log('Parse:', file);

        let params = {
            configuration: this.shopify.getConfigurationSelected(),
            marketplace_id:'A13V1IB3VIYZZH',
            operation:'parse',
            file:file
        };
        ApplicationApiCall.upload('/application/offers/upload', params, file, this.cbParse);
    }

    cbParse = (err, res) => {
        let result = JSON.parse(res.text)

        if (result.hasOwnProperty('data')) {
            this.state.summary.count = result.data.count;
            this.state.summary.items = result.data.items;
        } else {
            this.displayError("Failed to download summary")
        }
        this.setState({step:STEP_PARSED});
        console.log('API result:', result);
    }


    postOffers() {
        var file = this.state.toProcess;

        console.log('Parse:', file);

        let params = {
            configuration: this.shopify.getConfigurationSelected(),
            marketplace_id:'A13V1IB3VIYZZH',
            operation:'send',
            file:file
        };
        ApplicationApiCall.get('/application/offers/upload', params, this.cbPostOffers);

        this.setState({step:STEP_POSTING});
    }

    cbPostOffers = (result) => {
        console.log(result);
        if (result.hasOwnProperty('count')) {
            this.state.result.count = result.count;
            this.state.result.id = result.id;
        } else {
            this.displayError("Failed to create offers on Amazon")
        }
        this.setState({step:STEP_POSTED});
        console.log('API result:', result);
    }

    displayError = (title, message = false) => {
        const errorMessage = (
            <Banner
                title={title}
                status="critical"
            >
                {message ?
                    <List type="bullet">
                        <List.Item key={0}>
                            {message}
                        </List.Item>
                    </List>
                    : ''
                }
            </Banner>
        );

        this.setState({uploadError: errorMessage},
            () => setTimeout(function () {
                this.setState(this.initialState);
            }.bind(this), 5000)
        );

    }

    displaySuccess = () => {
        var [file] = this.state.files;
        const successMessage = (
            <Banner
                title={`"${file.name}" has been uploaded sucessfully`}
                status="success"
            >
            </Banner>
        );

        this.setState({uploadSuccess: successMessage});
        this.hideMessageAndReset();
    }

    hideMessageAndReset = () => {
        setTimeout(function () {
            // this.setState(prevState => ({
            //     ...prevState,
            //     ...this.initialState,
            // }),
            this.setState({uploadSuccess: false});
            //console.log('hideMessageAndReset, new state:', this.state);
        }.bind(this), 5000);
    }

    getFileType = (file) => {
        switch (file.type) {
            case 'application/zip':
            case 'application/octet-stream':
            case 'application/x-zip-compressed':
            case 'multipart/x-zip':
                return ('zip');
        }

        return file.name && file.name.match(/\.csv$/gi) ? 'csv' : false;
    }
    customValidator = (file) => {
        if (file instanceof DataTransferItem && !file.type.length) // case of csv dropped
            return (true);
        return (this.getFileType(file) ? true : false);
    };

    remove = () => {
        this.setState(this.initialState);
    };


    renderParsed()
    {
        console.log(this.state.summary);

        let summary = '';
        let text;
        let list = [];
        let banner_content = '';

        if (this.state.step == STEP_POSTED && this.state.result.hasOwnProperty('count'))
        {
            if (this.state.result.count == 1)
                text = `1 has been sent to Amazon, submission id: ${this.state.result.id}`
            else
                text = `${this.state.result.count} offers have been sent to Amazon, submission id: ${this.state.result.id}`

        } else if (this.state.summary.hasOwnProperty('count')) {

            if (this.state.summary.count == 1)
                text = `1 offer is eligible and can be created on Amazon`
            else
                text = `${this.state.summary.count} offers are eligible and can be created on Amazon`

            this.state.summary.items.forEach(function(item, index) {
                list.push(
                        <List.Item key={index}>
                            {item.sku}{' - '}{item.title}
                        </List.Item>
                )
            });

            banner_content =
                <p>
                    Once you will send the offers, they will appear as inactive on Amazon, then, on the next sync, as you configured your Rules they will be updated consequently.
                </p>
        }
        let action = null;

        if (this.state.step !== STEP_POSTED)
            action = {content: 'Create offers on Amazon', onAction:this.postOffers.bind(this), loading:this.state.step == STEP_POSTING, disable:this.state.step === STEP_POSTING};

        return(
            <div style={{margin:'15px 0 0 0'}}>
                <Card>
                    <Stack vertical>
                        <Stack.Item>
                            <div style={{padding:'15px 50px 15px 50px'}}>
                                <Banner
                                    title={text}
                                    status="success"
                                    action={action}
                                    onDismiss={() => {
                                        this.setState(this.initialState);
                                    }}>
                                    {banner_content}
                                </Banner>
                            </div>
                        </Stack.Item>

                            <Stack.Item>
                                {this.state.step != STEP_POSTED ?
                                <div style={{padding: '0 50px 50px 50px'}}>
                                    <Heading>Sample eligible products</Heading>
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

    renderProcessing()
    {
        return(
            <div align="center" style={{margin:'15px 0 0 0'}}>
                <Card>
                    <div align="center" style={{padding:50}}>
                        <Stack vertical distribution="center">
                            <Stack.Item>
                                <TextStyle>{CsI18n.t("Processing")}</TextStyle>
                            </Stack.Item>
                            <Stack.Item>
                                <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Processing")}></Spinner>
                            </Stack.Item>
                        </Stack>
                    </div>
                </Card>
            </div>

        )
    }
    render() {

        console.log('render() - state:', this.state);

        var rendered = '';

        switch(this.state.step) {
            case STEP_UPLOADED:
                this.parse();

                setTimeout(function () {
                    this.setState({step: STEP_PARSE});
                }.bind(this), 1000);
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
                    actionHint="Drop here only single file (Zip or CSV)"
                    actionTitle="Select file"
                />
            );

        const inactive_buttons = this.state.step !== STEP_UPLOAD;

        const uploadedFiles = files.length > 0 && (
                <div style={{padding:50}}>
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
                                                        onClick={this.remove}>Remove</Button>
                                            )}
                                        </Stack.Item>
                                        <Stack.Item>
                                            {this.state.files.length > 0 && (
                                                <Button primary loading={this.state.step === STEP_UPLOADING ? true : false}
                                                        disabled={inactive_buttons}
                                                        onClick={() => this.upload()}>Upload</Button>
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
                    title="The following images couldn’t be uploaded:"
                    status="critical"
                >
                    <List type="bullet">
                        {rejectedFiles.map((file, index) => (
                            <List.Item key={index}>
                                {`"${file.name}" is not supported. File type must be .zip, .csv`}
                            </List.Item>
                        ))}
                    </List>
                </Banner>
            );

        return (
            <AppProvider
                apiKey={this.shopify.dev ? this.shopify.api_key : ""}
                shopOrigin={this.shopify.dev ? this.shopify.domain : ""}
            >
                <Page>
                    <div style={{display:'none'}}>
                        {/* Purpose of those thumbnails is to cache the images */}
                        <Thumbnail source={this.getFileIcon({name:'sample.csv',type:'csv'})} />
                        <Thumbnail source={this.getFileIcon({name:'sample.zip',type:'zip'})} />
                    </div>

                    {!this.state.uploadSuccess ? this.state.uploadError : ''}
                    {!this.state.uploadError ? this.state.uploadSuccess : ''}
                    {errorMessage}
                    <DropZone
                        label="Upload an inventory file to create automatically offers on Amazon"
                        dropOnPage={true}
                        allowMultiple={files.length == 0}
                        customValidator={this.customValidator}
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
                </Page>
            </AppProvider>
        );
    }
}
export default Test;