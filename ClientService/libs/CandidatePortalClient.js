const http = require('http');
const FS = require("fs");
const logs = require("./lv.logs");
//const request = require("request-promise");
var _AppId;
var _hostname;
var _port;
var fire_error = (reject, callback, err) => {
    if (_onError && (typeof _onError === "function")) {
        _onError(err);
    }
    if (callback) callback(err);
    else reject(err);
};
var fire_get_result = (resole, callback, result) => {
    if (callback) callback(undefined, result);
    else resole(result);
};
var setPort = (port) => {
    setCache("port", port);
};
var getPort = () => {
    return getCache("port");
};
var setAppId = (appId) => {
    setCache("AppId", appId);
};
var getAppId = () => {
    return getCache("AppId");
}
var setCache = (key, value) => {
    if (!global.cache_candidate_portal_config) global.cache_candidate_portal_config = {};
    global.cache_candidate_portal_config[key] = value;
}
var getCache=(key) => {
    if (!global.cache_candidate_portal_config) global.cache_candidate_portal_config = {};
    return global.cache_candidate_portal_config[key];
}
var getConfig=() => {
    return global.cache_candidate_portal_config;
}
/**
 * Dat dia chi web site
 * @param {any} hostname
 */
var setHostName = (hostname) => {
    setCache("hostname", hostname);
};
var getHostName = () => {
    return getCache("hostname");
};
var setAccessToken = (token) => {
    logs.info("TK", token);
    setCache("AccessToken", token);
};
var getAccessToken = ()=>{
    return getCache("AccessToken");
}
//var postRequest = (api_name, data, callback) => {
//    return new Promise((resolve, reject) => {
//        if (!getHostName()) {
//            fire_error(reject, callback, { error: { message: "hostname was not set" } });
//            return;
//        }
//        if (!getPort()) {
//            fire_error(reject, callback, { error: { message: "port was not set" } });
//            return;
//        }
//        try {

//            var options = {
//                method: 'POST',
//                uri: getHostName() + "/dev/api/" + api_name,
//                json: true,
//                body: {
//                    AppId: getAppId(),
//                    data: JSON.stringify(data),
//                    AccessToken: getAccessToken()
//                }
//            };
//            request(options)
//                .then(function (response) {
//                    fire_get_result(resolve, callback, response);
//                })
//                .catch(function (err) {
//                    fire_get_result(reject, callback, {
//                        error: err
//                    });
//                });
            
//        } catch (e) {
//            fire_error(reject, callback, e);
//        }
//    });
//};
var get_access_token = (callback) => {
    return new Promise((resolve, reject) => {
        postRequest("get_access_token", {})
            .then(result => {
                setAccessToken(result.data.AccessToken);
                fire_get_result(resolve, callback, result);
            })
            .catch(ex => {
                fire_error(reject, callback, ex);
            });
    });
};
var _onError;
var onError = (handler) => {
    _onError = handler
};
var loadInfo = (callback) => {
    return new Promise((resolve, reject) => {
        try {
            var path = "./app_data/config/candidate_portal_app_id.json";
            if (!FS.existsSync(path)) {
                throw ("'" + path + "' was not found");
                return;
            }
            var txt = FS.readFileSync(path, "utf-8");
            var data = Function("return " + txt)();
            setHostName(data.Host);
            setPort(data.Port);
            setAccessToken(data.AccessToken);
            fire_get_result(resolve, callback, data);

        }
        catch (ex) {
            fire_error(reject, callback, ex);
        }

    });
};
var saveInfo = (callback) => {
    return new Promise((resolve, reject) => {
        try {
            if ((!getHostName()) || (getHostName() === "")) {
                throw ("hotsname is empty");
                return;
            }
            if ((!getPort()) || (getPort() === "")) {
                throw ("Port is empty");
                return;
            }
            if ((!getAppId()) || (getAppId() === "")) {
                throw ("AppId is empty");
                return;
            }
            var path = "./app_data/config/candidate_portal_app_id.json";
            var data = {
                AppId: getAppId(),
                "Host": getHostName(),
                "Port": getPort(),
                AccessToken:getAccessToken()
            };
            var ret = FS.writeFileSync(path, JSON.stringify(data), "utf-8");
            fire_get_result(resolve, callback, ret);
        }
        catch (ex) {
            fire_error(reject, callback, ex);
        }
    });
}
module.exports = {
    setHostName: setHostName,
    setPort: setPort,
    loadInfo: loadInfo,
    get_access_token: get_access_token,
    //postRequest: postRequest,
    onError: onError,
    getAppId: getAppId,
    setAppId: setAppId,
    saveInfo: saveInfo,
    getConfig: getConfig,
    setAccessToken: setAccessToken,
    getAccessToken: getAccessToken
}
