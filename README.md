# har-express

[![Travis CI][travis-ci-image] ][travis-ci-url]
[![NPM][npm-icon] ][npm-url]
[![dependencies][dependencies-image] ][dependencies-url]
[![devdependencies][devdependencies-image] ][devdependencies-url]

[npm-icon]: https://img.shields.io/npm/v/har-express.svg
[npm-url]: https://npmjs.org/package/har-express
[travis-ci-image]: https://travis-ci.com/toutpt/har-express.svg?branch=master
[travis-ci-url]: https://travis-ci.com/toutpt/har-express
[dependencies-image]: https://david-dm.org/toutpt/har-express/status.svg
[dependencies-url]: https://david-dm.org/toutpt/har-express
[devdependencies-image]: https://david-dm.org/toutpt/har-express/dev-status.svg
[devdependencies-url]: https://david-dm.org/toutpt/har-express

First be sure to know what is [HAR file reading wikipedia](https://en.wikipedia.org/wiki/.har).

This package expose a CLI to create an HTTP mock server and a library API to integrate it in webpack devServer

## Use case

So you have an HAR file ? You can either:

* configure webpack to use the har file directly
* start a server using the CLI

# using only webpack

So in your webpack.config.dev.js file you can do the following:

```javascript
const har = require('har-express');

if (process.env.HAR) {
	devServer.before = app => {
		app.use(har.getMiddleware(process.env.HAR));
	};
} else {
    // fallback for dev in your proxy to the real backend
	devServer.proxy = {
		'/api': process.env.API_URL || 'http://localhost:8000',
	};
}

module.exports = {
	devServer,
};
```

then you can start your project using

    HAR='./use-case.har' yarn start

## Using CLI

In the context your webpack config use API_URL env to configure the proxy just do

    API_URL=http://localhost:8000 yarn start
    har-express -p 8000 ./use-case.har
