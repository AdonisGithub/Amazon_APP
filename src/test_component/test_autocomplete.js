import React from "react";
import {
    Avatar,
    Card,
    ResourceList,
    TextStyle
} from "@shopify/polaris";

import CsAutocomplete from "../components/csAutocomplete";

const valid_values = [
    "Mae Jemison1",
    "Ellen Ochoa2",
    "Joe Smith3",
    "Haden Jerado4",
    "Tom Thommas5",
    "Emily Amrak6",
    "Mae Jemison7",
    "Ellen Ochoa8",
    "Joe Smith9",
    "Haden Jerado10",
    "Tom Thommas11",
    "Emily Amrak12",
    "Mae Jemison13",
    "Ellen Ochoa14",
    "Joe Smith15",
    "Haden Jerado16",
    "Tom Thommas17",
    "Emily Amrak18",
];


export default class TestAutoComplete extends React.Component {
    state = {
        value: "",
        error: "",
    }

    constructor(props) {
        super(props);
        this.valid_values = [...valid_values];
    }

    handleValueChange = (value) => {
        this.setState({value});
    }

    handleValidValueAdd = (value) => {
        this.valid_values.push(value);
        this.setState({refresh: true});
    }

    render() {
        return (<React.Fragment>
            <CsAutocomplete
                isOnlyValue={true}
                options={this.valid_values}
                selected={this.state.value}
                allowedInput={true}
                allowedAddNew={true}
                onChange={this.handleValueChange}
                onAdd={this.handleValidValueAdd}
                error={this.state.error}
                isAddFirstEmpty={true}
            />
        </React.Fragment>);
    }
}
