/*"fs",
            "path",
            "./../libs/lv.utils",
            
            "./../modules/lv.model"*/
const fs=require("fs");
const path = require("path");
const utils=require("./../libs/lv.utils");
const models = require("./../modules/lv.model");
/**
 * Đọc language resource từ 1 file json
 * @param {any} event
 */
var getLanguageResourceOfFile = (event) => {
    utils._try(() => {

        var langs = models.sys_global_language_setting().toItem.sync();
        var langSupports = langs.LanguageSupports;

        var postData = utils.readData(event);
        try {
            var page = postData.path;
            var lan = postData.language;
            if (!postData.isResourceFile) {
                var _path = "./app_data/language";
                var compareKeys = {};
                var retData = {}
                var retTitle = {};
                var langs = [];
                langSupports.forEach(item => {
                    langs.push(item.Code);

                    var _fPath = page.replace(".html", "." + item.Code + ".json");
                    while (_fPath.indexOf("\\") > -1) {
                        _fPath = _fPath.replace("\\", ".");
                    }
                    var localPath = path.join(_path, _fPath);
                    var hasFile = fs.existsSync(localPath);
                    if (!hasFile) {
                        var writeData = JSON.stringify({
                            title: _fPath,
                            res: {}
                        });
                        fs.writeFile.sync(null, localPath, writeData, "utf-8");
                    }
                    var dataContent = fs.readFile.sync(null, localPath, "utf-8");
                    var data = Function("return " + dataContent)();
                    retTitle[item.Code] = data.title;
                    Object.keys(data.res).forEach(key => {
                        if (!retData[key]) {
                            retData[key] = {};
                        }
                        retData[key][item.Code] = data.res[key];
                    });
                });
                var res = [];
                Object.keys(retData).forEach(key => {
                    res.push({
                        key: key,
                        value: retData[key]
                    });
                });
                utils.writeData(event, {
                    langs: langs,
                    res: res,
                    title: retTitle
                });
                event.done();
            }
            else {
                //debugger;
                var retData = {}
                var retTitle = {};
                var langs = [];
                var items = page.split('.');
                var _file = "";
                for (var i = 0; i < items.length - 2; i++) {
                    _file += items[i] + ".";
                }
                var _path = "./app_data/language";
                langSupports.forEach(item => {
                    langs.push(item.Code);
                    var localPath = path.join(_path, _file + item.Code + ".json");
                    var hasFile = fs.existsSync(localPath);
                    if (!hasFile) {
                        var writeData = JSON.stringify({
                            title: _file + item.Code + ".json",
                            res: {}
                        });
                        fs.writeFile.sync(null, localPath, writeData, "utf-8");
                    }
                    var dataContent = fs.readFile.sync(null, localPath, "utf-8");
                    var data = Function("return " + dataContent)();
                    retTitle[item.Code] = data.title;
                    Object.keys(data.res).forEach(key => {
                        if (!retData[key]) {
                            retData[key] = {};
                        }
                        retData[key][item.Code] = data.res[key];
                    });
                });
                var res = [];
                Object.keys(retData).forEach(key => {
                    res.push({
                        key: key,
                        value: retData[key]
                    });
                });
                utils.writeData(event, {
                    langs: langs,
                    res: res,
                    title: retTitle
                });
                event.done();


            }

        }
        catch (ex) {
            utils.writeData(event, { error: ex });
            event.done();
        }


    }, event);
};
module.exports = {
    getLanguageResourceOfFile: getLanguageResourceOfFile
}