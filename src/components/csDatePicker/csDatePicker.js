import React from 'react';
import {
    TextField,
    Popover,
    DatePicker,
    Icon,
} from '@shopify/polaris';

import {
    CalendarMinor,
} from '@shopify/polaris-icons';

import "./csDatePicker.css";

export default class CsDatePicker extends React.Component {
    state = {
        toggle: false,
        year: 0,
        month: 0,
        date: null,
    }

    constructor(props) {
        super(props);
        this.state.date = props.date ? new Date(props.date) : new Date();
        this.state.year = this.state.date.getFullYear();
        this.state.month = this.state.date.getMonth();
    }

    handlePopover = (field, value) => () => {

        if( value === this.state.toggle)
            return;
        this.setState( (state)=> {
            return {...state, toggle: value};
        } );
    }
    componentWillReceiveProps(nextProps, nextContext) {

        let date = nextProps.date ? new Date(nextProps.date) : new Date();
        let year = date.getFullYear();
        let month = date.getMonth();
        this.setState(preState => ({
           ...preState,
           date,
           year,
           month
        }));
    }

    handleDateChange = (date) => {

        let {onChange} = this.props;
        if( onChange ) {
            onChange(date.start);
        }

        this.setState({toggle: false});
    }

    handleMonthChange = (month, year) => {
        this.setState({year, month});
    }

    render() {

        let className = this.props.className || "date-textfield";
        let dateValue = this.props.date? this.props.date:""; //2019-01-16

        const dateTextField = (
            <div className={className}><TextField prefix={<Icon source={CalendarMinor} color="inkLight"></Icon>}
                                                  label={this.props.label}
                                                  value={dateValue}
                                                  onFocus={this.handlePopover("textFieldFocus", true)}
            /></div>
        );
        return (
            <React.Fragment>
            <Popover
                active={this.state.toggle}
                activator={dateTextField}
                onClose={this.handlePopover("popoverClose", false)}
                sectioned
            >
                <DatePicker
                    year={this.state.year}
                    month={this.state.month}
                    selected={this.state.date}
                    onChange={this.handleDateChange}
                    onMonthChange={this.handleMonthChange}
                    allowRange={false}
                />
            </Popover>
            </React.Fragment>

        );
    }

}


