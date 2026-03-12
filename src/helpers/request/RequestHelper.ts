import { DefaultDataSwap, hasValue, largeJsonParse } from "@aalencarv/common-utils";
import { AuthorizationParams, checkTokenIsExpired, refreshToken } from "../auth/AuthenticationHelper.js";




export type FetchParams = {
    url: string;
    authContextGetter?: ()=>AuthorizationParams;
	reqParams?: {
		method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
		headers?: {
			Accept?: string;
			['Content-Type']?: string;
			Authorization?: string;
		};
		body?: any;
	};
	useLargeJsonParser?: boolean;
	checkAndHandleExpiredToken?: (params: FetchParams) => Promise<DefaultDataSwap>;
	reqResponse?: Response;
	responseJson?: any;
}

export async function defaultAuthenticatedFetch(params: FetchParams): Promise<any> {
	let result = null;
	try {
		params = params || {};
		params.reqParams = params.reqParams || {};
		params.reqParams.method = params.reqParams.method || 'GET';
		params.reqParams.headers = params.reqParams.headers || {};
		params.reqParams.headers.Accept = params.reqParams.headers.Accept || 'application/json';
		params.reqParams.headers['Content-Type'] = params.reqParams.headers['Content-Type'] || 'application/json';
		params.reqParams.headers.Authorization = params.reqParams.headers.Authorization;
		if (!hasValue(params.reqParams.headers.Authorization)) {
			if (typeof params.authContextGetter === "function" && hasValue(params.authContextGetter().token)) {
				params.reqParams.headers.Authorization = `Bearer ${params.authContextGetter().token}`;
			} else {                
				params.reqParams.headers.Authorization = undefined;
				delete params.reqParams.headers.Authorization;
			}
		}
		if (params.reqParams.body && typeof params.reqParams.body != 'string') {
			params.reqParams.body = JSON.stringify(params.reqParams.body);
		}
		

		console.debug('requesting',params.url, 'with params',params.reqParams);
		params.reqResponse = await fetch(params.url,params.reqParams);

			// Obter o reader para ler a resposta em partes
		if (typeof params.reqResponse.body?.getReader == 'function' && params.useLargeJsonParser === true) {
			const reader = params.reqResponse.body.getReader();
			const decoder = new TextDecoder(); // Decodificador para transformar bytes em texto

			let stringBuffer = [];

			while (true) {
				const { done, value } = await reader.read();
				if (done) break; // Se não houver mais dados, sair do loop

				// Converte os bytes recebidos para texto
				stringBuffer.push(decoder.decode(value, { stream: true }));
			}

			const totalCharacters = stringBuffer.reduce((acc, str) => acc + str.length, 0);                
			if (totalCharacters >= 150000) { //~250MB  
				params.responseJson = largeJsonParse(stringBuffer);
			} else {
				params.responseJson = JSON.parse(stringBuffer.join(''));
			}
		} else {
			params.responseJson = await params.reqResponse.json();
		}

		if (typeof params.checkAndHandleExpiredToken === "function") {
			result = await params.checkAndHandleExpiredToken(params);
		} else {
			result = params.responseJson;
		}              
	} catch (e: any) {
		result = {success:false,message:e.message || e,exception: e};
	}
	return result;
}

export async function secureFetch(params: FetchParams) : Promise<DefaultDataSwap>{
    //logi('secureFetch');
    let result: DefaultDataSwap = new DefaultDataSwap();
    try {        
        //params = (params || {}) as FetchParams;
        if (!hasValue(params.checkAndHandleExpiredToken)) {

            params.checkAndHandleExpiredToken = async(checkParams: FetchParams)=>{
                console.debug("starting check");
                let result: DefaultDataSwap = checkParams.responseJson;
                if (checkTokenIsExpired(checkParams.responseJson)) {
                    console.debug("token is expired, refreshing...");
                    checkParams.responseJson.message = 'expired session';
                    if (typeof checkParams.authContextGetter === "function") {
                        result = await refreshToken({
                            url: checkParams.authContextGetter().refreshTokenUrl,
                            token: checkParams.authContextGetter().token || '', 
                            refreshToken: checkParams.authContextGetter().refreshToken || ''
                        });
                        if (result?.success) {
                            console.debug("refreshed token");
                            if (typeof checkParams.authContextGetter().changedAuthorization === "function") {                                
                                (checkParams.authContextGetter().changedAuthorization as any)({
                                    token: result.data.token,
                                    refreshToken: result.data.refreshToken,
                                });
                            }
                            checkParams.reqParams = checkParams.reqParams || {};
                            checkParams.reqParams.headers = checkParams.reqParams.headers || {};
                            checkParams.reqParams.headers.Authorization = `Bearer ${result.data.token}`;
                            console.debug("recursing secureFetch...");
                            result = await secureFetch(checkParams);
                        }
                    }
                } 
                return result;
            }

        }            
        result = await defaultAuthenticatedFetch(params);               
    } catch (e: any) {
        console.error(e);
        result.setException(e);
    }
    //logf('secureFetch');
    return result;
}


export async function getData(params: {
	url: string;
	queryParams?: any;
    authContextGetter?: ()=>AuthorizationParams;
}): Promise<DefaultDataSwap> {
    //logi('getData');
    let result: DefaultDataSwap = new DefaultDataSwap();
    try {
        const reqParams: any = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body:{
                queryParams: params.queryParams
            }
        }
        result = await secureFetch({
            url: params.url,
            reqParams: reqParams,
            authContextGetter: params.authContextGetter
        })
    } catch(e) {
        console.error(e);
        result.setException(e);
    }
    //logf('getData');
    return result;
}

export async function putData(params: {
	url: string;
	data: number;
    authContextGetter?: ()=>AuthorizationParams;
}): Promise<DefaultDataSwap> {
    //logi('putData');
    let result: DefaultDataSwap = new DefaultDataSwap();
    try {
        const reqParams: any = {
            method: 'PUT',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: params.data
        }
        result = await secureFetch({
            url: params.url,
            reqParams: reqParams,
            authContextGetter: params.authContextGetter
        });
    } catch (e) {
        console.error(e);
        result.setException(e);
    }
    //logf('putData');
    return result;
}

export async function patchData(params: {
	url: string; 
	data: number;
    authContextGetter?: ()=>AuthorizationParams;
}): Promise<DefaultDataSwap> {
    //logi('patchData');
    let result: DefaultDataSwap = new DefaultDataSwap();
    try {
        const reqParams: any = {
            method: 'PATCH',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: params.data
        }
        result = await secureFetch({
            url: params.url,
            reqParams: reqParams,
            authContextGetter: params.authContextGetter
        })
    } catch (e) {
        console.error(e);
        result.setException(e);
    }
    //logf('patchData');
    return result;
}

export async function getOrCreate(params: {
	url: string;
    endpoint: string;
	getEndpoint?: string;
    putEndpoint?: string;
    data: any;
    queryParams?: any;
    where?: any;
    authContextGetter?: ()=>AuthorizationParams;
}): Promise<DefaultDataSwap> {
    let result: DefaultDataSwap = new DefaultDataSwap();
    try {
        result = await getData({
            url: `${params.url}${params.getEndpoint || `${params.endpoint}${params.endpoint.lastIndexOf('/get') === params.endpoint.length - 4 ? '' : '/get'}`}`,
            queryParams: params.queryParams || hasValue(params.where) ? {where: params.where} : { where: params.data},
            authContextGetter: params.authContextGetter
        });     
        if (result?.success && !hasValue(result?.data)) {
            result = await putData({
                url: `${params.url}${params.putEndpoint || params.endpoint}`, 
                data: params.data,
                authContextGetter: params.authContextGetter
            }); 
        } else if (!result?.success) {
            console.error(result);
        }
    } catch (e) {
        console.error(e);
        result.setException(e);
    }      
    return result;
}