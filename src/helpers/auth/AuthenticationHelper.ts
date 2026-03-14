import { DefaultDataSwap } from "@aalencarv/common-utils";
import { getSsoUrl } from "../CommonHelper.js";
import { ConfigParams, getConfigs } from "../../Config.js";

/**
 * Represents the authorization context used by the SSO integration.
 *
 * This object contains the authentication tokens and related configuration
 * required to perform authorized requests and refresh authentication when needed.
 *
 * @remarks
 * Instances of this type are typically provided through an authorization
 * context getter so that the library can always access the most recent
 * authentication state.
 *
 * @public
 */
export type AuthorizationParams = {

    /**
     * Current access token used for authenticated requests.
     */
    token?: string;

    /**
     * Refresh token used to obtain a new access token when the current one expires.
     */
    refreshToken?: string;

    /**
     * Endpoint URL used to refresh the authentication tokens.
     */
    refreshTokenUrl?: string;

    /**
     * Callback invoked when the authorization data changes.
     *
     * This is typically used to update the authentication state in the host
     * application after a token refresh operation.
     *
     * @param changed The updated authorization parameters.
     */
    changedAuthorization?: (changed: AuthorizationParams) => void;
};


/**
 * Parameters required to authenticate a user against the SSO service.
 *
 * @remarks
 * These parameters are used by {@link authOnSso} to perform the
 * authentication request to the SSO backend.
 */
export type SsoAuthParams = {

    /**
     * Optional identifier type used by the authentication system.
     *
     * Examples:
     * - email
     * - username
     * - document number
     */
    identifierTypeId?: number,

    /**
     * User identifier used during authentication.
     */
    identifier: string | number,

    /**
     * User password.
     */
    password: string | number,

    /**
     * Optional base URL of the SSO server.
     *
     * If not provided, the value configured in {@link ConfigParams.ssoUrl}
     * will be used.
     */
    url?: string,

    /**
     * Optional authentication endpoint path.
     *
     * If not provided, the default configured endpoint
     * (`ssoAuthEndpoint`) will be used.
     */
    endpoint?: string
}


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
export async function authOnSso(params: SsoAuthParams): Promise<DefaultDataSwap> {

    let result = new DefaultDataSwap();

    try {

        const configs: ConfigParams = getConfigs();

        const url =
            getSsoUrl({
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

    } catch (e) {

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
export async function refreshToken(params: {
    url?: string,
    endpoint?: string,
    token: string,
    refreshToken: string
}) : Promise<DefaultDataSwap> {

    let result: DefaultDataSwap = new DefaultDataSwap();

    try {

        const configs: ConfigParams = getConfigs();

        const url =
            getSsoUrl({
                ...params,
                ssoUrl: params.url || configs.ssoUrl,
                ssoEndpoint: params.endpoint || configs.ssoRefreshTokenEndpoint
            });

        console.debug("refreshing token", url, params);

        let resultRequest = await fetch(url || '', {

            method: "POST",

            headers:{
                Accept: "application/json",
                "Content-Type": "application/json",
                'Authorization': `Bearer ${params.token}`
            },

            body: JSON.stringify({
                refreshToken: params.refreshToken
            })
        });

        result = await resultRequest.json();

    } catch (e) {

        console.error(e);

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
export function checkTokenIsExpired(resultJson?: any) : boolean {

    let result = false;

    try {

        if (!resultJson?.success) {

            let message =
                resultJson.message || resultJson.toString();

            if (
                (message || '').trim().toLowerCase().indexOf("expired") > -1 ||
                (message || '').trim().toLowerCase().indexOf("invalid signature") > -1
            )
                result = true;
        }

    } catch (e) {

        console.error(e);
    }

    return result;
}


