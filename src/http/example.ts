import { http } from './http';

interface User {
    id: number;
    name: string;
    email: string;
}

interface ValidationError {
    field: string;
    message: string;
}

// ============================================
// FETCH VS WRAPPER COMPARISON
// ============================================

// --- GET with params ---

// fetch
const res1 = await fetch('https://api.example.com/users?' + new URLSearchParams({ role: 'admin' }));
const users1 = await res1.json() as User[];

// wrapper
const res2 = await http.get<User[]>('https://api.example.com/users', { params: { role: 'admin' } });
const users2 = res2.ok ? res2.data : [];


// --- POST with JSON body ---

// fetch
const res3 = await fetch('https://api.example.com/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Alice', email: 'alice@example.com' }),
});
const newUser1 = await res3.json() as User;

// wrapper
const res4 = await http.post<User>('https://api.example.com/users', { name: 'Alice', email: 'alice@example.com' });
const newUser2 = res4.ok ? res4.data : null;


// --- Error handling ---

// fetch
const res5 = await fetch('https://api.example.com/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Bob' }),
});
if (!res5.ok) {
    const errors = await res5.json() as ValidationError[];
    console.error(`Failed: ${res5.status}`, errors);
    return;
}
const user1 = await res5.json() as User;

// wrapper
const res6 = await http.post<User>('https://api.example.com/users', { name: 'Bob' });
if (!res6.ok) {
    const errors = res6.data as ValidationError[];
    console.error(`Failed: ${res6.status}`, errors);
    return;
}
const user2 = res6.data; // typed as User


// ============================================
// TYPE NARROWING NOW WORKS CORRECTLY
// ============================================

const res = await http.post<User>('https://api.example.com/users', { name: 'Bob' });

// Before checking: res.data is `User | unknown` (union)

if (!res.ok) {
    // TypeScript knows: res is HttpResponseError
    // res.data is `unknown` — cast to your error shape
    const errors = res.data as ValidationError[];
    console.error(`Failed: ${res.status}`, errors);
    return;
}

// TypeScript knows: res is HttpResponseSuccess<User>
// res.data is `User` — no cast needed
console.log(res.data.name);  // ✅ Typed as string
console.log(res.data.email); // ✅ Typed as string


// ============================================
// HANDLING SPECIFIC STATUS CODES
// ============================================

const res7 = await http.post<User>('https://api.example.com/users', { name: 'Alice' });

if (res7.status === 401) {
    // redirect to login
    window.location.href = '/login';
}

if (res7.status === 422) {
    // res2.data is `unknown` here (not ok)
    const errors = res7.data as ValidationError[];
    errors.forEach(e => console.log(`${e.field}: ${e.message}`));
}

if (res7.ok) {
    // res2.data is `User` here
    const user = res7.data;
    console.log(`Created user: ${user.name}`);
}


// ============================================
// ACCESS RAW RESPONSE WHEN NEEDED
// ============================================

const res8 = await http.get<User[]>('https://api.example.com/users');

// Common properties directly available
console.log(res8.status);      // number
console.log(res8.statusText);  // string
console.log(res8.headers.get('x-total-count'));

// Full Response object if you need something else
console.log(res8.response.url);
console.log(res8.response.redirected);


// ============================================
// QUICK REFERENCE
// ============================================

// GET with params
await http.get<User[]>('https://api.example.com/users', {
    params: { role: 'admin', active: true }
});

// POST with body (auto-stringified, auto Content-Type)
await http.post<User>('https://api.example.com/users', {
    name: 'Alice',
    email: 'alice@example.com'
});

// With custom headers
await http.get<User>('https://api.example.com/me', {
    headers: { 'Authorization': 'Bearer token123' },
});

// With abort controller
const controller = new AbortController();
await http.get<User[]>('https://api.example.com/users', {
    signal: controller.signal
});

// FormData (auto-detected, no JSON stringify)
const formData = new FormData();
formData.append('file', new Blob(['test']));
await http.post('https://api.example.com/upload', formData);