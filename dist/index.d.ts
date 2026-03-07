export { authOnSso, refreshToken, checkTokenIsExpired } from './helpers/auth/AuthenticationHelper.js';
export type AuthorizationParams = {
    token?: string;
    refreshToken?: string;
    refreshTokenUrl?: string;
    changedAuthorization?: (params: AuthorizationParams) => void;
};
export declare function ssoRegister(params: {
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
    resources?: any;
}): Promise<void>;
