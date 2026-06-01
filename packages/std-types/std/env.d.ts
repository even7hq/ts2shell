/** Environment variable helpers (session / child processes). */
export namespace Env {
    /**
     * Sets a session environment variable.
     *
     * @param name - Variable name.
     * @param value - Variable value.
     */
    export function set(name: string, value: string): void;

    /**
     * Reads an environment variable at script runtime.
     *
     * @param name - Variable name.
     * @returns The value, or empty string if unset.
     */
    export function get(name: string): string;
}
