import React from "react";
import {Button, Select, Popover, Stack, Icon} from "@shopify/polaris";
import {CaretDownMinor} from "@shopify/polaris-icons";
import Util from "../../helpers/Util";
import CsI18n from "../../components/csI18n";


class CsFastFilter extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      active: false,
      value:'',
      selected: [],
    }

  }

  componentWillMount() {
    require('./csFastFilter.css');
  }

  componentWillUpdate(nextProps, nextState, nextContext) {
    // console.log(nextProps);
    this.filters = [{label: CsI18n.t('Select filter...'), value: '', disabled: true}];
    this.filters = this.filters.concat(Util.clone(nextProps.filters));
  }

  togglePopover = () => {
    this.setState(({active}) => {
      return {active: !active};
    });
  };

  handleChange = (value) => {
    // console.log(value);
    this.setState({value: value});
  }

  handleAddFilter = () => {
    let dupulicated = this.props.appliedFilters.find(item => {
      return item.value === this.state.value;
    })
    if(!dupulicated){
      let res = this.props.filters.find((item) => {
        return item.value === this.state.value;
      });
      this.props.appliedFilters.push(res);

      this.props.onFiltersChange(this.props.appliedFilters);
    }

    this.togglePopover();
  }

  render() {
    // console.log(this.state);

    const activator = (
      <Button onClick={this.togglePopover}><CsI18n>Filter</CsI18n><Icon source={CaretDownMinor}></Icon></Button>
    );

    return (
      <div>
        <Popover
            preferredAlignment="left"
          active={this.state.active}
          activator={activator}
          onClose={this.togglePopover}
        >
          <Popover.Section>
            <Stack vertical>
              <Stack.Item>
                <Select
                  label={CsI18n.t("Show all items where")}
                  options={this.filters}
                  value={this.state.value}
                  onChange={this.handleChange}
                />
              </Stack.Item>

              <Stack.Item>
                <Button
                  disabled={this.state.value === ''}
                  onClick={this.handleAddFilter}><CsI18n>Add Filter</CsI18n></Button>
              </Stack.Item>
            </Stack>
          </Popover.Section>
        </Popover>
      </div>
    );
  }

}

export default CsFastFilter