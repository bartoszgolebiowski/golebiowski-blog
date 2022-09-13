---
title: 'Import map - scopes'
date: '2022-08-13'
tags: ['import map', 'optimalization', 'dependencies', 'alias', 'scopes']
draft: false
summary: 'Import maps and multiple versions of the same dependency, how to use import map scopes, how to deal with two versions of the same dependency in package.json'
---

# Introduction

Previously in my blog [post](https://bgolebiowski.com/blog/import-map-introduction), I was talking about import-map basics. In this article, I will focus on [scopes](https://github.com/WICG/import-maps#scoping-examples) keyword and how to deal with two versions of the same dependency in [package.json](https://docs.npmjs.com/cli/v8/commands/npm-install)

# Use case

## Scopes

Let's assume the following example.
We are building micro frontends, and a single team is responsible for the whole page. This page is available on some specific URL. Everything works as expected, but the architect requests to update some dependencies. Everyone besides one team has an updated version.  
This can be a blocker for the whole project.

To resolve this problem we can utilize scopes.

```json
{
  "imports": {
    "lodash": "https://cdn.skypack.dev/lodash@4.17.21"
  },
  "scopes": {
    "/chart/": {
      "lodash": "https://cdn.skypack.dev/lodash@4.17.20"
    }
  }
}
```

Whenever a user visits a different URL than https://example.com/chart/, the application will use the newest version of lodash.

```json
{
  "https://example.com/pay/": "lodash@4.17.21",
  "https://example.com/checkout/": "lodash@4.17.21",
  "https://example.com/*": "lodash@4.17.21",
  "https://example.com/chart/": "lodash@4.17.20"
}
```

This solution works correctly only if the application uses hard navigation between micro frontend pages via [anchor element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a).

### Demo

[Sandbox](https://codesandbox.io/p/github/bartoszgolebiowski/import-map-scopes-example/draft/modern-river)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Import map scopes</title>
    <link rel="stylesheet" href="styles.css" />
    <link rel="preconnect" href="https://cdn.skypack.dev" />
    <script type="importmap">
      {
        "imports": {
          "react": "https://cdn.skypack.dev/react",
          "react-dom": "https://cdn.skypack.dev/react-dom",
          "react-router": "https://cdn.skypack.dev/react-router",
          "react-router-dom": "https://cdn.skypack.dev/react-router-dom",
          "lodash": "https://cdn.skypack.dev/lodash"
        },
        "scopes": {
          "/lodash-4-17-20/": {
            "lodash": "https://cdn.skypack.dev/lodash@4.17.20"
          },
          "/lodash-4-17-19/": {
            "lodash": "https://cdn.skypack.dev/lodash@4.17.19"
          },
          "/lodash-4-17-18/": {
            "lodash": "https://cdn.skypack.dev/lodash@4.17.18"
          },
          "/lodash-4-17-17/": {
            "lodash": "https://cdn.skypack.dev/lodash@4.17.17"
          },
          "/lodash-4-17-16/": {
            "lodash": "https://cdn.skypack.dev/lodash@4.17.16"
          }
        }
      }
    </script>
    <script type="module" src="./assets/index.0ab933d8.js"></script>
  </head>

  <body>
    <div id="root"></div>
  </body>
</html>
```

## Two versions simultaneously

In some cases, you can not update the dependency easily. We can work on it incrementally. We will maintain two versions of the same dependency in the same project. [NPM](https://docs.npmjs.com/cli/v8/commands/npm-install) allows that via CLI.

```cmd
npm install <alias>@npm:<name>
npm install lodash-new@npm:lodash@4.17.21
```

The new version of the dependency will be available with additional suffixes like "-new". The old one will be available without any suffixes. The team can incrementally upgrade the codebase, and remove old dependencies when migration is completed. To minimize bundle size during migration we can utilize [external](https://webpack.js.org/configuration/externals) in the configuration tool.

### Demo

[Sandbox](https://codesandbox.io/p/github/bartoszgolebiowski/import-map-multiple-version-same-dep/draft/dazzling-zhukovsky)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Import map lodash & lodash@old</title>
    <script type="importmap">
      {
        "imports": {
          "react": "https://cdn.skypack.dev/react",
          "react-dom": "https://cdn.skypack.dev/react-dom",
          "lodash-new": "https://cdn.skypack.dev/lodash",
          "lodash": "https://cdn.skypack.dev/lodash@4.17.16"
        }
      }
    </script>
  </head>
  <script src="./src/main.tsx" type="module"></script>
  <body>
    <div id="root"></div>
  </body>
</html>
```

```js
//vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['react', 'react-dom', 'lodash', 'lodash-new'],
    },
  },
})
```

## Summary

The migration from the old version to the newer can be problematic. Some teams can handle it in one sprint, others will require more time. We can utilize scopes from the import map, but unfortunately, it has some drawbacks. On the other hand, we can utilize the native NPM mechanism and simultaneously take advantage of import maps.
