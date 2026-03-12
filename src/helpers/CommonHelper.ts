import { hasValue } from "@aalencarv/common-utils";
import { getConfigs } from "../Config.js";

/**
 * this type reflect ResourcePermissionView java class of sso-starter
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

    //no ResourcePermissionView java class properties
    target?: string;
}

export function getSsoUrl(params?: any): string | null {
    let result: string | null = null;
    if (hasValue(params?.ssoUrl)) {
        result = params.ssoUrl;
        if (hasValue(params?.ssoEndpoint)) {
            if ((result || '').indexOf(params.ssoEndpoint) <= -1) {
                if ((result||'').replace("//","").indexOf('/') <= -1) {
                    result += params.ssoEndpoint;
                }
            }
        }
    } else {
        result = getConfigs().ssoUrl || '';
        if (hasValue(params?.ssoEndpoint)) {
            result += params.ssoEndpoint;
        } else if (typeof params === 'string' && hasValue(params)) {
            result += params;
        }
    }
    return result;
}