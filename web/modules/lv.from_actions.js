
["./../libs/lv.utils",
    "async-lock",
    "chokidar",
    "./../libs/lv.render.form",
    "path",
    "fs",
    (utils, asyncLock, chokidar,
        lv_form,
        path,
        fs,
        app) => {
        utils.debug();
        app.run = (event) => {

            var lock = new asyncLock();
            lv_form.set_app_dir(path.join(utils.getCurrentDir(), "../"));
            lv_form.get_api_info(event.params.key, (err, info) => {
                if (err) {
                    event.res.status(500).send(err);
                    event.done(err);
                }
                else {
                    var items = info.api.split('/');
                    var fileName = path.join(utils.getCurrentDir(), "../modules/", items[1]) + ".js";

                    var className = items[1].split('.')[items[1].split('.').length - 1];
                    var method = items[2];
                    if (!global.argo) global.argo = {};
                    if (!global.argo.cache) global.argo.cache = {};
                    if (!global.argo.cache.lv_api_code) global.argo.cache.lv_api_code = {};
                    var code = global.argo.cache.lv_api_code[fileName];
                    if (!code) {
                        lock.acquire("lv_api_code", done => {
                            chokidar.watch(path.join(utils.getCurrentDir(), "../modules/")).on('all', (event, fileName) => {
                                if (event == "change") {
                                    if (global.argo && global.argo.cache && global.argo.cache.lv_api_code) {
                                        global.argo.cache.lv_api_code = undefined;
                                    }
                                }

                            });
                            fs.readFile(fileName, "utf8", (err, data) => {
                                if (err) done(err)
                                else done(undefined, data);
                            });
                        }, (err, data) => {
                            if (err) {
                                event.res.status(500).send(err);
                                event.done(err);
                            }
                            else {
                                var code = {};
                                var fn = Function("var f=" + data + ";return f")();

                                if (fn instanceof Array) {
                                    var ms = [];
                                    for (var i = 0; i < fn.length - 1; i++) {
                                        try {
                                            ms.push(utils.loadModule(fn[i]));
                                        }
                                        catch (ex) {
                                            event.res.status(500).send({
                                                Message: ex,
                                                Path: info.api,
                                                File: fileName,
                                                NodeModule: fn[i]
                                            });
                                        }

                                    }
                                    ms.push(code);
                                    fn[fn.length - 1].apply(code, ms);
                                }
                                else {
                                    fn(code)
                                }


                                try {
                                    code[method](event);
                                    global.argo.cache.lv_api_code[fileName] = code;
                                }
                                catch (ex) {
                                    if (ex.message) {
                                        event.res.status(500).send({
                                            Message: ex.message,
                                            Path: info.api,
                                            File: fileName
                                        });
                                    }
                                    else {
                                        event.res.status(500).send({
                                            Message: ex,
                                            Path: info.api,
                                            File: fileName
                                        });
                                    }
                                    event.done(ex);
                                }
                            }
                        });

                    }
                    else {
                        code[method](event);
                    }
                }

                //console.log(items);
                //event.done();
            });

        }

    }];