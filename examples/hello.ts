import { Env } from "std/env";
import { echo } from "std/io";
import { exec, test } from "std/shell";

const config = { dir: "/tmp", recursive: "true" };
const flags = ["-la", "-h"];

Env.set("DEBUG", "1");

for (const arg of flags) {
    if (test("-n", arg)) {
        echo("flag:", arg);
    }
}

exec("ls", ...flags, config.dir);
