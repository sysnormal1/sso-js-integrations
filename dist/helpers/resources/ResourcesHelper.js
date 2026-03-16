import { DefaultDataSwap, firstValid, flatToNestedArray, hasValue } from "@aalencarv/common-utils";
import { getSsoUrl } from '../CommonHelper.js';
import { getConfigs } from "../../Config.js";
import { secureFetch } from "../request/RequestHelper.js";
/**
 * Retrieves the list of resources that the current agent is allowed to access.
 *
 * @remarks
 * This function queries the SSO backend to obtain the resource tree
 * associated with the authenticated agent. The returned data represents
 * the resources the user is allowed to access based on their permissions.
 *
 * The result is automatically converted from a flat array to a hierarchical
 * structure using `flatToNestedArray`.
 *
 * @param params Optional request parameters or a string representing
 * the endpoint path.
 *
 * @returns A {@link DefaultDataSwap} containing the allowed resources.
 *
 * @example
 * ```ts
 * const resources = await getAgentAllowedResources({
 *   authContextGetter: () => authContext
 * })
 * ```
 *
 * @see {@link ResourcePermissionData}
 * @see {@link DefaultDataSwap}
 * @see {@link getSsoUrl}
 */
export async function getAgentAllowedResources(params) {
    let result = new DefaultDataSwap();
    try {
        const isString = typeof params === 'string';
        const configs = getConfigs();
        const url = getSsoUrl({
            ...(isString ? {} : params || {}),
            ssoEndpoint: configs.ssoGetAllowedsResourcesEndpoint
        }) || '';
        const body = {
            queryParams: {
                systemId: !isString
                    ? params?.ssoSystemId || configs.ssoThisSystemId
                    : configs.ssoThisSystemId,
                allowedAccess: 1
            }
        };
        const authContextGetter = !isString ? params?.authContextGetter || getConfigs().authContextGetter : getConfigs().authContextGetter;
        body.token = !isString
            ? (typeof authContextGetter === "function"
                ? authContextGetter().token || body.token
                : body.token)
            : body.token;
        result = await secureFetch({
            url: url,
            reqParams: {
                method: "POST",
                body: body
            },
            authContextGetter: authContextGetter
        });
        if (result?.success) {
            result.data = flatToNestedArray(result?.data || [], 'resourceId', 'resourceParentId');
        }
    }
    catch (e) {
        result.setException(e);
    }
    return result;
}
;
/**
 * Retrieves permission information for a specific resource.
 *
 * @remarks
 * This function queries the SSO backend to determine whether the
 * current agent has permission to access a particular resource.
 *
 * The returned data contains the permission attributes such as:
 *
 * - access permission
 * - view permission
 * - create permission
 * - update permission
 * - delete permission
 *
 * @param params Parameters used to resolve the resource permission.
 *
 * @returns A {@link DefaultDataSwap} containing the permission data.
 *
 * @example
 * ```ts
 * const permission = await getResourcePermission({
 *   resourcePath: "/dashboard",
 *   authContextGetter: () => authContext
 * })
 * ```
 *
 * @see {@link ResourcePermissionData}
 * @see {@link DefaultDataSwap}
 * @see {@link getConfigs}
 */
export async function getResourcePermission(params) {
    let result = new DefaultDataSwap();
    try {
        const configs = getConfigs();
        const url = getSsoUrl(configs.ssoGetResourcePermissionsEndpoint) || '';
        const queryParams = {};
        if (hasValue(firstValid([params.systemId, configs.ssoThisSystemId])))
            queryParams.systemId = firstValid([params.systemId, configs.ssoThisSystemId]);
        if (hasValue(params.accessProfileId))
            queryParams.accessProfileId = params.accessProfileId;
        if (hasValue(params.resourceTypeId))
            queryParams.resourceTypeId = params.resourceTypeId;
        if (hasValue(params.resourcePath))
            queryParams.resourcePaths = [params.resourcePath];
        result = await secureFetch({
            url: url,
            reqParams: {
                method: "POST",
                body: {
                    queryParams: queryParams
                }
            },
            authContextGetter: params.authContextGetter
        });
    }
    catch (e) {
        result.setException(e);
    }
    return result;
}
