import { DefaultDataSwap, hasValue, typeOf } from '@aalencarv/common-utils';
import { authOnSso, AuthorizationParams } from './helpers/auth/AuthenticationHelper.js';
import { ConfigParams, getConfigs } from './Config.js';
import { getData, getOrCreate, patchData, putData } from './helpers/request/RequestHelper.js';





//reexports to public
export { ConfigParams, config, getConfigs } from './Config.js';
export { getSsoUrl } from './helpers/CommonHelper.js';
export { SsoAuthParams, AuthorizationParams, authOnSso, refreshToken, checkTokenIsExpired } from './helpers/auth/AuthenticationHelper.js';
export { ResourcePermissionData } from './helpers/CommonHelper.js';
export { getAgentAllowedResources, getResourcePermission } from './helpers/resources/ResourcesHelper.js';
export { FetchParams, secureFetch, defaultAuthenticatedFetch, getData, putData, patchData, getOrCreate } from './helpers/request/RequestHelper.js';


var LAST_TOKEN: string | undefined;
var LAST_REFRESH_TOKEN: string | undefined;



function changedAuthorization(changedParams: AuthorizationParams) {
	LAST_TOKEN = changedParams.token;
	LAST_REFRESH_TOKEN = changedParams.refreshToken;    
} 

function getDefaultAuthorizationParams(): AuthorizationParams {
    const configs: ConfigParams = getConfigs();
    
	return {
		token: LAST_TOKEN,
		refreshToken: LAST_REFRESH_TOKEN,
		refreshTokenUrl: `${configs.ssoUrl}${configs.ssoRefreshTokenEndpoint}`,
		changedAuthorization: changedAuthorization
	}
}

async function upsertResourcesAndPermissions(params: {	
    system: any;
    accessProfile: any;
    agent: any;
    defaultResourceTypeId?: number;
    resources?: any;
    parentResource?: any;
    systemPermissionsIsOnlySystemAgent?: boolean;
}): Promise<DefaultDataSwap> {
    let result: DefaultDataSwap = new DefaultDataSwap();
    try {
        const configs: ConfigParams = getConfigs();
        if (typeOf(params.resources) === 'array') {
            for(let k in params.resources) {
                result = await upsertResourcesAndPermissions({
					...params,
					resources: params.resources[k], 
				});
            }
        } else {
            let resource = {
                ...params.resources, 
                systemId: params.system.id, 
                resourceTypeId: params.resources.resourceTypeId || params.defaultResourceTypeId,// || 10, //ResourceType.URL_ID
                parentId: null
            };
            resource.children = undefined;
            delete resource.children;
            resource.id = undefined;
            delete resource.id;        
            if (hasValue(params.parentResource)) {
                resource.parentId = params.parentResource.id;
            }
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
                
            if (result.success && hasValue(result.data)) {
                let foundedResource = result.data[0] || result.data;
                if (resource.resourcePath != foundedResource.resourcePath
                    || resource.icon != foundedResource.icon
                    || (
                        hasValue(resource.numericOrder) && resource.numericOrder != foundedResource.numericOrder
                        
                    ) || (
                        hasValue(resource.showInMenu) && resource.showInMenu != foundedResource.showInMenu
                        
                    ) 
                ) {
                    foundedResource.resourcePath = resource.resourcePath
                    foundedResource.icon = resource.icon
                    foundedResource.numericOrder = resource.numericOrder
                    foundedResource.showInMenu = resource.showInMenu
					result = await patchData({
						url: `${configs.ssoUrl}${configs.ssoResourcesEndpoint}/${resource.id}`, 
						data: resource,
						authContextGetter: getDefaultAuthorizationParams
					}); 
                }            
            } else {
				result = await putData({
					url: `${configs.ssoUrl}${configs.ssoResourcesEndpoint}`, 
					data: resource,
					authContextGetter: getDefaultAuthorizationParams
				}); 
            }
            if (result.success) {
                resource = result.data[0] || result.data;

                if (hasValue(params.resources.children)) {
                    result = await upsertResourcesAndPermissions({
                        ...params,
                        resources: params.resources.children, 
                        parentResource: resource
					});
                }
                
                if (result.success) {
                    result = await getOrCreate({
						url: configs.ssoUrl || '',
                        endpoint: configs.ssoResourcePermissionsEndpoint||'',
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
    } catch (e) {
        console.error(e);
        result.setException(e);
    } 
    return result;
}   


export async function ssoRegister(params: {
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
	resources?: any,
    systemPermissionsIsOnlySystemAgent?: boolean;
}): Promise<void> {    
    //logi('ssoRegister');
    try {        

        //login or register with system (system agent)
        const configs: ConfigParams = getConfigs();
        let agentResponseJson: DefaultDataSwap = await authOnSso({
			url: `${configs.ssoUrl}${configs.ssoLoginEndpoint}`,
			identifierTypeId: params.ssoAgent.identifierTypeId,
			identifier: params.ssoAgent.identifier,
			password: params.ssoAgent.password
		}); 
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
            LAST_TOKEN = agentResponseJson.data.token;
            LAST_REFRESH_TOKEN = agentResponseJson.data.refreshToken;

            //get or register this system
            let system: any = {
                systemPlatformId: params.ssoSystem.systemPlatformId,
                systemSideId: params.ssoSystem.systemSideId,
                name: params.ssoSystem.name
            };
            let systemResponseJson: DefaultDataSwap = await getOrCreate({
				url: configs.ssoUrl || '',
                endpoint: configs.ssoSystemsEndpoint || '',
                data: system,
				authContextGetter: getDefaultAuthorizationParams
            })
            if (systemResponseJson.success && hasValue(systemResponseJson.data)) {
                system = systemResponseJson.data[0] || systemResponseJson.data;

                //get or create access profile
                let accessProfile: any = {
                    name: "SYSTEM"
                };
                let accessProfileResponseJson: DefaultDataSwap = await getOrCreate({
					url: configs.ssoUrl || '',
                    endpoint: configs.ssoAccessProfilesEndpoint || '',
                    data: accessProfile,
					authContextGetter: getDefaultAuthorizationParams
                });
                if (accessProfileResponseJson.success) {
                    accessProfile = accessProfileResponseJson.data[0] || accessProfileResponseJson.data;

                    //get or create agent x access profile x system
                    let agentXAccessProfileXSystem: any = {
                        agentId: agent.id,
                        accessProfileId: accessProfile.id,
                        systemId: system.id
                    };
                    let agentXAccessProfileXSystemResponseJson: DefaultDataSwap = await getOrCreate({
						url: configs.ssoUrl || '',
                        endpoint: configs.ssoAgentsXAccessProfilesXSystemsEndpoint || '',
                        data: agentXAccessProfileXSystem,
						authContextGetter: getDefaultAuthorizationParams
                    });
                    if (agentXAccessProfileXSystemResponseJson.success) {
                        agentXAccessProfileXSystem = agentXAccessProfileXSystemResponseJson.data[0] || agentXAccessProfileXSystemResponseJson.data;

                        //upsert resources
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

                        
                        

                        //continuar aqui, inserir o configuration do Home, contendo o dropdow do mes inserido no customizedreport e carregalo no home para ver como fica e tratar o setamento do estado dele para o estado global da pagina para poder ser acessado por outros componentes
                    } else {
                        console.error(agentXAccessProfileXSystemResponseJson);
                    }                                
                } else {
                    console.error(accessProfileResponseJson);
                }                

            } else {
                console.error(systemResponseJson);
            }
        } else {
            console.error(agentResponseJson);
        }
    } catch (e) {
        console.error(e);
    } 
    //logf('ssoRegister');
}