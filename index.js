const fs = require('fs');
const url = require('url');

function parse(path) {
    const HAR = JSON.parse(fs.readFileSync(path));
    HAR.log.entries.forEach(e => {
        e.request.url = url.parse(e.request.url);
    });
    return HAR;
}

function findInRequest(HAR, req) {
    // console.log('find: ', req.path, req.method);
    return HAR.log.entries.find(e => {
        const u = e.request.url;
        if (u.pathname !== req.path) {
            return false;
        }
        // console.log('path ===', u)
        if (e.request.method !== req.method) {
            return false;
        }
        // console.log('method ===')
        // support only json
        if (e.response.content.mimeType !== 'application/json') {
            return false;
        }
        // console.log('content type ok');
        return true;
    });
}

function getMiddleware(path) {
    const HAR = parse(path);
    return function harMiddleware(req, res, next) {
        const found = findInRequest(HAR, req);
        if (found) {
            try {
                res.json(JSON.parse(found.response.content.text));
            } catch (e) {
                res.status(500).send(`ERROR: ${e.message}`);
            }
        } else {
            next();
        }
    };
}
module.exports = {
    parse,
    findInRequest,
    getMiddleware,
}