const ascLock = require("async-lock");
const path = require("path");
const GUID = require("guid");
var _onError;
var onError = (hanlder) => {
    _onError = hanlder;
}
var lock = new ascLock();
var fs = require("fs");
var _dir;
var setDir = (value) => {
    _dir = value;
}
var scan = (content) => {
    var _content = content;
    var ret = [];
    var reg = /\"ajax\.store\..*\"/i;
    var m = reg.exec(_content);
    while (m) {
        var api = m[0].split('"')[1].split('"')[0];
        api = api.substring("ajax.store.".length, api.length);
        var item = {
            replacer: m[0],
            api:api
        }
        ret.push(item);
        _content = _content.substring(m.index + m[0].length, _content.length);
        m = reg.exec(_content);
    }
    return ret;
}
var createAjaxApi = (filePath, api, handler) => {
    while (filePath.indexOf('/') > -1) {
        filePath = filePath.replace('/', '.');
    }
    while (filePath.indexOf('\\') > -1) {
        filePath = filePath.replace('\\', '.');
    }
    while (filePath[0] == '.') {
        filePath = filePath.substring(1, filePath.length);
    }
    var info = path.parse(path.join(_dir, filePath));
    var fPath = info.dir+"\\"+ info.name + ".ajax.json";
    lock.acquire("ajax_render", done => {
        fs.exists(fPath, ok => {
            if (!ok) {
                var id = GUID.create().value;
                var data = {
                    api: {},
                    revert: {}
                };
                data.api[api] = id;
                data.revert[id] = {
                    id: id,
                    api: api
                };
                fs.writeFile(fPath, JSON.stringify(data), "utf8", err => {
                    if (err) {
                        done(err);
                       
                    }
                    else {
                        done(undefined, id)
                    }
                });
            }
            else {
                fs.readFile(fPath, "utf8", (err, result) => {
                    if (err) {
                        done(err);
                       
                    }
                    else {
                        var data = eval("(" + result + ")");
                        if (data.api[api]) {
                            done(undefined, data.api[api]);
                        }
                        else {
                            var id = GUID.create().value;
                            data.api[api] = id;
                            data.revert[id] = {
                                id: id,
                                api: api
                            };
                            fs.writeFile(fPath, JSON.stringify(data), "utf8", err => {
                                if (err) {
                                    done(err);
                                   
                                }
                                else {
                                    done(undefined, id)
                                }
                            });
                        }
                    }
                });
            }
        });
    }, (err, result) => {
        if (err) {
            handler(err);
            if (_onError) {
                _onError(err);
            }
        }
        else {
            handler(undefined, result);
        }
    });
}
var render = (content, filePath, done, handler) => {
    var retContent = content;
    var list = scan(content);
    var next = (index) => {
        if (index < list.length) {
            createAjaxApi(filePath, list[index].api, (err, id) => {
                var sender = {
                    api: list[index].api,
                    replaceBy: "",
                    replacer: list[index].replacer,
                    id: id,
                    done: (err) => {
                        if (err) {
                            if (_onError) {
                                _onError(err);
                            }
                        }
                        if (!global.lv_api_store_caller) global.lv_api_store_caller = {};
                        global.lv_api_store_caller[id] = list[index].api;
                        while (retContent.indexOf(sender.replacer) > -1) {
                            retContent = retContent.replace(sender.replacer, sender.replaceBy);
                        }
                        next(index + 1);
                    }
                };
                done(sender);
            });
        }
        else {
            handler(undefined, retContent)
        }
    }
    next(0);
}
module.exports = {
    scan: scan,
    render: render,
    setDir: setDir,
    onError: onError
}