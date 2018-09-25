const utils=require("./../libs/lv.utils")

var _load_Security_Policy = (handler) => {
    return new Promise((resolve, reject) => {


        var item = {
            SessionTimeOut: 120,
            SessionExpandTime: 30
        };
        if (handler) handler(undefined, item);
        else resolve(item);
        
    });
  
    
};
var _load_Global_Settings = (handler) => {
    return new Promise((resolve, reject) => {
        var result = {
            defaultSettings: {
                DefaultDateFormat: "dd/MM/yyyy",
                DefaultCurrency: {
                    Code: "VNĐ"
                }
            }
        };
        if (handler) handler(undefined, result);
        else resolve(result);
      
    })
    
};
var _load_Language_Settings = (handler) => {
    return new Promise((resolve, reject) => {
        var item = {
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
        if (handler) handler(undefined, item);
        else resolve(item);
       
    });

   
};

var start = (handler) => {
    global.sys_settings = {};
    
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
    }
}