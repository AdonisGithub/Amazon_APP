import React, {Component} from 'react';
import {Switch, Route, Link, Redirect} from 'react-router-dom';
import {
    AppProvider,
    Tabs,
    CalloutCard,
    Button,
    Heading,
    TopBar,
    Frame,
    Modal,
    Scrollable,
    TextContainer, Toast, Spinner, Thumbnail,
    Stack, Avatar, Layout, Banner,
} from "@shopify/polaris";
import IdeaForm from "./item/IdeaForm";
import RoadmapTab from "./RoadmapTab";
import {RoadmapContext} from "./roadmap-context";
import RoadmapApiCall from "./functions/roadmp-api-call";
import CsErrorMessage from "../csErrorMessage";

class FakeCsI18n {
    static t(key, options = null) {
        console.error("FakeCsI18n", key);
        return key;
    }
}

class CsRoadMap extends Component {
    state = {
        tabs: [],
        selected : 0,
        ideaform_active: false,
        showToast: false,
        toastMessage : '',
        ideaform_saved: false,
        loading: true,
        error: null,
    };
    handleChangeTab = (selectedTabIndex) => {
        this.setState({selected: selectedTabIndex})
        // this.props.history.push('/' + this.state.app+ '/' + this.state.tabs[selectedTabIndex].id);
    };
    constructor(props) {
        super(props);

        this.contextData = {
            AppName: this.props.AppName,
            CsI18n: this.props.CsI18n? this.props.CsI18n:FakeCsI18n,
            Tabs: [],
        }
        this.CsI18n = this.contextData.CsI18n;
        console.log("CsRoadMap::Constructor" ,this.contextData);
    }

    componentWillMount() {
        require('./Roadmap.css') ;
    }
    componentDidMount() {
        this._getTabs()
    }
    _getTabs() {
        RoadmapApiCall.get(this.contextData.AppName + '/tabs', [], result => {
            console.log(result.data);
            this.initTabs(result.data);
        }, error => {
            this.setState({error: error, loading: false})
        });
    }

    initTabs(tabs) {
        this.tab_arr = tabs.map((tab, index) => {
            return {
                id : tab.id,
                content: tab.name,
                panelId: 'roadmap-panel-' + tab.id,
            };
        });
        this.contextData.Tabs = this.tab_arr;
        this.setState({loading:false})
    }
    handleIdeaFormView = () => {
        this.setState({
            ideaform_active: true
        })
    };
    handleIdeaFormClose = () => {
        this.setState({
            ideaform_active: false
        })
    };

    handleIdeaFormSubmit = () => {
        this.setState({
            ideaform_active: false,
            toastMessage: this.CsI18n.t('Your idea posted successfully!'),
        }, () => {
            setTimeout(() => {
                this.setState({toastMessage: ''});
            }, 3000);
        });

    }

    toggleToast = () => {
        console.log("toggleToast", this.state);
        this.setState(({showToast}) => ({showToast: !showToast}))
    };

    renderError(){
        console.log(this.state.error);
        return(
            <CsErrorMessage
                errorType={this.state.error.type}
                errorMessage={this.state.error.message}
            />
        )
    }

    render() {
        const {match, location, history} = this.props;
        const {selected, ideaform_active} = this.state;

        console.log("render", this.state);
        if(this.state.error) {
            return this.renderError();
        }

        if( this.state.loading ) {
            return (<div align="center">
                        <br/>
                        <Spinner size="large" color="teal" accessibilityLabel={this.CsI18n.t("Loading")}/>
                    </div>
                );
        }
        return (
            <RoadmapContext.Provider value={this.contextData}>
                <Layout>
                    <Layout.Section>
                        <Stack>
                            <Stack.Item >
                                {/*<img src="https://roadmap-client.common-services.com/images/common_services_512.png" width="50%" />*/}
                                {/*<Heading>Roadmap</Heading>*/}
                            </Stack.Item>
                            <Stack.Item fill />
                            <Stack.Item>
                                <div style={{marginRight: '10px', marginTop: '10px'}}>
                                    <Button primary onClick={this.handleIdeaFormView}><span style={{whiteSpace: 'nowrap'}}>{this.CsI18n.t("Submit Ideas")}</span></Button>
                                </div>
                            </Stack.Item>
                        </Stack>

                        {ideaform_active?
                            (<IdeaForm onClose={this.handleIdeaFormClose} onSubmit={this.handleIdeaFormSubmit} active={ideaform_active} />) : ''}
                    </Layout.Section>
                    {this.state.toastMessage? (<Layout.Section>
                        <Banner status="success" title={this.state.toastMessage}/>
                    </Layout.Section>):''}
                    <Layout.Section>
                    <Tabs selected={selected} tabs={this.tab_arr} fitted onSelect={this.handleChangeTab}>
                        <RoadmapTab tab={this.state.selected}/>
                    </Tabs>
                    </Layout.Section>
                </Layout>

            </RoadmapContext.Provider>
        );
    }
}
export default CsRoadMap;