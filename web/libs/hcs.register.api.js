const asynLock = require("async-lock");
var lock = new asynLock();
const Guid = require("guid");
const fs = require("fs");
var lock_key = "argo.register.api";
var _onError;
var onError = (handler) => {
    _onError = handler;
}
var _dir = "/.";
var save_api_key_to_storage = (page, api_path, handler) => {
    var content = JSON.stringify(global.argo.cache.api);
    fs.writeFile(getFilePath(), content, 'utf8', (e, r) => {
        if (e) handler(e);
        else handler(undefined, r);
    });

}
var set_api_key = (page, api_path, ID) => {
    if (!global.argo) global.argo = {};
    if (!global.argo.cache) global.argo.cache = {};
    if (!global.argo.cache.api) global.argo.cache.api = {
        keys: {},
        hash: {}
    };
    var key = "page=" + page + ";" +
        "api=" + api_path;
    key = key.toLowerCase();


    global.argo.cache.api.keys[key] = ID;
    global.argo.cache.api.hash[ID] = {
        page: page,
        path: api_path
    };


};
var getFilePath = () => {

    return getDir() + "/api.json";
}
var setDir = (value) => {
    _dir = value;
};//end set_dir
var getDir = () => {
    return _dir;
}
var get_api_key = (page, api_path) => {
    if (!global.argo) global.argo = {};
    if (!global.argo.cache) global.argo.cache = {};
    if (!global.argo.cache.api) global.argo.cache.api = {
        keys: {},
        hash: {}
    };
    if (!global.argo.cache.api.keys) global.argo.cache.api.keys = {};
    if (!global.argo.cache.api.hash) global.argo.cache.api.hash = {};
    var key = "page=" + page + ";" +
        "api=" + api_path;
    key = key.toLowerCase();
    return global.argo.cache.api.keys[key];
}//end get_api_key
var get_api_key_from_storage = (page, api_path, handler) => {
    fs.exists(getFilePath(), found => {
        if (found) {
            fs.readFile(getFilePath(), 'utf8', (err, content) => {

                if (err) {
                    handler(err);

                }
                var data = Function("", "return " + content)();
                if (!data) data = {
                    keys: {},
                    hash: {}
                };
                global.argo.cache.api = data;
                var key = get_api_key(page, api_path);
                if (!key) {
                    key = Guid.create().value;
                    set_api_key(page, api_path, key);
                    save_api_key_to_storage(page, api_path, (e, r) => {

                        if (e) handler(e);
                        else {
                            

                            handler(undefined, key);
                        }
                    });
                } else {
                    handler(undefined, key);
                }
            });
        }// end if found
        else {
            key = Guid.create().value;
            set_api_key(page, api_path, key);
            save_api_key_to_storage(page, api_path, (e, r) => {

                if (e) handler(e);
                else {
                    set_api_key(page, api_path, key);

                    handler(undefined, key);
                }
            });
        }
    });

};
var registerKey = (page, api_path, handler) => {
    while (page.indexOf("\\") > -1) page = page.replace("\\", "/");
    while (page.indexOf("//") > -1) page = page.replace("//", "/");
    while (page[0] == "/") page = page.substring(1, page.length);
    var key = get_api_key(page, api_path);
    if (!key) {
        lock.acquire(lock_key,
            lock_done => {

                get_api_key_from_storage(page, api_path, (get_error, get_result) => {

                    lock_done(get_error, get_result);
                });

            }// end lock_done
            ,
            (lock_error, lock_result) => {
                if (lock_error) handler(lock_error);
                else handler(undefined, lock_result);

            });

    }
    else handler(undefined, key);
}//end registerKey
var get_api_by_key = (key, handler) => {
    if (!global.argo) global.argo = {};
    if (!global.argo.cache) global.argo.cache = {};
    if (!global.argo.cache.api) global.argo.cache.api = {
        keys: {},
        hash: {}
    };
    if (global.argo.cache.api.keys[key]) {
        handler(undefined, global.argo.cache.api.hash[key]);
    }
    else {
        fs.exists(getFilePath(), found => {
            if (found) {
                fs.readFile(getFilePath(), 'utf8', (err, content) => {

                    if (err) handler(err);
                    var data = Function("", "return " + content)();
                    if (!data) data = {
                        keys: {},
                        hash: {}
                    };
                    global.argo.cache.api = data;
                    handler(undefined, global.argo.cache.api.hash[key]);
                });
            }// end if found
            else {
                key = Guid.create().value;
                set_api_key(page, api_path, key);
                save_api_key_to_storage(page, api_path, (e, r) => {

                    if (e) handler(e);
                    else {
                        handler(undefined, undefined);
                    }
                });
            }
        });
    }
};

module.exports = {
    registerKey: registerKey,
    setDir: setDir,
    getDir: getDir,
    get_api_key: get_api_by_key
}
