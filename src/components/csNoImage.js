import React from 'react';
import {
    Thumbnail,
} from '@shopify/polaris';
import Context from "../context";


export default class CsNoImage extends React.Component {
    constructor(props) {
        super(props);
        this.shopify = Context.getShared();
        this.no_image_url = this.shopify.static_content + '/amazon/no-image.png';
    }

    render() {
        return (
            <Thumbnail
                alt={this.props.alt}
                source={this.no_image_url}
                size={this.props.size}
            />
        );
    }
}

CsNoImage.defaultProps = {
    size: 'large',
    alt: '',
};
