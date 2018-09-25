const lv_sql = require('./libs/lv.mysql.controllers');
const fs = require('fs');
const request = require("request-promise");


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
            var options = {
                method: 'POST',
                uri: candidateConfig.host + "/dev/api/" + api_name,
                json: true,
                body: {
                    AppId: candidateConfig.AppId,
                    data: JSON.stringify({ Code: "YCDEV18061401", Email: "huyen.duong.124@gmail.com", CodeStepMonitorIdTask: "STEP001_46_TASK001", StatusResult: "222222" }),
                    AccessToken: candidateConfig.AccessToken
                }
            };
            request(options)
                .then(function (response) {
                    if (fn_callback) {
                        fn_callback();
                    }
                    resolve(response);
                })
                .catch(function (err) {
                    reject(err);
                });

        } catch (e) {
            return reject(e + " yyy ");
        }
    });
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
            resolve(candidateConfig);
        }
        catch (ex) {
            reject(ex);
        }
    })
}

return new Promise((resolve, reject) => {
    var configMongoDb = fnGetConfigMongoDb().then(req => {
        var data = postRequest(req, 'update_requisition_statusresult').then(data => {
            console.log(data);
        })
    })
})
