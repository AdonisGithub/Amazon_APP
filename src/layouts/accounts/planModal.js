import React from 'react'
import CsI18n from "../../components/csI18n"

import {
  Heading,
  Stack,
  Banner,
  Spinner,
  Layout,
  TextStyle,
  Button,
  Card,
  ResourceList, Tooltip, Icon,
  Badge, DisplayText, Checkbox, TextField
} from '@shopify/polaris';

import "./charge_modal.scss";
import CsEmbeddedModal from "../../components/csEmbeddedModal";
import ShopifyContext from "../../context";

class PlanModal extends React.Component {
  state = {
    opened: false,
    plan_type: 0,
    processing: false,
  }

  constructor(props) {
    super(props);
    this.state.opened = this.props.opened;
    this.state.plan_type = this.props.plan_type;
  }

  componentWillMount() {
  }

  handleClose = () => {
    let {onClose} = this.props;
    if (onClose) {
      onClose();
    }
  }

  onClickPlan = (new_plan_type) => () => {
    let {onChangePlan} = this.props;
    if (onChangePlan) {
      onChangePlan(new_plan_type);
    }
  }

  render() {
    let {plan_type, processing} = this.state;
    let isAdminMode = ShopifyContext.getShared().isAdminMode();
    return (
      <CsEmbeddedModal
        open={this.state.opened}
        onClose={this.handleClose}
        title={CsI18n.t("Choose your plan")}
        secondaryActions={[
          {
            content: <CsI18n>Cancel</CsI18n>,
            onAction: this.handleClose,
            disabled: processing
          }
        ]}
        large
      >
        <div className={"plan-choose-modal"}>
          <div className={"plan-name"}><CsI18n>Free Plan</CsI18n></div>
          <div className={"plan"}>
            <div className={"plan-text"}>
                <ul>
                    <li><CsI18n>Up to 50 orders per month</CsI18n><br/></li>
                    <li><CsI18n>Limited to 1 region (for example Americas or Europe, not both)</CsI18n></li>
                    <li><CsI18n>Limited to 1 location</CsI18n></li>
                    <li><CsI18n>2% charge on Orders (as same as for Sales Channel Apps)</CsI18n></li>
                </ul>
            </div>
            <div className={"plan-button"}><Button onClick={this.onClickPlan(10)} disabled={!isAdminMode && (plan_type > 0)}><CsI18n>Select</CsI18n></Button></div>
          </div>
            <div className={"plan-name"}><CsI18n>$19 Basic</CsI18n></div>
          <div className={"plan"}>
            <div className={"plan-text"}>
                <ul>
                    <CsI18n>Unlimited sync of your inventory, orders management, no orders fees</CsI18n><br/>
                    <CsI18n>Includes multiple Amazon marketplaces, multiple countries, multiple locations, features: as
                        sync, bulk products creation, orders management and much more...</CsI18n>
                </ul>
            </div>
            <div className={"plan-button"}><Button onClick={this.onClickPlan(1)} disabled={!isAdminMode && plan_type >= 1 && plan_type < 10}><CsI18n>Select</CsI18n></Button></div>
          </div>
            <div className={"plan-name"}><CsI18n>$29 Advanced</CsI18n></div>
          <div className={"plan"}>
              <div className={"plan-text"}>
                  <ul>
                      <li><CsI18n>Unlimited; Includes all features above + FBA and MCF, Prime, Business</CsI18n></li>
                  </ul>
              </div>
            <div className={"plan-button"}><Button onClick={this.onClickPlan(2)} disabled={!isAdminMode && plan_type >= 2 && plan_type < 10}><CsI18n>Select</CsI18n></Button>
            </div>
          </div>
            <div className={"plan-name"}><CsI18n>$59 Shopify pro or greater than Basic</CsI18n></div>
          <div className={"plan"}>
            <div className={"plan-text"}>
                <ul>
                    <li><CsI18n>Unlimited plan for professional sellers</CsI18n></li>
                    <li><CsI18n>Includes All features above, + a VIP support plan</CsI18n></li>
                </ul>
            </div>
            <div className={"plan-button"}><Button onClick={this.onClickPlan(3)} disabled={!isAdminMode && plan_type >= 3 && plan_type < 10}><CsI18n>Select</CsI18n></Button>
            </div>
          </div>
        </div>
      </CsEmbeddedModal>
    );
  }
}

export default PlanModal;
