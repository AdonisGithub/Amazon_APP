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
    TextField, ButtonGroup, TextStyle, Tooltip, Icon, Badge, Banner, Link, Heading, Spinner,
} from "@shopify/polaris";
import CsI18n from "../../components/csI18n";
import Util from "../../helpers/Util";
import CsEmbeddedModal from "../../components/csEmbeddedModal";
import ApplicationApiCall from "../../functions/application-api-call";
import {ModelContext} from "./model-context";

export default class ModelDuplicateModal extends React.Component {

    static contextType = ModelContext;

    state = {
        opened: false,
        group_id: 0,
        processing: false,
    }

    constructor(props) {
        super(props);
        this.state.opened = this.props.opened;

        console.log("constructor", this.props, this.state);
        this.marketplace_id = this.props.marketplace_id;
        this.is_update_mode = !!this.props.is_update_mode;
    }

    componentWillMount() {
        require('./modelModal.css');
        this.initMatchingGroup();
    }

    componentWillReceiveProps(nextProps, nextContext) {
        if (nextProps.opened != this.state.opened) {
            this.setState({opened: nextProps.opened});
        }
    }

    initMatchingGroup() {
        // Initialization of Model Groups
        let {matchingGroup} = this.context.data;
        let {modelList} = this.context.data;
        let groups = [{label: CsI18n.t('Select matching group'), value: 0}];
        matchingGroup.forEach((item, index) => {
            if( this.marketplace_id != item.marketplace_id ) {
                return;
            }
            let {is_update_mode} = item;

            is_update_mode = !!is_update_mode;
            if (is_update_mode != this.is_update_mode) {
                return;
            }
            let bExist = false;
            if( item.id != this.props.group_id ) {
                for(let i in modelList) {
                    if( modelList[i].group_id == item.id ) {
                        bExist = true;
                        break;
                    }
                }
            }
            if( !bExist ) {
                groups.push({
                    label: item.groupName,
                    value: item.id
                });
            }
        });
        this.matchingGroups = groups;
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

    handleDuplicate =  () => {
        let {onDuplicate} = this.props;
        let groupId = this.state.group_id;
        if (onDuplicate) {
            onDuplicate(groupId);
        }
        this.setState({processing: true});
    }

    getGroupMarketplaceId(groupId) {
        let {matchingGroup} = this.context.data;
        let marketplace_id = "";
        for(let item of matchingGroup) {
            if( item.id == groupId ) {
                marketplace_id = item.marketplace_id;
                break;
            }
        }
        return marketplace_id;
    }
    /**************************
     * @function - get Universe and Product Type
     * @remark - Api call function
     */
    handlerGroupChange = (groupId) => {
        groupId = parseInt(groupId);
        if( !groupId ) {
            return;
        }

        this.setState({group_id: groupId});
    }

    render() {
        console.log("render", this.state, this.universe, this.product_type);
        return (
            <CsEmbeddedModal
                open={this.state.opened}
                onClose={this.handleClose}
                title={Constants.text_duplicate_model}
                primaryAction={{
                    content: <CsI18n>Duplicate</CsI18n>,
                    onAction: this.handleDuplicate,
                    disabled: this.state.group_id == 0,
                    loading: this.state.processing
                }}
                secondaryActions={[
                    {
                        content: <CsI18n>Cancel</CsI18n>,
                        onAction: this.handleClose,
                        disabled: this.state.processing
                    }
                ]}>
                <Modal.Section>
                    <div className="section-select-matching-group">
                        <div className={"label"}>
                        <Heading>{CsI18n.t('Please choose matching group')}</Heading>
                        </div>
                        <div className={"field"}>
                        <Select
                            options={this.matchingGroups}
                            onChange={this.handlerGroupChange}
                            value={this.state.group_id}
                        />
                        </div>
                    </div>
                </Modal.Section>
            </CsEmbeddedModal>
        );
    }

}
