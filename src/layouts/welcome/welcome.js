/**
 * @author    Alexandre D.
 */

import AmazonTab from "../../helpers/amazon-tab";
import React from "react";
import {
    Card,
    List,
    Tabs,
    Heading,
    TextContainer,
    Icon,
    Stack,
    TextStyle,
    CalloutCard,
    Subheading,
    Page,
    Layout,
    Link,
    Spinner, DisplayText, SkeletonBodyText,
    // SkeletonDisplayText, FooterHelp,
} from "@shopify/polaris";
import shopifyContext from "../../context";
import CsI18n from "../../components/csI18n";
import ApplicationApiCall from "../../functions/application-api-call";
import CsErrorMessage from "../../components/csErrorMessage";
import {mainTabs} from "../../constant";
import Help from "../../help";

import {
    HomeMajorMonotone,
    RefreshMinor,
    NoteMinor,
    TickMinor,
    TickSmallMinor,
    CircleInformationMajorMonotone,
    CircleInformationMajorTwotone
} from '@shopify/polaris-icons';
import Cache from "../../helpers/Cache";
import ReviewModal from "./reviewModal";

const URL_SHOPIFY_REVIEW = "https://apps.shopify.com/amazon-3#modal-show=ReviewListingModal";

export default class Welcome extends AmazonTab {

    state = {
        // Use Math.min in case step > 3, avoid errors below with tabs
        selected: null,
        loading_first: true,
        review_open: false,
        loading: true,
        report: null,
    };

    constructor(props) {
        super(props);
        require('./welcome.css');

        this.shopify = shopifyContext.getShared();
        this.state.selected = this.shopify.store_step.step ? this.shopify.store_step.step : 0;
        this.selectedConfiguration = this.getConfigurationSelectedIndex();

        if (this.props.showpage) {
            this.state.loading_first = false;
        }
        this.init_tabs();
        console.log("welcome", this.shopify, this.state, this.props);
    }

    init_tabs() {
        this.welcome_tabs = [
            {
                id: "welcome",
                content: (
                    <TextStyle variation="subdued">
                        <Icon source={HomeMajorMonotone} color={this.iconColor(0)}/> {CsI18n.t('Welcome')}
                    </TextStyle>
                ),
                accessibilityLabel: "Welcome",
                panelID: "welcome-content"
            },
            {
                id: "workflow",
                content: (
                    <TextStyle variation="subdued">
                        <Icon source={RefreshMinor} color={this.iconColor(1)}/> {CsI18n.t('Workflow')}
                    </TextStyle>
                ),
                panelID: "workflow-content"
            },
            {
                id: "rules",
                content: (
                    <TextStyle variation="subdued">
                        <Icon source={NoteMinor} color={this.iconColor(2)}/> {CsI18n.t('Rules')}
                    </TextStyle>
                ),
                panelID: "rules-content"
            },
            {
                id: "get_started",
                content: (
                    <TextStyle variation="subdued">
                        <Icon source={CircleInformationMajorTwotone} color={this.iconColor(2)}/> {CsI18n.t('Get started')}
                    </TextStyle>
                ),
                panelID: "get_started-content"
            },
            {
                id: "done",
                content: (
                    <TextStyle variation="subdued">
                        <Icon source={TickMinor} color={this.iconColor(3)}/> {CsI18n.t('Done')}
                    </TextStyle>
                ),
                panelID: "done-content"
            }
        ];

        this.setHelpTab();
    }

    setHelpTab() {
        let tabId = this.getSelectedTabId();
        switch (tabId) {
            case 'welcome':
            case 'workflow':
            case 'rules':
                this.tab = tabId;
                break;
            case 'get_started':
                this.tab = '';
                break;
            case 'done':
                this.tab = "dashboard";
                break;
        }
    }

    componentWillMount() {
    }

    componentDidMount() {
        console.log('componentDidMount', this.shopify.store_step, this.shopify.amazon);
        if (this.state.selected > 0 && (this.shopify.amazon.length > 0)) {
            this.init();
        } else {
            let {onLoaded} = this.props;
            if (onLoaded) {
                onLoaded();
            }
            this.setState({loading: false});
        }
    }

    componentWillReceiveProps(nextProps) {
        console.log("componentWillReceiveProps", this.props.showpage, nextProps);
        if (this.props.showpage != nextProps.showpage) {
            this.setState({loading_first: !nextProps.showpage});
        }

        if (this.getConfigurationSelectedIndex() !== this.selectedConfiguration) {
            console.log("componentWillReceiveProps", this.selectedConfiguration, this.getConfigurationSelectedIndex());
            this.selectedConfiguration = this.getConfigurationSelectedIndex();
            this.setState({loading: true}, this.init);
        }
    }

    init = () => {
        // let configuration = this.shopify.getConfigurationSelected() || '';
        let welcome_data = Cache.getCachedStoreInfo('welcome');
        this.cbInitSuccess(welcome_data);
        // ApplicationApiCall.get('/application/reports/welcome', {configuration}, this.cbInitSuccess, this.cbInitFail);
    }

    cbInitSuccess = (json) => {
        console.log("cbInitSuccess", json);
        // let {details: report, is_show_review} = json;
        let report = (json && json.details) ? json.details : null;
        let is_show_review = (json && json.is_show_review)? json.is_show_review : false;
        // let is_show_review = true;
        let {onLoaded} = this.props;
        if (onLoaded) {
            onLoaded();
        }
        is_show_review = !!is_show_review;
        if (is_show_review) {
            let is_showed = Cache.getCachedStoreInfo('show_review');
            if (is_showed) {
                is_show_review = false;
            }
            Cache.setCachedStoreInfo('show_review', true, 86400);
        }
        this.setState({loading: false, report, review_open: !!is_show_review});
    }

    cbInitFail = (err) => {
        console.log(err);
        let {onLoaded} = this.props;
        if (onLoaded) {
            onLoaded();
        }
        this.setState({loading: false, error: err});
    }

    handleTabChange = selectedTabIndex => {
        this.setHelpTab(selectedTabIndex);

        this.setState({selected: selectedTabIndex});
    };

    iconColor = current => {
        return this.state.selected === current ? "indigo" : "inkLighter";
    };

    handleRedirect = (value) => () => {
        this.props.redirect(value);
    }

    getSelectedTabId() {
        let {selected} = this.state;
        let selectedIndex = parseInt(selected);
        return this.welcome_tabs[selectedIndex].id;
    }

    handleReviewModalClose = () => {
        this.setState({review_open: false});
    }

    handleGotoSupport = () => {
        this.setState({review_open: false}, () => {
            this.handleRedirect(['support'])();
        });
    }

    handleGotoReview = () => {
        this.setState({review_open: false}, () => {
            window.open(URL_SHOPIFY_REVIEW, "_blank") //to open new page
        });
    }

    render() {
        console.log("render", this.state);
        let content;

        let tabId = this.getSelectedTabId();
        if (this.state.loading_first || this.state.loading) {
            content = this.renderLoading();
        } else if (this.state.error) {
            content = this.renderError();
        } else if (tabId != 'done') {
            content = this.renderStepWelcome();
        } else {
            content = this.renderStepLastDone();
        }

        let help_url = Help.getHelpUrl(this.tab);
        // var help_link = <a className="Polaris-Link" href={help_url} target="_top|_blank">{CsI18n.t(this.tab)}</a>;


        return (
            <div className="welcome">
                <Page>
                    {content}
                    {this.state.review_open? <ReviewModal
                        onClose={this.handleReviewModalClose}
                        onGotoSupport={this.handleGotoSupport}
                        onGotoReview={this.handleGotoReview}
                        opened={this.state.review_open}
                    />:''}
                </Page>
            </div>
        );
    }

    renderLoading() {
        if (this.state.loading_first)
            return (<React.Fragment/>);

        return (<div className="loading">
            <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}/>
        </div>);
    }

    renderError() {

        let errorTitle;
        let errorMessage;

        errorMessage = this.state.error.message;

        return (

            <div className="error-message">
                <CsErrorMessage
                    errorMessage={errorMessage}
                />
            </div>
        )
    }

    renderSummary() {

        let order_title;
        let offer_title;
        let shipping_title;

        if (this.state.report && this.state.report.amazon_orders) {
            order_title = "Orders";
        } else {
            order_title = "No sales yet";
        }

        if (this.state.report && (this.state.report.amazon_offers || this.state.report.shopify_offers)) {
            offer_title = "Offers";
        } else {
            offer_title = "No sales yet";
        }

        if (this.state.report && (this.state.report.shipped || this.state.report.to_shipp)) {
            shipping_title = "Shipping";
        } else {
            shipping_title = "No shipping yet";
        }

        return (
            <div>
                <Stack distribution="fillEvenly">
                    <Stack.Item>
                        <Card sectioned>
                            <Stack horizontal spacing="loose">
                                <Stack.Item fill>
                                    <div className="summary-header">
                                        <Heading><CsI18n>{order_title}</CsI18n></Heading>
                                    </div>
                                </Stack.Item>
                            </Stack>
                            <div>
                                {!this.state.report || !this.state.report.amazon_orders ?
                                    <SkeletonBodyText size="small" lines={3}/>
                                    :
                                    <Stack horizontal>
                                        <Stack.Item fill>
                                            <TextStyle><CsI18n>Amazon</CsI18n></TextStyle>
                                            <DisplayText
                                                size="large">{this.state.report.amazon_orders ? this.state.report.amazon_orders : 0}</DisplayText>
                                        </Stack.Item>
                                        <Stack.Item>
                                            {/*<TextStyle><CsI18n>Shopify</CsI18n></TextStyle>
                                            <div style={{'textAlign': 'right'}}>
                                                <DisplayText size="large">{this.state.report.shopify_orders ? this.state.report.shopify_orders : 0}</DisplayText>
                                            </div>*/}
                                        </Stack.Item>
                                    </Stack>
                                }
                            </div>
                        </Card>
                    </Stack.Item>
                    <Stack.Item>
                        <Card sectioned>
                            <Stack horizontal spacing="loose">
                                <Stack.Item fill>
                                    <div className="summary-header">
                                        <Heading><CsI18n>{offer_title}</CsI18n></Heading>
                                    </div>
                                </Stack.Item>
                            </Stack>
                            <div>
                                {!this.state.report || !(this.state.report.amazon_offer || this.state.report.shopify_offers) ?
                                    <SkeletonBodyText size="medium" lines={3}/>
                                    :
                                    <Stack horizontal>
                                        <Stack.Item fill>
                                            <TextStyle><CsI18n>Amazon</CsI18n></TextStyle>
                                            <DisplayText
                                                size="large">{this.state.report.amazon_offers ? this.state.report.amazon_offers : 0}</DisplayText>
                                        </Stack.Item>
                                        <Stack.Item>
                                            <TextStyle><CsI18n>Shopify</CsI18n></TextStyle>
                                            <div style={{'textAlign': 'right'}}>
                                                <DisplayText
                                                    size="large">{this.state.report.shopify_offers ? this.state.report.shopify_offers : 0}</DisplayText>
                                            </div>
                                        </Stack.Item>
                                    </Stack>
                                }
                            </div>
                        </Card>
                    </Stack.Item>
                    <Stack.Item>
                        <Card sectioned>
                            <Stack horizontal spacing="loose">
                                <Stack.Item fill>
                                    <div className="summary-header">
                                        <Heading><CsI18n>{shipping_title}</CsI18n></Heading>
                                    </div>
                                </Stack.Item>
                            </Stack>
                            <div>
                                {!this.state.report || !(this.state.report.to_ship || this.state.report.shipping) ?
                                    <SkeletonBodyText size="small" lines={3}/>
                                    :
                                    <Stack horizontal>
                                        <Stack.Item fill>
                                            <TextStyle><CsI18n>To ship</CsI18n></TextStyle>
                                            <DisplayText
                                                size="large">{this.state.report.to_ship ? this.state.report.to_ship : 0}</DisplayText>
                                        </Stack.Item>
                                        <Stack.Item>
                                            <TextStyle><CsI18n>Shipped</CsI18n></TextStyle>
                                            <div style={{'textAlign': 'right'}}>
                                                <DisplayText
                                                    size="large">{this.state.report.shipped ? this.state.report.shipped : 0}</DisplayText>
                                            </div>
                                        </Stack.Item>
                                    </Stack>
                                }
                            </div>
                        </Card>
                    </Stack.Item>
                </Stack>
            </div>
        )
    }

    renderStepLastDone() {

        const action = {
            content: <CsI18n>View dashboard</CsI18n>,
            primary: true,
            onAction: this.handleRedirect('dashboard')
        }

        return (
            <div className="welcome">
                {this.renderSummary()}
                <br/>
                <CalloutCard
                    title={CsI18n.t("Performances report")}
                    primaryAction={action}
                >
                    <span><CsI18n>More information about your Amazon account</CsI18n></span>
                </CalloutCard>
            </div>
        )
    }

    renderStep1() {
        const static_url = this.shopify.static_content + '/welcome/';
        return (<CalloutCard
            title={CsI18n.t('Welcome on board !')}
            illustration={static_url + 'home.png'}
            primaryAction={{
                content: CsI18n.t('Connect to Amazon'),
                primary: true,
                onAction: this.handleRedirect('connect')
            }}
        >
            <Subheading>{CsI18n.t('Main features summary')} :</Subheading>
            <TextContainer>
                <List>
                    <List.Item>
                        {CsI18n.t('Manage your Amazon listings directly from your store')}
                    </List.Item>
                    <List.Item>
                        {CsI18n.t('Import your order to your store')}
                    </List.Item>
                    <List.Item>
                        {CsI18n.t('Create new offers on Amazon in bulk mode')}
                    </List.Item>
                    <List.Item>
                        {CsI18n.t('Create your Oberlo listings on Amazon')}
                    </List.Item>
                    <List.Item>
                        {CsI18n.t('And many more...')}
                    </List.Item>
                </List>
                <p>
                    {CsI18n.t('Please connect your Amazon account to your store.')}
                </p>
            </TextContainer>
        </CalloutCard>);
    }

    renderStep2() {
        const static_url = this.shopify.static_content + '/welcome/';
        return <CalloutCard
            title={CsI18n.t('Configure your workflow')}
            illustration={static_url + 'workflow.png'}
            primaryAction={{
                content: CsI18n.t('Set up a workflow'),
                primary: true,
                onAction: this.handleRedirect('workflow')
            }}
        >
            <Subheading>{CsI18n.t('You will setup how the app will work')} :</Subheading>
            <TextContainer>
                <List>
                    <List.Item>
                        {CsI18n.t('Sync of your inventory')}
                    </List.Item>
                    <List.Item>
                        {CsI18n.t('Import of your orders')}
                    </List.Item>
                    <List.Item>
                        {CsI18n.t('Collections & locations selection')}
                    </List.Item>
                    <List.Item>
                        {CsI18n.t('Other features such as metafields, FBA, etc.')}
                    </List.Item>
                </List>
            </TextContainer>
        </CalloutCard>;
    }

    renderStep3() {
        const static_url = this.shopify.static_content + '/welcome/';
        return <CalloutCard
            title={CsI18n.t('Configure your rules')}
            illustration={static_url + 'rules.png'}
            primaryAction={{
                content: CsI18n.t('Create a rule'),
                primary: true,
                onAction: this.handleRedirect('rules')
            }}
        >
            <Subheading>{CsI18n.t('You will setup how you want to')} :</Subheading>
            <TextContainer>
                <List>
                    <List.Item>
                        {CsI18n.t('Export your prices')}
                    </List.Item>
                    <List.Item>
                        {CsI18n.t('Manage your sales and markups')}
                    </List.Item>
                    <List.Item>
                        {CsI18n.t('Filter or manage inventory rules')}
                    </List.Item>
                    <List.Item>
                        {CsI18n.t('Configure your taxes')}
                    </List.Item>
                    <List.Item>
                        {CsI18n.t('Manage your shipping rules')}
                    </List.Item>
                </List>
            </TextContainer>
        </CalloutCard>;
    }

    getTabUrl(tab) {
        if (!this.shopify)
            return "";
        return this.shopify.getAppBaseUrl() + "/" + tab;
    }

    renderStep4GetStarted() {
        // const help_tutorials = <a className="Polaris-Link" href={Help.getHelpUrl('tutorials')}
        //                           target="_top|_blank">{CsI18n.t('Tutorials')}</a>;
        const static_url = this.shopify.static_content + '/welcome/';
        const tab_scheduler = <Link onClick={this.handleRedirect(['actions', 'scheduler'])}>{CsI18n.t('Scheduler')}</Link>;
        const tab_feeds = <Link onClick={this.handleRedirect(['actions', 'feeds'])}>{CsI18n.t('Feeds')}</Link>;
        const tab_models = <Link onClick={this.handleRedirect('models')}>{CsI18n.t('profiles & models')}</Link>;
        const tab_export = <Link onClick={this.handleRedirect(['actions', 'catalog'])}>{CsI18n.t('feeds to Amazon')}</Link>;
        const tab_actions = <Link onClick={this.handleRedirect('actions')}>{CsI18n.t('sync & operations')}</Link>;
        const help_tutorials = <Link onClick={this.handleRedirect(['help', 'tutorials'])}>{CsI18n.t('Support')}</Link>;
        const tab_support = <Link onClick={this.handleRedirect(['support'])}>{CsI18n.t('Support')}</Link>;

        return <CalloutCard
            title={CsI18n.t('Start the operations')}
            illustration={static_url + 'get_started.png'}
            primaryAction={{
                content: CsI18n.t('Operations'),
                primary: true,
                onAction: this.handleRedirect(['actions', 'operations'])
            }}
        >
            <Subheading>{CsI18n.t('Now you should have a look around...')} :</Subheading>
            <TextContainer>
                <List>
                    <List.Item>
                        <CsI18n
                            tab_scheduler={tab_scheduler}>{'View the {{tab_scheduler}} in action'}</CsI18n>
                    </List.Item>
                    <List.Item>
                        <CsI18n
                            tab_feeds={tab_feeds}>{'View the {{tab_feeds}} in action'}</CsI18n>
                    </List.Item>
                    <List.Item>
                        <CsI18n
                            tab_models={tab_models}>{'Setup your {{tab_models}}'}</CsI18n>
                    </List.Item>
                    <List.Item>
                        <CsI18n
                            tab_exports={tab_export}>{'Send {{tab_exports}}'}</CsI18n>
                    </List.Item>
                    <List.Item>
                        <CsI18n
                            tab_actions={tab_actions}>{'View the {{tab_actions}} reports'}</CsI18n>
                    </List.Item>
                    <List.Item>
                        <CsI18n
                            help_tutorials={help_tutorials}>{'Any point you didn\'t get? Please read our {{help_tutorials}}'}</CsI18n>
                    </List.Item>
                    <List.Item>
                        <CsI18n
                            tab_support={tab_support}>{'Are you struggling so far? Contact our {{tab_support}}'}</CsI18n>
                    </List.Item>
                </List>
            </TextContainer>
        </CalloutCard>;
    }

    renderStepWelcome() {
        const {selected} = this.state;
        return (
            <Card>
                <div className="welcome-nav">
                    <Card.Header title="Amazon Integration Plus" subdued/>
                    <Card.Section>
                        <Card>
                            <Tabs
                                tabs={this.welcome_tabs}
                                selected={selected}
                                onSelect={this.handleTabChange}
                            >
                                {this.renderStepTabBody()}
                            </Tabs>
                        </Card>
                    </Card.Section>
                </div>
            </Card>
        )
    }

    renderStepTabBody() {
        let tabId = this.getSelectedTabId();
        switch (tabId) {
            case 'welcome':
                return this.renderStep1();
            case 'workflow':
                return this.renderStep2();
            case 'rules':
                return this.renderStep3();
            case 'get_started':
                return this.renderStep4GetStarted();
            default:
                return '';
        }
    }
}
