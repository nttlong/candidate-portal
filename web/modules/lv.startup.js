const dbConnection = require("./lv.db");
const models = require("./../modules/lv.model");
const utils=require("./../libs/lv.utils")
var _loadCustomers = (handler) => {
    return new Promise((resolve, reject) => {
        models.ls_recruiters()
            .select({
                RecruiterCode: 1,
                CandidateSite: 1
            }).toArray()
            .then(list => {
                var customers = [];
                list.forEach(item => {
                    customers.push(item.CandidateSite || item.RecruiterCode);
                })
                if (handler) handler(undefined, customers);
                else resolve(customers);
            })
            .catch(ex => {
                if (handler) handler(ex);
                else reject(ex);
            })
    });
   
};
var _load_Security_Policy = (handler) => {
    return new Promise((resolve, reject) => {
        models.sys_Security_Policy().toItem()
            .then(item => {
                if (item === null) {
                    item = {
                        SessionTimeOut: 120,
                        SessionExpandTime: 30
                    };
                    models.sys_Security_Policy().insert(item).commit();
                }
                if (handler) handler(undefined, item);
                else resolve(item);
            })
            .catch(err => {
                if (handler) handler(err);
                else reject(err);
        })
    });
  
    
};
var _load_Global_Settings = (handler) => {
    return new Promise((resolve, reject) => {
        models.sys_Global_Settings()
            .toItem((err, result) => {
                if (err) {
                    if (handler) handler(err);
                    else reject(err);
                }
                else {
                    if (result === null) {
                        result = {
                            defaultSettings: {
                                DefaultDateFormat: "dd/MM/yyyy",
                                DefaultCurrency: {
                                    Code:"VNĐ"
                                }
                            }
                        }
                        models.sys_Global_Settings().insert(result)
                            .commit();

                    }
                    if (handler) handler(undefined, result);
                    else resolve(result);
                }
            })
    })
    
};
var _load_Language_Settings = (handler) => {
    return new Promise((resolve, reject) => {
        models.sys_global_language_setting()
            .toItem()
            .then(item => {
                if (item === null) {
                    item = {
                        DefaultLanguageCode: "vn",
                        LanguageSupports: [
                            {
                                "Code": "vn",
                                "EnglishName": "Vietnamese",
                                "NativeName": "Tiếng Việt"
                            },
                            {
                                "Code": "en",
                                "EnglishName": "English",
                                "NativeName": "English"
                            }
                        ]
                    };
                    models.sys_global_language_setting().insert(item)
                        .commit();
                  
                }
                if (handler) handler(undefined, item);
                else resolve(item);
            })
            .catch(ex => {
                if (handler) handler(ex);
                else reject(ex);
            })
    });

   
};
var findRecruiterByCode = (code, handler) => {
    dbConnection.cnn((err, db) => {
        db.collection("ls_recruiters")
            .findOne({ CandidateSite: new RegExp("^" + code + "$", "i") }, (err, item) => {
                if (err) handler(err)
                else {
                    if (item) {
                        handler(undefined, item);
                    }
                    else {
                        db.collection("ls_recruiters")
                            .findOne({ RecruiterCode: new RegExp("^"+code+"$", "i") }, (err, item) => {
                                if (err) handler(err)
                                else handler(undefined, item);
                            });
                    }
                }
            });
    });
}
var start = (handler) => {
    global.sys_settings = {};
    _loadCustomers((err, data) => {
        if (err) handler(err)
        else {
            global.sys_settings.customers = data || [];
            var txtMatch = ";";
            for (var i = 0; i < global.sys_settings.customers.length; i++) {
                txtMatch += global.sys_settings.customers[i] + ";";
            }
            global.sys_settings.strCustomer = txtMatch;
            _load_Global_Settings((err, data) => {
                global.sys_settings.DefaultDateFormat = data.DefaultDateFormat || "DD/MM/YYYY";
                global.sys_settings.DefaultCurrency = data.DefaultCurrency || { Code: "VNĐ" };
                _load_Language_Settings((err, data) => {
                    if (err) {
                        handler(err);
                    }
                    else {
                        global.sys_settings.DefaultLanguageCode = data.DefaultLanguageCode || "vn";
                        global.sys_settings.LanguageSupports = data.LanguageSupports || [
                            {
                                "Code": "vn",
                                "EnglishName": "Vietnamese",
                                "NativeName": "Tiếng Việt"
                            },
                            {
                                "Code": "en",
                                "EnglishName": "English",
                                "NativeName": "English"
                            }
                        ];
                        global.sys_settings.languages = {};
                        for (var i = 0; i < global.sys_settings.LanguageSupports.length; i++) {
                            global.sys_settings.languages[global.sys_settings.LanguageSupports[i].Code] = global.sys_settings.LanguageSupports[i];
                        }
                        _load_Security_Policy((err, data) => {
                            if (err) {
                                handler(err);
                            }
                            else {
                                global.sys_settings.SessionTimeOut = data.SessionTimeOut || 120;
                                global.sys_settings.SessionExpandTime = data.SessionExpandTime || 30;
                                handler(undefined, global.sys_settings);
                            }
                        });
                    }
                });
            });
        }
    })
}
/**
 * Them site cua KH vao cache route
 * @param {any} siteName
 */
var addCustometSiteToCache = (siteName) => {
    if (!global.sys_settings.strCustomer) {
        global.sys_settings.strCustomer = "";
    }
    global.sys_settings.strCustomer = global.sys_settings.strCustomer + ";" + siteName.toLowerCase()+";"
}
module.exports = {
    start: start,
    sys_settings: () => {
        return global.sys_settings
    },
    findRecruiterByCode: findRecruiterByCode,
    addCustometSiteToCache: addCustometSiteToCache
}