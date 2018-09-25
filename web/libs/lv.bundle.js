const fs = require("fs");
const utils = require("./lv.utils");
const UglifyJS = require("uglify-js");
const jsObfuscator = require('js-obfuscator');
var bundleConfig;
var readJSConfig = (handler) => {
    if (!global.cache) global.cache = {};
    if (!global.cache.bundle) global.cache.bundle = {};
    if (!global.cache.bundle.js) {
        fs.readFile("./app_data/config/bundle.js.json", "utf-8", (err, content) => {
            if (err) handler(err);
            try {
                global.cache.bundle.js = JSON.parse(content);
                handler(undefined, global.cache.bundle.js);
            }
            catch (ex) {
                handler(ex);
            }
        });
    }
    else {
        handler(undefined, global.cache.bundle.js);
    }
};
var readFiles = (files, handler) => {
    var retContent = "";
    var retErrors = [];
    var next = (index) => {
        if (index < files.length) {
            var file = files[index];
            if (files[index].path) {
                file = files[index].path;
            }
            fs.readFile("./" + file, "utf8", (err, content) => {
                if (err) {
                    retErrors.push({
                        source: file,
                        error: err
                    });
                    next(index + 1);
                    return;
                }
                else {
                    var _content = content;
                    while (_content.charCodeAt(0) === 65279) {
                        _content = _content.substring(1, _content.length);
                    }
                    while (_content.charCodeAt(_content.length - 1) === 65279) {
                        _content = _content.substring(0, _content.length - 1);
                    }
                    var result = UglifyJS.minify(_content);
                    if (result.error) {
                        retErrors.push({
                            source: file,
                            error: result.error
                        });
                        next(index + 1);
                    }
                    else {
                        _content = result.code;
                        if (files[index].obfuscator) {
                            var options = {
                                keepLinefeeds: true,
                                keepIndentations: true,
                                encodeStrings: true,
                                encodeNumbers: true,
                                moveStrings: true,
                                replaceNames: true,
                                variableExclusions: ['^_get_', '^_set_', '^_mtd_']
                            };
                            jsObfuscator(_content, options).then(obfuscated => {

                                _content = obfuscated;
                                retContent += _content;
                                next(index + 1);

                            }).catch(err => {
                                retErrors.push({
                                    source: file,
                                    error: err
                                });
                                next(index + 1);
                            });
                        }
                        else {
                            retContent += _content;
                            next(index + 1);
                        }
                    }
                }

            });
        }
        else {
            if (retErrors.length > 0) {
                handler(retErrors);
            }
            else {
                handler(undefined, retContent);
            }

        }
    };
    next(0);
};
var loadAllScriptFileFromBundle = (key, handler) => {
    var js = global.cache.bundle.js;
    utils.sequences()

        .then(next => {
            try {
                if (!global.cache) global.cache = {};
                if (!global.cache.bundle) global.cache.bundle = {};
                if (!global.cache.bundle.jsKeys) global.cache.bundle.jsKeys = {};
                if (!global.cache.bundle.jsKeys[key]) {
                    var files = js[key].files;
                    readFiles(files, (err, content) => {
                        if (!err) {
                            global.cache.bundle.jsKeys[key] = content;
                            //if (global.cache.bundle.js[key].compress) {
                            //    var result = UglifyJS.minify(content);
                            //    if (result.error) {
                            //        next(result.error);

                            //    }
                            //    else {
                            //        global.cache.bundle.jsKeys[key] = result.code;
                            //        handler(undefined, global.cache.bundle.jsKeys[key]);
                            //    }
                            //}
                            //else {
                            //    global.cache.bundle.jsKeys[key] = content;
                            //}
                            next();

                        }
                        else {
                            next(err);
                        }

                    });
                }
                else {
                    next();
                }

            }
            catch (ex) {
                next(ex);
            }
        })
        .done((err) => {
            if (err) {
                delete global.cache.bundle.js;
                delete global.cache.bundle.jsKeys;
                handler(err);
            }
            else {
                handler(undefined, global.cache.bundle.jsKeys[key]);
            }
        });
};
var getScript = (event) => {
    readJSConfig((err, data) => {
        if (!global.cache) global.cache = {};
        if (!global.cache.bundle) global.cache.bundle = {};

        global.cache.bundle.js = data;
        var key = event.req.routeInfo.params.key;
        if (!global.cache.bundle.scripts) global.cache.bundle.scripts = {};

        if (global.cache.bundle.scripts[key]) {
            event.res.end(global.cache.bundle.scripts[key]);
            event.done();
            return;
        }
        var fileName = "./app_data/bundle_cache/" + key + "." + global.cache.bundle.js[key].version + ".js";
        fs.exists(fileName, ok => {
            if (ok) {
                fs.readFile(fileName, "utf-8", (err, content) => {
                    if (err) {
                        event.done(err);

                    }
                    else {
                        global.cache.bundle.scripts[key] = content;
                        event.res.end(global.cache.bundle.scripts[key]);
                        event.done();
                    }


                });
            }
            else {
                loadAllScriptFileFromBundle(event.req.routeInfo.params.key, (err, content) => {
                    if (err) {
                        event.done(err); return;
                    }

                    fs.writeFile(fileName, content, "utf-8", err => {
                        if (err) {
                            event.done(err);
                            return;
                        }

                    });
                    global.cache.bundle.scripts[key] = content;
                    event.res.end(global.cache.bundle.scripts[key]);
                    event.done();


                    //, function (err) {
                    //event.done(err);
                    //});




                });


            }
        });
    });



};
/**
 * Lấy cấu hình của bundle theo key
 * @param {any} key key
 * @param {any} handler handler
 */
var getConfig = (key, handler) => {
    readJSConfig((err, data) => {
        if (err) handler(err);
        else {
            handler(undefined, data[key]);
        }
    });
};
module.exports = {
    getScript: getScript,
    getConfig: getConfig
};