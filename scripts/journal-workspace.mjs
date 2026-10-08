import { readFile } from "node:fs/promises";

// Generate the embedded entry from the canonical Journal, so fixes never drift.
export function workspaceJournalHtml(html) {
  return html.replace("</head>", '<script src="/journal-workspace-bridge.js" defer></script></head>');
}
export function journalWorkspace() {
  return {
    name: "lmr-journal-workspace",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (new URL(req.url, "http://localhost").pathname !== "/app/workspace.html") return next();
        try {
          const source = await readFile(new URL("../app/app.html", import.meta.url), "utf8");
          const html = await server.transformIndexHtml("/app/workspace.html", workspaceJournalHtml(source));
          res.setHeader("Content-Type", "text/html");
          res.setHeader("X-Frame-Options", "SAMEORIGIN");
          res.setHeader("Content-Security-Policy", "frame-ancestors 'self'");
          res.end(html);
        } catch (error) { next(error); }
      });
    },
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        const journal = bundle["app/app.html"];
        if (!journal || typeof journal.source !== "string") throw new Error("Canonical Journal build is missing.");
        this.emitFile({ type: "asset", fileName: "app/workspace.html", source: workspaceJournalHtml(journal.source) });
      },
    },
  };
}
