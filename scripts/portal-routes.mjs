// Match production's clean routes while developing the multi-page application.
export function portalRoutes() {
  return { name: "lmr-portal-routes", configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = new URL(req.url, "http://localhost");
      const paths = { "/": "/web/index.html", "/inner-circle": "/member/index.html", "/inner-circle/guide": "/member/guide.html", "/members": "/member/index.html", "/app": "/app/app.html", "/admin": "/admin/admin.html", "/admin/terminal": "/admin/terminal.html" };
      if (paths[url.pathname]) req.url = paths[url.pathname] + url.search;
      next();
    });
  } };
}
