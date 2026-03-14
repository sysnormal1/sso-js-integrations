import { hasValue } from "@aalencarv/common-utils";
import { getConfigs } from "../Config.js";

/**
 * Represents a resource permission entry returned by the SSO authorization service.
 *
 * This structure mirrors the `ResourcePermissionView` class from the Java
 * `sso-starter` backend and contains both resource metadata and the
 * permissions granted to the current agent.
 *
 * @remarks
 * The object may include additional fields in the future as the backend
 * `ResourcePermissionView` evolves. Consumers should avoid relying on a
 * fixed set of properties beyond those documented in the backend contract.
 *
 * The `children` property allows the structure to represent hierarchical
 * resources such as menu trees or nested routes.
 *
 * @see ResourcePermissionView (Java class in the SSO backend)
 * @public
 */
export type ResourcePermissionData = {
    resourceSystemId: number;
    resourceId: number;
    resourceParentId?: number;
    resourceTypeId: number;
    resourceName: string;
    resourcePath: string;
    resourceIcon?: string;
    resourceNumericOrder?: number;
    resourceShowInMenu?: 0 | 1;
    resourcePermissionId?: number;
    resourcePermissionAccessProfileId?: number;
    resourcePermissionAgentId?: number;
    resourcePermissionAllowedAccess?: 0 | 1;
    resourcePermissionAllowedView?: 0 | 1;
    resourcePermissionAllowedCreate?: 0 | 1;
    resourcePermissionAllowedChange?: 0 | 1;
    resourcePermissionAllowedDelete?: 0 | 1;
    children?: ResourcePermissionData[];

    /**
     * Additional property not present in the backend `ResourcePermissionView`.
     * Used by the frontend to control link navigation behavior.
     */
    target?: string;
}



/**
 * Parameters used to resolve the SSO service URL.
 *
 * This structure allows callers to override the base SSO URL
 * or append a specific endpoint path when building the final URL.
 *
 * @remarks
 * If `ssoUrl` is not provided, the value configured in the
 * library configuration (via `getConfigs()`) will be used.
 */
export type GetSsoUrlParams = {

    /**
     * Base URL of the SSO service.
     *
     * If provided, this value takes precedence over the configured
     * default SSO URL.
     */
    ssoUrl?: string;

    /**
     * Optional endpoint path to append to the resolved SSO URL.
     *
     * This is typically used to access specific SSO API routes.
     */
    ssoEndpoint?: string;
}

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
export function getSsoUrl(
    params?: GetSsoUrlParams | string | null | undefined
): string | null {

    let result: string | null = null;
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

    } else {

        result = getConfigs().ssoUrl || '';

        if (!isString && hasValue(params?.ssoEndpoint)) {
            result += params.ssoEndpoint;
        } else if (isString && hasValue(params)) {
            result += params;
        }
    }

    return result;
}
