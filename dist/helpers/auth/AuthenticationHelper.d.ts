import { DefaultDataSwap } from "@aalencarv/common-utils";
export type AuthorizationParams = {
    token?: string;
    refreshToken?: string;
    refreshTokenUrl?: string;
    changedAuthorization?: (changed: AuthorizationParams) => void;
};
export type SsoAuthParams = {
    identifierTypeId?: number;
    identifier: string | number;
    password: string | number;
    url?: string;
    endpoint?: string;
};
export declare function authOnSso(params: SsoAuthParams): Promise<DefaultDataSwap>;
export declare function refreshToken(params: {
    url?: string;
    endpoint?: string;
    token: string;
    refreshToken: string;
}): Promise<DefaultDataSwap>;
export declare function checkTokenIsExpired(resultJson?: any): boolean;
