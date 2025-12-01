/**
 * Unceremoniously bail with an uncaught exception
 * @param message message to include in the trace
 * @returns never
 * @example might_be_undefined ?? panic("Something went wrong")
 */
export const panic = (message: string): never => {
    throw new Error(message);
};
