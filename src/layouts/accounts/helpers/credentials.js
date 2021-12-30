import React, {useState, useEffect} from 'react'
import CsI18n from "./../../../components/csI18n"
import {
    Layout,
    Caption,
    Card,
    Checkbox,
    Icon,
    Label,
    Link,
    Button,
    ButtonGroup,
    Stack,
    FormLayout,
    TextContainer,
    TextField,
    TextStyle,
    AccountConnection,
    Spinner,
    Select,
    Banner,
    Modal, Tooltip, ChoiceList, Collapsible,
    //Alert
} from '@shopify/polaris';

import {QuestionMarkMajorTwotone, DeleteMinor, PlusMinor, CircleInformationMajorMonotone} from '@shopify/polaris-icons';


import ConfigurationApiCall from './../../../functions/configuration-api-call'
import ApplicationApiCall from './../../../functions/application-api-call'
import {CsValidationForm, CsValidation} from '../../../components/csValidationForm'
import Util from '../../../helpers/Util'
import Cache from '../../../helpers/Cache'
import CsErrorMessage from "../../../components/csErrorMessage";
import {ErrorType} from "../../../components/csErrorMessage/csErrorMessage";
import CsEmbeddedModal from "../../../components/csEmbeddedModal";
import Help from "../../../help";
import ChargeConfirmModal from "../chargeConfirmModal";
import ShopifyContext, {amazon_regions} from "../../../context";
import CsHelpButton from "../../../components/csHelpButton";
import CsVideoTutorialButton from "../../../components/csVideoTutorialButton";
import VideoTutorial from "../../../helpers/VideoTutorial";

class Credentials extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedId: false,
            error: false,
            update: false,
            render: false,
            deleting: false,
            processing: false,
            open_delete_modal: false,
            open_charge_modal: false,
            charge_params: null,
            edit_amazon: [],
            advanced_connect: false, //todo restore when using oauth
            duplicated: false,
            oauth: false,
        };
        this.validations = {
            seller_id: {state: null, message: CsI18n.t('Seller Id is required')}
        };
        this.shopify = ShopifyContext.getShared();
        this.state.edit_amazon = Util.clone(this.shopify.amazon);
        this.next_id = this.shopify.amazon.length;
    }

    handleChargeModalOk = () => {
        this.saveValidAccount();
    }

    render() {
        return this.editAccount();
    }

    editAccount() {
        const add = this.props.addAccount === true;
        const selectedId = add ? this.next_id : this.props.selectedId;

        console.log('this.props.addAccount', this.props.addAccount);

        if (!selectedId) {
            // return ('');
        }

        let error_message = null;
        let spinner = null;
        let contextual_message = null;
        let name = '';
        let seller_id = '';
        let mws_token = '';
        let marketplace_id = '';
        let region = '';
        let label = '';
        // let preferred = false;

        if (this.validations.seller_id.state && this.validations.seller_id.message) {
            error_message = <CsI18n>Seller ID is required</CsI18n>;
        }
        // if (this.state.processing) {
        //     spinner = <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Processing")}></Spinner>;
        // }
        if (this.state.error) {
            contextual_message = <CsErrorMessage
                errorType={this.state.error.type}
                errorTitle={this.state.error.title}
                errorMessage={this.state.error.message}
            />;
        } else if (this.state.saved) {
            contextual_message = <Banner status="success" title={CsI18n.t("Account saved successfully")}/>;
        } else if (this.state.deleted) {
            contextual_message = <Banner status="success" title={CsI18n.t("Account deleted successfully")}/>;
        } else if (this.state.duplicated)
            contextual_message = <Banner status="critical" title={CsI18n.t("Name must be unique")}/>

        if (add) {
            if (this.state.edit_amazon[selectedId] === undefined) {
                this.addNew();
            }

            name = this.state.edit_amazon[selectedId].name;
            seller_id = this.state.edit_amazon[selectedId].seller_id;
            mws_token = this.state.edit_amazon[selectedId].mws_token;
            marketplace_id = this.state.edit_amazon[selectedId].marketplace_id;
            region = this.state.edit_amazon[selectedId].region;
            // preferred = this.state.edit_amazon[selectedId].preferred == 1 ? true : false;
            label = <CsI18n>Connect a new account</CsI18n>;
        } else {
            name = this.state.edit_amazon[selectedId].name;
            seller_id = this.state.edit_amazon[selectedId].seller_id;
            mws_token = this.state.edit_amazon[selectedId].mws_token;
            marketplace_id = this.state.edit_amazon[selectedId].marketplace_id;
            region = this.state.edit_amazon[selectedId].region;
            // preferred = this.state.edit_amazon[selectedId].preferred == 1 ? true : false;
            let amazon_region = amazon_regions.filter(obj => {
                return obj.value === region;
            })[0];
            label = <CsI18n platform={amazon_region ? amazon_region.label : ''}>{"{{platform}} Account"}</CsI18n>;
        }
        let url = Help.getHelpUrl("connect");
        const label_with_help = <Stack spacing={"tight"}>
            <Stack.Item><TextStyle variation="strong">{label}</TextStyle></Stack.Item>
            <Stack.Item><CsHelpButton page={"Connect"} tag={"connect"}/></Stack.Item>
            <Stack.Item><CsVideoTutorialButton url={VideoTutorial.connect}/></Stack.Item>
        </Stack>
        // const preferred_text = <TextStyle variation="subdued"><CsI18n>Preferred</CsI18n><Caption><CsI18n>Account displayed by default</CsI18n></Caption></TextStyle>;

        const name_is_readonly = !add;
        var name_label = null;
        if (name_is_readonly)
            name_label = <Label><CsI18n>Name</CsI18n><Caption><CsI18n>The account name cannot be
                changed</CsI18n></Caption></Label>;
        else
            name_label = <Label><CsI18n>Name</CsI18n><Caption><CsI18n>Give a name that is unique, friendly and easy to
                remember</CsI18n></Caption></Label>;

        const seller_label = <Label><CsI18n>Seller ID</CsI18n><Caption><CsI18n>Amazon Seller ID shown in your
            account</CsI18n></Caption></Label>;
        var help_link = <a className="Polaris-Link" href={url} target="_blank|_top">{CsI18n.t("documentation")}</a>;
        const token_label = <Label><CsI18n>Developer Token</CsI18n><Caption><CsI18n
            help_link={help_link}>{"Credentials for the App, please read the {{help_link}}"}</CsI18n></Caption></Label>;
        const demo_mode = this.shopify.isDemoMode();

        console.log(name, seller_id, mws_token, region, marketplace_id, label);
        let amazon_region_label = '';
        let developer_id = '';
        for (let amazon_region of amazon_regions) {
            if (amazon_region.value == region) {
                amazon_region_label = amazon_region.label;
                developer_id = amazon_region.developer_id;
            }
        }
        let amazon_regions_options = amazon_regions.map((option) => {
            let {value, label, available} = option;
            return {value, label: (CsI18n.t(label) + (!available? (" " + CsI18n.t("(unavailable yet)")):'')), disabled: !available}
        });

        return (
            <Card sectioned
                  title={label_with_help}
            >
                <CsValidationForm name="credentialform">
                    <FormLayout>
                        {contextual_message}

                        <FormLayout.Group>
                            <CsValidation>
                                <TextField
                                    value={name}
                                    label={name_label}
                                    placeholder={CsI18n.t("Amazon USA - account 1")}
                                    maxLength="32"
                                    error={error_message}
                                    onChange={this.valueUpdater('name')}
                                    readOnly={demo_mode || name_is_readonly}
                                />
                                <CsValidation.Item rule="required" title={CsI18n.t("Name is required")}/>
                                <CsValidation.Item rule="maxLength"
                                                   title={CsI18n.t("Name can't exceed 32 characters")}/>
                            </CsValidation>
                        </FormLayout.Group>
                        <Select
                            label={CsI18n.t("Region")}
                            options={amazon_regions_options}
                            onChange={this.valueUpdater('region')}
                            value={region}
                        />
                        <FormLayout.Group>
                        <Checkbox
                                checked={this.state.advanced_connect}
                                label={CsI18n.t('Enter the amazon developer token manually.')}
                                onChange={()=>{this.setState(prev_state => {return {advanced_connect: !prev_state.advanced_connect}})}}
                            />
                        </FormLayout.Group>
                        <Collapsible open={this.state.advanced_connect} id="advanced-collapsible">
                            <div className={"ml-2 mb-5"}>
                                <Stack alignment={"trailing"}>
                                    <Stack.Item>
                                                    <CsValidation>
                                                        <TextField
                                                            value={seller_id}
                                                            label={seller_label}
                                                            placeholder="A1MS0E6JGRXXX3"
                                                            maxLength="32"
                                                            pattern="[0-9A-Z]{12,}"
                                                            error={error_message}
                                                            onChange={this.valueUpdater('seller_id')}
                                                            readOnly={demo_mode}
                                                        />
                                                        <CsValidation.Item rule="required"
                                                                           title={CsI18n.t("The seller ID is required")}/>
                                                        <CsValidation.Item rule="maxLength"
                                                                           title={CsI18n.t("The seller ID can't exceed 16 characters")}/>
                                                        <CsValidation.Item rule="pattern"
                                                                           title={CsI18n.t("The seller ID you entered seems to be incorrect")}/>
                                                    </CsValidation>
                                    </Stack.Item>
                                    {/*<Stack.Item>*/}
                                    {/*    <Button onClick={this.openOauth} loading={this.state.oauth}*/}
                                    {/*            disabled={this.state.oauth}><CsI18n>Get developer token</CsI18n></Button>*/}
                                    {/*</Stack.Item>*/}
                                </Stack>
                            </div>
                            <div className={"mb-5"}>
                                <div className={'mb-2'}>
                                <CsValidation>
                                    <TextField
                                        value={mws_token}
                                        label={token_label}
                                        placeholder="amzn.mws.70b333d1-1d11-d222-07da-333337f4d7e0"
                                        onChange={this.valueUpdater('mws_token')}
                                        readOnly={demo_mode}
                                    />
                                    <CsValidation.Item rule="required" title={CsI18n.t("The Developer Token is required")}/>
                                </CsValidation>
                                </div>
                                <Stack spacing={"tight"}>
                                    <Stack.Item><Icon source={CircleInformationMajorMonotone} color={"green"}/></Stack.Item>
                                    <Stack.Item>{CsI18n.t("Developer Name:")}&nbsp;<b>Feed.biz</b> - Developer ID
                                        for {amazon_region_label}:&nbsp;<b>{developer_id}</b></Stack.Item>
                                </Stack>
                            </div>
                        </Collapsible>
                        {/*<Checkbox
                                checked={preferred}
                                label={preferred_text}
                                onChange={this.valueUpdater('preferred')}
                            />*/}

                        <Stack wrap={false}>
                            <Stack.Item fill>
                                {this.props.addAccount !== true ?
                                    <Button icon={DeleteMinor} onClick={this.deleteAccountConfirmation.bind(this)}
                                            loading={this.state.deleting} disabled={demo_mode || this.state.deleting}
                                            destructive><CsI18n>Delete</CsI18n></Button>
                                    : ""}
                            </Stack.Item>
                            <Stack.Item>
                                <ButtonGroup>
                                    <Button onClick={this.closeForm}><CsI18n>Close</CsI18n></Button>
                                    <Button onClick={this.saveForm} loading={this.state.processing}
                                            disabled={demo_mode || this.state.processing} primary>{this.state.advanced_connect? CsI18n.t("Save"):CsI18n.t("Save & Authorize")}</Button>
                                </ButtonGroup>

                            </Stack.Item>
                        </Stack>
                    </FormLayout>
                </CsValidationForm>

                {this.renderDeleteModal()}
                {this.renderChargeModal()}
            </Card>
        );
    }

    renderDeleteModal() {
        return <CsEmbeddedModal
            open={this.state.open_delete_modal}
            onClose={this.handleToggleModal}
            title={CsI18n.t("Delete")}
            primaryAction={{
                content: <CsI18n>Delete</CsI18n>,
                onAction: this.handleDelete,
                destructive: true
            }}
            secondaryActions={[
                {
                    content: <CsI18n>Cancel</CsI18n>,
                    onAction: this.handleToggleModal
                }
            ]}
        >
            <Modal.Section>
                <TextContainer>
                    <p><CsI18n>Are you sure you want to delete this account?</CsI18n></p>
                </TextContainer>
            </Modal.Section>
        </CsEmbeddedModal>
    }

    renderChargeModal() {
        if (!this.state.open_charge_modal) {
            return null;
        }
        let {price, trial_days, course_type} = this.state.charge_params;
        return <ChargeConfirmModal
            onOk={this.handleChargeModalOk}
            onClose={() => {
                this.setState({open_charge_modal: false})
            }
            }
            opened={this.state.open_charge_modal}
            price={price}
            trial_days={trial_days}
            course_type={course_type}
        />
    }

    valueUpdater(field) {
        return (value) => this.validateField({[field]: value});
    }

    addNew() {
        const current_id = this.shopify.amazon.length - 1;
        this.state.edit_amazon[this.next_id] = {};
        for (var key in this.shopify.amazon[current_id]) {
            this.state.edit_amazon[this.next_id][key] = '';
        }
        this.state.edit_amazon[this.next_id].region = amazon_regions[0].value;
        console.log(this.state.edit_amazon[this.next_id]);
    }

    validateField(fieldset) {
        let field = Object.keys(fieldset)[0];
        let value = fieldset[field];
        let selectedId = this.props.addAccount ? this.next_id : this.props.selectedId;

        this.state.edit_amazon[selectedId][field] = value;
        this.setState({render: true});
        return (value);
    }

    handleToggleModal = () => {
        console.log('this.shopify.amazon.length');
        console.log(this);

        this.setState(({open_delete_modal}) => ({
            open_delete_modal: !open_delete_modal
        }));
    };

    handleDelete = () => {
        console.log(this);

        this.handleToggleModal();
        this.deleteAccount();
    };

    handleDeleteAccount() {
        const selectedId = this.props.selectedId;
        setTimeout(() => {
            this.setState({deleted: false});
            this.props.action('delete', selectedId);
        }, 5000);
        this.setState({deleting: false, deleted: true});
    }

    handleDuplicated() {
        let valueArr = this.state.edit_amazon.map(function (item) {
            return item.name
        }); //// fixed the error @kbug_190106
        console.log(valueArr);
        let isDuplicate = valueArr.some(function (item, idx) {
            return valueArr.indexOf(item) != idx
        });
        if (isDuplicate) {
            this.setState({duplicated: true});
            return (true);
        }
        return (false);
    }

    cbAccountError = (err) => {
        console.log("Delete Account ");
        console.log(this.props.selectedId);
        console.log(this.state.open_delete_modal);

        // setTimeout(() => {
        //   this.setState({error: null})
        // }, 5000)

        this.setState({error: err, processing: false, deleting: false});
    }

    deleteAccountConfirmation() {
        console.log("Delete Account ");
        console.log(this.props.selectedId);
        console.log(this.state.open_delete_modal);

        this.handleToggleModal();
    }

    deleteAccount() {
        const selectedId = this.props.selectedId;
        let params = {
            'store': this.shopify.store,
            'version': this.shopify.version,
            'section': 'amazon',
            'configuration': this.shopify.amazon[selectedId].configuration
        };
        //var amazon = this.shopify.amazon[selectedId];
        //var data = {...params, ...amazon};
        this.setState({deleting: true});
        ConfigurationApiCall.get('delete', params, this.handleDeleteAccount.bind(this), this.cbAccountError.bind(this));
    }

    cbSaveForm = (data) => {
        if (data.success) {
            console.log('Ok ....', data);

            if (data.need_confirm) {
                Cache.clearAll();
                Util.redirect(data.confirm_url);
            } else {
                let currentId = this.props.addAccount ? this.next_id : this.props.selectedId;
                console.log('cbSaveForm', currentId, this.state.edit_amazon)
                this.state.edit_amazon[currentId] = data.result;

                setTimeout(() => {
                    this.setState({saved: false})
                    this.props.action('close');
                }, 5000)
                this.props.action('add', currentId, this.state.edit_amazon);
                this.setState({saved: true, processing: false});
            }
            // this.props.action('render'); // update parent component list
        } else {
            let error = {
                title: CsI18n.t("Error"),
                message: CsI18n.t(data.error_message),
            }
            this.setState({error: error, processing: false});
        }
    }

    saveForm = () => {
        if (CsValidationForm.validate("credentialform") === false) //added by @kbug 20181218
            return;

        if (this.handleDuplicated()) {
            return;
        }

        const selectedId = this.props.addAccount ? this.next_id : this.props.selectedId;

        let data = this.state.edit_amazon[selectedId];
        let is_new = this.props.addAccount === true ? 1 : 0;
        if (this.state.advanced_connect) {
            let params = {
                'store': this.shopify.store,
                'version': this.shopify.version,
                'is_new': is_new,
                'name': data.name,
                'seller_id': data.seller_id,
                'mws_token': data.mws_token,
                'region': data.region,
                'configuration': is_new? 'global':data.configuration
                // 'marketplace_id': data.marketplace_id,
            };

            this.setState({['processing']: true});

            ApplicationApiCall.get('/application/account/check', params, this.cbAccountCheck, this.cbAccountError);
        } else {
            let params = {
                'store': this.shopify.store,
                'version': this.shopify.version,
                'is_new': is_new,
                'name': data.name,
                'region': data.region,
                'configuration': is_new? 'global':data.configuration
            };

            this.setState({['processing']: true});

            ApplicationApiCall.get('/application/account/authorize', params, this.cbAccountAuthorize, this.cbAccountError);
        }
    }

    cbAccountAuthorize = (data) => {
        console.log("cbAccountAuthorize", data);
        if (data.oauth_uri) {
            Cache.clearAll();
            Util.redirect(data.oauth_uri);
        }
    }

    cbAccountCheck = (data) => {
        const error_number = data.error;
        if (error_number == 0) {
            this.setMarketplaceId(data.marketplace_id);
            this.saveValidAccount();
        } else if (error_number == 10) {
            this.setMarketplaceId(data.marketplace_id);
            this.setState({processing: false, open_charge_modal: true, charge_params: data.charge_params});
        } else {
            let error;
            if (error_number == 1) {
                if (data.error_message) {
                    error = {
                        title: data.error_code,
                        message: data.error_message,
                    }
                } else {
                    error = {
                        title: CsI18n.t("Invalid account"),
                        message: CsI18n.t("Your amazon marketplace account is invalid. Please add valid account"),
                    }
                }
            } else if (error_number == 2) {
                error = {
                    title: CsI18n.t("Invalid Seller Id"),
                    message: CsI18n.t("Seller Id is already existing in our database and can be only used once"),
                }
            }
            this.setState({error: error, processing: false});
        }
    }

    setMarketplaceId(marketplace_id) {
        const selectedId = this.props.addAccount ? this.next_id : this.props.selectedId;
        let edit_amazon = this.state.edit_amazon;
        edit_amazon[selectedId]['marketplace_id'] = marketplace_id;
        this.setState({edit_amazon});
    }

    saveValidAccount() {

        const selectedId = this.props.addAccount ? this.next_id : this.props.selectedId;
        let is_new = this.props.addAccount === true ? 1 : 0;
        const params = {
            'store': this.shopify.store,
            'version': this.shopify.version,
            'section': 'amazon',
            'is_new': is_new
        };
        const data = this.state.edit_amazon[selectedId];

        ConfigurationApiCall.post('connect', params, data, this.cbSaveForm, this.cbAccountError);
    }

    closeForm = () => {
        if (this.props.addAccount == true) {
            this.props.action('close');
        } else {
            this.props.action('close');
        }
    }

    openOauth = () => {
        let params = {
            'store': this.shopify.store,
        };
        this.setState({oauth: true});
        ApplicationApiCall.get('/application/amazon/oauth', params, this.cbOauthSuccess, this.cbOauthError);
    }

    cbOauthSuccess = (res) => {
        console.log("cbOauthSuccess", res);
        if (res.oauth_uri) {
            window.open(res.oauth_uri, "_blank");
        }
        this.setState({oauth: false});
    }

    cbOauthError = (err) => {
        this.setState({error: err, oauth: false});
    }

    componentWillUnmount() {
        console.log("%c credentials componenetWillUnmount", 'color:blue');
    }
}

export default Credentials;
