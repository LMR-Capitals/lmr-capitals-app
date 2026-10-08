import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import React, { useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { transformWithOxc } from "vite";

// Render the actual login component: production builds alone do not catch
// missing variables inside a screen that only mounts for signed-out users.
const source = await readFile(new URL("./main.jsx", import.meta.url), "utf8");
const component = source.slice(source.indexOf("function Login("), source.indexOf("function TwoFA("));
const transformed = await transformWithOxc(component, "admin-login.jsx", { jsx: { runtime: "classic" } });
for (const requestedSurface of [null, "circle", "terminal", "journal"]) {
  const Login = vm.runInNewContext(transformed.code + "\nLogin;", {
    React, useState, requestedSurface, Brand: () => React.createElement("span", null, "LMR"),
  });
  const html = renderToStaticMarkup(React.createElement(Login, { onDone() {} }));
  assert.match(html, /Admin sign in/);
  assert.match(html, /id="admin-email"/);
  assert.match(html, /type="password"/);
  assert.match(html, requestedSurface === "terminal" ? /Admin Terminal/ : /Inner Circle Admin Hub/);
}
console.log("PASS: actual administrator login renders for default, circle, terminal and journal entry routes.");
