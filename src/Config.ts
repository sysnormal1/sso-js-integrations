import { hasValue } from "@aalencarv/common-utils";

/**
 * Configuration parameters used to initialize the SSO integration.
 *
 * This structure defines the base connection information and the
 * endpoints used to communicate with the SSO backend services.
 *
 * @remarks
 * These values are used internally by the library when building
 * API URLs for authentication, authorization and resource queries.
 *
 * Applications may override the defaults using the {@link config}
 * function during initialization.
 *
 * @public
 */
export type ConfigParams = {

    /**
     * Protocol used when building the default SSO URL.
     */
    ssoProtocol?: 'http' | 'https';

    /**
     * Hostname or IP address of the SSO server.
     */
    ssoAddress?: string;

    /**
     * Port used by the SSO service.
     */
    ssoPort?: number | null | undefined;

    /**
     * Fully qualified base URL of the SSO server.
     *
     * If provided, this value overrides `ssoProtocol`, `ssoAddress`
     * and `ssoPort` when constructing the final URL.
     */
    ssoUrl?: string;

    /** Endpoint used for user registration. */
    ssoRegisterEndpoint?: string;

    /** Endpoint used for user authentication. */
    ssoLoginEndpoint?: string;

    /** Endpoint used to validate authentication tokens. */
    ssoAuthEndpoint?: string;

    /** Endpoint used to refresh authentication tokens. */
    ssoRefreshTokenEndpoint?: string;

    /** Base endpoint used to access SSO records. */
    ssoRecordsEndpoint?: string;

    /** Endpoint used to retrieve registered systems. */
    ssoSystemsEndpoint?: string;

    /** Endpoint used to retrieve access profiles. */
    ssoAccessProfilesEndpoint?: string;

    /** Endpoint used to manage agent, access profile and system relationships. */
    ssoAgentsXAccessProfilesXSystemsEndpoint?: string;

    /** Endpoint used to retrieve resource definitions. */
    ssoResourcesEndpoint?: string;

    /** Endpoint used to retrieve resource permissions. */
    ssoResourcePermissionsEndpoint?: string;

    /** Endpoint used to retrieve allowed resources for the current agent. */
    ssoGetAllowedsResourcesEndpoint?: string;

    /** Endpoint used to retrieve permissions for a specific resource. */
    ssoGetResourcePermissionsEndpoint?: string;

    /**
     * Identifier of the current system in the SSO environment.
     */
    ssoThisSystemId?: number | null | undefined;

    /**
     * Resource type identifier representing a screen resource.
     */
    ssoResourcetypeScreenId?: number;

    /**
     * Determines whether resources should be rendered as popup routes
     * instead of nested routes.
     */
    showResourceAsPopup?: boolean;
};

/**
 * Internal configuration object used by the library.
 *
 * @remarks
 * These values represent the default configuration and may be
 * overridden by calling {@link config}.
 */
let configs: ConfigParams = {
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
export function config(params?: ConfigParams) {

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
export function getConfigs(): ConfigParams {

    let result: ConfigParams = { ...configs } as const;

    Object.freeze(result);

    return result; // avoid external mutation
}
