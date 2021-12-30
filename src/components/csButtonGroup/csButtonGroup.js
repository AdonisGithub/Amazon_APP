import React, {Component} from 'react';
import {
    AppProvider,
    Stack
} from '@shopify/polaris';


export default class CsButtonGroup extends React.Component {
    state = {
        selected: 0,
        options: []
    };

    constructor(props) {
        super(props);
        this.state.selected = props.selected;
        this.state.options = props.options;
        this.handleChange = this.handleChange.bind(this);
    }

    componentWillMount() {
        require('./csButtonGroup.css') ;
    }

    componentWillReceiveProps(nextProps, nextContext) {
        // if( this.state.checked != nextProps.checked ) {
        //     this.setState({checked: nextProps.checked});
        // }
        this.setState({
            options: nextProps.options,
            selected: nextProps.selected
        })

    }

    handleChange = (value) => () => {
        this.setState(({selected: value}));
        let {onChange} = this.props;
        if ( onChange )
            onChange(value);
    }


    render() {
        let items = [];
        this.state.options.forEach((item, index) => {
            items.push(this.renderItem(item, index));
        })
        return (
            <Stack children={items}></Stack>
        );
    }

    renderItem = (item, index) => {
        if (item.value == this.state.selected) {
            return (
                <button className="csButtonGroup-normal csButtonGroup-selected" onClick={this.handleChange(item.value)}>{item.label}</button>
            );
        } else {
            return (
                <button className="csButtonGroup-normal" onClick={this.handleChange(item.value)}>{item.label}</button>
            );
        }

    }
}
