import { spawnSync } from 'node:child_process';
import { readFileSync, realpathSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname, sep } from 'node:path';
import { checkIdentity, root, config } from './project-identity.mjs';

const [command = 'check', ...args] = process.argv.slice(2);
function run(binary, args) {
  const result = spawnSync(binary, args, {cwd:root, stdio:'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
try {
  if (command === 'check-push') {
    checkIdentity({pushRemote:args[1]});
  } else {
    if (args.length) throw new Error('Port, root, and deployment overrides are disabled. Use dashboard.config.json in the intended project.');
    checkIdentity({deploy:command === 'deploy'});
    const vite = join(root, 'node_modules/vite/bin/vite.js');
    const build = () => config.kind === 'static' ? run(process.execPath, ['--check', join(root, 'dist/app.js')]) : run(process.execPath, [vite, 'build']);
    if (command === 'build') build();
    else if (command === 'deploy') {
      build();
      run('npm', ['exec', '--yes', '--package=vercel@59.16.0', '--', 'vercel', 'deploy', '--prod', '--yes', '--scope', config.vercelScope]);
    } else if (command === 'dev' || command === 'preview') {
      const port = command === 'dev' ? config.devPort : config.previewPort;
      if (config.kind !== 'static') run(process.execPath, [vite, ...(command === 'preview' ? ['preview'] : []), '--host', '127.0.0.1', '--port', String(port), '--strictPort']);
      else {
        const publicRoot = realpathSync(join(root, 'dist'));
        const types = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.png':'image/png', '.woff2':'font/woff2'};
        const server = createServer((req,res) => {
          try {
            const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
            const target = realpathSync(join(publicRoot, pathname === '/' ? 'index.html' : pathname));
            if (!target.startsWith(publicRoot + sep) || !statSync(target).isFile()) throw new Error('Not found');
            res.writeHead(200, {'Content-Type':types[extname(target)] || 'application/octet-stream','Cache-Control':'no-store'});
            res.end(readFileSync(target));
          } catch { res.writeHead(404); res.end('Not found'); }
        });
        server.on('error', error => { console.error(`Cannot start Dashboard ${config.number} on its fixed port ${port}: ${error.message}`); process.exit(1); });
        server.listen(port, '127.0.0.1', () => console.log(`Dashboard ${config.number}: http://127.0.0.1:${port}/`));
      }
    } else if (command !== 'check') throw new Error(`Unknown dashboard command: ${command}`);
  }
} catch (error) { console.error(error.message); process.exit(1); }
