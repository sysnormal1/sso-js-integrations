import { hasValue } from "@aalencarv/common-utils";
import { getConfigs } from "../Config.js";
/**
 * Resolves the final SSO service URL.
 *
 * This helper function builds the URL used to communicate with
 * the SSO backend, combining the configured base URL with an
 * optional endpoint.
 *
 * @remarks
 * The resolution follows this priority:
 *
 * 1. If `params.ssoUrl` is provided, it is used as the base URL.
 * 2. Otherwise, the default `ssoUrl` from the library configuration is used.
 * 3. If an endpoint is provided (`ssoEndpoint` or string param),
 *    it is appended to the resolved base URL.
 *
 * The function accepts multiple parameter formats for convenience:
 *
 * - `GetSsoUrlParams`
 * - a `string` representing the endpoint
 * - `null` or `undefined`
 *
 * @param params Optional parameters used to build the SSO URL.
 *
 * @returns The resolved SSO URL or `null` if it cannot be determined.
 *
 * @example
 * ```ts
 * getSsoUrl({
 *   ssoUrl: "https://sso.company.com",
 *   ssoEndpoint: "/api/resources"
 * })
 * ```
 *
 * @example
 * ```ts
 * getSsoUrl("/api/resources")
 * ```
 *
 * @example
 * ```ts
 * getSsoUrl()
 * ```
 */
export function getSsoUrl(params) {
    let result = null;
    const isString = typeof params === "string";
    if (!isString && hasValue(params?.ssoUrl)) {
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
        if (!isString && hasValue(params?.ssoEndpoint)) {
            result += params.ssoEndpoint;
        }
        else if (isString && hasValue(params)) {
            result += params;
        }
    }
    return result;
}
