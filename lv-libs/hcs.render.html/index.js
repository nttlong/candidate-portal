const url = require('url');
const chokidar = require('chokidar');
const compiler = require("lv.compile");
function getAbsUrl(req) {
    if (!global.rootUrl) {
        global.rootUrl = url.format({
            protocol: req.protocol,
            host: req.get('host'),
            pathname: "/"
        });
    }
    return global.rootUrl;
}
const fs = require('fs');
const hanldeBars = require("handlebars");
var _onError;
var onError = (handler) => {
    _onError = handler;
}
const asyncLock = require("async-lock");
var lock = new asyncLock();
const path = require('path');
var _dir = "./app_data/pages";
var _on_load_page_complete;
var _getServerScript = (info) => {
    var content = info.originalContent;


    var startReg = /\<script\s+server\>/;
    var endReg = '</script>';
    var m = startReg.exec(content);
    if (m) {
        var s1 = content.indexOf('>', m.index) + 1;
        var s2 = content.indexOf(endReg, s1);
        var script = content.substring(s1, s2);
        content = content.substring(0, m.index) +
            content.substring(s2 + endReg.length, content.length);
        info.originalContent = content;
        info.script = script;
        try {
            info.Code = Function("var ret=" + script + "; return ret;")();
        }
        catch (ex) {
            info.Error = {
                soucre: info.page,
                error: {
                    message: ex.message || ex
                }
            }
        }
        return info;
    }
    else {
        info.Code = (page) => {
            page.model = {};
        }
        return info;
    }
};
var get_from_cache = (language, page) => {
    var key = "lan=" + language + ";page=" + page;
    key = key.toLowerCase();
    if (!global.argo) global.argo = {};
    if (!global.argo.cache) global.argo.cache = {};
    if (!global.argo.cache.pages) global.argo.cache.pages = {};
    return global.argo.cache.pages[key];
}
var set_to_cache = (language, page, info) => {
    var key = "lan=" + language + ";page=" + page;
    key = key.toLowerCase();
    if (!global.argo) global.argo = {};
    if (!global.argo.cache) global.argo.cache = {};
    if (!global.argo.cache.pages) global.argo.cache.pages = {};
    global.argo.cache.pages[key] = info;
    info.__cache_instance = global.argo.cache.pages[key];
    if (!global.argo.cache.pageCode) global.argo.cache.pageCode = {};
    while (page.indexOf("\\") > -1) page = page.replace("\\", "/");
    while (page.indexOf("//") > -1) page = page.replace("//", "/");
    while (page[0] == "/") page = page.substring(1, page.length);
    while (page[page.length - 1] == "/") page = page.substring(0, page.length - 1);
    global.argo.cache.pageCode[page.toLowerCase()] = info;
    return global.argo.cache.pages[key];
}
var setDir = (value) => {
    _dir = value;
    chokidar.watch(_dir).on('all', (event, path) => {
        if (event == "change") {
            if (global.argo) {
                global.argo = {};
            }
        }

    });
}
var getDir = () => {
    return _dir
}
var _get_sub_content = (info) => {
    var page = info.page;
    var content = info.originalContent;
    var ret = [];
    var start = content.indexOf("<render>");
    while (start > -1) {
        start += "<render>".length;
        var end = content.indexOf("</render>", start);
        var replacer = content.substring(start - "<render>".length, end + "</render>".length);
        var originallPath = content.substring(start, end);
        content = content.substring(0, start - "<render>".length) +
            content.substring(end + "</render>".length, content.length);

        var relPathInfo = path.parse(path.join(path.parse(page).dir, originallPath));
        var relPath = relPathInfo.dir + "\\" + relPathInfo.name + relPathInfo.ext;

        while (relPath.indexOf("\\\\") > -1) {
            relPath = relPath.replace("\\\\", "\\");
        }
        if (relPath[0] != "\\") {
            relPath = "\\" + relPath;
        }
        ret.push({
            originallPath: originallPath,
            relPath: relPath,
            replacer: replacer
        });
        start = content.indexOf("<render>");
    }
    if (ret.length > 0) {
        info.children = ret;
    }
    return info

}
var loadAllSubContents = (rootDir, info, handler) => {

    info = _get_sub_content(info);
    if (!info.children) {

        handler(undefined, info);
    }
    else {
        var next = (index) => {
            if (index < info.children.length) {
                loadFile(rootDir, info.language, info.children[index].relPath, (err, content) => {
                    if (err) {
                        handler(err);
                        if (_onError) {
                            _onError(err);
                        }
                    }
                    else {
                        info.children[index].originalContent = content.originalContent;
                        info.children[index].page = content.page;
                        info.children[index].language = content.language;
                        info.children[index].script = content.script;
                        info.children[index].children = content.children;
                        info.children[index].Code = content.Code;
                        next(index + 1);
                    }

                });
            }
            else {
                handler(undefined, info);
            }
        }
        next(0);
    }

}
var getContent = (page, template, data) => {
    try {
        var template = hanldeBars.compile(template);
        var ret = template(data);

        return ret;
    }
    catch (ex) {
        if (_onError) {
            _onError(ex);
        }
        if (ex.message) {
            return JSON.stringify({ error: ex.message, path: page.page });
        }
        else {
            return JSON.stringify({ error: ex, path: page.page });
        }

    }
}
var loadFile = (rootDir, language, page, handler) => {
    var ret = get_from_cache(language, page);
    if (!ret) {
        var absPath = getDir() + "/" + page;
        lock.acquire(language + "/" + absPath, done => {
            fs.exists(absPath, found => {
                if (!found) {
                    done({ message: "file '" + absPath + "' was not found" })
                }
                else {
                    fs.readFile(absPath, "utf8", (err, content) => {

                        var _content = content;
                        while (_content.charCodeAt(0) == 65279) {
                            _content = _content.substring(1, _content.length);
                        }
                        while (_content.charCodeAt(_content.length - 1) == 65279) {
                            _content = _content.substring(0, _content.length - 1);
                        }
                        var i = _content.indexOf("<!--");
                        while (i > -1) {
                            var j = _content.indexOf("-->", i + 4);
                            if (j > -1) {
                                _content = _content.substring(0, i) + _content.substring(j + 3, _content.length);
                            }
                            i = _content.indexOf("<!--");
                        }
                        done(undefined, _content);
                    });
                }
            });
        }, (err, result) => {
            if (err) {
                handler(err);
                if (_onError) {
                    _onError(err);
                }
                return;
            }
            ret = set_to_cache(language, page, {
                originalContent: result,
                page: page,
                language: language
            });
            //  ret = _getServerScript(ret);
            ret.applyContent = (content) => {
                ret.originalContent = content;

            }
            ret.done = (error, info) => {

                if (error) {
                    handler(error);
                    if (_onError) {
                        _onError(error);
                    }
                }
                else {
                    info = _getServerScript(info);
                    if (info.Error) {
                        handler(info.Error);
                    }
                    else {

                        loadAllSubContents(rootDir, info, (err, result) => {
                            if (err) {
                                handler(err);
                                if (_onError) {
                                    _onError(err);
                                }
                            }
                            else {
                                handler(undefined, ret);
                            }
                        });
                    }
                }

            };

            if (_on_load_page_complete) {
                _on_load_page_complete(ret);
            }
            else {
                loadAllSubContents(rootDir, ret, (err, ret) => {
                    if (err) {
                        handler(err);
                        if (_onError) {
                            _onError(err);
                        }
                    } else {


                        handler(undefined, ret);
                    }
                });
            }
        });


    }
    else {
        //ret.done = (error, info) => {
        //    //loadAllSubContents(rootDir, info, (err, result) => {
        //        if (err) {
        //            handler(err);
        //            if (_onError) {
        //                _onError(err);
        //            }
        //        }
        //        else {
        //            handler(undefined, ret);
        //        }
        //    });
        //};
        //if (_on_load_page_complete) {
        //    _on_load_page_complete(ret);
        //}
        //else {
        loadAllSubContents(rootDir, ret, (err, ret) => {
            if (err) {
                handler(err);
                if (_onError) {
                    _onError(err);
                }
            }
            else {
                handler(undefined, ret);
            }
        });
        //}

    }
}
var _on_create_page_instance;
var onCreatePage = (handler) => {
    _on_create_page_instance = handler;
}
var _onProcessPage = undefined;
var onProcessPage = (hanlder) => {
    _onProcessPage = hanlder;
}
var _get_page = (req, res, page, absFilePath, content, parentPage) => {
    try {
        var page = {
            req: req,
            res: res,
            form: {},
            setModel: (path, value) => {
                var items = path.split('.');
                if (!page.model) page.model = {};
                var data = page.model;
                for (var i = 0; i < items.length - 1; i++) {
                    if (!data[items[i]]) {
                        data[items[i]] = {};
                    }
                    data = data[items[i]];
                }
                data[items[items.length - 1]] = value;

            },
            absFilePath: absFilePath,
            relPath: page,
            model: {
                rootUrl: getAbsUrl(req)
            },
            content: content,
            parent: parentPage,
            require: require,
            loadModule: (pathModule) => {
                try {
                    if (!global.argo) global.argo = {};
                    if (!global.argo.cache) global.argo.cache = {};
                    if (!global.argo.cache.moduleLoaded) global.argo.cache.moduleLoaded = {};
                    if (global.argo.cache.moduleLoaded[pathModule]) {
                        return global.argo.cache.moduleLoaded[pathModule];
                    }
                    else {
                        global.argo.cache.moduleLoaded[pathModule] = require(rootDir + "/" + pathModule + ".js");
                        return global.argo.cache.moduleLoaded[pathModule];
                    }
                }
                catch (ex) {
                    if (_onError) {
                        _onError(ex);
                    }
                    throw (ex);
                }

            }
        };
        if (_on_create_page_instance) {
            _on_create_page_instance(undefined, page);
        }
        return page;
    }
    catch (ex) {
        _on_create_page_instance(ex);
    }
    return;
}
var compile = (rootDir, req, res, info, handler, parentPage) => {
    var compileSub = (rootDir, index, list, parentPage, done) => {
        if (index < list.length) {
            compile(rootDir, req, res, list[index], (e, r) => {
                if (e) done(e);
                else {
                    while (parentPage.originalContent.indexOf(list[index].replacer) > -1) {
                        parentPage.originalContent = parentPage.originalContent.replace(list[index].replacer, r.originalContent);
                    }
                    compileSub(rootDir, index + 1, list, parentPage, done);
                }
            }, parentPage);
        }
        else {

            done(undefined, parentPage);
        }
    }
    var absFilePath = getDir() + "/" + info.page;
    var page = _get_page(req, res, info.page, absFilePath, info.originalContent, parentPage);
    var tmpModel = page.model;
    var retCode = compiler.compileCode(info, page);
    if (retCode.error) {
        handler(retCode.error);
        return;
    }

    var keys = Object.keys(tmpModel);
    for (var i = 0; i < keys.length; i++) {
        page.model[keys[i]] = tmpModel[keys[i]];
    }

    var continue_process = (info, page) => {
        //if (info.Code) {
        //    info.Code(page);

        //}
        while (page.absFilePath.indexOf('\\') > -1) {
            page.absFilePath = page.absFilePath.replace("\\", "/");
        }
        while (page.absFilePath.indexOf('//') > -1) {
            page.absFilePath = page.absFilePath.replace("//", "/");
        }
        while (page.relPath.indexOf('\\') > -1) {
            page.relPath = page.absFilePath.replace("\\", "/");
        }
        while (page.relPath.indexOf('//') > -1) {
            page.relPath = page.absFilePath.replace("//", "/");
        }
        if (page.req.method == "POST") {
            if (page.onPost) {
                var $event = {
                    sender: page,
                    done: (err) => {
                        if (err) {
                            handler(err);
                            if (_onError) {
                                _onError(err);
                            }
                        }
                        else {
                            var content = getContent(page, page.content, page.model);
                            page.originalContent = content;
                            if (info.children) {

                                compileSub(rootDir, 0, info.children, page, handler);
                            }
                            else {
                                handler(undefined, page);
                            }
                        }
                    }
                }
                page.onPost($event)
            }
            else {
                var content = getContent(page, info.originalContent, page.model);
                page.originalContent = content;
                if (info.children) {
                    compileSub(rootDir, 0, info.children, page, handler);
                }
                else {
                    handler(undefined, page);
                }
            }
        }
        else {
            if (page.onLoad) {
                var $event = {
                    sender: page,
                    done: (err) => {
                        if (err) {
                            handler(err);
                            if (_onError) {
                                _onError(err);
                            }
                        }
                        else {
                            var content = getContent(page, page.content, page.model);
                            page.originalContent = content;
                            if (info.children) {

                                compileSub(rootDir, 0, info.children, page, handler);
                            }
                            else {
                                handler(undefined, page);
                            }
                        }
                    }
                }
                page.onLoad($event)
            }
            else {
                var content = getContent(info, info.originalContent, page.model);
                page.originalContent = content;
                if (info.children) {
                    compileSub(rootDir, 0, info.children, page, handler);
                }
                else {
                    handler(undefined, page);
                }
            }
        }
    }
    var runNext = () => {
        if (req.method == "POST") {
            if (!req.form) {
                var body = "";
                req.on('data', function (chunk) {
                    body += chunk;
                });
                req.on('end', function () {

                    var items = body.split('&');
                    for (var i = 0; i < items.length; i++) {
                        if (items[i].indexOf('=') > -1) {
                            page.form[items[i].split('=')[0]] = unescape(items[i].split('=')[1]);
                        }
                        else {
                            page.form[items[i]] = undefined;
                        }
                    }
                    req.form = page.form;
                    continue_process(info, page);


                });
            }
            else {
                continue_process(info, page);
            }
        }
        else {
            if (_onProcessPage) {
                var sender = {
                    rootDir: rootDir,
                    req: req,
                    res: res,
                    page: page,
                    info: info,
                    done: (err) => {
                        if (err) {
                            handler(err);
                            if (_onError) {
                                _onError(err);
                            }
                        }
                        else {
                            continue_process(info, page);
                        }
                    }
                };
                _onProcessPage(sender);
            }
            else {
                continue_process(info, page);
            }
        }
    }
    if (retCode.instance.onLoad) {
        var event = {
            req: page.req,
            res: page.res,
            model: page.model,
            setModel: page.setModel,
            done: (err) => {
                if (err) {
                    handler(err);
                }
                else {
                    runNext();
                }
            }
        };
        try {
            retCode.instance.onLoad(event);
        }
        catch (ex) {
            handler({
                message: "onLoadError",
                errorMessage: ex.message || ex,
                source: absFilePath
            })
        }
    }
    else {
        runNext();
    }
}
var load = (rootDir, language, req, res, path, handler) => {
    loadFile(rootDir, language, path, (err, result) => {
        if (err) {
            handler(err);
            if (_onError) {
                _onError(err);
            }
        }
        else {
            compile(rootDir, req, res, result, (err, result) => {
                if (err) {
                    handler(err);
                    if (_onError) {
                        _onError(err);
                    }
                }
                else handler(undefined, result.originalContent);
            });

        }
    })
}
module.exports = {

    onLoadPageComplete: (hanlder) => {
        _on_load_page_complete = hanlder;
    },
    setDir: setDir,
    getDir: getDir,
    load: load,
    onCreatePage: onCreatePage,
    onProcessPage: onProcessPage,
    onError: onError
}