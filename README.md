# js-request-utils

[![npm
version](https://img.shields.io/npm/v/@sysnormal/js-request-utils.svg)](https://www.npmjs.com/package/@sysnormal/js-request-utils)
[![npm
downloads](https://img.shields.io/npm/dm/@sysnormal/js-request-utils.svg)](https://www.npmjs.com/package/@sysnormal/js-request-utils)
![TypeScript](https://badgen.net/badge/Built%20with/TypeScript/blue)
![License](https://img.shields.io/badge/license-ISC-blue.svg)

A lightweight **TypeScript HTTP request utility library** designed for
applications integrated with **Sysnormal SSO**.

This library simplifies authenticated API communication by automatically
handling:

-   Bearer token injection
-   Token expiration detection
-   Refresh token flow
-   Automatic request retry
-   Large JSON responses
-   Common request patterns (GET/PUT/PATCH/get-or-create)

It is designed to work together with:

-   `@aalencarv/common-utils`
-   `@sysnormal/sso-js-integrations`

------------------------------------------------------------------------

# Installation

``` bash
npm install @sysnormal/js-request-utils
```

or

``` bash
yarn add @sysnormal/js-request-utils
```

------------------------------------------------------------------------

# Quick Example

``` ts
import { getData } from "@sysnormal/js-request-utils";

const result = await getData({
    url: "https://api.example.com/user/get",
    queryParams: {
        where: { id: 1 }
    },
    authParams: {
        token: "ACCESS_TOKEN",
        refreshToken: "REFRESH_TOKEN",
        refreshTokenUrl: "https://api.example.com/auth/refresh"
    }
});

console.log(result);
```

------------------------------------------------------------------------

# Token Refresh Flow

The library automatically refreshes expired tokens.

Flow:

    Client Request
          │
          ▼
    secureFetch()
          │
          ▼
    defaultAuthenticatedFetch()
          │
          ▼
    Server Response
          │
          ├── Token valid → return response
          │
          └── Token expired
                 │
                 ▼
            refreshToken()
                 │
                 ▼
         update Authorization header
                 │
                 ▼
            retry original request

This behavior is fully automatic when using `secureFetch` or the helper
functions built on top of it.

------------------------------------------------------------------------

# Core Types

## FetchParams

Main configuration object used internally by request functions.

Important fields:

-   `url` -- target endpoint
-   `authParams` -- authentication configuration
-   `reqParams` -- native fetch configuration
-   `useLargeJsonParser` -- enable streaming JSON parsing
-   `checkAndHandleExpiredToken` -- custom token expiration handler

Runtime fields used internally:

-   `reqResponse`
-   `responseJson`

------------------------------------------------------------------------

# API Reference

## 1. defaultAuthenticatedFetch

Low-level helper around `fetch` that automatically attaches
authentication headers.

Features:

-   Injects `Authorization: Bearer <token>`
-   Converts body objects into JSON
-   Handles streaming responses
-   Supports parsing extremely large JSON payloads
-   Allows custom token expiration logic

Use this when you want **full control over request behavior**.

------------------------------------------------------------------------

## 2. secureFetch

Secure wrapper around `defaultAuthenticatedFetch`.

Responsibilities:

-   Detect expired tokens
-   Refresh tokens automatically
-   Retry the request after refresh
-   Notify the application when new tokens are issued

If `authParams.changedAuthorization` exists, it will be called with the
new tokens.

Returned value is a `DefaultDataSwap` object containing:

-   `success`
-   `data`
-   `message`
-   `exception`

------------------------------------------------------------------------

## 3. getData

Utility helper implementing the common **POST /get** API pattern.

Internally:

-   Sends POST request
-   Includes `queryParams` in body
-   Uses `secureFetch`

Example request body:

``` json
{
  "queryParams": {
    "where": {
      "id": 1
    }
  }
}
```

------------------------------------------------------------------------

## 4. putData

Helper for sending **PUT requests**.

Typical use cases:

-   Creating new entities
-   Replacing entire resources

The request automatically passes through `secureFetch`, ensuring
authentication and token refresh.

------------------------------------------------------------------------

## 5. patchData

Helper for **PATCH requests** used for partial updates.

Automatically:

-   sets headers
-   injects authentication
-   refreshes expired tokens

------------------------------------------------------------------------

## 6. getOrCreate

Utility implementing a **get-or-create pattern** commonly used in system
integrations.

Flow:

    GET resource
       │
       ├── exists → return data
       │
       └── not found
               │
               ▼
            PUT resource

Common scenarios:

-   system registration
-   configuration initialization
-   idempotent resource creation

Parameters:

-   `url` -- base API URL
-   `endpoint` -- main resource endpoint
-   `getEndpoint` -- optional custom GET endpoint
-   `putEndpoint` -- optional custom PUT endpoint
-   `data` -- payload for creation
-   `queryParams` -- lookup filters
-   `where` -- alternative lookup filter
-   `authParams` -- authentication parameters

------------------------------------------------------------------------

# Dependencies

This package relies on:

-   `@aalencarv/common-utils`
-   `@sysnormal/sso-js-integrations`

These provide:

-   shared utilities
-   token validation
-   token refresh logic
-   standardized response structures


# Author

**Aalencar Velozo**

GitHub\
https://github.com/aalencarvz1

------------------------------------------------------------------------

# Organization

**Sysnormal**

GitHub\
https://github.com/sysnormal

------------------------------------------------------------------------

# License

ISC License
