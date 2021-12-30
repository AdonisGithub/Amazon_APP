import React from 'react'
import CsI18n from "./../../components/csI18n"
import {
    CalloutCard,
    Layout,
    Card,
    Caption,
    Checkbox,
    Button,
    ButtonGroup,
    Heading,
    Spinner,
    ResourceList,
    Scrollable,
    Avatar,
    Stack, Tooltip, Banner,
    Toast
} from '@shopify/polaris';
import { Progress } from 'antd';

import {TickSmallMinor} from '@shopify/polaris-icons';

import Credentials from "./helpers/credentials";
import ApiStatus from "./helpers/api-status";
import "./manage.scss";
import ConfigurationApiCall from "../../functions/configuration-api-call";
import ApplicationApiCall from "../../functions/application-api-call";

import CsErrorMessage from "../../components/csErrorMessage/csErrorMessage";
import Util from "../../helpers/Util";
import Cache from "../../helpers/Cache";
import ShopifyContext from "../../context";
import PlanModal from "./planModal";
import ChargeConfirmModal from "./chargeConfirmModal";
// import 'antd/dist/antd.css';

class ListAccounts extends React.Component {

    constructor(props) {
        super(props);
        this.shopify = ShopifyContext.getShared();
        this.state = {
            selectedItems: [],
            editAccount: false,
            addAccount: false,
            connectionCheck: null,
            checkIsMounted: false,
            update: false,
            amazon_default: null,
            get_stated: false,

            plan_data: null,
            openChoosePlan: false,
            openChargeConfirmModalForChangePlan: false,

            new_plan_type: 0,

            loading: true,
            error: null,
            success: null,
            show_toast: null,
        };
        this.unMounted = false;

        this.state.amazon_default = this.shopify.amazon_default;
        this.state.plan_data = this.shopify.getPlanData();
    }

    componentWillMount() {
        ApplicationApiCall.get('/shopify/billing/check_plan', {}, this.cbCheckPlanSuccess, this.cbCheckPlanError, false);
    }

    componentWillUnmount() {
        this.unMounted = true;
    }

    cbCheckPlanSuccess = (res) => {
        if (this.unMounted) {
            return;
        }
        console.log("cbCheckPlan", res);
        this.shopify.setPlanData(res);
        let plan_data = this.shopify.getPlanData();
        if (res.hasOwnProperty('last_oauth_result') && res.last_oauth_result) {
            this.setLastOauthResult(res.last_oauth_result);
            this.setState({plan_data, loading: false});
        } else {
            this.setState({plan_data, loading: false});
        }
    }

    setLastOauthResult(last_oauth_result) {
        let {error_number, error_code, error_message} = last_oauth_result;
        let error;
        if (error_number == 0) {
            this.setState({success: CsI18n.t('Account saved successfully')});
            setTimeout(() => {this.setState({success: null})}, 5000);
            return;
        }
        if (error_number == 1) {
            if (error_message) {
                error = {
                    title: error_code,
                    message: error_message,
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
        console.error("setLastOauthResult", error);
        this.setState({error: error});
        setTimeout(() => {
            if (this.unMounted) {
                return;
            }
            console.log("setLastOauthResult - clear");
            this.setState({error: null})
        }, 20000);
    }

    cbCheckPlanError = (error) => {
        console.error("cbCheckPlanError", error);
        this.setState({loading: false, error: error});
    }

    handleEditAccountCallback = (action, selectedId, new_amazon) => {

        switch (action) {
            case 'delete':
                let configuration = this.shopify.amazon[selectedId].configuration;
                this.shopify.deleteConfiguration(selectedId);
                Cache.clearSessionByNs(this.shopify.store);
                Cache.removeCachedStoreInfo('init_data');
                if(configuration === this.shopify.amazon_default){
                    let new_default = this.shopify.amazon.length > 0 ? this.shopify.amazon[0].configuration : '';
                    this.setAmazonDefault(new_default);
                }
                this.setState({addAccount: false, editAccount: false, editing: false});
                break;
            case 'add':
                this.shopify.amazon = Util.clone(new_amazon);

                Cache.clearSessionByNs(this.shopify.store);
                if(!this.shopify.amazon_default || this.shopify.amazon_default === ''){
                    this.setAmazonDefault(this.shopify.amazon[0].configuration);
                }
                Cache.removeCachedStoreInfo('store_step');
                Cache.removeCachedStoreInfo('init_data');
                this.setState({addAccount: false, editAccount: selectedId, editing: false});
                break;
            case 'close':
                this.setState({addAccount: false, editAccount: false, editing: false, get_stated: false});
                break;
            // case 'render':
            //     this.setState({update: true});
            //     break;
        }
    }

    handleCheckCallback = (action) => {
        console.log(action);

        switch (action) {
            case 'close':
                this.setState({connectionCheck: false});
                this.setState({checkIsMounted: false});
                break;
            case 'render':
                this.setState({update: true});
                break;
            case 'mounted':
                this.setState({checkIsMounted: true});
                break;
        }
    };

    handleEdit = (id) => {
        console.log(this.state, id);
        let {plan_type} = this.state.plan_data;
        if (plan_type == 0) { //free plan no recurring charge
            this.showToastForPlan();
        } else {
            this.setState({['editAccount']: id, addAccount: false}, this.handleScrollTo);
        }
    };

    handleScrollTo = () => {
        console.log("handleScrollTo");
        let ele = document.createElement('a');
        document.body.appendChild(ele);
        ele.href = "#credential";
        ele.click();
    }

    setAmazonDefault = (default_account) => {
        let params = {
            'store': this.shopify.store,
            'version': this.shopify.version,
            'section': 'connect',
        };
        let data = {default: default_account}

        this.shopify.setAmazonDefault(default_account);
        Cache.removeCachedStoreInfo('init_data');
        this.setState({amazon_default: default_account}, () => {ConfigurationApiCall.post('replace', params, data, () => {}, this.cbInitError)}); // No callback for API call, we guess it's ok
        //ConfigurationApiCall.post('replace', params, data, () => {}); // No callback, we guess it's ok
    }

    handleCheck = (id) => {
        console.log(id);

        if (this.state.checkIsMounted) {
            this.setState({connectionCheck: false}, () => this.setState({connectionCheck: id}));
        } else {
            this.setState({connectionCheck: id});
        }
    }

    handleSetDefault = (default_account) => () => {
        if(this.state.amazon_default === default_account) return;
        console.log('handleSetDefault', default_account);
        this.setAmazonDefault(default_account);
    }

    cbInitError = (err) => {
        if(err){
            // setTimeout(() => {
            //     this.setState({error: null})
            // }, 5000)
            console.error("cbInitError", err);
            this.setState({error: err})
        }
    }

    showToastForPlan() {
        this.setState({show_toast: true, toast_is_error: true, toast_error_message: CsI18n.t('Please choose your plan')});
    }

    handleAdd = () => {
        let {plan_type} = this.state.plan_data;
        if (plan_type == 0) { //free plan no recurring charge
            this.showToastForPlan();
        } else {
            this.setState({addAccount: true, editAccount: false, connectionCheck: false, get_stated: true}, this.handleScrollTo);
        }
        //this.handleEditAccountCallback([]);
    }

    handleChoosePlan = () => {
        this.setState({openChoosePlan: true});
    }

    renderItem = (item, id) => {
        console.log("renderItem", this.state.amazon_default, item);

        let display_name = '';
        const {name, seller_id, marketplace_id} = item;
        const platform = this.shopify.amazon_platforms.filter(obj => {
            return obj.value === marketplace_id;
        })[0];

        const iso_code = platform && platform.hasOwnProperty('iso_code') ? platform.iso_code : '';
        const image_url = this.shopify.static_content + '/amazon/flags/flag_' + iso_code + '_64px.png'
        const media = <Avatar customer size="small" name={platform && platform.value} source={image_url}/>;
        const checked = this.state.amazon_default === item.configuration;
        const className = checked ? "selected" : "";
        return (
            <ResourceList.Item
                id={id}
                //url={url}
                media={media}
                accessibilityLabel={CsI18n.t("View details for {{platform_label}}, {{seller_id}}", { platform_label : platform && platform.label, seller_id : seller_id})}
            >
                <div className={className}>
                    <Stack wrap={false} distribution="equalSpacing" alignment="fill">
                        <Stack.Item fill>
                            <Stack vertical spacing="tight" alignment="">
                                <Stack.Item>
                                    <Stack>
                                        <Stack.Item><Heading>{name}</Heading></Stack.Item>
                                        <Stack.Item>

                                            <Tooltip
                                                content={checked ? <CsI18n>Default</CsI18n> : <CsI18n>Set Default</CsI18n>}
                                                active={false} preferredPosition="above">
                                                <Checkbox
                                                    checked={checked ? true : false}
                                                    onChange={this.handleSetDefault(item.configuration)}/>
                                            </Tooltip>
                                        </Stack.Item>
                                    </Stack>
                                </Stack.Item>
                                <Stack.Item>
                                    <Caption>{platform && platform.label}, {seller_id}</Caption>
                                </Stack.Item>
                            </Stack>
                        </Stack.Item>
                        <Stack.Item>
                        </Stack.Item>
                        <Stack.Item>
                            <ButtonGroup>
                                <Button icon={TickSmallMinor} onClick={this.handleCheck.bind(this, id)}
                                        size="slim"><CsI18n>Check</CsI18n></Button>
                                <Button onClick={this.handleEdit.bind(this, id)} size="slim"><CsI18n>Edit</CsI18n></Button>
                            </ButtonGroup>

                        </Stack.Item>
                    </Stack>
                </div>
            </ResourceList.Item>
        );
    };

    render() {
        console.log("manage:render", this.state, this.state.error);
        return (
                <React.Fragment>
                    {!this.state.loading && this.state.error ? this.renderError(this.state.error) : ''}
                    {!this.state.loading && this.state.success? this.renderSuccess(this.state.success) : ''}
                    {this.state.loading? this.renderLoading():''}
                    {!this.state.loading? this.renderBody():''}
                </React.Fragment>
        );
    }

    renderLoading() {
        return (
          <div className="loading text-center">
              <br/>
              <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}/>
          </div>
        )
    }

    renderBody() {
        return (<React.Fragment>
            {this.renderPlanBlock()}
            {this.accountsHeader()}
            {this.manageAccount()}
            {this.apiStatus()}
            {this.renderToast()}
        </React.Fragment>);
    }

    renderToast() {
        let {show_toast, toast_is_error, toast_error_message} = this.state;
        if (!show_toast) {
            return null;
        }
        return <Toast content={toast_error_message} error={toast_is_error} onDismiss={() => {this.setState({show_toast: false})}} />
    }

    renderSuccess(message) {
        return <Banner status="success" title={message}/>;
    }
    renderError(error){
        return(
          <CsErrorMessage
              errorTitle={error.title}
              errorMessage={error.message}
          />
        )
    }

    accountsHeader() {
        const resourceName = {
            singular: 'account',
            plural: 'accounts',
        };
        const items = this.shopify.amazon;
        const noContent = !this.shopify.amazon.length;
        console.log("accountsHeader", items, this.state);

        if (!noContent) {
            return (
                <div className="manage mt-3">
                    <Card>
                        <ResourceList
                            resourceName={resourceName}
                            items={items}
                            renderItem={this.renderItem}
                        />
                        {this.shopify.isDemoMode() || this.state.editAccount || this.state.addAccount ? '' :
                        <Stack distribution="trailing">
                            <Stack.Item>
                                <div className="add">
                                <Button primary onClick={this.handleAdd}><CsI18n>Add</CsI18n></Button>
                                </div>
                            </Stack.Item>
                        </Stack>
                        }
                    </Card>
                </div>

            )
        } else if(this.state.get_stated === false){
            return (
                <CalloutCard
                    title={CsI18n.t("You don't have any Amazon account connected yet")}
                    primaryAction={{
                        content: <CsI18n>Get Started</CsI18n>,
                        onAction: this.handleAdd,
                    }}
                >
                    <p><CsI18n>Add your first Amazon account</CsI18n></p>
                </CalloutCard>
            );
        }
    }

    manageAccount() {
        const addAction = this.state.addAccount ? true : false;
        var selectedId = false;
        console.log('manageAccount', this.state.editAccount, this.state.addAccount);


        if (this.state.editAccount || this.state.addAccount) {

            if (addAction) {
                selectedId = this.shopify.amazon.length;
            } else {

                selectedId = this.state.editAccount;
            }
            return (
                <div id="credential">
                    <Credentials selectedId={selectedId}
                             action={this.handleEditAccountCallback} addAccount={addAction} shopContext={this.shopify}/>

                </div>
            );
        } else {
            return ('')
        }
    }

    apiStatus() {
        console.log(this.state);

        if (this.state.connectionCheck) {
            var selectedId = parseInt(this.state.connectionCheck);
            var spinner = <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Processing")}></Spinner>

            return (
                <ApiStatus action={this.handleCheckCallback} selectedId={selectedId} shopContext={this.shopify}>
                    {spinner}
                </ApiStatus>);
        } else {
            return ('');
        }
    }

    handleClosePlanModal = () => {
        this.setState({openChoosePlan: false});
    }

    handleChangePlan = (new_plan_type) => {
        this.setState({openChoosePlan: false});

        if (new_plan_type == 0) {
            this.processChangePlan(new_plan_type);
        } else {
            this.setState({openChargeConfirmModalForChangePlan: true, new_plan_type: new_plan_type})
        }
    }

    handleChargeModalOk = () => {
        this.processChangePlan(this.state.new_plan_type);
    }

    processChangePlan(new_plan_type) {
        ApplicationApiCall.get('/shopify/billing/change_plan', {plan: new_plan_type},
          this.cbChangePlanSuccess, this.cbChangePlanError, false);
        this.setState({loading: true, openChargeConfirmModalForChangePlan: false});

    }

    cbChangePlanSuccess = (json) => {
        if (this.unMounted) {
            return;
        }
        if (json.is_need_confirm) {
            Cache.clearAll();
            Util.redirect(json.confirm_url);
        } else {
            this.shopify.setPlanData(json);
            let plan_data = this.shopify.getPlanData();
            Cache.removeCachedStoreInfo('init_data');
            this.setState({plan_data, loading: false});
        }
    }

    cbChangePlanError = (error) => {
        console.error("cbChangePlanError", error);
        this.setState({loading: false, error: error});
    }

    renderPlanBlock() {
        let note = '';
        let {plan_type, trial_days} = this.state.plan_data;
        let {new_plan_type} = this.state;
        if (plan_type == 0) {
            note = this.renderPlanNoBlock();
        }
        if (plan_type == 10) {
            note = this.renderPlanFreeBlock();
        }
        if (plan_type == 1) {
            note = this.renderPlanBasicBlock();
        }
        if (plan_type == 2) {
            note = this.renderPlanStandardBlock();
        }
        if (plan_type == 3) {
            note = this.renderPlanProBlock();
        }

        let price = this.shopify.getPlanPrice(new_plan_type);

        return (<Card>
            <Card.Section>
            <div>{note}</div>
            <div className={"btn-choose-plan"}><Button onClick={this.handleChoosePlan}><CsI18n>Choose your plan</CsI18n></Button></div>
            {this.state.openChoosePlan? <PlanModal
              opened={this.state.openChoosePlan}
              onChangePlan={this.handleChangePlan}
              onClose={this.handleClosePlanModal}
              plan_type={plan_type}
            />:null}
                {this.state.openChargeConfirmModalForChangePlan? <ChargeConfirmModal
                    opened={this.state.openChargeConfirmModalForChangePlan}
                    onOk={this.handleChargeModalOk}
                    onClose={() => {
                        this.setState({openChargeConfirmModalForChangePlan: false})
                    }
                    }
                    course_type={new_plan_type}
                    price={price}
                    trial_days={trial_days}
                />:null}
            </Card.Section>
        </Card>)
    }

    renderPlanNoBlock() {
        return <React.Fragment>
            <Heading><CsI18n>No plan: Please choose your plan</CsI18n></Heading>
        </React.Fragment>
    }

    renderPlanFreeBlock() {
        let plan_data = this.state.plan_data;
        if (!plan_data) {
            plan_data = {plan_count: 0, plan_limit: 50};
        }
        let {plan_count, plan_limit} = plan_data;
        let percent = parseInt(plan_count * 100 / plan_limit);
        return <React.Fragment>
            <Heading><CsI18n>Free Plan: Your free plan includes 50 orders per month</CsI18n></Heading>
            <div className={"usage-progress"}>
            <Progress
              strokeColor={{
                  from: '#108ee9',
                  to: '#EA5455',
              }}
              percent={percent}
              strokeWidth={20}
              format={(percent) => {
                  return '';
              }}
            />
                <div className={"percent-text"}><span>{CsI18n.t('{{plan_count}} of {{plan_limit}} orders used this month', {plan_count, plan_limit})}</span></div>
            </div>
        </React.Fragment>
    }

    renderPlanBasicBlock() {
        return <React.Fragment>
            <Heading><CsI18n>19$ Basic</CsI18n></Heading>
        </React.Fragment>
    }

    renderPlanStandardBlock() {
        return <React.Fragment>
            <Heading><CsI18n>29$ Advanced</CsI18n></Heading>
        </React.Fragment>
    }

    renderPlanProBlock() {
        return <React.Fragment>
            <Heading><CsI18n>59$ Shopify pro or greater than Basic</CsI18n></Heading>
        </React.Fragment>
    }

}

export default ListAccounts;
