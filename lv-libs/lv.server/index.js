
var http = require('http');
var port = process.env.PORT || 12345;
//var port = 12345;

const routes = require('hcs.routes');
const render = require('hcs.render.html');
const render_api = require('hcs.render.api');
const language = require('hcs.language');
const api_register = require('hcs.register.api');
const render_code = require("hcs.render.server.code");
const lv_handler_bar = require("lv.render.custom");

const lv_aut = require("lv.authenticate");

const lv_log = require("lv.logs");

const googleAnalytics = require("GoogleAnalytics");
routes.onError(err => {
    lv_log.debug(err, 'hcs.routes');
});
render.onError(err => {
    lv_log.debug(err, 'hcs.render.html');
});
render_api.onError(err => {
    lv_log.debug(err, 'hcs.render.api');
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


            event.originalContent = result;
            event.done(err, event);


        });
    });

});
var _onProcessPage;
function onProcessPage(callback) {
    _onProcessPage = callback;
}
render.onProcessPage(sender => {
    var Language = {
        Current: "en",
        Support: []
    };
    var cache_key = sender.req.currentLanguageCode + "://" + sender.page.absFilePath;
    if (!global.argo) global.argo = {};
    if (!global.argo.lv_cacher) global.argo.lv_cacher = {};
    var run = (sender) => {


        if (!global.argo.lv_cacher[cache_key]) {
            global.argo.lv_cacher[cache_key] = {
                content: sender.info.originalContent
            };
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
        if (_onProcessPage) {
            _onProcessPage(sender)
        }
        else {
            sender.done();
        }
        
    };
    run(sender);


});
routes.set_app_dir(__dirname);
function onError(callback) {
    _onError = callback;
}
function onAppStart(callback) {
    _onLoad = callback;
}
function start(port) {
    var defaultSettings = {
        Language: "en",
        DefaultDateFormat: "dd/MM/yyyy",
        DefaultCurrency: {
            Code:"$"
        }
    }
    routes.load((err, config) => {
        if (err) {
            if (_onError) {
                _onError(err);
            }
            return;
        }
       
        
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
                                lv_aut.getUser(req).Settings.DefaultLanguage) ? lv_aut.getUser(req).Settings.DefaultLanguage : undefined) || defaultSettings.Language
                           
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
        if (_onLoad) {
            _onLoad(defaultSettings)
            server_start(defaultSettings);
        }
        else {
            server_start(defaultSettings);
        }
        
    });
}
module.exports = {
    onError: function (callback) {
        _onError = callback
    },
    star: start,
    onAppStart: onAppStart
}