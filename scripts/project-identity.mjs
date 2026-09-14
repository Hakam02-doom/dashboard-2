import { readFileSync, realpathSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = realpathSync(join(dirname(fileURLToPath(import.meta.url)), '..'));
export const config = JSON.parse(readFileSync(join(root, 'dashboard.config.json'), 'utf8'));
export const normalizeRemote = value => value.trim().replace(/^git@github\.com:/, 'https://github.com/').replace(/\.git$/, '').replace(/\/$/, '').toLowerCase();
export function validateIdentity({ folder, repositoryRoot, remote, link, env = {}, requireLink = false, pushRemote }) {
  const fail = message => { throw new Error(`Dashboard ${config.number}: ${message}`); };
  if (folder !== config.directory) fail(`use the ${config.directory} folder, not ${folder}.`);
  if (repositoryRoot && realpathSync(repositoryRoot) !== root) fail('nested or shared Git repository detected.');
  const expected = normalizeRemote(`https://github.com/${config.repository}`);
  if (remote && normalizeRemote(remote) !== expected) fail(`origin must be ${config.repository}.`);
  if (pushRemote && normalizeRemote(pushRemote) !== expected) fail('push destination belongs to another repository.');
  if (link && (link.projectId !== config.vercelProjectId || link.orgId !== config.vercelOrgId || (link.projectName && link.projectName !== config.vercelProject))) fail('Vercel link belongs to another dashboard.');
  if (requireLink && !link) fail('missing .vercel/project.json; link the correct project first.');
  if (env.VERCEL_PROJECT_ID && env.VERCEL_PROJECT_ID !== config.vercelProjectId) fail('VERCEL_PROJECT_ID targets another dashboard.');
  if (env.VERCEL_ORG_ID && env.VERCEL_ORG_ID !== config.vercelOrgId) fail('VERCEL_ORG_ID targets another account.');
  if (env.VERCEL_GIT_REPO_SLUG && env.VERCEL_GIT_REPO_SLUG !== config.repository.split('/')[1]) fail('Vercel is building the wrong repository.');
  if (env.VERCEL_GIT_REPO_OWNER && env.VERCEL_GIT_REPO_OWNER.toLowerCase() !== config.repository.split('/')[0].toLowerCase()) fail('Vercel repository owner does not match.');
}
export function checkIdentity({ deploy = false, pushRemote } = {}) {
  const onVercel = process.env.VERCEL === '1';
  let repositoryRoot, remote;
  if (existsSync(join(root, '.git'))) {
    repositoryRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {cwd:root, encoding:'utf8'}).trim();
    remote = execFileSync('git', ['remote', 'get-url', 'origin'], {cwd:root, encoding:'utf8'}).trim();
  } else if (!onVercel) throw new Error('This folder must have its own Git repository.');
  const linkPath = join(root, '.vercel/project.json');
  const link = existsSync(linkPath) ? JSON.parse(readFileSync(linkPath, 'utf8')) : undefined;
  validateIdentity({folder:onVercel ? config.directory : basename(root), repositoryRoot, remote, link, env:process.env, requireLink:deploy, pushRemote});
  console.log(`Dashboard ${config.number} verified · ${config.repository} · ${config.vercelProject}`);
}
