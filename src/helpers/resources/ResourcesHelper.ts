import { DefaultDataSwap, firstValid, flatToNestedArray, hasValue } from "@aalencarv/common-utils";
import { getSsoUrl, ResourcePermissionData } from '../CommonHelper.js';
import { ConfigParams, getConfigs } from "../../Config.js";
import { jwtDecode } from "jwt-decode";
import { AuthorizationParams } from "../auth/AuthenticationHelper.js";
import { secureFetch } from "../request/RequestHelper.js";



/**
 * get allowed resources based agent token passed in params
 * @param params 
 * @returns object containing resources, nesteds if nested (parentId) on database table
 * @created 2026-03-10
 * @version 1.0.0
 */
export async function getAgentAllowedResources(
  params?: {
    ssoUrl?: string;
    ssoEndpoint?: string;
    ssoSystemId?: number;
    authContextGetter?: ()=>AuthorizationParams
  } | string | undefined | null
): Promise<DefaultDataSwap<ResourcePermissionData[]>> {   
    let result: DefaultDataSwap<ResourcePermissionData[]> = new DefaultDataSwap<ResourcePermissionData[]>();
    try {             
      const isString = typeof params === 'string';
      const configs: ConfigParams = getConfigs();
      const url = getSsoUrl({...(isString ? {} : params||{}), ssoEndpoint: configs.ssoGetAllowedsResourcesEndpoint}) || '';

      const body: any = {
        queryParams:{
          systemId: !isString ? params?.ssoSystemId || configs.ssoThisSystemId : configs.ssoThisSystemId,
          allowedAccess: 1
        }
      }

      /*if (!isString && typeof params?.authParamsGetter === "function" && typeof params.authParamsGetter().changedAuthorization === "function") {

        const previous = params.authParamsGetter().changedAuthorization;
        params.authParamsGetter().changedAuthorization = (changedParams: AuthorizationParams) => {
          if (typeof previous === "function") {
            previous(changedParams);
          }
          body.token = changedParams.token;
        }

      }*/
      body.token = !isString ? (typeof params?.authContextGetter === "function" ? params.authContextGetter().token || body.token : body.token) : body.token;

      result = await secureFetch({
        url: url,
        reqParams: {
          method:"POST",
          body: body
        },
        authContextGetter: !isString ? params?.authContextGetter : undefined
      });
      
      if (result?.success) {
        result.data = flatToNestedArray(result?.data||[], 'resourceId', 'resourceParentId');
      }            
    } catch (e) {
      result.setException(e);
    }      
    return result;
  };


  export async function getResourcePermission(params: {
      resourcePath?: string;
      systemId?: number;
      accessProfileId?: number;
      resourceTypeId?: number;
      authContextGetter?: ()=>AuthorizationParams;
  }): Promise<DefaultDataSwap<ResourcePermissionData[]>>{
    let result: DefaultDataSwap<ResourcePermissionData[]> = new DefaultDataSwap<ResourcePermissionData[]>();
    try {        
      const configs: ConfigParams = getConfigs();
      const url = getSsoUrl(configs.ssoGetResourcePermissionsEndpoint) || '';

      const queryParams: any = {};
      if (hasValue(firstValid([params.systemId,configs.ssoThisSystemId]))) queryParams.systemId = firstValid([params.systemId,configs.ssoThisSystemId]);      
      if (hasValue(params.accessProfileId)) queryParams.accessProfileId = params.accessProfileId;
      if (hasValue(params.resourceTypeId)) queryParams.resourceTypeId = params.resourceTypeId;
      if (hasValue(params.resourcePath)) queryParams.resourcePaths = [params.resourcePath];

      result = await secureFetch({
        url: url,        
        reqParams: {
          method:"POST",
          body:{
            queryParams: queryParams
          }
        },
        authContextGetter: params.authContextGetter
      });                     
    } catch(e) {
      result.setException(e);
    }        
    return result;
  }