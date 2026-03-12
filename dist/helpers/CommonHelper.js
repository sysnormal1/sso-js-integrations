import { hasValue } from "@aalencarv/common-utils";
import { getConfigs } from "../Config.js";
export function getSsoUrl(params) {
    let result = null;
    if (hasValue(params?.ssoUrl)) {
        result = params.ssoUrl;
        if (hasValue(params?.ssoEndpoint)) {
            if ((result || '').indexOf(params.ssoEndpoint) <= -1) {
                if ((result || '').replace("//", "").indexOf('/') <= -1) {
                    result += params.ssoEndpoint;
                }
            }
        }
    }
    else {
        result = getConfigs().ssoUrl || '';
        if (hasValue(params?.ssoEndpoint)) {
            result += params.ssoEndpoint;
        }
        else if (typeof params === 'string' && hasValue(params)) {
            result += params;
        }
    }
    return result;
}
