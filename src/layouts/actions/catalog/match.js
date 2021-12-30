import React from 'react'
import CsI18n from "../../../components/csI18n"


import {
    Heading,
    Stack,
    Spinner,
    Layout,
    DataTable,
    TextStyle,
    Banner,
    Button,
    Icon,
    Tooltip,
    Checkbox,
    Select
} from '@shopify/polaris';
import {ViewMinor} from "@shopify/polaris-icons";

import ApplicationApiCall from "../../../functions/application-api-call";
import shopifyContext from "../../../context";
import AmazonTab from "../../../helpers/amazon-tab";
import "../actions.scss"
import CsErrorMessage from "../../../components/csErrorMessage";
import CsImageModal from "../../../components/csImageModal";
import Util from "../../../helpers/Util";
import CsNoImage from "../../../components/csNoImage";

const DEFAULT_PAGE_COUNT = 10;
const SELECT_PAGE_OPTIONS = [
    {label: 10, value: 10},
    {label: 20, value: 20},
    {label: 50, value: 50},
];

class Match extends AmazonTab {

    //added by @kbug_190223
    getName() {
        return "Match";
    }

    state = {
        ...this.state,
        getStarted: true,
        processing: false,

        current_page: 1,
        total_pages: 0,
        total_count: 0,
        page_item_count: DEFAULT_PAGE_COUNT,

        isAllChecked: false,
        checked: [],
        active: [],
        keypress: null,
        matchList: [],
        error: false,
        offering: false,
        offerSuccess: false,
        offerError: false,
        offeredItems: [],
        activeImageModalIndex: "",
    };

    constructor(props) {
        super(props);

        this.initialState = Util.clone(this.state);
        this.dataRows = [];
        this.marketplaceInfo = props.marketplaceInfo;
        this.selectedConfiguration = this.getConfigurationSelectedIndex();
        this.shopify = shopifyContext.getShared();
        this.unMounted = false;
    }

    componentWillReceiveProps(nextProps) {
        super.componentWillReceiveProps(nextProps);
        console.log("componentWillReceiveProps", this.selectedConfiguration);


        if (this.marketplaceInfo.MarketplaceId !== nextProps.marketplaceInfo.MarketplaceId ||
            this.selectedConfiguration !== this.getConfigurationSelectedIndex()) {

            this.marketplaceInfo = nextProps.marketplaceInfo;
            this.selectedConfiguration = this.getConfigurationSelectedIndex();

            this.setState(this.initialState);
        }
    }

    init = () => {
        let configuration = this.shopify.getConfigurationSelected();
        let section = "amazon";
        let marketplace_id = this.marketplaceInfo.MarketplaceId;
        let {current_page, page_item_count} = this.state;
        if (current_page < 1) {
            current_page = 1;
        }

        let limit_from = (current_page - 1) * page_item_count;
        let limit_to = page_item_count;
        let params = {configuration, limit_from, limit_to, section, marketplace_id};
        ApplicationApiCall.get('/application/offers/match', params, this.cbInitData(), this.cbInitError, false);
        this.setState(preState => ({...preState, processing: true}));
    }

    cbInitData = () => (json) => {
        console.log("sbInitData", json);
        if (json && this.unMounted === false) {
            let total_count = json.total_count ? parseInt(json.total_count) : 0;
            let total_pages = json.total_pages ? parseInt(json.total_pages) : 0;
            let matchList = json.products ? this.state.matchList.concat(json.products) : this.state.matchList;
            this.setState(preState => ({
                ...preState,
                total_count,
                total_pages,
                matchList: matchList,
                processing: false,
            }))
        }
    }

    cbInitError = (err) => {
        console.log(err);

        if (err && this.unMounted === false) {
            this.setState({error: err, processing: false})
        }
    }

    handleMoreBtnClick = () => {
        this.setState(preState => ({
            ...preState,
            current_page: preState.current_page + 1,
        }), this.init);
    }

    cbOfferSuccess = (json) => {
        console.log("cbOfferSuccess", json);

        let offeredItems = this.state.offeredItems.concat(this.state.checked);
        this.setState({
            offering: false,
            offerSuccess: true,
            offeredItems: offeredItems,
            checked: [],
            isAllChecked: false
        });
        setTimeout(() => {
            this.setState({offerSuccess: false, processing: false});
        }, 5000);
    }

    cbOfferFail = (err) => {
        console.log("cbOfferFail");

        this.setState({offering: false, offerSuccess: false, offerError: err});
        // setTimeout(() => {
        //   this.setState({offerError: null, processing: false});
        // }, 5000);
    }

    handleCreateOffer = () => {
        let selectedItems = this.state.checked.sort().map(index => {
            return {sku: this.state.matchList[index].sku, asin: this.state.matchList[index].asin};
        })
        console.log("%cHandleCreateOffer", 'color:green', selectedItems)
        let configuration = this.shopify.getConfigurationSelected();
        let section = "amazon";
        let marketplace_id = this.marketplaceInfo.MarketplaceId;
        let params = {configuration, section, marketplace_id};
        let data = {marketplace_id, items: selectedItems};
        ApplicationApiCall.post('/application/offers/match', params, data, this.cbOfferSuccess, this.cbOfferFail, false);

        this.setState({offering: true});
    }

    handleChangeChecked = (field) => (value) => {
        let {checked} = this.state;
        if (field === 'all') {
            if (value === true) {
                this.state.matchList.forEach((item, index) => {
                    if (this.state.offeredItems.indexOf(parseInt(index)) === -1) {
                        checked.push(parseInt(index));
                    }
                })
            } else {
                checked = [];
            }
        } else {
            if (value) {
                checked = [...checked, parseInt(field)];
            } else {
                let pos = checked.indexOf(parseInt(field));
                checked.splice(pos, 1);
            }
        }

        this.setState({checked: checked}, this.checkAllfn)
    }

    checkAllfn = () => {

        if (this.state.checked.length === this.state.matchList.length - this.state.offeredItems.length) {
            this.setState({isAllChecked: true});
        } else {
            this.setState({isAllChecked: false});
        }
    }

    handleItemClick = (index) => () => {
        let {checked} = this.state;
        if (this.state.offeredItems.indexOf(index) !== -1) {
            return
        }

        let pos = this.state.checked.indexOf(index);

        if (pos === -1) {
            checked.push(index);
        } else {
            checked.splice(pos, 1)
        }

        this.setState({checked: checked})

    }

    handlePageItemCountChange = (value) => {

        this.setState({page_item_count: parseInt(value), current_page: 1}, this.init);
    }

    handleImageModal = (id) => () => {
        this.setState({activeImageModalIndex: id});
    }

    initRows() {

        this.dataRows = [];

        for (let index in this.state.matchList) {
            let item = this.state.matchList[index];
            this.dataRows[index] = [];

            this.dataRows[index].push(
                <Checkbox
                    disabled={this.state.offeredItems.indexOf(parseInt(index)) !== -1}
                    checked={this.state.checked.indexOf(parseInt(index)) !== -1}
                    onChange={this.handleChangeChecked(index)}/>
            );
            this.dataRows[index].push(
                <Stack wrap={false} spacing="tight">
                    <Stack.Item>
                        {item.shopify_image_url ? <CsImageModal
                            title={item.title}
                            size="large"
                            alt={item.title}
                            source={item.shopify_image_url}
                            active={this.state.activeIndex == ("shopify" + index)}
                            onToggle={this.handleImageModal("shopify" + index)}
                        /> : <CsNoImage alt={item.title}/>}
                    </Stack.Item>
                    <Stack.Item fill>
                        <div onClick={this.handleItemClick(parseInt(index))}>
                            <Stack vertical>
                                <Stack.Item>
                                    <TextStyle variation="strong">{item.title}</TextStyle>
                                </Stack.Item>
                                <Stack.Item>
                                    <TextStyle>{item.vendor + " | " + item.sku + " | " + item.barcode}</TextStyle>
                                </Stack.Item>
                            </Stack>
                        </div>
                    </Stack.Item>
                </Stack>
            );
            let link = 'https://' + this.marketplaceInfo.DomainName + '/dp/' + item.asin;

            if (item.matched) {
                this.dataRows[index].push(
                    <Stack wrap={false} spacing="tight">
                        <Stack.Item>
                            {item.image_url ? <CsImageModal
                                    title={item.amazon_name}
                                    size={"large"}
                                    alt={item.amazon_name}
                                    active={this.state.activeIndex == ("amazon" + index)}
                                    onToggle={this.handleImageModal("amazon" + index)}
                                    source={item.image_url}
                                    source_large={item.large_image_url}
                                />
                                : <CsNoImage alt={item.amazon_name}/>
                            }
                        </Stack.Item>

                        <Stack.Item fill>
                            <div className="display-link" onClick={this.handleItemClick(parseInt(index))}>
                                <Stack vertical>
                                    <Stack.Item>
                                        <TextStyle variation="strong">{item.amazon_name}</TextStyle>
                                    </Stack.Item>
                                    <Stack.Item>
                                        <Stack>
                                            <Stack.Item><TextStyle>{item.brand + " | " + item.asin + " | " + item.gtin}</TextStyle></Stack.Item>
                                            <Stack.Item><Tooltip content={CsI18n.t("View on Amazon")}
                                                                 preferredPosition="above"><a
                                                href={link} target="_blank"><Icon
                                                source={ViewMinor}
                                                color="inkLighter"/></a>
                                            </Tooltip></Stack.Item>
                                        </Stack>
                                    </Stack.Item>
                                </Stack>
                            </div>
                        </Stack.Item>

                    </Stack>
                )
            } else {
                this.dataRows[index].push(<div style={{height: '100%'}}
                                               onClick={this.handleItemClick(parseInt(index))}></div>);
            }
        }
    }

    render() {

        let content = "";

        if (this.state.getStarted) {
            content = this.renderGetStarted();
        } else if (this.state.error) {
            content = this.renderError();
        } else if (this.state.processing && this.state.total_count < 1) {
            content = this.renderLoading();
        } else if (this.state.total_count < 1) {
            content = this.renderEmpty();
        } else {
            content = this.renderOffersTable();
        }
        return (
            <div className="offer-table" onKeyDown={this.handleKeydown} onKeyUp={this.handleKeyup}>
                {content}
            </div>
        );
    }

    renderGetStarted() {
        let action = {
            content: CsI18n.t('Get started'),
            onAction: () => {
                this.init();
                this.setState(prevState => ({...prevState, getStarted: false, processing: true}))
            },
            loading: this.state.processing,
            disable: this.state.processing
        };
        return (
            <Stack vertical>
                <Stack.Item>
                    <br/>
                </Stack.Item>
                <Stack.Item>
                    <Banner
                        title={CsI18n.t("Match offers")}
                        action={action}
                    >
                        <p>
                            <CsI18n>The offers with barcode that you have in your store but not yet on Amazon will be
                                displayed here.</CsI18n><br/>
                            <CsI18n>You can select and create them automatically on Amazon.</CsI18n>
                        </p>

                    </Banner>
                </Stack.Item>
                <Stack.Item>
                    <br/>
                </Stack.Item>
            </Stack>
        )
    }

    renderError() {

        return (
            <Layout.Section>
                <CsErrorMessage
                    errorType={this.state.error.type}
                    errorMessage={this.state.error.message}
                />
            </Layout.Section>
        )
    }

    renderLoading() {
        return (
            <Layout.Section>
                <div className="loading">
                    <br/>
                    <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
                </div>
            </Layout.Section>
        )
    }

    renderEmpty() {
        return (
            <Layout.Section>
                <Banner status="warning" title={CsI18n.t("No result")}>
                    <TextStyle><CsI18n>You don't have any matching products</CsI18n></TextStyle>
                </Banner>
            </Layout.Section>
        )
    }

    renderSendOffers() {
        if (!this.state.checked.length) {
            return '';
        }
        let action = {
            content: CsI18n.t('Send'),
            onAction: () => {
                this.handleCreateOffer()
            },
            loading: this.state.offering,
            disable: this.state.offering
        };
        return (
            <Stack vertical>
                <Stack.Item>
                    <br/>
                </Stack.Item>
                <Stack.Item>
                    <Banner
                        title={CsI18n.t("Send offers to Amazon")}
                        action={action}
                    >
                        <p>
                            <CsI18n>Once the offers sent, they will appear as inactive on Amazon. In the next sync, they
                                will be updated based on the rules you configured.</CsI18n>
                        </p>

                    </Banner>
                </Stack.Item>
                <Stack.Item>
                    <br/>
                </Stack.Item>
            </Stack>
        )
    }

    renderOffersTable() {
        console.log("renderOffersTable", this.state);
        let notice;
        if (this.state.offerSuccess) {
            notice = (
                <div>
                    <br/>
                    <Banner status="success"
                            title={CsI18n.t("Offers sent successfully, result will appear in Scheduler tab")}/>
                    <br/>
                </div>
            );
        } else if (this.state.offerError) {
            notice = (
                <div>
                    <br/>
                    <CsErrorMessage
                        errorType={this.state.offerError.type}
                        errorMessage={this.state.offerError.message}
                    />
                    <br/>
                </div>
            );
        }
        this.initRows();

        return (
            <div>
                {notice}
                {this.renderSendOffers()}

                <DataTable
                    columnContentTypes={[
                        'text',
                        'text',
                        'text',
                    ]}
                    headings={[
                        <Checkbox
                            disabled={this.state.offeredItems.length === this.state.matchList.length}
                            checked={this.state.isAllChecked}
                            onChange={this.handleChangeChecked('all')}/>,
                        <Heading>{this.shopify.store_properties.name}</Heading>,
                        <Heading><CsI18n>Amazon</CsI18n></Heading>,
                    ]}
                    rows={this.dataRows}
                />

                {(this.state.total_pages > this.state.current_page) || this.state.processing ?
                    this.renderOffersTableFooter()
                    : ''}

            </div>
        );
    }

    renderOffersTableFooter() {

        return (
            <div className="pagination">
                <Stack wrap={false} alignment="center">
                    <Stack.Item>
                        <TextStyle><CsI18n>Showing</CsI18n></TextStyle>
                        <div className="pagination-select">
                            <Select
                                options={SELECT_PAGE_OPTIONS}
                                value={this.state.page_item_count}
                                onChange={this.handlePageItemCountChange}
                                disabled={this.state.processing}
                            ></Select>
                        </div>
                        <TextStyle><CsI18n>Items</CsI18n></TextStyle>
                    </Stack.Item>
                    <Stack.Item>
                        <Button loading={this.state.processing} disabled={this.state.processing} onClick={this.handleMoreBtnClick}><CsI18n>More</CsI18n></Button>
                    </Stack.Item>
                </Stack>
            </div>
        )
    }

}

export default Match;
