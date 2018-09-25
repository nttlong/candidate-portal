const Guid = require("guid");
const asyncLock = require("async-lock");
var lock = new asyncLock();
const chokidar = require('chokidar');
var _onError;
var onError = (handler) => {
    _onError = handler;
};
const fs = require("fs");
var _app_dir;
var set_app_dir = (path) => {
    _app_dir = path;
}
var get_app_dir = ()=>{
    return _app_dir;
}
var getApiFromCacheById = (id) => {
    if (!global.argo) global.argo = {};
    if (!global.argo.cache) global.argo.cache = {};
    if (!global.argo.cache.lv_form_api) global.argo.cache.lv_form_api = {
        api: {},
        revert: {}
    };
    var ret = global.argo.cache.lv_form_api.revert[id];
    return ret;
}
var getApiFromCache = (name) => {
    if (!global.argo) global.argo = {};
    if (!global.argo.cache) global.argo.cache = {};
    if (!global.argo.cache.lv_form_api) global.argo.cache.lv_form_api = {
        api: {},
        revert: {}
    };
    if (name)
        return global.argo.cache.lv_form_api.api[name];
    else {
        return global.argo.cache.lv_form_api
    }
}
var setApiToCache = (name, data) => {
    if (!global.argo) global.argo = {};
    if (!global.argo.cache) global.argo.cache = {};
    if (!data) {
        if (!global.argo.cache.lv_form_api) global.argo.cache.lv_form_api = name;
    }
    else {
        global.argo.cache.lv_form_api.api[data.api] = data.id;
        global.argo.cache.lv_form_api.revert[data.id] = data;
    }
    
}
var getFormActions = (content) => {
    var _content = content;
    var ret = [];
    var reg = /action\s*=\s*\"api\:(\((?:\[??[^\[]*?\)))/i;
    var m = reg.exec(_content);
    while (m) {
        var endIndex = _content.indexOf('"', m.index + m[0].length);
        var replacer = _content.substring(m.index, endIndex);
        var apiPath = replacer.split(':')[1].split('(')[1].split(')')[0];
        var item = {
            replacer: replacer,
            start: m.index,
            api: apiPath
        };
        _content = _content.substring(endIndex, _content.length);
        m = reg.exec(_content);
        ret.push(item);
    }
    return ret;
}
var render = (req, content, handler) => {
    var filePath = get_app_dir() + "/app_data/form_api/api.json";
    var run = (index,content,list) => {
        if (index < list.length) {
            var matchItem = list[index];
            var data = getApiFromCache(matchItem.api);
            if (!data) {
                lock.acquire(filePath, done => {
                    if (!_app_dir) done({ error: "please call set_app_dir of module 'lv.render.form'" })
                    else {
                        fs.readFile(filePath, 'utf8', (err, result) => {
                            if (err) done(err)
                            else {
                                try {
                                    var data = eval("(" + result + ")");
                                    if (!data.revert) {
                                        data.revert = {}; data.api = {};
                                    }
                                    setApiToCache(data);
                                    var item = data.api[matchItem.api] ? data.revert[data.api[matchItem.api]] : undefined
                                    if (!item) {
                                        item = {
                                            id: Guid.create().value,
                                            api: matchItem.api
                                        };
                                        setApiToCache(matchItem.api, item);
                                        fs.writeFile(filePath, JSON.stringify(getApiFromCache()), "utf8", (err, r) => {
                                            if (err) {
                                                done(err);
                                                
                                            }
                                            else
                                                done(undefined, item);
                                        });

                                    }
                                    else {
                                      
                                        done(undefined, item);

                                    }
                                }
                                catch (ex) {
                                    done(ex);
                                   
                                }
                            }
                        });
                        
                    }
                    
                }, (err, result) => {
                    if (err) {
                        handler(err);
                        if (_onError) {
                            _onError(err);
                        }
                    }
                    else {
                        try {
                            var _content = content;
                            setApiToCache(result.api, result);
                            var action = "action=\"" + req.protocol + "://" + req.headers.host + "/" + global.getConfig().rootWebServerDir + "form_post/" + result.id;
                            _content = _content.replace(matchItem.replacer, action);
                        }
                        catch (ex) {
                            handler(ex);
                            if (_onError) {
                                _onError(ex);
                            }
                        }

                        run(index + 1, _content, list);
                    }
                })
            }
            else {
                var _content = content;
                var action = "action=\"" + req.protocol + "://" + req.headers.host + "/" + global.getConfig().rootWebServerDir + "form_post/" + data;
                _content = _content.replace(matchItem.replacer, action);

                run(index + 1, _content, list);
            }
        }
        else {
            handler(undefined, content)
        }
    }
    var listOfApi = getFormActions(content);
    if (listOfApi.length == 0) handler(undefined, content, listOfApi);
    else {
        run(0, content, listOfApi);
        
    }
}
var get_api_info = (id, handler) => {
    var info = getApiFromCacheById(id);
    if (!info) {
        lock.acquire("lv.render.form", done => {
            fs.readFile(get_app_dir() + "/app_data/form_api/api.json", "utf8", (err, data) => {
                if (err) {
                    handler(err);
                    if (_onError) {
                        _onError(err);
                    }
                }
                else {
                    var info = eval("(" + data + ")");
                    var item = info.revert[id];
                    if (item) {
                        setApiToCache(item.api, item);
                        done(undefined, item);
                    }
                    else {
                        done({
                            message:"'"+id+"' was not found"
                        });
                    }
                }
            });
        }, (err, data) => {
            if (err) handler(err)
            else 
            handler(undefined, data);
        });
    }
    else {
        handler(undefined, info);
    }
}
module.exports = {
    
    render: render,
    set_app_dir: set_app_dir,
    get_api_info: get_api_info,
    onError: onError
}