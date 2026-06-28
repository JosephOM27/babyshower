const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const logFilePath = path.join(__dirname, 'confirmaciones.txt');

// Helper to serve static files with proper MIME types
function serveFile(res, filePath, contentType) {
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(`Error interno del servidor: ${err.code}`);
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

const server = http.createServer((req, res) => {
    // Enable CORS for development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // API endpoint for registration
    if (req.method === 'POST' && req.url === '/api/confirmar') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { name, phone } = JSON.parse(body);
                if (!name || !phone) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'Nombre y teléfono son requeridos.' }));
                    return;
                }

                // Read current log to calculate list count
                let listNum = 1;
                if (fs.existsSync(logFilePath)) {
                    const fileContent = fs.readFileSync(logFilePath, 'utf8');
                    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
                    listNum = lines.length + 1;
                }

                const timestamp = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
                const logEntry = `${listNum}. [${timestamp}] Nombre: ${name} | Teléfono: ${phone}\n`;

                fs.appendFileSync(logFilePath, logEntry, 'utf8');
                console.log(`[Registro] #${listNum} - ${name} (${phone}) guardado en confirmaciones.txt`);

                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: true, number: listNum }));
            } catch (e) {
                console.error("Error procesando solicitud:", e);
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: 'Error procesando los datos de registro.' }));
            }
        });
        return;
    }

    // Serve static files
    let uri = req.url === '/' ? '/index.html' : req.url;
    // Strip query parameters
    uri = uri.split('?')[0];
    const ext = path.extname(uri);
    const filePath = path.join(__dirname, uri.startsWith('/') ? uri.slice(1) : uri);

    const mimetypes = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.mp3': 'audio/mpeg'
    };

    const contentType = mimetypes[ext] || 'application/octet-stream';

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // Serve 404 for missing static files
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Archivo no encontrado');
            return;
        }
        serveFile(res, filePath, contentType);
    });
});

server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`Servidor de pruebas Baby Shower corriendo de forma local.`);
    console.log(`Abre en tu navegador: http://localhost:${PORT}`);
    console.log(`Las confirmaciones locales se guardarán en: ${logFilePath}`);
    console.log(`======================================================\n`);
});
