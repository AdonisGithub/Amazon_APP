import React from "react";
import CsI18n from "./../../components/csI18n"

import {
    Avatar, Banner,
    Card, Checkbox,
    ResourceList,
    Stack, Tooltip,
    RadioButton,
    Toast, Heading, Link, Icon, Collapsible, ChoiceList,
} from "@shopify/polaris";
import shopifyContext from "../../context";
import CsToggleButton from "../../components/csToggleButton/csToggleButton";
import {AlertMinor, ChevronDownMinor, ChevronUpMinor} from "@shopify/polaris-icons";
import ShopifyContext from "../../context";
import WorkflowTab from "./workflow_tab";
import Util from "../../helpers/Util";

class Platform extends WorkflowTab {

    getName() {
        return "Platform";
    }

    static default_values = {
        advanced_workflow: [],
    };

    constructor(props) {
        super(props);
        this.shopify = ShopifyContext.getShared();
        this.state.advanced_active = false;
        this.marketplaceList = this.props.marketplaceList;
        this.defaults = Util.clone(Platform.default_values);
        if ( !this.props.config.hasOwnProperty('data') || !this.props.config.data) {
            console.log("workflow-platform", "data is empty");
            this.configurationUpdateCurrent(this.defaults);
        }
        this.handleChange = this.handleChange.bind(this);
    }

    loadConfig() {
        console.log("loadConfig - start");
        this.configurationLoad();
        this.configurationUpdateCurrent(this.state.data);
    }

    componentWillMount() {
        console.log("componentWillMount");

        this.loadConfig();
    }

    componentWillReceiveProps(nextProps) {
        console.log("componentWillReceiveProps");
        if(this.marketplaceList !== nextProps.marketplaceList){
            this.marketplaceList = nextProps.marketplaceList;
        }
        this.loadConfig();
    }

    handleAdvancedWorkflow = (value) => {
        let options = this.inputToDbAdvancedWorkflow(value);
        this.valueUpdater("advanced_workflow")(options);
    }

    inputToDbAdvancedWorkflow(options) {
        let advanced_workflow = [];
        let bDontSendEmail = true;
        for(let item of options) {
            switch (item) {
                case "send-email":
                    bDontSendEmail = false;
                    break;
                default: //if don't need to convert
                    advanced_workflow.push(item);
            }
        }
        if(bDontSendEmail)
            advanced_workflow.push('dont-send-email');

        return advanced_workflow;
    }

    dbToInputAdvancedWorkflow(options) {
        let advanced_workflow = [];
        let bSendEmail = true;
        for(let item of options) {
            switch (item) {
                case "dont-send-email":
                    bSendEmail = false;
                    break;
                default:
                    advanced_workflow.push(item);
            }
        }
        if (bSendEmail) {
            advanced_workflow.push('send-email');
        }

        return advanced_workflow;
    }

    handleAdvancedOpen = () => {
        this.setState(prev => {
            return {advanced_active: !prev.advanced_active}
        })
    }

    handleSetMain = (marketplace_id) => (value) => {
        console.log("handleSetMain", marketplace_id, value);
        let valueUpdater = this.valueUpdater('main_marketplace_id');
        valueUpdater(marketplace_id);
    }

    handleChange = (index) => (value) => {
        console.log("handleChange", index, value);
        let selected_marketplaces = [];

        let main_marketplace_id = null;
        if(this.state.data.hasOwnProperty('main_marketplace_id') && this.state.data.main_marketplace_id){
            main_marketplace_id = this.state.data.main_marketplace_id;
        }

        if(this.state.data.hasOwnProperty('selected_marketplaces') && this.state.data.selected_marketplaces !== null){
            selected_marketplaces = this.state.data.selected_marketplaces;
        }else{
            selected_marketplaces = [];
        }
        let pos = selected_marketplaces.indexOf(this.marketplaceList[index].MarketplaceId);
        if (main_marketplace_id == this.marketplaceList[index].MarketplaceId && !value) {
            this.setState({toast: {message: CsI18n.t("Can't disable the main marketplace"), error: true}});
            return;
        }

        if(value === true && pos === -1){
            selected_marketplaces.push(this.marketplaceList[index].MarketplaceId);
        }


        if(value === false && pos !== -1){
            selected_marketplaces.splice(pos, 1);
        }
        console.log(selected_marketplaces)
        let valueUpdater = this.valueUpdater('selected_marketplaces');
        valueUpdater(selected_marketplaces);

    }

    render() {
        console.log("render", this.marketplaceList);
        console.log("render", this.state.data);
        let selected_marketplaces = [];
        if(this.state.data.hasOwnProperty('selected_marketplaces') && this.state.data.selected_marketplaces !== null){
            selected_marketplaces = this.state.data.selected_marketplaces;
        }else{
            selected_marketplaces = [];
        }

        let main_marketplace_id = null;
        if(this.state.data.hasOwnProperty('main_marketplace_id') && this.state.data.main_marketplace_id){
            main_marketplace_id = this.state.data.main_marketplace_id;
        }

        const toastMarkup = this.state.toast ? (
            <Toast content={this.state.toast.message} error={!!this.state.toast.error} onDismiss={() => {this.setState({toast: null})}} />
        ) : null;

        let advanced_workflow = this.dbToInputAdvancedWorkflow(this.state.data.advanced_workflow);
        let hasMarketplace = this.marketplaceList.length > 0;
        console.log("render", selected_marketplaces, main_marketplace_id);
        if( hasMarketplace ) {
            return (
                <Card.Section>
                    {toastMarkup}
                    <ResourceList
                        items={this.marketplaceList}
                        renderItem={(marketplace, id) => {
                            const {DefaultCountryCode, Name, MarketplaceId:marketplace_id} = marketplace;
                            let checked = selected_marketplaces.indexOf(marketplace_id) !== -1;
                            let flag_url = shopifyContext.getShared().static_content + '/amazon/flags/flag_' + DefaultCountryCode.toLowerCase() + '_64px.png';
                            let main_checked = main_marketplace_id == marketplace_id;
                            return (
                                <ResourceList.Item>
                                    <Stack alignment="center">
                                        <Stack.Item>
                                            <Avatar source={flag_url} alt={DefaultCountryCode}/>
                                        </Stack.Item>
                                        <Stack.Item fill>
                                            {Name}
                                            &nbsp;&nbsp;&nbsp;
                                            <Tooltip
                                                content={main_checked ? <CsI18n>The marketplace from where you are operating by default</CsI18n> : <CsI18n>Set to default</CsI18n>}
                                                active={false} preferredPosition="above">
                                                <RadioButton
                                                    checked={main_checked}
                                                    disabled={!checked}
                                                    name="radio-main-marketplace"
                                                    onChange={this.handleSetMain(marketplace_id)}/>
                                            </Tooltip>
                                        </Stack.Item>
                                        <Stack.Item>
                                            <CsToggleButton checked={checked} onChange={this.handleChange(parseInt(id))}/>
                                        </Stack.Item>
                                    </Stack>

                                </ResourceList.Item>
                            )
                        }}/>
                    <div className={"mt-3"}>
                        <Stack alignment={"leading"}>
                            <Stack.Item><Heading>{CsI18n.t('Advanced')}</Heading></Stack.Item>
                            <Stack.Item><Link onClick={this.handleAdvancedOpen}><Icon source={this.state.advanced_active? ChevronUpMinor:ChevronDownMinor}/></Link></Stack.Item>
                        </Stack>
                        <Collapsible open={this.state.advanced_active} id="advanced-collapsible">
                            <div className={"ml-6 mt-2"}>
                                <ChoiceList
                                    allowMultiple
                                    title={CsI18n.t("Options")}
                                    choices={[{
                                        label: CsI18n.t("Notify errors by email."),
                                        value: 'send-email',
                                    }]}
                                    selected={advanced_workflow}
                                    onChange={this.handleAdvancedWorkflow}
                                />
                            </div>
                        </Collapsible>
                    </div>
                </Card.Section>
            );
        } else {
            return (
                <Card.Section>
                    <Banner icon={AlertMinor} status="critical" title={CsI18n.t("There is no active marketplace.")}/>
                </Card.Section>
            );
        }
    }

}
export default Platform;
