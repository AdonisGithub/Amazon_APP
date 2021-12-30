import BaseApiCall from "./base-api-call";
import {ErrorType} from "../components/csErrorMessage/csErrorMessage";

//deprecated by @kbug
export default class CheckBillingApiCall extends BaseApiCall {
    static API_PATH = '/shopify/billing/';

    static onResponse(json, cbSuccess, cbError, devTest) {
        if (json.success && json.confirmation_url) {
            console.log('%cConfigurationApiCall.get()', 'color:green');
            console.log('call: Ok ....', json);
            cbSuccess(json);
        }
        else
        {
            cbError({...json, type: ErrorType.INVALID_PARAM})
        }
    }
}
