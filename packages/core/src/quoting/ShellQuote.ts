/**
 * Shell string quoting utilities per target family.
 */
export namespace ShellQuote {
    /**
     * Single-quotes a string for POSIX shells.
     *
     * @param value - Raw string.
     * @returns Quoted string safe for bash/sh.
     */
    export function posixSingle(value: string): string {
        return `'${value.replace(/'/g, `'\"'\"'`)}'`;
    }

    /**
     * Double-quotes for PowerShell.
     *
     * @param value - Raw string.
     * @returns Quoted PowerShell string.
     */
    export function ps1Double(value: string): string {
        return `"${value.replace(/`/g, "``").replace(/"/g, '`"').replace(/\$/g, "`$")}"`;
    }

    /**
     * Quotes for cmd.exe set arguments.
     *
     * @param value - Raw string.
     * @returns Quoted batch string.
     */
    export function batArg(value: string): string {
        if (/[\s^&|<>()%"]/.test(value)) {
            return `"${value.replace(/"/g, '""')}"`;
        }

        return value;
    }
}
