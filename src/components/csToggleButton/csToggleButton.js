import React, {Component} from 'react';
import {
    AppProvider,
} from '@shopify/polaris';
import Context from "../../context";


export default class CsToggleButton extends React.Component {
    state = {
        checked: false,
    };

    constructor(props) {
        super(props);
        this.shopify = Context.getShared();
        this.state.checked = props.checked;
        this.handleChange = this.handleChange.bind(this);

    }

    componentWillMount() {
        require('./csToggleButton.css') ;
    }

    componentWillReceiveProps(nextProps, nextContext) {
        if( this.state.checked != nextProps.checked ) {
            this.setState({checked: nextProps.checked});
        }
    }

    handleChange = (value) => () => {
        console.log(value);
        this.props.onChange(!value);
        // this.setState(({checked: !value}))
    }

    render() {

        return (
            <div>
                <label className="csToggleButton-switch">
                    <input type="checkbox" checked={this.state.checked}  onChange={this.handleChange(this.state.checked)}/>
                    <span className="csToggleButton-slider round"></span>
                </label>
            </div>
        );
    }
}
