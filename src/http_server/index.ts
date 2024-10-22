import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createServer } from 'node:http';

export const httpServer = createServer(async function (req, res) {
    const __dirname = resolve(dirname(''));
    const file_path = __dirname + (req.url === '/' ? '/front/index.html' : '/front' + req.url);
    try {
        const data = await readFile(file_path)
        res.writeHead(200);
        res.end(data);
    } catch (err) {
        res.writeHead(404);
        res.end(JSON.stringify(err));
        return;
    }
});