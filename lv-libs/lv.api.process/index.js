const ws = require("chokidar");
const utils = require("lv.utils");
const asLock = require("async-lock");
const fs = require("fs");
const path = require("path");
const compiler = require("lv.compile");
/**
 * Gọi 1 api 
 * @param {any} event
 */
var exec = (event) => {
    if (!global.argo) global.argo = {};
    if (!global.argo.cache) global.argo.cache = {};
    if (!global.argo.cache.lv_api_caching) global.argo.cache.lv_api_caching = {};
    global.lv_api_caching = global.argo.cache.lv_api_caching;
    if (!global.argo.cache._____api_source_code) global.argo.cache._____api_source_code = {};
    global._____api_source_code = global.argo.cache._____api_source_code;




    if (!global.lv_api_caching) global.lv_api_caching = {};
    if ((!global.lv_api_caching[event.params.key]) || (!global.lv_api_caching[event.params.key].compileCode)) {
        var lock = new asLock();
        lock.acquire("global.lv_api_caching", done => {
            fs.readFile("./app_data/api/api.json", "utf8", (err, content) => {
                if (err) {
                    done(err); console.log(err);
                }
                else {
                    var data = eval("(" + content + ")");
                    if (data.hash[event.params.key]) {
                        var item = data.hash[event.params.key];
                        var api_path = eval("(" + item.path + ")").split("://")[1];

                        if (api_path.indexOf('@') > -1) {
                            if (api_path.indexOf("(nodejs)") == -1) {
                                var file = api_path.split("@")[0] + ".js";
                                var method = api_path.split("@")[1];
                                var absFile = path.join("./", file);
                                if (!global._____api_source_code) global._____api_source_code = {};
                                if (!global._____api_source_code[absFile]) {
                                    var _path = path.join("./modules", absFile);
                                    ws.watch(_path).on("change", (sender) => {
                                        if (global.argo.cache) {
                                            global.argo.cache._____api_source_code = {};
                                            global.argo.cache.lv_api_caching = {};
                                            global._____api_source_code = global.argo.cache._____api_source_code;
                                            global.lv_api_caching = global.argo.cache.lv_api_caching;
                                        }
                                    })
                                    var page = item.page;

                                    fs.readFile(_path, "utf8", (err, jsContent) => {
                                        if (err) done(err)
                                        else {
                                            var retCompile = compiler.compileSourceCode(jsContent);
                                            if (retCompile.error) {
                                                retCompile.error.source = absFile;
                                                done(retCompile.error);
                                            }
                                            else {
                                                try {
                                                    global._____api_source_code[absFile] = retCompile.instance;
                                                    global.lv_api_caching[event.params.key].compileCode = global._____api_source_code[absFile];

                                                    done(undefined, {
                                                        instance: global._____api_source_code[absFile],
                                                        method: method,
                                                        filePath: file,
                                                        compileCode: global.lv_api_caching[event.params.key].compileCode
                                                    });
                                                }
                                                catch (ex) {
                                                    done({
                                                        error: {
                                                            message: ex.message || ex,
                                                            source: file,
                                                            method: method
                                                        }
                                                    })
                                                }
                                            }

                                        }
                                    });
                                }

                                else {
                                    done(undefined, {
                                        instance: global._____api_source_code[absFile],
                                        method: method
                                    });
                                }
                            }
                            else {
                                try {


                                    var modulePath = api_path.split("(nodejs)")[1].split('@')[0];
                                    var rootDir = path.parse(require.main.filename).dir;
                                    var rootPath = path.join(rootDir, __dirname);

                                    var mPath = require.resolve("./" + path.join(path.relative(__dirname, "./"), modulePath));
                                    ws.watch(mPath).on("change", f => {
                                        delete require.cache[f];
                                        global.lv_api_caching = {};
                                        global._____api_source_code = {};
                                    })
                                    var m = require("./" + path.join(path.relative(__dirname, "./"), modulePath));

                                    var method = api_path.split("(nodejs)")[1].split("@")[1];
                                    if (m[method]) {
                                        global._____api_source_code[mPath] = m;
                                        global.lv_api_caching[event.params.key] = {
                                            compileCode: m[method]
                                        }

                                        done(undefined, {
                                            instance: m,
                                            method: method,
                                            compileCode: m
                                        });
                                    }
                                    else {
                                        done({
                                            error: {
                                                message: "'" + method + "' was not found in '" + api_path + "'",
                                                source: api_path
                                            }
                                        });
                                    }
                                }
                                catch (ex) {
                                    done({
                                        error: {
                                            message: ex.message || ex,
                                            source: api_path
                                        }
                                    });
                                }

                            }
                        }
                        else {
                            var method = api_path;
                            global.lv_api_caching[event.params.key] = {};
                            if (!global.argo.cache.pageCode) global.argo.cache.pageCode = {};
                            if (!global.argo.cache.pageCode[data.hash[event.params.key].page.toLowerCase()]) {
                                done({
                                    message: "'" + data.hash[event.params.key].page + "' was not loaded"
                                });
                                return;
                            }
                            var pageCode = global.argo.cache.pageCode[data.hash[event.params.key].page.toLowerCase()];
                            if ((pageCode)) {
                                if (pageCode.Code) {
                                    if (pageCode.Code instanceof Array) {
                                        var retCompile = compiler.compileCodeWithInjection(pageCode.Code);
                                        if (retCompile.error) {
                                            retCompile.error.source = data.hash[event.params.key].page;
                                            done(retCompile.error);
                                        }
                                        else {
                                            global.lv_api_caching[event.params.key].compileCode = retCompile.instance;
                                            global.lv_api_caching[event.params.key].method = method;
                                            global.lv_api_caching[event.params.key].page = data.hash[event.params.key].page;
                                        }

                                    }
                                    else {
                                        global.lv_api_caching[event.params.key].compileCode = pageCode.Code;
                                        global.lv_api_caching[event.params.key].method = method;
                                        global.lv_api_caching[event.params.key].page = data.hash[event.params.key].page;
                                    }

                                }
                                else {
                                    var retCompile = compiler.compileSourceCode(pageCode.script);
                                    if (retCompile.error) {
                                        retCompile.error.source = data.hash[event.params.key].page;
                                        done(retCompile.error);
                                    }
                                    else {
                                        global.lv_api_caching[event.params.key].compileCode = retCompile.instance;
                                        global.lv_api_caching[event.params.key].method = method;
                                        global.lv_api_caching[event.params.key].page = data.hash[event.params.key].page;
                                    }
                                }


                            }


                            done(undefined, global.lv_api_caching[event.params.key]);
                        }



                    }
                    else {
                        done({ message: "api was not found" });
                    }
                }
            });
        }, (err, data) => {
            if (err) {
                event.done(err);
            }
            else {
                global.lv_api_caching[event.params.key] = data;
                if (global.lv_api_caching[event.params.key].compileCode) {
                    if (!global.lv_api_caching[event.params.key].compileCode[global.lv_api_caching[event.params.key].method]) {
                        event.done({
                            message: "'" + global.lv_api_caching[event.params.key].method + "' was not found in '" + global.lv_api_caching[event.params.key].page + "'"
                        })
                    }
                    else {
                        event.viewPath = global.lv_api_caching[event.params.key].page;
                        try {
                            global.lv_api_caching[event.params.key].compileCode[global.lv_api_caching[event.params.key].method](event);
                        }
                        catch (ex) {
                            event.done(ex);
                        }
                    }
                }
                else {
                    if (!global.lv_api_caching[event.params.key].instance[global.lv_api_caching[event.params.key].method]) {
                        event.done({
                            message: "'" + global.lv_api_caching[event.params.key].method + "' was not found in '" + global.lv_api_caching[event.params.key].filePath + "'"
                        })
                    }
                    else {
                        try {
                            global.lv_api_caching[event.params.key].instance[global.lv_api_caching[event.params.key].method](event);
                        }
                        catch (ex) {
                            event.done(ex);
                        }
                    }
                }
            }
        });
    }
    else {
        if (global.lv_api_caching[event.params.key].compileCode) {
            if (!global.lv_api_caching[event.params.key].compileCode[global.lv_api_caching[event.params.key].method]) {
                event.done({
                    message: "'" + global.lv_api_caching[event.params.key].method + "' was not found in '" + global.lv_api_caching[event.params.key].page + "'"
                })
            }
            else {
                event.viewPath = global.lv_api_caching[event.params.key].page;
                try {
                    global.lv_api_caching[event.params.key].compileCode[global.lv_api_caching[event.params.key].method](event);
                }
                catch (ex) {
                    event.done({
                        file: global.lv_api_caching[event.params.key].filePath,
                        error: ex.message || ex
                    });
                }
            }
        }
        else {
            if (!global.lv_api_caching[event.params.key].instance[global.lv_api_caching[event.params.key].method]) {
                event.done({
                    message: "'" + global.lv_api_caching[event.params.key].method + "' was not found in '" + global.lv_api_caching[event.params.key].filePath + "'"
                })
            }
            else {
                try {
                    global.lv_api_caching[event.params.key].instance[global.lv_api_caching[event.params.key].method](event);
                }
                catch (ex) {
                    event.done({
                        file: global.lv_api_caching[event.params.key].filePath,
                        error: ex.message || ex
                    });
                }
            }
        }
    }

};
module.exports = {
    exec: exec
}