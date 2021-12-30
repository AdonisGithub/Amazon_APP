import React, {Component} from 'react';
import {AppProvider, Card, Modal, TextContainer, Scrollable, Button} from '@shopify/polaris';
import axios from "axios";
import Const from "../Const";
import ls from "local-storage";
import {ThumbsUpMinor} from '@shopify/polaris-icons';
import * as Sentry from "@sentry/react";

class RoadmapCard extends Component {
    state = {
        active : false,
        roadmap: null
    };

    constructor(props) {
        super(props);
        this.state.roadmap = props.roadmap;
    }

    handleView = () => {
        this.setState({
            active: true
        });

    };

    handleClose = () => {
        this.setState({
            active: false
        })
    };

    handleVote = (e) => {
        let app = this.props.app;
        let url = Const.API_BASE + '/' + app + '/roadmaps/vote/' + this.state.roadmap.id;
        e.stopPropagation();
        axios.get(url)
            .then(data => {
                console.log(data);
                let {onVote} = this.props;
                if(onVote) {
                    onVote(this.state.roadmap.id);
                }
                this.setState({roadmap: data.data.data})

            })
            .catch(error => {
                Sentry.captureException(error);
                console.log(error);
            });
    };
    createMarkup =(html) => {
        return {__html: html};
    };
    render() {
        const {active, roadmap} = this.state;
        return (
            <div className="col-lg-3 col-xl-3 col-md-4 col-sm-6 col-xs-12">
                <div className="m-1">
                    <AppProvider>
                    <Modal open={active} onClose={this.handleClose} primaryAction={{content: 'Close', onAction:this.handleClose}} title={
                        <div className="roadmap-title">
                            {roadmap.title}
                            <span className="roadmap-votes">
                            <Button size="slim" onClick={this.handleVote} disabled={this.props.voted? true:false} icon={ThumbsUpMinor}>{roadmap.votes ? roadmap.votes : '0'}</Button>
                            </span>
                        </div>
                    }>
                        <Modal.Section>
                            {roadmap.picture ? <div className="roadmap-card roadmap-modal"><img className="roadmap-img" src={roadmap.picture} alt="" /></div> : ""}

                            <Scrollable shadow style={{height: roadmap.picture ? '100px' : '200px'}}>
                            <TextContainer>
                                <div dangerouslySetInnerHTML={this.createMarkup(roadmap.content)} className="m-3"/>
                            </TextContainer>
                            </Scrollable>
                        </Modal.Section>
                    </Modal>
                    </AppProvider>
                    <div onClick={this.handleView}>
                    <Card>
                        <Card.Header title={
                            <div className="roadmap-title">
                                {roadmap.title}
                                <span className="roadmap-votes">
                            <Button size="slim" onClick={this.handleVote} disabled={this.props.voted? true:false} icon={ThumbsUpMinor}>{roadmap.votes ? roadmap.votes : '0'}</Button>
                            </span>
                            </div>
                        }></Card.Header>
                        <Card.Section>
                            <div className="roadmap-card" onClick={this.handleView}>

                            {roadmap.picture ? <img src={roadmap.picture} alt="{roadmap.title}" className="roadmap-img" /> : <div className="roadmap-content" dangerouslySetInnerHTML={this.createMarkup(roadmap.content)} />}

                            </div>
                        </Card.Section>
                    </Card>
                    </div>
                </div>
            </div>

        );
    }

    componentDidMount() {

    }

    componentDidUpdate(prevProps, prevState, snapshot) {

    }

    componentWillUnmount() {
    }
}
export default RoadmapCard;