
var http = require('http');
var port = process.env.PORT|| 12345;
//var port = 12345;

const routes = require('./libs/hcs.routes');
const render = require('./libs/hcs.render.html');
const render_api = require('./libs/hcs.render.api');
const language = require('./libs/hcs.language');
const api_register = require('./libs/hcs.register.api');
const render_code = require("./libs/hcs.render.server.code");
const mongoDBStore = require("./libs/lv.render.mongodb");
const lvExecStore = require("./modules/lv.db");
const entities = require("./libs/lv.entity");
const lv_handler_bar = require("./libs/lv.render.custom");
const lv_form = require("./libs/lv.render.form");
const lv_aut = require("./libs/lv.authenticate");
const lv_ajax = require("./libs/lv.render.ajax.store");
const lv_log = require("./libs/lv.logs");
const lv_start = require("./modules/lv.startup");
const googleAnalytics = require("./libs/GoogleAnalytics");
routes.onError(err => {
    lv_log.debug(err, './libs/hcs.routes');
});
render.onError(err => {
    lv_log.debug(err, './libs/hcs.render.html');
});
render_api.onError(err => {
    lv_log.debug(err, './libs/hcs.render.api');
});
lv_form.onError(err => {
    lv_log.debug(err, './libs/lv.render.form');
});
lv_handler_bar.apply_handlebar();
global.get_app_dir = function () {
    return __dirname;
};
var cookieParser = require('cookie-parser');
var session = require('express-session');
///Ca?i ???t th? mu?c cache api
api_register.setDir("./app_data/api");

var path = require('path');
var express = require('express');
var app = express();
var cache = {};
var dir = path.join(__dirname, 'public');
/** Th? mu?c ch??a ca?c trang html*/
render.setDir("./app_data/pages/templates/default");
/**Th? mu?c ch??a ca?c file JSON language*/
language.setDir("./app_data/language");

render_api.onMatchServerApi(sender => {
    api_register.registerKey(sender.page, sender.data.content, (e, r) => {
        sender.done(undefined, "ajax_call(\"" + r + "\");");
    });

});
lv_ajax.setDir("./app_data/ajax");
render.onLoadPageComplete(event => {
    var pageTitle = language.getPageTitle(event.page, event.language, event.originalContent);
    language.getPageTitleFromFile(event.language, event.page, pageTitle.title, (e, r) => {
        if (pageTitle.matchContent !== "") {
            event.originalContent = event.originalContent.replace(pageTitle.matchContent, r);
        }
        language.scan(event.language, event.page, event.originalContent, onScan => {
            language.getResFromFile(onScan.language, onScan.page, onScan.key, onScan.value, (e, r) => {
                onScan.done(e, r);
            });

        }, (err, result) => {


            lv_ajax.render(result, event.page, sender => {
                sender.replaceBy = "callback(\"" + sender.id + "\")";
                sender.done();


            }, (err, retContent) => {
                
                event.applyContent(retContent);
                render_api.load(event.page, event.originalContent, (err, result) => {

                    event.originalContent = result;
                    event.done(err, event);
                });
            });
            

        });
    });

});
lv_form.set_app_dir(__dirname);
render.onProcessPage(sender => {
    var Language = {
        Current: lv_start.sys_settings().languages[sender.req.currentLanguageCode],
        Support: lv_start.sys_settings().LanguageSupports
    };
    var cache_key = sender.req.currentLanguageCode + "://" + sender.page.absFilePath;
    if (!global.argo) global.argo = {};
    if (!global.argo.lv_cacher) global.argo.lv_cacher = {};
    var run = (sender) => {


        if (!global.argo.lv_cacher[cache_key]) {
            var ret = mongoDBStore.scanContent(sender.info.originalContent);
            if (ret) {
                global.argo.lv_cacher[cache_key] = ret;
                var content = sender.info.originalContent.replace(ret.replacer, "");
                global.argo.lv_cacher[cache_key].content = content;

            }
            else {
                global.argo.lv_cacher[cache_key] = {
                    content: sender.info.originalContent
                };
            }
        }
        sender.info.originalContent = global.argo.lv_cacher[cache_key].content;
        var storeInfo = global.argo.lv_cacher[cache_key];

        var pParams = {};
        if (sender.page.req.routeInfo && sender.page.req.routeInfo.params) {
            var keys = Object.keys(sender.page.req.routeInfo.params);
            for (var i = 0; i < keys.length; i++) {
                pParams[keys[i].toLocaleLowerCase()] = sender.page.req.routeInfo.params[keys[i]];
            }
        }
        var Config = {
            "Customer": "default",
            "RootUrl": sender.page.req.protocol + "://" + sender.page.req.headers.host + "/" + global.getConfig().rootWebServerDir,
            "Url": sender.page.req.url,
            "QueryStrings": pParams,
            "SessionId": sender.page.req.sessionID,
            "ViewPath": "~/templates/default/" + sender.page.relPath

        };

        sender.page.model.Config = Config;
        sender.page.model.User = lv_aut.getUser(sender.page.req);
        sender.page.model.HasLogin = sender.page.model.User ? true : false;
        sender.page.model.Language = Language || "vn";
        if (storeInfo.storeName) {
            var xParams = {};
            if (storeInfo.replacer && (storeInfo.replacer.indexOf(')(') > -1)) {
                var _params = storeInfo.replacer.split(')(')[1].split(')')[0];
                xParams = eval("(" + _params + ")");
            }

            lvExecStore.execStore(storeInfo.storeName, {
                Config: Config,
                Params: xParams,
                Language: Language,
                User: sender.page.model.User || null
            }, (err, data) => {

                if (err) {


                    sender.done(err);
                }
                else {
                    if (data.redirect && data.redirect.url) {
                        sender.page.res.redirect(Config.RootUrl + data.redirect.url.replace("~/", ""));
                        //sender.done();
                    }
                    else {
                        sender.page.model.data = data;
                        sender.done();
                    }

                }
            });
        }
        else {
            sender.done();
        }
    };
    lv_form.render(sender.page.req, sender.info.originalContent, (err, content) => {
        if (err) {
            sender.page.res.end(JSON.stringify(err));
        }
        else {
            sender.info.originalContent = content;
            run(sender);
        }
    });
  

});
routes.set_app_dir(__dirname);
routes.load((err, config) => {
    entities.setConnectionString(config.connection);
    lv_start.start((err, app_db_data) => {
        server_start(app_db_data);
    });
    var server_start = (defaultSettings) => {
        try {


            render.onCreatePage((err, page) => {
                if (err) {
                    lv_log.debug(err);
                }
                page.model = {
                    Config: {
                        RootUrl: page.req.protocol + "://" + page.req.headers.host + "/" + config.rootWebServerDir
                    },
                    Settings: {
                        defaultDateFormat: defaultSettings.DefaultDateFormat,
                        defaultCurrencyCode: defaultSettings.DefaultCurrency.Code
                    }
                };
                var p = page;
            });
            lv_log.info("start up with config ", config);

            app.use(cookieParser());
            app.use(session({
                secret: '34SDgsdgspxxxxxxxdfsG', // just a long random string
                resave: false,
                saveUninitialized: true
            }));
            if (!port !== 12345) {
                app.use("/" + config.rootWebServerDir.substring(0, config.rootWebServerDir.length - 1), express.static(path.join(__dirname, 'public')));
            }
            else {
                app.use("/", express.static(path.join(__dirname, 'public')));
            }
            ////app.use(express.static(dir));
            app.use(function (req, res, next) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                try {
                    req.currentLanguageCode = req.cookies.language ||
                        ((lv_aut.getUser(req) &&
                            lv_aut.getUser(req).Settings &&
                            lv_aut.getUser(req).Settings.DefaultLanguage) ? lv_aut.getUser(req).Settings.DefaultLanguage : undefined) ||
                        lv_start.sys_settings().DefaultLanguageCode;
                    if (!req.currentLanguageCode) req.currentLanguageCode = "vn";
                    if (req.url.indexOf('?') > -1) {
                        var queryString = req.url.split('?')[1];
                        req.url = req.url.split('?')[0];
                        req.queryStrings = {};
                        var items = queryString.split('&');
                        for (var i = 0; i < items.length - 1; i++) {
                            if (items[i].indexOf('=') > -1) {
                                req.queryStrings[items[i].split('=')[0]] = items[i].split('=')[1];
                            }
                            else {
                                req.queryStrings[items[i].split('=')[0]] = "";
                            }
                        }
                    }
                    var format = req.param('format');

                    if (format) {
                        req.headers.accept = 'application/' + format;
                    }
                    var item = routes.getRoute(req.url);
                    if (!item && req.url[req.url.length - 1] !== "/") {
                        if (!global.cache_candidate_site) global.cache_candidate_site = {};
                        if (!global.cache_candidate_site[req.url]) {
                            var code = req.url.substring(1, req.url.length);
                            if (lv_start.sys_settings().strCustomer.toLocaleLowerCase().indexOf(";" + code.toLocaleLowerCase() + ";") > -1) {
                                item = {
                                    inputUrl: req.url,
                                    outputUrl: req.url,
                                    params: { RecruiterCode: code },
                                    execUrl: "recruiter/home"

                                };
                                global.cache_candidate_site[req.url] = item;
                            }
                            else {
                                lv_start.findRecruiterByCode(code, (err, result) => {
                                    if (err) {
                                        res.end(JSON.stringify(err));

                                    }
                                    else {
                                        if (result !== null) {
                                            item = {
                                                inputUrl: req.url,
                                                outputUrl: req.url,
                                                params: { RecruiterCode: code },
                                                execUrl: "recruiter/home"

                                            };
                                            item = global.cache_candidate_site[req.url];
                                            exec_url(item);
                                        }
                                        else {
                                            next();
                                        }
                                    }
                                });
                                return;
                            }
                        }
                        else {
                            item = global.cache_candidate_site[req.url];
                        }
                    }
                    var exec_url = (item) => {
                        var url = req.url.substring(global.getConfig().rootWebServerDir.length, req.url.length);
                        if (url[url.length - 1] === '/') {
                            url = url.substring(0, url.length - 1);
                        }
                        if (url === "") {
                            url = config.default;
                        }
                        else {


                            if (item) {
                                url = item.execUrl;
                                req.routeInfo = item;
                                req.routeParams = item.params;
                            }
                        }
                        if ((item) && (item.handler)) {


                            routes.exec(item, req, res);
                        }
                        else {
                            routes.run(__dirname, url, req, res, (err, result) => {
                                if (err) {
                                    if (!req.res._headerSent) {
                                        lv_log.debug(err);

                                        res.status(500)
                                            .end(JSON.stringify(err));
                                    }
                                }
                                else {
                                    if (!req.res._headerSent) {
                                        render.load(__dirname, req.currentLanguageCode, req, res, result.file, (err, result) => {
                                            if (err) {
                                                if (!res._headerSent) {
                                                    lv_log.debug(err);
                                                    res.status(500).end(JSON.stringify({ error: err }));
                                                }
                                            }
                                            else {
                                                if (!res._headerSent) {
                                                    
                                                    res.writeHead(200, {
                                                        'Content-Type': 'text/html',
                                                        'Cache-Control': 'public'
                                                    });
                                                    result = googleAnalytics.Apply(result);
                                                    res.end(result);
                                                }

                                            }


                                        });
                                    }


                                }
                            });
                            //if (item.authorizeBy) {
                            //    routes.authorize(item, req, res, (err, ok) => {
                            //        exec_url(item);
                            //    });
                            //}
                            //else {

                            //}
                        }
                    };
                    if (item) {
                        if (item.authorizeBy) {
                            routes.authorize(item, req, res, (err, ok) => {
                                if (err) lv_log.debug(err);

                                exec_url(item);
                            });
                        }
                        else {
                            exec_url(item);
                        }

                    }
                    else {

                        if (req.url === "/") {
                            next();
                        }
                        else {
                            next();
                        }
                    }
                }
                catch (ex) {
                    lv_log.debug(ex);
                    res.status(500)
                        .end(JSON.stringify({ error: ex.message || ex }));

                }


            });

            app.listen(port, function (req, res) {


            });
        }
        catch (ex) {
            lv_log.debug(ex);
        }
    };
});
