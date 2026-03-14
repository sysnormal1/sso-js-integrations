import { DefaultDataSwap, firstValid, flatToNestedArray, hasValue } from "@aalencarv/common-utils";
import { getSsoUrl, ResourcePermissionData } from '../CommonHelper.js';
import { ConfigParams, getConfigs } from "../../Config.js";
import { AuthorizationParams } from "../auth/AuthenticationHelper.js";
import { secureFetch } from "../request/RequestHelper.js";

/**
 * Parameters used to retrieve the list of resources that the current agent
 * is allowed to access.
 *
 * @remarks
 * These parameters allow overriding the default SSO configuration and
 * controlling which system resources should be retrieved.
 *
 * @see {@link AuthorizationParams}
 * @see {@link ConfigParams}
 */
export type GetAgentAllowedResourcesParams = {

  /**
   * Optional base URL of the SSO service.
   */
  ssoUrl?: string;

  /**
   * Optional endpoint path used to retrieve allowed resources.
   */
  ssoEndpoint?: string;

  /**
   * Identifier of the system whose resources should be resolved.
   */
  ssoSystemId?: number;

  /**
   * Getter used to retrieve the current authorization context.
   *
   * Implemented as a function to avoid stale closures when
   * authentication tokens change.
   *
   * @see {@link AuthorizationParams}
   */
  authContextGetter?: () => AuthorizationParams
}

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
export async function getAgentAllowedResources(
  params?: GetAgentAllowedResourcesParams | string | undefined | null
): Promise<DefaultDataSwap<ResourcePermissionData[]>> {

  let result: DefaultDataSwap<ResourcePermissionData[]> = new DefaultDataSwap<ResourcePermissionData[]>();

  try {

    const isString = typeof params === 'string';
    const configs: ConfigParams = getConfigs();

    const url =
      getSsoUrl({
        ...(isString ? {} : params || {}),
        ssoEndpoint: configs.ssoGetAllowedsResourcesEndpoint
      }) || '';

    const body: any = {
      queryParams: {
        systemId: !isString
          ? params?.ssoSystemId || configs.ssoThisSystemId
          : configs.ssoThisSystemId,
        allowedAccess: 1
      }
    }

    body.token = !isString
      ? (typeof params?.authContextGetter === "function"
        ? params.authContextGetter().token || body.token
        : body.token)
      : body.token;

    result = await secureFetch({
      url: url,
      reqParams: {
        method: "POST",
        body: body
      },
      authContextGetter: !isString ? params?.authContextGetter : undefined
    });

    if (result?.success) {
      result.data = flatToNestedArray(result?.data || [], 'resourceId', 'resourceParentId');
    }

  } catch (e) {
    result.setException(e);
  }

  return result;
};


/**
 * Parameters used to retrieve the permissions associated with a specific resource.
 *
 * @remarks
 * These parameters allow filtering the permission query by system,
 * access profile, resource type or resource path.
 *
 * @see {@link AuthorizationParams}
 */
export type GetResourcePermissionParams = {

  /**
   * Path of the resource whose permissions should be resolved.
   */
  resourcePath?: string;

  /**
   * Identifier of the system where the resource belongs.
   */
  systemId?: number;

  /**
   * Identifier of the access profile used for the permission check.
   */
  accessProfileId?: number;

  /**
   * Identifier of the resource type.
   */
  resourceTypeId?: number;

  /**
   * Getter used to obtain the current authorization context.
   *
   * @see {@link AuthorizationParams}
   */
  authContextGetter?: () => AuthorizationParams;
}

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
export async function getResourcePermission(
  params: GetResourcePermissionParams
): Promise<DefaultDataSwap<ResourcePermissionData[]>> {

  let result: DefaultDataSwap<ResourcePermissionData[]> = new DefaultDataSwap<ResourcePermissionData[]>();

  try {

    const configs: ConfigParams = getConfigs();
    const url = getSsoUrl(configs.ssoGetResourcePermissionsEndpoint) || '';

    const queryParams: any = {};

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

  } catch (e) {
    result.setException(e);
  }

  return result;
}
