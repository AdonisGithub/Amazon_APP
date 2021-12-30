import React from 'react'
import CsI18n from "../../../../components/csI18n"

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
    Badge, DisplayText, Checkbox, TextField, FormLayout, Collapsible, Link,
} from '@shopify/polaris';

import {ChevronDownMinor, ChevronUpMinor} from "@shopify/polaris-icons";

import Util from "../../../../helpers/Util"

import CsEmbeddedModal from "../../../../components/csEmbeddedModal";

class TranslateDetailViewModal extends React.Component {

    state = {
        opened: false,
        changed: false,
        saving: false,
        data: null,
        collapse: [],
    }

    constructor(props) {
        super(props);
        this.state.opened = this.props.opened;
        this.state.data = Util.clone(this.props.data);
        let languages = this.props.languages;
        let language_names = [];

        for(let i = 0; i < languages.length; i++ ) {
            language_names[languages[i].value] = languages[i].label;
        }
        this.language_names = language_names;
        console.log(language_names, languages);
    }

    componentWillMount() {
        require("./translate.scss");
    }

    handleClose = () => {
        let {onClose} = this.props;
        if (onClose) {
            onClose();
        }
    }

    handleSave = () => {
        let {data} = this.state;
        let {onSave} = this.props;
        if (onSave) {
            onSave(data);
        }
        this.setState({saving: true});
    }

    handleChangeValue = (lang, field) => (value) => {
        let {data} = this.state;
        data.translated_data[lang][field] = value;
        this.setState({data, changed: true});
    }

    handleCollapse = (lang) => () => {
        let {collapse} = this.state;
        let value = !collapse[lang];
        collapse[lang] = value;
        this.setState({collapse});
    }

    renderTranslatedEditLang(lang, translation)
    {
        let language_name = this.language_names[lang];
        let collapse_open = !this.state.collapse[lang];
        return (
            <div className={'edit-layout'} key={`${lang}-layout`}>
                <Stack><Stack.Item><span className={'language-name'}>{language_name}</span></Stack.Item><Stack.Item><Link onClick={this.handleCollapse(lang)}><Icon source={collapse_open? ChevronUpMinor:ChevronDownMinor}/></Link></Stack.Item></Stack>
                <Collapsible
                    open={collapse_open}
                    id={`edit-block-${lang}`}
                    transition={{duration: '300ms', timingFunction: 'ease-in-out'}}
                >
                    <TextField value={translation.title} label={CsI18n.t('Title')} labelHidden={true} onChange={this.handleChangeValue(lang, 'title')} multiline={2} />
                    <TextField value={translation.description} label={CsI18n.t('Description')} labelHidden={true} onChange={this.handleChangeValue(lang, 'description')} multiline={10} />
                </Collapsible>
            </div>
        );
    }

    render() {
        let {translated_lang, translated_data, store_data, product_id} = this.state.data;
        let translated_lang_field = false;
        let has_translated_lang = false;
        if(translated_lang && translated_lang.length > 0) {
            translated_lang_field = [];
            for(let lang of translated_lang) {
                translated_lang_field.push(<Badge status={"success"} key={`badge_${product_id}_${lang}`}>{lang.toUpperCase()}</Badge>);
                has_translated_lang = true;
            }
        }
        let edit_translated_data = [];
        for(let lang of translated_lang ) {
            edit_translated_data.push(this.renderTranslatedEditLang(lang, translated_data[lang]));
        }

        return (
            <CsEmbeddedModal
                open={this.state.opened}
                onClose={this.handleClose}
                title={CsI18n.t("Detail view")}
                primaryAction={{
                    content: <CsI18n>Save</CsI18n>,
                    onAction: this.handleSave,
                    disabled: !this.state.changed || this.state.saving,
                    loading: this.state.saving
                }}
                secondaryActions={[
                    {
                        content: <CsI18n>Cancel</CsI18n>,
                        onAction: this.handleClose,
                        disabled: this.state.saving
                    }
                ]}
                large
            >
                <div className={"translation-detail-view"}>
                    <Layout.Section>
                        <div className={"store-text"}>
                            <Stack vertical={true} spacing={"tight"}>
                                <Stack.Item><span className={"title"}>{store_data.title}</span></Stack.Item>
                                <Stack.Item><span className={"description"}>{store_data.description}</span></Stack.Item>
                            </Stack>
                        </div>
                        <div className={"translated-text"}>
                            {edit_translated_data}
                        </div>
                    </Layout.Section>
                </div>
            </CsEmbeddedModal>
        );
    }
}

export default TranslateDetailViewModal;
