import React, {Component} from 'react';
import {
    TextField,
    Checkbox,
    Select,
} from '@shopify/polaris';
import {CsValidationContext} from "./csValidationForm";

import CsAutocomplete from "../csAutocomplete";


//input type
const INPUT_UNKNOWN = 0;
const INPUT_CHECKBOX = 1;
const INPUT_EMAIL = 2;
const INPUT_NORMAL = 3;
const INPUT_SELECT = 4;
const INPUT_CsAutoComplete = 5;

//rule type
const RULE_REQUIRED = 1;
const RULE_PATTERN = 2;
const RULE_MAXLENGTH = 3;
const RULE_MINLENGTH = 4;
const RULE_EMAIL = 5;
const RULE_STRING = 6;
const RULE_NUMBER = 7;
const RULE_FLOAT = 8;
const RULE_MIN = 9;
const RULE_MAX = 10;

const RuleMap = {
    required: RULE_REQUIRED,
    pattern: RULE_PATTERN,
    maxlength: RULE_MAXLENGTH,
    minlength: RULE_MINLENGTH,
    email: RULE_EMAIL,
    number: RULE_NUMBER,
    string: RULE_STRING,
    float: RULE_FLOAT,
    max: RULE_MAX,
    min: RULE_MIN,
};

class CsValidationItem extends Component {
    static defaultProps = {
        rule: "",
        title: ""
    }

    render() {
        return (
            <React.Fragment/>
        );
    }
}


class CsValidation extends Component {

    static contextType = CsValidationContext;
    static Item = CsValidationItem;

    constructor(props) {
        super(props);
        this.rules = [];
    }

    state = {
        errorFlag: false,
        errorIndex: 0,
        errorMessage: "",
    }

    addValidationRule = (rule, title) => {
        console.log(rule + ":" + title);
        rule = rule.toLowerCase();
        if (RuleMap[rule] === undefined)
            return;
        this.rules.push({rule: RuleMap[rule], title: title});
    }

    componentDidMount() {
        //add Validator
        const {addValidator} = this.context;
        addValidator(this);
        //read components Item
        this.rules = [];
        let children = [];
        if (this.props.children.length === undefined) {
            children.push(this.props.children);
        } else {
            children = this.props.children;
        }
        // console.log("componentDidMount: children", children);
        for (const child of children) {
            if (!child)
                continue;
            if (child.props.rule === undefined || child.props.title === undefined)
                continue;
            this.addValidationRule(child.props.rule, child.props.title);
        }
    }

    componentWillReceiveProps(nextProps, nextContext) {
        if( this.state.errorFlag ) {
            let oldValue = this.getValue(this.props);
            let nextValue = this.getValue(nextProps);
            if( oldValue !== nextValue ) {
                this.setState({errorFlag: false, errorMessage: "", errorIndex: 0});
            }
        }
    }

    componentWillUnmount() {
        const {removeValidator} = this.context;
        removeValidator(this);
    }

    doValidation = () => {
        if (this.props.children === undefined) {
            console.log("Empty object");
            return true;
        }
        let children = [];
        if (this.props.children.length === undefined) {
            children.push(this.props.children);
        } else {
            children = this.props.children;
        }
        console.log("doValidation", children);
        this.rules = [];
        for (const child of children) {
            if (!child)
                continue;
            if (child.props.rule === undefined || child.props.title === undefined)
                continue;
            this.addValidationRule(child.props.rule, child.props.title);
        }

        // console.log("doValidation: " + children.length);
        let index = 0;
        let errorMsg;
        for (const child of children) {
            index++;
            errorMsg = this.validate(child);
            if (errorMsg !== "") {
                this.setState({errorFlag: true, errorMessage: errorMsg, errorIndex: index});
                return false;
            }
        }
        if (this.state.errorFlag) {
            this.setState({errorFlag: false, errorMessage: "", errorIndex: 0});
        }
        return true;
    }

    render() {
        let children = this.props.children;
        let index = 0;
        const childrenWithProps = React.Children.map(children, child => {
            index++;
            if (!child) {
                return '';
            }
            if( index == this.state.errorIndex && this.state.errorFlag && this.state.errorMessage !== "" ) {
                    return React.cloneElement(child, {error: this.state.errorMessage});
                } else {
                    return React.cloneElement(child);
                }
            }
        );
        return (
            <React.Fragment>
                {childrenWithProps}
            </React.Fragment>
        );

        // if (this.state.errorFlag && this.state.errorMessage !== "") {
        //     // let children = this.props.children;
        //     // console.log("render: add error: ", this.state.errorIndex);
        //     //
        //     // for(let i in this.props.children) {
        //     //     console.log("render: child", i);
        //     //     if( i == this.state.errorIndex ) {
        //     //         this.props.children[i].error = this.state.errorMessage;
        //     //     }
        //     // }
        //     // let children = this.props.children;
        //     // let index = 0;
        //     // const childrenWithProps = React.Children.map(children, child => {
        //     //         index++;
        //     //         if (index === this.state.errorIndex) {
        //     //             return React.cloneElement(child, {error: this.state.errorMessage})
        //     //         } else {
        //     //             return child;
        //     //         }
        //     //     }
        //     // );
        //     let children = this.props.children;
        //     let index = 0;
        //     const childrenWithProps = React.Children.map(children, child => {
        //             index++;
        //             if (index === this.state.errorIndex) {
        //                 return React.cloneElement(child, {error: this.state.errorMessage})
        //             } else {
        //                 return child;
        //             }
        //         }
        //     );
        //     return (
        //         <React.Fragment>
        //             {childrenWithProps}
        //         </React.Fragment>
        //     );
        // }
        // return (
        //     <React.Fragment>
        //         {this.props.children}
        //     </React.Fragment>
        // );
    }

    //following will be updated.

    getInputType = (obj) => {
        switch (obj.type) {
            case Checkbox:
                //console.log("input type: checkbox");
                return INPUT_CHECKBOX;
            case TextField: {
                if (obj.props.type !== undefined && obj.props.type === "email")
                    return INPUT_EMAIL;

                return INPUT_NORMAL;
            }
            case Select:
                return INPUT_SELECT;
            case CsAutocomplete:
                return INPUT_CsAutoComplete;
            default:
                console.log("getInputType: unknown", obj, obj.props);
        }
        return INPUT_UNKNOWN;
    }
    getInputValue = (obj, type) => {
        switch (type) {
            case INPUT_CHECKBOX: {
                if (obj.props.checked === undefined) {
                    return 0;
                } else {
                    return obj.props.checked;
                }
                break;
            }
            case INPUT_EMAIL:
            case INPUT_NORMAL:
            case INPUT_SELECT: {
                if (obj.props.value === undefined) {
                    return "";
                } else {
                    return obj.props.value;
                }
                break;
            }
            case INPUT_CsAutoComplete: {
                if (obj.props.selected === undefined) {
                    return "";
                } else {
                    return obj.props.selected;
                }
            }
        }
        return 0;
    }

    getValue(props) {
        let inputType;
        let inputValue;
        if( !props.children )
            return null;
        for (const obj of props.children) {
            if (!obj) {
                continue;
            }
            inputType = this.getInputType(obj);
            if (inputType === INPUT_UNKNOWN)
                continue;
            inputValue = this.getInputValue(obj, inputType);
            return inputValue;
        }
        return null;
    }

    validate = (obj) => {
        let inputType;
        let inputValue;
        if (!obj) {
            return "";
        }
        inputType = this.getInputType(obj);
        if (inputType === INPUT_UNKNOWN)
            return "";
        inputValue = this.getInputValue(obj, inputType);

        // console.log(this.rules);
        for (const rule of this.rules) {
            // console.log(`${rule.rule}  ${inputType} ${inputValue}`);
            if (checkRule(rule.rule, inputType, inputValue, obj) === false) {
                return rule.title;
            }
        }
        return "";
    }
}

function matchRegexp(value, regexp) {
    var validationRegexp = regexp instanceof RegExp ? regexp : new RegExp(regexp);
    return validationRegexp.test(value);
};

function checkRule(rule, ...input) {
    switch (rule) {
        case RULE_REQUIRED:
            return checkRequire(...input);
        case RULE_MINLENGTH:
            return checkMinlength(...input);
        case RULE_MAXLENGTH:
            return checkMaxlength(...input);
        case RULE_EMAIL:
            return checkEmail(...input);
        case RULE_PATTERN:
            return checkPattern(...input);
        case RULE_FLOAT:
            return checkFloat(...input);
        case RULE_NUMBER:
            return checkNumber(...input);
        case RULE_STRING:
            return checkString(...input);
        case RULE_MIN:
            return checkMin(...input);
        case RULE_MAX:
            return checkMax(...input);
    }
    console.log("checkRule Unknown!!!");
    return false;
}

function checkRequire(type, value, obj) {
    return value ? true : false;
}

function checkMinlength(type, value, obj) {
    if (obj.props.minLength === undefined)
        return true;
    if (typeof (value) !== 'string') {
        return false;
    }
    if (value.length < parseInt(obj.props.minLength, 10))
        return false;
    return true;
}

function checkMaxlength(type, value, obj) {
    if (obj.props.maxLength === undefined)
        return true;
    if (typeof (value) !== 'string') {
        return false;
    }
    if (value.length > parseInt(obj.props.maxLength, 10))
        return false;
    return true;
}

function checkMin(type, value, obj) {
    if (obj.props.min === undefined) {
        return true;
    }

    return parseInt(value, 10) >= parseInt(obj.props.min, 10);
}


function checkMax(type, value, obj) {
    if (obj.props.max === undefined)
        return true;

    return parseInt(value, 10) <= parseInt(obj.props.max, 10);
}

function checkEmail(type, value, obj) {
    if (value === "")
        return true;

    return matchRegexp(value, /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i);
}

function checkPattern(type, value, obj) {

    if (value === "")
        return true;
    let pattern = obj.props.pattern;
    if (pattern === undefined)
        return true;

    return matchRegexp(value, pattern);
}

function checkNumber(type, value, obj) {
    return matchRegexp(value, /^-?[0-9]\d*(\d+)?$/i);
}

function checkFloat(type, value, obj) {
    return matchRegexp(value, /^(?:[1-9]\d*|0)?(?:\.\d+)?$/i);
}

function checkString(type, value, obj) {
    return (typeof value === 'string' || value instanceof String);
}

export default CsValidation;
