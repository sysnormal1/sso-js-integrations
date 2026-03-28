import { DefaultDataSwap, hasValue, typeOf } from '@aalencarv/common-utils';
import { authOnSso } from './helpers/auth/AuthenticationHelper.js';
import { getConfigs } from './Config.js';
import { getData, getOrCreate, patchData, putData } from './helpers/request/RequestHelper.js';
import validator from 'validator';
//reexports to public
export { config, getConfigs } from './Config.js';
export { getSsoUrl } from './helpers/CommonHelper.js';
export { authOnSso, refreshToken, checkTokenIsExpired } from './helpers/auth/AuthenticationHelper.js';
export { getAgentAllowedResources, getResourcePermission } from './helpers/resources/ResourcesHelper.js';
export { secureFetch, defaultAuthenticatedFetch, getData, putData, patchData, getOrCreate } from './helpers/request/RequestHelper.js';
// Stores the last authentication token obtained from the SSO server.
// This token is reused by helper functions that perform authenticated requests.
var LAST_TOKEN;
// Stores the last refresh token obtained from the SSO server.
// Used when the access token expires and needs to be refreshed.
var LAST_REFRESH_TOKEN;
/**
 * Updates the current authorization context used by the library.
 *
 * This function is typically invoked after a successful token refresh
 * operation. It stores the new access token and refresh token so that
 * subsequent authenticated requests automatically use the updated values.
 *
 * @param changedParams - The new authorization parameters returned by the SSO server.
 *
 * @remarks
 * The values stored here are used by {@link getDefaultAuthorizationParams}
 * to provide tokens for authenticated requests.
 */
function changedAuthorization(changedParams) {
    // Update the globally stored access token
    LAST_TOKEN = changedParams.token;
    // Update the globally stored refresh token
    LAST_REFRESH_TOKEN = changedParams.refreshToken;
}
/**
 * Returns the default authorization context used by authenticated requests.
 *
 * This function centralizes the retrieval of the current access token,
 * refresh token and refresh endpoint used by the SSO integration.
 *
 * @returns The current {@link AuthorizationParams} used for authenticated requests.
 *
 * @remarks
 * The returned object includes a {@link changedAuthorization} callback which
 * allows the request helper layer to update the stored tokens when a refresh
 * operation succeeds.
 *
 * @see secureFetch
 * @see refreshToken
 */
function getDefaultAuthorizationParams() {
    // Retrieve current library configuration
    const configs = getConfigs();
    return {
        // Current access token
        token: LAST_TOKEN,
        // Current refresh token
        refreshToken: LAST_REFRESH_TOKEN,
        // Endpoint used to refresh expired tokens
        refreshTokenUrl: `${configs.ssoUrl}${configs.ssoRefreshTokenEndpoint}`,
        // Callback invoked when tokens change
        changedAuthorization: changedAuthorization
    };
}
/**
 * Inserts or updates resources and permissions in the SSO system.
 *
 * This function performs a recursive synchronization of application
 * resources with the SSO server. It ensures that resources exist,
 * are updated when necessary, and that the appropriate permissions
 * are assigned to the specified access profile.
 *
 * @param params - Resource synchronization parameters.
 *
 * @param params.system
 * The system registered in the SSO environment.
 *
 * @param params.accessProfile
 * The access profile associated with the system.
 *
 * @param params.agent
 * The agent responsible for the system registration.
 *
 * @param params.defaultResourceTypeId
 * Optional fallback resource type identifier used when a resource
 * does not explicitly define one.
 *
 * @param params.resources
 * Resource definition or resource tree to be synchronized.
 *
 * @param params.parentResource
 * Optional parent resource used when processing nested resources.
 *
 * @param params.systemPermissionsIsOnlySystemAgent
 * Determines whether resource permissions should be associated
 * exclusively with the system agent.
 *
 * @returns A {@link DefaultDataSwap} containing the operation result.
 *
 * @remarks
 * The function supports both:
 *
 * - single resource objects
 * - arrays of resources
 * - hierarchical resource trees (via `children`)
 *
 * Each resource is processed as follows:
 *
 * 1. Check if the resource already exists
 * 2. Update it if any attribute changed
 * 3. Create it if it does not exist
 * 4. Ensure resource permissions are registered
 *
 * @see getOrCreate
 * @see getData
 * @see putData
 * @see patchData
 */
async function upsertResourcesAndPermissions(params) {
    // Default result wrapper
    let result = new DefaultDataSwap();
    try {
        // Retrieve current library configuration
        const configs = getConfigs();
        // If resources is an array, process each resource recursively
        if (typeOf(params.resources) === 'array') {
            for (let k in params.resources) {
                result = await upsertResourcesAndPermissions({
                    ...params,
                    resources: params.resources[k],
                });
            }
        }
        else {
            // Normalize resource structure before persisting
            let resource = {
                ...params.resources,
                systemId: params.system.id,
                resourceTypeId: params.resources.resourceTypeId || params.defaultResourceTypeId || 9, //sso ResourceType.ENDPOINT_ID
                parentId: null
            };
            // Remove children from persistence object
            resource.children = undefined;
            delete resource.children;
            // Ensure resource id is not accidentally reused
            resource.id = undefined;
            delete resource.id;
            // If there is a parent resource, link this resource to it
            if (hasValue(params.parentResource)) {
                resource.parentId = params.parentResource.id;
            }
            // Try to find an existing resource in SSO
            result = await getData({
                url: `${configs.ssoUrl}${configs.ssoResourcesEndpoint}/get`,
                queryParams: {
                    where: {
                        systemId: resource.systemId,
                        parentId: resource.parentId,
                        resourceTypeId: resource.resourceTypeId,
                        name: resource.name
                    }
                },
                authContextGetter: getDefaultAuthorizationParams
            });
            // If resource exists, check whether it needs to be updated
            if (result.success && hasValue(result.data)) {
                let foundedResource = result.data[0] || result.data;
                // Compare fields and update only if necessary
                if (resource.resourcePath != foundedResource.resourcePath
                    || resource.icon != foundedResource.icon
                    || (hasValue(resource.numericOrder) && resource.numericOrder != foundedResource.numericOrder) || (hasValue(resource.showInMenu) && resource.showInMenu != foundedResource.showInMenu)) {
                    // Update changed properties
                    foundedResource.resourcePath = resource.resourcePath;
                    foundedResource.icon = resource.icon;
                    foundedResource.numericOrder = resource.numericOrder;
                    foundedResource.showInMenu = resource.showInMenu;
                    // Persist updates
                    result = await patchData({
                        url: `${configs.ssoUrl}${configs.ssoResourcesEndpoint}/${resource.id}`,
                        data: resource,
                        authContextGetter: getDefaultAuthorizationParams
                    });
                }
            }
            else {
                // Resource does not exist → create it
                result = await putData({
                    url: `${configs.ssoUrl}${configs.ssoResourcesEndpoint}`,
                    data: resource,
                    authContextGetter: getDefaultAuthorizationParams
                });
            }
            // If creation/update succeeded, continue processing
            if (result.success) {
                resource = result.data[0] || result.data;
                // Process child resources recursively
                if (hasValue(params.resources.children)) {
                    result = await upsertResourcesAndPermissions({
                        ...params,
                        resources: params.resources.children,
                        parentResource: resource
                    });
                }
                // Ensure permission entry exists for the resource
                if (result.success) {
                    result = await getOrCreate({
                        url: configs.ssoUrl || '',
                        endpoint: configs.ssoResourcePermissionsEndpoint || '',
                        where: {
                            resourceId: resource.id,
                            accessProfileId: params.accessProfile.id,
                            agentId: params.systemPermissionsIsOnlySystemAgent ? params.agent.id : null
                        },
                        data: {
                            resourceId: resource.id,
                            accessProfileId: params.accessProfile.id,
                            agentId: params.systemPermissionsIsOnlySystemAgent ? params.agent.id : null,
                            allowedAccess: 1,
                            allowedView: 1,
                            allowedCreate: 1,
                            allowedChange: 1,
                            allowedDelete: 1
                        },
                        authContextGetter: getDefaultAuthorizationParams
                    });
                }
            }
        }
    }
    catch (e) {
        console.error(e);
        result.setException(e);
    }
    return result;
}
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
export async function ssoRegister(params) {
    try {
        // Step 1: login or register the system agent
        const configs = getConfigs();
        if (!hasValue(params.ssoAgent.identifierTypeId)) {
            params.ssoAgent.identifierTypeId = 1; //sso IdentifierTypes.IDENTIFIER_ID
            if (validator.isEmail(params.ssoAgent.identifier.toString())) {
                params.ssoAgent.identifierTypeId = 6; //sso IdentifierTypes.EMAIL_ID
            }
        }
        let agentResponseJson = await authOnSso({
            url: `${configs.ssoUrl}${configs.ssoLoginEndpoint}`,
            identifierTypeId: params.ssoAgent.identifierTypeId,
            identifier: params.ssoAgent.identifier,
            password: params.ssoAgent.password
        });
        // If agent does not exist, automatically register it
        if (!agentResponseJson.success && (agentResponseJson.message || '').indexOf("not found") > -1) {
            agentResponseJson = await authOnSso({
                url: `${configs.ssoUrl}${configs.ssoRegisterEndpoint}`,
                identifierTypeId: params.ssoAgent.identifierTypeId,
                identifier: params.ssoAgent.identifier,
                password: params.ssoAgent.password
            });
        }
        if (agentResponseJson.success) {
            const agent = agentResponseJson.data.agent;
            // Store tokens globally for authenticated requests
            LAST_TOKEN = agentResponseJson.data.token;
            LAST_REFRESH_TOKEN = agentResponseJson.data.refreshToken;
            // Step 2: register or retrieve the system
            if (!hasValue(params.ssoSystem.systemPlatformId)) {
                params.ssoSystem.systemPlatformId = 1; //sso SystemPlatforms.DESKTP_ID
                if (hasValue(params.ssoSystem.systemPlatform)) {
                    if (params.ssoSystem.systemPlatform.toLowerCase().trim() === "web") {
                        params.ssoSystem.systemPlatformId = 2; //sso SystemPlatforms.WEB_ID
                    }
                    else if (params.ssoSystem.systemPlatform.toLowerCase().trim() === "mobile"
                        || params.ssoSystem.systemPlatform.toLowerCase().trim() === "mob") {
                        params.ssoSystem.systemPlatformId = 3; //sso SystemPlatforms.MOBILE_ID
                    }
                }
            }
            if (!hasValue(params.ssoSystem.systemSideId)) {
                params.ssoSystem.systemSideId = 1; //sso SystemSides.SERVER_ID                
                if (hasValue(params.ssoSystem.systemSide)) {
                    if (params.ssoSystem.systemSide.toLowerCase().trim() === "client"
                        || params.ssoSystem.systemSide.toLowerCase().trim() === "front") {
                        params.ssoSystem.systemSideId = 2; //sso SystemSides.CLIENT_ID
                    }
                }
                else if (params.ssoSystem.systemPlatformId == 2 || params.ssoSystem.systemPlatformId == 3) {
                    params.ssoSystem.systemSideId = 2; //sso SystemSides.CLIENT_ID
                }
            }
            let system = {
                systemPlatformId: params.ssoSystem.systemPlatformId,
                systemSideId: params.ssoSystem.systemSideId,
                name: params.ssoSystem.name
            };
            let systemResponseJson = await getOrCreate({
                url: configs.ssoUrl || '',
                endpoint: configs.ssoSystemsEndpoint || '',
                data: system,
                authContextGetter: getDefaultAuthorizationParams
            });
            if (systemResponseJson.success && hasValue(systemResponseJson.data)) {
                system = systemResponseJson.data[0] || systemResponseJson.data;
                // Step 3: ensure access profile exists
                let accessProfile = {
                    name: "SYSTEM"
                };
                let accessProfileResponseJson = await getOrCreate({
                    url: configs.ssoUrl || '',
                    endpoint: configs.ssoAccessProfilesEndpoint || '',
                    data: accessProfile,
                    authContextGetter: getDefaultAuthorizationParams
                });
                if (accessProfileResponseJson.success) {
                    accessProfile = accessProfileResponseJson.data[0] || accessProfileResponseJson.data;
                    // Step 4: link agent, access profile and system
                    let agentXAccessProfileXSystem = {
                        agentId: agent.id,
                        accessProfileId: accessProfile.id,
                        systemId: system.id
                    };
                    let agentXAccessProfileXSystemResponseJson = await getOrCreate({
                        url: configs.ssoUrl || '',
                        endpoint: configs.ssoAgentsXAccessProfilesXSystemsEndpoint || '',
                        data: agentXAccessProfileXSystem,
                        authContextGetter: getDefaultAuthorizationParams
                    });
                    if (agentXAccessProfileXSystemResponseJson.success) {
                        agentXAccessProfileXSystem = agentXAccessProfileXSystemResponseJson.data[0] || agentXAccessProfileXSystemResponseJson.data;
                        // Step 5: insert or update resources and permissions
                        const resourcesResult = await upsertResourcesAndPermissions({
                            system,
                            accessProfile,
                            agent,
                            defaultResourceTypeId: params.defaultResourceTypeId,
                            resources: params.resources,
                            systemPermissionsIsOnlySystemAgent: params.systemPermissionsIsOnlySystemAgent
                        });
                        if (!resourcesResult.success) {
                            console.error(resourcesResult);
                        }
                        //@todo - 2026-03-16 - continuar aqui, inserir o configuration do Home, contendo o dropdow do mes inserido no customizedreport e carregalo no home para ver como fica e tratar o setamento do estado dele para o estado global da pagina para poder ser acessado por outros componentes
                    }
                    else {
                        console.error(agentXAccessProfileXSystemResponseJson);
                    }
                }
                else {
                    console.error(accessProfileResponseJson);
                }
            }
            else {
                console.error(systemResponseJson);
            }
        }
        else {
            console.error(agentResponseJson);
        }
    }
    catch (e) {
        console.error(e);
    }
}
