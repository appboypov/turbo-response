# turbo-response

A TypeScript library providing a type-safe Result type (Success/Fail) for handling operation outcomes without exceptions.

## Installation

```bash
npm install @appboypov/turbo-response
```

## Features

- **Type-safe result handling** with discriminated unions
- **Zero dependencies**
- **Full TypeScript support** with complete type inference
- **Functional programming utilities** for chaining and transforming results
- **Async support** with `andThenAsync`, `recoverAsync`, and `traverse`
- **Batch operations** with `sequence` for combining multiple results

## Quick Start

```typescript
import { success, fail, fold, isSuccess, TurboResponse } from '@appboypov/turbo-response';

// Creating responses
const successResult = success({ id: '123', name: 'John' });
const failResult = fail(new Error('Not found'));

// Type guards
if (isSuccess(response)) {
  console.log(response.result);
}

// Pattern matching with fold
const message = fold(
  response,
  (data) => `Found user: ${data.name}`,
  (error) => `Error: ${error}`
);
```

## API

### Creating Responses

#### `success<T>(result: T, title?: string, message?: string): Success<T>`

Creates a successful response.

```typescript
const user = success({ id: '1', name: 'John' });
const withMeta = success(data, 'Created', 'User created successfully');
```

#### `fail<T>(error: unknown, title?: string, message?: string, stackTrace?: string): Fail<T>`

Creates a failed response.

```typescript
const error = fail(new Error('Not found'));
const withMeta = fail(err, 'Not Found', 'User does not exist');
```

### Type Guards

#### `isSuccess<T>(r: TurboResponse<T>): r is Success<T>`

```typescript
if (isSuccess(response)) {
  console.log(response.result); // TypeScript knows this is Success<T>
}
```

#### `isFail<T>(r: TurboResponse<T>): r is Fail<T>`

```typescript
if (isFail(response)) {
  console.log(response.error); // TypeScript knows this is Fail<T>
}
```

### Pattern Matching

#### `fold<T, R>(response, onSuccess, onFail): R`

Transform a response into a single value.

```typescript
const message = fold(
  response,
  (user) => `Hello, ${user.name}`,
  (error) => `Error: ${error}`
);
```

#### `when<T, R>(response, handlers): R`

Pattern match with full response access.

```typescript
const result = when(response, {
  success: (s) => `Got ${s.result.name} - ${s.message}`,
  fail: (f) => `Failed: ${f.title}`,
});
```

#### `maybeWhen<T, R>(response, handlers): R`

Pattern match with optional handlers and fallback.

```typescript
const result = maybeWhen(response, {
  success: (s) => s.result.name,
  orElse: () => 'Unknown',
});
```

### Transformations

#### `mapSuccess<T, R>(r, fn): TurboResponse<R>`

Transform the success value.

```typescript
const nameResponse = mapSuccess(userResponse, (user) => user.name);
```

#### `mapFail<T>(r, fn): TurboResponse<T>`

Transform the error value.

```typescript
const mapped = mapFail(response, (err) => new CustomError(err));
```

### Chaining

#### `andThen<T, R>(r, fn): TurboResponse<R>`

Chain operations that return TurboResponse (flatMap/bind).

```typescript
const result = andThen(
  getUserById('123'),
  (user) => getOrdersByUser(user.id)
);
```

#### `andThenAsync<T, R>(r, fn): Promise<TurboResponse<R>>`

Async version of andThen for chaining async operations.

```typescript
const result = await andThenAsync(
  fetchUser('123'),
  async (user) => fetchOrders(user.id)
);

// Chain multiple async operations
let result = await fetchUser('123');
result = await andThenAsync(result, async (user) => fetchProfile(user.id));
result = await andThenAsync(result, async (profile) => fetchSettings(profile.id));
```

### Error Recovery

#### `recover<T>(r, fn): TurboResponse<T>`

Attempt to recover from a failure.

```typescript
const result = recover(
  failedResponse,
  (error) => success(defaultValue)
);
```

#### `recoverAsync<T>(r, fn): Promise<TurboResponse<T>>`

Async version of recover.

```typescript
const result = await recoverAsync(
  failedResponse,
  async (error) => {
    const fallback = await fetchFallbackData();
    return success(fallback);
  }
);
```

### Unwrapping

#### `unwrap<T>(r): T`

Get the success value or throw the error.

```typescript
try {
  const value = unwrap(response);
} catch (error) {
  // Handle error
}
```

#### `unwrapOr<T>(r, defaultValue): T`

Get the success value or return a default.

```typescript
const value = unwrapOr(response, defaultUser);
```

#### `unwrapOrCompute<T>(r, compute): T`

Get the success value or compute a default lazily.

```typescript
const value = unwrapOrCompute(response, () => createDefaultUser());
```

### Batch Operations

#### `traverse<T, R>(items, fn): Promise<TurboResponse<R[]>>`

Apply an async operation to each item, collecting results. Fails fast on first error.

```typescript
const userIds = ['1', '2', '3'];

const result = await traverse(userIds, async (id) => {
  const user = await fetchUser(id);
  return user ? success(user) : fail(new Error(`User ${id} not found`));
});

if (isSuccess(result)) {
  console.log('All users:', result.result); // User[]
}
```

#### `sequence<T>(responses): TurboResponse<T[]>`

Combine an array of responses into a single response. Fails fast on first error.

```typescript
const responses = [
  success(1),
  success(2),
  success(3),
];

const combined = sequence(responses);
// Success<number[]> with [1, 2, 3]

const withFailure = sequence([
  success(1),
  fail(new Error('oops')),
  success(3),
]);
// Fail - returns the first failure
```

### Validation

#### `ensure<T>(r, predicate, error): TurboResponse<T>`

Validate the success value against a predicate.

```typescript
const validated = ensure(
  userResponse,
  (user) => user.age >= 18,
  new Error('Must be 18 or older')
);
```

### Utilities

#### `swap<T>(r): TurboResponse<T>`

Swap success and fail states.

#### `getResult<T>(r): T | undefined`

Safely get the result value.

#### `getError<T>(r): unknown | undefined`

Safely get the error value.

#### `getTitle<T>(r): string | undefined`

Get the title metadata.

#### `getMessage<T>(r): string | undefined`

Get the message metadata.

## License

MIT
