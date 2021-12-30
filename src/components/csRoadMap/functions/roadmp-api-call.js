import Const from "../Const";
import {ErrorType} from "../../csErrorMessage/csErrorMessage"
import axios from "axios";
import * as Sentry from "@sentry/react";

const FETCH_TIMEOUT = 30000;
const GET = 1;
const POST = 2;

let didTimeOut = false;

export default class RoadmpApiCall {
    static get(operation, params, success, fail = null, retryCall=true, devTest = false) {

        didTimeOut = false;
        let url = Const.API_BASE+'/'+operation;

        let timeout = RoadmpApiCall.getTimeOut(GET, operation, params, success, fail, retryCall);
        axios.get(url)
        .then(json => {
            console.log('call: Ok ....', json);
            clearTimeout(timeout);

            if(!didTimeOut) {
                if( !devTest ) {
                    if( json.data.status == 200 ) {
                        success(json.data);
                    } else {
                        fail({...json.data, type:ErrorType.INVALID_PARAM})
                    }
                } else {
                    fail({...json.data, type:ErrorType.NETWORK})
                }
            }

        }).catch(err =>  {
            Sentry.captureException(err);
            clearTimeout(timeout);
            if(didTimeOut) return;
            if( fail )
                fail({...err, type:ErrorType.NETWORK})
        });
    }

    static post(operation, params, success, fail = null, retryCall=true) {

        didTimeOut = false;
        let url = Const.API_BASE+'/'+operation;
        let timeout = RoadmpApiCall.getTimeOut(POST, operation, params, success, fail, retryCall);

        axios.post(url, params)
        .then(json => {
            //console.log('call: Ok ....', json)
            clearTimeout(timeout);
            if(!didTimeOut){
                if( json.data.status == 200 ) {
                    success(json.data);
                } else {
                    fail({...json.data, type:ErrorType.INVALID_PARAM})
                }
            }
        }).catch(err =>  {
            //console.log(err);
            Sentry.captureException(err);
            clearTimeout(timeout);
            if(didTimeOut) return;
            if(fail){
                fail({...err, type: ErrorType.NETWORK})
            }
        });
    }

    static getTimeOut(type, operation, params, cbSuccess, cbError, retryCall){

        return setTimeout(() => {
            didTimeOut = true;
            if(retryCall === true){
                if(type === GET){
                    RoadmpApiCall.get(operation, params, cbSuccess, cbError, false);
                }else{
                    RoadmpApiCall.post(operation, params, cbSuccess, cbError, false)
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

