const FS = require('fs');
const PATH = require("path");
var instances = {};
var _configPath = "./app_data/api/public_api.json"
const lv_log = require("./../libs/lv.logs");
var sync = require('sync');
function api(name) {
    var me = this;
    instances[name] = me;
   
    me.name = name;
    me.instance = instances[name];
    me.instance.info = {};
    me.setDescription = (text => {
        me.instance.info.description = text;
        return me;
    });
    me.setParamInfo = (paramName, type, isRequire, description) => {
        if (!me.instance.info.params) me.instance.info.params = {};
        me.instance.info.params[paramName] = {
            name: paramName,
            type: type,
            isRequire: isRequire,
            description: description
        };
        return me;
    };
    me.addParamDescription = (paramName, text) => {
        me.instance.info.params[paramName].description += text;
        return me;
    }
    me.setReturnInfo = (paramName, type,description) => {
        if (!me.instance.info.return) me.instance.info.return = {};
        me.instance.info.return[paramName] = {
            name: paramName,
            type: type,
            description: description
        }
        return me;
    }
    me.setBody = (fn) => {
        if (typeof fn !== "function") {
            
            throw ("'body' of '" + me.name + "' must be a function");
        }
        me.instance.body = (data, callback) => {
            return new Promise((resolve, reject) => {
                var sender = {
                    AppId: data.AppId,
                    params: JSON.parse(data.data || "{}"),
                    server: data.server,
                    done: (result) => {
                        handler(resolve, callback, result);
                    },
                    error: (err) => {
                        handlerError(reject, callback, err);
                    }
                }
                sync(() => {
                    try {
                        fn(sender);
                    }
                    catch (ex) {
                        handlerError(reject, callback, {
                            error: ex.message||ex
                        });
                    }
                    
                });
                
            });
        };
        
        return me;
    };
    me.getValue = (data, key) => {
        var ret = data;
        if (!key) return ret;
        var items = key.split('.');
        for (var i = 0; i < items.length; i++) {
            if ((ret[items[i]]) || (ret[items[i]]===0)) {
                ret = ret[items[i]];
            }
            else {
                return null;
            }
            
        }
        return ret;
    };
    me.verifyParams = (data) => {
        if (!me.instance.info.params) return [];
        if ((!data) && (me.instance.info.params)) return [{
            code: "PR001",
            message: "Param can not be empty"
        }];
        var keys = Object.keys(me.instance.info.params);
        var ret = [];
        keys.forEach(key => {
            var item = me.instance.info.params[key];
            if (item.isRequire) {
                var value = me.getValue(data, key);
                if ((!value) && (value !== 0)) {
                    ret.push({
                        code: "PR002",
                        message: "'" + key + "' can not be empty",
                        param: key
                    });
                }
            }
        });
        return ret;
    };
    me.regist = (_module) => {
        if (!me.instance.body) {
            throw ("'body' of '" + me.name + "' is empty");
        }
       
        if ((!me.instance.info) || (!me.instance.info.return)) {
            throw ("'return' of '" + me.name + "' is empty");
        }
        _module.exports[me.name] = (data, callback) => {
            return new Promise((resolve, reject) => {
                try {
                    var ret = me.verifyParams(JSON.parse(data.data||"{}"));
                    if (ret.length > 0) {
                        handlerError(reject, callback, ret);
                        return;
                    }
                    me.body(data).then(ret => {
                        handler(resolve, callback, ret);
                    })
                        .catch(ex => {
                            handlerError(reject, callback, ex);
                        });
                }
                catch (ex) {
                    handlerError(reject, callback, ex);
                }

            });
        };
        try {
            if (!FS.existsSync(_configPath)) {
                var data = {};
                FS.writeFileSync(_configPath, JSON.stringify(data), "utf-8");
            }
            else {
                var content = FS.readFileSync(_configPath, "utf-8");
                var data = Function("return " + content)();
                data[me.name] = me.instance.info;
                FS.writeFileSync(_configPath, JSON.stringify(data), "utf-8");
            }
        }
        catch (ex) {
           // lv_log.debug(ex);
            handlerError(reject, callback, ex);
        }
    }
}

var handlerError = (reject, callback, err) => {
    if (callback) callback(err);
    else reject(err);
};
var handler = (resolve, callback, data) => {
    if (callback) callback(data);
    else resolve(data);
};
var createApi = (name) => {
    return new api(name);
}
module.exports = {
    createApi: createApi
}
