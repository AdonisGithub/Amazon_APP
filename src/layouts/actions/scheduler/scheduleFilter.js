import React from 'react';
import {ActionList, Button, Icon, Popover, Select, Stack} from '@shopify/polaris';

export default class ScheduleFilter extends React.Component {
    state = {
        value: null,
        section: null,
        operation: null,
        action: null,
        isSection: null,
        isOperation: null,
        isAction: null,
    };

    constructor(props) {
        super(props);
        console.log(props)
        this.options = [{label:'Select', value: '', disabled: true}];
        this.state.value = this.props.value;
        this.state.section = this.props.section;
        this.state.operation = this.props.operation;
        this.state.action = this.props.action;
        this.state.isSection = this.props.isSection;
        this.state.isOperation = this.props.isOperation;
        this.state.isAction = this.props.isAction;
        this.getOptions()
    }

    componentWillReceiveProps(nextProps, nextContext) {
        console.log(nextProps)
        this.state.value = nextProps.value;
        this.state.section = nextProps.section;
        this.state.operation = nextProps.operation;
        this.state.action = nextProps.action;
        this.state.isOperation = nextProps.isOperation;
        this.state.isAction = nextProps.isAction;
        this.options = [{label:'Select', value: '', disabled: true}];
        this.getOptions()
    }

    getOptions(){
        console.log(this.state);
        console.log(this.state.isSection, this.state.isOperation, this.state.isAction)
        if(this.state.hasOwnProperty('isSection') && this.state.isSection === true){
            this.props.options.sections.forEach((option) => {
                this.options.push({label: option, value: option})
            })
        } else if(this.state.hasOwnProperty('isOperation') && this.state.isOperation === true && this.state.section !== ''){
            console.log(this.props.options.filters, this.state.section)
            Object.keys(this.props.options.filters[this.state.section]).forEach((item) => {
                this.options.push({label: item, value: item});
            })
        } else if(this.state.hasOwnProperty('isAction') && this.state.isAction === true && this.state.section !== '' && this.state.operation !== ''){
            this.props.options.filters[this.state.section][this.state.operation].forEach(item => {
                this.options.push({label: item, value: item});
            })
        }
    }

    handleChange = (value) => {
        this.props.onChange(value);
    }

    render() {
        console.log(this.state, this.options)
        return(
            <Select
                options={this.options}
                value={this.state.value}
                onChange={this.handleChange}
            />
        )
    }
}
