import {Checkbox, DataTable, Heading} from "@shopify/polaris";
import {CsI18n} from "../csI18n/csI18n";
import React from "react";
import './csDataTable.css';

export default class CsDataTable extends React.Component{

    constructor(props){
        super(props);
        this.headers = this.props.headers;
        this.onChange = this.props.onChange;
        this.columnContentType = ['text', ...this.props.columnContentType];

        this.state = {
            last_checked: false,
            last_index: -1,
            selected:this.props.selected,
            dataItem:this.props.dataItem,
            allChecked:false,
        }
    };

    // initData(indexRows){
    //     for(let i in this.props.dataItem){
    //         if(indexRows[i] === undefined){
    //             indexRows[i] = [];
    //             indexRows[i]['id'] = i;
    //             indexRows[i]['checked'] = false;
    //             indexRows[i]['disable'] = false;
    //         }
    //     }
    //     return indexRows;
    // };
    //
    componentWillReceiveProps(nextProps, nextContext) {
        let {selected, dataItem} = nextProps;
        this.setState(state=>({
            ...state,
            selected,
            dataItem,
        }));
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
        this.dataRows = [];

        for( let index in dataItem) {
            const item = selected[index];

            this.dataRows[index] = [];

            this.dataRows[index].push(
                <div onClick={this.stopPropagation}>
                <div onClick={this.onDataItemClick(index)}>
                <Checkbox
                    disabled={item.disabled}
                    checked={item.checked}/></div></div>);
            for(let key in this.headers)
            {
                this.dataRows[index].push(dataItem[index][key]);
            }
        }
    }

    renderHeader(){
        let headers = [];
        headers.push(<Checkbox checked={this.state.allChecked} onChange={this.handleAllCheck}/>);
        for(let key in this.headers)
            headers.push(this.headers[key]?this.headers[key]:'');
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