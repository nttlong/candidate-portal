
function initApp(eleID, src) {
    if (!window.$$$$instance)
        window.$$$$instance = 0;
    var id = 0;

    var mask = $("<div class='mask'></div>").appendTo("body");
    $.ajax({
        url: src,
        type: 'get',
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            mask.remove();

            var data = "<p>This is 'myWindow'</p>";
            myWindow = window.open("data:text/html," + encodeURIComponent(XMLHttpRequest.responseText),
                                   "_blank");
            myWindow.focus();
        },
        success: function (data) {
            mask.remove();
           // var newId = window.$$$$instance++;
            var startBody = data.indexOf("<body>") + "<body>".length;
            var endBody = data.indexOf("</body>");
            var txt = data.substring(startBody, endBody);
            var startScript = txt.indexOf("<script>");
            var script = "";
            var funs = [];
            while (startScript > -1) {
                startScript += "<script>".length;
                var endScript = txt.indexOf("</script>");
                script = txt.substring(startScript, endScript);
                funs.push(eval(script))
                txt = txt.replace("<script>" + script + "</script>", "");
                startScript = txt.indexOf("<script>");
            }
            var ele = $($("<div>" + txt + "</div>").children()[0]);
            var data = {
                $ele: ele
            };
            
            for (var i = 0; i < funs.length; i++) {
                funs[i](data);
            }
            window.currentApp = data;
            $(eleID).empty();
            //ele.attr("id", "ele_" + newId);
            ele.appendTo(eleID);
            var app = new Vue({
                delimiters: ['${', '}'],
                el: ele[0],
                data: data
            })
        }
    });


}
var oldUrl;
function historyMonitorStart(handler) {
    function run() {
        if (oldUrl != window.location.href) {
            if (historyChangeCallback.length > 0) {
                if (window.location.href.indexOf('#') > -1) {
                    var data = {};
                    var url = window.location.href.split('#')[1];
                    var items = url.split('&');
                    var ret = {};
                    for (var i = 0; i < items.length; i++) {
                        data[items[i].split('=')[0]] = decodeURI(window["unescape"](items[i].split('=')[1]));
                    }
                    for (var i = 0; i < historyChangeCallback.length; i++) {
                        historyChangeCallback[i](data);
                    }
                }
                else {
                    historyChangeCallback[historyChangeCallback.length - 1]({});
                }
            }
            oldUrl = window.location.href;
        }
        setTimeout(run, 100);
    }
    run();
}

var historyChangeCallback = [];
function applyHistory(scope) {

    scope.$history = {
        data: function () {
            if (window.location.href.indexOf('#') == -1)
                return {};
            var url = window.location.href.split('#')[1];
            var items = url.split('&');
            var ret = {};
            for (var i = 0; i < items.length; i++) {
                ret[items[i].split('=')[0]] = decodeURI(window["unescape"](items[i].split('=')[1]));
            }
            return ret;
        },
        change: function (callback) {
            callback(scope.$history.data());
            scope.$$$$historyCallback = callback;
            historyChangeCallback.push(callback);
        },
        redirectTo: function (bm) {
            window.location.href = bm;
        }
    };
    function URLObject(obj) {
        obj.$url = this;
        var me = this;
        me.data = $history.data();
        me.clear = function () {
            me.data = {};
            return me;
        };
        me.item = function (key, value) {
            if (!me.data) {
                me.data = {};
            }
            me.data[key] = value;
            return me;
        };
        me.done = function () {
            var keys = Object.keys(me.data);
            var retUrl = "";
            for (var i = 0; i < keys.length; i++) {
                retUrl += keys[i] + "=" + window["escape"](encodeURI(me.data[keys[i]])) + "&";
            }
            retUrl = window.location.href.split('#')[0] + '#' + retUrl.substring(0, retUrl.length - 1);
            return retUrl;
        };
        var x = 1;
    }
    new URLObject(scope);
    historyMonitorStart(historyChangeCallback);
}
var __$url = "";
function $ws_set_url(url) {
    __$url = url;
}
function $ws_get_url() {
    return __$url;
}
function $ws(obj) {
    function res(obj) {
        var me = this;
        me.sender = obj;
        me.api = function (api) {
            me._api = api;
            return me;
        };
        me.data = function (data) {
            me._data = data;
            return me;
        };
        me.done = function (callback) {
            me._callback = callback;
            var mask = $("<div class='mask'></div>").appendTo("body");
            $.ajax({
                url: $ws_get_url() + "?api=" + me._api,
                type: 'post',
                dataType: 'json',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(me._data),
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    mask.remove();

                    var data = "<p>This is 'myWindow'</p>";
                    myWindow = window.open("data:text/html," + encodeURIComponent(XMLHttpRequest.responseText),
                                           "_blank");
                    myWindow.focus();
                },
                success: function (data) {
                    
                    mask.remove();
                    if (data == null) {
                        if (callback) {
                            callback(data);
                        }
                        return;
                    }
                    if (data.error && data.error.errorMessage) {
                        toastr.error(data.error.errorMessage);
                        return;
                    }
                    if (me._callback) {
                        me._callback(data);
                    }
                }
            });
        }
    };
    return new res(obj);
};
function dateFormat(date, format) {
    return moment(date).format(format.toUpperCase());
}


$.fn.error = function (message, title) {
    var tmp =
  "<div class=\"alert alert-error\" role=\"alert\">" +
  "<button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>" +
    "<strong id='title'></strong>&nbsp;<span id='msg'></span></div>";
    var tml = $(tmp);
    tml.appendTo(this[0]);

    tml.find("#title").text(title)
    tml.find("#msg").text(message);
};
var msg = {
    error: (msg) => {
        toastr.error(msg, "")
        function ret() {
            var me = this;
            me.then = function (callback) {
                setTimeout(callback, 2000);
            }
        }
        return new ret();
    },
    success: (msg) => {
        toastr.success(msg, "");
        function ret() {
            var me = this;
            me.then = function (callback) {
                setTimeout(callback, 2000);
            }
        }
        return new ret();
    }
}
function form(name) {
    function ret(name) {
        var me = this;
        me.ele = $("#" + name);
        me.$ = function (obj) {
            me.ele = obj.$ele;
            return me;
        }
        me.focus = function (eleId) {
            me.ele.find("#" + eleId).focus();
            return me;
        }
        me.setDatasourceName = function (name) {
            me._datasourceName = name;
            return me;
        }
        me.error = function (data) {
            me._data = data;
            return me;
        }
        me.then = (callback) => {
            if (me._data && (me._data!=null) && me._data.ErrorMessage) {
                msg.error( me._data.ErrorMessage);
                me.focus(me._data.ErrorField);
                return me;
            }
            else {
                if (callback) {
                    callback(me._data);
                }
            }
        }
    }
    return new ret(name);
}
function ui(obj) {
    function ret(obj) {
        var me = this;
        me.ele = obj.$ele;
        me.form = function (id) {
            me._form = id;
            return me;
        }
        me.error = function (data) {
            me._data = data;
            return me;
        };
        me.focus = function (eleId) {
            if (me._form) {
                me.ele.find("#" + me._form + " #" + eleId).focus().select();
            }
            else {
                me.ele.find("#" + eleId).focus().select();
            }
            return me;
        };
        me.then = (callback) => {
            if (me._data && (me._data != null) && me._data.ErrorMessage) {
                msg.error(me._data.ErrorMessage);
                me.focus(me._data.ErrorField);
                return me;
            }
            else {
                if (callback) {
                    callback(me._data);
                }
            }
        }

    };
    return new ret(obj);
}