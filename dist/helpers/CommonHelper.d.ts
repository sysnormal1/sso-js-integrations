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
    target?: string;
};
export declare function getSsoUrl(params?: any): string | null;
