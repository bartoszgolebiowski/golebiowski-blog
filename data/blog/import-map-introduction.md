---
title: 'Import map - introduction'
date: '2022-07-29'
tags: ['import map', 'optimalization', 'systemjs', 'versioning']
draft: false
summary: 'Introduction for import maps, which will help you manage dependency versions and allow you to optimize for the size of JavaScript files.'
---

# Disclaimer

This article comes from [here](https://bulldogjob.pl/readme/czym-sa-import-mapy-i-do-czego-sluza). I have written this article for [Transition Technologies](https://kariera.tt.com.pl/), where I provide programming services. I have translated this article from Polish to English, replaced photos with code snippets, and added my post factum feedback.

## What is import map?

This is [specification](https://wicg.github.io/import-maps/), that allows the browser to override [import specifiers](https://nodejs.org/api/esm.html#import-specifiers) and argument provided to [import expression](https://nodejs.org/api/esm.html#import-expressions) to the URL that map import defined inside. The URL must point to the [module](https://nodejs.org/api/esm.html#modules-ecmascript-modules).

[Sandbox](https://codesandbox.io/s/blazing-thunder-cn2ygp?file=/index.html)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Native improt map</title>
    <script type="importmap">
      {
        "imports": {
          "moment": "https://cdn.skypack.dev/moment@2.29.3",
          "lodash": "https://cdn.skypack.dev/lodash@4.17.21"
        }
      }
    </script>
  </head>

  <body>
    <div id="moment"></div>
    <div id="lodash"></div>
  </body>
  <script type="module">
    import moment from 'moment'
    import _ from 'lodash'
    document.getElementById('moment').innerHTML = moment().format()
    document.getElementById('lodash').innerHTML = _.join(['a', 'b'], '-')
  </script>
</html>
```

## Usage

### Simple control of dependencies version

This approach enables us to control versions from one central place in our application. We can update the dependency version as well as individual modules / micro-frontends. When defining the import map in an HTML file, we can use the option of injecting the [src](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attr-src) from which it will be downloaded, we get the possibility to change the dependencies version without the need to update and re-deploy the HTML file. Remember about caching mechanisms here, the lower the [TTL](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html) value, the faster the changes will be available in the environment. The caching mechanisms should not be abandoned, but the optimal value should be found so that users do not have to request the origin server every time, but download it from [edge locaization](https://aws.amazon.com/cloudfront/).

On our project in [Transition Technologies](https://kariera.tt.com.pl/), the time needed to update the environment with a new version of the micro frontend or shared dependency is a maximum of 3 minutes. In the occurrence of regression, we are able to return to a working version in 3 minutes.

```html
<!-- https://YOUR_CDN.com/import-map.json
{
  "imports": {
    "moment": "https://cdn.skypack.dev/moment@2.29.3",
    "lodash": "https://cdn.skypack.dev/lodash@4.17.21"
  }
}
-->

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Native improt map + src</title>
    <script type="importmap" src="https://YOUR_CDN.com/import-map.json"></script>
  </head>

  <body>
    <div id="moment"></div>
    <div id="lodash"></div>
  </body>
  <script type="module">
    import moment from 'moment'
    import _ from 'lodash'
    document.getElementById('moment').innerHTML = moment().format()
    document.getElementById('lodash').innerHTML = _.join(['a', 'b'], '-')
  </script>
</html>
```

### Bundle size optimization

When more than one micro frontend is displayed at a given address at the same time, there may be a situation where certain dependencies may be downloaded to the browser more than once. On the one hand, it is a good practice that limits the dependencies between modules, on the other hand, it is a place where you can use the map import, and our application shares some dependencies and reduces the number of files needed for proper operation. The map import will ensure that the dependency is downloaded exactly once and it will be shared between all modules.

To achieve this, you need to inform artifact-building tool so that it treats some dependencies as external. [Webpack](https://webpack.js.org/) supports this with the [externals](https://webpack.js.org/configuration/externals/#combining-syntaxes) keyword in the configuration file. [Vite](https://vitejs.dev/) also supports external dependencies. You need to set the appropriate [values](https://vitejs.dev/config/build-options.html#build-rollupoptions) in the [rollup](https://rollupjs.org/guide/en/#peer-dependencies) configuration.

Let's assume that micro frontends use the _React_ dependency and it takes 25% of the bundle size of a single project. When we use dependency sharing, we get a saving of 13% in size compared to downloading a dependency twice.

![An example of artifact size optimization](/blog/import-map-introduction/import-map-bundle-size-optimalization.jpg?style=centerme)
_The photo is from a book [Micro Frontends in Action, Michael Geers](https://www.manning.com/books/micro-frontends-in-action)_

## Limitations

### Missing browser support

Currently, over 72% of users can use native map import in their browser according to the portal [caniuse.com](https://caniuse.com/?search=import-map). This is insufficient for production solutions. In this case, [polyfill](https://single-spa.js.org/docs/recommended-setup/#systemjs) is required. However, it requires additional scripts to be placed in the HTML file, the total size of which is 7.8 kB. Additionally, you should modify the configuration of tools for building output files so that the output files of our modules are in the [SystemJS](https://github.com/systemjs/systemjs/blob/main/docs/system-register.md) format. URLs inside the map import must point to files in the [UMD](https://github.com/umdjs/umd) or SystemJS format.

[Sandbox](https://codesandbox.io/s/flamboyant-sid-5w7ysx)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SystemJS import-map</title>
    <script type="systemjs-importmap">
      {
        "imports": {
          "moment": "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.3/moment.js",
          "lodash": "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js"
        }
      }
    </script>
  </head>
  <body>
    <div id="moment"></div>
    <div id="lodash"></div>
  </body>
  <script src="https://cdn.jsdelivr.net/npm/systemjs/dist/system.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/systemjs/dist/extras/amd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/systemjs/dist/extras/named-exports.min.js"></script>
  <script>
    System.register(['moment', 'lodash'], function (exports, module) {
      'use strict'
      let moment
      let _
      return {
        setters: [
          function (_dep) {
            moment = _dep
          },
          function (_dep) {
            _ = _dep
          },
        ],
        execute: function () {
          document.getElementById('moment').innerHTML = moment.default().format()
          document.getElementById('lodash').innerHTML = _.join(['a', 'b'], '-')
        },
      }
    })
  </script>
</html>
```

## Summary

The map import theme simplifies the global management of dependency versions and allows the use of more than one dependency version when a given module / micro frontend has not yet migrated to a newer version. This can be done with the [scopes](https://github.com/WICG/import-maps#scoping-examples) keyword.

Updating the versions of individual micro frontends can take place without a temporary lack of access for users, and the update itself can be automated thanks to [open source](https://github.com/single-spa/import-map-deployer).

Thanks to the polyfill we can use the map import even in [Internet Explorer](https://blogs.windows.com/windowsexperience/2022/06/15/internet-explorer-11-has-retired-and-is-officially-out-of-support-what-you-need-to-know/) browser.
