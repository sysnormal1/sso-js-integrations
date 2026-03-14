import { DefaultDataSwap, hasValue, largeJsonParse } from "@aalencarv/common-utils";
import { AuthorizationParams, checkTokenIsExpired, refreshToken } from "../auth/AuthenticationHelper.js";


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
    authContextGetter?: ()=>AuthorizationParams;

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
}


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
export async function defaultAuthenticatedFetch(params: FetchParams): Promise<any> {

	let result = null;

	try {

		params = params || {};

		params.reqParams = params.reqParams || {};

		params.reqParams.method = params.reqParams.method || 'GET';

		params.reqParams.headers = params.reqParams.headers || {};

		params.reqParams.headers.Accept =
            params.reqParams.headers.Accept || 'application/json';

		params.reqParams.headers['Content-Type'] =
            params.reqParams.headers['Content-Type'] || 'application/json';

		params.reqParams.headers.Authorization =
            params.reqParams.headers.Authorization;

		/**
		 * Automatically attach bearer token if not provided.
		 */
		if (!hasValue(params.reqParams.headers.Authorization)) {

			if (
                typeof params.authContextGetter === "function" &&
                hasValue(params.authContextGetter().token)
            ) {

				params.reqParams.headers.Authorization =
                    `Bearer ${params.authContextGetter().token}`;

			} else {

				params.reqParams.headers.Authorization = undefined;

				delete params.reqParams.headers.Authorization;
			}
		}

		/**
		 * Automatically stringify request body if needed.
		 */
		if (params.reqParams.body && typeof params.reqParams.body != 'string') {
			params.reqParams.body = JSON.stringify(params.reqParams.body);
		}

		console.debug('requesting',params.url, 'with params',params.reqParams);

		params.reqResponse = await fetch(params.url,params.reqParams);


		/**
		 * Handle large streaming JSON responses.
		 */
		if (
            typeof params.reqResponse.body?.getReader == 'function' &&
            params.useLargeJsonParser === true
        ) {

			const reader = params.reqResponse.body.getReader();

			const decoder = new TextDecoder();

			let stringBuffer = [];

			while (true) {

				const { done, value } = await reader.read();

				if (done) break;

				stringBuffer.push(
                    decoder.decode(value, { stream: true })
                );
			}

			const totalCharacters =
                stringBuffer.reduce((acc, str) => acc + str.length, 0);

			if (totalCharacters >= 150000) {

				params.responseJson = largeJsonParse(stringBuffer);

			} else {

				params.responseJson =
                    JSON.parse(stringBuffer.join(''));
			}

		} else {

			params.responseJson =
                await params.reqResponse.json();
		}

		if (typeof params.checkAndHandleExpiredToken === "function") {

			result =
                await params.checkAndHandleExpiredToken(params);

		} else {

			result = params.responseJson;
		}

	} catch (e: any) {

		result = {
            success:false,
            message:e.message || e,
            exception: e
        };
	}

	return result;
}


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
export async function secureFetch(params: FetchParams) : Promise<DefaultDataSwap>{

    let result: DefaultDataSwap = new DefaultDataSwap();

    try {

        /**
         * Default expired-token handler.
         */
        if (!hasValue(params.checkAndHandleExpiredToken)) {

            params.checkAndHandleExpiredToken =
            async(checkParams: FetchParams)=>{

                console.debug("starting check");

                let result: DefaultDataSwap =
                    checkParams.responseJson;

                if (checkTokenIsExpired(checkParams.responseJson)) {

                    console.debug("token is expired, refreshing...");

                    checkParams.responseJson.message =
                        'expired session';

                    if (typeof checkParams.authContextGetter === "function") {

                        result = await refreshToken({

                            url: checkParams.authContextGetter().refreshTokenUrl,

                            token:
                                checkParams.authContextGetter().token || '',

                            refreshToken:
                                checkParams.authContextGetter().refreshToken || ''
                        });

                        if (result?.success) {

                            console.debug("refreshed token");

                            if (
                                typeof checkParams.authContextGetter().changedAuthorization === "function"
                            ) {

                                (checkParams.authContextGetter().changedAuthorization as any)({

                                    token: result.data.token,

                                    refreshToken: result.data.refreshToken,
                                });
                            }

                            checkParams.reqParams =
                                checkParams.reqParams || {};

                            checkParams.reqParams.headers =
                                checkParams.reqParams.headers || {};

                            checkParams.reqParams.headers.Authorization =
                                `Bearer ${result.data.token}`;

                            console.debug("recursing secureFetch...");

                            result =
                                await secureFetch(checkParams);
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

    return result;
}


/**
 * Performs a secure data retrieval request.
 *
 * @remarks
 * Sends a POST request containing `queryParams`
 * and returns the result wrapped in {@link DefaultDataSwap}.
 */
export async function getData(params: {

	url: string;

	queryParams?: any;

    authContextGetter?: ()=>AuthorizationParams;

}): Promise<DefaultDataSwap> {

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

    return result;
}


/**
 * Performs a secure PUT request.
 */
export async function putData(params: {

	url: string;

	data: number;

    authContextGetter?: ()=>AuthorizationParams;

}): Promise<DefaultDataSwap> {

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

    return result;
}


/**
 * Performs a secure PATCH request.
 */
export async function patchData(params: {

	url: string;

	data: number;

    authContextGetter?: ()=>AuthorizationParams;

}): Promise<DefaultDataSwap> {

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

    return result;
}


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

            url: `${params.url}${params.getEndpoint ||
                `${params.endpoint}${params.endpoint.lastIndexOf('/get') === params.endpoint.length - 4 ? '' : '/get'}`
            }`,

            queryParams:
                params.queryParams ||
                hasValue(params.where)
                ? {where: params.where}
                : { where: params.data},

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
