import { createServer } from 'http';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const IS_WINDOWS = process.platform === 'win32';

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolveProjectRoot() {
  if (process.env.SUPASLIDEV_PROJECT_ROOT) {
    return process.env.SUPASLIDEV_PROJECT_ROOT;
  }
  return join(__dirname, '..', '..', '..');
}

function resolvePresentationsDir() {
  if (process.env.SUPASLIDEV_PRESENTATIONS_DIR) {
    return process.env.SUPASLIDEV_PRESENTATIONS_DIR;
  }
  return join(resolveProjectRoot(), 'presentations');
}

const projectRoot = resolveProjectRoot();
const presentationsDir = resolvePresentationsDir();
const workspaceRoot = join(projectRoot, '..');

const runningServers = new Map();

function getNextPort() {
  const usedPorts = new Set([...runningServers.values()].map((s) => s.port));
  let port = 3030;
  while (usedPorts.has(port)) {
    port++;
  }
  return port;
}

function startServer(presentationId) {
  if (runningServers.has(presentationId)) {
    return { success: true, port: runningServers.get(presentationId).port, alreadyRunning: true };
  }

  const port = getNextPort();
  const presentationPath = join(projectRoot, 'presentations', presentationId);
  const slidevBin = join(presentationPath, 'node_modules', '.bin', 'slidev');

  const child = spawn(slidevBin, ['--port', String(port), '--open', 'false'], {
    cwd: presentationPath,
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: !IS_WINDOWS,
    shell: IS_WINDOWS,
  });

  child.unref();

  runningServers.set(presentationId, { process: child, port });

  child.stderr.on('data', (data) => {
    console.error(`[${presentationId}] stderr:`, data.toString());
  });

  child.on('close', (code) => {
    console.log(`[${presentationId}] process exited with code ${code}`);
    runningServers.delete(presentationId);
  });

  child.on('error', (err) => {
    console.error(`Failed to start server for ${presentationId}:`, err);
    runningServers.delete(presentationId);
  });

  return { success: true, port, alreadyRunning: false };
}

function stopServer(presentationId) {
  const server = runningServers.get(presentationId);
  if (!server) {
    return { success: false, error: 'Server not running' };
  }

  if (IS_WINDOWS) {
    try {
      execSync(`taskkill /pid ${server.process.pid} /T /F`, { stdio: 'ignore' });
    } catch {
      // Process may have already exited
    }
  } else {
    server.process.kill('SIGTERM');
  }
  runningServers.delete(presentationId);
  return { success: true };
}

function stopAllServers() {
  const stopped = [];
  for (const [id] of runningServers) {
    const result = stopServer(id);
    if (result.success) {
      stopped.push(id);
    }
  }
  return { success: true, stopped };
}

function getStatus() {
  const servers = {};
  for (const [id, server] of runningServers) {
    servers[id] = { port: server.port };
  }
  return servers;
}

function exportPresentation(presentationId) {
  return new Promise((resolve) => {
    const presentationPath = join(projectRoot, 'presentations', presentationId);
    const exportsDir = join(projectRoot, 'exports');
    const outputPath = join(exportsDir, `${presentationId}.pdf`);

    if (!existsSync(presentationPath)) {
      resolve({ success: false, error: 'Presentation not found' });
      return;
    }

    if (!existsSync(exportsDir)) {
      mkdirSync(exportsDir, { recursive: true });
    }

    console.log(`[export] Starting export for ${presentationId}`);
    console.log(`[export] Output: ${outputPath}`);

    const child = spawn('npx', ['slidev', 'export', '--output', outputPath], {
      cwd: presentationPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`[export] ${data.toString().trim()}`);
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`[export] ${data.toString().trim()}`);
    });

    child.on('error', (err) => {
      console.error(`[export] Failed to export ${presentationId}:`, err);
      resolve({ success: false, error: `Export failed: ${err.message}` });
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`[export] Export complete for ${presentationId}`);
        resolve({
          success: true,
          pdfPath: `/exports/${presentationId}.pdf`,
          filename: `${presentationId}.pdf`,
        });
      } else {
        console.error(`[export] Export failed with code ${code}`);
        resolve({ success: false, error: `Export failed with exit code ${code}. ${stderr}` });
      }
    });
  });
}

function createPresentation({ name }) {
  return new Promise((resolve) => {
    const presentationPath = join(presentationsDir, name);

    if (existsSync(presentationPath)) {
      resolve({
        success: false,
        field: 'name',
        message: 'A presentation with this name already exists',
      });
      return;
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(name)) {
      resolve({
        success: false,
        field: 'name',
        message: 'Name must be a valid slug (lowercase letters, numbers, hyphens only)',
      });
      return;
    }

    const child = spawn('pnpm', ['create', 'slidev', name], {
      cwd: presentationsDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    let stderr = '';
    let scaffoldingDone = false;

    child.stdout.on('data', (data) => {
      const text = data.toString();

      if (text.includes('Done.') && !scaffoldingDone) {
        scaffoldingDone = true;
        setTimeout(() => {
          child.kill('SIGTERM');
        }, 100);
      }
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      resolve({ success: false, message: `Failed to create presentation: ${err.message}` });
    });

    child.on('close', () => {
      if (!scaffoldingDone) {
        resolve({ success: false, message: `Slidev CLI failed. ${stderr}` });
        return;
      }

      const packageJsonPath = join(presentationPath, 'package.json');
      const catalogPackageJson = {
        name: `@supaslidev/${name}`,
        private: true,
        type: 'module',
        scripts: {
          build: 'slidev build',
          dev: 'slidev --open',
          export: 'slidev export',
        },
        dependencies: {
          '@slidev/cli': 'catalog:',
          '@slidev/theme-default': 'catalog:',
          '@slidev/theme-seriph': 'catalog:',
          vue: 'catalog:',
        },
        devDependencies: {},
      };

      writeFileSync(packageJsonPath, JSON.stringify(catalogPackageJson, null, 2) + '\n');

      resolve({
        success: true,
        presentation: {
          id: name,
          title: name,
          description: '',
          theme: 'default',
          background: 'https://cover.sli.dev',
          duration: '',
        },
      });

      const install = spawn('pnpm', ['install'], {
        cwd: workspaceRoot,
        stdio: 'inherit',
        shell: true,
        detached: true,
      });
      install.unref();
    });
  });
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  if (path === '/api/servers' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify(getStatus()));
    return;
  }

  if (path === '/api/servers' && req.method === 'DELETE') {
    const result = stopAllServers();
    res.writeHead(200);
    res.end(JSON.stringify(result));
    return;
  }

  if (path === '/api/servers/stop-all' && req.method === 'POST') {
    const result = stopAllServers();
    res.writeHead(200);
    res.end(JSON.stringify(result));
    return;
  }

  if (path.startsWith('/api/servers/') && req.method === 'POST') {
    const presentationId = path.split('/api/servers/')[1];
    const result = startServer(presentationId);
    res.writeHead(result.success ? 200 : 500);
    res.end(JSON.stringify(result));
    return;
  }

  if (path.startsWith('/api/servers/') && req.method === 'DELETE') {
    const presentationId = path.split('/api/servers/')[1];
    const result = stopServer(presentationId);
    res.writeHead(result.success ? 200 : 404);
    res.end(JSON.stringify(result));
    return;
  }

  if (path === '/api/presentations' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const result = await createPresentation(data);
        if (result.success) {
          res.writeHead(201);
          res.end(JSON.stringify(result.presentation));
        } else {
          res.writeHead(400);
          res.end(JSON.stringify({ field: result.field, message: result.message }));
        }
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ message: 'Invalid JSON' }));
      }
    });
    return;
  }

  if (path.startsWith('/api/export/') && req.method === 'POST') {
    const presentationId = path.split('/api/export/')[1];
    const result = await exportPresentation(presentationId);
    res.writeHead(result.success ? 200 : 400);
    res.end(JSON.stringify(result));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const API_PORT = 3001;

server.listen(API_PORT, () => {
  console.log(`API server running on http://localhost:${API_PORT}`);
});

process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  for (const [id] of runningServers) {
    stopServer(id);
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  for (const [id] of runningServers) {
    stopServer(id);
  }
  process.exit(0);
});
