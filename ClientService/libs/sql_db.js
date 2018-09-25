const FS = require("fs");
const SQL = require('mssql')
var _onError;
var onError = (callback) => {
    _onError = callback;
};
var fireError = (reject, callback, err) => {
    if (_onError && (typeof _onError === "function")) {
        _onError(err);
    }
    if (callback) callback(err);
    else reject(err);
}
var fireGetResult = (resolve, callback, result) => {
    if (callback) callback(undefined, result);
    else resolve(result);
}
var getConfig = (callback) => {
    return new Promise((resolve, reject) => {
        try {
            if (!global.cache) {
                global.cache = {};
            }
            if (!global.cache.sqlConnectionConfig) {
                FS.exists("./app_data/config/sqlConnection.json", ok => {
                    if (!ok) {
                        fireError(reject, callback, {
                            message: "./app_data/config/sqlConnection.json was not found"
                        });
                    }
                    else {
                        FS.readFile("./app_data/config/sqlConnection.json", "utf-8", (err, result) => {
                            global.cache.sqlConnectionConfig = Function("return " + result)();
                            fireGetResult(resolve, callback, global.cache.sqlConnectionConfig);
                        });
                    }
                });
            }
            else {
                fireGetResult(resolve, callback, global.cache.sqlConnectionConfig);
            }
        }
        catch (ex) {
            fireError(reject, callback, ex);
        }
    });
};
var setConfig = (config, callback) => {
    return new Promise((resolve, reject) => {
        try {
            if ((!config.user) || (config.user === "")) {
                throw ({ message: "user was not found" })
                return;
            }
            if ((!config.password) || (config.password === "")) {
                throw ({ message: "password was not found" })
                return;
            }
            if ((!config.server) || (config.server === "")) {
                throw ({ message: "server was not found" })
                return;
            }
            if ((!config.database) || (config.database === "")) {
                throw ({ message: "database was not found" })
                return;
            }
            if (!global.cache) {
                global.cache = {};
            }
            global.cache.sqlConnectionConfig = config;
            FS.writeFile("./app_data/config/sqlConnection.json", JSON.stringify(config), "utf-8", (err, result) => {
                if (err) fireError(reject, callback, err);
                else 
                fireGetResult(resolve, callback, global.cache.sqlConnectionConfig);
            });
        }
        catch (ex) {
            fireError(reject, callback, ex);
        }
        
    });
    
};
var getConn = (callback) => {
    return new Promise((resolve, reject) => {
        try {
            getConfig()
                .then(config => {
                    SQL.close()
                        .then(result => {
                            SQL.connect(config)
                                .then(cnn => {
                                    fireGetResult(resolve, callback, cnn);
                                })
                                .catch(ex => {
                                    fireError(reject, callback, ex);
                                });
                        })
                        .catch(ex => {
                            fireError(reject, callback, ex);
                        });
                    
                })
                .catch(ex => {
                    fireError(reject, callback, ex);
                })
        }
        catch (ex) {
            fireError(ex);
        }
    });
};
var tryConfig = (config, callback) => {
    return new Promise((resolve, reject) => {
        try {
            var oldConfig;
            getConfig()
                .then(_config => {
                    oldConfig = _config;
                    global.cache.sqlConnectionConfig = config;
                    getConn()
                        .then(cnn => {
                            var x=cnn.request()
                                .query('select 1');
                            global.cache.sqlConnectionConfig = oldConfig;
                            fireGetResult(resolve, callback, true);
                        })
                        .catch(ex => {
                            fireError(reject, callback, ex);
                            global.cache.sqlConnectionConfig = oldConfig;
                        })

                })
                .catch(ex => {
                    fireError(reject, callback, ex);
                });
        }
        catch (ex) {
            fireError(reject, callback, ex);
        }
    });
};
module.exports = {
    getConfig: getConfig,
    getConn: getConn,
    setConfig: setConfig,
    tryConfig: tryConfig
}

