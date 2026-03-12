import { DefaultDataSwap } from "@aalencarv/common-utils";
import { AuthorizationParams } from "../auth/AuthenticationHelper.js";
export type FetchParams = {
    url: string;
    authContextGetter?: () => AuthorizationParams;
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
};
export declare function defaultAuthenticatedFetch(params: FetchParams): Promise<any>;
export declare function secureFetch(params: FetchParams): Promise<DefaultDataSwap>;
export declare function getData(params: {
    url: string;
    queryParams?: any;
    authContextGetter?: () => AuthorizationParams;
}): Promise<DefaultDataSwap>;
export declare function putData(params: {
    url: string;
    data: number;
    authContextGetter?: () => AuthorizationParams;
}): Promise<DefaultDataSwap>;
export declare function patchData(params: {
    url: string;
    data: number;
    authContextGetter?: () => AuthorizationParams;
}): Promise<DefaultDataSwap>;
export declare function getOrCreate(params: {
    url: string;
    endpoint: string;
    getEndpoint?: string;
    putEndpoint?: string;
    data: any;
    queryParams?: any;
    where?: any;
    authContextGetter?: () => AuthorizationParams;
}): Promise<DefaultDataSwap>;
