
function app_start() {
    try {
       
        var mdl = angular.module("app", ['ngMaterial']);
        mdl.controller("app", ["$mdToast","$mdDialog",
            "$compile",
            "$http",
            "$mdSidenav",
            "$scope",
            function ($mdToast,$mdDialog, $compile, $http, $mdSidenav, scope) {
                try {
                    window.scope = scope.$root;
                    scope.$root.$http = $http;
                    scope.$root.$compile = $compile;
                    scope.$root.$mdDialog = $mdDialog;
                    scope.$root.$mdToast = $mdToast;
                    initApp(window.scope);
                    scope.$root.sideBarToggle = function () {
                        $mdSidenav("mainSidebar").toggle();
                    };
                    scope.$root.doCommand = function(cmd){
                        scope.$root.loadView(scope, "views/" + cmd + ".html", angular.element(document.getElementById("content")))
                            .then(function (subScope) {

                            })
                            .catch(function (ex) {
                                alert(ex.message||ex);
                            });
                        scope.$root.sideBarToggle();
                    }
                    scope.$root.doOpen = function (cmd) {
                        scope.$root.loadView(scope, "views/" + cmd + ".html", angular.element(document.getElementById("content")))
                            .then(function (subScope) {

                            })
                            .catch(function (ex) {
                                alert(ex.message||ex);
                            });
                        
                    }
                    $compile(angular.element(document.getElementById("main")).contents())(scope);
                    
                    
                    scope.$root.initGlobalResource();
                    scope.$root.initMenu();
                    scope.$root.initMainMenu();
                    scope.$root.loadView(scope, "views/home.html", angular.element(document.getElementById("content")));
                    scope.$applyAsync();
                    
                }
                catch (ex) {
                    alert(ex.message || ex);
                }


            }]);
      
    }
    catch (ex) {
        alert(ex.message || ex);
    }
}


function initApp(app) {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var lookup = new Uint8Array(256);
    for (var i = 0; i < chars.length; i++) {
        lookup[chars.charCodeAt(i)] = i;
    }
    window.app = app;
    app.createMask = function () {
        var x = ((window.innerWidth - 50) / 2) + "px";
        var y = ((window.innerHeight - 50) / 2) + "px";
        var mask = angular.element("<div class='mask'><md-progress-circular md-mode='indeterminate' style='position:fixed;left:"+x+";top:"+y+"'></md-progress-circular></div>");
        angular.element(mask.children()[0]).css({ left: (window.innerWidth - 50) / 2, top: (window.innerHeight - 50 / 2) });
        angular.element(document.body).append(mask);
        app.$compile(mask.contents())(app);
        return mask;
    }
    app.setDeviceInfo = function (device) {
        app.device = device;
        app.$applyAsync();
    }
    app.openCamera = function () {
        return new Promise(function (resolve, reject) {
            try {
                navigator.camera.getPicture(function (path) {
                    try {

                       
                        resolve(path);
                    }
                    catch (ex) {
                        reject(ex)
                    }
                    
                }, function (err) {
                    reject(err)
                    }, {
                        cameraDirection: 1,
                        quality:30
                    });
            }
            catch (ex) {
                reject(ex);
            }
        });

    };
    app.loadViewInfo = function (path) {
        return new Promise(function (resolve, reject) {
            try {
                if (!window.cache) window.cache = {};
                if (!window.cache.views) window.cache.views = {};
                if (window.cache.views[path.toLowerCase()]) {
                    var view = window.cache.views[path.toLowerCase()];
                    view.ele = angular.element(angular.element("<div>" + view.viewContent + "</div>").children()[0]);
                    resolve(window.cache.views[path.toLowerCase()]);
                    return;
                }
                app.$http({
                    method: 'GET',
                    url: path
                }).then(function (response) {
                    var content = response.data;
                    var startBody = content.indexOf("<body>") + "<body>".length;
                    var endBody = content.indexOf("</body>");
                    var viewContent = content.substring(startBody, endBody);
                    var startScript = viewContent.indexOf("<script>");
                    while (viewContent[0] === " ") viewContent = viewContent.substring(1, viewContent.length);
                    while (viewContent[viewContent.length - 1] === " ") viewContent = viewContent.substring(0, viewContent.length - 1);
                    var view = {

                    }
                    if (startScript > -1) {
                        startScript += "<script>".length;
                        var endScript = viewContent.indexOf("</script>");
                        var scriptContent = viewContent.substring(startScript, endScript);
                        view.scriptContent = scriptContent;
                        viewContent = viewContent.substring(0, startScript - "<script>".length) +
                            viewContent.substring(endScript + "</script>".length, viewContent.length);
                    }
                    view.viewContent = viewContent;
                    view.ele = angular.element(angular.element("<div>" + viewContent + "</div>").children()[0]);
                    view.path = path;
                    window.cache.views[path.toLowerCase()] = view;
                    resolve(window.cache.views[path.toLowerCase()]);
                }, function (response) {
                    reject(response);
                });
            }
            catch (ex) {
                reject(ex);
            }
            

        });
    };
    app.compileView = function (scope, view) {
        return new Promise(function (resolve, reject) {
            try {
                var subScope = scope.$new(true);
                if (!view.code) {
                    if (view.scriptContent) {
                        var fn = Function("var ret=" + view.scriptContent + "; return ret;")();
                        if (fn && angular.isFunction(fn)) {
                            view.code = fn;
                        }
                        else {
                            view.code = function (scope){ };
                        }
                    }
                    else {
                        view.code = function (scope){ };
                    }
                }
                view.code(subScope);
                app.$compile(view.ele.contents())(subScope);
                subScope.$applyAsync();
                resolve({
                    view: view,
                    scope: subScope
                });
            }
            catch (ex) {
                reject(ex);
            }

        });
    };
    app.showView = function (view, ele) {
        ele.empty();
        ele.append(view.ele);

    };
    app.doBack = function () {
        if (app.navigator) {
            var item = app.navigator.pop();
            app.loadView(app.mainScope, item, app.mainEle)
                .then(function (result) {
                    app.navigator.pop();
                });
        }
    }
    app.loadView = function (scope, path, ele) {
        return new Promise(function (resolve, reject) {
            try {
                if (!app.navigator) { app.navigator = []; }
                app.mainEle = ele;
                app.mainScope = scope;
                app.initViewRes(path)
                    .then(function (data) {
                        var mask = app.createMask();
                        app.loadViewInfo(path)
                            .then(function (view) {
                                app.compileView(scope, view)
                                    .then(function (result) {
                                        result.scope.$$$$langData = data;
                                        result.scope.res = function (key) {
                                            key = key.toLowerCase();
                                            while (key[0] === " ") key = key.substring(1, key.length);
                                            while (key[key.length - 1] === " ") key = key.substring(0, key.length - 1);
                                            if (!result.scope.$$$$langData[key]) return key;
                                            return result.scope.$$$$langData[key];
                                        }
                                        app.showView(result.view, ele);
                                        mask.remove();
                                        app.currentViewPath = path;
                                        app.navigator.push(app.currentViewPath);
                                        resolve(result.scope);
                                    })
                                    .catch(function (ex) {
                                        mask.remove();
                                        reject(ex);
                                    });
                            })
                            .catch(function (ex) {
                                mask.remove();
                                reject(ex);
                            });
                    })
                    .catch(function (ex) {
                        console.log(ex);
                        
                    });
               
            }
            catch (ex) {
                reject(ex);
            }
           
        });
    };
    app.doShowDialog = function (scope, path) {
        app.loadViewInfo(path)
            .then(function (view) {
                app.compileView(scope, view)
                    .then(function (result) {
                        if (!window.cache) window.cache = {};
                        if (!window.cache.numOfDialog) window.cache.numOfDialog = 1;
                        else window.cache.numOfDialog = window.cache.numOfDialog + 1;

                        app.$mdDialog.show({
                            template:
                            "<div id='" + "dialog_" + window.cache.numOfDialog + "'></div>",
                            parent: angular.element(document.body)
                        });

                        setTimeout(function () {
                            angular.element(document.getElementById("dialog_" + window.cache.numOfDialog)).append(result.view.ele);
                        }, 300);


                    })
                    .catch(function (ex) {
                        alert(ex.message);
                    });
            }).catch(function (ex) {
                alert(ex.message);
            });
    };
    app.setConfig = function (path, data) {
        window.localStorage.setItem(path, data);
    }
    app.getConfig = function (path) {
        return window.localStorage.getItem(path);
    };
    app.getLanguage = function () {
        return window.localStorage.getItem("settings.language")||"vi";
    };
    app.setLanguage = function (value) {
        window.localStorage.getItem("settings.language",value)
    }
    app.getFileError = function(err) {
        var error = {};
        if (err.code === FileError.ENCODING_ERR) {
            error = { message: "endcoding error" };
        }
        if (err.code === FileError.ABORT_ERR) {
            error = { message: "abort error" };
        }
        if (err.code === FileError.INVALID_MODIFICATION_ERR) {
            error = { message: "invalidate modification error" };
        }
        if (err.code === FileError.INVALID_STATE_ERR) {
            error = { message: "invalidate state error" };
        }
        if (err.code === FileError.NOT_FOUND_ERR) {
            error = { message: "file not found error" };
        }
        if (err.code === FileError.NOT_READABLE_ERR) {
            error = { message: "not readable error" };
        }
        if (err.code === FileError.NO_MODIFICATION_ALLOWED_ERR) {
            error = { message: "no modification allow" };
        }
        if (err.code === FileError.PATH_EXISTS_ERR) {
            error = { message: "path exist error" };
        }
        if (err.code === FileError.QUOTA_EXCEEDED_ERR) {
            error = { message: "Quota exceeded err" };
        }
        if (err.code === FileError.SECURITY_ERR) {
            error = { message: "SECURITY ERR" };
        }
        if (err.code === FileError.SYNTAX_ERR) {
            error = { message: "SYNTAX ERR" };
        }
        if (err.code === FileError.TYPE_MISMATCH_ERR) {
            error = { message: "TYPE_MISMATCH_ERR" };
        }
        error.code = err.code;
       
        return error;
    };
    
    app.getArrayBufferOfFile = function (path) {
        return new Promise(function (resolve, reject) {
            app.$http.get(path, { responseType: "arraybuffer" })
                .then(function (data) {
                    resolve(data.data);
                  
                }, function (res) {
                    reject(res);
                });
          
        });
        
    };
    app.arrayToBase64 = function (arraybuffer) {
        var bytes = new Uint8Array(arraybuffer),
            i, len = bytes.length, base64 = "";

        for (i = 0; i < len; i += 3) {
            base64 += chars[bytes[i] >> 2];
            base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
            base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
            base64 += chars[bytes[i + 2] & 63];
        }

        if ((len % 3) === 2) {
            base64 = base64.substring(0, base64.length - 1) + "=";
        } else if (len % 3 === 1) {
            base64 = base64.substring(0, base64.length - 2) + "==";
        }

        return base64;
    };
    app.base64ToArray = function (base64) {
        var bufferLength = base64.length * 0.75,
            len = base64.length, i, p = 0,
            encoded1, encoded2, encoded3, encoded4;

        if (base64[base64.length - 1] === "=") {
            bufferLength--;
            if (base64[base64.length - 2] === "=") {
                bufferLength--;
            }
        }

        var arraybuffer = new ArrayBuffer(bufferLength),
            bytes = new Uint8Array(arraybuffer);

        for (i = 0; i < len; i += 4) {
            encoded1 = lookup[base64.charCodeAt(i)];
            encoded2 = lookup[base64.charCodeAt(i + 1)];
            encoded3 = lookup[base64.charCodeAt(i + 2)];
            encoded4 = lookup[base64.charCodeAt(i + 3)];

            bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
            bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
            bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
        }

        return arraybuffer;
    };
    app.arrayToImageBase64 = function (arrayBuffer) {
        return "data:image/png;base64," + app.arrayToBase64(arrayBuffer);
    };
    app.msg = function (content) {
        var smp = app.$mdToast.simple()
            .textContent(content)
            .parent(document.body)
         
            .hideDelay(3000);
        app.$mdToast.show(
            smp
        );
    };
    app.getLocation = function () {
        return new Promise(function (resolve, reject) {
            var options = null;
            function run() {
                navigator.geolocation.getCurrentPosition(function (info) {
                    var ret = {
                        Time: new Date(info.timestamp),
                        coords: info.coords
                    };
                    resolve(ret);
                }, function (err) {
                    reject(err);
                }, options);
                
            }
            run();

            
        });
    };
    app.getServiceUrl = function () {
        return app.getConfig("service.url");
    };
    app.call = function (api, data) {
        app.$http
    };
    app.getJsonData = function (path) {
        return new Promise(function (resolve, reject) {
            try {
                var mask = app.createMask();
                app.$http.get(path)
                    .then(function (response) {
                        mask.remove();
                        var ret = response.data;
                        resolve(ret);
                    }, function (err) {
                        mask.remove();
                        reject(err);
                    });
            }
            catch (ex) {
                reject(ex);
            }
        });
    };
    app.initGlobalResource = function () {
        app.getJsonData("res/lang/global." + app.getLanguage() + ".json")
            .then(function (res) {
                app.globalResource = res.data;
                app.$applyAsync();
            })
            .then(function (err) {
                console.log(err);
            });
    };
    app.res = function (key) {
        key = key.toLowerCase();
        while (key[0] === " ") key = key.substring(1, key.length);
        while (key[key.length - 1] === " ") key = key.substring(0, key.length - 1);
        while (key.indexOf("  ") > -1) key = key.replace("  ", " ");

        if (!app.globalResource) return "GRES_EMPTY";
        if (!app.globalResource[key]) return "GRES_KEY_EMPTY";
        return app.globalResource[key]
    };
    app.initViewRes = function (path) {
        return new Promise(function (resolve, reject) {
            try {
                var fPath = path.substring(0, path.length - 5);
                while (fPath.indexOf("/") > -1) {
                    fPath = fPath.replace("/", ".");
                }
                var url = "res/lang/" + fPath + "." + app.getLanguage() + ".json";
                url = url.toLocaleLowerCase();
                if (!window.cache) window.cache = {};
                if (!window.cache.lang) window.cache.lang = {};
                if (!window.cache.lang[app.getLanguage()]) window.cache.lang[app.getLanguage()] = {};
                if (window.cache.lang[app.getLanguage()][url]) {
                    resolve(window.cache.lang[app.getLanguage()][url]);
                }
                else {
                    app.getJsonData(url)
                        .then(function (data) {
                            window.cache.lang[app.getLanguage()][url] = data.data;
                            resolve(window.cache.lang[app.getLanguage()][url]);
                        })
                        .catch(function (ex) {
                            resolve({});
                        });
                }
            }
            catch (ex) {
                reject(ex);
            }

        });
    };
    app.initMenu = function () {
        app.getJsonData("res/menu/settings.json")
            .then(function (data) {
                if (!app.menu) {
                    app.menu = {};
                }
                app.menu.settings = data.data;
                app.$applyAsync();
            })
            .catch(function (ex) {
                alert("Init data error")
            });
    },
        app.initMainMenu = function () {
            app.getJsonData("res/menu/main.json")
                .then(function (data) {
                    if (!app.menu) {
                        app.menu = {};
                    }
                    app.menu.main = data.data;
                    app.$applyAsync();
                })
                .catch(function (ex) {
                    alert("Init data error")
                });
        };
    app.fireOnOnLine = function () {
        if (app._onOnLine) {
            for (var i = 0; i < app._onOnLine.length; i++) {
                app._onOnLine[i]();
            }
        }
    }
    app.onOnline = function (callback) {
        if (!app._onOnLine) app._onOnLine = [];
        app._onOnLine.push(callback);
    };
    app.watchLocation = function () {
        
    }
};
app_start();

