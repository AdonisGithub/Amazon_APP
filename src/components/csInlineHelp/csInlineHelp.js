import React, {Component} from 'react';
import {Icon, Stack, TextContainer} from "@shopify/polaris";

import {
    InfoMinor, QuestionMarkMinor
} from '@shopify/polaris-icons';

export default class CsInlineHelp extends React.Component {
    constructor(props) {
        super(props);
    }

    componentWillMount() {
        require('./csInlineHelp.css');
    }

    render() {
        return (
            <div className={"csInlineHelp"}>
                <Stack wrap={false}>
                    <Stack.Item wrap={false}>
                        <Icon source={InfoMinor} color="sky"/>
                    </Stack.Item>
                    <Stack.Item wrap={true}>
                        <TextContainer>
                            {this.props.content}
                        </TextContainer>
                    </Stack.Item>
                </Stack>
            </div>
        );
    }
}