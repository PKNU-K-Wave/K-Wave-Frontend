# Dependency check - 2026-10-29

The existing lockfile produced security advisories during the release push.
Vite was upgraded from 5.4.21 to 6.4.5, and compatible dependency ranges were
refreshed in yarn.lock (including esbuild, PostCSS, source-map-js, browserslist,
nanoid, selector parsing and brace-expansion packages).

After refreshing the lockfile, `yarn audit --json` reported:

```text
info: 0, low: 0, moderate: 0, high: 0, critical: 0
```

This is an advisory-database result at the time of the check, not proof that all
application code or server infrastructure is secure. ESLint 8 and some transitive
utilities still emit maintenance/deprecation notices; a coordinated lint-toolchain
upgrade is future maintenance, separate from these advisory fixes.

The patched Vite engine supports Node 18, Node 20 and Node 22+. Verification uses
Node 20.15.1. Reinstall with the committed lockfile before building on the server;
do not reuse an old node_modules directory. Windows esbuild executables can be
locked by a running local development process, so the release is also validated
with a fresh isolated installation rather than relying on the old working install.
