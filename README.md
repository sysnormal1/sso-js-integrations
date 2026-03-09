# sysnormal SSO JS Integrations

[![npm
version](https://img.shields.io/npm/v/@sysnormal/sso-js-integrations.svg)](https://www.npmjs.com/package/@sysnormal/sso-js-integrations)
[![npm
downloads](https://img.shields.io/npm/dm/@sysnormal/sso-js-integrations.svg)](https://www.npmjs.com/package/@sysnormal/sso-js-integrations)
![TypeScript](https://badgen.net/badge/Built%20with/TypeScript/blue)
![License](https://img.shields.io/badge/license-ISC-blue.svg)

A **TypeScript library for integrating applications with Sysnormal
SSO**.

This package provides utilities to:

-   Authenticate systems or agents against an SSO server
-   Automatically register systems in the SSO registry
-   Manage refresh tokens
-   Detect expired tokens
-   Register resources and permissions automatically
-   Integrate with Sysnormal backend APIs

It is designed to work together with:

-   `@aalencarv/common-utils`
-   `@sysnormal/js-request-utils`

------------------------------------------------------------------------

# Installation

``` bash
npm install @sysnormal/sso-js-integrations
```

or

``` bash
yarn add @sysnormal/sso-js-integrations
```

------------------------------------------------------------------------

# Quick Example

``` ts
import 'dotenv/config';
import { ssoRegister } from "@sysnormal/sso-js-integrations";
import interfaceResources from '../interface_resources.json';

ssoRegister({
    ssoUrl: `${process.env.REACT_APP_SSO_PROTOCOL}://${process.env.REACT_APP_SSO_ADDRESS}:${process.env.REACT_APP_SSO_PORT}`,
    ssoAgent: {
        identifierTypeId: process.env.REACT_APP_SSO_THIS_SYSTEM_AGENT_IDENTIFIER_TYPE_ID as any,
        identifier: process.env.REACT_APP_SSO_THIS_SYSTEM_AGENT_ID as any,
        password: process.env.REACT_APP_SSO_THIS_SYSTEM_AGENT_PASSWORD as any,
    },
    ssoSystem: {
        systemPlatformId: process.env.REACT_APP_SSO_THIS_SYSTEM_PLATFORM_TYPE_ID as any,
        systemSideId: process.env.REACT_APP_SSO_THIS_SYSTEM_SIDE_ID as any,
        name: process.env.REACT_APP_SSO_THIS_SYSTEM_NAME as any
    },
    resources: interfaceResources
});

// run before starting your project:
// npx tsx thisfile.ts
// or
// node thisfile.js
```

------------------------------------------------------------------------

# Core Concepts

## System Registration

The main idea behind this library is that **every application integrated
with Sysnormal SSO registers itself automatically**.

The process performed by `ssoRegister`:

1.  Authenticate the system agent
2.  Register the system if it does not exist
3.  Create or retrieve an access profile
4.  Link the agent, access profile and system
5.  Register system resources
6.  Configure resource permissions

------------------------------------------------------------------------

# Token Management

Agent login │ ▼ Receive token + refreshToken │ ▼ Requests executed with
Authorization header │ ▼ If token expires │ ▼ refreshToken() │ ▼
Authorization updated automatically

------------------------------------------------------------------------

# API Reference

## authOnSso

Authenticates an agent or system against the SSO server.

### Parameters

`SsoAuthParams`

Fields:

-   identifierTypeId
-   identifier
-   password
-   url

### Return

`Promise<DefaultDataSwap>`

------------------------------------------------------------------------

## refreshToken

Requests a new access token using a refresh token.

### Parameters

-   url
-   token
-   refreshToken

### Return

`Promise<DefaultDataSwap>`

------------------------------------------------------------------------

## checkTokenIsExpired

Checks if a response indicates an expired token.

Returns:

`boolean`

------------------------------------------------------------------------

## ssoRegister

High level helper used to register a system and its resources in SSO.

Responsibilities:

1.  Authenticate or register agent
2.  Register system
3.  Create access profile
4.  Link agent + access profile + system
5.  Register resources
6.  Assign permissions

------------------------------------------------------------------------

# Dependencies

-   @aalencarv/common-utils
-   @sysnormal/js-request-utils

------------------------------------------------------------------------

# Author

Aalencar Velozo\
https://github.com/aalencarvz1

------------------------------------------------------------------------

# Organization

**Sysnormal**

GitHub\
https://github.com/sysnormal

------------------------------------------------------------------------

# License

ISC
