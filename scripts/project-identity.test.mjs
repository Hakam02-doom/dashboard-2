import test from 'node:test';
import assert from 'node:assert/strict';
import { config, validateIdentity } from './project-identity.mjs';
const valid = {folder:config.directory,remote:`https://github.com/${config.repository}.git`,link:{projectId:config.vercelProjectId,orgId:config.vercelOrgId,projectName:config.vercelProject}};
test('accepts correct project and SSH remote', () => { validateIdentity(valid); validateIdentity({...valid,remote:`git@github.com:${config.repository}.git`}); });
test('rejects another checkout, remote, or push target', () => {
  assert.throws(() => validateIdentity({...valid,folder:'other-dashboard'}));
  assert.throws(() => validateIdentity({...valid,remote:'https://github.com/example/other.git'}));
  assert.throws(() => validateIdentity({...valid,pushRemote:'https://github.com/example/other.git'}));
});
test('rejects incorrect or missing production link', () => {
  assert.throws(() => validateIdentity({...valid,link:{...valid.link,projectId:'other'}}));
  assert.throws(() => validateIdentity({...valid,link:undefined,requireLink:true}));
});
test('rejects environment overrides and wrong cloud repository', () => {
  for (const env of [{VERCEL_PROJECT_ID:'other'},{VERCEL_ORG_ID:'other'},{VERCEL_GIT_REPO_SLUG:'other'},{VERCEL_GIT_REPO_OWNER:'other'}]) assert.throws(() => validateIdentity({...valid,env}));
});

test('accepts Vercel cloud links containing only IDs, but rejects wrong project names', () => {
  validateIdentity({...valid,link:{projectId:config.vercelProjectId,orgId:config.vercelOrgId}});
  assert.throws(() => validateIdentity({...valid,link:{...valid.link,projectName:'other'}}));
});
