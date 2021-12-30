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
import States from "../../helpers/rules/states";
import CsErrorMessage from "../../components/csErrorMessage";
import CsEmbeddedModal from "../../components/csEmbeddedModal";
import CsButtonGroup from "../../components/csButtonGroup/csButtonGroup";
import ApplicationApiCall from "../../functions/application-api-call";
import {ModelContext} from "./model-context";
import CsInlineHelp from "../../components/csInlineHelp/csInlineHelp";

export default class ModelProductTypeModal extends React.Component {

    static contextType = ModelContext;

    state = {
        opened: false,
        group_id: 0,
        // universe_id: 0,
        selected_universe_index: 0,
        product_type: "",
        init: false,
    }

    constructor(props) {
        super(props);
        this.state.opened = this.props.opened;

        console.log("constructor", this.props, this.state);
        this.marketplace_id = this.props.marketplace_id;
        this.is_update_mode = !!this.props.is_update_mode;
    }

    resetSelectedData() {
        this.universe = [];
        this.universe_buttons = [];
        this.product_type = [];
        this.setState({selected_universe_index: 0, product_type: ""});
    }

    componentWillMount() {
        require('./modelModal.css');
        this.initMatchingGroup();
        if( this.props.group_id/* && this.props.universe && this.props.product_type */) {
            this.handlerGroupChange(this.props.group_id);
        } else {
            this.resetSelectedData();
        }
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

        let {matchingGroup} = this.context.data;
        let marketplace_id = this.getGroupMarketplaceId(groupId);
        if( marketplace_id.length == 0 ) {
            console.error("handlerGroupChange marketplace_id is null");
        }
        console.log("handlerGroupChange: ", groupId, marketplace_id);
        let {configuration, universe} = this.context;
        if( universe[marketplace_id] ) {
            this.initUniverse(universe[marketplace_id]);
            this.setState({group_id: groupId, refresh: true});
        } else {
            let params = {
                configuration: configuration,
                group_id : groupId,
            };
            ApplicationApiCall.get('/application/models/universe', params, this.cbFetchUniverseSuccess, this.cbFetchUniverseError);
            this.resetSelectedData();
            this.setState({group_id: groupId, wait:true});
        }
    }

    /**************************
     * @callback - success function of getting Universe and Product Type
     * @param json
     */
    cbFetchUniverseSuccess = (json) => {
        console.log("cbFetchUniverseSuccess", json);
        if (this.unMounted)
            return;

        if (!json) {
            console.error("json is null");
            return;
        }

        let marketplace_id = this.getGroupMarketplaceId(this.state.group_id);
        this.context.universe[marketplace_id] = json;
        this.initUniverse(json);
        this.setState({wait:false});
    }

    /**************************
     * @callback - error function of getting Universe and Product Type
     * @param err
     */
    cbFetchUniverseError = (err) => {
        console.log("cbFetchUniverseError", err);
        if (err && this.unMounted === false) {
            console.log("cbFetchUniverseError: show error");
            // setTimeout(() => {
            //     this.setState({error: null})
            // }, 5000);
            this.setState({wait: false});
        }
    }

    initUniverse(universeData) {
        this.universe = [];
        let selected_universe_index = 0;
        for (let key in universeData) {
            this.universe.push(universeData[key]);
        }
        this.universe.sort((a, b) => {
            return a.display_name > b.display_name? 1 : -1;
        });
        this.universe_buttons = this.universe.map((item, index) =>{
           return {label: item.display_name, value: index}
        });


        if( this.state.init === false && this.props.universe && this.props.product_type ) {
            for( let index in this.universe ) {
                if( this.universe[index].universe == this.props.universe ) {
                    selected_universe_index = index;
                    break;
                }
            }
            this.initProductTypes(selected_universe_index);
            let product_type = this.props.product_type;
            this.setState({selected_universe_index: selected_universe_index, product_type: product_type, init: true})
        } else {
            this.initProductTypes(selected_universe_index);
            this.setState({selected_universe_index: selected_universe_index});
        }
    }

    /**************************
     * @function - handler when you click universe buttons
     */
    handleUniverseChange = (universe_index) => {
        this.initProductTypes(universe_index);
        this.setState({ selected_universe_index: universe_index, product_type: "" });
    }

    /**************************
     * @function - get data for Product Type
     * @param selectedUniverse
     * @returns {Array} option values of product_type OptionList
     */
    initProductTypes(universe_index) {
        this.product_type = [];
        if( this.universe[universe_index] ) {
            for( let item of this.universe[universe_index].product_types ) {
                this.product_type.push(item);
            }
        }
        this.product_type.sort((a, b) => {
            return a.display_name > b.display_name? 1 : -1;
        });
    }

    handleProductTypeSelect = (productType) => () => {
        let {onChange} = this.props;
        if( onChange ) {
            onChange(this.state.group_id, this.universe[this.state.selected_universe_index].universe, productType, this.universe[this.state.selected_universe_index]);
        }
    }

    render() {
        console.log("render", this.state, this.universe, this.product_type);
        return (
            <CsEmbeddedModal
                open={this.state.opened}
                onClose={this.handleClose}
                title={Constants.text_save_product_type}
                secondaryActions={[
                    {
                        content: <CsI18n>Cancel</CsI18n>,
                        onAction: this.handleClose
                    }
                ]}
                large
            >
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
                    {this.state.wait ? (<div align="center">
                            <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
                        </div>)
                        :
                        (<React.Fragment>
                            <Card sectioned title={CsI18n.t("Please choose universe")}>
                                <CsButtonGroup options={this.universe_buttons} selected={this.state.selected_universe_index}
                                               onChange={this.handleUniverseChange}/>
                            </Card>
                            <Card sectioned title={CsI18n.t("Please refine")}>
                                <ResourceList
                                    resourceName={{singular: 'product_type', plural: 'product_types'}}
                                    items={this.product_type}
                                    renderItem={(item, index) => {
                                        return (
                                            <ResourceList.Item
                                                id={index}
                                            >
                                                <Stack wrap={false} fill key={"product_type-" + item.xsd_product_type}>
                                                    <Stack.Item fill>
                                                        {Util.getRawHtmlElement(item.display_name)}
                                                    </Stack.Item>
                                                    <Stack.Item>
                                                        {this.state.product_type != item.name? (<Button size="slim" onClick={this.handleProductTypeSelect(item.name)}><CsI18n>Use product type</CsI18n></Button>):null}
                                                    </Stack.Item>
                                                </Stack>
                                            </ResourceList.Item>

                                        );
                                    }}
                                />
                            </Card>
                        </React.Fragment>)
                    }
                </Modal.Section>

            </CsEmbeddedModal>
        );
    }

}
