import React from "react";
import {Loading} from '@shopify/polaris';

const url_roadmap = "https://roadmap-client.common-services.com/";
class CsRoadMapFrame extends React.Component{
    state = {
        loading: true,
    }

    constructor(props) {
        super(props);
        this.state.loading = true;
    }

    componentDidMount() {
        require("./csRoadMapFrame.css");
    }

    onLoad = () => {
        this.setState({loading: false});
    }

    render() {
        let {AppName} = this.props;
        let {paddingTop} = this.props;
        let {store_email, store_domain, store_name} = this.props;
        let {lang} = this.props;
        if(!lang) {
            lang = 'en';
        }
        paddingTop = paddingTop || 0;
        console.log('roadmap', store_email, store_domain, store_name);
        store_email = encodeURIComponent(store_email);
        store_domain = encodeURIComponent(store_domain);
        store_name = encodeURIComponent(store_name);
        let version = '2020110301';
        return (
            <React.Fragment>
                {this.state.loading? <Loading/>:''}
            <iframe style={{border: 'none', display: 'flex', flex: '1 1'}} src={url_roadmap + AppName + `?v=${version}&lang=${lang}&store=${store_email}&domain=${store_domain}&name=${store_name}`} onLoad={this.onLoad}/>
            </React.Fragment>
        );
    }
}

CsRoadMapFrame.defaultProps = {
    paddingTop: 54
}

export default CsRoadMapFrame;
