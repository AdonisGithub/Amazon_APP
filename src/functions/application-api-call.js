import BaseApiCall from "./base-api-call";
import {ErrorType} from "../components/csErrorMessage/csErrorMessage";

export default class ApplicationApiCall extends BaseApiCall {
    static API_PATH = '';

    static onResponse(json, cbSuccess, cbError, devTest) {
        if( !devTest ) {
            if(json.status === "Error"){
                cbError({...json, type: ErrorType.INVALID_PARAM});
            }else{
                cbSuccess(json.data);
            }
        } else {
            json = {status: "Error", message: "Test Error Message "};
            cbError({...json, type: ErrorType.INVALID_PARAM});
            // cbError({type: ErrorType.NETWORK})
        }
    }
}
