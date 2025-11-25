/**
 * TurboException represents a general exception that can hold additional context
 * including an error object, title, message, and stack trace.
 */
export class TurboException extends Error {
  /**
   * The underlying error object, if any.
   */
  readonly error?: unknown;

  /**
   * An optional title for the exception.
   */
  readonly title?: string;

  /**
   * The exception message.
   */
  override readonly message: string;

  /**
   * An optional stack trace string.
   */
  readonly stackTrace?: string;

  /**
   * Returns true if the exception has a title.
   */
  get hasTitle(): boolean {
    return this.title !== undefined && this.title !== null;
  }

  /**
   * Returns true if the exception has a message.
   */
  get hasMessage(): boolean {
    return this.message !== undefined && this.message !== null && this.message !== '';
  }

  /**
   * Returns true if the exception has an error object.
   */
  get hasError(): boolean {
    return this.error !== undefined && this.error !== null;
  }

  /**
   * Creates a new TurboException.
   *
   * @param options - The exception options
   * @param options.error - The underlying error object
   * @param options.title - An optional title for the exception
   * @param options.message - The exception message
   * @param options.stackTrace - An optional stack trace string
   */
  constructor(options: {
    error?: unknown;
    title?: string;
    message?: string;
    stackTrace?: string;
  }) {
    super(options.message || 'An error occurred');
    this.name = 'TurboException';
    this.error = options.error;
    this.title = options.title;
    this.message = options.message || 'An error occurred';
    this.stackTrace = options.stackTrace;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if ('captureStackTrace' in Error) {
      (Error as { captureStackTrace(target: object, constructor: Function): void }).captureStackTrace(this, TurboException);
    }
  }
}
