export { ConfigParams, config, getConfigs } from './Config.js';
export { getSsoUrl } from './helpers/CommonHelper.js';
export { SsoAuthParams, AuthorizationParams, authOnSso, refreshToken, checkTokenIsExpired } from './helpers/auth/AuthenticationHelper.js';
export { ResourcePermissionData } from './helpers/CommonHelper.js';
export { getAgentAllowedResources, getResourcePermission } from './helpers/resources/ResourcesHelper.js';
export { FetchParams, secureFetch, defaultAuthenticatedFetch, getData, putData, patchData, getOrCreate } from './helpers/request/RequestHelper.js';
/**
 * Registers the current application in the SSO environment.
 *
 * This function performs an automatic bootstrap process that ensures
 * the system, agent, access profile, resources and permissions exist
 * in the SSO server.
 *
 * @param params - Registration parameters.
 *
 * @param params.ssoAgent
 * Credentials used to authenticate or register the system agent.
 *
 * @param params.ssoAgent.identifierTypeId
 * Identifier type used by the agent.
 *
 * @param params.ssoAgent.identifier
 * Unique identifier used for authentication.
 *
 * @param params.ssoAgent.password
 * Password used for authentication.
 *
 * @param params.ssoSystem
 * Information about the system being registered.
 *
 * @param params.ssoSystem.systemPlatformId
 * Identifier of the system platform.
 *
 * @param params.ssoSystem.systemSideId
 * Identifier representing the system side.
 *
 * @param params.ssoSystem.name
 * Name of the system.
 *
 * @param params.defaultResourceTypeId
 * Optional default resource type identifier applied to resources
 * that do not explicitly define one.
 *
 * @param params.resources
 * Resource structure to be registered in the SSO environment.
 *
 * @param params.systemPermissionsIsOnlySystemAgent
 * Determines whether generated permissions should be associated
 * only with the system agent.
 *
 * @returns A promise that resolves when the bootstrap process completes.
 *
 * @remarks
 * The bootstrap process performs the following operations:
 *
 * 1. Authenticate or register the system agent
 * 2. Retrieve or create the system
 * 3. Retrieve or create the default access profile
 * 4. Link agent, access profile and system
 * 5. Insert or update resources
 * 6. Ensure permissions exist for each resource
 *
 * This function is typically executed once during application startup.
 *
 * @example
 * ```ts
 * await ssoRegister({
 *   ssoAgent: {
 *     identifierTypeId: 1,
 *     identifier: "system-agent",
 *     password: "secret"
 *   },
 *   ssoSystem: {
 *     systemPlatformId: 1,
 *     systemSideId: 1,
 *     name: "My System"
 *   }
 * });
 * ```
 *
 * @see upsertResourcesAndPermissions
 * @see authOnSso
 * @see getOrCreate
 */
export declare function ssoRegister(params: {
    ssoAgent: {
        identifierTypeId: number;
        identifier: string | number;
        password: string | number;
    };
    ssoSystem: {
        systemPlatformId: number;
        systemSideId: number;
        name: string;
    };
    defaultResourceTypeId?: number;
    resources?: any;
    systemPermissionsIsOnlySystemAgent?: boolean;
}): Promise<void>;
