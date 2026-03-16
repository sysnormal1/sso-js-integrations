import { DefaultDataSwap } from "@aalencarv/common-utils";
import { AuthorizationParams } from "../auth/AuthenticationHelper.js";
/**
 * Parameters used to perform HTTP requests through the helper utilities.
 *
 * @remarks
 * This structure is used internally by {@link defaultAuthenticatedFetch}
 * and {@link secureFetch} to standardize authenticated requests,
 * token management, and response parsing.
 */
export type FetchParams = {
    /**
     * Target request URL.
     */
    url: string;
    /**
     * Function used to retrieve the current authorization context.
     *
     * @remarks
     * Usually returns an object containing the current token
     * and refresh token information.
     */
    authContextGetter?: () => AuthorizationParams;
    /**
     * Standard `fetch` request parameters.
     */
    reqParams?: {
        method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
        headers?: {
            Accept?: string;
            ['Content-Type']?: string;
            Authorization?: string;
        };
        body?: any;
    };
    /**
     * Enables large JSON parsing mode.
     *
     * @remarks
     * When enabled, the response body is streamed and parsed
     * using {@link largeJsonParse} to handle extremely large payloads.
     */
    useLargeJsonParser?: boolean;
    /**
     * Custom function used to validate and handle expired tokens.
     *
     * @remarks
     * If not provided, {@link secureFetch} will automatically
     * inject a default implementation.
     */
    checkAndHandleExpiredToken?: (params: FetchParams) => Promise<DefaultDataSwap>;
    /**
     * Raw response object returned by `fetch`.
     */
    reqResponse?: Response;
    /**
     * Parsed JSON response.
     */
    responseJson?: any;
};
/**
 * Performs an authenticated HTTP request using the native `fetch` API.
 *
 * @remarks
 * This function automatically:
 *
 * - attaches the `Authorization` header if available
 * - ensures request headers are properly configured
 * - optionally parses large JSON responses using streaming
 *
 * If `checkAndHandleExpiredToken` is provided, the parsed
 * response will be passed to that handler before returning.
 *
 * @param params Request parameters.
 *
 * @returns Parsed response data.
 */
export declare function defaultAuthenticatedFetch(params: FetchParams): Promise<any>;
/**
 * Performs a secure HTTP request with automatic token refresh handling.
 *
 * @remarks
 * This function wraps {@link defaultAuthenticatedFetch} and adds
 * automatic session recovery logic:
 *
 * 1. Execute request
 * 2. Detect expired token
 * 3. Request new token using {@link refreshToken}
 * 4. Update authorization context
 * 5. Retry the original request
 *
 * This process is performed transparently to the caller.
 *
 * @param params Request parameters.
 *
 * @returns A {@link DefaultDataSwap} response object.
 */
export declare function secureFetch(params: FetchParams): Promise<DefaultDataSwap>;
/**
 * Performs a secure data retrieval request.
 *
 * @remarks
 * Sends a POST request containing `queryParams`
 * and returns the result wrapped in {@link DefaultDataSwap}.
 */
export declare function getData(params: {
    url: string;
    queryParams?: any;
    authContextGetter?: () => AuthorizationParams;
}): Promise<DefaultDataSwap>;
/**
 * Performs a secure PUT request.
 */
export declare function putData(params: {
    url: string;
    data: number;
    authContextGetter?: () => AuthorizationParams;
}): Promise<DefaultDataSwap>;
/**
 * Performs a secure PATCH request.
 */
export declare function patchData(params: {
    url: string;
    data: number;
    authContextGetter?: () => AuthorizationParams;
}): Promise<DefaultDataSwap>;
/**
 * Retrieves a resource or creates it if it does not exist.
 *
 * @remarks
 * This helper performs the following workflow:
 *
 * 1. Attempt to retrieve the resource using `getData`
 * 2. If the resource does not exist, create it using `putData`
 *
 * This pattern is commonly used for idempotent resource initialization.
 */
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
