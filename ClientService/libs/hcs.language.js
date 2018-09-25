/*
non pubic method or variable name must be start with "_" 
*/
const path = require("path");
const fs = require("fs");
const mkdirp = require('mkdirp');
const cache = require("./hcs.cache");
const asyncLock = require("async-lock");
var lock = new asyncLock();
var getPageCaptionFromCache = (page, language) => {
    page = page.toLowerCase();
    language = language.toLowerCase();
    
    if (!global.argo) global.argo = {};
    if (!global.argo.cache) global.argo.cache = {};
    if (!global.argo.cache.pageCaption) global.argo.cache.pageCaption = {};
    if (!global.argo.cache.pageCaption[language]) global.argo.cache.pageCaption[language] = {};
   
    return global.argo.cache.pageCaption[language][page];
}
var setPageCaptionToCache = (page, language, caption) => {
    page = page.toLowerCase();
    language = language.toLowerCase();
   
    if (!global.argo) global.argo = {};
    if (!global.argo.cache) global.argo.cache = {};
    if (!global.argo.cache.pageCaption) global.argo.cache.pageCaption = {};
    if (!global.argo.cache.pageCaption[language]) global.argo.cache.pageCaption[language] = {};
    global.argo.cache.pageCaption[language][page] = caption;
    return global.argo.cache.pageCaption[language][page];
}
var getFromCache = (page, language, key) => {
    page = page.toLowerCase();
    language = language.toLowerCase();
    key = key.toLowerCase();
    if (!global.argo) global.argo = {};
    if (!global.argo.cache) global.argo.cache = {};
    if (!global.argo.cache.language) global.argo.cache.language = {};
    if (!global.argo.cache.language[language]) global.argo.cache.language[language] = {};
    if (!global.argo.cache.language[language][page]) global.argo.cache.language[language][page] = {};
    return global.argo.cache.language[language][page][key];
}
var setToCache = (page, language, key,value) => {
    page = page.toLowerCase();
    language = language.toLowerCase();
    key = key.toLowerCase();
    if (!global.argo) global.argo = {};
    if (!global.argo.cache) global.argo.cache = {};
    if (!global.argo.cache.language) global.argo.cache.language = {};
    if (!global.argo.cache.language[language]) global.argo.cache.language[language] = {};
    if (!global.argo.cache.language[language][page]) global.argo.cache.language[language][page] = {};
    global.argo.cache.language[language][page][key] = value;
    return global.argo.cache.language[language][page][key];
}
var getPageCaption = (page,language, content) => {
    var start = content.indexOf("page-caption:(");
    if (start === -1) return { title: language + "." + page, matchContent: "" };
    var end = content.indexOf(")", start);
    
    return {
        title: content.substring(start + "page-caption:(".length, end),
        matchContent: content.substring(start, end+1)
    };
    
}
/*if language is managed by file this varisble
must be set
*/
var _dir;
var _onLoadData;
var _onSaveData;
var _mongoDbConnectionString;
/**
 * declare pubic set method mongodb
*/
setMongoDbConnection = (value) => {
    _mongoDbConnectionString = value;
}
/*declare pubic set method for root path*/
var setDir = (value) => {
    _dir = value;
};
var getDir = () => {
    return _dir;
};
/**
 * onloadData
 * params:relative path of file,
 * text content of file,
 * handler:(err,result)
*/

var onloadData = (handler) => {
    _onLoadData = handler;
};
/**
 * params:relative path of file,
 * data of page,
 * handler:(err,result)
*/
var onSaveData = (handler) => {
    _onSaveData = handler;
}
/**default on load data*/
onloadData((path, content, callback) => {
    _checkFileIsExistsIfNotCreateNewAndReturnData(path, content, callback)

});
/**default on onSaveData*/
onSaveData((path, data, handler) => {
    _writeDataOfLanguageResource(path, data, handler);
})
/**
 * to extract all language resource items form 
 * input content t array,
 * each item in array
 * 
 * 
*/
var _extractLanguageFromContent = (inputContent) => {
    var reg = /res:\(([^()]+)\)/;
    var originalContent = inputContent;
    var content = inputContent;
    var ret = reg.exec(content);
    var list = [];
    while (ret !== null) {
        var key = ret[1];
        while (key[0] === " ") {
            key = key.substring(1, key.length);
        }
        while (key[key.length - 1] === " ") {
            key = key.substring(0, key.length - 1);
        }
        while (key.indexOf("  ") > -1) {
            key = key.replace("  ", " ");
        }
        key = escape(key.toLowerCase());

        list.push({
            full: ret[0],
            value: ret[1],
            key: key,
            index: ret.index
        });


        content = content.substring(ret.index + ret[0].length, content.length);
        ret = reg.exec(content);
    }
    return list;
}
var _checkDirs = (_path, callback) => {
    var info = path.parse(getDir() + "/" + _path);
    var dir = info.dir;
    var items = dir.split('/');
    var fullPath = "";
    var next = (index) => {
        if (index < items.length) {
            fullPath += items[index] + "/";
            if (items[index] === '.') {
               
                next(index + 1);
            }
            else {
                fs.stat(fullPath, (e, r) => {
                    if (e) {
                        mkdirp(fullPath, (err) => {
                            if (err) { callback(err); }
                            next(index + 1);
                        });
                    }
                    else {
                        next(index + 1);
                    }
                    
                });
               
            }

        }
        else {
            callback(undefined, fullPath)
        }
    }
    next(0);

}
/**
 * return data, including:
 * asbPath,
 * relPath,
 * physicalPath,
 * language,
 * data
*/
var _checkFileIsExistsIfNotCreateNewAndReturnData = (
    relPath,
    content,
    callback) => {
    if (getDir() === null) {
        callback({
            message: "rootPath of argo.language was not set"
        });
        return;
    }
    _checkDirs(relPath, (e, r) => {
        var pathInfo = path.parse(getDir() + "/" + relPath);

        var absPath = pathInfo.dir + "/" + pathInfo.name + ".json";
        fs.exists(absPath, found => {
            if (!found) {
                var data = {
                    res: {}
                };
                var jsonContent = JSON.stringify(data);
                fs.writeFile(absPath, jsonContent, 'utf8', (err, result) => {
                    if (err) {
                        callback(err);
                    }
                    else {
                        callback(undefined, {
                            relPath: relPath,
                            absPath: absPath,
                            data: data
                        })
                    }
                });
            }
            else {
                fs.readFile(absPath, 'utf8', (err, result) => {
                    if (err) {
                        callback(err);
                    }
                    else {
                        var retData = Function("", "return " + result)();
                        callback(undefined, {
                            relPath: relPath,
                            absPath: absPath,
                            data: retData
                        });
                    }
                });
            }
        })
    });
  
};
var _writeDataOfLanguageResource = (relPath, jsonData, callback) => {
    if (getDir() === null) {
        callback({
            message: "rootPath of argo.language was not set"
        });
        return;
    }
    var pathInfo = path.parse(getDir() + "/" + relPath);
    var absPath = pathInfo.dir + "/" + pathInfo.name + ".json";
    fs.writeFile(absPath, JSON.stringify(jsonData), 'utf8', (err, result) => {
        if (err) {
            callback(err);
        }
        else {
            callback(undefined, result);
        }
    });

}
var loadForPage = (language, page, content, callback) => {
    var key = "lan=" + language + ";page=" + page;
    key = key.toLowerCase()
    _onLoadData(page, content, (err, result) => {
        if (err) {
            callback(err);
        }
        else {
            var listOfLanguageResItems = _extractLanguageFromContent(content);
            var hasChanged = false;
            for (var i = 0; i < listOfLanguageResItems.length; i++) {
                var item = listOfLanguageResItems[i];
                if (!result.data.res) {
                    result.data.res = {};
                }
                if (result.data.res[language] === null) {
                    result.data.res[language] = {};
                }
                if (!result.data.res[language][item.key]) {
                    result.data.res[language][item.key] = item.value;
                    hasChanged = true;
                }
                content = content.replace(item.full, result.data.res[language][item.key]);
            }
            if (hasChanged) {
                _onSaveData(page, result.data, (err, ret) => {
                    if (err) {
                        callback(err);
                    }
                    else {
                        callback(undefined, content);
                    }
                });
            }
            else {
                callback(undefined, content);
            }
        }
    });
};
var scan_content = (language,page,content, onScanItem, scanComplete) => {
    var list = _extractLanguageFromContent(content);
    var next = (index) => {
        if (index < list.length) {
            var event = {
                key: list[index].key,
                value: list[index].value,
                page: page,
                language: language
            };
            event.done = (err, value) => {
                if (err) {
                    scanComplete(err);
                }
                else {
                    content = content.replace(list[index].full, value);
                    next(index + 1);
                }
            }
            onScanItem(event);
        }
        else {
            scanComplete(undefined, content);
        }
    }
    next(0);
}
var getResFromFile = (language, page, key, defaultValue, handler) => {
    var val = getFromCache(page, language, key);
    if (val) {
        handler(undefined, val);
    }
    else {
        lock.acquire(page, done => {
            var info = path.parse(path.join("", page));
            var fullPath = info.dir+"\\" + info.name + "." + language + ".json";
            while (fullPath[0] === "\\") {
                fullPath = fullPath.substring(1, fullPath.length);
            }
            while (fullPath.indexOf("\\") > -1) {
                fullPath = fullPath.replace("\\", ".");
            }
            var filePath = getDir() + "/" + fullPath;
            fs.exists(filePath, found => {
                if (found) {
                    fs.readFile(filePath, "utf8", (e, r) => {
                        if (e) {
                            done(e);
                        }
                        else {
                            var data = Function("return " + r)();
                            if (!data.res) { data.res = {};}
                            if (!data.res[key]) {
                                data.res[key] = defaultValue;
                                fs.writeFile(filePath, JSON.stringify(data), 'utf8', (e, r) => {
                                    if (e) done(e)
                                    else {
                                        setToCache(page, language, key, defaultValue);
                                        done(undefined, defaultValue);
                                    }
                                });
                            }
                            else {
                                setToCache(page, language, key, data.res[key]);
                                done(undefined, data.res[key]);
                            }
                        }
                    })
                }
                else {
                    var writeData = { res: {} };
                    writeData.res[key] = defaultValue;
                    fs.writeFile(filePath, JSON.stringify(writeData), "utf8", (e, r) => {
                        setToCache(page, language, key, defaultValue);
                        done(undefined, defaultValue);
                    });
                }
            });
           
        }, (e, r) => {
            handler(undefined, r);
        });
       
    }

}
var getPageCaptionFromFile = (language, page, caption, handler) => {
    var ret = getPageCaptionFromCache(page, language);
    if (!ret) {
        lock.acquire(page, done => {
            var info = path.parse(path.join("", page));
            var fullPath = info.dir + "\\" + info.name + "." + language + ".json";
            while (fullPath[0] === "\\") {
                fullPath = fullPath.substring(1, fullPath.length);
            }
            while (fullPath.indexOf("\\") > -1) {
                fullPath = fullPath.replace("\\", ".");
            }
            var filePath = getDir() + "/" + fullPath;
            fs.exists(filePath, found => {
                if (found) {
                    fs.readFile(filePath, "utf8", (e, r) => {
                        if (e) {
                            done(e);
                        }
                        else {
                            var data = Function("return " + r)();
                            if (!data) data = {};
                            if (!data.title) {
                                data.title = caption;
                                fs.writeFile(filePath, JSON.stringify(data), 'utf8', (e, r) => {
                                    if (e) done(e)
                                    else {
                                        setPageCaptionToCache(page, language, caption);
                                        done(undefined, caption);
                                    }
                                });
                            }
                            else {
                                setPageCaptionToCache(page, language,  data.title);
                                done(undefined, data.title);
                            }
                        }
                    })
                }
                else {
                    var writeData = {
                        title: caption,
                        res: {}
                    };
                    
                    fs.writeFile(filePath, JSON.stringify(writeData), "utf8", (e, r) => {
                        setPageCaptionToCache(page, language, caption);
                        done(undefined, caption);
                    });
                }
            });

        }, (e, r) => {
            handler(undefined, r);
        });
    }
    else {
        handler(undefined, ret);
    }
}
/**
 * export for another modules
*/
module.exports = {
    getResFromFile: getResFromFile,
    getPageTitleFromFile: getPageCaptionFromFile,
    load: loadForPage,
    setDir: setDir,
    getDir: getDir,
    onloadData: onloadData,
    onSaveData: onSaveData,
    _checkDirs: _checkDirs,
    scan: scan_content,
    getPageTitle: getPageCaption,
    test: {
        _extractLanguageFromContent: _extractLanguageFromContent,
        _checkFileIsExistsIfNotCreateNewAndReturnData: _checkFileIsExistsIfNotCreateNewAndReturnData
    }

};