import dotenv from "dotenv";
import * as Sentry from "@sentry/react";

const ErrorType = {
    NETWORK: 1,
    INVALID_PARAM: 2,
    NORMAL: 3,
    TIMEOUT: 4,
}
const FETCH_TIMEOUT = 60000;
const GET = 1;
const POST = 2;

let didTimeOut = false;

export default class StrApiCall {

    static url_base = '';
    static getBaseUrl() {
        if( this.url_base == '' ) {
            dotenv.config();
            this.url_base = (process.env.REACT_APP_URL_STRAPI) ? process.env.REACT_APP_URL_STRAPI : '';
        }
        return this.url_base;
    }

    static get(operation, params, success, fail = null, retryCall=true, devTest = false) {

        didTimeOut = false;
        let endpoint = this.getBaseUrl() + '/' + operation;

        var url = new URL(endpoint);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        let timeout = StrApiCall.getTimeOut(GET, operation, params, '', success, fail, retryCall);

        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*'
            }
        }).then(res => {
            return res.json();
        }).then(json => {
            console.log('call: Ok ....', json);
            clearTimeout(timeout);

            if(!didTimeOut){
                if( !devTest ) {
                    success(json);
                } else {
                    fail({...json, type:ErrorType.NETWORK})
                }
            }

        }).catch(err =>  {
            console.error("str-api-call: get", url, err);
            clearTimeout(timeout);
            Sentry.captureException(err);
            if(didTimeOut) return;
            if( fail )
                fail({...err, type:ErrorType.NETWORK})
        });
    }

    static post(operation, params, data, success, fail = null, retryCall=true) {

        didTimeOut = false;
        let endpoint = this.getBaseUrl() + '/' + operation;

        var url = new URL(endpoint);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        //console.log(url, params, JSON.stringify(data))
        // let timeout = StrApiCall.getTimeOut(POST, operation, params, data, success, fail, retryCall);

        fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*'
            }
        }).then(res => {
            return res.json();
        }).then(json => {
            //console.log('call: Ok ....', json)
            // clearTimeout(timeout);
            if(!didTimeOut){
                success(json);
            }
        }).catch(err =>  {
            //console.log(err);
            // Sentry.captureException(err); //PLEASE DON'T ACTIVE. it maybe error.
            // clearTimeout(timeout);
            if(didTimeOut) return;
            if(fail){
                fail({...err, type: ErrorType.NETWORK})
            }
        });
    }

    static getTimeOut(type, operation, params, data, cbSuccess, cbError, retryCall){

        return setTimeout(() => {
            didTimeOut = true;
            if(retryCall === true){
                if(type === GET){
                    StrApiCall.get(operation, params, cbSuccess, cbError, false);
                }else{
                    StrApiCall.post(operation, params, data, cbSuccess, cbError, false)
                }

            }else{
                let json = {status: "Error", message: "Timed out to call API"};
                if(cbError){
                    cbError({...json, type: ErrorType.TIMEOUT});
                }
                console.log('Timeout');
            }
        }, FETCH_TIMEOUT);
    }
}
