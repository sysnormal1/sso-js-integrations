import { DefaultDataSwap } from "@aalencarv/common-utils";
export async function authOnSso(params) {
    let result = new DefaultDataSwap();
    try {
        let response = await fetch(params.url || '', {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                identifierTypeId: params.identifierTypeId,
                identifier: params.identifier,
                password: params.password
            })
        });
        result = await response.json();
    }
    catch (e) {
        result.setException(e);
    }
    return result;
}
export async function refreshToken(params) {
    let result = new DefaultDataSwap();
    try {
        let resultRequest = await fetch(params.url || '', {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                'Authorization': `Bearer ${params.token}`
            },
            body: JSON.stringify({
                refreshToken: params.refreshToken
            })
        });
        result = await resultRequest.json();
    }
    catch (e) {
        result.setException(e);
    }
    return result;
}
export function checkTokenIsExpired(resultJson) {
    let result = false;
    try {
        if (!resultJson?.success) {
            let message = resultJson.message || resultJson.toString();
            if ((message || '').trim().toLowerCase().indexOf("expired") > -1 || (message || '').trim().toLowerCase().indexOf("invalid signature") > -1)
                result = true;
        }
    }
    catch (e) {
        console.error(e);
    }
    return result;
}
