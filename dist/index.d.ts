export { ConfigParams, config, getConfigs } from './Config.js';
export { getSsoUrl } from './helpers/CommonHelper.js';
export { SsoAuthParams, AuthorizationParams, authOnSso, refreshToken, checkTokenIsExpired } from './helpers/auth/AuthenticationHelper.js';
export { ResourcePermissionData } from './helpers/CommonHelper.js';
export { getAgentAllowedResources, getResourcePermission } from './helpers/resources/ResourcesHelper.js';
export { FetchParams, secureFetch, defaultAuthenticatedFetch, getData, putData, patchData, getOrCreate } from './helpers/request/RequestHelper.js';
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
