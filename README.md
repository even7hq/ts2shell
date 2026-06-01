# ts2shell

Transpile **TypeScript** to **bash**, **POSIX sh**, **PowerShell**, or **Windows batch** with one toolchain and a seamless `.ts` authoring experience.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Features

- **Multi-target output**: `--target bash | sh | ps1 | bat`
- **Standard library** via `std/*` modules (`std/io`, `std/env`, `std/shell`, …)
- **Environment API**: `Env.set` / `Env.get` from `std/env`
- **Per-target implementations**: `switch (TARGET)` with compile-time branch folding
- **Typed errors**: `TS2SHELL###` codes with source snippets and fix hints
- **No custom LSP**: use built-in TypeScript IntelliSense + `paths` to `@ts2shell/std-types`

## Installation

```bash
git clone <repository-url>
cd ts2shell
yarn install
yarn build
```

## Quick start

```bash
yarn ts2shell compile examples/hello.ts --target bash -o dist/hello.sh
chmod +x dist/hello.sh
./dist/hello.sh
```

Compile the same file for other shells:

```bash
yarn ts2shell compile examples/hello.ts --target ps1 -o dist/hello.ps1
yarn ts2shell compile examples/hello.ts --target bat -o dist/hello.bat
yarn ts2shell compile examples/hello.ts --target sh -o dist/hello-posix.sh
```

### Example source

```typescript
import { Env } from "std/env";
import { echo } from "std/io";
import { exec, test } from "std/shell";

Env.set("DEBUG", "1");
const flags = ["-la", "-h"];

for (const arg of flags) {
    if (test("-n", arg)) {
        echo("flag:", arg);
    }
}

exec("ls", ...flags, "/tmp");
```

## Documentation

Full docs (English) live in the Astro site:

```bash
yarn docs:dev
```

See `packages/docs` for Getting started, CLI reference, target capability matrix, and error catalog.

## Supported targets (summary)

| Target | Extension | Notes |
|--------|-----------|--------|
| `bash` | `.sh` | Full feature set (arrays, objects, `for…of`) |
| `sh` | `.sh` | POSIX subset; no object literals |
| `ps1` | `.ps1` | PowerShell arrays and `$env:` |
| `bat` | `.bat` | cmd.exe; limited arrays |

Details: [reference/targets](packages/docs/src/content/docs/reference/targets.mdx) in the docs site.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
