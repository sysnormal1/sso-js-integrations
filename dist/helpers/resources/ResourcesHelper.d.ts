import { DefaultDataSwap } from "@aalencarv/common-utils";
import { ResourcePermissionData } from '../CommonHelper.js';
import { AuthorizationParams } from "../auth/AuthenticationHelper.js";
/**
 * get allowed resources based agent token passed in params
 * @param params
 * @returns object containing resources, nesteds if nested (parentId) on database table
 * @created 2026-03-10
 * @version 1.0.0
 */
export declare function getAgentAllowedResources(params?: {
    ssoUrl?: string;
    ssoEndpoint?: string;
    ssoSystemId?: number;
    authContextGetter?: () => AuthorizationParams;
} | string | undefined | null): Promise<DefaultDataSwap<ResourcePermissionData[]>>;
export declare function getResourcePermission(params: {
    resourcePath?: string;
    systemId?: number;
    accessProfileId?: number;
    resourceTypeId?: number;
    authContextGetter?: () => AuthorizationParams;
}): Promise<DefaultDataSwap<ResourcePermissionData[]>>;
