import React, {Component} from 'react';
import {
    Icon,
    Link,
    Tooltip
} from '@shopify/polaris';
import Context from "../../context";

import {
    PlayCircleMajorMonotone
} from '@shopify/polaris-icons';
import CsI18n from "./../../components/csI18n"

export default class CsVideoTutorialButton extends React.Component {

    constructor(props) {
        super(props);
    }

    handleCsVideoTutorial = () => {
        let {video_width, video_height, url, margin} = this.props;
        if( !video_height || !video_width || !url )
            return false;

        console.log("handleCsVideoTutorial", window.outerWidth, window.outerHeight, window.innerWidth, window.innerHeight);
        let org_width = window.innerWidth;
        let org_height = window.innerHeight;

        let rate_window = org_height / org_width;
        let rate_video = video_height / video_width;

        let height, width;
        if( rate_window > rate_video ) {
            width = org_width;
            height = parseInt((video_height * (org_width - margin * 2)) / video_width) + margin * 2;
        } else {
            height = org_height;
            width = parseInt((video_width * (org_height - margin * 2)) / video_height) + margin * 2;
        }

        window.open(url,
            'csvideotutorial',
            'width='+width+',height='+height);
        return false;
    }

    static defaultProps = {
        color: "purple",
        video_width: 1378,
        video_height: 720,
        margin: 8,
    }

    componentDidMount() {
        require('./csVideoTutorialButton.css') ;
    }

    render(){
        return (
            <span className={"csVideoTutorial"}>
                  <Tooltip content={CsI18n.t("Watch the video tutorial")}>
                    <Link onClick={this.handleCsVideoTutorial} target={"_blank"}><Icon source={PlayCircleMajorMonotone}
                                                                                       color={this.props.color}/></Link>
                  </Tooltip>
            </span>
        )
    }
}


