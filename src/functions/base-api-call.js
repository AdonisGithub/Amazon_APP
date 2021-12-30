import dotenv from "dotenv";
import {ErrorType} from "../components/csErrorMessage/csErrorMessage";
import request from "superagent";
import ShopifySetting from "../components/shopify_setting";
import * as Sentry from "@sentry/react";

const FETCH_TIMEOUT = 120000;
const GET = 1;
const POST = 2;

export default class BaseApiCall {
    static admin_key = null;
    static didTimeOut = false;
    static API_PATH = '';

    static getAdminKey() {
        if (this.admin_key === null) {
            dotenv.config();
            this.admin_key = (process.env.REACT_APP_ADMIN_KEY) ? process.env.REACT_APP_ADMIN_KEY : '';
        }
        return this.admin_key;
    }

    static setApiParam(params = null) {
        let setting = ShopifySetting.getShared();
        if (!params) {
            params = {};
        }
        params.store = setting.store;
        params.version = setting.version;

        let admin_key = this.getAdminKey();
        if (admin_key)
            params.admin_key = admin_key;
        return params;
    }

    static getTimeOut(type, operation, params, data, cbSuccess, cbError, retryCall){

        return setTimeout(() => {
            this.didTimeOut = true;
            if(retryCall === true){
                if(type === GET){
                    this.get(operation, params, cbSuccess, cbError, false);
                }else{
                    this.post(operation, params, data, cbSuccess, cbError, false)
                }

            }else{
                let json = {status: "Error", message: "Timed out to call API"};
                cbError({...json, type: ErrorType.TIMEOUT});
                console.log('Timeout');
            }
        }, FETCH_TIMEOUT);
    }

    static onResponse(json, cbSuccess, cbError, devTest) {
        if( !devTest ) {
            if (json.status === 'Ok') {
                console.log('%c Api Call', 'color:green');
                console.log('call: Ok ....', json);
                cbSuccess(json.data);
            }
            else
            {
                cbError({...json, type: ErrorType.INVALID_PARAM})
            }
        } else {
            json = {status: "Error", message: "Test Error Message "};
            cbError({...json, type: ErrorType.INVALID_PARAM});
            // cbError({type: ErrorType.NETWORK})
        }
    }

    static get(operation, params, cbSuccess, cbError = null, retryCall=true, devTest = false) {
        this.didTimeOut = false;
        let setting = ShopifySetting.getShared();
        let endpoint = setting.api_url + this.API_PATH + operation;
        console.log('%c BaseApiCall.get()', 'color:navy');

        params = this.setApiParam(params);

        var url = new URL(endpoint);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        console.log(url, params);

        let timeout = this.getTimeOut(GET, operation, params, '', cbSuccess, cbError, retryCall);
        console.log('referer', window.location.href);
        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'x-app-referer': window.location.href,
            }
        }).then(res => {
            return res.json();
        }).then(json => {
            console.log(json);
            clearTimeout(timeout);
            if(!this.didTimeOut){
                this.onResponse(json, cbSuccess, cbError, devTest);
            }
        }).catch(err =>  {
            console.error("api-call: get", url, err);
            Sentry.captureException(err);
            clearTimeout(timeout);
            if(this.didTimeOut) return;
            if(cbError){
                cbError({...err, type: ErrorType.NETWORK})
            }
        });
    }

    static post(operation, params, data, cbSuccess, cbError = null, retryCall=true, devTest = false) {

        this.didTimeOut = false;
        let setting = ShopifySetting.getShared();
        let endpoint = setting.api_url + this.API_PATH + operation;

        params = this.setApiParam(params);

        if ( devTest ) {
            params.debug = 1;
        }

        var url = new URL(endpoint);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        console.log('%c BaseApiCall.post()', 'color:navy');
        console.log(url, params, JSON.stringify(data));

        let timeout = this.getTimeOut(POST, operation, params, data, cbSuccess, cbError, retryCall);
        fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'x-app-referer': window.location.href,
            },
        }).then(res => {
            return res.json();
        }).then(json => {
            console.log(json);

            clearTimeout(timeout);
            if(!this.didTimeOut){
                this.onResponse(json, cbSuccess, cbError, devTest);
            }

        }).catch(err =>  {
            console.error("api-call: post", url, err);
            clearTimeout(timeout);
            Sentry.captureException(err);
            if(this.didTimeOut) return;
            if( !devTest ) {
                cbError({err, type:ErrorType.NETWORK});
            } else {
                err = {status: "Error", message: "Test Error Message "};
                cbError({...err, type: ErrorType.INVALID_PARAM});
                // cbError({type: ErrorType.NETWORK})
            }

        });
    }

    static upload(operation, params, file, success, fail = null, devTest = false) {
        var setting = ShopifySetting.getShared();
        var endpoint = setting.api_url + this.API_PATH + operation;

        params = this.setApiParam(params);

        var url = new URL(endpoint);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        console.log('%cApplicationApiCall.upload()', 'color:navy');
        console.log(url, params, 'data:', file);

        const req = request.post(url).set('x-app-referer', window.location.href);
        console.log("file:", file, req);
        // req.set("application/octet-stream");
        // req.set("Content-Type", "application/octet-stream");
        if( typeof(file) === 'string' ) {
            req.field('file', file);
        } else {
            req.attach(file.name, file);
        }
        // req.send(file);

        req.then((res) => {
            console.log("res:", res);
            if( res.status == 200 ) {
                success(res);
            } else {
                fail({...res, type: ErrorType.INVALID_PARAM});
            }

            /*
            if(err && fail){
                fail(err);
            }else{
                if(!devTest){
                    success(res);
                }else{
                    fail({...res, type: ErrorType.INVALID_PARAM});
                }
            }
            */
        }).catch(err =>  {
            console.error("api-call: upload", url, err);
            Sentry.captureException(err);
            if(this.didTimeOut) return;
            if( !devTest ) {
                fail({err, type:ErrorType.NETWORK});
            } else {
                err = {status: "Error", message: "Test Error Message "};
                fail({...err, type: ErrorType.INVALID_PARAM});
                // cbError({type: ErrorType.NETWORK})
            }
        });
    }

    static download(operation, params, fileName, cbSuccess, cbFail=null, devTestServer=false, devTestError=false) {
        this.get(operation, params, (result) => {
            cbSuccess();
            console.log("download: success", result);
            let setting = ShopifySetting.getShared();
            console.log('%cApplicationApiCall.get()', 'color:navy');
            console.log("params: ", params);
            var endpoint = setting.api_url + this.API_PATH +operation;

            if( devTestServer ) {
                endpoint = "http://localhost/index.php";
            }

            params = this.setApiParam({...params, filekey : result.filekey});
            let url = new URL(endpoint);

            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
            url.searchParams.append('x-app-referer', encodeURI(window.location.href));
            console.log(url, params);
            window.location.href = url;
        }, (err) => {
            console.log("download: error", err);
            cbFail();
        })
    }

    static downloadOnlyOnChrome(operation, params, fileName, success, fail=null, devTestServer=false, devTestError=false) {

        let setting = ShopifySetting.getShared();
        console.log('%cApplicationApiCall.get()', 'color:navy');
        console.log("params: ", params);
        var endpoint = setting.api_url + this.API_PATH +operation;

        if( devTestServer ) {
            endpoint = "http://localhost/index.php";
        }

        params = this.setApiParam(params);

        let url = new URL(endpoint);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        console.log(url, params);

        request.get(url)
            .on('progress', e => {
                console.log("%c progress", 'color:blue', e, e.percent);
            })
            .responseType('blob')
            .end((err, res) => {
                console.log("%c end", 'color:blue', err, res);
                if (err) {
                    if(fail){
                        fail({... err, type: ErrorType.NETWORK});
                    }
                } else {
                    if( res.status == 200 ) {
                        if(!devTestError){
                            success();
                        }else{
                            fail({type: ErrorType.INVALID_PARAM});
                        }
                        // let newBlob = new Blob([res.body.slice()], {type: res.body.type, name: fileName});
                        // let fake_url = window.URL.createObjectURL(newBlob);
                        // console.log(fake_url, fileName);
                        // let newWindow = window.open('', 'test');
                        // window.location.href = window.URL.createObjectURL(res.body);
                        let blob = res.body;
                        console.log("%c download new", 'color:blue', res, blob, fileName);
                        let element = document.createElement('a');
                        element.download = fileName;
                        let url = window.URL.createObjectURL(blob);
                        element.href = url;
                        element.style.display = '';
                        element.target = '_top';
                        document.body.appendChild(element);
                        element.click();
                        setTimeout(function(){
                            document.body.removeChild(element);
                            window.URL.revokeObjectURL(url);
                        }, 100);
                    } else {
                        fail({type: ErrorType.INVALID_PARAM});
                    }
                }
            });

    }

    static async asyncGet(operation, params)
    {
        let setting = ShopifySetting.getShared();
        let endpoint = setting.api_url + this.API_PATH + operation;
        console.log("endpoint", endpoint);
        params = this.setApiParam(params);
        let url = new URL(endpoint);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        let result = fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*'
            }
        }).then(res => {
            return res.json();
        }).then(json => {
            return json;
        }).catch(err =>  {
            Sentry.captureException(err);
            return err;
        });
        return result;
    }

    static async asyncPost(operation, params, data)
    {
        this.didTimeOut = false;
        let setting = ShopifySetting.getShared();
        let endpoint = setting.api_url + this.API_PATH + operation;
        params = this.setApiParam(params);
        let url = new URL(endpoint);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        console.log('%c BaseApiCall.post()', 'color:navy');
        console.log(url, params, JSON.stringify(data));
        let result = fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*'
            }
        }).then(res => {
            console.log('async-11', res);
            return res.json();
        }).then(json => {
            console.log('async-22', json);
            return json.data;
        }).catch(err =>  {
            console.error("api-call: asyncPost", url, err);
            Sentry.captureException(err);
            console.log('async-33', err);
            return err;
        });
        console.log('async-44', result);
        return result;
    }
}
