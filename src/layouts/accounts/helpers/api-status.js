import React from 'react'
import CsI18n from "./../../../components/csI18n"
import {
    Avatar,
    TextStyle,
    Layout,
    Card,
    Banner,
    Spinner,
    ResourceList,
    Stack,
    Badge
} from '@shopify/polaris';

import ApplicationApiCall from '../../../functions/application-api-call';
import CsErrorMessage from "../../../components/csErrorMessage";
import Util from "../../../helpers/Util";
import ShopifyContext from "../../../context";

class AmazonApiStatus extends React.Component {

    state = {
        pending: true,
        api_error: false,
        error: false,
        marketplace_error: null,
        connect: false,
        list: false,
    };

    constructor(props) {
        super(props);

        this.initState = Util.clone(this.state);

        this.state.selectedId = this.props.selectedId;
        this.shopify = ShopifyContext.getShared();
        this.init(this.state.selectedId);
    }

    componentWillReceiveProps(nextProps, nextContext) {
        if ( this.state.selectedId != nextProps.selectedId ) {
            this.init(nextProps.selectedId);
            this.setState(Util.clone(this.initState));
        }
    }

    init(selectedId) {
        ApplicationApiCall.get('/application/service/status', this.shopify.amazon[selectedId], this.cbApiStatus, this.cbApiError);
    }

    render() {
        return (
            <Card sectionned
                  secondaryFooterAction={{content: <CsI18n>Close</CsI18n>, onAction: this.closeForm.bind(this)}}>
                {this.renderApiStatus()}
                {this.listMarketplaceParticipations()}
            </Card>

        );
    }

    componentWillMount() {
        this.props.action('mounted');
    }

    cbApiError = (err) => {
        this.setState({api_error: true});
    }

    cbApiStatus = (result) => {
        if (result && result.hasOwnProperty('GetServiceStatusResult') && !this.state.error) {
            ApplicationApiCall.get('/application/service/marketplaces', this.shopify.amazon[this.props.selectedId], this.cbMarketplaceStatus, this.cbMarketplaceStatusError);
            this.setState({connect: result});
        } else {
            this.setState({api_error: true});
        }
    }

    cbMarketplaceStatusError = (err) => {
        this.setState({error: true, marketplace_error: null});
    }

    cbMarketplaceStatus = (result) => {
        if (result && !result.error) {
            this.setState({list: result});
        } else {
            this.setState({error: true, marketplace_error: {error_code: result.error_code, error_message: result.error_message}});
        }
    }

    renderApiStatus() {
        if (this.state.api_error) {
            return (
                <Card.Section>
                    <CsErrorMessage
                        errorTitle={CsI18n.t("Unable to connect to Amazon")}
                    />
                </Card.Section>
            );
        } else if (!this.state.connect) {
            return (
                <Card.Section>
                    <div align="center">
                        <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Processing")}></Spinner>
                    </div>
                </Card.Section>
            );
        } else {
            return (
                <Card.Section>
                    <Banner status="success" title={CsI18n.t("Connected")}>
                        <TextStyle variation="positive"><CsI18n>Successfully connected to Amazon</CsI18n></TextStyle>
                    </Banner>
                </Card.Section>
            )
        }
    }

    listMarketplaceParticipations() {
        if (!this.state.connect) {
            return ('');
        }
        if (this.state.error) {
            if(this.state.marketplace_error) {
                return (
                    <Card.Section>
                        <CsErrorMessage
                            errorTitle={CsI18n.t(this.state.marketplace_error.error_code)}
                            errorMessage={CsI18n.t(this.state.marketplace_error.error_message)}
                        />
                    </Card.Section>
                );
            } else {
                return (
                    <Card.Section>
                        <CsErrorMessage
                            errorTitle={CsI18n.t("Unable to connect to this account")}
                            errorMessage={CsI18n.t("Please verify your credentials")}
                        />
                    </Card.Section>
                );
            }
        } else if (!this.state.list) {
            return (
                <Card.Section>
                    <div align="center">
                        <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Processing")}></Spinner>
                    </div>
                </Card.Section>
            );
        } else {
            let Marketplaces = this.state.list.ListMarketplaceParticipationsResult;
            Marketplaces = Array.isArray(Marketplaces)? Marketplaces:[Marketplaces];
            return (
                <Card.Section>
                    <ResourceList
                        resourceName={{singular: 'Marketplace', plural: 'Marketplaces'}}
                        items={Marketplaces}
                        renderItem={(item, index) => {
                            const {MarketplaceId, DefaultCountryCode, DomainName, Name, HasSellerSuspendedListings, DefaultCurrencyCode} = item;
                            const iso_code = DefaultCountryCode.toLowerCase();
                            const image_url = this.shopify.static_content + '/amazon/flags/flag_' + iso_code + '_64px.png'
                            const media = <Avatar customer size="medium" name={Name} source={image_url}/>;
                            const badge = HasSellerSuspendedListings? CsI18n.t('Suspended'):CsI18n.t('Active');
                            const status = HasSellerSuspendedListings? 'attention':'success';

                            return (
                                <ResourceList.Item
                                    id={MarketplaceId}
                                    media={media}
                                    accessibilityLabel={CsI18n.t("View details for {{DomainName}}", {DomainName: DomainName})}
                                >

                                    <Stack wrap={true} distribution="fillEvenly">
                                        <TextStyle variation="strong">{Name}</TextStyle>
                                        <TextStyle>{DefaultCountryCode}</TextStyle>
                                        <Badge status={status}>{badge}</Badge>
                                    </Stack>
                                </ResourceList.Item>
                            );
                        }}
                    />
                </Card.Section>
            );
        }

    }

    closeForm() {
        this.props.action('close');
    }
}

export default AmazonApiStatus;
