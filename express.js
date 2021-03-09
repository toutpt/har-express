#!/usr/bin/env node
const express = require("express");
const fs = require('fs');

const app = express();

const har = require("./index");
const [,, ...args] = process.argv;

function printHelp() {
    console.log(`har-server [-p] path-to.har
    options:
      - p Number set the port to use`);
}

const options = args.reduce((acc, value, index) => {
    if (value === '--help' || value === '-h') {
        acc.help = true;
    } else if (value === '-p' || value === '--port') {
        acc.port = parseInt(args[index+1], 10);
    } else if (fs.existsSync(value)) {
        acc.har = value;
    }
    return acc;
}, { port: 3000 });

if (options.help || !options.har) {
    printHelp();
} else {
    app.use(har.getMiddleware(options.har));
    app.use((req, res) => {
        res.status(404).send();
    });
    app.listen(options.port);
}
