const fs = require('fs');
const url = require('url');
const pathLib = require('path');

const DEFAULT_OPTIONS = {
    mimeType: 'application/json',
};

/**
 * isDir is a function which take a path and return true/false
 * @param {string} path
 * @returns {Boolean}
 */
function isDir(path) {
    return fs.lstatSync(path).isDirectory();
}

/**
 * mergeHAR can take as many HAR as wanted and merge the log.entries
 * @params {Object} har
 */
function mergeHAR(...args) {
    const har = {
        log: {
            entries: [],
        }
    };
    return args.reduce((acc, value) => {
        acc.log.entries = acc.log.entries.concat(value.log.entries);
        return acc;
    }, har);
}

/**
 * parse take the path to looking for HAR files and return HAR structure
 * @param {string} path
 */
function parse(path) {
    let HAR = {
        log: {
            entries: [],
        },
    };
    try {
        if (isDir(path)) {
            HAR = fs.readdirSync(path).sort().reduce((acc, folderContent) => {
                const subpath = pathLib.join(path, folderContent);
                if (isDir(subpath)) {
                    acc = mergeHAR(acc, parse(subpath));
                } else if (subpath.endsWith('.har')) {
                    try {
                        acc = mergeHAR(acc, JSON.parse(fs.readFileSync(subpath)));
                    } catch(e) {
                        console.error(`can't parse the file ${subpath}`, e);
                    }
                }
                return acc;
            }, HAR);
        } else {
            HAR = JSON.parse(fs.readFileSync(path));
        }
    } catch(e) {
        console.error(e);
    }
    HAR.log.entries.forEach(e => {
        e.request.url = url.parse(e.request.url);
    });
    return HAR;
}

/**
 * filter request on method and path.
 * Note if it find more than one results it will try to be more restrictive
 * using queryString and body payload.
 */
function filter(HAR, req, options=DEFAULT_OPTIONS) {
    // lets do a first pass on it.
    const entries = HAR.log.entries.filter(e => {
        const u = e.request.url;
        if (u.pathname !== req.path) {
            return false;
        }
        if (e.request.method !== req.method) {
            return false;
        }
        if (options.mimeType && e.response.content.mimeType !== options.mimeType) {
            return false;
        }
        return true;
    });
    if (entries.length > 1) {
        let results = entries;
        // first lets filter on query params
        const withSameQueryString = entries.filter(e => {
            return e.request.queryString.every(qs => req.params[qs.name] === qs.value);
        });
        if (withSameQueryString.length > 0) {
            results = withSameQueryString;
        }
        if (results.length > 1 && req.body) {
            // then try to filter on body
            const withTheSameBody = entries.filter(e => {
                const data = e.request.postData;
                if (data) {
                    return req.body === data.text;
                }
                return false;
            });
            if (withTheSameBody.length > 0) {
                results = withTheSameBody;
            }
        }
        return results;
    }
    return entries;
}

function getMiddleware(path, options) {
    const HAR = parse(path);
    const stateFilter = new Map();
    return function harMiddleware(req, res, next) {
        const found = filter(HAR, req, options);
        if (found.length > 0) {
            let candidate = found[0].response;
            if (found.length > 1) {
                // rotation using the stateFilter
                const key = `${req.method}-${req.path}`;
                let index = stateFilter.get(key) || 0;
                if (index + 1 > found.length) {
                    index = 0;
                }
                stateFilter.set(key, index + 1); // update state
                candidate = found[index].response;
            }
            if (candidate.status !== 200) {
                res.status(candidate.status);
            }
            res.type(candidate.content.mimeType).send(Buffer.from(candidate.content.text, candidate.content.encoding));
        } else {
            next();
        }
    };
}

module.exports = {
    parse,
    getMiddleware,
}
