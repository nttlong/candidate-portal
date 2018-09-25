const lv_sql = require('./libs/lv.mysql.controllers');
const fs = require('fs');
const request = require("request-promise");
const logs = require("./libs/lv.logs")
// ham get cấu hình của mongodb

var fire_error = (reject, callback, err) => {
    if (_onError && (typeof _onError === "function")) {
        _onError(err);
        logs.debug(err);
    }
    if (callback) callback(err);
    else {
        reject(err);
        logs.debug(err);
    }
};
var fire_get_result = (resolve, callback, result) => {
    if (callback) callback(undefined, result);
    else resolve(result);
};

// Hàm 
var fnGetConfigMongoDb = (callback) => {
    return new Promise((resolve, reject) => {
        try {
            var candidateConfig = {
                host: '',
                port: 80,
                AppId: '',
                AccessToken: ''
            }
            var path = "./app_data/config/candidate_portal_app_id.json";
            var txt = fs.readFileSync(path, "utf-8");
            var result = Function("return " + txt)();
            candidateConfig.host = result.Host;
            candidateConfig.port = result.Port;
            candidateConfig.AppId = result.AppId;
            candidateConfig.AccessToken = result.AccessToken;
            fire_get_result(resolve, callback, candidateConfig);
        }
        catch (ex) {
            fire_error(reject, callback, ex);
        }
    })
}


var fnCheckApplicants = (data, dataUser, dataRequisition, req) => {
    return new Promise((resolve, reject) => {
        lv_sql.execData(req, "SELECT COUNT(*) AS Count FROM TASAT_Applicants  WHERE Email = '" + data.UserEmail + "'").then(dataItem => {
            var ApplicantCode = guid(15);
            if (dataItem.recordsets[0][0].Count == 0) {
                fnInsertDataToAts(ApplicantCode, data, dataUser, dataRequisition, req);
            } else {
                lv_sql.execData(req, "SELECT COUNT(*) AS Count, ApplicantCode FROM TASAT_Applicants WHERE Email = '" + data.UserEmail + "' GROUP BY ApplicantCode").then(dataItem => {
                    if (dataItem.recordsets[0][0].Count > 0) {
                        lv_sql.execData(req, "SELECT COUNT(*) AS Count FROM TASAT_Monitoring WHERE ApplicantCode = '" + dataItem.recordsets[0][0].ApplicantCode + "' AND RequisitionCode = '" + dataRequisition.Code + "'").then(dataReq => {
                            if (dataReq.recordsets[0][0].Count <= 0) {
                                execStoreDataMonitoring(dataItem.recordsets[0][0].ApplicantCode, dataRequisition, req);
                            }
                        })
                    }
                })
            }
        })
        resolve();
    })
}

// hàm lấy dữ liệu từ api candidate
// Ham get API tu server mongoDB tra ve
var postRequest = (candidateConfig = null, api_name = null, data = null, fn_callback = null) => {
    return new Promise((resolve, reject) => {
        if (!candidateConfig.host) {
            return reject("No Host");
        }
        if (!candidateConfig.port) {
            return reject("No Port");
        }
        try {
            logs.info(`Begin call api ${api_name}`)
            var options = {
                method: 'POST',
                uri: candidateConfig.host + "/dev/api/" + api_name,
                json: true,
                body: {
                    AppId: candidateConfig.AppId,
                    data: JSON.stringify({ pageSize: 999, candidateEmail: data }),
                    AccessToken: candidateConfig.AccessToken
                }
            };
            request(options)
                .then(function (response) {
                    logs.info(`Call api ${api_name} OK`);
                    if (fn_callback) {
                        fn_callback();
                    }
                    fire_get_result(resolve, null, response);
                })
                .catch(function (err) {
                    logs.info(`Call api ${api_name} error`);
                    logs.debug(`Call api ${api_name} error`, err);
                    fire_error(reject, null, err);
                });

        } catch (e) {
            return reject(e + " yyy ");
        }
    });
};
// Hàm check ứng viên đã có trên ATS hay chưa 
var fnCheckUniqueUvAts = (data, dataUser, dataRequisition) => {
    return new Promise((resolve, reject) => {
        lv_sql.getDbConfig().then(dbConfig => {
            lv_sql.getConectionSql(dbConfig).then(req => {
                fnCheckApplicants(data, dataUser, dataRequisition, req);
            })
        })
        resolve();
    })
}
// Hàm insert ứng viên lên ATS
var fnInsertDataToAts = (ApplicantCode, data = null, dataUser = null, dataRequisition = null, req = null, calback) => {
    var birthdate = new Date(data.BirthDate);
    return new Promise((resolve, reject) => {
        // Insert data vào bảng TASAT_Applicants
        lv_sql.execData(req, "INSERT INTO TASAT_Applicants (ApplicantCode, LastName, FirstName, Email, Mobile, Birthday, NationCode, Gender, MaritalCode, PProvinceCode, PAddress, CreatedBy, IsFromCP) " +
            "VALUES ('" + ApplicantCode + "',N'" + dataUser.LastName + "',N'" + dataUser.FirstName + "','" + data.UserEmail + "','" + data.Mobile + "','"
            + (birthdate.getFullYear() + '/' + ("0" + (birthdate.getMonth() + 1)).slice(-2) + '/' + ("0" + birthdate.getDate()).slice(-2))
            + "',N'" + data.Nationality.Code + "'," + (data.Sex === 'true' ? 1 : 0)
            + ",'" + data.MarriageStatus.Code + "','" + data.Location.Province.Code + "',N'" + data.FullAddress + "', 'App', 1)").then(dataApp => {
                // Insert bằng cấp
                fnInsertDataDegreeAts(ApplicantCode, data.Degree, req);
                insertDataChungChi(ApplicantCode, data.Cer, req);
                execStoreDataMonitoring(ApplicantCode, dataRequisition, req);
            })
        resolve();
    })
}
// Hàm tạo mã cho ứng viên
function guid(len) {
    var buf = [],
        chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        charlen = chars.length,
        length = len || 32;

    for (var i = 0; i < length; i++) {
        buf[i] = chars.charAt(Math.floor(Math.random() * charlen));
    }

    return buf.join('');
}
// Hàm insert bằng cấp cho ứng viên
var fnInsertDataDegreeAts = (ApplicantCode, degree = null, req = null, calback) => {
   
    return new Promise((resolve, reject) => {
        for (var i = 0; i < degree.length; i++) {
            var ToTime = null, FromTime = null, rank = null, dateNow = null;
            if (degree[i].ToTime) {
                ToTime = convertStrToDate('01/' + degree[i].ToTime);
            }
            if (degree[i].FromTime) {
                FromTime = convertStrToDate('01/' + degree[i].FromTime);
                dateNow = FromTime;
            } else {
                dateNow = new Date().getFullYear() + '-' + ("0" + (new Date().getMonth() + 1)).slice(-2) + '-' + ("0" + new Date().getDate()).slice(-2);
            }
            if (degree[i].Rank) {
                rank = convertRank(degree[i].Rank);
            }
            // insert bằng cấp
            lv_sql.execData(req, "INSERT INTO TASAT_ApplicantTrainBGRD (ApplicantCode, TrainCvrgCode, SchoolName, TrainLevelCode, FromTime, ToTime, CerIssuedDate, Rank, IsGraduated, IsMainCer, CreatedBy) " +
                "VALUES('" + ApplicantCode + "','" + degree[i].Major + "','" + degree[i].SchoolName + "','" + degree[i].MajorLevel + "'," + (FromTime ? "'" : "") + FromTime + (FromTime ? "'" : "") +
                "," + (ToTime ? "'" : "") + ToTime + (ToTime ? "'" : "") + ",'" + dateNow + "'," + rank + "," + (degree[i].IsGraduated == true ? 1 : 0) + "," + (degree[i].IsMainCer ? 1 : 0) + ",'App'" +
                ")").then(data => {

                })
            // Insert Thành tựu
            lv_sql.execData(req, "INSERT INTO TASAT_ApplicantSuccess (ApplicantCode, SuccessName, CreatedBy) " +
                "VALUES('" + ApplicantCode + "',N'" + degree[i].Note + "','App')").then(data => {

                })
        }
        resolve();
    })
}
// hàm insert Chứng chỉ
var insertDataChungChi = (ApplicantCode, Cer = null, req = null, calback) => {
    return new Promise((resolve, reject) => {
        for (var i = 0; i < Cer.length; i++) {
            var ToTime = null, FromTime = null, rank = null, dateNow = null;
            if (Cer[i].ToTime) {
                ToTime = convertStrToDate('01/' + Cer[i].CerToDate);
            }
            if (Cer[i].CerFromDate) {
                FromTime = convertStrToDate('01/' + Cer[i].CerFromDate);
                dateNow = FromTime;
            } else {
                dateNow = new Date().getFullYear() + '-' + ("0" + (new Date().getMonth() + 1)).slice(-2) + '-' + ("0" + new Date().getDate()).slice(-2);
            }
            if (Cer[i].Rank) {
                rank = convertRank(Cer[i].Rank);
            }
            lv_sql.execData(req, "INSERT INTO TASAT_ApplicantCertificate (ApplicantCode, CerCode, CerIssuedPlace, CerLevelCode, CerFromDate, CerToDate, CerIssuedDate, Rank, CerNo, Note, CreatedBy) "
                + "VALUES('" + ApplicantCode + "','" + Cer[i].Name + "', N'" + Cer[i].CerIssuedPlace + "', N'" + Cer[i].Level + "'," + (FromTime ? "'" : "") + FromTime + (FromTime ? "'" : "") +
                "," + (ToTime ? "'" : "") + ToTime + (ToTime ? "'" : "") + ",'" + dateNow + "'," + rank + ",N'" + Cer[i].CerNo + "', N'" + Cer[i].Note + "'"
                + ", 'App')").then(data => {

                })
        }
        resolve();
    })
}

// Hàm tự động tạo theo dõi TD
var execStoreDataMonitoring = (ApplicantCode, dataMaster = null, req = null, calback) => {
    return new Promise((resolve, reject) => {
        lv_sql.execData(req, "Exec TAS_SPInsertDataMonitoring '" + dataMaster.Code + "','" + dataMaster.JobWCode + "','" + ApplicantCode + "', 0, 0, 'App'").then(data => {
            fnUpdateIsScreening(req, dataMaster);
            fnPostDataVong(req, dataMaster, ApplicantCode).then(() => {
                
            })
        })
        resolve();
    })
}

// hàm update IsScreening = 1

var fnUpdateIsScreening = (req, dataReq, callback) => {
    return new Promise((resolve, reject) => {
        lv_sql.execData(req, "UPDATE TASAT_Requisition SET IsScreening = 1 WHERE RequisitionCode = '" + dataReq.Code + "'").then(reqData => {
        })
    })
}


// hàm post dữ liệu vòng tuyển dụng từ ATS lên lại CP

var fnPostDataVong = (req, dataReq, Applicantcode, callback) => {
    return new Promise((resolve, reject) => {
        var configMongoDb = fnGetConfigMongoDb().then(configMongo => {
            lv_sql.execData(req, "select * from TASAT_fnGetDataVongTuyenDungPostToCP('vn', '" + dataReq.Code + "', '" + Applicantcode + "', 1)").then(reqData => {
                var dataPosting = {};
                dataPosting.Email = dataReq.CandidateApplyList.CandidateEmail;
                dataPosting.Code = dataReq.Code;
                dataPosting.DataPush = reqData;
                postRequest(configMongo, 'post_data_vong_tuyen_dung', dataPosting).then(data => {
                })
            })
        });
    })
}

// Hàm convert string 01/02/2018 -> 2018-02-01
var convertStrToDate = (date) => {
    var x = date.split('/');
    return x[2] + '-' + x[1] + '-' + x[0];
}

var convertRank = (rank) => {
    function getKeyByValue(object, value) {
        return Object.keys(object).find(key => object[key] === value);
    }
    var x = {
        1: "Xuất sắc",
        2: "Giỏi",
        3: "Khá",
        4: "Trung bình khá",
        5: "Trung bình",
        6: "Yếu",
        7: "Kém",
        8: "A",
        9: "B",
        10: "C"
    }
    return getKeyByValue(x, rank);
}
var test = (req, data, next,finish) => {

}
//
var fetchData = function (req, dataMaster, index, cb) {
    if (index < dataMaster.length) {
        var dataCandidate = dataMaster[index].CandidateApplyList;
        var dataitemMaster = dataMaster[index];
        if (dataCandidate.Status == 3) {
            postRequest(req, 'get_uv_by_email', dataCandidate.CandidateEmail).then(dataCan => {
                if (dataCan) {
                    postRequest(req, 'get_sys_user_by_email', dataCandidate.CandidateEmail).then(dataUser => {
                        fnCheckUniqueUvAts(dataCan.data.items, dataUser.data.items, dataMaster[index]).then(() => {
                            fetchData(req, dataMaster, index + 1, cb)
                        })
                        .catch(ex => {
                            cb(ex)
                        });
                    })
                }
            })
        } else {
            fetchData(req, dataMaster, index + 1, cb);
        }
    }
    else {
        cb(null,true)
    }
    //return new Promise(function (resolve, reject) {
    //    var dataCandidate = dataMaster[i].CandidateApplyList;
    //    var dataitemMaster = dataMaster[i];
    //    if (dataCandidate.Status != 3) {
    //        postRequest(req, 'get_uv_by_email', dataCandidate.CandidateEmail).then(dataCan => {
    //            if (dataCan) {
    //                postRequest(req, 'get_sys_user_by_email', dataCandidate.CandidateEmail).then(dataUser => {
    //                    fnCheckUniqueUvAts(dataCan.data.items, dataUser.data.items, dataMaster[i]).then(() => {
                            
    //                    })
    //                        .catch();
    //                })
    //            }
    //        })
    //    }
    //    resolve();
    //});
};
/**
 * Start loop process delay 3 seconds
 * */
var count = 0;
function run() {
    setInterval(function () {
        console.log(1);
        (new Promise((resolve, reject) => {
            var configMongoDb = fnGetConfigMongoDb().then(req => {
                var data = postRequest(req, 'get_uv_apply_requisition_ats_to_cp').then(data => {
                    var dataMaster = data.data.items;
                    if (dataMaster.length > 0) {
                        fetchData(req, dataMaster, 0, (ex, r) => {
                            if (ex) {
                                reject(ex);
                            }
                            else {
                                resolve(r);
                            }
                        });
                    }
                }).catch(ex => {
                    
                })
            })
        })).then(result => {
            }).catch(ex => {
                logs.debug(ex);
            })
        
    }, 3000);
}
try {
    run();
}
catch (ex) {
    logs.debug("start service error", ex);
}

//// Hàm chính để chạy
//module.exports = {
//    run: run
//}