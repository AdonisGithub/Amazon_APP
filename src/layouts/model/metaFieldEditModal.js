import React from 'react';
import Constants from "../../helpers/rules/constants";
import {
    Button,
    Card,
    ChoiceList,
    Collapsible,
    DisplayText,
    Modal,
    FormLayout,
    OptionList,
    ResourceList,
    Select,
    Stack,
    TextContainer,
    TextField,
    ButtonGroup,
    TextStyle,
    Tooltip,
    Icon,
    Badge,
    Banner,
    Link,
    Heading,
    Spinner,
    DataTable,
    Checkbox,
    Layout,
    Label, Form
} from "@shopify/polaris";

import {
    ChevronDownMinor,
    ChevronUpMinor,
    QuestionMarkMajorMonotone,
    PlusMinor,
    DeleteMinor,
    CirclePlusMajorMonotone,
    CirclePlusMinor,
    CircleMinusMinor,
} from '@shopify/polaris-icons';
import CsI18n from "../../components/csI18n";
import Util from "../../helpers/Util";
import States from "../../helpers/rules/states";
import CsErrorMessage from "../../components/csErrorMessage";
import CsEmbeddedModal from "../../components/csEmbeddedModal";
import ApplicationApiCall from "../../functions/application-api-call";
import {ModelContext} from "./model-context";
import {CsValidationForm, CsValidation} from "../../components/csValidationForm";
import CsAutoComplete from '../../components/csAutocomplete/csAutocomplete';

export default class MetaFieldEditModal extends React.Component {

    static contextType = ModelContext;

    state = {
        opened: false,
        status: States.STATUS_NORMAL,
    }

    constructor(props) {
        super(props);
        this.state.opened = this.props.opened;
        this.unMounted = false;
    }

    componentWillMount() {
        require('./metaFields.css');
        this.initData();
    }

    initData() {
        console.log("initData", this.props);
        this.state.mode = this.props.current === -1 ? States.MODE_ADD : States.MODE_EDIT;
        if (this.state.mode === States.MODE_ADD) {
            let item = {};
            item.universe = '';
            item.universe_display_name = '';
            item.name = '';
            item.display_name = '';
            item.values = [];
            item.active = true;
            this.state.item = item;
        } else {
            this.state.item = this.props.items[this.props.current] ? Util.clone(this.props.items[this.props.current]) : null;
            this.initName(this.state.item);
        }
        this.initCandidate(this.state.item);
        console.log("initConfig", this.state);
    }

    initCandidate(item) {
        let items = (item.universe && this.props.candidate[item.universe])? this.props.candidate[item.universe].fields:[];
        this.candidate = [{label: "", value: ""}, ...items.map(ele => {return {label: ele.display_name, value: ele.name}})];
    }

    initName(item) {
        if( item.name ) {
            let fields = (item.universe && this.props.candidate[item.universe]) ? this.props.candidate[item.universe].fields : [];
            for (let key in fields) {
                if ( fields[key].name == item.name) {
                    item.display_name = fields[key].display_name;
                    this.valid_values = fields[key].valid_values;
                    return;
                }
            }
        }
        this.valid_values = [];
    }

    componentWillUnmount() {
        this.unMounted = true;
    }

    handleClose = () => {
        let {onClose} = this.props;
        if (onClose) {
            onClose();
        }
    }

    handleSave = () => {
        console.log("handleSave");
        let {item} = this.state;
        let {marketplace_id} = this.props;
        let {configuration} = this.context;
        let params = {configuration, marketplace_id}
        ApplicationApiCall.post('/application/models/savemeta',
            params,
            item,
            (result) => {
                if( !result.error && result.metafield_id) {
                    item.metafield_id = result.metafield_id;
                    let {onSave} = this.props;
                    if (onSave) {
                        onSave(item);
                    }
                } else {

                }
            },
            () => {

            });

        this.setState({status: States.STATUS_SAVING});
    }

    handleChangeUniverse = (value) => {
        console.log("handleChangeUniverse", value);
        let {item} = this.state;
        item.universe = value;
        if( item.universe && this.props.candidate[item.universe] ) {
            item.universe_display_name = this.props.candidate[item.universe].universe_display_name;
        }
        item.name = "";
        item.display_name = "";
        item.values = [];
        this.initCandidate(item);

        this.setState({item: item});
    }

    handleChangeName = (value) => {
        console.log("handleChangeName", value);
        let {item} = this.state;
        item.name = value;
        this.initName(item);
        if( item.name ) {
            item.values = [""];
        } else {
            item.values = [];
        }
        this.setState({item: item});
    }

    handleAddValue = () => {
        let {item} = this.state;
        item.values.push("");
        this.setState({item: item});
    }

    handleChangeValue = index => (value) => {
        let {item} = this.state;
        item.values[index] = value;
        this.setState({item: item});
    }

    handleDeleteValue = index => () => {
        let {item} = this.state;
        item.values.splice(index, 1);
        this.setState({item: item});
    };

    render() {
        console.log("render", this.props, this.state);
        let {item} = this.state;

        return (
            <CsEmbeddedModal
                open={this.state.opened}
                onClose={this.handleClose}
                title={CsI18n.t(this.state.mode === States.MODE_ADD? 'Add meta field':'Edit meta field')}
                primaryAction={{
                    content: <CsI18n>Save</CsI18n>,
                    onAction: this.handleSave,
                    disabled: (item.name? false:true) || this.state.status == States.STATUS_SAVING,
                    loading: this.state.status == States.STATUS_SAVING
                }}
                secondaryActions={{
                        content: <CsI18n>Cancel</CsI18n>,
                        onAction: this.handleClose
                    }}
            >
                <Modal.Section>
                    <CsValidationForm name="metaFieldEditForm">
                        <Heading><CsI18n>Meta field</CsI18n></Heading>
                        <FormLayout>
                            {this.state.mode == States.MODE_ADD?
                                <FormLayout.Group condensed>
                                    <Select label="Universe" labelHidden={true} options={this.props.universe} value={this.state.item.universe} onChange={this.handleChangeUniverse} disabled={this.state.status == States.STATUS_SAVING} />
                                    <Select label="Meta field" labelHidden={true} options={this.candidate} value={this.state.item.name} onChange={this.handleChangeName}  disabled={this.state.status == States.STATUS_SAVING}/>
                                </FormLayout.Group>
                                :
                                <Label>{item.universe_display_name + ' > ' + item.display_name}</Label>
                            }
                        </FormLayout>
                        <div className={"mt-5"}>
                        <Heading><CsI18n>Values</CsI18n></Heading>
                        <FormLayout>
                            {this.renderValues()}
                        </FormLayout>
                        </div>
                    </CsValidationForm>
                </Modal.Section>
            </CsEmbeddedModal>
        );
    }

    renderValues() {
        let {item} = this.state;

        return (<ResourceList
            resourceName={{singular: 'value', plural: 'values'}}
            items={item.values}
            renderItem={(value, index) => {
                // console.log(condition_items)
                return (
                    <ResourceList.Item
                        id={index}
                    >
                        <Stack wrap={false} fill key={index}>
                            <Stack.Item fill>
                                <FormLayout>
                                    <CsAutoComplete
                                        isOnlyValue={true}
                                        options={this.valid_values}
                                        onChange={this.handleChangeValue(index)}
                                        selected={value}
                                        allowedInput={true}
                                        disabled={this.state.status == States.STATUS_SAVING}
                                    />
                                </FormLayout>
                            </Stack.Item>
                            <Stack.Item distribution="trailing">
                                {parseInt(index) === 0 ?
                                    <Button icon={PlusMinor} onClick={this.handleAddValue}/>
                                    :
                                    <Button icon={DeleteMinor}
                                            onClick={this.handleDeleteValue(index)}/>
                                }
                            </Stack.Item>
                        </Stack>
                    </ResourceList.Item>
                );
            }}
        />);
    }

}