import { DefaultDataSwap } from "@aalencarv/common-utils";
import { getSsoUrl } from "../CommonHelper.js";
import { ConfigParams, getConfigs } from "../../Config.js";

export type AuthorizationParams = {
	token?: string;
	refreshToken?: string;
	refreshTokenUrl?: string;
	changedAuthorization?: (changed: AuthorizationParams)=>void
}

export type SsoAuthParams = {
    identifierTypeId?: number,
    identifier: string | number,
    password: string | number,
    url?: string, 
    endpoint?: string
}

export async function authOnSso(params: SsoAuthParams): Promise<DefaultDataSwap> {
    let result = new DefaultDataSwap();
    try {
        const configs: ConfigParams = getConfigs();
        const url = getSsoUrl({...params, ssoUrl: params.url || configs.ssoUrl, ssoEndpoint: params.endpoint || configs.ssoAuthEndpoint})
        console.debug('requesting auth sso',url);
        let response = await fetch(url||'',{
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },  
            body: JSON.stringify({
                identifierTypeId: params.identifierTypeId,
                identifier: params.identifier,
                password : params.password
            })
        });
        
        result = await response.json();
                    
    } catch (e) {
        result.setException(e);
    }
    return result;
}

export async function refreshToken(params: {
    url?: string,
    endpoint?: string,
    token: string, 
    refreshToken: string
}) : Promise<DefaultDataSwap> {
    let result: DefaultDataSwap = new DefaultDataSwap();
    try {
        const configs: ConfigParams = getConfigs();
        const url = getSsoUrl({...params, ssoUrl: params.url || configs.ssoUrl, ssoEndpoint: params.endpoint || configs.ssoRefreshTokenEndpoint})
        console.debug("refreshing token",url,params);
        let resultRequest = await fetch(url || '',{
            method: "POST",
            headers:{
                Accept: "application/json",
                "Content-Type": "application/json",
                'Authorization': `Bearer ${params.token}`
            },
            body: JSON.stringify({
                refreshToken: params.refreshToken
            })
        });
        result = await resultRequest.json();
    } catch (e) {
        console.error(e);
        result.setException(e);
    }
    return result;
}

export function checkTokenIsExpired(resultJson?: any) : boolean {
    let result = false;
    
    try {            
        if (!resultJson?.success) {  
            let message = resultJson.message || resultJson.toString();              
            if ((message || '').trim().toLowerCase().indexOf("expired") > -1 || (message || '').trim().toLowerCase().indexOf("invalid signature") > -1) 
                result = true;
        } 
    } catch (e) {
        console.error(e);            
    }
    return result;
}

