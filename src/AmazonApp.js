import React from 'react';
import {
    AppProvider,
    Page,
    Layout,
    Card,
    Frame,
    FooterHelp, Tabs, Icon,
    Toast,
    Stack
} from '@shopify/polaris';
import {TickSmallMinor, CaretDownMinor, ChevronLeftMinor, ViewMinor, CircleChevronRightMinor, PrintMinor} from "@shopify/polaris-icons";
import Dashboard from './dashboard'
import Connect from './connect'
import Workflow from './workflow'
import Rules from './rules'
import Actions from './actions'
import Reports from "./reports";
import Support from "./layouts/help/support";
import ShopifyContext, { TAB } from "./context";
import Help from "./help";
import ConfigurationApiCall from "./functions/configuration-api-call";
import CsI18n from "./components/csI18n";
import MustConfigure from "./helpers/must-configure";
import CsErrorMessage, {ErrorType} from "./components/csErrorMessage/csErrorMessage";
import Welcome from "./layouts/welcome/welcome";
import AccountSelector from "./layouts/accounts/helpers/account-selector";
import ShopSelector from './layouts/accounts/helpers/shop-selector';
import {ScrollToButton} from "./scrollTo";
import AdminTab from './admin';
import * as serviceWorker from './serviceWorker';
import {mainTabs, pageLabels} from "./constant";
import LiveSupport from "./functions/live-support";
import dotenv from 'dotenv';
// import CsRoadMapFrame from "./components/csRoadMapFrame";
import Cache from "./helpers/Cache";
import CsSkeletonLoading from "./components/csSkeletonLoading";
import Samples from './samples'
import Model from './model'
import * as Sentry from "@sentry/react";


import '@shopify/polaris/styles.css';
import './index.css';
import './common.css';
import Util from "./helpers/Util";
import CheckWarning from "./layouts/sections/check_warning";

const file_version = "21100601";

class AmazonApp extends React.Component{

    state = {
        wait : true,
        wait_page: true,
        showloading: false,
        locale : 'en',
        selected: null,
        updated: false,
        show_error: true,
    }

    constructor(props) {
        super(props);

        console.log("%cversion: ", 'color:blue', file_version);
        this.shopify = ShopifyContext.getShared(); //@kbug DON'T move or remove


        this.shopify.setDisableConsoleLog();

        console.log("this.shopify:", this.shopify);

        let last_setting_date = false;
        let is_cache_clear = false;
        try {
            let params = new URLSearchParams(window.location.search);
            last_setting_date = params.get('cs_setting_date');
            is_cache_clear = params.get('cs_is_clear');
        } catch (e) {
        }

        if (!this.shopify.domain || !this.shopify.domain.length) {
            return;
        }

        let cached_version = Cache.getCachedFileVersion();
        let cached_last_setting_date = Cache.getCachedLastSettingDate();

        if( cached_version != file_version || (last_setting_date && cached_last_setting_date != last_setting_date)) {
            Cache.clearAll();
            Cache.setFileVersion(file_version);
            if(last_setting_date) {
                Cache.setLastSettingDate(last_setting_date);
            }
        }

        if (is_cache_clear) {
            Cache.clearAppCache();
            Cache.setFileVersion(file_version);
            if(last_setting_date) {
                Cache.setLastSettingDate(last_setting_date);
            }
        }

        this.state.showloading = this.props.showloading;

        let path = Util.getPathName();
        if( path === 'redirect' ) {
            this.is_redirect_mode = true;
            let redirect_url = this.shopify.params.get('redirect');
            console.log('redirect_url', this.shopify.params, redirect_url);

            if( redirect_url) {
                Util.redirect(redirect_url);
            }
        } else {
            this.is_redirect_mode = false;
        }
    }

    componentWillMount() {
        if( !this.is_redirect_mode ) {
            this.shopify.initStoreData(this.handleStoreProperty);
        }
    }

    componentDidMount() {
        this.doLoaded();
    }

    handleStoreProperty = (result) => {
        this.startConfiguration();
    }

    setTabs(isWelcome) {
        let welcome_tab = {
            id: "Welcome",
            content: CsI18n.t('Welcome'),
            accessibilityLabel: CsI18n.t('Welcome'),
            panelID: "Welcome"
        };
        let admin_tab = {
            id: "admin",
            content: CsI18n.t('Admin'),
            accessibilityLabel: CsI18n.t('Admin'),
            panelID: "Admin"
        };

        let prefix_tabs = [];
        if( isWelcome ) {
            prefix_tabs.push(welcome_tab);
        }

        this.tabs = [...prefix_tabs];

        for( let i in mainTabs ) {
            if( this.shopify.isAllowedFeature(mainTabs[i].feature) ) {
                this.tabs.push(mainTabs[i]);
            }
        }

        if(this.shopify.admin === true){
            this.tabs.push(admin_tab);
        }
    }

    initSelectedTab(){

        let selected;
        let path = this.shopify.getTab(TAB.MAIN_TAB);

        if(path==='welcome') {
            this.setTabs(true);
        } else {
            this.setTabs(false);
        }

        if(path==="sample") {
            let sample_tab = {
                id: "Sample",
                content: 'Sample',
                accessibilityLabel: 'Sample',
                panelID: "Sample"
            };
            this.tabs.push(sample_tab);
        }

        selected = 0;
        if ( path === '' || path === 'welcome' || path === 'samples'){
            selected = 0;
        } else {
            this.tabs.forEach((tab, index) =>{
                if(path === tab.id.toLowerCase()){
                    selected = parseInt(index);
                }
            });
        }

        console.log("setSelectedTab", selected);
        if(path === 'redirect' && this.shopify.getTab(TAB.CHILD_TAB1) === 'order' && this.shopify.getTab(TAB.CHILD_TAB2) === 'view'){
            this.shopify.redirect(this.cbLinkSuccess, this.cbLinkErr);
        }
        this.setState({selected: selected});
    }

    startConfiguration = () => {
        console.info("Index: CsI18n start");
        CsI18n.initParam(this.shopify.lang, Cache.getCachedParameter, Cache.setCachedParameter);
        CsI18n.init( () => {
            console.info("Index: CsI18n success: ");
            // this.shopify.fetchConfiguration(this.cbConfiguration, this.cbInitError);
            this.cbConfiguration();
        }, () => {
            console.error("Index: CsI18n Fail: ");
            // this.shopify.fetchConfiguration(this.cbConfiguration, this.cbInitError);
            this.cbConfiguration();
        });
    }

    hasHelp(){
        // let help = ['', 'connect', 'workflow', 'rules'];
        let path = this.shopify.getTab(TAB.MAIN_TAB);
        if( path === "help" || path == "support" || path === "welcome")
            return false;
        return true;
    }

    cbConfiguration = () => {
        this.initSelectedTab();
        this.setState({wait: false});
    }

    cbInitError = (err) => {
        if(err){
            this.setState({wait: false, error: err})
        }
    }

    cbLinkSuccess = (json) => {
        console.log("cbLinkSuccess", json);
        if( json ) {
            const redirect = document.getElementById("redirect");
            redirect.setAttribute('href', json);

            redirect.click();
            console.log("click to redirect");
            setTimeout(() => {
                this.handleTabChange(0);
            }, 200);

        } else {
            this.cbLinkErr({type: ErrorType.INVALID_PARAM, message: CsI18n.t('Can\'t find amazon order.')});
        }
    }

    cbLinkErr = (err) => {
        console.log("cbLinkErr", err);
        this.setState({error: err});
    }

    getTabIndexByPage(page) {
        let tab_index = 0;
        this.tabs.forEach((tab, index) => {
            if (page === tab.id.toLowerCase()) {
                tab_index = parseInt(index);
            }
        });
        return tab_index;
    }

    handleViewPage = (page) => {
        console.log("handleViewPage", page);
        let tab_index;
        if (Array.isArray(page)) {
            this.shopify.setStoreTab(["", ...page]);
            tab_index =this.getTabIndexByPage(page[0]);
        } else {
            this.shopify.setStoreTab(["", page]);
            tab_index = this.getTabIndexByPage(page)
        }
        this.handleTabChange(tab_index, true);
    }

    handleTabChange = (tabIndex, is_manual = false) => {
        if( tabIndex >= this.tabs.length ) {
            console.error("handleTabChange error Tab:", tabIndex, this.tabs);
            return;
        }
        console.log("handleTabChange", tabIndex);
        let tabId = this.tabs[0].id.toLocaleLowerCase();
        if( tabId === "welcome" ) {
            if( tabIndex !== 0 ) {
                this.setTabs(false);
                tabIndex -= 1;
            }
        }

        if (!is_manual) {
            this.shopify.setStoreTab(this.tabs[tabIndex].id.toLowerCase());
        }

        this.setState({selected: tabIndex, error: null}, () => {
            window.dispatchEvent(new Event('resize'));
        });
    }

    handleHelpClick = () => {
        this.setState({selected: 8});
    }

    handleChange = (type) => () => {
        if(type === 'shop'){
            // this.shopify.store_step.step = 0;
            this.shopify.fetchStoreData(this.cbConfiguration);
            this.setState({wait: true});
        } else if (type === 'account') {
            setTimeout(() => {
                this.setState({wait: false});
            }, 2000);
            this.setState({wait: true});
            // this.setState({updated: true});
        }

    };

    componentWillReceiveProps(nextProps, nextContext) {
        if( this.props.showloading !== nextProps.showloading ) {
            this.setState({showloading: nextProps.showloading});
        }
    }

    renderLoading() {
        return <React.Fragment>{this.state.showloading? <CsSkeletonLoading/>:''}</React.Fragment>;
    }


    render(){
        console.log("devEnv: ", this.shopify.dev);
        console.log("shopifyStore: ", this.shopify.domain);
        console.log("selectedTab: ", this.state.selected);
        console.log("accountList: ", this.shopify.amazon);
        const config={ apiKey: this.shopify.api_key, shopOrigin: this.shopify.domain }


        if(this.state.selected === null || this.state.selected === undefined || this.shopify.amazon === '' || !this.shopify.amazon || this.is_redirect_mode ){
            console.log("render", "selected is undefined")
            return(
                <Sentry.ErrorBoundary fallback={"An error has occurred"}>
                    <AppProvider i18n={this.shopify.lang}>
                        <Frame>
                            {this.renderLoading()}
                            {this.renderRedirect()}
                        </Frame>
                    </AppProvider>
                </Sentry.ErrorBoundary>
            )
        }

        return  (
            <Sentry.ErrorBoundary fallback={"An error has occurred"}>
                <AppProvider i18n={this.shopify.lang}>
                    <Frame>
                        {this.renderTab()}
                    </Frame>
                </AppProvider>
            </Sentry.ErrorBoundary>
        )
    }

    handleLoaded = () => {
        this.setState({wait_page: false});
    }

    doLoaded = () => {
        console.log("doLoaded");
        let {onLoaded} = this.props;
        if( onLoaded ) {
            onLoaded();
        }
    }

    handleUpdate = () => {
        setTimeout(() => {
            this.setTabs(false);
            this.setState({updated: true}); //refresh page
        }, 300);
    }

    renderTab(){
        let component;
        let path = this.shopify.getTab(TAB.MAIN_TAB);
        console.log("renderTab: ", path, this.state);

        let tabId = this.tabs[this.state.selected].id.toLocaleLowerCase();
        let page = tabId;
        switch (tabId) {
            case "welcome":
                component = <Welcome redirect={this.handleViewPage} onLoaded={this.handleLoaded} showpage={this.state.wait_page? false:true}/>
                break;
            case "dashboard":
                component = <Dashboard shopContext={this.shopify}/>
                break;
            case "connect":
                component = <Connect shopContext={this.shopify}/>;
                break;
            case "workflow":
                component = <Workflow shopContext={this.shopify} onUpdate={this.handleUpdate} />;
                break;
            case "rules":
                component = <Rules shopContext={this.shopify}/>;
                break;
            case "models":
                component = <Model shopContext={this.shopify}/>;
                break;
            case "actions":
                component = <Actions shopContext={this.shopify}/>;
                break;
            case "reports":
                component = <Reports shopContext={this.shopify}/>;
                break;
            // case "roadmap":
            //     dotenv.config();
            //     let store_email = this.shopify.store_properties.roadmap_param;
            //     let store_domain = this.shopify.getStoreDomain();
            //     let store_name = this.shopify.getStoreName();
            //     component = <CsRoadMapFrame AppName={process.env.REACT_APP_APP_NAME}
            //                                 store_email={store_email}
            //                                 store_domain={store_domain}
            //                                 store_name={store_name} lang={this.shopify.lang} />;
            //     break;
            case "help":
                component = <Help shopContext={this.shopify}/>;
                break;
            case "support":
                component = <Support />;
                break;
            case "admin":
                component = <AdminTab shopContext={this.shopify}></AdminTab>
                break;
            case "sample":
                component = <Samples />
                break;
        }

        console.log(this.shopify.amazon);
        let bLoadContent = true;
        let content1 = '';

        // if (this.state.wait || (this.shopify.amazon.length === 0 && path !== 'help'))
        if (this.state.wait)
        {
            bLoadContent = false;
            content1 = this.renderLoading();
        } else if (this.state.error) {
            console.log("error");
            content1 = this.renderError();
            bLoadContent = false;
        }

        let bShowAccount = false;
        let content_body = '';
        if( bLoadContent ) {
            if ( page != 'help' && page != 'support' && MustConfigure.checkGlobalConfig() === false ) {
                console.log("mustconfigurations");
                content1 = <MustConfigure/>
                bShowAccount = true;
            } else {
                content_body = component;
                if( this.state.wait_page === true && page === 'welcome' ) {
                    content1 = this.renderLoading();
                    bShowAccount = false;
                } else {
                    bShowAccount = true;
                }
            }
        }

        // let tabLabel = this.shopify.getTab(TAB.MAIN_TAB);
        // console.log("tabLabel", tabLabel);

        let help_url = Help.getHelpUrl(tabId);
        const help_link = <a className="Polaris-Link" href={help_url} target="_top|_blank">{CsI18n.t(pageLabels[tabId].name)}</a>;

        let footer = '';
        let settingError = this.shopify.getSettingError();
        if (content_body !== '' && settingError == 0) {
            footer = this.shopify.isDemoMode()? CsI18n.t('Demo mode - fake data are displayed.'):'';
        } else {
            if ( this.shopify.hasAccounts()) {
                console.log("getSettingError - result", settingError);
                switch(settingError) {
                    case 1:
                        footer = CsI18n.t('Please configure and save Workflow.');
                        break;
                    case 2:
                        footer = CsI18n.t('Please configure your platforms in Workflow tab.');
                        break;
                    case 3:
                        footer = CsI18n.t('Please configure your locations in Workflow tab.');
                        break;
                    case 4:
                        footer = CsI18n.t('Please configure your collections in Workflow tab.');
                        break;
                    default:
                        break;
                }
            } else {
                footer = CsI18n.t('Please configure your connector in Connect tab.');
            }
        }
        if (this.shopify.isLimited()) {
            footer += ' ' + CsI18n.t('Some features are limited in development store or trial store.');
        }
        // let footer_html = footer!=''? (<footer className={"footer-warning"}>
        //     <p>{footer}</p>
        // </footer>):'';
        let footer_html;
        if (!this.state.wait) {
            footer_html = (this.state.show_error && footer!='')? (<Toast content={footer} error={true} onDismiss={()=>{ } } />):'';
        } else {
            footer_html = '';
        }
        let support_footer = '';

        // console.log("AmazonApp:", page, this.tabs, this.state, footer_html);
        if( page == 'roadmap') {
            return (
                <div style={{flexDirection: 'column', height: '100%', display: 'flex'}}>
                    {(bShowAccount)?
                        <div style={{display: 'flex'}}>
                            <div className="app-tabs">
                                <Tabs selected={this.state.selected} tabs={this.tabs} onSelect={this.handleTabChange}/>
                            </div>
                            {this.renderAccountSelector()}
                        </div>:''}
                    {component}
                </div>
            );
        } else {
            let admin_footer = null;

            if (this.shopify.hasOwnProperty('store_properties') && this.shopify.store_properties.hasOwnProperty('name')) {
                support_footer = LiveSupport.displayWidget();
            }
            if (this.shopify.admin && this.shopify.store_properties.hasOwnProperty('name') && this.shopify.plan_data && this.shopify.plan_data.plan_info) {
                admin_footer =
                    <Stack vertical>
                        <Stack spacing="loose" distribution="center">
                            <Stack.Item>
                                <b>Store</b>: {this.shopify.store_properties.name} - {this.shopify.store_properties.myshopify_domain} - {this.shopify.store_properties.email}
                            </Stack.Item>
                            <Stack.Item>
                                <b>Shopify plan</b>: {this.shopify.store_properties.plan_display_name}
                            </Stack.Item>
                        </Stack>
                        <Stack spacing="loose" distribution="center">
                            <Stack.Item>
                                <b>App plan</b>: {this.shopify.plan_data.plan_info.name}
                            </Stack.Item>
                            <Stack.Item>
                                <b>Trial</b>: {this.shopify.plan_data.trial_days}
                            </Stack.Item>
                        </Stack>
                    </Stack>
            }
            return(
                <React.Fragment>
                    {(bShowAccount)?
                        <div style={{display: 'flex'}}>
                            <div className="app-tabs">
                                <Tabs selected={this.state.selected} tabs={this.tabs} onSelect={this.handleTabChange}/>
                            </div>
                            {this.renderAccountSelector()}
                        </div>:''}
                    <Page fullWidth>
                        {this.renderRedirect()}
                        {content1}
                        {content_body}
                        {this.hasHelp() ?
                            <Layout.Section>
                                <FooterHelp>
                                    <CsI18n
                                        help_link={help_link}>{pageLabels[tabId].help_text}</CsI18n>
                                </FooterHelp>
                            </Layout.Section>
                            : ''}
                        {admin_footer ?
                            <Layout.Section>
                                {admin_footer}
                            </Layout.Section>
                            : ''
                        }
                        <ScrollToButton scrollStepInPx="400" delayInMs="10"/>

                        {footer_html}
                        <CheckWarning />
                    </Page>
                    {support_footer}
                </React.Fragment>
            )
        }
    }


    renderAccountSelector(){

        let path = this.shopify.getTab(TAB.MAIN_TAB);
        let shopSelector;
        let accountSelector = '';

        if(this.shopify.admin === true) {
            shopSelector = <ShopSelector shopContext={this.shopify} onChange={this.handleChange('shop')} />
        }

        if(path === 'help' || path === 'support' || path === 'samples' || this.shopify.amazon.length === 0) {
            accountSelector = '';
        } else {
            if(path !== 'connect'){
                accountSelector = <AccountSelector shopContext={this.shopify} onChange={this.handleChange('account')}/>
            }
        }

        return(
            <div className="account-selector">
                {shopSelector}
                {accountSelector}
            </div>
        )
    }

    renderRedirect(){
      return(
        <div style={{display: 'none'}}>
            <a target="_blank" id="redirect"/>
        </div>
      )
    }

    renderError() {
        return (
          <Card>
              <CsErrorMessage
                errorType={this.state.error.type}
                errorMessage={this.state.error.message}
              />
          </Card>
        )
    }
}

export default AmazonApp;

// serviceWorker.register();
serviceWorker.unregister();
