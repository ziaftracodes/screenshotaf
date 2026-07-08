const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn, execSync } = require('child_process');
const { chromium } = require('playwright');

// --- HTML UI ---
const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ScreenshotAF Dashboard</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z'></path><circle cx='12' cy='13' r='4'></circle></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root { 
      --bg: #09090b; 
      --surface: #18181b; 
      --text: #ffffff; 
      --border: #27272a;
      --accent: #38bdf8;
      --accent-hover: #0284c7;
      --font-sans: 'Outfit', sans-serif;
      --font-serif: 'Cormorant Garamond', serif;
    }
    * {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    *::-webkit-scrollbar {
      display: none;
    }
    body { 
      font-family: var(--font-sans); 
      background: var(--bg); 
      color: var(--text); 
      margin: 0; 
      padding: 4rem 2rem; 
      -webkit-font-smoothing: antialiased;
    }
    .container { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 4rem; min-height: 90vh; }
    
    /* Typography */
    h1, h2, h3 { color: #f5ebd5; margin: 0; font-weight: 500; }
    h1 { 
      font-size: clamp(3.5rem, 7vw, 6rem); 
      line-height: 0.9; 
      letter-spacing: -0.05em; 
    }
    .serif-italic { font-family: var(--font-serif); font-style: italic; font-weight: 400; color: var(--accent); }
    .subtitle { 
      font-size: 1.15rem; 
      font-weight: 500; 
      color: #a1a1aa; 
      margin-top: 1.5rem;
      max-width: 600px;
      line-height: 1.4;
      border-left: 4px solid var(--accent);
      padding-left: 1.5rem;
    }
    .label {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1.5rem;
      border-radius: 9999px;
      background: rgba(56,189,248,0.05);
      border: 1px solid rgba(56,189,248,0.15);
      backdrop-filter: blur(12px);
      margin-bottom: 2rem;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--accent);
    }
    .label .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 10px var(--accent); }

    /* Header Layout */
    .hero-split {
      display: flex;
      flex-direction: column;
      gap: 4rem;
    }
    @media (min-width: 1024px) {
      .hero-split {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
      .hero-content { flex: 1; }
      .status-panel-wrapper { flex: 1; max-width: 600px; width: 100%; }
    }

    /* Controls */
    .controls-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem;
      margin-top: 3rem;
    }

    select {
      font-family: var(--font-sans);
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);
      padding: 1.25rem 2rem;
      font-size: 1rem;
      font-weight: 700;
      border-radius: 9999px;
      outline: none;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
    }

    button { 
      font-family: var(--font-sans); 
      background: var(--accent); 
      color: #000000; 
      border: none; 
      padding: 1.25rem 3rem; 
      font-size: 1rem; 
      font-weight: 900; 
      text-transform: uppercase; 
      letter-spacing: 0.1em; 
      border-radius: 9999px;
      cursor: pointer; 
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
      box-shadow: 0 10px 30px rgba(56, 189, 248, 0.2);
    }
    button:hover { transform: scale(1.05); background: #ffffff; box-shadow: 0 15px 40px rgba(255, 255, 255, 0.2); }
    button:disabled { background: #3f3f46; color: #a1a1aa; cursor: not-allowed; transform: none; box-shadow: none; }

    /* Status Panel */
    .status-panel { 
      background: var(--surface); 
      border: 1px solid var(--border); 
      padding: 2.5rem; 
      border-radius: 2.5rem;
      box-shadow: 0 40px 100px rgba(0,0,0,0.5); 
    }
    .status-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 2rem; }
    .status-header h3 { font-size: 2rem; font-weight: 800; letter-spacing: -0.04em; }
    .badge { 
      font-family: var(--font-sans); 
      font-size: 0.75rem; 
      padding: 0.5rem 1rem; 
      background: #27272a; 
      border: 1px solid #3f3f46; 
      border-radius: 9999px;
      text-transform: uppercase; 
      letter-spacing: 0.1em; 
      font-weight: 800; 
      color: #e4e4e7; 
    }
    .log-window { 
      background: #000000; 
      color: #4ade80; 
      font-family: 'Space Mono', monospace; 
      font-size: 0.85rem; 
      padding: 1.5rem; 
      height: 250px; 
      overflow-y: auto; 
      border: 1px solid var(--border);
      border-radius: 1.5rem;
    }
    .log-window::-webkit-scrollbar { display: none; }
    .log-window { -ms-overflow-style: none; scrollbar-width: none; }
    .log-window div { margin-bottom: 0.5rem; border-bottom: 1px solid #27272a; padding-bottom: 0.5rem; }

    /* Gallery */
    .gallery-section h2 { font-size: 3rem; letter-spacing: -0.04em; margin-bottom: 0.5rem; }
    .gallery-section p { font-size: 1.125rem; font-weight: 500; color: #a1a1aa; margin-bottom: 3rem; }
    
    .gallery { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); 
      gap: 2rem; 
    }
    .card { 
      background: var(--surface); 
      border: 1px solid var(--border); 
      border-radius: 2.5rem;
      overflow: hidden;
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); 
      display: flex;
      flex-direction: column;
    }
    .card:hover { 
      transform: translateY(-8px); 
      box-shadow: 0 40px 100px rgba(0,0,0,0.5); 
    }
    .card-img-wrapper { 
      background: #27272a; 
      aspect-ratio: 16/10; 
      display: flex; 
      align-items: flex-start; 
      justify-content: center; 
      overflow: hidden;
    }
    .card img { width: 100%; height: auto; object-fit: cover; transition: transform 0.7s ease; }
    .card:hover img { transform: scale(1.03); }
    .card .info { padding: 2rem; display: flex; flex-direction: column; flex: 1; }
    .card .info .route-name { 
      font-size: 1.75rem; 
      font-weight: 800; 
      letter-spacing: -0.03em;
      color: var(--text); 
      margin-bottom: 1.5rem; 
    }
    .info-row { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
    .device-tag { 
      display: inline-flex; 
      padding: 0.4rem 1rem; 
      background: rgba(56, 189, 248, 0.1); 
      color: var(--accent); 
      border: 1px solid rgba(56, 189, 248, 0.2);
      font-size: 0.75rem; 
      font-weight: 800;
      text-transform: uppercase; 
      letter-spacing: 0.1em; 
      border-radius: 9999px;
    }
    .filename { font-size: 0.85rem; color: #a1a1aa; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero-split">
      <div class="hero-content">
        <div class="label"><span class="dot"></span>By Fayz Khan</div>
        <h1>Screenshot<br/>AF.</h1>
        <p class="subtitle">A curated collection of your <span class="serif-italic">finest web pages</span>. Captured automatically, perfectly scaled, and ready for review.</p>
        
        <div class="controls-row">
          <select id="folderStructure">
            <option value="route/device">Route > Device Folder</option>
            <option value="device/route">Device > Route Folder</option>
            <option value="flat">Flat Folder (No Nesting)</option>
          </select>
          <button id="startBtn" onclick="startProcess()">Start Capture</button>
        </div>
      </div>

      <div class="status-panel-wrapper">
        <div class="status-panel">
          <div class="status-header">
            <h3>Console</h3>
            <span id="statusBadge" class="badge">Idle</span>
          </div>
          <div class="log-window" id="logWindow"></div>
        </div>
      </div>
    </div>

    <div class="gallery-section">
      <h2>Captured.</h2>
      <p>Flagship captures pushing the boundaries of design.</p>
      <div class="gallery" id="gallery"></div>
    </div>

    <footer style="margin-top: 6rem; padding-top: 4rem; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 3rem; font-family: var(--font-sans);">
      <div style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">Made by <span style="color: var(--accent);">Fayz Khan</span></div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem;">
        
        <div>
          <a href="https://fayzz.in" target="_blank" style="color: var(--text); text-decoration: none; font-weight: 700; font-size: 1.1rem; letter-spacing: 0.05em; text-transform: uppercase; transition: color 0.2s; display: block; margin-bottom: 0.5rem;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text)'">Portfolio &rarr;</a>
          <div style="color: #a1a1aa; font-size: 0.9rem; line-height: 1.5;">Explore my latest projects, case studies, and engineering journey.</div>
        </div>

        <div>
          <a href="https://store.fayzz.in" target="_blank" style="color: var(--text); text-decoration: none; font-weight: 700; font-size: 1.1rem; letter-spacing: 0.05em; text-transform: uppercase; transition: color 0.2s; display: block; margin-bottom: 0.5rem;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text)'">FayzStore &rarr;</a>
          <div style="color: #a1a1aa; font-size: 0.9rem; line-height: 1.5;">Premium digital assets, tools, and design systems for creators.</div>
        </div>

        <div>
          <a href="https://instagram.com/fayz.dev" target="_blank" style="color: var(--text); text-decoration: none; font-weight: 700; font-size: 1.1rem; letter-spacing: 0.05em; text-transform: uppercase; transition: color 0.2s; display: block; margin-bottom: 0.5rem;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text)'">@fayz.dev &rarr;</a>
          <div style="color: #a1a1aa; font-size: 0.9rem; line-height: 1.5;">Follow my daily life, behind-the-scenes coding, and design experiments.</div>
        </div>

      </div>
      <div style="color: #52525b; font-size: 0.85rem; margin-top: 2rem;">&copy; 2026 Fayz Khan. All rights reserved.</div>
    </footer>
  </div>

  <script>
    const logWindow = document.getElementById('logWindow');
    const gallery = document.getElementById('gallery');
    const startBtn = document.getElementById('startBtn');
    const statusBadge = document.getElementById('statusBadge');
    const folderStructure = document.getElementById('folderStructure');

    function log(msg) {
      const div = document.createElement('div');
      div.textContent = msg;
      logWindow.appendChild(div);
      logWindow.scrollTop = logWindow.scrollHeight;
    }

    function addScreenshot(data) {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = \`
        <div class="card-img-wrapper">
          <img src="\${data.url}" alt="\${data.route}">
        </div>
        <div class="info">
          <div class="route-name">\${data.route === '/' || data.route === '' ? 'Home' : data.route}</div>
          <div class="info-row">
            <span class="device-tag">\${data.device}</span>
            <span class="filename">\${data.filename}</span>
          </div>
        </div>
      \`;
      gallery.appendChild(card);
    }

    function startProcess() {
      startBtn.disabled = true;
      folderStructure.disabled = true;
      statusBadge.textContent = 'Running...';
      statusBadge.style.background = 'var(--accent)';
      statusBadge.style.color = '#000000';
      statusBadge.style.border = '1px solid var(--accent)';
      logWindow.innerHTML = '';
      gallery.innerHTML = '';
      
      const eventSource = new EventSource('/api/events');
      
      eventSource.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'log') {
          log(data.msg);
        } else if (data.type === 'screenshot') {
          addScreenshot(data);
        } else if (data.type === 'done') {
          statusBadge.textContent = 'Complete';
          statusBadge.style.background = '#27272a';
          statusBadge.style.color = 'var(--accent)';
          statusBadge.style.border = '1px solid rgba(56, 189, 248, 0.3)';
          startBtn.disabled = false;
          folderStructure.disabled = false;
          eventSource.close();
        } else if (data.type === 'error') {
          statusBadge.textContent = 'Error';
          statusBadge.style.background = '#ef4444';
          statusBadge.style.color = '#fff';
          startBtn.disabled = false;
          folderStructure.disabled = false;
          eventSource.close();
        }
      };

      fetch('/api/start?structure=' + encodeURIComponent(folderStructure.value), { method: 'POST' }).catch(err => log('Failed to start: ' + err));
    }
  </script>
</body>
</html>
`;

// --- SSE Client Manager ---
const clients = new Set();
function broadcast(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    client.write(msg);
  }
}
function broadcastLog(msg) {
  console.log(msg);
  broadcast({ type: 'log', msg });
}

// --- Internal Logic (Detect, Crawl, Capture) ---
async function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => { resolve(true); req.destroy(); }).on('error', () => resolve(false));
    req.setTimeout(1000, () => resolve(false));
  });
}

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (file === 'node_modules' || file.startsWith('.')) continue;
    if (fs.statSync(filePath).isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else if (filePath.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function serveStaticFolder(dir, port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(dir, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); }
        else { res.writeHead(200); res.end(data); }
      });
    });
    server.listen(port, () => resolve({ url: `http://localhost:${port}`, cleanup: () => server.close() }));
  });
}

async function prepareProject(targetDir) {
  const pkgPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    broadcastLog('[INFO] Mode A: Dev-server app detected.');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    let script = pkg.scripts?.dev ? 'dev' : (pkg.scripts?.start ? 'start' : null);
    if (!script) throw new Error('No dev/start script found in package.json.');

    const commonPorts = [3000, 5173, 5174, 8080];
    for (const port of commonPorts) {
      if (await checkPort(port)) {
        broadcastLog(`[INFO] Dev server already running on port ${port}.`);
        return { url: `http://localhost:${port}`, isStatic: false, cleanup: () => {} };
      }
    }

    broadcastLog(`[INFO] Starting dev server (npm run ${script})...`);
    const isWin = /^win/.test(process.platform);
    const child = spawn(isWin ? 'npm.cmd' : 'npm', ['run', script], { cwd: targetDir, stdio: 'ignore', detached: !isWin, shell: true });

    let foundPort = null;
    for (let i = 0; i < 120; i++) {
      await new Promise(r => setTimeout(r, 500));
      for (const port of commonPorts) if (await checkPort(port)) { foundPort = port; break; }
      if (foundPort) break;
    }

    if (!foundPort) {
      try { isWin ? execSync(`taskkill /PID ${child.pid} /T /F`) : process.kill(-child.pid); } catch(e){}
      throw new Error(`Dev server timeout.`);
    }
    broadcastLog(`[INFO] Dev server detected on port ${foundPort}.`);
    return { url: `http://localhost:${foundPort}`, isStatic: false, cleanup: () => { try { isWin ? execSync(`taskkill /PID ${child.pid} /T /F`) : process.kill(-child.pid); } catch(e){} } };
  }

  const htmlFiles = findHtmlFiles(targetDir);
  if (htmlFiles.length > 0) {
    broadcastLog(`[INFO] Mode B/C: Static project detected (${htmlFiles.length} files).`);
    const serverInfo = await serveStaticFolder(targetDir, 8081);
    return { url: serverInfo.url, isStatic: true, staticFiles: htmlFiles.map(f => path.relative(targetDir, f).replace(/\\/g, '/')), cleanup: serverInfo.cleanup };
  }
  throw new Error('Could not detect project type.');
}

async function discoverRoutes(page, baseUrl) {
  const visited = new Set();
  const queue = [baseUrl];
  const discoveredPaths = new Set(['/']);

  while (queue.length > 0) {
    const currentUrl = queue.shift();
    const normalized = (() => { try { const u = new URL(currentUrl); return u.origin + (u.pathname === '/' ? '/' : u.pathname.replace(/\/$/, '')) + u.search; } catch { return currentUrl; } })();
    if (visited.has(normalized)) continue;
    visited.add(normalized);

    try {
      broadcastLog(`[CRAWL] Visiting: ${currentUrl}`);
      await page.goto(currentUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);
      const links = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => a.href).filter(h => h));
      for (const link of links) {
        if (!link.startsWith(baseUrl)) continue;
        const u = new URL(link);
        if (u.hash && u.pathname === new URL(currentUrl).pathname) continue;
        if (link.match(/\.(png|jpg|css|js|pdf)$/i)) continue;
        if (!visited.has(link) && !queue.includes(link)) {
          queue.push(link);
          discoveredPaths.add(u.pathname + u.search);
        }
      }
    } catch (e) { broadcastLog(`[WARN] Crawl failed for ${currentUrl}: ${e.message}`); }
  }
  return Array.from(discoveredPaths);
}

const DEVICES = [{name: 'mobile', width: 390, height: 844}, {name: 'tablet', width: 768, height: 1024}, {name: 'laptop', width: 1440, height: 900}];
async function captureRoute(page, url, routePath, outputFolder, structure) {
  for (const device of DEVICES) {
    broadcastLog(`[CAPTURE] ${routePath} @ ${device.name}`);
    const safeName = routePath.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'home';
    
    let deviceFolder;
    let filePrefix = '';

    if (structure === 'device/route') {
      deviceFolder = path.join(outputFolder, device.name, safeName);
    } else if (structure === 'flat') {
      deviceFolder = outputFolder;
      filePrefix = `${safeName}-${device.name}-`;
    } else {
      // Default route/device
      deviceFolder = path.join(outputFolder, safeName, device.name);
    }

    fs.mkdirSync(deviceFolder, { recursive: true });

    await page.setViewportSize({ width: device.width, height: device.height });
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.evaluate(async () => { if (document.fonts) await document.fonts.ready; });
      await page.waitForTimeout(500);

      await page.evaluate(async () => {
        return new Promise(res => {
          let t = 0, d = 800;
          const timer = setInterval(() => {
            window.scrollBy(0, d); t += d;
            if (t >= document.documentElement.scrollHeight) { clearInterval(timer); window.scrollTo(0,0); res(); }
          }, 100);
        });
      });
      await page.waitForTimeout(500);

      const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      let currentScroll = 0, pageNum = 1;
      while (currentScroll < scrollHeight) {
        const remaining = scrollHeight - currentScroll;
        const clipHeight = remaining < device.height ? remaining : device.height;
        const filename = `${filePrefix}page-${pageNum}.png`;
        const filepath = path.join(deviceFolder, filename);
        
        await page.screenshot({ path: filepath, clip: { x: 0, y: currentScroll, width: device.width, height: clipHeight } });
        
        // Broadcast the image to UI
        const relativePath = path.relative(process.cwd(), filepath).replace(/\\/g, '/');
        broadcast({ type: 'screenshot', route: routePath, device: device.name, filename, url: `/screenshots/${encodeURIComponent(relativePath)}` });

        currentScroll += device.height;
        pageNum++;
        if (currentScroll < scrollHeight) { await page.evaluate((y) => window.scrollTo(0, y), currentScroll); await page.waitForTimeout(300); }
      }
    } catch (e) { broadcastLog(`[WARN] Capture failed: ${e.message}`); }
  }
}

let isRunning = false;
async function runJob(targetDir, structure) {
  if (isRunning) return;
  isRunning = true;
  let projectInfo;
  const now = new Date();
  const timestamp = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0')+'_'+String(now.getHours()).padStart(2,'0')+'-'+String(now.getMinutes()).padStart(2,'0')+'-'+String(now.getSeconds()).padStart(2,'0');
  const outDir = path.join(targetDir, `screenshotaf-${timestamp}`);

  try {
    projectInfo = await prepareProject(targetDir);
    broadcastLog('[INFO] Launching Chrome...');
    const browser = await chromium.launch({ channel: 'chrome' });
    const context = await browser.newContext({ deviceScaleFactor: 2 });
    const page = await context.newPage();

    let routes = projectInfo.isStatic ? projectInfo.staticFiles.map(f => `/${f}`) : await discoverRoutes(page, projectInfo.url);
    broadcastLog(`[INFO] Found ${routes.length} route(s). Starting captures...`);
    fs.mkdirSync(outDir, { recursive: true });

    for (const route of routes) {
      await captureRoute(page, projectInfo.url + route, route, outDir, structure);
    }
    
    broadcastLog(`[SUCCESS] Complete! Saved to ${outDir}`);
    broadcast({ type: 'done' });
    await browser.close();
  } catch (e) {
    broadcastLog(`[ERROR] ${e.message}`);
    broadcast({ type: 'error' });
  } finally {
    if (projectInfo && projectInfo.cleanup) projectInfo.cleanup();
    isRunning = false;
  }
}

// --- Main HTTP Server ---
const targetDirectory = process.argv[2] || process.cwd();
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML_CONTENT);
  } else if (req.url === '/api/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
    clients.add(res);
    req.on('close', () => clients.delete(res));
  } else if (req.url.startsWith('/api/start') && req.method === 'POST') {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const structure = urlObj.searchParams.get('structure') || 'route/device';
    res.writeHead(200); res.end('OK');
    runJob(targetDirectory, structure);
  } else if (req.url.startsWith('/screenshots/')) {
    const decodedPath = decodeURIComponent(req.url.replace('/screenshots/', ''));
    const absPath = path.join(process.cwd(), decodedPath);
    if (fs.existsSync(absPath)) {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      fs.createReadStream(absPath).pipe(res);
    } else {
      res.writeHead(404); res.end('Not found');
    }
  } else {
    res.writeHead(404); res.end();
  }
});

server.listen(4444, () => {
  console.log('Dashboard running at http://localhost:4444');
  // Auto-open browser
  const url = 'http://localhost:4444';
  const startCmd = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
  try { execSync(`${startCmd} ${url}`); } catch(e){}
});
