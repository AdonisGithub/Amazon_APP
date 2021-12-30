import {Checkbox, DataTable, Heading} from "@shopify/polaris";
import {CsI18n} from "../csI18n/csI18n";
import React from "react";
import './csDataTableEx.css';
import * as Sentry from "@sentry/react";

export default class CsDataTableEx extends React.Component{

    constructor(props){
        super(props);
        this.headers = this.props.headers;
        this.onChange = this.props.onChange;
        this.columnContentType = ['text', ...this.props.columnContentType];

        this.state = {
            last_checked: false,
            last_index: -1,
            selected: this.props.selected,
            dataItem: this.props.dataItem,
            allChecked:false,
        }
    };

    componentWillReceiveProps(nextProps, nextContext) {
        let {selected, dataItem, headers} = nextProps;
        this.headers = headers;
        this.setState({
            selected,
            dataItem,
        });
    }

    handleAllCheck = ()=>{
        let {selected, allChecked} = this.state;
        allChecked = !allChecked;

        selected.forEach((item, index) => {
            if( !item.disabled ) {
                item.checked = allChecked;
            }
        });
        this.setState( state=>({
            ...state,
            last_checked:false,
            last_index: -1,
            allChecked,
        }));
        this.onChange(selected);
    };

    onDataItemClick = (clickIndex) => (event)=>{
        let {selected, last_index, last_checked, allChecked} = this.state;

        let clickItem = selected[clickIndex];
        if(clickItem.disabled === true)
            return;


        let shiftClicked = event.nativeEvent.shiftKey;
        if(shiftClicked && last_index != clickIndex && last_index != -1){
            let startIdx = Number(last_index);
            let endIdx = Number(clickIndex);

            if(endIdx < startIdx)
                for (let i = endIdx; i < startIdx; i++){
                    if( !selected[i].disabled ) {
                        selected[i].checked = last_checked;
                    }
                }
            else
                for (let i = startIdx + 1; i <= endIdx; i++){
                    if( !selected[i].disabled ) {
                        selected[i].checked = last_checked;
                    }
                }
        }
        else
        {
            clickItem.checked = !clickItem.checked;
            selected[clickIndex] = clickItem;
        }

        if(!clickItem.checked)
            allChecked = false;
        last_checked = clickItem.checked;
        last_index = clickIndex;

        this.setState(state=>({
            ...state,
            last_checked,
            last_index,
            allChecked,
        }));

        this.onChange(selected);
    };

    stopPropagation = (event)=>{
        event.stopPropagation();
        return false;
    };

    initDataRow()
    {
        let {selected, dataItem} = this.state;
        // console.log("initDataRow", selected, dataItem);
        this.dataRows = [];

        let selectIndex = 0;
        for( let index in dataItem) {
            let row = [];
            if(dataItem[index].selectable) {
                let item = selected[selectIndex];
                let disabled = true;
                let checked = false;
                if (item) {
                    disabled = item.disabled;
                    checked = item.checked;
                }
                row.push(<div onClick={this.stopPropagation}>
                    <div onClick={this.onDataItemClick(selectIndex)}>
                        <Checkbox
                            disabled={disabled}
                            checked={checked}/>
                    </div>
                </div>);
                selectIndex++;
            } else {
                row.push('');
            }

            for(let key in this.headers) {
                row.push(dataItem[index][this.headers[key].key]);
            }
            this.dataRows.push(row);
        }
    }

    renderHeader(){
        let headers = [];
        headers.push(<Checkbox checked={this.state.allChecked} onChange={this.handleAllCheck}/>);
        for(let key in this.headers)
            headers.push(this.headers[key].label);
        return headers;
    }
    render(){
        this.initDataRow();

        return(
            <div className="data-table" onClick={this.stopPropagation}>
                <DataTable
                    columnContentTypes={this.columnContentType}
                    headings={this.renderHeader()}
                    rows={this.dataRows}
                />
            </div>
        );
    };
}
