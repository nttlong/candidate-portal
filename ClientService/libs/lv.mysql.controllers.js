const sql = require('mssql');
const fs = require('fs');
const logs = require("./lv.logs")

var fire_error = (reject, callback, err) => {
    //if (_onError && (typeof _onError === "function")) {
    //    _onError(err);
    //}
    if (callback) callback(err);
    else reject(err);
};
var fire_get_result = (resolve, callback, result) => {
    if (callback) callback(undefined, result);
    else resolve(result);
};
var getDbConfig = (callback) => {
    return new Promise((resolve, reject) => { 
        try {
            var path = "./app_data/config/sqlConnection.json";
            var txt = fs.readFileSync(path, "utf-8");
            var result = Function("return " + txt)();
            var dbConfig = {
                server: null,
                database: null,
                user: null,
                password: null,
                port: null
            }
            dbConfig.server = result.server;
            dbConfig.database = result.database;
            dbConfig.user = result.user;
            dbConfig.password = result.password;
            dbConfig.port = result.port;
            fire_get_result(resolve, callback, dbConfig);
        } catch (ex) {
            logs.debug(`call 'getDbConfig' from path ${path}`, ex);
            fire_error(reject, callback, ex);
        }
    })
}

var getConectionSql = (dbConfig, callback) => {
    return new Promise((resolve, reject) => {
        var conn = new sql.ConnectionPool(dbConfig);
        var req = new sql.Request(conn);
        conn.connect(function (err) {
            if (err) {
                fire_error(reject, callback, err);
                logs.debug("call 'getConectionSql'", err);
            }
            else {
                fire_get_result(resolve, callback, req);
            }
        });
    })
}

function execData(request, strSql, callback) {
    return new Promise((resolve, reject) => {
        request.query(strSql, function (err, recordset) {
            if (err) {
                fire_error(reject, callback, err);
                logs.debug(`call 'execData' with sql=${strSql}`, err);
            } else {
                // send records as a response
                fire_get_result(resolve, callback, recordset);
            }
        });
    })
}

function insertDataServices(request, strSql) {
    return new Promise((resolve, reject) => {
        request.query(strSql, function (err, recordset) {
            if (err) {
                reject(err); 
                logs.debug(`call 'insertDataServices' with sql=${strSql}`, err);
            } else {
                // send records as a response
                resolve(recordset);
            }
        });
    })
}

module.exports = {
    execData: execData,
    getConectionSql: getConectionSql,
    insertDataServices: insertDataServices,
    getDbConfig: getDbConfig
}