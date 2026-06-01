# Contributing

Thank you for contributing to ts2shell.

## Development setup

```bash
source ~/.nvm/nvm.sh && nvm use
cd ts2shell
yarn install
yarn build
yarn test
yarn docs:build
```

## Project rules

- All user-facing documentation and error messages are in **English**.
- License: **MIT** for all packages.
- Do **not** add a Language Server or VS Code extension package. IDE support uses TypeScript `paths` to `@ts2shell/std-types` only.
- Never use `throw new Error()` for compile failures; use `Ts2ShellError` subclasses with `TS2SHELL###` codes.
- Add tests for new emission or diagnostics (Vitest in `@ts2shell/core`).

## Pull requests

1. Run `yarn build`, `yarn lint`, and `yarn test` before opening a PR.
2. Update `packages/docs` if you change CLI flags, std APIs, or target capabilities.
3. Register new error codes in `packages/docs/src/content/docs/reference/errors.mdx`.
