
# sso-js-integrations

[![npm
version](https://img.shields.io/npm/v/@sysnormal/sso-js-integrations.svg)](https://www.npmjs.com/package/@sysnormal/sso-js-integrations)
[![npm
downloads](https://img.shields.io/npm/dm/@sysnormal/sso-js-integrations.svg)](https://www.npmjs.com/package/@sysnormal/sso-js-integrations)
![TypeScript](https://badgen.net/badge/Built%20with/TypeScript/blue)
![License](https://img.shields.io/badge/license-ISC-blue.svg)

JavaScript/TypeScript utilities to integrate applications with a **Single Sign-On (SSO)** authentication server.

This library provides helpers for:

- SSO authentication
- automatic token refresh
- authenticated HTTP requests
- secure API access using `fetch`
- handling large JSON responses
- simple data helpers for CRUD-style endpoints

It is designed to work in **frontend (React, browser)** or **Node.js** environments.

---

# Installation

```bash
npm install @sysnormal/sso-js-integrations
```

Peer dependency:

```bash
npm install @aalencarv/common-utils
```

---

# Overview

The library provides a **lightweight authentication SDK** built on top of the native `fetch` API.

Main features:

- automatic Bearer token injection
- automatic token refresh
- retry request after refresh
- helper methods for common CRUD requests
- large JSON streaming parser support

Typical flow:

```
secureFetch()
      ↓
defaultAuthenticatedFetch()
      ↓
fetch()
      ↓
checkTokenIsExpired()
      ↓
refreshToken()
      ↓
retry request
```

---

# Authentication

## `authOnSso()`

Authenticate a user against the SSO server.

```ts
import { authOnSso } from "@sysnormal/sso-js-integrations";

const result = await authOnSso({
  identifier: "user@email.com",
  password: "password"
});

if(result.success) {
  console.log(result.data.token);
}
```

Parameters:

- `identifier`
- `password`
- `identifierTypeId` (optional)
- `url` (optional SSO base URL)
- `endpoint` (optional authentication endpoint)

Returns a `DefaultDataSwap` response.

---

# Token Refresh

## `refreshToken()`

Refresh an expired authentication token.

```ts
import { refreshToken } from "@sysnormal/sso-js-integrations";

const result = await refreshToken({
  token: currentToken,
  refreshToken: currentRefreshToken
});
```

If successful, the response contains a **new token and refresh token**.

---

# Authenticated Requests

## `secureFetch()`

Performs a request with:

- automatic Bearer token
- expired token detection
- automatic refresh
- retry of the original request

```ts
const result = await secureFetch({
  url: "/api/data",
  authContextGetter: () => authContext
});
```

`authContextGetter` must return:

```ts
{
  token: string
  refreshToken: string
  refreshTokenUrl?: string
  changedAuthorization?: (auth) => void
}
```

If the token expires:

1. `refreshToken()` is called
2. the token is updated
3. the original request is retried automatically

---

# Default Authenticated Fetch

## `defaultAuthenticatedFetch()`

Lower-level request helper used internally by `secureFetch`.

Features:

- injects Authorization header
- handles JSON parsing
- optional large JSON streaming parser

Example:

```ts
await defaultAuthenticatedFetch({
  url: "/api/data",
  reqParams: { method: "GET" },
  authContextGetter: () => authContext
});
```

---

# Large JSON Handling

For very large responses you can enable streaming parsing.

```ts
secureFetch({
  url: "/api/large-data",
  useLargeJsonParser: true
});
```

This uses `largeJsonParse()` from `@aalencarv/common-utils` to reduce memory pressure when handling large payloads.

---

# Data Helpers

The library includes simple wrappers for common data operations.

## `getData()`

```ts
await getData({
  url: "/api/users",
  queryParams: { id: 10 }
});
```

---

## `putData()`

```ts
await putData({
  url: "/api/users",
  data: user
});
```

---

## `patchData()`

```ts
await patchData({
  url: "/api/users",
  data: partialUser
});
```

---

## `getOrCreate()`

Attempts to fetch a resource, creating it if it does not exist.

```ts
await getOrCreate({
  url: "/api",
  endpoint: "/users",
  data: user
});
```

Flow:

```
GET resource
   ↓
exists?
   ↓ yes → return
   ↓ no
PUT create
```

---

# Authorization Context

Applications typically store tokens in a context or state manager.

Example:

```ts
const authContext = {
  token: "...",
  refreshToken: "...",
  refreshTokenUrl: "/sso/refresh",
  changedAuthorization: (auth) => {
    authContext.token = auth.token;
    authContext.refreshToken = auth.refreshToken;
  }
}
```

This allows `secureFetch` to update the token automatically after refresh.

---

# Dependencies

- `@aalencarv/common-utils`

Used for:

- `DefaultDataSwap`
- `largeJsonParse`
- helper utilities

---

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
