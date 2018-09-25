var jsonfile = require('jsonfile');
const asyncLock = require("async-lock");
const chokidar = require('chokidar');
var lock = new asyncLock();
var fs = require('fs');
var file = '/tmp/data.json'
var path = require('path');
var rootPath = "./"
var _lock_key = "routes_authenticate_code";
var _configPath = path.join(rootPath, "app_data/config/routes.json");
var _onError;
const utils = require("./lv.utils");
const compiler = require("./lv.compile");
const logs=require("./lv.logs")

var onError = (handler) => {
    _onError = handler;
}
var set_code_to_cache = (key, code) => {
    if (!global.argo) global.argo = {};
    if (!global.argo.cache) global.argo.cache = {};
    if (!global.argo.cache.code) global.argo.cache.code = {}
    global.argo.cache.code[key] = code;
}
var get_code_from_cache = key => {
    if (!global.argo) global.argo = {};
    if (!global.argo.cache) global.argo.cache = {};
    if (!global.argo.cache.code) global.argo.cache.code = {}
    return global.argo.cache.code[key];
}
function getAbsUrl(req) {
    if (!global.rootUrl) {
        const url = require('url');
        global.rootUrl = url.format({
            protocol: req.protocol,
            host: req.get('host'),
            pathname: "/"
        });
    }
    return global.rootUrl;
}
var _config = null;
global.getConfig = () => {
    return _config;
}
/**
 * Check if not exists folder create new folder
 * @param {any} callback
 */
var __routes = undefined;
var create_route_matcher = (items) => {
    var ret = [];
    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        var Params = [];
        var matchUrl = item.url;
        var rawUrl = matchUrl.substring(2, matchUrl.length);
        var realUrl = rawUrl;
        var start = rawUrl.indexOf('{');
        matchUrl = matchUrl.substring(2, matchUrl.length);
        var match = false;
        while (start > -1) {
            match = true;
            var end = rawUrl.indexOf("}", start);
            var Param = {
                start: start + 1,
                end: end,
                name: rawUrl.substring(start + 1, end),
                endChar: (end + 1 < rawUrl.length - 1) ? rawUrl.substring(end + 1, end + 2) : undefined

            }
            Params.push(Param);
            start = rawUrl.indexOf('{', end);

        }

        if (match) {
            matchUrl = matchUrl.substring(0, Params[0].start - 2) + "/\.*";
            realUrl = realUrl.substring(0, Params[0].start - 2);
        }
        else {
            if (realUrl.indexOf('*') > -1) {
                realUrl = realUrl.substring(0, realUrl.indexOf('*'))
            }
        }
        while (realUrl[realUrl.length - 1] === "/") {
            realUrl = realUrl.substring(0, realUrl.length - 1);
        }
        ret.push({
            rawUrl: rawUrl,
            url: item.url,
            params: Params,
            matchUrl: matchUrl,
            regEx: (item.url.indexOf('{') > -1) ? new RegExp("/" + matchUrl, "i") : undefined,
            authorizeBy: item.authorizeBy,
            handler: item.handler,
            execUrl: realUrl
        });

    }
    ret = ret.sort((a, b) => {
        return -a.rawUrl.split('/').length + b.rawUrl.split('/').length
    });
    return ret;
}
var cache = {};
var get_map_route = (list, url) => {
   
    var _url = url;
    if (cache[_url]) return cache[_url];
    while (url.indexOf("//") > -1) url = url.replace("//", "/");
    url = url.substring(_config.rootWebServerDir.length, url.length);

    while (url[0] == '/') {
        url = url.substring(1, url.length);
    }
    while (url[url.length-1] == '/') {
        url = url.substring(0, url.length-1);
    }
    if (url == "") {
        cache[_url] = {
            inputUrl: url,
            outputUrl: _config.default

        };
        return cache[_url];
    }
    url += "/";
    var i = 0;
    var found = false;
    while ((!found) && (i < list.length)) {
        var item = list[i];
        if (item.regEx) {
            var fx = new RegExp("")
            if (item.regEx.test("/" + url)) {
                var urlParam = url.substring(item.params[0].start - 1, url.length);
                if (urlParam.indexOf('.') > -1) {
                    urlParam = urlParam.split('.')[0];
                }
                var items = urlParam.split('/');
                var Params = {};
                for (var i = 0; i < item.params.length; i++) {
                    if (i < items.length) {
                        if (item.params[i].endChar) {
                            Params[item.params[i].name] = decodeURIComponent(items[i]);

                        }
                        else {
                            Params[item.params[i].name] = decodeURIComponent(items[i]);
                        }
                    }
                    else {
                        Params[item.params[i].name] = null;
                    }
                }
                if (item.execUrl[item.execUrl.length - 1] == "/") {
                    item.execUrl = item.execUrl.substring(0, item.execUrl.length - 1);
                }
                cache[_url] =
                    {
                        inputUrl: url,
                        outputUrl: item.rawUrl,
                        params: Params,
                        execUrl: item.execUrl,
                        handler: item.handler,
                        authorizeBy: item.authorizeBy
                    };
                return cache[_url];

            }
        }
        else {
            if (item.rawUrl.indexOf('/*') > -1) {
                var _mUrl = url.toLowerCase().substring(0, item.execUrl.length);
                while (_mUrl[_mUrl.length - 1] == '/') {
                    _mUrl = _mUrl.substring(0, _mUrl.length - 1);
                }
                var _execUrl = item.execUrl.toLowerCase();
                while (_execUrl[_execUrl.length - 1] == '/') {
                    _execUrl = _execUrl.substring(0, _execUrl.length - 1);
                }
                if (_mUrl.toLowerCase() == _execUrl.toLowerCase()) {
                    var execlUrl = url;
                    while (execlUrl[execlUrl.length - 1] === '/') {
                        execlUrl = execlUrl.substring(0, execlUrl.length - 1);
                    }
                    cache[_url] =
                        {
                            inputUrl: url,
                            outputUrl: item.rawUrl,
                            params: Params,
                            execUrl: execlUrl,
                            handler: item.handler,
                            authorizeBy: item.authorizeBy

                        };
                    return cache[_url]
                }

            }
            else {
                if (url[url.length - 1] == "/") {
                    url = url.substring(0, url.length - 1);
                }
                if (item.execUrl.toLowerCase() == url.toLowerCase()) {
                    cache[_url] =
                        {
                            inputUrl: url,
                            outputUrl: item.rawUrl,
                            params: Params,
                            execUrl: item.execUrl,
                            handler: item.handler,
                            authorizeBy: item.authorizeBy

                        };
                    return cache[_url];
                }
            }
        }
        if (!found) i++;
    }
}
/**
 * Check if not exist file create new file
 * @param {any} callback
 */
var config_loader = (callback) => {
    if (_config == null) {

        fs.exists(_configPath, (result) => {
            if (!result) {
                _config = {
                    rootWebServerDir: "/",
                    default: "home.html",
                    defaultLangaugeCode: "en",
                    port: 8080,
                    routes: [
                        { url: "~/index" },
                        { url: "~/account", authorizeBy: "./login/accounts/login" }
                    ]
                }
                fs.writeFile(_configPath, JSON.stringify(_config), function (err) {
                    if (err) { callback(err); }
                    else { callback(undefined, _config); }
                });
            }
            else {
                jsonfile.readFile(_configPath, (err, obj) => {
                    if (err) { callback(err); if (_onError) { _onError(err); } }
                    else {
                        _config = obj;
                        if (!global.argo) global.argo = {};
                        if (!global.argo.cache) global.argo.cache = {};
                        global.argo.cache.appConfig = obj;
                        __routes = create_route_matcher(_config.routes);

                        callback(undefined, _config);

                    }

                });
            }

        });


    }
    else {
        callback(undefined, _config);
    }
}
/**
 * if not exists folder then create and check is exist file if not then create file
 * @param {any} callback
 */
var load_code_file = (file, handler) => {

    fs.exists(file, r => {
        if (!r) {
            handler({ error: "file " + file + " was not found" });
        }
        else {
            var watcher = chokidar.watch(file, {
                persistent: true
            });
            watcher
                .on('change', path => {
                    set_code_to_cache(path, undefined);
                });
            fs.readFile(file, 'utf8', (err, data) => {
                if (err) {
                    handler(err);
                    if (_onError) {
                        _onError(err);
                    }
                }
                else {
                    var retCompile = compiler.compileSourceCode(data);
                    if (retCompile.error) {
                        retCompile.error.source = path;
                        handler(retCompile.error);
                    }
                    else {
                        handler(undefined, retCompile.instance);
                    }
                    


                }
            })
        }
    });
};
var run = (rootDir, inputUrl, req, res, callback) => {
    
    if (!res) throw ("res is empty");
    var getEvent = (matchItem) => {
        var event = {
            isAuthenticated: false,
            req: req,
            res: res,
            redirectTo: undefined,
            config: global.getConfig(),
            rootWebServerDir: global.getConfig().rootWebServerDir,
            done: (err) => {
                if (err) {
                    callback(err);
                    if (_onError) {
                        _onError({
                            url: req.url,
                            error:err
                        });
                    }
                }
                else {
                    if (!event.isAuthenticated) {
                        if (event.redirectTo) {
                            res.redirect(event.redirectTo);
                            res.end();
                        }
                        else {
                            utils.redirect(res, utils.getRootUrl(req) + _config.login + "?retUrl=" + req.url);
                            
                        }
                        var file = inputUrl;
                        if (file[0] == "~") {
                            file = file.substring(2, file.length);
                        }
                        callback(undefined, {
                            file: file + ".html"
                        });
                    }
                    else {
                        if (matchItem.handler) {
                            var module = require(path.join(rootDir, matchItem.handler.module));
                            event.done = (err) => {
                                if (err) {
                                    handler(err);
                                    if (_onError) {
                                        _onError({
                                            url: req.url,
                                            error: err,
                                            source: path.join(rootDir, matchItem.handler.module)
                                        });
                                    }
                                }
                                else {
                                    var file = inputUrl;
                                    if (file[0] == "~") {
                                        file = file.substring(2, file.length);
                                    }
                                    callback(undefined, {
                                        file: file + ".html"
                                    });
                                }
                            }
                            module[matchItem.handler.method](event);
                        }
                        else {
                            var file = inputUrl;

                            if (file[0] == "~") {
                                file = file.substring(2, file.length);
                            }
                            if (file[file.length - 1] == "/") {
                                file = file.substring(0, file.length - 1);
                            }
                            callback(undefined, {
                                file: file + ".html"
                            });
                        }
                    }
                }
            }
        }
        return event;
    };
    var matchItem = undefined;
    if (global.argo && global.argo.cache && global.argo.cache.urls && global.argo.cache.urls[req.url.toLowerCase()]) {
        matchItem = global.argo.cache.urls[req.url.toLowerCase()];
    }
    if (inputUrl.indexOf('?') > -1) {
        inputUrl = inputUrl.split('?')[0]
    }
    if ((inputUrl == '/') || (inputUrl == "")) {
        callback(undefined, {
            file: _config.default
        });
    }
    else {
        inputUrl = "~/" + inputUrl;
        var i = 0;
        var found = false;
        if (matchItem) found = true;
        
        while ((!found) && (i < _config.routes.length)) {
            if (_config.routes[i].url.length >= inputUrl.length) {
                var _url = _config.routes[i].url.substring(0, inputUrl.length);
                if (_url.toLowerCase() == inputUrl.toLowerCase()) {
                    found = true;
                    matchItem = _config.routes[i];
                }
                else {
                    i++;
                }
            }
            else {
                i++;
            }

        }
        if (found) {
            if (!global.argo) global.argo = {};
            if (!global.argo.cache) global.argo.cache = {};
            if (!global.argo.cache.urls) global.argo.cache.urls = {};
            global.argo.cache.urls[req.url.toLowerCase()] = matchItem;
            if (matchItem.authorizeBy) {
                if (matchItem.authorizeBy.substring(0, "(nodejs)".length) === "(nodejs)") {
                    if (!global.cache) global.cache = {};
                    if (!global.cache.modules_authorize) global.cache.modules_authorize = {};
                    if (!global.cache.modules_authorize[matchItem.authorizeBy]) {
                        var modulePath = matchItem.authorizeBy.split("(nodejs)")[1].split('@')[0];
                        var method = matchItem.authorizeBy.split("(nodejs)")[1].split("@")[1];
                        var mPath = require.resolve("./" + PATH.join(PATH.relative(__dirname, "./"), modulePath));
                        chokidar.watch(mPath).on("change", f => {
                            delete require.cache[f];
                            global.cache.modules_authorize = {};

                        });


                        var m;
                        try {
                            m = require("./" + PATH.join(PATH.relative(__dirname, "./"), modulePath));
                            var event = getEvent(matchItem);
                            m[method](event);
                            global.cache.modules_authorize[matchItem.authorizeBy] = m[method]
                        }
                        catch (ex) {
                            var dError = {
                                message: ex.message || ex,
                                source: mPath
                            }
                            utils.writeError(res, dError);

                            if (_onError) {
                                _onError(dError);
                            }
                        }

                    }
                    else {
                        try {
                            var event = getEvent(matchItem);
                            global.cache.modules_authorize[matchItem.authorizeBy](event);
                        }
                        catch (ex) {
                            var dError = {
                                message: ex.message || ex,
                                source: mPath
                            }
                            utils.writeError(res, dError);

                            if (_onError) {
                                _onError(dError);
                            }
                        }
                    }
                }
                else {
                    if (matchItem.authorizeBy.indexOf("@") == -1) {
                        var items = matchItem.authorizeBy.split('/');
                        var modulePath = "";
                        for (var i = 0; i < items.length - 1; i++) {
                            modulePath += items[i] + "/";
                        }
                        modulePath = modulePath.substring(0, matchItem.authorizeBy.length - 1);

                        var file = inputUrl;
                        var m = require(path.join(get_app_dir(), modulePath))
                        var event = getEvent(matchItem);
                        m[items[items.length - 1]](event);
                    }
                    else {
                        var file = matchItem.authorizeBy.split('@')[0] + ".js";
                        var code = get_code_from_cache(file);
                        if (!code) {
                            lock.acquire(_lock_key, done => {
                                load_code_file(file, (err, code) => {
                                    if (err) {
                                        if (_onError) {
                                            _onError({
                                                source: file,
                                                error:err
                                            });
                                        }
                                        done(err);

                                    }
                                    else {
                                        set_code_to_cache(file, code);
                                        done(undefined, code);
                                    }



                                });
                            }, (err, result) => {
                                if (err) {
                                    callback(err);
                                    if (_onError) {
                                        _onError(err);
                                    }
                                }
                                else {
                                    var event = getEvent(matchItem);

                                    var items = matchItem.authorizeBy.split('@')[1].split('/');
                                    var instance = result[items[0]];
                                    for (var i = 1; i < items.length; i++) {
                                        instance = instance[items[i]];
                                    }

                                    var method = instance(event);
                                }
                            });

                        }
                        else {
                            var event = getEvent(matchItem);

                            var items = matchItem.authorizeBy.split('@')[1].split('/');
                            var instance = code[items[0]];
                            for (var i = 1; i < items.length; i++) {
                                instance = instance[items[i]];
                            }

                            var method = instance(event);
                        }
                    }
                }
            }
            else {
                if (matchItem.handler) {
                    var module = require(path.join(rootDir, matchItem.handler.module));
                    var event = {
                        isAuthenticated: false,
                        req: req,
                        res: res,
                        redirectTo: undefined,
                        done: (err) => {
                            if (err) {
                                callback(err);
                                if (_onError) {
                                    _onError({
                                        url: req.url,
                                        error:err
                                    });
                                }
                            }
                            else {
                                var file = inputUrl;
                                if (file[0] == "~") {
                                    file = file.substring(2, file.length);
                                }
                                callback(undefined, {
                                    file: file + ".html"
                                });

                            }

                        }
                    };
                    module[matchItem.handler.method](event);
                }
                else {
                    var file = inputUrl;
                    if (file[0] == "~") {
                        file = file.substring(2, file.length);
                    }
                    callback(undefined, {
                        file: file + ".html"
                    });
                }
            }
        }
        else {
            var file = inputUrl;
            if (file[0] == "~") {
                file = file.substring(2, file.length);
            }
            callback(undefined, {
                file: file + ".html"
            });
        }
    }
}
var _app_dir;
var set_app_dir = (value) => {
    _app_dir = value;
}
var get_app_dir = () => {
    return _app_dir;
}
var __root_url;
var getRootUrl = (req) => {
    if (!__root_url) {
        __root_url = req.protocol + "://" + req.headers.host + "/" + global.getConfig().rootWebServerDir;
        while (__root_url[__root_url.length - 1] == "/") {
            __root_url = __root_url.substring(0, __root_url.length - 1);
        }
    }
    return __root_url;
}
var exec_handler = (info, req, res, handler) => {
    var _run = (info, req, res, handler, form) => {
        var createEvent = (info) => {
            var evt = {
                req: req,
                res: res,
                rootUrl: getRootUrl(req),
                params: info.params,
                form: form,
                loadModule: (name) => {
                    return require(name)
                },
                app_dir: get_app_dir(),
                done: (err) => {
                    if (err) {
                        utils.writeError(evt.res, err);
                        
                        if (_onError) {
                            _onError({
                                url: req.url,
                                error: err
                            });
                        }
                    }
                    else {
                        if (!evt.res.finished) {
                            evt.res.end("");
                        }
                    }
                }
            };
            return evt;
        }
        if (!_app_dir) {
            throw ("set_app_dir was not call in route")
        }
        else {
            if (info.handler.indexOf("(nodejs)") == -1) {
                if (info.handler.indexOf("@") == -1) {
                    var items = info.handler.split('/');
                    var _path = "";
                    for (var i = 0; i < items.length - 1; i++) {
                        _path += items[i] + "/";
                    }
                    _path = _path.substring(0, _path.length - 1);
                    var m = require(get_app_dir() + "/" + _path + ".js");
                    m[items[items.length - 1]](createEvent(info));
                }
                else {
                    var file = global.get_app_dir() + "\\" + info.handler.split('@')[0] + ".js";

                    var code = get_code_from_cache(file);
                    if (!code) {
                        lock.acquire(_lock_key, done => {
                            load_code_file(file, (err, data) => {
                                if (err) {
                                    done(err);

                                }
                                else {
                                    set_code_to_cache(file, data);
                                    done(undefined, data);
                                }
                            });
                        }, (err, result) => {

                            if (err) {
                                var dError = {
                                    error: err,
                                    source: file
                                }
                                utils.writeError(res, dError);


                                if (_onError) {
                                    _onError(dError);
                                }
                            }
                            else {
                                try {
                                    var items = info.handler.split('@')[1].split('/');
                                    var ins = result[items[0]];
                                    for (var i = 1; i < items.length; i++) {
                                        ins = ins[items[i]];
                                    }
                                    var event = createEvent(info);
                                    ins(event);
                                }
                                catch (ex) {
                                    var dError = {
                                        message: ex.message || ex,
                                        source: file
                                    };
                                    utils.writeError(res, dError);
                                    if (_onError) {
                                        _onError(dError);
                                    }
                                    //res.end(JSON.str ex);
                                }
                            }



                        });
                    }
                    else {
                        var items = info.handler.split('@')[1].split('/');

                        var ins = code[items[0]];
                        for (var i = 1; i < items.length; i++) {
                            ins = ins[items[i]];
                        }
                        var event = createEvent(info);
                        utils.debug("hcs.route/lv.api.process");
                        ins(event);


                    }
                }
            }
            else {
                try {
                    var rootDir = path.parse(require.main.filename);
                    var modulePath = info.handler.split("(nodejs)")[1].split("@")[0];
                    
                    var mPath = require.resolve("./" + path.join(path.relative(__dirname, "./"), modulePath));
                    chokidar.watch(mPath).on("change", f => {
                        delete require.cache[f];
                    })
                    var m = require("./" + path.join(path.relative(__dirname, "./"), modulePath));
                    var method = info.handler.split("(nodejs)")[1].split("@")[1];
                    var event = createEvent(info);
                    m[method](event);
                }
                catch (ex) {
                    if (_onError) {
                        _onError({
                            url: req.url,
                            error: ex
                        });
                    }
                    res.end(JSON.stringify({
                        error: {
                            message: ex.message || ex,
                            source: info.handler
                        }
                    }))
                    
                }
            }
        }
    };
    if (req.method == "POST") {
        var request = req;
        var body = '';

        request.on('data', function (data) {
            body += data;
        });

        request.on('end', function () {
            req.jsonData = (body == "") ? "{}" : body;
            var x = body;
            var items = body.split('&');
            var form = {};
            for (var i = 0; i < items.length; i++) {
                if (items[i].indexOf('=') > -1) {
                    form[items[i].split('=')[0]] = unescape(items[i].split('=')[1]);
                }
                else {
                    form[items[i].split('=')[0]] = undefined;
                }
            }
            try {
                req.postData = JSON.parse(req.jsonData);
            }
            catch (ex) {

            }
            _run(info, req, res, handler, form);
        });
    }
    else {
        _run(info, req, res, handler);
    }
}
const PATH = require("path");
var exec_authorize = (info, req, res, handler) => {
    var _run = (info, req, res, handler, form) => {
        var createEvent = (info) => {
            var evt = {
                req: req,
                res: res,
                params: info.params,
                form: form,
                rootUrl: getRootUrl(req),
                loadModule: (name) => {
                    return require(name)
                },
                app_dir: get_app_dir(),
                done: (err) => {
                    if (err) {
                        handler(err);
                        if (_onError) {
                            _onError({
                                url: req.url,
                                error: err
                            });
                        }
                    }
                    else {
                        handler(undefined, evt);
                    }

                }
            };
            return evt;
        }
        if (!_app_dir) {
            throw ("set_app_dir was not call in route")
        }
        else {
            if (info.authorizeBy.substring(0,"(nodejs)".length) === "(nodejs)") {
                if (!global.cache) global.cache = {};
                if (!global.cache.modules_authorize) global.cache.modules_authorize = {};
                if (!global.cache.modules_authorize[info.authorizeBy]) {
                    var modulePath = info.authorizeBy.split("(nodejs)")[1].split('@')[0];
                    var method = info.authorizeBy.split("(nodejs)")[1].split("@")[1];
                    var mPath = require.resolve("./" + PATH.join(PATH.relative(__dirname, "./"), modulePath));
                    chokidar.watch(mPath).on("change", f => {
                        delete require.cache[f];
                        global.cache.modules_authorize = {};

                    });
                    
                    
                    var m;
                    try {
                        m = require("./" + PATH.join(PATH.relative(__dirname, "./"), modulePath));
                        var event = createEvent(info);
                        m[method](event);
                        global.cache.modules_authorize[info.authorizeBy] = m[method]
                    }
                    catch (ex) {
                        var dError = {
                            message: ex.message || ex,
                            source: mPath
                        }
                        utils.writeError(res, dError);

                        if (_onError) {
                            _onError(dError);
                        }
                    }
                   
                }
                else {
                    try {
                        var event = createEvent(info);
                        global.cache.modules_authorize[info.authorizeBy](event);
                    }
                    catch (ex) {
                        var dError = {
                            message: ex.message || ex,
                            source: mPath
                        }
                        utils.writeError(res, dError);

                        if (_onError) {
                            _onError(dError);
                        }
                    }
                }
                
            }
            else {
                if (info.authorizeBy.indexOf("@") == -1) {
                    var items = info.authorizeBy.split('/');
                    var path = "";
                    for (var i = 0; i < items.length - 1; i++) {
                        path += items[i] + "/";
                    }
                    path = path.substring(0, path.length - 1);
                    var m = require(get_app_dir() + "/" + path + ".js");
                    m[items[items.length - 1]](createEvent(info));
                }
                else {
                    var file = global.get_app_dir() + "\\" + info.authorizeBy.split('@')[0] + ".js";

                    var code = get_code_from_cache(file);
                    if (!code) {
                        lock.acquire(_lock_key, done => {
                            load_code_file(file, (err, data) => {
                                if (err) {
                                    done(err);
                                }
                                else {
                                    set_code_to_cache(file, data);
                                    done(undefined, data);
                                }
                            });
                        }, (err, result) => {

                            if (err) {
                                if (_onError) {
                                    _onError({
                                        url: req.url,
                                        error: err
                                    });
                                }
                                res.end(JSON.stringify(err));
                            }
                            try {
                                var items = info.authorizeBy.split('@')[1].split('/');
                                var ins = result[items[0]];
                                for (var i = 1; i < items.length; i++) {
                                    ins = ins[items[i]];
                                }
                                var event = createEvent(info);
                                ins(event);
                            }
                            catch (ex) {
                                var dError = {
                                    message: ex.message || ex,
                                    source: file
                                }
                                utils.writeError(res, dError);

                                if (_onError) {
                                    _onError(dError);
                                }

                            }


                        });
                    }
                    else {
                        var items = info.authorizeBy.split('@')[1].split('/');
                        var items = info.authorizeBy.split('@')[1].split('/');
                        var ins = code[items[0]];
                        for (var i = 1; i < items.length; i++) {
                            ins = ins[items[i]];
                        }
                        var event = createEvent(info);
                        ins(event);


                    }
                }
            }
        }
    };
    if (req.method == "POST") {
        var request = req;
        var body = '';

        request.on('data', function (data) {
            body += data;
        });

        request.on('end', function () {
            var x = body;
            var items = body.split('&');
            var form = {};
            for (var i = 0; i < items.length; i++) {
                if (items[i].indexOf('=') > -1) {
                    form[items[i].split('=')[0]] = unescape(items[i].split('=')[1]);
                }
                else {
                    form[items[i].split('=')[0]] = undefined;
                }
            }
            try {
                req.postData = JSON.parse(req.jsonData);
            }
            catch (ex) {

            }
            _run(info, req, res, handler, form);
        });
    }
    else {
        _run(info, req, res, handler);
    }
}
module.exports = {
    run: run,
    load: config_loader,
    getRoute: (url) => {
        return get_map_route(__routes, url);
    },
    set_app_dir: set_app_dir,
    exec: exec_handler,
    authorize: exec_authorize,
    getRootUrl: getRootUrl,
    onError: onError
}