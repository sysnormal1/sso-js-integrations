import { DefaultDataSwap } from "@aalencarv/common-utils";
import { getSsoUrl } from "../CommonHelper.js";
import { getConfigs } from "../../Config.js";
/**
 * Performs authentication against the SSO service.
 *
 * @remarks
 * This function sends the user credentials to the SSO backend
 * and returns the authentication result containing:
 *
 * - authentication status
 * - access token
 * - refresh token
 * - additional user information
 *
 * The response is wrapped inside a {@link DefaultDataSwap} structure.
 *
 * @param params Authentication parameters.
 *
 * @returns A {@link DefaultDataSwap} containing the authentication result.
 *
 * @example
 * ```ts
 * const result = await authOnSso({
 *   identifier: "user@email.com",
 *   password: "secret"
 * });
 *
 * if(result.success){
 *   console.log(result.data.token);
 * }
 * ```
 *
 * @see {@link refreshToken}
 */
export async function authOnSso(params) {
    let result = new DefaultDataSwap();
    try {
        const configs = getConfigs();
        const url = getSsoUrl({
            ...params,
            ssoUrl: params.url || configs.ssoUrl,
            ssoEndpoint: params.endpoint || configs.ssoAuthEndpoint
        });
        console.debug('requesting auth sso', url);
        let response = await fetch(url || '', {
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
/**
 * Refreshes an expired or expiring authentication token.
 *
 * @remarks
 * This function sends a refresh request to the SSO backend using
 * the provided refresh token and returns a new authentication token.
 *
 * The request includes the current token in the `Authorization`
 * header and the refresh token in the request body.
 *
 * @param params Refresh token request parameters.
 *
 * @returns A {@link DefaultDataSwap} containing the refreshed token data.
 *
 * @example
 * ```ts
 * const refreshed = await refreshToken({
 *   token: auth.token,
 *   refreshToken: auth.refreshToken
 * });
 * ```
 *
 * @see {@link authOnSso}
 */
export async function refreshToken(params) {
    let result = new DefaultDataSwap();
    try {
        const configs = getConfigs();
        const url = getSsoUrl({
            ...params,
            ssoUrl: params.url || configs.ssoUrl,
            ssoEndpoint: params.endpoint || configs.ssoRefreshTokenEndpoint
        });
        console.debug("refreshing token", url, params);
        let resultRequest = await fetch(url || '', {
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
/**
 * Determines whether a token error corresponds to an expired token.
 *
 * @remarks
 * This helper inspects the error response returned by the SSO
 * backend and checks whether it contains common expiration
 * messages such as:
 *
 * - "expired"
 * - "invalid signature"
 *
 * This is useful when deciding whether the application
 * should automatically trigger a token refresh.
 *
 * @param resultJson Response returned from an API call.
 *
 * @returns `true` if the token appears to be expired.
 *
 * @example
 * ```ts
 * if(checkTokenIsExpired(response)){
 *   await refreshToken(...)
 * }
 * ```
 */
export function checkTokenIsExpired(resultJson) {
    let result = false;
    try {
        if (!resultJson?.success) {
            let message = resultJson.message || resultJson.toString();
            if ((message || '').trim().toLowerCase().indexOf("expired") > -1
                || (message || '').trim().toLowerCase().indexOf("invalid signature") > -1)
                result = true;
        }
    }
    catch (e) {
        console.error(e);
    }
    return result;
}
