
# Sysnormal SSO JS Integrations

[![npm version](https://img.shields.io/npm/v/@sysnormal/sso-js-integrations.svg)](https://www.npmjs.com/package/@sysnormal/sso-js-integrations)
[![npm downloads](https://img.shields.io/npm/dm/@sysnormal/sso-js-integrations.svg)](https://www.npmjs.com/package/@sysnormal/sso-js-integrations)
![TypeScript](https://badgen.net/badge/Built%20with/TypeScript/blue)
![License](https://img.shields.io/badge/license-ISC-blue.svg)

A **TypeScript library for integrating applications with Sysnormal SSO**.

This package provides a lightweight **authentication and request SDK** for applications that need to communicate with a Sysnormal SSO backend.

It includes utilities for:

- authenticating users and systems
- automatic token refresh
- secure HTTP requests using `fetch`
- automatic retry after token expiration
- large JSON response handling
- helper methods for common API operations

The library works in:

- **Browser environments (React, Vue, etc.)**
- **Node.js**
- **TypeScript or JavaScript projects**

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

# Architecture Overview

The library implements a **secure request pipeline** built on top of the native `fetch` API.

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
retry request automatically
```

Features:

- Automatic **Bearer token injection**
- Automatic **token refresh**
- Transparent **retry of failed requests**
- Optional **stream parsing for very large JSON responses**

---

# Authentication

## authOnSso()

Authenticate a user or agent against the SSO server.

```ts
import { authOnSso } from "@sysnormal/sso-js-integrations";

const result = await authOnSso({
  identifier: "user@email.com",
  password: "secret"
});

if (result.success) {
  console.log(result.data.token);
}
```

Parameters:

- `identifier`
- `password`
- `identifierTypeId` (optional)
- `url` (optional SSO base URL)
- `endpoint` (optional authentication endpoint)

Returns:

```
DefaultDataSwap
```

---

# Token Refresh

## refreshToken()

Refresh an expired authentication token.

```ts
import { refreshToken } from "@sysnormal/sso-js-integrations";

const result = await refreshToken({
  token: currentToken,
  refreshToken: currentRefreshToken
});
```

If successful, the response contains:

- new access token
- new refresh token

---

# Secure Requests

## secureFetch()

Performs an authenticated request with automatic session recovery.

Features:

- automatic Bearer token
- expired token detection
- refresh token execution
- retry of original request

Example:

```ts
const result = await secureFetch({
  url: "/api/users",
  authContextGetter: () => authContext
});
```

The `authContextGetter` must return:

```ts
{
  token: string
  refreshToken: string
  refreshTokenUrl?: string
  changedAuthorization?: (auth) => void
}
```

When a token expires:

1. `refreshToken()` is executed
2. the authorization context is updated
3. the original request is executed again

---

# Default Authenticated Fetch

## defaultAuthenticatedFetch()

Lower-level helper used internally by `secureFetch`.

Responsibilities:

- attach authorization header
- normalize request parameters
- parse JSON responses
- support large JSON streaming parsing

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

Very large API responses can be parsed using a streaming approach.

Enable it with:

```ts
secureFetch({
  url: "/api/large-data",
  useLargeJsonParser: true
});
```

Internally this uses:

```
largeJsonParse()
```

from `@aalencarv/common-utils`.

This helps prevent memory pressure when dealing with large payloads.

---

# Data Helper Methods

The library also provides simplified helpers for common API patterns.

## getData()

```ts
await getData({
  url: "/api/users",
  queryParams: { id: 10 }
});
```

---

## putData()

```ts
await putData({
  url: "/api/users",
  data: user
});
```

---

## patchData()

```ts
await patchData({
  url: "/api/users",
  data: partialUser
});
```

---

## getOrCreate()

Fetches a resource or creates it if it does not exist.

```ts
await getOrCreate({
  url: "/api",
  endpoint: "/users",
  data: user
});
```

Workflow:

```
GET resource
   ↓
exists?
   ↓ yes → return
   ↓ no
PUT create
```

---

# Authorization Context Example

Applications typically store tokens in a context or state manager.

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

This allows `secureFetch` to automatically update tokens when they are refreshed.

---

# Dependencies

- `@aalencarv/common-utils`

Used for:

- DefaultDataSwap
- largeJsonParse
- utility helpers

---

# Organization

**Sysnormal**

Internal utilities and integration tools for Sysnormal platform services.
GitHub\
https://github.com/sysnormal

---

# Author

**Alencar Velozo**  
aalencarvz@gmail.com

---

# License

ISC
