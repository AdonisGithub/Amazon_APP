import React, {Component} from 'react';
import {
    AppProvider, Card, Collapsible, Heading, Icon, Link,
    Spinner, Stack,
    Popover,
    Scrollable, Tooltip
} from '@shopify/polaris';
import Context from "../../context";

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

import StrApiCall from "../../functions/str-api-call";
import CsI18n from "./../../components/csI18n"
import CsErrorMessage from "../../components/csErrorMessage";
import Markdown from 'react-markdown';

export default class CsHelpButton extends React.Component {

    state = {
        active: false,
        wait: true,
        lang: 'en',
        default_lang: 'en',
        page: 'Rules',
        tag: '',
        sub_tag: '',
        opened: false,
        index: -1,
        size: 'normal',
    };

    static defaultProps = {
        default_lang: "en",
    }
    constructor(props) {
        super(props);
        this.shopify = Context.getShared();
        this.contents = [];
        this.state.page = this.props.page;
        this.state.lang = this.shopify.lang;
        this.state.default_lang = this.props.default_lang;
        this.state.tag = this.props.tag;
        this.state.sub_tag = this.props.sub_tag? this.props.sub_tag:'';
        this.last_time = Date.now();
        if(this.props.size) {
            this.state.size = this.props.size;
        }
        this.unMounted = false;
    }

    getHelpUrl() {
        return this.shopify.getAppBaseUrl() + "/help/" + this.state.page.toLowerCase();
    }


    componentWillMount() {
        require('./csHelpButton.css') ;
        this.getContent(this.state.page);
        // try {
        //     navigator.serviceWorker.addEventListener('message', this.getUpdatedCache);
        // } catch (err) {
        //
        // }
    }

    componentWillUnmount() {
        this.unMounted = true;
        // try {
        //     navigator.serviceWorker.removeEventListener('message', this.getUpdatedCache);
        // } catch (err) {
        //
        // }
    }

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

    componentWillReceiveProps(nextProps, nextContext) {
        let {tag, sub_tag, size} = this.state;
        if( tag != nextProps.tag || sub_tag != nextProps.sub_tag ) {
            tag = nextProps.tag;
            sub_tag = nextProps.sub_tag? nextProps.sub_tag:'';
            if(nextProps.size) {
                size = nextProps.size;
            }
            this.initActiveTag(tag, sub_tag);
            this.setState({tag, size, sub_tag});
        }
    }

    initActiveTag(tag, sub_tag) {
        let index = -1;
        let key = tag + (sub_tag? ("_" + sub_tag):'');
        for (let i in this.contents) {
            let item = this.contents[i];
            if( key == item.tag ) {
                index = i;
                break;
            }
            if (tag == item.tag) {
                index = i;
                if( !sub_tag ) {
                    break;
                }
            }
        }
        if( index === -1 ) {
            index = 0;
        }

        this.setState({index, opened: true});
    }

    getContent(page) {
        console.log("getContent", page);
        this.contents = [];

        StrApiCall.get('Helps', {
            type: page,
        }, (result) => {
            this.cbGetContents(result);
        }, this.cbGetContentError);

        this.setState({wait: true, page});
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
        if( result && result.length ) {
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
            this.contents = contents.map( (item) => {
                item.content = this.fixMark(item.content);
                return item;
            });
            this.initActiveTag(this.state.tag);
        }
        this.setState({wait: false});
    }

    handleToggleClick = (new_index) => () => {
        console.log("handleToggleClick", new_index, this.state);
        let {opened, index} = this.state;
        if( new_index == index ) {
            opened = !opened;
        } else {
            opened = true;
        }
        index = new_index;
        this.last_time = Date.now();
        // opened[index] = !opened[index];
        this.setState({opened, index});
    };

    cbGetContentError = (err) => {
        console.log(err);
        if (err) {
            this.setState({error: err, wait: false})
        }
    }

    imageStyle(props) {
        return <img {...props} style={{maxWidth: '100%'}}/>
    }

    createCards() {
        let cards = [];
        for (let i in this.contents) {
            let item = this.contents[i];

            let opened = this.state.opened && i == this.state.index;

            let card = (<Card key={"cards" + i} sectioned>
                {opened? <Scrollable.ScrollTo><p></p></Scrollable.ScrollTo>:''}
                <Stack key={"stack" + i}>
                    <Stack.Item key={"stack_item_head" + i} fill><Heading key={"heading" + i}>{item.title}</Heading></Stack.Item>
                    <Stack.Item key={"stack_item" + i}>
                        {/*{opened ?*/}
                            {/*<Scrollable.ScrollTo>here</Scrollable.ScrollTo>:null}*/}
                        <Link key={"link" + i} onClick={this.handleToggleClick(i)}><Icon
                            source={opened ? ChevronUpMinor : ChevronDownMinor}/></Link>
                    </Stack.Item>
                </Stack>
                {opened?
                    <Card.Section key={"sub_card" + i}>
                        <Markdown key={"mark" + i} className="markdown" escapeHtml={false} linkTarget={"_blank "} source={item.content}
                                  renderers={{image: this.imageStyle}}/>
                    </Card.Section>
                    :''}
            </Card>);

            cards.push(card);
        }
        return cards;
    }


    togglePopover = () => {
        let cur_time = Date.now();
        if( cur_time < (this.last_time + 500) ) {
            return;
        }
        this.setState(({active}) => {
            return {active: !active};
        });
    };

    renderError() {
        return (
            <CsErrorMessage
                errorType={this.state.error.type}
            />
        )
    }
    componentDidUpdate(prevProps, prevState, snapshot) {

    }

    componentDidMount() {
    }

    render(){
        let content;
        if (this.state.error) {
            content = this.renderError();
        } else if (this.state.wait) {
            content = (<Stack distribution="center"><Spinner size="large" color="teal"
                                                             accessibilityLabel={CsI18n.t("Loading")}></Spinner></Stack>);
        } else {
            content = this.createCards();
        }

        const activator = (
            <div className={"help-button" + (this.state.size == 'normal' ? " help-button-s" : "help-button-m")}>
                <Tooltip content={CsI18n.t("Help Center")}>
                    <Link onClick={this.togglePopover}>
                        <Icon source={QuestionMarkMajorMonotone} color="green"/>
                    </Link>
                </Tooltip>
            </div>);

        let help_url = this.getHelpUrl();

        let help_content = (
            <div className={"help-center-main"}>
                <div className={"help-center-link"}>
                    <Stack><Stack.Item fill/>
                        <Stack.Item>
                            <Link url={help_url} external>{CsI18n.t("Help Center")}</Link>
                        </Stack.Item>
                    </Stack>
                </div>
                {content}
            </div>
        );

        return (
            <div className={"help-popover"}>
                <Popover active={this.state.active} activator={activator} onClose={this.togglePopover} sectioned preferredPosition={"mostSpace"} preferredAlignment={"right"} >
                    {help_content}
                </Popover>
            </div>
        )
    }
}


