import React from "react";
import { Autocomplete, Icon, TextField, Button } from "@shopify/polaris";
import { SearchMinor, ArrowUpDownMinor } from "@shopify/polaris-icons";

export default class CsAutocomplete2 extends React.Component {
    state = {
        selected: [],
        inputText: "",
    };

    constructor(props) {
        super(props);
        this.options = props.options.map(item => {
            if( item.value !== undefined && item.label !== undefined ) {
                return item;
            } else if(typeof(item) === "string") {
                return {value: item, label: item};
            }
        });
        this.state.options = this.options;
        this.state.inputText = this.props.value;
    }

    componentWillReceiveProps(nextProps, nextContext) {
        if( this.props.error != nextProps.error ) {
            let error = nextProps.error;
            this.setState({error});
        }
        if( this.props.value != nextProps.value) {
            let value = nextProps.value;
            this.setState({inputText: value});
        }
    }

    render() {
        let {error, allowedInput} = this.props;
        const textField = (
            <Autocomplete.TextField
                onChange={this.updateText}
                label="Tags"
                labelHidden={true}
                value={this.state.inputText}
                error={error}
                readOnly={allowedInput? false:true}
                connectedRight={<Button><Icon source={ArrowUpDownMinor} /></Button>}
            />
        );
        return (
            <Autocomplete
                options={this.state.options}
                selected={this.state.selected}
                onSelect={this.updateSelection}
                textField={textField}
            />
        );
    }

    handleChange(value) {
        let {onChange} = this.props;
        if(onChange) {
            onChange(value);
        }
    }

    updateText = newValue => {
        this.setState({ inputText: newValue });
        this.handleChange(newValue);
        this.filterAndUpdateOptions(newValue);
    };

    filterAndUpdateOptions = inputString => {
        if (inputString === "") {
            this.setState({
                options: this.options
            });
            return;
        }

        const filterRegex = new RegExp(inputString, "i");
        const resultOptions = this.options.filter(option =>
            option.label.match(filterRegex)
        );
        this.setState({
            options: resultOptions
        });
    };

    updateSelection = selected => {
        const selectedText = selected.map(selectedItem => {
            const matchedOption = this.options.find(option => {
                return option.value.match(selectedItem);
            });
            return matchedOption && matchedOption.label;
        });
        this.handleChange(selectedText);
        this.setState({ selected, inputText: selectedText });
    };
}
