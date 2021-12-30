import React from "react";
import CsI18n from "./../../components/csI18n"

import {
    Card,
    Tag,
    TextContainer,
    Stack,
    Autocomplete,
    Spinner,
    Layout, Checkbox
} from '@shopify/polaris';
import ShopifyContext from "../../context";
import WorkflowTab from "./workflow_tab";

const ANY = "any";
//FIXED
class CollectionSelector extends WorkflowTab {
    state = {
        ...this.state,
        options: [],
    }
    constructor(props) {
        super(props);
        this.shopify = ShopifyContext.getShared();

        this.options = [];

        this.defaults = {
            ...this.defaults,
            collections: []
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

    handleCollections(shop_collections) {
        if (this.unMounted) {
            return;
        }
        console.log(shop_collections);
        if (shop_collections !== undefined) {

            shop_collections.forEach((elm)=>{
                if (!elm.hasOwnProperty('title')) return;
                var option = {value:elm.id.toString(), label:elm.title.toString()};
                this.options.push(option);
            })
            console.log(this.options);

            this.setState({loading:false, options: this.options});
        }
    }
    handleUseAll = (value) => {
        if(value) {
            this.valueUpdater("collections")([ANY]);
        } else {
            this.valueUpdater("collections")([]);
        }
    }
    componentWillMount()
    {
        super.componentWillMount() ;
        this.setState({selected: []});
        this.setState({loading: true});

        this.fetchCollectionsListing(this.handleCollections.bind(this));

    }

    render() {
        console.log(this.state.data);
        if (this.state.loading) {
            return(this.renderLoading());
        } else {
            return(this.renderCollections())
        }
    }

    renderCollections() {
        let bUseAll = false;
        let {collections} = this.state.data;
        if(collections.length == 1 && collections[0] == ANY) {
            bUseAll = true;
        }
        return (
            <Card.Section>
                <Layout>
                    <Layout.Section>
                        <TextContainer>
                            <CsI18n>Select the collections to publish on Amazon</CsI18n>
                        </TextContainer>
                    </Layout.Section>
                    <Layout.Section>
                        <Checkbox label={CsI18n.t("Use all collections")} checked={bUseAll} onChange={this.handleUseAll} />
                    </Layout.Section>
                    {
                        bUseAll? '':(<Layout.Section>
                            <TextContainer>
                                <Stack>{this.renderTags()}</Stack>
                            </TextContainer>
                        </Layout.Section>)
                    }
                    {
                        bUseAll? '':(<Layout.Section>
                            <Autocomplete
                                allowMultiple
                                options={this.state.options}
                                selected={this.state.data.collections}
                                textField={
                                    <Autocomplete.TextField
                                        onChange={this.updateText}
                                        label=""
                                        value={this.state.inputText}
                                        placeholder={CsI18n.t("Bags, Amazon - Shoes, Clothes Collection")}
                                    />
                                }
                                onSelect={this.valueUpdater("collections")}
                                listTitle={CsI18n.t("Collections")}
                            />
                        </Layout.Section>)
                    }
                </Layout>
            </Card.Section>
        )

    }
    renderLoading()
    {
        return(
            <div align="center">
                <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")} ></Spinner>
            </div>
        );

    }
    updateText = (newValue) => {
        this.setState({inputText: newValue});
        this.filterAndUpdateOptions(newValue);
    };

    removeTag = (tag) => {
        let newSelected = this.state.data.collections;
        newSelected.splice(newSelected.indexOf(tag), 1);
        this.setState(prevState => ({
            ...prevState,
            data: {
                ...prevState.data,
                collections: newSelected
            }
        }), this.saveState)
    };


    renderTags = () => {
        return this.state.data.collections.map((option) => {
            let tagLabel = '';
            let [currentOption] = this.options.filter((item)=>{
                return item.value == option
            });

            if (currentOption instanceof Object && currentOption.hasOwnProperty('label')) {
                console.log('currentOption', currentOption);
                let labelname = currentOption.label;
                tagLabel = titleCase(labelname);
                return (
                    <Tag key={'option' + option} onRemove={() => this.removeTag(option)}>
                        {tagLabel}
                    </Tag>
                );
            }
        });
    };

    filterAndUpdateOptions = (inputString) => {
        if (inputString === '') {
            this.setState({
                options: this.options,
            });
            return;
        }

        const filterRegex = new RegExp(inputString, 'i');
        const resultOptions = this.options.filter((option) =>
            option.label.match(filterRegex),
        );
        let endIndex = resultOptions.length - 1;
        if (resultOptions.length === 0) {
            endIndex = 0;
        }
        this.setState({
            options: resultOptions,
        });
    };

    updateSelection = (updatedSelection) => {
        this.setState({selected: updatedSelection});
    };


}

function titleCase(string) {
    string = string
        .toLowerCase()
        .split(' ')
        .map(function(word) {
            if(word) {
                return word.replace(word[0], word[0].toUpperCase());
            } else {
                return '';
            }
        });
    return string.join(' ');
}

export default CollectionSelector;
