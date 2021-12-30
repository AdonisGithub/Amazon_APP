import React, {Component} from 'react';
import Const from "./Const";
import RoadmapCard from "./item/RoadmapCard";
import {RoadmapContext} from "./roadmap-context";
import RoadmapApiCall from "./functions/roadmp-api-call";
import {Spinner} from "@shopify/polaris";
import CsErrorMessage from "../csErrorMessage";
import ls from "local-storage";


export default class RoadmapTab extends Component {

    static contextType = RoadmapContext;

    state = {
        roadmaps: [],
        loading: true,
        error: null,
    };

    constructor(props) {
        super(props);
        this.votes = this.getVotes();
        console.log("Votes: ", this.votes);
    }

    getVotes = () => {
        let votes = ls.get("roadmap_votes");
        if( votes instanceof Array) {
            return votes;
        }
        return [];
    }

    isVoted(id) {
        return this.votes.includes(id);
    }

    addVote = (id) => {
        console.log("addVote: ", id);
        if(this.votes.includes(id))
            return;
        this.votes.push(id);
        ls.set("roadmap_votes", this.votes);
        this.setState({refresh: true});
    }

    componentWillMount() {
        this.contextData = this.context;
        this.CsI18n = this.contextData.CsI18n;
        this._getRoadmaps(this.props.tab);
    }

    componentWillReceiveProps(nextProps, nextContext) {
        if( nextProps.tab != this.props.tab) {
            this._getRoadmaps(nextProps.tab);
        }
    }

    _getRoadmaps(tab_index) {
        let {Tabs} = this.contextData;
        let tab = Tabs[tab_index];
        if( tab.roadmap ) {
            this.initRoadmap(tab.roadmap);
        } else {
            let operation = this.contextData.AppName + '/roadmaps/category/' + tab.id;
            RoadmapApiCall.get(operation, [], result => {
                console.log(result.data);
                tab.roadmap = result.data;
                this.initRoadmap(result.data);
            }, error => {
                this.setState({error: error, loading: false})
            });
            this.setState({loading: true});
        }
    }

    initRoadmap( roadmaps ) {
        this.setState({roadmaps: roadmaps, loading: false});
    }

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
            <div>
                {this.state.roadmaps.map((category, index) => (
                    <div key={index}>
                        <h2 className="roadmap-devider"><span>{category.category.name}</span></h2>
                        <div className="row">
                            {category.roadmaps.map((roadmap, rindex) => (
                                <RoadmapCard roadmap={roadmap} app={this.contextData.AppName} key={rindex} voted={this.isVoted(roadmap.id)} onVote={this.addVote} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }
}
