import React, {Component} from 'react';
import {Form} from '@shopify/polaris';

export const CsValidationContext = React.createContext();

class CsValidationForm extends Component {

    static _forms = new Map();
    static addForm(name, obj) {
        CsValidationForm._forms.set(name, obj);
    }
    static validate(name) {
        if(  name === "" || CsValidationForm._forms.has(name) === false ) {
            throw(new Error('Name required!'));
            return;
        }
        let obj = CsValidationForm._forms.get(name);
        if( obj === null || obj === undefined) {
            throw(new Error('Invalid name!'));
            return;
        }

        return obj.doValidate();
    }
    constructor(props) {
        super(props);
        this.objList = [];
        if( !this.props.hasOwnProperty('name') || this.props.name === "")
            return;
        CsValidationForm.addForm(this.props.name, this);
    }

    static defaultProps = {
        onSubmit: (event) => {}
    }

    addValidator = (obj) => {
        this.objList.push(obj);
    }

    removeValidator = (obj) => {
        console.log("removeValidator", obj);
        let index = -1;
        for( let i in this.objList) {
            if(this.objList[i] === obj) {
                // console.log("removeValidator", i);
                index = i;
                break;
            }
        }
        if( index !== -1) {
            this.objList.splice(index, 1);
        }

    }

    doValidate = () => {
        let flag = true;
        for( const item of this.objList) {
            if(item.doValidation() === false)
                flag = false;
        }
        return flag;
    }

    handlerSubmit = (event) => {
        const {onSubmit} = this.props;
        if (this.doValidate() === false) {

            console.log("CsValidationForm : Submit is stoped!.")
            event.preventDefault();
            return;
        }

        onSubmit(event);
    }

    // componentWillReceiveProps(nextProps) {
    //     console.log("validateform.componentWillReceiveProps");
    // }

    getContext() {
        return {
            addValidator: this.addValidator,
            removeValidator: this.removeValidator,
        };
    }

    render() {
        let { onSubmit, ...props} = this.props;
        //let props2 = props.filter(item => item !== 'onSubmit');
        return (
            <CsValidationContext.Provider value={this.getContext()}>
                <Form  {...props} noValidate onSubmit={this.handlerSubmit}>
                    {this.props.children}
                </Form>
            </CsValidationContext.Provider>
        )
    }
}
export default CsValidationForm;
