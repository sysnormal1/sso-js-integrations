import { hasValue } from "@aalencarv/common-utils";
/**
 * Internal configuration object used by the library.
 *
 * @remarks
 * These values represent the default configuration and may be
 * overridden by calling {@link config}.
 */
let configs = {
    ssoProtocol: 'http',
    ssoAddress: 'localhost',
    ssoPort: null,
    ssoUrl: 'http://localhost',
    ssoRegisterEndpoint: "/auth/register",
    ssoLoginEndpoint: "/auth/login",
    ssoAuthEndpoint: "/auth/login",
    ssoRefreshTokenEndpoint: "/auth/refresh_token",
    ssoGetAllowedsResourcesEndpoint: "/records/resources/get_alloweds",
    ssoRecordsEndpoint: "/records",
    ssoSystemsEndpoint: "/records/systems",
    ssoAccessProfilesEndpoint: "/records/access_profiles",
    ssoAgentsXAccessProfilesXSystemsEndpoint: "/records/agents_x_access_profiles_x_systems",
    ssoResourcesEndpoint: "/records/resources",
    ssoResourcePermissionsEndpoint: "/records/resource_permissions",
    ssoGetResourcePermissionsEndpoint: "/records/resources/get_resource_permissions",
    ssoThisSystemId: null,
    ssoResourcetypeScreenId: 10,
    showResourceAsPopup: false
};
/**
 * Initializes or updates the global configuration used by the library.
 *
 * @remarks
 * This function merges the provided parameters with the existing
 * configuration values. After merging, the resulting configuration
 * object is frozen to prevent accidental mutations.
 *
 * If a `ssoPort` is provided and `ssoUrl` is not explicitly defined,
 * the port will be appended to the resolved SSO URL.
 *
 * This function is typically called once during application startup.
 *
 * @param params Optional configuration parameters.
 *
 * @example
 * ```ts
 * config({
 *   ssoUrl: "https://sso.company.com",
 *   ssoThisSystemId: 5
 * })
 * ```
 *
 * @see {@link ConfigParams}
 */
export function config(params) {
    configs = { ...configs, ...params };
    if (hasValue(params?.ssoPort) && !hasValue(params?.ssoUrl)) {
        configs.ssoUrl = (configs.ssoUrl || '') + `:${params.ssoPort}`;
    }
    Object.freeze(configs);
}
/**
 * Retrieves the current configuration used by the library.
 *
 * @remarks
 * The returned configuration object is a shallow copy of the
 * internal configuration and is frozen to avoid accidental mutation.
 *
 * @returns The current configuration values.
 *
 * @see {@link ConfigParams}
 */
export function getConfigs() {
    let result = { ...configs };
    Object.freeze(result);
    return result; // avoid external mutation
}
