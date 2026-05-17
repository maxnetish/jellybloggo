import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { join } from 'node:path';
import { environment } from './environments/environment';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

if (!environment.production) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: `${environment.backendProxy}/api`,
      changeOrigin: true,
      on: {
        proxyReq: (proxyReq, req) => {
          console.log(`[HPM] ${req.method} ${req.url} -> ${environment.backendProxy}`);
        },
        proxyRes: (proxyRes, req) => {
          console.log(`[HPM] ${req.method} ${req.url} <- ${proxyRes.statusCode}`);
        },
        error: (err, req, res) => {
          console.error(`[HPM] ${req.method} ${req.url} error: ${err.message}`);
        },
      },
    }),
  );
}

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
