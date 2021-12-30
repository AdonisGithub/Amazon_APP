import React from 'react';
import {Redirect} from '@shopify/app-bridge/actions';
import createApp from "@shopify/app-bridge";
import ShopifyContext from "../context";


const YEAR_1 = 2;
const MONTH_1 = 3;
const MONTH = 4;

export default class Util {

    static clone(obj) {
        var copy;

        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" != typeof obj) return obj;

        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = Util.clone(obj[i]);
            }
            return copy;
        }

        // Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = Util.clone(obj[attr]);
            }
            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    }

    static getDateString(date) {
        var d = date.getDate();
        var m = date.getMonth() + 1;
        var y = date.getFullYear();
        return '' + y + '-' + (m<=9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
    }

    static getTimeString(date){
        var hr = date.getHours();
        var min = date.getMinutes();
        var sec = date.getSeconds();
        return '' + (hr <= 9 ? '0' + hr : hr) + ':' + (min <= 9 ? '0' + min : min) + ':' + (sec <= 9 ? '0' + sec : sec);
    }

    static getCurrency(price, currencySymbol, showPreSymbol = false) {
        if( price !== null && price !== false && !isNaN(price) && currencySymbol){
            let amount = parseFloat(price).toFixed(2);
            switch (currencySymbol) {
                default:
                    if(showPreSymbol) {
                        return currencySymbol + " " + amount;
                    } else {
                        return amount + " " + currencySymbol;
                    }
            }
        }
        return "";

    }

    static isNumber(num) {
        if( num === null || num === undefined || isNaN(num) ) {
            return false;
        } else {
            return true;
        }
    }

    static getSearchPeriod(type, dateFrom){
        let date = new Date();
        let year = 0;
        let month = 0;
        var dateF = new Date(dateFrom);
        if(type === YEAR_1) {
            year = dateF.getFullYear();
            return {from: date.setFullYear(year - 1, 0, 1), to: date.setFullYear(year - 1, 11, 31)}
        } else if(type === MONTH_1){
            month = dateF.getMonth();
            year = dateF.getFullYear();
            return {from: date.setFullYear(year, month - 1, 1), to: date.setFullYear(year, month, 0)};
        } else if (type === MONTH) {
            let date_from = new Date();
            return {from: date_from.setDate(1), to: date};
        } else {
            let date_to = new Date();
            return {from: date_to.setMonth(0, 1), to: date}
        }
    }

    static indexOf(arr, item, is_strict = false) {
        for(let i in arr) {
            if(is_strict) {
                if(arr[i] == item) {
                    return i;
                }
            } else {
                if(arr[i] === item) {
                    return i;
                }
            }
        }
        return -1;
    }

    /* For a given date, get the ISO week number
     * https://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php
     * Based on information at:
     *
     *    http://www.merlyn.demon.co.uk/weekcalc.htm#WNR
     *
     * Algorithm is to find nearest thursday, it's year
     * is the year of the week number. Then get weeks
     * between that date and the first day of that year.
     *
     * Note that dates in one year can be weeks of previous
     * or next year, overlap is up to 3 days.
     *
     * e.g. 2014/12/29 is Monday in week  1 of 2015
     *      2012/1/1   is Sunday in week 52 of 2011
     */
    static getWeekNumber(d) {
        // Copy date so don't modify original
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        // Set to nearest Thursday: current date + 4 - current day number
        // Make Sunday's day number 7
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        // Get first day of year
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        // Calculate full weeks to nearest Thursday
        var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
        // Return array of year and week number
        //return [d.getUTCFullYear(), weekNo];
        return(weekNo);
    }

    static compare(a, b, field){
        if(a[field] < b[field]){
            return -1;
        }

        if(a[field] > b[field]){
            return 1;
        }

        return 0;
    }

    static getPathName(){
        let exc = /\/\#(.*)\?(.*)/;
        let res;
        let tabs;

        res = exc.exec(window.location.href);
        tabs = window.location.pathname.split('/');
        // console.log(window.location.pathname, tabs);
        if ( res ){
            return res[1];
        } else if (tabs.length > 2){
            return tabs;
        }else{
            return window.location.pathname.replace('/', '');
        }
    }

    static getParam(field){
        let searchParams = new URLSearchParams(decodeURIComponent(window.location.search));

        return searchParams.get(field);
    }

    static getRawHtmlElement(text) {
        return React.createElement("span", { dangerouslySetInnerHTML: { __html: text } });
    }

    // static redirect(url, is_pop = false) {
    //     let element = document.createElement('a');
    //     element.href = url;
    //     if( is_pop ) {
    //         element.target = '_blank';
    //     } else {
    //         element.target = '_top';
    //     }
    //     document.body.appendChild(element);
    //     element.click();
    //     setTimeout(function(){
    //         document.body.removeChild(element);
    //     }, 100);
    // }
    //
    static redirect(url) {
        let shopify = ShopifyContext.getShared();
        let domain = shopify.domain;
        let api_key = shopify.api_key;
        console.log("config", domain, api_key);
        const app = createApp({
            apiKey: api_key,
            shopOrigin: domain,
            host: shopify.getShopifyHost()
        });
        const redirect = Redirect.create(app);
        redirect.dispatch(Redirect.Action.REMOTE, url);

    }

    static getDuration(start, end) {
        let startDate = start ? new Date(start) : false;
        let endDate = end ? new Date(end) : false;
        return (start && end) ? Math.abs((startDate.getTime() - endDate.getTime()) / 1000): false;
    }

    static isSameFloat(a, b) {
        if( Math.abs(a-b) < 0.001 ) {
            return true;
        }
        return false;
    }

    static copyToClipboard(text) {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }

    static decodeHtmlEntities(text) {
        let textArea = document.createElement('textarea');
        textArea.innerHTML = text;
        return textArea.value;
    }

    static async asyncForChunk(data, chunk_size, callback) {
        let i,j,tmp;
        for (i=0,j=data.length; i<j; i+=chunk_size) {
            tmp = data.slice(i,i+chunk_size);
            await callback(tmp);
        }
    }

    static checkASIN(asin) {
        if( asin.length == 0 || asin.length == 10) {
            if(asin.length == 10) {
                let exp = /^[A-Z0-9]{10}$/;
                if(exp.exec(asin)){
                    return true;
                } else {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    }

    static inArray(needle, haystack) {
        if(!haystack) {
            return false;
        }
        let length = haystack.length;
        for(let i = 0; i < length; i++) {
            if(haystack[i] == needle) return true;
        }
        return false;
    }
}
