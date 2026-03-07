import { DefaultDataSwap, hasValue, typeOf } from '@aalencarv/common-utils';
import { authOnSso } from './helpers/auth/AuthenticationHelper.js';
import { getData, getOrCreate, patchData, putData } from '@sysnormal/js-request-utils';

//reexports to public
export { authOnSso, refreshToken, checkTokenIsExpired } from './helpers/auth/AuthenticationHelper.js';



var SSO_URL: string | undefined;
var REFRESH_TOKEN_ENDPOINT: string | undefined;
var LAST_TOKEN: string | undefined;
var LAST_REFRESH_TOKEN: string | undefined;
var RECORDS_ENDPOINT: string | undefined;

export type AuthorizationParams = {
	token?: string;
	refreshToken?: string;
	refreshTokenUrl?: string;
	changedAuthorization?: (params: AuthorizationParams)=>void
}

function changedAuthorization(changedParams: AuthorizationParams) {
	LAST_TOKEN = changedParams.token;
	LAST_REFRESH_TOKEN = changedParams.refreshToken;
} 

function getDefaultAuthorizationParams(): AuthorizationParams {
	return {
		token: LAST_TOKEN,
		refreshToken: LAST_REFRESH_TOKEN,
		refreshTokenUrl: `${SSO_URL}${REFRESH_TOKEN_ENDPOINT}`,
		changedAuthorization: changedAuthorization  
	}
}

async function upsertResourcesAndPermissions(params: {	
	url: string,
	endpoint?: string;
	getEndpoint?: string;
	patchEndpoint?: string;
	putEndpoint?: string;
    system: any, 
    accessProfile: any,
    agent: any,
    defaultResourceTypeId?: number;
    resources?: any, 
    parentResource?: any
}): Promise<DefaultDataSwap> {
    let result: DefaultDataSwap = new DefaultDataSwap();
    try {
		params.endpoint = params.endpoint || `${RECORDS_ENDPOINT}/resources`;
		params.getEndpoint = params.getEndpoint || `${params.endpoint}${params.endpoint?.lastIndexOf('/get') === (params.endpoint||'').length - 4 ? '' : '/get'}`;
		params.patchEndpoint = params.patchEndpoint || params.endpoint;
		params.putEndpoint = params.putEndpoint || params.endpoint;
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
				url: `${params.url}${params.getEndpoint}`,
				queryParams: {
					where: {
						systemId: resource.systemId,
						parentId: resource.parentId,
						resourceTypeId: resource.resourceTypeId,
						name: resource.name
					}
				},
				authParams: getDefaultAuthorizationParams()
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
						url: `${params.url}${params.patchEndpoint}/${resource.id}`, 
						data: resource,
						authParams: getDefaultAuthorizationParams()
					}); 
                }            
            } else {
				result = await putData({
					url: `${params.url}${params.putEndpoint}`, 
					data: resource,
					authParams: getDefaultAuthorizationParams()
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
						url: params.url,
                        endpoint: `${RECORDS_ENDPOINT}/resource_permissions`,
                        where: {
                            resourceId: resource.id,
                            accessProfileId: params.accessProfile.id,
                            agentId: params.agent.id
                        },
                        data: {
                            resourceId: resource.id,
                            accessProfileId: params.accessProfile.id,
                            agentId: params.agent.id,
                            allowedAccess: 1,
                            allowedView: 1,
                            allowedCreate: 1,
                            allowedChange: 1,
                            allowedDelete: 1
                        },
						authParams: getDefaultAuthorizationParams()
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
	ssoUrl: string;
	ssoLoginEndpoint?: string;
	ssoRegisterEndpoint?: string;
	ssoRefreshTokenEndpoint?: string;
	ssoRecordsEndpoint?: string;
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
	resources?: any
}): Promise<void> {    
    //logi('ssoRegister');
    try {        
		params.ssoLoginEndpoint = params.ssoLoginEndpoint || "/auth/login";
		params.ssoRegisterEndpoint = params.ssoRegisterEndpoint || "/auth/register";
		params.ssoRefreshTokenEndpoint = params.ssoRefreshTokenEndpoint || "/auth/refresh_token";
		params.ssoRecordsEndpoint = params.ssoRecordsEndpoint || "/records";
		REFRESH_TOKEN_ENDPOINT = params.ssoRefreshTokenEndpoint;
		RECORDS_ENDPOINT = params.ssoRecordsEndpoint;

        //login or register with system (system agent)
        console.log("antes1");
        let agentResponseJson: DefaultDataSwap = await authOnSso({
			url: `${params.ssoUrl}${params.ssoLoginEndpoint}`,
			identifierTypeId: params.ssoAgent.identifierTypeId,
			identifier: params.ssoAgent.identifier,
			password: params.ssoAgent.password
		}); 
        console.log("xxxx",agentResponseJson);   
        if (!agentResponseJson.success && (agentResponseJson.message || '').indexOf("not found") > -1) {
            agentResponseJson = await authOnSso({
				url: `${params.ssoUrl}${params.ssoRegisterEndpoint}`,
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
				url: params.ssoUrl,
                endpoint: `${params.ssoRecordsEndpoint}/systems`,
                data: system,
				authParams: getDefaultAuthorizationParams()
            })
            if (systemResponseJson.success && hasValue(systemResponseJson.data)) {
                system = systemResponseJson.data[0] || systemResponseJson.data;

                //get or create access profile
                let accessProfile: any = {
                    name: "SYSTEM"
                };
                let accessProfileResponseJson: DefaultDataSwap = await getOrCreate({
					url: params.ssoUrl,
                    endpoint: `${params.ssoRecordsEndpoint}/access_profiles`,
                    data: accessProfile,
					authParams: getDefaultAuthorizationParams()
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
						url: params.ssoUrl,
                        endpoint: `${params.ssoRecordsEndpoint}/agents_x_access_profiles_x_systems`,
                        data: agentXAccessProfileXSystem,
						authParams: getDefaultAuthorizationParams()
                    });
                    if (agentXAccessProfileXSystemResponseJson.success) {
                        agentXAccessProfileXSystem = agentXAccessProfileXSystemResponseJson.data[0] || agentXAccessProfileXSystemResponseJson.data;

                        //upsert resources
                        const resourcesResult = await upsertResourcesAndPermissions({
							url: params.ssoUrl,
                            system,
                            accessProfile,
                            agent,
                            defaultResourceTypeId: params.defaultResourceTypeId,
                            resources: params.resources
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