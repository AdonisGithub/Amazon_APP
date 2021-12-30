import React from "react";
import CsI18n from "./../../components/csI18n"

import {
    Card,
    Tag,
    TextContainer,
    Stack,
    Autocomplete,
    Spinner,
    Layout, Checkbox, Heading, Banner
} from '@shopify/polaris';
import ShopifyContext from "../../context";
import ShopifyApiCall from "../../functions/shopify-api-call";
import ApplicationApiCall from "../../functions/application-api-call";
import WorkflowTab from "./workflow_tab";

const ANY = "any";

//FIXED
class Metafields extends WorkflowTab {
    state = {
        ...this.state,
        filtered_product_metafields: [],
        filtered_variant_metafields: [],
        metafield_import_status: '',
        loaded_metafields: false,
        inputProductMetafield: '',
        inputVariantMetafield: '',
    }
    constructor(props) {
        super(props);
        this.shopify = ShopifyContext.getShared();

        this.product_metafields = [];
        this.variant_metafields = [];

        this.defaults = {
            ...this.defaults,
            metafields_option: {},
            metafields_product: [],
            metafields_variant: []
        };
        if ( !this.props.config.hasOwnProperty('data') || !this.props.config.data)
            this.configurationUpdateCurrent(this.defaults);
        console.log(this.state.data);
    }

    loadConfig() {
        console.log(this.state.data);
        this.configurationLoad();
        this.configurationUpdateCurrent(this.state.data);
    }

    componentWillReceiveProps(nextProps) {
        console.log("componentWillReceiveProps");
        this.loadConfig();
    }

    fetchMetafields() {
        ApplicationApiCall.get('/api/shopify/metafields', {}, this.cbFetchMetafields, () => {this.setState({loading:false});});
        this.setState({loading: true});
    }

    cbFetchMetafields = (metafields) => {
        if (this.unMounted) {
            return;
        }
        console.log(metafields);
        let {import_status, product_metafields, variant_metafields} = metafields;

        if (product_metafields) {
            product_metafields.forEach((elm)=>{
                this.product_metafields.push({label: elm, value: elm});
            });
        }

        if (variant_metafields) {
            variant_metafields.forEach((elm)=>{
                this.variant_metafields.push({label: elm, value: elm});
            });
        }

        this.setState({loading:false, filtered_product_metafields: this.product_metafields, filtered_variant_metafields: this.variant_metafields, metafield_import_status: import_status, loaded_metafields: true});
    }

    handleUseAll = (value) => {
        if(value) {
            this.valueUpdater("metafields_option")({});
        } else {
            this.valueUpdater("metafields_option")({mode: 'select'});
            if (!this.state.loaded_metafields) {
                this.fetchMetafields();
            }
        }
    }
    componentWillMount()
    {
        super.componentWillMount() ;
        this.setState({selected: []});

        let {metafields_option} = this.state.data;
        if (metafields_option && metafields_option.mode && metafields_option.mode == 'select' && !this.state.loaded_metafields) {
            this.fetchMetafields();
        }
    }

    updateProductMetafieldText = (newValue) => {
        this.setState({inputProductMetafield: newValue});
        this.filterAndUpdateProductMetafields(newValue);
    };

    updateVariantMetafieldText = (newValue) => {
        this.setState({inputVariantMetafield: newValue});
        this.filterAndUpdateVariantMetafields(newValue);
    };

    filterAndUpdateProductMetafields = (inputString) => {
        if (inputString === '') {
            this.setState({
                filtered_product_metafields: this.product_metafields,
            });
            return;
        }

        const filterRegex = new RegExp(inputString, 'i');
        const resultOptions = this.product_metafields.filter((option) =>
            option.label.match(filterRegex),
        );
        let endIndex = resultOptions.length - 1;
        if (resultOptions.length === 0) {
            endIndex = 0;
        }
        this.setState({
            filtered_product_metafields: resultOptions,
        });
    };

    filterAndUpdateVariantMetafields = (inputString) => {
        if (inputString === '') {
            this.setState({
                filtered_variant_metafields: this.variant_metafields,
            });
            return;
        }

        const filterRegex = new RegExp(inputString, 'i');
        const resultOptions = this.variant_metafields.filter((option) =>
            option.label.match(filterRegex),
        );
        let endIndex = resultOptions.length - 1;
        if (resultOptions.length === 0) {
            endIndex = 0;
        }
        this.setState({
            filtered_variant_metafields: resultOptions,
        });
    };

    renderNoticeImported() {
        return <Layout.Section>
            <Banner
                title={CsI18n.t("Metafields will NOT be imported automatically.")}
                status="info"
            >
                <p><CsI18n>If you have updated metafields, please execute the command: "Full metafields import from
                    Shopify" in Actions > Operations.</CsI18n></p>
            </Banner>
        </Layout.Section>
    }

    renderNoticeNone() {
        return <Layout.Section>
            <Banner
                title={CsI18n.t("Metafields are NOT imported yet.")}
                status="info"
            >
                <p><CsI18n>Please execute the schedule("Full metafields import from Shopify") on Actions > Operations after saved the workflow.</CsI18n></p>
            </Banner>
        </Layout.Section>
    }

    renderNoticeImporting() {
        return <Layout.Section>
            <Banner
                title={CsI18n.t("Metafields are being imported")}
                status="info"
            >
                <p><CsI18n>It takes a long time to import the metafields.</CsI18n></p>
            </Banner>
        </Layout.Section>
    }

    render() {
        let bUseAll = true;
        let {metafields_option} = this.state.data;
        if(metafields_option.mode && metafields_option.mode == 'select') {
            bUseAll = false;
        }

        let metafield_selection = '';
        let {metafield_import_status} = this.state;
        if (!bUseAll) {
            if (this.state.loading) {
                metafield_selection = <React.Fragment>{this.renderLoading()}</React.Fragment>;
            } else {
                switch(metafield_import_status) {
                    case 'imported':
                        metafield_selection = <React.Fragment>{this.renderProductMetafields()}{this.renderVariantMetafields()}</React.Fragment>;
                        break;
                    case 'none':
                        metafield_selection = this.renderNoticeNone();
                        break;
                    case 'importing':
                        metafield_selection = this.renderNoticeImporting();
                        break;
                }
            }
        }

        return (
            <Card.Section>
                <Layout>
                    <Layout.Section>
                        <TextContainer>
                            <CsI18n>Select the metafields to use for creating products on Amazon.</CsI18n>
                        </TextContainer>
                    </Layout.Section>
                    {this.renderNoticeImported()}
                    <Layout.Section>
                        <Checkbox label={CsI18n.t("Use all metafields")} checked={bUseAll} onChange={this.handleUseAll} />
                    </Layout.Section>
                    {metafield_selection}
                </Layout>
            </Card.Section>
        )
    }

    renderProductMetafields()
    {
        return (<Layout.Section>
            <Heading><CsI18n>Product metafields</CsI18n></Heading>
            <div className={"mb-3"}>
            <TextContainer>
                <Stack>{this.renderProductTags()}</Stack>
            </TextContainer>
            </div>
            <Autocomplete
                allowMultiple
                options={this.state.filtered_product_metafields}
                selected={this.state.data.metafields_product}
                textField={
                    <Autocomplete.TextField
                        onChange={this.updateProductMetafieldText}
                        label=""
                        value={this.state.inputProductMetafield}
                        placeholder=""
                    />
                }
                onSelect={this.valueUpdater("metafields_product")}
                listTitle={CsI18n.t("Product metafields")}
            />
        </Layout.Section>);
    }

    renderVariantMetafields()
    {
        return (<Layout.Section>
            <Heading><CsI18n>Variant metafields</CsI18n></Heading>
            <div className={"mb-3"}>
            <TextContainer>
                <Stack>{this.renderVariantTags()}</Stack>
            </TextContainer>
            </div>
            <Autocomplete
                allowMultiple
                options={this.state.filtered_variant_metafields}
                selected={this.state.data.metafields_variant}
                textField={
                    <Autocomplete.TextField
                        onChange={this.updateVariantMetafieldText}
                        label=""
                        value={this.state.inputVariantMetafield}
                        placeholder=""
                    />
                }
                onSelect={this.valueUpdater("metafields_variant")}
                listTitle={CsI18n.t("Variant metafields")}
            />
        </Layout.Section>);
    }

    renderLoading()
    {
        return(<Layout.Section>
            <div align="center">
                <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")} />
            </div>
            </Layout.Section>
        );
    }

    removeProductTag = (tag) => {
        let newSelected = this.state.data.metafields_product;
        newSelected.splice(newSelected.indexOf(tag), 1);
        this.setState(prevState => ({
            ...prevState,
            data: {
                ...prevState.data,
                metafields_product: newSelected
            }
        }), this.saveState)
    };

    renderProductTags = () => {
        return this.state.data.metafields_product.map((option) => {
            let tagLabel = '';
            let [currentOption] = this.product_metafields.filter((item)=>{
                return item.value == option
            });

            if (currentOption instanceof Object && currentOption.hasOwnProperty('label')) {
                console.log('currentOption', currentOption);
                tagLabel = currentOption.label;
                return (
                    <Tag key={'option' + option} onRemove={() => this.removeProductTag(option)}>
                        {tagLabel}
                    </Tag>
                );
            }
        });
    };

    removeVariantTag = (tag) => {
        let newSelected = this.state.data.metafields_variant;
        newSelected.splice(newSelected.indexOf(tag), 1);
        this.setState(prevState => ({
            ...prevState,
            data: {
                ...prevState.data,
                metafields_variant: newSelected
            }
        }), this.saveState)
    };


    renderVariantTags = () => {
        return this.state.data.metafields_variant.map((option) => {
            let tagLabel = '';
            let [currentOption] = this.variant_metafields.filter((item)=>{
                return item.value == option
            });

            if (currentOption instanceof Object && currentOption.hasOwnProperty('label')) {
                console.log('currentOption', currentOption);
                tagLabel = currentOption.label;
                return (
                    <Tag key={'option' + option} onRemove={() => this.removeVariantTag(option)}>
                        {tagLabel}
                    </Tag>
                );
            }
        });
    };
}

export default Metafields;
