import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const directory = fileURLToPath(new URL('../tests/', import.meta.url));
const files = readdirSync(directory).filter(name => name.endsWith('.test.mjs')).sort().map(name => join(directory, name));
if (!files.length) throw new Error('No test files found.');
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
