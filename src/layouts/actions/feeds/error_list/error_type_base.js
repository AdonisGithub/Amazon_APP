import React from 'react'
import CsI18n from "../../../../components/csI18n"


import {
  Button,
  Card,
  Banner,
  Badge,
  Heading,
  Page,
  Stack,
  Modal,
  TextContainer,
} from '@shopify/polaris';
import {
  ChevronDownMinor,
} from "@shopify/polaris-icons";

import Util from '../../../../helpers/Util';
import "../feeds.scss";
import {ERROR_ACTION_TYPE} from "../../../../constant/actions/feeds";
import CsErrorMessage from "../../../../components/csErrorMessage";
import CsEmbeddedModal from "../../../../components/csEmbeddedModal";

class ErrorTypeBase extends React.Component {

  state = {
    selected: [],
    processing: false,
    actionSuccess: null,
    actionError: null,
    isActionModalShow: false,
    action_type: false,
    data: [],
  };

  constructor(props) {
    super(props);

    this.initialState = Util.clone(this.state);
    this.state.data = this.props.data;
    let selected = [];
    for (let index in this.state.data) {
      selected.push({id: index, disabled: this.state.data[index].disabled, checked: false});
    }
    this.state.selected = selected;
    this.unMounted = false;
  }

  componentWillUpdate(nextProps, nextState, nextContext) {
  }

  componentWillReceiveProps(nextProps) {
    let data = nextProps.data;
    let old_selected = this.state.selected;
    let selected = [];
    for (let index in data) {
      selected.push({id: index, disabled: data[index].disabled, checked: (old_selected[index] && old_selected[index].checked)? true:false});
    }
    console.log("componentWillReceiveProps", selected);
    this.setState({data, selected});
  }

  componentDidMount() {
  }

  componentWillUnmount() {
    this.unMounted = true;
  }

  handleItemCheck = (row_selected) =>{
    let {selected} = this.state;
    for(let i in row_selected) {
      selected[row_selected[i].id] = row_selected[i];
    }
    console.log("handleItemCheck", row_selected, selected);
    // this.filteredRows_selected = row_selected;
    this.setState({selected});
  };

  getSelectedCount() {
    let selected = this.state.selected;
    let count = 0;
    selected.forEach(item => {
      if( item.checked ) {
        count++;
      }
    });
    return count;
  }


  getSelectedItems() {
    let selected = this.state.selected;
    let selected_items = [];
    selected.forEach((item, index) => {
      if( item.checked ) {
        let {submission_id, id, sku, asin, candidate_catalog}  = this.state.data[index];
        selected_items.push({submission_id, id, sku, asin, candidate_catalog});
      }
    });
    return selected_items;
  }

  doAction = () => {
    let action_type = this.state.action_type;
    console.log("doAction: ", action_type);
    let {onAction} = this.props;
    if( onAction ) {
      let selected_items = this.getSelectedItems();
      onAction(action_type, selected_items, (message) => {
        this.cbActionSuccess(message);
      }, this.cbActionError);
    }
    this.setState({processing: true});
    this.handleCloseModal();
  }

  cbActionSuccess = ( message ) => {
    let selected = this.state.selected;
    for(let i in selected) {
      selected[i].checked = false;
    }
    setTimeout(() => {
      this.setState({actionSuccess: null})
    }, 5000);
    this.setState({selected, processing: false, actionSuccess: message, error: null});
  }

  cbActionError = (error) => {
    // setTimeout(() => {
    //   this.setState({error: null})
    // }, 7000);
    this.setState({processing: false, error: error});
  }

  handleCloseModal = () => {
    this.setState( ({
      isActionModalShow: false,
      action_type: ''
    }));
  };

  handleAction = (action_type) => () => {
    console.log("handleAction: ", action_type);
    this.setState( ({
      isActionModalShow: true,
      action_type
    }));
  }

  renderModal() {
    let selected_count = this.getSelectedCount();
    let title = '';
    if( selected_count === 1) {
      title = CsI18n.t("Resolve error");
    } else {
      title = CsI18n.t("Resolve {{selected_count}} errors", {selected_count: selected_count});
    }
    return(
        <CsEmbeddedModal
            open={true}
            onClose={this.handleCloseModal}
            title={title}
            primaryAction={{
              content: <CsI18n>OK</CsI18n>,
              onAction: this.doAction,
            }}
            secondaryActions={[
              {
                content: <CsI18n>Cancel</CsI18n>,
                onAction: this.handleCloseModal
              }
            ]}
        >
          <Modal.Section>
            <TextContainer>
              <p><CsI18n>Do you still want to continue?</CsI18n></p>
            </TextContainer>
          </Modal.Section>
        </CsEmbeddedModal>
    )
  }

  renderTableAction() {
    console.log("renderTable", this.state.selected);
    let selected_count = this.getSelectedCount();
    let table_info = (<Stack alignment={"center"}>
      <Stack.Item><Heading><CsI18n>Total</CsI18n>:</Heading></Stack.Item><Stack.Item>{this.state.data.length}</Stack.Item>
      <Stack.Item><Heading><CsI18n>Selected</CsI18n>:</Heading></Stack.Item><Stack.Item>{selected_count}</Stack.Item>
    </Stack>);
    let resolve_action = '';
    let action_type = this.props.action_type;
    switch(action_type) {
      case ERROR_ACTION_TYPE.Edit_Attribute:
        resolve_action = (<Button onClick={this.handleAction(action_type)} loading={this.state.processing} disabled={ this.state.processing || selected_count === 0}><CsI18n>Edit attribute</CsI18n></Button>);
        break;
      case ERROR_ACTION_TYPE.Confirm_ASIN:
        resolve_action = (<Button onClick={this.handleAction(action_type)}  loading={this.state.processing} disabled={ this.state.processing || selected_count === 0}><CsI18n>Confirm ASIN</CsI18n></Button>);
        break;
      case ERROR_ACTION_TYPE.Override:
        resolve_action = (<Button onClick={this.handleAction(action_type)} loading={this.state.processing} disabled={ this.state.processing || selected_count === 0}><CsI18n>Override</CsI18n></Button>);
        break;
      case ERROR_ACTION_TYPE.Recreate:
        resolve_action = (<Button onClick={this.handleAction(action_type)} loading={this.state.processing} disabled={ this.state.processing || selected_count === 0}><CsI18n>Recreate</CsI18n></Button>);
        break;
      default:
      case ERROR_ACTION_TYPE.Solved:
        action_type= ERROR_ACTION_TYPE.Solved; //don't remove //@kbug
        resolve_action = (<Button onClick={this.handleAction(action_type)} loading={this.state.processing} disabled={ this.state.processing || selected_count === 0}><CsI18n>Solved</CsI18n></Button>);
        break;
    }
    return (<Stack alignment={"center"}><Stack.Item fill>{table_info}</Stack.Item><Stack.Item>{resolve_action}</Stack.Item></Stack>);
  }

  renderSuccess(){
    return(
        <div className={"mb-3 mt-3"}>
          <Banner status="success" title={this.state.actionSuccess}/>
        </div>
    )
  }

  renderError(){
    let errorType;
    let errorMessage;
    if (this.state.error ) {
      errorType = this.state.error.type;
      errorMessage = this.state.error.message
    } else {
      return '';
    }

    return(<CsErrorMessage
            errorType={errorType}
            errorMessage={errorMessage}
        />);
  }

  render() {
    let list = [];
    this.state.data.forEach((item, index) => {
      list.push(this.renderRow(item, index));
    });
    return (<div className="feeds-error-items">
        <div className={this.getClassName() + " mt-3"}>
          {this.renderTableAction()}
          {this.state.actionSuccess? this.renderSuccess():''}
          {this.state.error? this.renderError():''}
          {this.renderTable(list)}
          {this.state.isActionModalShow? this.renderModal():''}
        </div>
      </div>);
  }

  getClassName() {
    return "";
  }

  renderRow(item, index) {
    let dataItem = [];
    dataItem.push(item.sku);
    dataItem.push(item.description);
    return dataItem;
  }
  renderTable() {
    return '';
  }
}
export default ErrorTypeBase;
