import React from "react";

import dotenv from 'dotenv';

import i18nNext from 'i18next';
import StrApiCall from "../../functions/str-api-call";

var cs18n_list = [];
var cs18n_missing_list = [];
var handler_post = null;

function handlerMissingKey(lng, ns, key, fallbackValue) {

    let lang = i18nNext.language;
    if( !lang )
        lang = 'en';
    if( cs18n_list[key] ) {
        return;
    }

    cs18n_list[key] = key;
    let data = null;

    if( lang === "en") {
        data = {lang: lang, key: key, text:key, missing: false};
    } else {
        data = {lang: lang, key: key, text:"", missing: true};
    }
    cs18n_missing_list.push(data);
    postMissingData();
}

function postMissingData() {
    if( handler_post )
        return;
    var count = cs18n_missing_list.length;
    handler_post = setTimeout( () => {
        if( count !== cs18n_missing_list.length ) {
            handler_post = null;
            postMissingData();
            return;
        }

        dotenv.config();

        let token = process.env.REACT_APP_STRAPI_POST_KEY;
        let data = [];
        let path = window.location.pathname;
        for(let item of cs18n_missing_list ) {
            data.push({...item, path, });
        }
        cs18n_missing_list = [];
        handler_post = null;

        if(token) {
            StrApiCall.post('trans', {}, {token: token, items: data}, (result) => {
            });
        } else {
            console.error("csI18n POST: token is undefined");
        }
    }, 3000);
}


i18nNext
// .use(reactI18nextModule)
    .init({
        debug: false,
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
        keySeparator: false,
        saveMissing: true,
        nsSeparator: false,
        missingKeyHandler: handlerMissingKey,
    });

export class CsI18n extends React.Component {
    static lang_code = '';

    static getCache = null;
    static setCache = null;

    static initParam(lng, funcGetCache, funcSetCache) {
        this.lang_code = lng;
        i18nNext.changeLanguage(lng);
        CsI18n.getCache = funcGetCache;
        CsI18n.setCache = funcSetCache;
    }

    static loadResource(result) {
        for(let item of result) {
            let cskey = item.key.trim();
            i18nNext.addResource(item.lang, "translation", cskey, item.text);
            cs18n_list[cskey] = cskey;
        }
    }

    static getCacheKey() {
        return "CsI18n_Cache." + CsI18n.lang_code;
    }

    static init(success, fail = null) {

        if( !CsI18n.lang_code ) {
            console.error("CsI18n Lang isn't set!!!");
        }
        let lang = CsI18n.lang_code;

        let resource = (CsI18n.getCache != null)? CsI18n.getCache(CsI18n.getCacheKey()):null;
        if ( resource !== undefined && resource ) {
            CsI18n.loadResource(resource);
            success();
            return;
        }
        StrApiCall.get('trans', {lang: lang}, (result) => {
                console.log('success');
                if (!result.hasOwnProperty('statusCode')) {
                    CsI18n.loadResource(result);
                    if(this.setCache) {
                        CsI18n.setCache(CsI18n.getCacheKey(), result)
                    }
                    success();
                } else {
                    fail();
                }
            },
            () => {
                console.log('fail');

                if( fail)
                    fail()
            });
    }

    static t(key, options = null) {

        if( typeof(key) === "string" )
            key = key.trim();

        let text = i18nNext.t(key, options);
        if( text.length === 0 ) {
            text = key;
        }

        return text;
    }

    state = {
        key: "",
        options: {}
    }
    constructor(props) {

        super(props);
        let {children, ...options} = this.props;
        this.state.key = children;
        this.state.options = options;
    }

    componentWillReceiveProps(nextProps, nextContext) {
        let {children, ...options} = nextProps;
        this.setState({key: children, options: options})
    }

    convertJSX(text) {
        let options = {};
        let count = 0;
        for(let key in this.state.options) {
            if( typeof(this.state.options[key]) === "object") {
                count ++;
                options[key] = `{{${key}}}`;
            } else {
                options[key] = this.state.options[key];
            }
        }

        text = CsI18n.t(text, options);
        if( count === 0 )
            return [text];

        let items = text.split(/{{[^{}]+}}/);
        let exp = /\{\{([^\{\}]+)\}\}/g;
        let params = [];
        let match;
        while((match = exp.exec(text)) ) {
            params.push( match[1] );
        }

        let jsx = [];
        for( let i = 0; i < items.length; i++ ) {
            jsx.push(items[i]);
            if( i != (items.length - 1) ) {
                if( this.state.options[params[i]].key ) {
                    jsx.push(this.state.options[params[i]]);
                } else {
                    jsx.push( React.cloneElement(this.state.options[params[i]], {key: this.state.options[params[i]].key + i}) );
                }
            }
        }

        return jsx;
    }

    render() {
        let text;
        if( typeof(this.state.key) === "string" ) {
            text = this.convertJSX(this.state.key);

        } else {
            text = [];
            for(let item of this.state.key) {
                if( typeof(item) === "string" ) {
                    text.concat(this.convertJSX(item));
                } else {
                    text.push(item);
                }
            }
        }
        return (<React.Fragment>
            {text}
        </React.Fragment>);
    }
}
