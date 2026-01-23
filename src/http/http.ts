/**
 * Paper-thin fetch wrapper
 *
 * Goals:
 * - Reduce JSON boilerplate
 * - Preserve fetch's native behavior (no magic throws, no hidden logic)
 * - Devs still check response.ok / response.status like normal fetch
 * - Type-safe: data is T on success, unknown on error
 */

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions extends Omit<RequestInit, 'method' | 'body'> {
    params?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
}

// Discriminated union for proper type narrowing
interface HttpResponseSuccess<T> {
    ok: true;
    data: T;
    status: number;
    statusText: string;
    headers: Headers;
    response: Response;
}

interface HttpResponseError {
    ok: false;
    data: unknown;
    status: number;
    statusText: string;
    headers: Headers;
    response: Response;
}

type HttpResponse<T> = HttpResponseSuccess<T> | HttpResponseError;

function buildUrl(path: string, params?: RequestOptions['params']): string {
    const fullUrl = new URL(path);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                fullUrl.searchParams.set(key, String(value));
            }
        });
    }

    return fullUrl.toString();
}

async function request<T = unknown>(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {}
): Promise<HttpResponse<T>> {
    const { params, body, headers, ...fetchOptions } = options;

    const url = buildUrl(path, params);

    const isJsonBody =
        body !== undefined &&
        !(body instanceof FormData) &&
        !(body instanceof Blob);

    const response = await fetch(url, {
        method,
        headers: {
            ...(isJsonBody && { 'Content-Type': 'application/json' }),
            ...headers,
        },
        body: isJsonBody ? JSON.stringify(body) : (body as BodyInit),
        ...fetchOptions,
    });

    const contentType = response.headers.get('content-type');
    const data = contentType?.includes('application/json')
        ? await response.json()
        : null;

    // Return discriminated union — TypeScript narrows based on `ok`
    if (response.ok) {
        return {
            ok: true,
            data: data as T,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            response,
        };
    }

    return {
        ok: false,
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        response,
    };
}

export const http = {
    get: <T = unknown>(path: string, options?: RequestOptions) =>
        request<T>('GET', path, options),

    post: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
        request<T>('POST', path, { ...options, body }),

    put: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
        request<T>('PUT', path, { ...options, body }),

    patch: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
        request<T>('PATCH', path, { ...options, body }),

    delete: <T = unknown>(path: string, options?: RequestOptions) =>
        request<T>('DELETE', path, options),
};

export type { HttpResponse, HttpResponseSuccess, HttpResponseError, RequestOptions };