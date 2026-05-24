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
          if (req.headers.cookie) {
            proxyReq.setHeader('Cookie', req.headers.cookie);
          }
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
  const requestContext = { setCookies: [] as string[] };
  angularApp
    .handle(req, requestContext)
    .then(async (response) => {
      if (!response) {
        next();
        return;
      }

      if (requestContext.setCookies.length > 0) {
        const originalSetHeader = res.setHeader.bind(res);
        let setHeaderModified = false;

        try {
          if (response.headers.has('set-cookie')) {
            res.setHeader = ((name: string, value: string | number | readonly string[]) => {
              if (name.toLowerCase() === 'set-cookie' && !setHeaderModified) {
                const existing = Array.isArray(value)
                  ? value
                  : [value as string];
                originalSetHeader(name, [
                  ...existing,
                  ...requestContext.setCookies,
                ]);
                setHeaderModified = true;
              } else {
                originalSetHeader(name, value);
              }
            }) as typeof res.setHeader;
          } else {
            res.setHeader('set-cookie', requestContext.setCookies);
          }

          await writeResponseToNodeResponse(response, res);
        } finally {
          if (setHeaderModified) {
            res.setHeader = originalSetHeader;
          }
        }
      } else {
        await writeResponseToNodeResponse(response, res);
      }
    })
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
