const sql = require('mssql');
const express = require('express');
const reqdt = require('request');
const request = require("request-promise");
const fs = require('fs');
var path = require('path'); 
const app = express();
const lv_sql = require('./libs/lv.mysql.controllers');

//fs.exists("app_data/config/services.json", function (exits) {
//    var data = [];
//    var obj = {};
//    obj.ServiceName = 'Data Sync Mongodb To C&B';
//    obj.Description = 'Service đồng bộ dữ liệu từ MongoDB về C&B';
//    obj.Script = path.join(__dirname, "SqlSyncDataCP.js");
//    if (!exits) {
//        data.push(obj);
//        // Do something
//        fs.writeFile("app_data/config/services.json", JSON.stringify(data), "utf-8", (err, result) => {
//            if (err) {
//                return;
//            }
//            else {
//                var result = Function("return " + result)();
//            }
//        });
//    } else {
//        fs.readFile("app_data/config/services.json", "utf-8", (err, result) => {
//            if (err) {
//                return;
//            }
//            else {
//                var result = Function("return " + result)();
//                if (result.length > 0) {
//                    data = result;
//                } 
//                data.push(obj);
//                fs.writeFile("app_data/config/services.json", JSON.stringify(data), "utf-8", (err, result) => {
//                    if (err) {
//                        return;
//                    }
//                    else {
//                        var result = Function("return " + result)();
//                    }
//                });
//            }
//        });
//    }
//})

//const dbConfig = {
//    server: null,
//    database: null,
//    user: null,
//    password: null,
//    port: null
//}

//fs.readFile("app_data/config/sqlConnection.json", "utf-8", (err, result) => {
//    if (err) {
//        return;
//    }
//    else {
//        var result = Function("return " + result)();
//        dbConfig.server = result.server;
//        dbConfig.database = result.database;
//        dbConfig.user = result.user;
//        dbConfig.password = result.password;
//        dbConfig.port = result.port;
//    }
//});

 
const candidateConfig = {
    host: '',
    port: 80,
    AppId: '',
    AccessToken: ''
}

fs.readFile("app_data/config/candidate_portal_app_id.json", "utf-8", (err, result) => {
    if (err) {
        return;
    }
    else {
        var result = Function("return " + result)();
        candidateConfig.host = result.Host;
        candidateConfig.port = result.Port;
        candidateConfig.AppId = result.AppId;
        candidateConfig.AccessToken = result.AccessToken;
    }
});

// Ham get API tu server mongoDB tra ve
var postRequest = (api_name = null, data = null, callback = null) => {
    return new Promise((resolve, reject) => {
        if (!candidateConfig.host) {
            return reject("No Host");
        }
        if (!candidateConfig.port) {
            return reject("No Port");
        }
        try {
            var options = {
                method: 'POST',
                uri: candidateConfig.host + "/dev/api/" + api_name,
                json: true,
                body: {
                    AppId: candidateConfig.AppId,
                    data: JSON.stringify({ pageSize: 999}),
                    AccessToken: candidateConfig.AccessToken
                }
            };
            request(options)
                .then(function (response) {
                    if (callback) {
                        callback();
                    }
                    return resolve(response);
                })
                .catch(function (err) {
                    return reject(err);
                });

        } catch (e) {
            return reject(e + " yyy ");
        }
    });
};
// ham check data khac nhau
var checkObject = (obj1, obj2) => {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
}
// ham chuyen doi data tu mongdb giong field sql
var convertMongodbtoSql = (data, key) => {
    var obj = {};
    for (var i = 0; i < key.length; i++) {
        obj[key[i]] = data[key[i]];
    }
    return obj;
}

// Ham chay kiem tra 2 data
var loopDataCheck = (data1, data2, req, callback) => {
    for (var i = 0; i < data1.recordset.length; i++) {
        if (data2 && data2.data) {
            var obj_data = data2.data.items.filter(item => item.Code == data1.recordset[i]["RequisitionCode"]);
            if (obj_data) {
                if (obj_data) {
                    if (obj_data[0] && data1.recordset[i] && obj_data[0].Code == data1.recordset[i]["RequisitionCode"]) {
                        updateMssql(obj_data[0], req);
                    }
                }
            }
        }
    }
}
// Ham update du lieu qua sql
//var updateMssql = (data, reqCnn) => {
//    return new Promise((resolve, reject) => {
//        reqCnn.query("UPDATE TASAT_Requisition SET IsPosting = 0 WHERE RequisitionCode = '" + data.Code + "'", function (err, recordset) {
//            if (err) {
//                reject(err);
//            } else {
//                // send records as a response
//                resolve(recordset);
//            }
//        });
//    })
//}

//// Ham insert data vao sql
//var service = {
//    name: 'Sql Sync Data CP',
//    description: 'Dịch vụ đồng bộ dữ liệu từ candidate về sql',
//    script: path.join(__dirname, "SqlSyncDataCP.js")
//};

//var fnInsertData = () => {
//    return new Promise((resolve, reject) => {
//        lv_sql.getDbConfig().then(dbconfig => {
//            lv_sql.getConectionSql(dbconfig).then(req => {
//                lv_sql.insertDataServices(req, `
//                    INSERT INTO dbo.OData_Services
//                            ( ServiceName ,
//                              Description ,
//                              Script
//                            )
//                    VALUES  ( N'` + service.name + `' , -- ServiceName - nvarchar(max)
//                              N'` + service.description + `' , -- Description - nvarchar(max)
//                              N'` + service.script + `'  -- Script - nvarchar(300)
//                            )
//                `).then(res => {
//                    })
//            })
//        })
//    })
//}

//fnInsertData();

//setInterval(function () {
    return new Promise((resolve, reject) => {
        lv_sql.getDbConfig().then(dbconfig => {
            lv_sql.getConectionSql(dbconfig).then(req => {
                lv_sql.execData(req, "SELECT RequisitionCode, JobWTasks, JobWDuty, NumNeed, JobWRequest, ReceiveFrom, ReceiveTo " +
                    "FROM TASAT_Requisition WHERE IsPosting = 1").then(data => {
                        if (data.recordset.length > 0) {
                            postRequest('get_list_of_requistion').then(dtReq => {
                                loopDataCheck(data, dtReq, req);
                            }).catch(ex => {
                                log_file.write(ex + '\n');
                                log_stdout.write(ex + '\n');
                            })
                        }
                    }).catch(ex => {
                        log_file.write(ex + '\n');
                        log_stdout.write(ex + '\n');
                    })
            }).catch(ex => {
                log_file.write(ex + '\n');
                log_stdout.write(ex + '\n');
            })
        })
    })
//}, 3000);
