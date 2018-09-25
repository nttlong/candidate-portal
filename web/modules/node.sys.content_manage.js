const fs = require("fs");
const path = require('path');
const utils = require('./../libs/lv.utils');
const db = require("./lv.db")
const mongo = require("mongodb");
/**
 * Đọc ngôn ngữ resource của 1 page
 * @param {any} page
 * @param {any} lan
 * @param {any} handler
 */
var getPageLangRes = (page, lan, handler) => {
    var fillInfo = (jsonContent, fullPath) => {
        var data = JSON.parse(jsonContent);
        var ret = {
            title: data.title,
            language: lan,
            fullPath: fullPath,
            res: []
        };
        var keys = Object.keys(data.res);
        for (var i = 0; i < keys.length; i++) {
            ret.res.push({
                key: keys[i],
                value: data.res[keys[i]]
            });
        }
        return ret;
    }

    var info = path.parse(page);
    var resPath = path.join(info.dir, info.name) + "." + lan + ".json";

    while (resPath.indexOf("\\") > -1) {
        resPath = resPath.replace("\\", "/");
    }
    while (resPath.indexOf("/") > -1) {
        resPath = resPath.replace("/", ".");
    }
    var fullPath = path.join("./app_data/language/", resPath);
    fs.exists(fullPath, ok => {
        if (!ok) {
            var resPathFrom = path.join(info.dir, info.name) + ".vn.json";
            while (resPathFrom.indexOf("/") > -1) {
                resPathFrom = resPathFrom.replace("/", ".");
            }
            while (resPathFrom.indexOf("\\") > -1) {
                resPathFrom = resPathFrom.replace("\\", ".");
            }
            var fullPathFrom = path.join("./app_data/language/", resPathFrom);
            fs.exists(fullPathFrom, f => {
                if (!f) {
                    handler({ code: "FileWasNotFound", message: "File was not found", source: fullPathFrom });
                }
                else {
                    fs.readFile(fullPathFrom, "utf8", (err, fromContent) => {
                        fs.writeFile(fullPath, fromContent, "utf8", (err) => {
                            if (err) {
                                handler(err);
                            }
                            else {
                                handler(undefined, fillInfo(fromContent, fullPathFrom));
                            }
                        });
                    });
                }
            })

        }
        else {
            fs.readFile(fullPath, "utf8", (err, content) => {
                var resData = {};
                if (err) {
                    handler(err);
                }
                else {

                    handler(undefined, fillInfo(content, fullPath));
                }

            });
        }
    });
}
/**
 * cập nhật ngôn ngữ reource
 * @param {any} page
 * @param {any} lan
 * @param {any} data
 * @param {any} handler
 */
var savePageLangRes = (page, lan, data, handler) => {
    var info = path.parse(page);
    var resPath = path.join(info.dir, info.name) + "." + lan + ".json";

    while (resPath.indexOf("\\") > -1) {
        resPath = resPath.replace("\\", "/");
    }
    while (resPath.indexOf("/") > -1) {
        resPath = resPath.replace("/", ".");
    }
    var fullPath = path.join("./app_data/language/", resPath);
    var wData = {};
    wData.title = data.title;
    wData.res = {};
    for (var i = 0; i < data.res.length; i++) {
        wData.res[data.res[i].key] = data.res[i].value;
    }
    fs.writeFile(fullPath, JSON.stringify(wData), "utf8", err => {
        if (err) {
            handler(err);
        }
        else {
            var keys = Object.keys(global.argo.cache.pages);
            for (var i = 0; i < keys.length; i++) {
                var pageInfo = global.argo.cache.pages[keys[i]];
                if ((pageInfo) && (pageInfo.page.toLowerCase() == "\\" + page.toLowerCase())) {
                    global.argo.cache.pages[keys[i]] = undefined;
                }
            }

            handler(undefined, wData);
        }
    })
}
/**
* Lấy danh sách template email
* @param {any} language ngôn ngữ
* @param {any} searchContent nội dung cần tìm
* @param {any} handler hanlder(err,data)
*/
var getListOfTemplateEmail = (language, searchContent, handler) => {
    var where = {
        LanguageCode: new RegExp("^" + language + "$", "i")
    }
    db.cnn((err, DB) => {
        if (err) handler(err);
        DB.collection("sys_email_template")
            .find(where)
            .toArray((err, result) => {
                if (err) handler(err);
                handler(undefined, result);
            })
    })
}
/**
 * lấy template email
 * @param {any} id
 * @param {any} handler (err,data)
 */
var getEmailTemplateById = (id, handler) => {
    db.cnn((err, DB) => {
        if (err) handler(err);
        else {
            var coll = DB.collection("sys_email_template")
            var _id = id;
            try {
                _id= mongo.ObjectID(id);
            }
            catch (ex) {
                _id = id
            }
            coll.aggregate([{ $match: { _id: _id } }]).toArray((err, data) => {
                if (err) {
                    handler(err)

                }
                else {
                    if (data.length > 0) {
                        handler(undefined, data[0]);
                    }
                    else {
                        handler(undefined, {});
                    }

                }
            });
        }
    });
}
/**
 * Lay template email theo ten template
 * @param {any} TemplateName
 * @param {any} handler
 */
var getTempletEmailByTemplateName = (TemplateName, handler) => {
    db.cnn((err, DB) => {
        if (err) handler(err);
        else {
            var coll = DB.collection("sys_email_template")

            coll.findOne({ TemplateName: new RegExp("^" + TemplateName + "$", 'i') }, (err, data) => {
                if (err) {
                    handler(err)

                }
                else {
                    handler(undefined, data);
                }
            })
        }
    });
}
/**
 * Cập nhật template email
 * @param {any} TemplateName
 * @param {any} data {TemplateContent,TemplateSubject,Username}
 * @param {any} handler
 */
var saveTemplateEmailByTemplateName = (TemplateName, data, handler) => {
    if (!data.Username) {
        handler({
            errorType: "UserNameIsEmpty",
            message: "Username is emty"

        });
        return;
    }

    db.cnn((err, DB) => {
        if (err) handler(err);
        else {
            var coll = DB.collection("sys_email_template")
            coll.updateOne({
                TemplateName: new RegExp("^" + TemplateName + "$", 'i')
            }, {
                    $set: {
                        Body: data.TemplateContent,
                        Subject: data.TemplateSubject,
                        ModifiedBy: data.Username,
                        ModifiedOn: new Date(),
                        ModifiedOnUTC: utils.getUTCDate(new Date())
                    }
                }, (err) => {
                    if (err) {
                        handler(err);
                    }
                    else {
                        handler();
                    }
                })
        }
    });
}
/**
 * Xoa template email dua vao ten (truoc khi xoa chuyen vao sys_trash_data)
 * @param {any} TemplateName
 * @param {any} Username nguoi xoa
 * @param {any} handler
 */
var deleteTemplateEmailByTemplateName = (TemplateName, Username, handler) => {
   
    db.cnn((err, DB) => {
        var tmpEmailColl = DB.collection("sys_email_template");
        var sysTash = DB.collection("sys_trash_data");
        if (err) handler(err);
        else {
            tmpEmailColl.findOne({
                TemplateName: new RegExp("^" + TemplateName + "$", 'i')
            }, (err, ret) => {
                if (err) handler(err);
                else {
                    if (ret == null) handler(undefined, undefined);
                    else {
                        sysTash
                            .insertOne({
                                sys_trash_data: "sys_email_template",
                                Data: ret,
                                CreatedBy: Username,
                                CreatedOn: new Date(),
                                CreatedOnUTC: utils.getUTCDate(new Date())
                            }, (err, ret) => {
                                if (err) handler(err)
                                else {
                                    tmpEmailColl.deleteOne({
                                        TemplateName: new RegExp("^" + TemplateName + "$", 'i')
                                    }, (err) => {
                                        if (err) handler(err);
                                        else {
                                            handler(undefined)
                                        }
                                    })
                                }
                            });
                    }

                }
            });

        }
    });
}
/**
 * Xóa template email, trước khi xóa đưa vào trash
 * @param {any} id
 * @param {any} Username
 * @param {any} handler
 */
var deleteTemplateEmailById = (id, Username, handler) => {
    var _id = id;
    try {
        _id = mongo.ObjectID(id);
    }
    catch (ex) {
        _id = id
    }
    db.cnn((err, DB) => {
        var tmpEmailColl = DB.collection("sys_email_template");
        var sysTash = DB.collection("sys_trash_data");
        if (err) handler(err);
        else {
            tmpEmailColl.findOne({
                _id: _id
            }, (err, ret) => {
                if (err) handler(err);
                else {
                    if (ret == null) handler(undefined, undefined);
                    else {
                        sysTash
                            .insertOne({
                                sys_trash_data: "sys_email_template",
                                Data: ret,
                                CreatedBy: Username,
                                CreatedOn: new Date(),
                                CreatedOnUTC: utils.getUTCDate(new Date())
                            }, (err, ret) => {
                                if (err) handler(err)
                                else {
                                    tmpEmailColl.deleteOne({
                                        _id: _id
                                    }, (err) => {
                                        if (err) handler(err);
                                        else {
                                            handler(undefined)
                                        }
                                    })
                                }
                            });
                    }

                }
            });

        }
    });
}
/**
 * Đọc cấu hình social network từ file app_data/config/social.json, có lưu cache
 * @param {any} handler
 */
var getSocialNetworkLinkInfo = (handler) => {
    if (!global.system_cache) global.system_cache = {};
    if (global.system_cache.social) {
        handler(undefined, global.system_cache.social)
    }
    else {
        fs.readFile("app_data/config/social.json", "utf8", (err, data) => {
            if (err) handler(err);
            else {
                try {
                    global.system_cache.social = Function("return " + data)();
                    handler(undefined, global.system_cache.social);
                }
                catch (ex) {
                    handler({
                        error: {
                            message: ex.message || ex,
                            source: ".app_data/config/social.json"
                        }
                    })
                }
            }
        })
    }
}
/**
 * Cập nhật cấu hình social network
 * @param {any} data
 * @param {any} handler
 */
var saveSocialNetworkLinkInfo = (data, handler) => {
    var check = utils.checkRequireFields([
        "google_client_id",
        'facebook_client_id',
        'linkedIn_client_id'
    ], data);
    if (check.length > 0) {
        handler(undefined, {
            apiError: {
                errorType: check[0] + "::is_empty",
                description: check[0] + " is empty"
            }
        });
        return;
    }
    fs.writeFile("./app_data/config/social.json", JSON.stringify(data), "utf8", (err) => {
        if (err) handler(err);
        else {
            if (!global.system_cache) global.system_cache = {};
            global.system_cache.social = data;
            handler(undefined, undefined);
        }
    })
}
module.exports = {
    getPageLangRes: getPageLangRes,
    savePageLangRes: savePageLangRes,
    getListOfTemplateEmail: getListOfTemplateEmail,
    getEmailTemplateById: getEmailTemplateById,
    getTempletEmailByTemplateName: getTempletEmailByTemplateName,
    saveTemplateEmailByTemplateName: saveTemplateEmailByTemplateName,
    deleteTemplateEmailByTemplateName: deleteTemplateEmailByTemplateName,
    deleteTemplateEmailById: deleteTemplateEmailById,
    getSocialNetworkLinkInfo: getSocialNetworkLinkInfo,
    saveSocialNetworkLinkInfo: saveSocialNetworkLinkInfo

}