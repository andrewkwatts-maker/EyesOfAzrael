/**
 * Eyes of Azrael - Local Development Server
 * Zero-dependency static file server with SPA fallback
 *
 * Usage: node dev-server.js
 * Serves on http://localhost:3000 (or PORT env var)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.glsl': 'text/plain; charset=utf-8',
    '.xml': 'application/xml',
    '.txt': 'text/plain; charset=utf-8',
    '.map': 'application/json',
    '.webmanifest': 'application/manifest+json',
    '.pdf': 'application/pdf',
};

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let filePath = path.join(ROOT, decodeURIComponent(url.pathname));

    // Security: prevent directory traversal
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    // If path ends with /, serve index.html
    if (filePath.endsWith(path.sep) || filePath === ROOT) {
        filePath = path.join(filePath, 'index.html');
    }

    fs.stat(filePath, (err, stats) => {
        if (!err && stats.isFile()) {
            // Serve the file
            serveFile(filePath, res);
        } else if (!err && stats.isDirectory()) {
            // Try index.html in directory
            const indexPath = path.join(filePath, 'index.html');
            fs.stat(indexPath, (err2) => {
                if (!err2) {
                    serveFile(indexPath, res);
                } else {
                    // SPA fallback
                    serveFile(path.join(ROOT, 'index.html'), res);
                }
            });
        } else {
            // File not found - SPA fallback for routes without extensions
            const ext = path.extname(filePath);
            if (!ext || ext === '.html') {
                // SPA route - serve index.html
                serveFile(path.join(ROOT, 'index.html'), res);
            } else {
                // Actual missing file (css, js, image, etc.)
                res.writeHead(404);
                res.end('Not Found');
                console.log(`  404 ${req.url}`);
            }
        }
    });
});

function serveFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500);
            res.end('Internal Server Error');
            return;
        }

        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*',
        });
        res.end(data);
    });
}

server.listen(PORT, () => {
    console.log('');
    console.log('  ==========================================');
    console.log('   Eyes of Azrael - Local Dev Server');
    console.log('  ==========================================');
    console.log('');
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Root:    ${ROOT}`);
    console.log('');
    console.log('   Press Ctrl+C to stop');
    console.log('');
});
