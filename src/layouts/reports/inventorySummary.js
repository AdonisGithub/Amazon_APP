import React from 'react'
import CsI18n from "./../../components/csI18n"

import {
    Heading,
    Icon,
    Page,
    Pagination,
    Select,
    Stack,
    ResourceList,
    Spinner, Layout, DataTable, TextStyle, Button, FilterType, Tooltip, Avatar, Banner, Badge,
} from '@shopify/polaris';

import {
    ViewMinor
} from '@shopify/polaris-icons';
import ApplicationApiCall from "../../functions/application-api-call";
import Util from "../../helpers/Util";
import shopifyContext, {TAB} from "../../context";
import "./reports.scss"
import AmazonTab from "../../helpers/amazon-tab";
import CsMultiSelect from '../../components/csMultiSelect';
import CsErrorMessage from "../../components/csErrorMessage";
import MarketplaceTab from "../../helpers/marketplace-tab";
import {ErrorType} from "../../components/csErrorMessage/csErrorMessage";
import Constants from "../../helpers/rules/constants";

const SUMMARY_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    INCOMPLETE: 'incomplete',
}

class InventorySummary extends React.Component {

    state = {
        refresh: false,
    };

    constructor(props) {
        super(props);
        this.unMounted = false;
        this.shopify = shopifyContext.getShared();
        this.data = this.props.data;
        this.initRows();
    }

    componentWillReceiveProps(nextProps) {
        this.data = nextProps.data;
        this.initRows();
        this.setState({refresh: true});
    }

    initRows() {
        let items = this.data;
        this.dataRows = [];

        for (let index in items) {
            let item = items[index];

            const country_flag = this.shopify.static_content + '/amazon/flags/flag_' + item.iso_code.toLowerCase() + '_64px.png';

            let row = [
                <Stack wrap={false} alignment="center" spacing="extraTight">
                    <Stack.Item><Avatar source={country_flag} alt={item.iso_code.toLowerCase()}
                                        size="small"/></Stack.Item>
                    <Stack.Item>{item.name}</Stack.Item>
                </Stack>,
                item.domain,
            ];

            let active = '';
            let inActive = '';
            let inComplete = '';
            for(let status in item.summary) {
                console.log(status, item.summary[status]);
                let statusPanel = (<div className="inventory-summary">
                    <Stack spacing="tight" alignment="center">
                        <Stack.Item>
                            <Badge size="small" status="info">{item.summary[status].count}</Badge>
                        </Stack.Item>
                        <Stack.Item>
                            <Badge size="small" status="default">{item.summary[status].quantities}</Badge>
                        </Stack.Item>
                        <Stack.Item>
                            <Badge size="small" status="success">{item.summary[status].in_stock}</Badge>
                        </Stack.Item>
                        <Stack.Item>
                            <Badge size="small" status="warning">{item.summary[status].oos}</Badge>
                        </Stack.Item>
                    </Stack>
                </div>);
                switch( status.toLowerCase() ) {
                    case SUMMARY_STATUS.ACTIVE:
                        active = statusPanel;
                        break;
                    case SUMMARY_STATUS.INACTIVE:
                        inActive = statusPanel;
                        break;
                    case SUMMARY_STATUS.INCOMPLETE:
                        inComplete = statusPanel;
                }
            }
            row.push(active);
            row.push(inActive);
            row.push(inComplete);
            this.dataRows.push(row);
        }
    }

    render() {
        console.log("render", this.data);
        this.initRows();

        return (
            <div className="inv-sum">
                <DataTable
                    columnContentTypes={[
                        'text',
                        'text',
                        'text',
                        'text',
                        'text',
                    ]}
                    headings={[
                        <Heading><CsI18n>Platform</CsI18n></Heading>,
                        <Heading><CsI18n>Domain</CsI18n></Heading>,
                        <Heading><CsI18n>Active</CsI18n></Heading>,
                        <Heading><CsI18n>Inactive</CsI18n></Heading>,
                        <Heading><CsI18n>Incomplete</CsI18n></Heading>,
                    ]}
                    rows={this.dataRows}
                />
                <Layout.Section>
                <Stack wrap={false} spacing="tight" alignment="center">
                    <Stack.Item><Badge size="small" status="info" ><CsI18n>SKUs</CsI18n></Badge></Stack.Item>
                    <Stack.Item><Badge size="small" status="default"  ><CsI18n>Qty</CsI18n></Badge></Stack.Item>
                    <Stack.Item><Badge size="small" status="success"  ><CsI18n>In Stock</CsI18n></Badge></Stack.Item>
                    <Stack.Item><Badge size="small" status="warning"  ><CsI18n>Out of Stock</CsI18n></Badge></Stack.Item>
                </Stack>
                </Layout.Section>
            </div>
        );
    }

    renderEmpty() {
        return (
            <Layout.Section>
                <Banner status="warning" title={CsI18n.t("No data")}>
                    <TextStyle><CsI18n>No offers available yet</CsI18n></TextStyle>
                </Banner>
            </Layout.Section>
        )
    }
}

export default InventorySummary;
