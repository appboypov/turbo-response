/**
 * TurboResponse - A discriminated union type for handling operation results.
 *
 * Inspired by Flutter's turbo_response package, this provides a type-safe way to handle
 * success and failure states in TypeScript. It uses a discriminated union pattern with
 * a `_tag` property to distinguish between Success and Fail states.
 *
 * @module TurboResponse
 *
 * @example
 * ```typescript
 * import { success, fail, fold, TurboResponse } from 'turbo-response';
 *
 * // Creating responses
 * const successResult = success({ id: '123', name: 'John' });
 * const failResult = fail(new Error('Not found'));
 *
 * // Pattern matching
 * const message = fold(
 *   response,
 *   (data) => `Found user: ${data.name}`,
 *   (error) => `Error: ${error.message}`
 * );
 *
 * // Chaining operations
 * const result = await andThenAsync(
 *   fetchUser('123'),
 *   async (user) => fetchOrders(user.id)
 * );
 * ```
 */

/**
 * Represents a successful operation result.
 * @template T The type of the result value
 */
export interface Success<T> {
  readonly _tag: 'Success';
  readonly result: T;
  readonly title?: string;
  readonly message?: string;
}

/**
 * Represents a failed operation result.
 * @template _T The type parameter (for type compatibility, unused but required for union type)
 */
export interface Fail<_T = never> {
  readonly _tag: 'Fail';
  readonly error: unknown;
  readonly stackTrace?: string;
  readonly title?: string;
  readonly message?: string;
}

/**
 * A discriminated union representing either a successful or failed operation.
 * @template T The type of the success result
 */
export type TurboResponse<T> = Success<T> | Fail<T>;

/**
 * Creates a successful TurboResponse.
 * @template T The type of the result value
 * @param result The success value
 * @param title Optional title for the success
 * @param message Optional message for the success
 * @returns A Success TurboResponse
 */
export function success<T>(
  result: T,
  title?: string,
  message?: string
): Success<T> {
  return {
    _tag: 'Success',
    result,
    title,
    message,
  };
}

/**
 * Creates a failed TurboResponse.
 * @template T The type parameter (for type compatibility)
 * @param error The error that occurred
 * @param title Optional title for the failure
 * @param message Optional message for the failure
 * @param stackTrace Optional stack trace
 * @returns A Fail TurboResponse
 */
export function fail<T>(
  error: unknown,
  title?: string,
  message?: string,
  stackTrace?: string
): Fail<T> {
  return {
    _tag: 'Fail',
    error,
    stackTrace,
    title,
    message,
  };
}

/**
 * Type guard to check if a TurboResponse is a Success.
 * @template T The type of the result value
 * @param r The TurboResponse to check
 * @returns True if the response is a Success
 */
export function isSuccess<T>(r: TurboResponse<T>): r is Success<T> {
  return r._tag === 'Success';
}

/**
 * Type guard to check if a TurboResponse is a Fail.
 * @template T The type of the result value
 * @param r The TurboResponse to check
 * @returns True if the response is a Fail
 */
export function isFail<T>(r: TurboResponse<T>): r is Fail<T> {
  return r._tag === 'Fail';
}

/**
 * Pattern matching for TurboResponse. Executes one of the provided handlers based on the response type.
 * @template T The type of the result value
 * @template R The return type of the handlers
 * @param response The TurboResponse to match against
 * @param handlers Object containing success and fail handlers
 * @returns The result of executing the appropriate handler
 */
export function when<T, R>(
  response: TurboResponse<T>,
  handlers: {
    success: (s: Success<T>) => R;
    fail: (f: Fail<T>) => R;
  }
): R {
  return isSuccess(response)
    ? handlers.success(response)
    : handlers.fail(response);
}

/**
 * Pattern matching for TurboResponse with optional handlers and a fallback.
 * @template T The type of the result value
 * @template R The return type of the handlers
 * @param response The TurboResponse to match against
 * @param handlers Object containing optional success and fail handlers, and required orElse handler
 * @returns The result of executing the appropriate handler or the orElse handler
 */
export function maybeWhen<T, R>(
  response: TurboResponse<T>,
  handlers: {
    success?: (s: Success<T>) => R;
    fail?: (f: Fail<T>) => R;
    orElse: () => R;
  }
): R {
  if (isSuccess(response) && handlers.success) {
    return handlers.success(response);
  }
  if (isFail(response) && handlers.fail) {
    return handlers.fail(response);
  }
  return handlers.orElse();
}

/**
 * Folds a TurboResponse into a single value by applying the appropriate function.
 * @template T The type of the result value
 * @template R The return type
 * @param response The TurboResponse to fold
 * @param onSuccess Function to apply to the success value
 * @param onFail Function to apply to the error
 * @returns The result of applying the appropriate function
 */
export function fold<T, R>(
  response: TurboResponse<T>,
  onSuccess: (t: T) => R,
  onFail: (e: unknown) => R
): R {
  return isSuccess(response)
    ? onSuccess(response.result)
    : onFail(response.error);
}

/**
 * Maps the success value of a TurboResponse to a new value.
 * @template T The type of the input result value
 * @template R The type of the output result value
 * @param r The TurboResponse to map
 * @param fn The mapping function
 * @returns A new TurboResponse with the mapped value, or the original Fail
 */
export function mapSuccess<T, R>(
  r: TurboResponse<T>,
  fn: (t: T) => R
): TurboResponse<R> {
  return isSuccess(r)
    ? success(fn(r.result), r.title, r.message)
    : (r as unknown as Fail<R>);
}

/**
 * Chains a TurboResponse-returning function to a TurboResponse.
 * @template T The type of the input result value
 * @template R The type of the output result value
 * @param r The TurboResponse to chain
 * @param fn The function to apply to the success value
 * @returns The result of applying the function, or the original Fail
 */
export function andThen<T, R>(
  r: TurboResponse<T>,
  fn: (t: T) => TurboResponse<R>
): TurboResponse<R> {
  return isSuccess(r) ? fn(r.result) : (r as unknown as Fail<R>);
}

/**
 * Async version of andThen. Chains an async TurboResponse-returning function to a TurboResponse.
 * @template T The type of the input result value
 * @template R The type of the output result value
 * @param r The TurboResponse to chain
 * @param fn The async function to apply to the success value
 * @returns A Promise of the result of applying the function, or the original Fail
 */
export async function andThenAsync<T, R>(
  r: TurboResponse<T>,
  fn: (t: T) => Promise<TurboResponse<R>>
): Promise<TurboResponse<R>> {
  return isSuccess(r) ? await fn(r.result) : (r as unknown as Fail<R>);
}

/**
 * Maps the error of a TurboResponse to a new error.
 * @template T The type of the result value
 * @param r The TurboResponse to map
 * @param fn The mapping function for the error
 * @returns A new TurboResponse with the mapped error, or the original Success
 */
export function mapFail<T>(
  r: TurboResponse<T>,
  fn: (e: unknown) => unknown
): TurboResponse<T> {
  return isFail(r)
    ? fail(fn(r.error), r.title, r.message, r.stackTrace)
    : r;
}

/**
 * Unwraps a TurboResponse, returning the success value or throwing the error.
 * @template T The type of the result value
 * @param r The TurboResponse to unwrap
 * @returns The success value
 * @throws The error if the response is a Fail
 */
export function unwrap<T>(r: TurboResponse<T>): T {
  if (isSuccess(r)) {
    return r.result;
  }
  throw r.error;
}

/**
 * Unwraps a TurboResponse, returning the success value or a default value.
 * @template T The type of the result value
 * @param r The TurboResponse to unwrap
 * @param defaultValue The default value to return if the response is a Fail
 * @returns The success value or the default value
 */
export function unwrapOr<T>(r: TurboResponse<T>, defaultValue: T): T {
  return isSuccess(r) ? r.result : defaultValue;
}

/**
 * Unwraps a TurboResponse, returning the success value or computing a default value.
 * @template T The type of the result value
 * @param r The TurboResponse to unwrap
 * @param compute Function to compute the default value if the response is a Fail
 * @returns The success value or the computed default value
 */
export function unwrapOrCompute<T>(r: TurboResponse<T>, compute: () => T): T {
  return isSuccess(r) ? r.result : compute();
}

/**
 * Attempts to recover from a Fail by applying a recovery function.
 * @template T The type of the result value
 * @param r The TurboResponse to recover
 * @param fn The recovery function
 * @returns The original Success or the result of the recovery function
 */
export function recover<T>(
  r: TurboResponse<T>,
  fn: (e: unknown) => TurboResponse<T>
): TurboResponse<T> {
  return isFail(r) ? fn(r.error) : r;
}

/**
 * Async version of recover. Attempts to recover from a Fail by applying an async recovery function.
 * @template T The type of the result value
 * @param r The TurboResponse to recover
 * @param fn The async recovery function
 * @returns A Promise of the original Success or the result of the recovery function
 */
export async function recoverAsync<T>(
  r: TurboResponse<T>,
  fn: (e: unknown) => Promise<TurboResponse<T>>
): Promise<TurboResponse<T>> {
  return isFail(r) ? await fn(r.error) : r;
}

/**
 * Swaps Success and Fail. Success becomes Fail and Fail becomes Success.
 * @template T The type of the result value
 * @param r The TurboResponse to swap
 * @returns A swapped TurboResponse
 */
export function swap<T>(r: TurboResponse<T>): TurboResponse<T> {
  return isSuccess(r)
    ? fail(r.result, r.title, r.message)
    : success(r.error as T, r.title, r.message);
}

/**
 * Ensures the success value satisfies a predicate, converting to Fail if it doesn't.
 * @template T The type of the result value
 * @param r The TurboResponse to check
 * @param predicate The predicate to test the success value
 * @param error The error to use if the predicate fails
 * @returns The original response if Success and predicate passes, or a new Fail
 */
export function ensure<T>(
  r: TurboResponse<T>,
  predicate: (t: T) => boolean,
  error: unknown
): TurboResponse<T> {
  return isSuccess(r) && !predicate(r.result)
    ? fail(error, r.title, r.message)
    : r;
}

/**
 * Traverses an array of items, applying an async function to each and collecting the results.
 * If any operation fails, returns the first failure.
 * @template T The type of the input items
 * @template R The type of the result values
 * @param items The array of items to traverse
 * @param fn The async function to apply to each item
 * @returns A Promise of TurboResponse containing an array of all results, or the first failure
 */
export async function traverse<T, R>(
  items: T[],
  fn: (item: T) => Promise<TurboResponse<R>>
): Promise<TurboResponse<R[]>> {
  const results: R[] = [];

  for (const item of items) {
    const response = await fn(item);
    if (isFail(response)) {
      return response as unknown as Fail<R[]>;
    }
    results.push(response.result);
  }

  return success(results);
}

/**
 * Combines an array of TurboResponses into a single TurboResponse containing an array.
 * If any response is a Fail, returns the first failure.
 * @template T The type of the result values
 * @param responses The array of TurboResponses to combine
 * @returns A TurboResponse containing an array of all results, or the first failure
 */
export function sequence<T>(
  responses: TurboResponse<T>[]
): TurboResponse<T[]> {
  const results: T[] = [];

  for (const response of responses) {
    if (isFail(response)) {
      return response as unknown as Fail<T[]>;
    }
    results.push(response.result);
  }

  return success(results);
}

/**
 * Gets the result value from a TurboResponse if it's a Success, otherwise returns undefined.
 * @template T The type of the result value
 * @param r The TurboResponse to extract from
 * @returns The result value or undefined
 */
export function getResult<T>(r: TurboResponse<T>): T | undefined {
  return isSuccess(r) ? r.result : undefined;
}

/**
 * Gets the error from a TurboResponse if it's a Fail, otherwise returns undefined.
 * @template T The type of the result value
 * @param r The TurboResponse to extract from
 * @returns The error or undefined
 */
export function getError<T>(r: TurboResponse<T>): unknown | undefined {
  return isFail(r) ? r.error : undefined;
}

/**
 * Gets the title from a TurboResponse.
 * @template T The type of the result value
 * @param r The TurboResponse to extract from
 * @returns The title or undefined
 */
export function getTitle<T>(r: TurboResponse<T>): string | undefined {
  return r.title;
}

/**
 * Gets the message from a TurboResponse.
 * @template T The type of the result value
 * @param r The TurboResponse to extract from
 * @returns The message or undefined
 */
export function getMessage<T>(r: TurboResponse<T>): string | undefined {
  return r.message;
}
