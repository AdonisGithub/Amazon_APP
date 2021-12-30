import React from 'react'
import Markdown from 'react-markdown';

import {
    Card,
    Collapsible,
    Heading,
    Icon,
    Link,
    Stack,
    Spinner, Button,
    Toast
} from '@shopify/polaris';

import StrApiCall from "../../functions/str-api-call";
import CsI18n from "./../../components/csI18n"
import CsErrorMessage from "../../components/csErrorMessage";
import {ChevronDownMinor, ChevronUpMinor, DuplicateMinor} from '@shopify/polaris-icons';
import Util from "../../helpers/Util";

class CsHelpCenter extends React.Component {

    state = {
        wait: true,
        lang: 'en',
        default_lang: "en",
        page: '',
        page_param: '',
        open: [],
    }

    static defaultProps = {
        default_lang: "en",
        show_copy: false
    }

    constructor(props) {
        super(props);
        this.state.page = this.props.page;
        this.state.page_param = this.props.page_param;
        if( this.props.lang ) {
            this.state.lang = this.props.lang;
        }
        this.state.section = this.props.section;
        this.state.show_copy = this.props.show_copy;
        this.state.store_url = this.props.store_url;
        this.state.default_lang = this.props.default_lang;
        this.allcontents = [];
        this.contents = [];
        this.unMounted = false;
    }

    componentWillMount() {
        require('./csHelpCenter.css');
        // try {
        //     navigator.serviceWorker.addEventListener('message', this.getUpdatedCache);
        // } catch (err) {
        //
        // }
        this.getContent(this.state.page, this.state.page_param);
    }

    componentWillUnmount() {
        this.unMounted = true;
        // try {
        //     navigator.serviceWorker.removeEventListener('message', this.getUpdatedCache);
        // } catch (err) {
        //
        // }
    }

    //deprecated!
    /*
    getUpdatedCache = (e) => {
        let data = JSON.parse(e.data);
        if (data.type !== 'refresh')
            return;

        let lang = '';
        data.url.split("&").forEach(function(part) {
            let item = part.split("=");
            if( item && item[0] === 'lang' ) {
                lang = decodeURIComponent(item[1]);
            }
        });
        console.log("getUpdatedCache", data.url);
        fetch(data.url + "&onlyCache")
            .then(res => res.json())
            .then(json => {
                this.cbGetContents(json, lang, true);
            })
    }
    */

    componentWillReceiveProps(nextProps) {
        const page = nextProps.page;
        const page_param = nextProps.page_param;
        if (this.state.page === page)
            return;

        if (this.allcontents[page] !== undefined) {
            this.contents = this.allcontents[page];
            this.setState({page: page, page_param: nextProps.page_param, section: nextProps.section});
            return;
        } else {
            this.getContent(page, page_param);
        }
    }

    getContent(page, page_param) {
        console.log("getContent", page, page_param);

        this.contents = [];
        // let lang = is_default_lang? this.state.default_lang:this.state.lang;
        StrApiCall.get('Helps', {
                type: page_param,
                // lang: lang
            },
            (result) => {
                this.cbGetContents(result);
            },
            this.cbGetContentError);

        this.setState({wait: true, page, page_param});
    }

    fixMark(text) {
        let exp = /(\#{1,6})([A-Za-z1-9]+)/g
        return text.replace(exp, '$1 $2');
    }
    cbGetContents = (result) => {
        if (this.unMounted) {
            return;
        }
        console.log("result", result, this.state);
        let {lang, default_lang} = this.state;
        if ( result && result.length ) {
            let opened_index = -1;
            let contents;
            let contents_lang = [];
            let contents_default_lang = [];
            for(let item of result) {
                if (item.lang == lang) {
                    contents_lang.push(item);
                } else if (item.lang == default_lang) {
                    contents_default_lang.push(item);
                }
            }

            if (contents_lang.length) {
                contents = contents_lang;
            } else {
                contents = contents_default_lang;
            }

            this.contents = contents.map( (item, index) => {
                if( this.state.section && (item.tag == this.state.section || item.id == this.state.section) ) {
                    opened_index = index;
                }
                item.content = this.fixMark(item.content);
                return item;
            });
            // if(opened_index == -1) {
            //     opened_index = 0;
            // }
            for (let i = 0; i < this.contents.length; i++) {
                if( opened_index == i) {
                    this.state.open[i] = true;
                } else {
                    this.state.open[i] = false;
                }
            }
            this.allcontents[this.state.page] = this.contents;
        }
        this.setState({wait: false});
    }

    cbGetContentError = (err) => {

        console.log(err);

        if (err) {
            this.setState({error: err, wait: false})
        }
    }

    imageStyle(props) {
        return <img {...props} style={{maxWidth: '100%'}}/>
    }

    handleClip = (item) => () => {
        let app_handle = 'amazon-12';

        let text = `${this.state.store_url}/apps/${app_handle}/help/${this.state.page}`;
        if (item.tag) {
            text += "/" + item.tag;
        } else if(item.id) {
            text += "/" + item.id;
        }
        Util.copyToClipboard(text);
        this.setState({toast_message: true});
    }

    createCards() {
        let cards = [];
        for (let i in this.contents) {
            let item = this.contents[i];
            console.log("createCards", item, this.state.page);
            let opened = this.state.open[i];
            let card = (<Card key={"cards" + i} sectioned>
                <Stack key={"stack" + i}>
                    <Stack.Item key={"stack_item_head" + i}><Heading key={"heading" + i}>{item.title}</Heading></Stack.Item>
                    <Stack.Item>{this.state.show_copy? <Link onClick={this.handleClip(item)}><Icon source={DuplicateMinor} /></Link>:''}</Stack.Item>
                    <Stack.Item fill></Stack.Item>
                    <Stack.Item key={"stack_item" + i}>
                        {/*{opened ?*/}
                        {/*<Scrollable.ScrollTo>here</Scrollable.ScrollTo>:null}*/}
                        <Link key={"link" + i} onClick={this.handleToggleClick(i)}><Icon
                            source={opened ? ChevronUpMinor : ChevronDownMinor}/></Link>
                    </Stack.Item>
                </Stack>
                <Collapsible key={"collapse" + i} open={opened}>
                    <Card.Section key={"sub_card" + i}>
                        <Markdown key={"mark" + i} className="markdown" escapeHtml={false} linkTarget={"_blank "} source={item.content}
                                  renderers={{image: this.imageStyle}}/>
                    </Card.Section>
                </Collapsible>
            </Card>);
            cards.push(card);
        }
        return cards;
    }

    render() {
        let content;
        console.log("render", this.state);
        if (this.state.error) {
            content = this.renderError();
        } else if (this.state.wait) {
            content = (<Stack distribution="center"><Spinner size="large" color="teal"
                                                             accessibilityLabel={CsI18n.t("Loading")}></Spinner></Stack>);
        } else {
            content = this.createCards();
        }

        const toastMarkup = this.state.toast_message ? (
        <Toast content={CsI18n.t("Copied successfully!")} onDismiss={() => {this.setState({toast_message: false})}} />
        ) : null;
        return (
            <div className={"help-center-main"}>{content}{toastMarkup}</div>
        );
    }

    handleToggleClick = (index) => () => {
        this.setState(preState => (preState.open[index] = !preState.open[index], preState));
    };

    renderError() {
        return (
            <CsErrorMessage
                errorType={this.state.error.type}
            />
        )
    }
}

export default CsHelpCenter;
