// Serves the kit folder so the demo can load ES modules and fonts, which
// browsers block over file://. Usage: node design-system/demo/serve.mjs
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const port = Number(process.env.PORT) || 4319;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
};

http
  .createServer((req, res) => {
    let pathname = decodeURIComponent(
      new URL(req.url ?? "/", "http://localhost").pathname,
    );
    if (pathname === "/") {
      res.writeHead(302, { location: "/demo/" }).end();
      return;
    }
    if (pathname.endsWith("/")) pathname += "index.html";
    const file = path.join(root, path.normalize(pathname));
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    fs.readFile(file, (error, data) => {
      if (error) {
        res.writeHead(404).end("Not found");
        return;
      }
      res
        .writeHead(200, {
          "content-type":
            types[path.extname(file)] ?? "application/octet-stream",
          "cache-control": "no-store",
        })
        .end(data);
    });
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`Demo: http://127.0.0.1:${port}/demo/`);
  });
