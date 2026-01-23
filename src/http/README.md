# HTTP Wrapper

A JSON-first fetch wrapper for standard API calls.

## Goals

1. **Reduce boilerplate** — No more repetitive `JSON.stringify`, headers, and parsing
2. **Give more power to devs** — Full access to response, status codes, and headers
3. **No deep abstraction** — Works like fetch, just with less ceremony

**_NOTE:_** For streaming, text, blobs, or advanced response handling, use `fetch` directly.

## Why This Exists

We removed axios to reduce library complexity and use the platform. But raw `fetch` has boilerplate:

```typescript
// Every JSON POST requires this ceremony
const res = await fetch("/api/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Alice" }),
});
const user = await res.json();
```

After:

```typescript
// JSON-first API call with no fetch boilerplate
const res = await http.post<User>("/api/users", {
  name: "Alice",
});
const user = res.data; // typed as User;
```

This wrapper removes that boilerplate while keeping fetch's mental model for error handling.

## Installation

Copy `http.ts` into your project. No dependencies.

## Usage

```typescript
import { http } from "./http";

// GET
const res = await http.get<User[]>("https://api.example.com/users");

// GET with query params
const res = await http.get<User[]>("https://api.example.com/users", {
  params: { role: "admin", active: true },
});

// POST
const res = await http.post<User>("https://api.example.com/users", {
  name: "Alice",
  email: "alice@example.com",
});

// PUT, PATCH, DELETE
const res = await http.put<User>("https://api.example.com/users/1", {
  name: "Bob",
});
const res = await http.patch<User>("https://api.example.com/users/1", {
  name: "Bob",
});
const res = await http.delete("https://api.example.com/users/1");
```

## Error Handling

Check `res.ok` — same as fetch:

```typescript
const res = await http.post<User>("https://api.example.com/users", {
  name: "Bob",
});

if (!res.ok) {
  // res.data is `unknown` — cast to your error shape
  const errors = res.data as ValidationError[];
  console.error(`Failed: ${res.status}`, errors);
  return;
}

// res.data is typed as User
console.log(res.data.name);
```

Handle specific status codes:

```typescript
const res = await http.post<User>("https://api.example.com/users", data);

if (res.status === 401) {
  window.location.href = "/login";
  return;
}

if (res.status === 422) {
  const errors = res.data as ValidationError[];
  showFormErrors(errors);
  return;
}

if (res.ok) {
  const user = res.data;
}
```

## TypeScript

The wrapper uses a discriminated union. TypeScript narrows `res.data` based on `res.ok`:

```typescript
const res = await http.get<User>("https://api.example.com/users/1");

// Before check: res.data is User | unknown
if (!res.ok) {
  // res.data is unknown
  return;
}
// res.data is User
```

## Request Options

All fetch options are supported:

```typescript
// Custom headers
await http.get<User>("https://api.example.com/me", {
  headers: { Authorization: "Bearer token123" },
});

// Abort controller
const controller = new AbortController();
await http.get<User[]>("https://api.example.com/users", {
  signal: controller.signal,
});

// Credentials, cache, mode
await http.get<User[]>("https://api.example.com/users", {
  credentials: "include",
  cache: "no-store",
  mode: "cors",
});
```

## FormData

FormData is auto-detected. No special handling needed:

```typescript
const formData = new FormData();
formData.append("file", file);

await http.post("https://api.example.com/upload", formData);
```

The wrapper skips JSON serialization and lets the browser set the correct `Content-Type` with boundary.

## Response Object

The response includes commonly-used properties plus the raw Response:

```typescript
const res = await http.get<User[]>("https://api.example.com/users");

res.ok; // boolean (true for 2xx)
res.status; // number
res.statusText; // string
res.headers; // Headers
res.data; // T (parsed JSON)
res.response; // Raw Response object
```

## When to Use `fetch` Directly

This wrapper is for JSON APIs. Use `fetch` for:

- **Streaming responses** — `res.body.getReader()`
- **Binary downloads** — `res.blob()`
- **Text responses** — `res.text()`
- **Server-sent events** — `EventSource` or fetch with streaming
- **Advanced response handling** — anything beyond JSON

```typescript
// Streaming — use fetch
const res = await fetch("/api/stream");
const reader = res.body?.getReader();

// Blob download — use fetch
const res = await fetch("/api/report.pdf");
const blob = await res.blob();

// JSON API — use wrapper
const res = await http.get<User[]>("https://api.example.com/users");
```

## What This Wrapper Does

- ✅ Auto-stringify JSON bodies
- ✅ Auto-set `Content-Type: application/json`
- ✅ Auto-parse JSON responses
- ✅ Query params via `{ params: {} }`
- ✅ Type-safe success/error discrimination
- ✅ Pass-through all fetch options

## What This Wrapper Does Not Do

- ❌ Auto-throw on non-2xx (you check `res.ok`)
- ❌ Interceptors or middleware
- ❌ Retry logic
- ❌ Request/response transforms
- ❌ Streaming support

These are intentionally excluded. If you need them, use fetch directly or propose an extension.

## Comparison

| Operation       | fetch                                                                       | http wrapper                    |
| --------------- | --------------------------------------------------------------------------- | ------------------------------- |
| GET             | `await fetch(url)`                                                          | `await http.get(url)`           |
| GET with params | `fetch(url + '?' + new URLSearchParams(...))`                               | `http.get(url, { params: {} })` |
| POST JSON       | `fetch(url, { method: 'POST', headers: {...}, body: JSON.stringify(...) })` | `http.post(url, data)`          |
| Parse JSON      | `await res.json()`                                                          | `res.data`                      |
| Check success   | `res.ok`                                                                    | `res.ok`                        |
| Check status    | `res.status`                                                                | `res.status`                    |

## FAQ

**Why not axios?**

We removed axios to reduce dependencies and use platform APIs. This wrapper provides the convenience without the library.

**Why not ky?**

Similar reasoning. This is ~100 lines we own and understand. No external dependency to audit or update.

**Why doesn't it throw on errors?**

Throwing hides control flow and makes debugging harder. Checking `res.ok` is explicit and matches how fetch works. You always know where errors are handled.

**Can I add retries?**

Not in the wrapper. Implement retry logic at the call site or in a service layer. Keeping the wrapper simple means it stays debuggable.

**Can I add interceptors?**

No. If you need request/response transforms, wrap the wrapper or handle it in your service layer. The wrapper stays thin.
