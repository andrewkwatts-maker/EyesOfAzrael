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
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

// --static-delta flag: serve features.js with ENTITY_SOURCE='static+delta' without
// touching the source file (safe — nothing gets committed accidentally).
const STATIC_DELTA = process.argv.includes('--static-delta');
const FEATURES_URL = '/js/config/features.js';
const FEATURES_OVERRIDE = `// dev-server override — ENTITY_SOURCE='static+delta' (not committed)
const FEATURES = { ENTITY_SOURCE: 'static+delta' };
if (typeof window !== 'undefined') window.FEATURES = FEATURES;
if (typeof module !== 'undefined' && module.exports) module.exports = FEATURES;
`;

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

    // Intercept features.js when --static-delta is active
    if (STATIC_DELTA && url.pathname === FEATURES_URL) {
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-cache' });
        res.end(FEATURES_OVERRIDE);
        return;
    }

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
            serveFile(filePath, res, req);
        } else if (!err && stats.isDirectory()) {
            // Try index.html in directory
            const indexPath = path.join(filePath, 'index.html');
            fs.stat(indexPath, (err2) => {
                if (!err2) {
                    serveFile(indexPath, res, req);
                } else {
                    // SPA fallback
                    serveFile(path.join(ROOT, 'index.html'), res, req);
                }
            });
        } else {
            // File not found - SPA fallback for routes without extensions
            const ext = path.extname(filePath);
            if (!ext || ext === '.html') {
                // SPA route - serve index.html
                serveFile(path.join(ROOT, 'index.html'), res, req);
            } else {
                // Actual missing file (css, js, image, etc.)
                res.writeHead(404);
                res.end('Not Found');
                console.log(`  404 ${req.url}`);
            }
        }
    });
});

/**
 * Text responses are gzipped, because production is.
 *
 * GitHub Pages and Firebase Hosting both serve this site gzipped —
 * css/entity-detail.css goes out as 19 KB against 130 KB on disk. Serving it
 * uncompressed here made every byte-size measurement taken against this server
 * describe a transport no visitor uses: the E2E performance suite measured 6.87
 * MB of page weight against a 5 MB budget and failed, while the real site
 * transfers well under a megabyte.
 *
 * Compressing here is not about making that test pass — it is so the number the
 * test reads is the number users actually download.
 */
const COMPRESSIBLE = new Set([
    '.html', '.css', '.js', '.mjs', '.json', '.svg', '.xml', '.txt', '.map'
]);

/**
 * Compressed bodies are cached, keyed by path + mtime + size.
 *
 * Gzipping on every request is what a naive implementation does and it is not
 * what a CDN does. Compressing all 126 scripts on each page load put ~126 zlib
 * jobs through one thread, and requests queued behind each other: the E2E
 * "render blocking resources" count went from 6 to 107, because its heuristic
 * flags any early script taking over 100ms. The bytes were right and the timings
 * were an artefact of the server, which is the same class of mistake as not
 * compressing at all.
 *
 * mtime and size in the key mean an edit invalidates the entry, so the dev
 * server still reflects saved changes immediately.
 */
const gzipCache = new Map();

function serveFile(filePath, res, req) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.stat(filePath, (statErr, stat) => {
        // stat before read so the compression cache can be keyed on mtime.
        if (statErr) {
            res.writeHead(500);
            res.end('Internal Server Error');
            return;
        }

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Internal Server Error');
                return;
            }

            const headers = {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache',
                'Access-Control-Allow-Origin': '*',
            };

            const accepts = (req && req.headers['accept-encoding']) || '';
            if (COMPRESSIBLE.has(ext) && /\bgzip\b/.test(accepts)) {
                const sendGzip = (compressed) => {
                    headers['Content-Encoding'] = 'gzip';
                    headers['Vary'] = 'Accept-Encoding';
                    res.writeHead(200, headers);
                    res.end(compressed);
                };

                const key = `${filePath}:${stat.mtimeMs}:${stat.size}`;
                const cached = gzipCache.get(key);
                if (cached) {
                    sendGzip(cached);
                    return;
                }

                zlib.gzip(data, (gzErr, compressed) => {
                    if (gzErr) {
                        // Compression is an optimisation; a failure here should
                        // serve the file, not a 500.
                        res.writeHead(200, headers);
                        res.end(data);
                        return;
                    }
                    gzipCache.set(key, compressed);
                    sendGzip(compressed);
                });
                return;
            }

            res.writeHead(200, headers);
            res.end(data);
        });
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
    if (STATIC_DELTA) {
        console.log('');
        console.log('   ⚡ ENTITY_SOURCE = static+delta');
        console.log('      features.js overridden in-flight (source unchanged)');
    }
    console.log('');
    console.log('   Press Ctrl+C to stop');
    console.log('');
});
