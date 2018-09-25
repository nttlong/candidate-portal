/**Xử lý các resource file từ database*/

[
    "./../modules/lv.db.js",
    "fs",
    "mongodb",
    "./../libs/lv.utils",
    (dbConnect, fs, mongo, utils, app) => {
        utils.debug();
        app.loadFile = (path, contentType, hanlder) => {
            try {
                if (!global.lv) global.lv = {};
                if (!global.lv.cache) global.lv.cache = {};
                if (!global.lv.cache.static_files) global.lv.cache.static_files = {};


                if (!global.lv.cache.static_files[path]) {        //event.res.end(file);
                    var file = "public/" + path.substring(global.getConfig().rootWebServerDir.length, path.length);

                    fs.readFile(file, "utf8", (err, data) => {
                        if (err) {
                            hanlder(err);
                        }
                        else {
                            global.lv.cache.static_files[path] = {
                                contentType: contentType,
                                content: data
                            }

                            hanlder(undefined, global.lv.cache.static_files[path]);
                        }
                    });
                }
                else {
                    hanlder(undefined, global.lv.cache.static_files[path]);
                }
            }
            catch (ex) {
                hanlder(ex);
            }
        },
            app.getFiles = (event) => {
                app.loadFile(event.req.url, "text/css", (err, data) => {

                    if (err) {
                        event.res.end(JSON.stringify(err));
                        event.done();
                    }
                    else {
                        event.res.writeHead(200, {
                            "Content-Type": data.contentType
                        });
                        event.res.end(data.content);
                        event.done();
                    }
                });

            };
        app.getJSFiles = (event) => {
            app.loadFile(event.req.url, "text/javascript", (err, data) => {

                if (err) {
                    event.res.end(JSON.stringify(err));
                    event.done();
                }
                else {
                    event.res.writeHead(200, {
                        "Content-Type": data.contentType
                    });
                    event.res.end(data.content);
                    event.done();
                }
            });

        };
        app.getLogo = (event) => {
            if (!global.images) {
                global.images = {}
            }
            if (!global.images.logo) {
                global.images.logo = {}
            }
            if (!global.images.logo[event.params.key]) {
                dbConnect.cnn((err, db) => {
                    db.collection("ls_recruiters").findOne({
                        RecruiterCode: new RegExp("^"+event.params.key+"$", "i")
                    }, (err, item) => {
                        try {

                            if ((item != null) && (item.Logo != null)) {
                                var mType = item.Logo.split(';')[0].split(':')[1];

                                event.res.writeHead(200, {
                                    'Content-Type': mType,
                                    'Cache-Control': 'public'
                                });
                                var content = item.Logo.split(',')[1];
                                var originaldata = new Buffer(content, 'base64');

                                global.images.logo[event.params.key] = {
                                    contentType: mType,
                                    data: originaldata
                                };

                                event.res.end(originaldata)
                            }
                            else {
                                fs.readFile("./app_data/data/NoImage.png", function (err, data) {
                                    var originaldata = "data:image/png;base64," + (new Buffer(data)).toString('base64');
                                    var mType = "image/png";
                                    global.images.logo[event.params.key] = {
                                        contentType: mType,
                                        data: originaldata
                                    };

                                    event.res.end(originaldata)
                                });
                                
                            }
                            event.done();
                        }
                        catch (ex) {
                            event.done({ error: ex })
                        }


                    })
                });

            }
            else {
                event.res.writeHead(200, {
                    "Content-Type": global.images.logo[event.params.key].contentType,
                    'Cache-Control': 'public'
                });

                event.res.end(global.images.logo[event.params.key].data);
                event.done();
            }
        }
        app.getBanner = (event) => {
            utils._try(() => {
            
            if (!global.images) {
                global.images = {}
            }
            if (!global.images.banner) {
                global.images.banner = {}
            }
            if (!global.images.banner[event.params.key]) {

                var _id = new mongo.ObjectID(event.params.key)
                dbConnect.cnn((err, db) => {
                    db.collection("sys_banner_images").findOne({
                        _id: _id
                    }, (err, item) => {
                        try {

                            if ((item != null) && (item.Data != null)) {
                                var mType = item.Data.split(';')[0].split(':')[1];
                                event.res.writeHead(200, {
                                    'Content-Type': mType,
                                    'Cache-Control': 'public'
                                });
                                var content = item.Data.split(',')[1];
                                var originaldata = new Buffer(content, 'base64');
                                global.images.banner[event.params.key] = {
                                    contentType: mType,
                                    data: originaldata
                                };

                                event.res.end(originaldata);

                            }
                            event.done();
                        }
                        catch (ex) {
                            event.done({ error: ex })
                        }

                        event.done();
                    })
                });

            }
            else {

                event.res.writeHead(200, {
                    "Content-Type": global.images.banner[event.params.key].contentType,
                    'Cache-Control': 'public'
                });


                event.res.end(global.images.banner[event.params.key].data);
                event.done();
            }
            }, event);
        };
        app.getAttachPhoto = (event) => {
            var key = event.params.key;

            utils._try(() => {
                
            if (!global.images) {
                global.images = {}
            }
            if (!global.images.attach) {
                global.images.attach = {}
            }
            if (!global.images.attach[event.params.key]) {
                var _id = new mongo.ObjectID(event.params.key)
                dbConnect.cnn((err, db) => {
                    db.collection("sys_attachments")
                        .findOne({
                            _id: _id
                        }, (err, item) => {
                            if (err) {
                                event.done(err);
                            }
                            else {
                                if (item != null) {
                                    try {
                                        var content = item.Content.split(',')[1];
                                        var originaldata = new Buffer(content, 'base64');
                                        global.images.attach[key] = {
                                            MimeType: item.MimeType,
                                            Content: originaldata
                                        };
                                        event.res.writeHead(200, {
                                            "Content-Type": global.images.attach[key].MimeType,
                                            'Cache-Control': 'public'
                                        });
                                        event.res.end(global.images.attach[key].Content);
                                        event.done();
                                    }
                                    catch (ex) {
                                        event.done(ex);
                                    }
                                }
                                
                            }
                        })
                });
            }
            else {
                event.res.writeHead(200, {
                    "Content-Type": global.images.attach[key].MimeType,
                    'Cache-Control': 'public'
                });
                event.res.end(global.images.attach[key].Content);
                event.done();
            }
            }, event);
           
           

            
        }
    }];