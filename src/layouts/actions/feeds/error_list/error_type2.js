import React from 'react'
import CsI18n from "../../../../components/csI18n"
import {
  Heading,
} from '@shopify/polaris';
import CsDataTable from "../../../../components/csDataTable";
import "../feeds.scss";
import ErrorTypeBase from "./error_type_base";

class ErrorType2 extends ErrorTypeBase {
  getClassName() {
    return "feeds-error2";
  }

  renderRow(item, index) {
    let dataItem = [];
    dataItem.push(item.sku);
    dataItem.push(item.description);
    return dataItem;
  }
  renderTable(list) {
    return (
        <CsDataTable
            onChange={this.handleItemCheck}
            columnContentType={[
              'text',
              'text',
            ]}
            headers={[
              <Heading><CsI18n>SKU</CsI18n></Heading>,
              <Heading><CsI18n>Messages</CsI18n></Heading>,
            ]}
            dataItem={list}
            selected={this.state.selected}/>
    );
  }
}
export default ErrorType2;
