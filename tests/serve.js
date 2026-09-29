// A tiny static server for the tests: serves the repo on http://localhost:4173/.
// If PYODIDE_DIR points at an unpacked `pyodide` npm package, it's also served at
// /__pyodide__/ so the sandbox's Python tests can run without internet access.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PYODIDE_DIR = process.env.PYODIDE_DIR;
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.md': 'text/markdown; charset=utf-8',
  '.json': 'application/json', '.wasm': 'application/wasm', '.zip': 'application/zip'
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  let base = ROOT;
  if(PYODIDE_DIR && urlPath.startsWith('/__pyodide__/')){
    base = path.resolve(PYODIDE_DIR);
    urlPath = urlPath.slice('/__pyodide__'.length);
  }
  if(urlPath.endsWith('/')) urlPath += 'index.html';
  const file = path.join(base, urlPath);
  if(!file.startsWith(base) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, {
    'content-type': TYPES[path.extname(file)] || 'application/octet-stream',
    'access-control-allow-origin': '*'
  });
  fs.createReadStream(file).pipe(res);
}).listen(4173);
