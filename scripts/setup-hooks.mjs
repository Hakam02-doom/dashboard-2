import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { root } from './project-identity.mjs';
import { join } from 'node:path';
if (process.env.VERCEL !== '1' && existsSync(join(root, '.git'))) execFileSync('git', ['config', 'core.hooksPath', '.githooks'], {cwd:root});
