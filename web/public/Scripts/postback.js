var __onAfterSubmit = {};
var __onBeforeSubmit = {};
function afterSubmit(name, callback) {
    __onAfterSubmit[name] = callback;
}
function beforeSubmit(name, callback) {
    __onBeforeSubmit[name] = callback;
}
$(document).ready(function () {
    $('form').on('submit', function (e) {
        var me = this;
        e.preventDefault();
        var postData = {

        };
        if ($(me).find("[name='__url']").length == 0) {
            var url = $("<input type='hidden' name='__url'/>").appendTo(me);
            url.val(window.location.href);
        }
        var mask = $("<div class='mask'></div>").appendTo("body");
        $(me).find("[name]")
        .each(function (idx, ele) {
            var key = $(ele).attr["name"];
           // var value=ele.
        });
        function run(){
            $.ajax({
                url: $(me).attr('action'),
                type: "POST",
                data: $(me).serialize(),
           
                success: function (data) {
                    mask.remove();
                    var retData = JSON.parse(data);
                    if (retData.Error && (retData.Error != null)) {
                        toastr.error(retData.Error.ErrorMessage);
                        $(me).find("[name=" + retData.Error.ErrorField + "]").focus().select();
                        return;
                    }
                    if (retData.error && (retData.error != null)) {
                        toastr.error(retData.error.message);
                        $(me).find("[name=" + retData.error.field + "]").focus().select();
                        return;
                    }
                    if (retData.Action && (retData.Action.Redirect != "")) {
                        window.location = retData.Action.Redirect;
                    
                    
                        return;
                    }

                    if (retData.Action && (retData.Action.Refresh)) {
                        window.location.reload();


                        return;
                    }
                    if (retData.action && (retData.action.refresh != "")) {
                        window.location.reload();


                        return;
                    }
                    if (retData.action && (retData.action.redirect != "")) {
                        window.location = retData.action.redirect;


                        return;
                    }
                    if (__onAfterSubmit[$(me).attr("name")]) {
                        __onAfterSubmit[$(me).attr("name")](JSON.parse(data));
                    }
                
                },
                error: function (jXHR, textStatus, errorThrown) {
                    mask.remove();
                }
            });
        }
        if (__onBeforeSubmit[$(me).attr("name")]) {
            var sender = {
                form: me,
                done: function () {
                    run();
                }
            }
            __onBeforeSubmit[$(me).attr("name")](sender);
        }
        else {
            run();
        }
        
    });
});
var callback = function (api) {
    function ret(api) {
        var me = this;
        me.data = function (data) {
            me._data = data;
            return me;
        };
        me.done = function (callback) {
            var mask = $("<div class='mask'></div>").appendTo("body");
            $.ajax({
                url: rootUrl + "call.ashx?token=" + api,
                type: "POST",
                data: JSON.stringify(me._data),
                success: function (data) {
                    mask.remove();
                    var retData = JSON.parse(data);
                    if (retData.error && retData.error != null) {
                        toastr.error(retData.error.message);
                        $(me).find("[name=" + retData.error.field + "]").focus().select();
                        return;
                    }
                    if (retData.Error && (retData.Error != null)) {
                        toastr.error(retData.Error.ErrorMessage);
                        $(me).find("[name=" + retData.Error.ErrorField + "]").focus().select();
                        return;
                    }

                    if (retData.Action && (retData.Action.Redirect != "")) {
                        window.location = retData.Action.Redirect;


                        return;
                    }

                    if (retData.Action && (retData.Action.Refresh)) {
                        window.location.reload();


                        return;
                    }
                    if (retData.action && (retData.action.refresh != "")) {
                        window.location.reload();


                        return;
                    }
                    if (retData.action && (retData.action.redirect != "")) {
                        window.location = retData.action.redirect;


                        return;
                    }
                    callback(retData);

                },
                error: function (jXHR, textStatus, errorThrown) {
                    console.log(jXHR)
                    mask.remove();
                    var html = jXHR.error().responseText;
                    var uri = "data:text/html," + encodeURIComponent(html);

                    var newWindow = window.open("");
                    setTimeout(function () {
                        newWindow.document.write(html);
                    }, 200);


                }
            });
        }
    }
    return new ret(api);
};
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
        me.data = obj.$history.data();
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