import React from 'react';
import CsI18n from "../csI18n"
import {ResourceList, Button, Icon, Popover, Stack, TextField, Key, Spinner, Scrollable} from '@shopify/polaris'

import {
    CirclePlusMinor,
    ArrowUpDownMinor,
} from '@shopify/polaris-icons';

export default class CsAutocomplete extends React.Component {

    state = {
        inputText: "",
        value: "",
        textfocused: false,
        filtered_options: [], //filtered items
        options: [],
        isAddButton: false,
        isOnlyValue: false, //true: filtered_options is array of object: {label: , value: }, false: array of string
        activePopover: false,
        selectIdx: -1,
        refresh: true,
        loading: false,
    };

    constructor(props) {
        super(props);
        this.rows = [];
        this.init(props);
    }

    componentWillMount() {
        require("./csAutocomplete.css");
    }

    getSelectedIndex(value) {
        let inputIndex = -1;
        let selected = this.state.options.filter((item, index) => {
            if( item.value == value) {
                inputIndex = index;
                return true;
            } else {
                return false;
            }
        });
        return inputIndex;
    }
    init(props) {

        if( props.hasOwnProperty('loading'))
            this.state.loading = props.loading;
        let options;
        if( !props.hasOwnProperty('isOnlyValue')) {
            this.state.isOnlyValue = false;
        } else {
            this.state.isOnlyValue = props.isOnlyValue;
        }
        if( props.options ) {
            if( this.state.isOnlyValue ) {
                options = props.options.map((item) => ({label: item, value: item}));
            } else {
                options = props.options;
            }
            if( props.isAddFirstEmpty ) {
                if( options.length > 0 && options[0].value != "") {
                    options.unshift({label: "", value: ""});
                }
            }
        } else {
            options = [];
        }
        if( this.state.value != props.selected) {
            this.state.isAddButton = false;
        }
        this.state.value = props.selected;
        if( JSON.stringify(options) !== JSON.stringify(this.state.options) ) {
            this.state.options = options;
            this.state.filtered_options = this.state.options;
        }

        let inputIndex = this.getSelectedIndex(this.state.value);
        if( this.state.isOnlyValue ) {
            this.state.inputText = this.state.value;
        } else {
            if ( inputIndex != -1 ) {
                this.state.inputText = this.state.options[inputIndex].label;
            } else { //@kbug_190609
                this.state.inputText = "";
            }
        }

        this.state.selectIdx = inputIndex;
    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.init(nextProps);
        this.setState({refresh: true});
    }

    closePopover = () => {
        if( this.state.loading ){
            return;
        }
        this.setState({activePopover: false})
    };


    handleTextChange = (text) => {
        let {value: last_value} = this.state;
        const full_matchItems = this.state.options.filter((item) => {
            return item.label.toLowerCase() === text.toLowerCase()
        });

        let filtered = this.state.options.filter((item) => {
            return item.label.toLowerCase().indexOf(text.toLowerCase()) !== -1;
        })

        let isAddButton = false;
        let isFullMatch = false;
        if (full_matchItems.length === 0) {
            if( this.state.isOnlyValue && text !== "" && this.props.allowedAddNew ) {
                isAddButton = true;
            }
        } else if (full_matchItems.length === 1) {
            isFullMatch = true;
        }
        let inputText = text;
        let value = last_value;

        let bChanged = false;
        if( this.state.isOnlyValue ) {
            if( isFullMatch ) {
                value = full_matchItems[0].value;
            } else {
                value = text;
            }
        } else {
            if (filtered && filtered.length == 1) {
                value = filtered[0].value;
            }
        }
        bChanged = last_value !== value;

        let selectIdx = -1;
        let filtered_options = filtered;
        let activePopover = (isAddButton || filtered.length > 0)? true : false;
        let {onChange} = this.props;
        if( onChange && bChanged ) {
            onChange(value);
        }
        let {onChangeText} = this.props;
        if( onChangeText ){
            onChangeText(inputText);
        }

        this.setState({
            refresh: true,
            inputText,
            value,
            selectIdx,
            filtered_options,
            activePopover,
            isAddButton,
        });
    }

    handleRightButtonClick = (e) => {
        if( e.type == "focus") {
            if( this.state.activePopover )
                return;
        }

        let textfocused = true;
        if ( this.state.activePopover == false ) {
            let filtered_options = this.state.options;

            this.setState({
                activePopover: true,
                textfocused,
                filtered_options,
            });
        } else {
            this.setState({
                textfocused
            }, this.closePopover)

        }
    }

    onItemClick(selected) {
        selected = parseInt(selected);
        if(this.state.isAddButton && selected === 0){
            this.handleAddButtonClick();
            return;
        }
        let index = this.state.isAddButton? selected - 1 : selected;
        let value = this.state.filtered_options[index].value;
        let inputText = this.state.filtered_options[index].label;
        let selectIdx = this.getSelectedIndex(this.state.filtered_options[index].value);
        let {onChange} = this.props;
        if( onChange ){
            onChange(value);
        }
        this.setState({
            value,
            inputText,
            selectIdx,
            isAddButton: false,
        }, this.closePopover);
    }

    handleItemClick = (index) => () => {
        this.onItemClick(index);
    }

    handleAddButtonClick = () => {

        const {onAdd} = this.props;
        if(onAdd){
            onAdd(this.state.inputText);
        }
        this.setState({isAddButton: false});
        this.closePopover();
    }

    initRows = () => {
        this.rows = [];
        let className = '';

        for (let index in this.state.filtered_options) {
            index = parseInt(index);
            let row;
            let item = this.state.filtered_options[index];
            let label = this.state.filtered_options[index].label;
            if(this.state.value === item.value){
                row = <div className={"csAuto_item item-selected" + (label==""? " item-empty":"")} key={"item-" + index + "-selected"}>
                    <span className={"csAuto-fake-item"}><Scrollable.ScrollTo/></span>
                    <a onClick={this.handleItemClick( this.state.isAddButton? index+1:index)}>{label}</a>
                  </div>;
            } else {
                row = <div className={"csAuto_item item-normal" + (label==""? " item-empty":"")}  key={"item-" + index + "-normal"}>
                      <a onClick={this.handleItemClick( this.state.isAddButton? index+1:index)}>{label}</a>
                    </div>;
            }
            this.rows.push(row);
        }
    }

    render() {
        this.initRows();
        let {error, allowedInput} = this.props;
        const activator = (
            <div className="textField">
                <TextField
                  value={this.state.inputText}
                    onChange={this.handleTextChange}
                    autoComplete={false}
                    focused={this.state.textfocused}
                    error={error}
                    connectedRight={
                        <Button  onClick={this.handleRightButtonClick} disabled={this.props.disabled}>
                            <Icon source={ArrowUpDownMinor}/>
                        </Button>
                    }
                    placeholder={this.props.placeholder}
                    readOnly={allowedInput? false:true}
                    onFocus={this.handleRightButtonClick}
                  disabled={this.props.disabled}
                />
            </div>
        );

        const addButton = (
            <a className="add-button" onClick={this.handleAddButtonClick}>
                <Stack distribution="leading" spacing="extraTight" alignment="center" wrap={true}>
                    <Stack.Item><Icon source={CirclePlusMinor}></Icon></Stack.Item>
                    <Stack.Item><p><CsI18n>Add</CsI18n></p></Stack.Item>
                    <Stack.Item><p>{this.state.inputText}</p></Stack.Item>
                </Stack>
            </a>
        )

        const button = this.state.loading ? this.renderLoding()
            : this.state.isAddButton? addButton : '';
        let {activePopover} = this.state;
        if( !button && this.rows.length == 0 && activePopover ) {
            activePopover = false;
        }
        return (
            <div className="csAuto_popOver">
                <Popover
                    fullWidth={true}
                    active={activePopover}
                    activator={activator}
                    onClose={this.closePopover}
                    preventAutofocus={true}
                    preferredPosition={"mostSpace"}
                >
                    <div className="csAuto_list">
                        {button}
                        {this.state.loading? "":this.rows}
                    </div>
                </Popover>
            </div>
        );
    }

    renderLoding(){
        return(
            <div className="loading">
                <Spinner size="small" color="teal" accessibilityLabel={CsI18n.t("Loading")} ></Spinner>
            </div>
        )
    }
}

CsAutocomplete.defaultProps = {
    isOnlyValue: false,
    allowedInput: true,
    allowedAddNew: false,
    selected: '',
    isAddFirstEmpty: false,
    placeholder: ""
}
