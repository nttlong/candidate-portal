var _dialog_root_url;
function dialog_root_url(value) {
    _dialog_root_url = value;
}
function dialog($scope) {
    function getScript(content) {
        if (content.indexOf("<body>") > -1) {
            var x = content.indexOf("<body>") + "body".length;
            var y = content.indexOf("</body>");
            content = content.substring(x, y);
        }
        var ret = [];
        var i = content.indexOf("<script>");
        while (i > -1) {
            var j = content.indexOf("</script>", i);
            var script = content.substring(i + "<script>".length, j);
            ret.push(script);
            content = content.substring(0, i) + content.substring(j + "</script>".length, content.length);
            i = content.indexOf("<script>");
        }
        return {
            scripts: ret,
            content: content
        };
    }
    function compile(scope, scripts, content) {
        var subScope = scope.$new(true, scope);
        if (scripts && (scripts.length > 0)) {
            for (var i = 0; i < scripts.length; i++) {
                try {
                    //debugger;
                    var fn = Function("var ret=" + scripts[i] + ";return ret")();
                    fn(subScope);
                }
                catch (ex) {
                    console.log(scripts[i])

                    throw ({
                        error: ex
                    })
                }
            }
        }
        //for (var i = 0; i < scripts.length; i++) {
        //    var fn = eval(scripts[i]);
        //    fn(subScope);
        //}
        var frm = $('<div><div class="modal fade" id="myModal" role="dialog">' +
            '<div class="modal-dialog">' +
            '<div class="modal-content">' +

            '<div class="modal-header">' +
            '<button type="button" class="close" data-dismiss="modal">&times;</button>' +

            '<h4 class="modal-title"><img src=""/ style="height:40px"><span></span></h4>' +
            '</div>' +
            '<div class="modal-body">' +

            '</div>' +
            '</div></div>'
        );
        var $ele = $("<div>" + content + "</div>");
        var child = $($ele.children()[0])
        $ele.children().appendTo(frm.find(".modal-body")[0]);

        subScope.$watch(function () {
            return child.attr("title");
        }, function (val) {
            subScope.$element.find(".modal-title span").html(val);

        });
        subScope.$watch(function () {
            return child.attr("icon");
        }, function (val) {
            subScope.$element.find(".modal-title img").attr("src", val);

        });
        $scope.$root.$compile(frm.contents())(subScope);
        subScope.$element = $(frm.children()[0]);
        subScope.$applyAsync();

        return subScope;
    }
    function ret(scope) {
        var me = this;
        me.url = function (_url) {
            if (_dialog_root_url) {
                me._url = _dialog_root_url + "/" + _url;
            }
            else {
                me._url = _url;
            }

            return me;
        }
        me.done = function (callback) {
            $.ajax({
                method: "GET",
                url: me._url,
                success: function (res) {
                    debugger
                    var ret = getScript(res);
                    var sScope = compile(scope, ret.scripts, ret.content);
                    if (callback) {
                        callback(sScope);
                    }
                    sScope.$element.appendTo("body");
                    function watch() {
                        if (!$.contains($("body")[0], sScope.$element[0])) {
                            sScope.$destroy();
                        }
                        else {
                            setTimeout(watch, 500);
                        }
                    }
                    watch();
                    sScope.$element.modal()
                        .on("hidden.bs.modal", function () {
                            sScope.$element.remove();

                        });

                    function watch() {
                        if (!$.contains($("body")[0], sScope.$element[0])) {

                            sScope.$destroy();
                        }
                        else {
                            setTimeout(watch, 500);
                        }
                    }
                    sScope.$doClose = function () {
                        sScope.$element.modal('hide')
                    }
                    watch();
                }
            })
        }
    }
    return new ret($scope);
}
function $url() {
    function ret() {
        var me = this;
        me.data = {};
        if (window.location.href.indexOf("#") > -1) {
            var ref = window.location.href.split('#')[1];
            var items = ref.split('&');
            for (var i = 0; i < items.length; i++) {
                me.data[items[i].split('=')[0]] = items[i].split('=')[1];
            }
        }
        me.param = function (key, value) {
            me.data[key] = value;
            return me;
        }
        me.clear = function () {
            me.data = {}
            return me;
        }
        me.url = function () {
            var ret = "";
            var keys = Object.keys(me.data);
            for (var i = 0; i < keys.length; i++) {
                ret += keys[i] + "=" + me.data[keys[i]] + "&"
            }
            return ret.substring(0, ret.length - 1);
        }
        me.apply = function () {
            window.location.href = "#" + decodeURIComponent( me.url());
        }

    }
    return new ret();
}
function history_navigator($scope) {
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
                        var keys = Object.keys($scope.$history.events);
                        for (var i = 0; i < keys.length; i++) {
                            if (!$scope.$history.events[keys[i]].hasStartCall) {
                                var obj = {
                                    key: keys[i],
                                    data: data,
                                    done: function () {
                                        if ($scope.$history.events[obj.key])
                                            $scope.$history.events[obj.key].handler(obj.data);
                                    }
                                }
                                setTimeout(function () {
                                    obj.done();
                                }, 300);

                            }
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
            isStart: true,
            events: {},
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
                var _data = scope.$history.data();
                callback(_data);
                scope.$$$$historyCallback = callback;
                historyChangeCallback.push(callback);

            },
            redirectTo: function (bm) {
                window.location.href = bm;
            },
            onChange: function (subScope, handler) {

                scope.$history.events["scope_" + subScope.$id] = {
                    handler: handler,
                    hasStartCall: true,
                    scope: subScope
                };
                subScope.$on("$destroy", function () {
                    delete scope.$history.events["scope_" + subScope.$id];
                });
                if (scope.$history.events["scope_" + subScope.$id].hasStartCall) {
                    handler(scope.$history.data());
                    scope.$history.events["scope_" + subScope.$id].hasStartCall = false;
                }

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
    return new applyHistory($scope);
}

function ng_app(injection, fn) {
    injection.push("c-ui");
    var app = angular.module("app", injection, function ($interpolateProvider) {
        $interpolateProvider.startSymbol('${');
        $interpolateProvider.endSymbol('}');
    });
    var controller = app.controller("app", ["$compile", "$scope", function ($compile, $scope) {
        $scope.$root.$compile = $compile;
        fn($scope);
        $scope.$applyAsync();
    }]);
}
var _appDirectiveSetRootUrl;
function appDirectiveSetRootUrl(url) {
    _appDirectiveSetRootUrl = url;
}
var mdl = angular.module("c-ui", []);
// candidate portal directive ui
mdl.directive("cTemplate", ["$compile", function ($compile) {

    function loadUrl(url, handler) {
        var $mask = $("<div class='mask'></div>");
        $mask.appendTo("body");
        $.ajax({
            url: _appDirectiveSetRootUrl + "/" + url,
            method: "get",
            success: function (res) {
                $mask.remove();
                handler(undefined, { url: url, res: res });
            },
            error: function (err) {
                $mask.remove();
                handler(err);
            }
        })
    }
    function getScript(res) {
        var content = res.res;
        if (content.indexOf("<body>") > -1) {
            var x = content.indexOf("<body>") + "<body>".length;
            var y = content.indexOf("</body>",x);
            content = content.substring(x, y);
        }
        var ret = [];
        var i = content.indexOf("<script>");
        while (i > -1) {
            var j = content.indexOf("</script>", i);
            var script = content.substring(i + "<script>".length, j);
            ret.push(script);
            content = content.substring(0, i) + content.substring(j + "</script>".length, content.length);
            i = content.indexOf("<script>");
        }
        return {
            scripts: ret,
            content: content,
            url:res.url
        };
    }
    function compile(scope, scripts, content,url) {
        
        var subScope = scope.$new(true, scope);
        if (scripts && (scripts.length > 0)) {
            for (var i = 0; i < scripts.length; i++) {
                try {
                    //debugger;
                    var fn = Function("var ret=" + scripts[i] + ";return ret")();
                    fn(subScope);
                }
                catch (ex) {
                    throw ({
                        error: ex,
                        url: url
                    })
                    console.log(scripts[i])
                }
            }
        }
        var $ele = $("<div>" + content + "</div>");
        subScope.$element = $ele.children();
        $compile($ele.contents())(subScope);
        subScope.$applyAsync();

        return subScope;
    }
    return {
        restrict: "ACE",
        link: function (scope, ele, attr) {
            attr.$observe("url", function (value) {
                loadUrl(value, function (err, content) {
                    var ret = getScript(content);
                    var sScope = compile(scope, ret.scripts, ret.content,ret.url);
                    ele.empty();
                    sScope.$element.appendTo(ele[0]);
                    function watch() {
                        if (!$.contains($("body")[0], sScope.$element[0])) {
                            sScope.$destroy();
                        }
                        else {
                            setTimeout(watch, 500);
                        }
                    }
                    watch();
                })
            })
        }
    }
}]);
mdl.directive("cHtmlBoxLang", ["$parse", function ($parse) {
    return {
        restrict: "ACE",
        link: function (scope, ele, attr) {
            var changeByBind = false;
            var changeByManual = false;
            var $ele = ele.summernote({
                height: ele.height()
            }).on("summernote.change", function (e) {   // callback as jquery custom event 
                if (changeByBind) return;
                changeByManual = true;
                var content = $(ele[0]).summernote("code")

                $parse(attr.ngModel + "." + lang).assign(scope, content);
                changeByManual = false;
            });
            var lang = "en";
            attr.$observe("lang", function (val) {
                lang = val;
                var data = scope.$eval(attr.ngModel);
                if (data && data[lang]) {
                    changeByBind = true;
                    $(ele[0]).summernote('code', data[lang]);
                    changeByBind = false;
                }
                else {
                    changeByBind = true;
                    $(ele[0]).summernote('code', "");
                    changeByBind = false;
                }
            })
            scope.$watch(attr.ngModel, function (val, oldVal) {
                if (changeByManual) return;
                changeByBind = true;
                if ((!val) || (val == null)) {
                    $(ele[0]).summernote('code', "");
                    changeByBind = false;
                    return;
                }
                // if (val != oldVal) {

                $(ele[0]).summernote('code', val[lang]);


                // }
                changeByBind = false;
            })
        }
    }
}]);
mdl.directive("cHtmlBox", ["$parse", function ($parse) {
    return {
        restrict: "ACE",
        link: function (scope, ele, attr) {
            var isntance = {
                insertText: function (txt) {
                    $(ele[0]).summernote('editor.insertText', txt);
                }
            }
            var changeByBind = false;
            var changeByManual = false;
            var $ele = ele.summernote({
                height: ele.height()
            }).on("summernote.change", function (e) {   // callback as jquery custom event 
                if (changeByBind) return;
                changeByManual = true;
                var content = $(ele[0]).summernote("code")

                $parse(attr.ngModel).assign(scope, content);
                changeByManual = false;
            });
            scope.$watch(attr.ngModel, function (val, oldVal) {
                if (changeByManual) return;
                changeByBind = true;
                if ((!val) || (val == null)) {
                    $(ele[0]).summernote('code', "");

                }
                // if (val != oldVal) {

                $(ele[0]).summernote('code', val);


                // }
                changeByBind = false;
            });

            if (attr.ngInstance) {
                $parse(attr.ngInstance).assign(scope, isntance);
            }
        }
    }
}]);
/*
<div class="input-group">
    <span class="input-group-addon">@</span>
    <input type="text" class="form-control" placeholder="Placecholder">
</div>
*/
mdl.directive('cDatePicker', ["$parse", function ($parse) {
    return {
        restrict: "CEA",
        replace: true,
        template: "<div class='input-group'><input type='text' class='form-control'/><span class=\"input-group-addon\"><span class=\"glyphicon glyphicon-calendar\"></span></div>",
        link: function (scope, ele, attr) {
            var format = scope.$root.defaultDateFormat||'dd/mm/yyyy';
            if (attr.format) {
                format = scope.$eval(attr.format);
            }
            $(ele[0]).find("input").datepicker({
                language: "vi",
                format: format, allowEmpty: true, clearBtn: true, keepEmptyValues:true
            });
          
            var isAutoChange = false;
            if (attr.ngModel) {
                var val = scope.$eval(attr.ngModel);
                if ((!val) || (val == null)) {
                    $(ele[0]).find("input").datepicker("update", null);
                    ////$(ele[0]).find("input").datepicker().data('datepicker').format(formar);

                }

                else {
                    if (typeof val === "string") {
                        try {
                            changeByModel = true;
                           
                            //$(ele[0]).find("input").datepicker().data('datepicker').format(formar);
                            $(ele[0]).find("input").datepicker("update", new Date(val));
                            changeByModel = false;
                        }
                        catch (ex) {
                            changeByModel = true;
                            $(ele[0]).find("input").datepicker("update", null);
                            //$(ele[0]).find("input").datepicker().data('datepicker').format(formar);
                            changeByModel = false;
                        }
                    }
                    else {
                        changeByModel = true;
                        
                        //$(ele[0]).find("input").datepicker().data('datepicker').format(formar);
                        $(ele[0]).find("input").datepicker("update", val);
                        changeByModel = false;
                    }
                }
            }
            var changeByModel = false;
            var transform = false;
            scope.$watch(attr.ngModel, function (val, oldVal) {
                if (val === "") {
                    changeByModel = true;
                    $(ele[0]).find("input").datepicker("update", "");
                    //$(ele[0]).find("input").datepicker().data('datepicker').format(formar);
                    changeByModel = false;
                    return;
                }
                if (transform) return;
                if (isAutoChange) return;
                if ((!val) || (val == null)) {
                    changeByModel = true;
                    $(ele[0]).find("input").datepicker("update", null);
                    //$(ele[0]).find("input").datepicker().data('datepicker').format(formar);
                    changeByModel = false;
                }
                else {
                    if (typeof val === "string") {
                        try {
                            changeByModel = true;
                           
                            //$(ele[0]).find("input").datepicker().data('datepicker').format(formar);
                            $(ele[0]).find("input").datepicker("update", new Date(val));
                            transform = true;
                            $parse(attr.ngModel).assign(scope, new Date(val));
                            transform = false;
                            changeByModel = false;
                        }
                        catch (ex) {
                            changeByModel = true;
                            $(ele[0]).find("input").datepicker("update", null);
                            //$(ele[0]).find("input").datepicker().data('datepicker').format(formar);
                            changeByModel = false;
                        }
                    }
                    else {
                        changeByModel = true;
                      
                        //$(ele[0]).find("input").datepicker().data('datepicker').format(formar);
                        $(ele[0]).find("input").datepicker("update", val);
                        changeByModel = false;
                    }
                }
            });
            $(ele[0]).find("input").on("change", function () {
                if (changeByModel) return;
                var val = $(ele[0]).find("input").datepicker('getDate');
                if ($(ele[0]).find("input").val() === "") {
                    isAutoChange = true;
                    $parse(attr.ngModel).assign(scope, null);
                    isAutoChange = false;
                    return;
                }
                if ((val && (val.toString() === "Invalid Date")) || (!val)) {
                    isAutoChange = true;
                    $parse(attr.ngModel).assign(scope, null);
                    isAutoChange = false;
                    return;
                }
                isAutoChange = true;
                $parse(attr.ngModel).assign(scope, val);
                isAutoChange = false;

            })
        }
    }

}])
mdl.directive('cMonthPicker', ["$parse", function ($parse) {
    return {
        restrict: "CEA",
        replace: true,
        template: "<div class='input-group'><input type='text' class='form-control'/><span class=\"input-group-addon\"><span class=\"glyphicon glyphicon-calendar\"></span></div>",
        link: function (scope, ele, attr) {
            $(ele[0]).find("input").datepicker({
                format: "mm/yyyy",
                viewMode: "months",
                minViewMode: "months"
            })

            var isAutoChange = false;
            scope.$watch(attr.ngModel, function (val, oldVal) {
                if (isAutoChange) return;
                if ((!val) || (val == null)) $(ele[0]).find("input").datepicker("update", null);
                else {
                    $(ele[0]).find("input").datepicker("update", val);
                }
            });
            $(ele[0]).find("input").on("change", function () {
                var val = $(ele[0]).find("input").val();
                isAutoChange = true;
                $parse(attr.ngModel).assign(scope, val);
                setTimeout(function () {
                    isAutoChange = false;
                }, 500);

            })
        }
    }

}])
mdl.directive('cTimePicker', ["$parse", function ($parse) {
    return {
        restrict: "CEA",
        replace: true,
        template: "<div class='input-group date'><input type='text' class='form-control'/><span class=\"input-group-addon\"><span class=\"glyphicon glyphicon glyphicon-time\"></span></div>",
        link: function (scope, ele, attr) {
            $(ele[0]).find("input").timepicker()
                .on('changeTime.timepicker', function (e) {
                    $parse(attr.ngModel).assign(scope, $(ele[0]).find("input").val());

                });
            scope.$watch(attr.ngModel, function (val) {
                //if (typeof val === 'string') {
                //    try {
                //        val = new Date(val)
                //    }
                //    catch (ex) {
                //        val = null;
                //    }

                //}
                $(ele[0]).find("input").val(val);
                //.timepicker('setTime', val);
            })
        }
    }

}])
mdl.directive('cSelect2', ["$parse", function ($parse) {
    return {
        restrict: "CAE",
        template: "<input type='text' style='width:100%'/>",
        replace: true,
        link: function (scope, ele, attr) {
            debugger
            var multi = false;
            if (attr.multiple) {
                multi = true;
            }
            $(ele[0]).select2({
                data: [],
                placeholder: attr.placeholder || "",
                multiple: multi
            }).on("select2:selecting", function (e) {
                if (attr.ngChange) {
                    var fn = scope.$eval(attr.ngChange);
                    if (angular.isFunction(fn)) {
                        fn(val);
                    }
                }
            });
            var currentValue;
            var _val;
            scope.$watch(attr.ngModel, function (val, oldVal) {
                if (val) {
                    var values = val;
                    if (multi) {
                        values = val.split(',');
                    }
                    $(ele[0]).select2("val", values);
                }
                else {
                    if (multi) {
                        $(ele[0]).select2("val", []);
                    }
                    else {
                        $(ele[0]).select2("val", val);
                    }
                }
                _val = val;
            })
            scope.$watch(attr.source, function (val, oldVal) {

                if ((!val) || (val == null)) {
                    $(ele[0]).select2({ data: [], multiple: multi })
                }
                else {
                    if (angular.isArray(val)) {
                        $(ele[0]).select2({
                            data: val,
                            multiple: multi,
                            templateResult: function (item) {
                                debugger
                                if (item.loading) {
                                    return item.text;
                                }
                                var term = query.term || '';
                                var $result = markMatch('<span class="boldwrap">' + item.text.substring(0, item.text.indexOf(":")) + '</span>' + item.text.substring(item.text.indexOf(":")), term);
                                return $result;

                            }
                        }).on("change", function (e) {

                            var val = $(e.currentTarget).val();

                            $parse(attr.ngModel).assign(scope, val);
                            if (attr.ngChange) {
                                var fn = scope.$eval(attr.ngChange);
                                if (angular.isFunction(fn)) {
                                    fn(val);
                                }
                            }
                        });
                    }
                    else {
                        $(ele[0]).select2({ data: [], multiple: multi })
                    }
                }
                var val = scope.$eval(attr.ngModel);
                var values = val;
                if (angular.isDefined(val)) {
                    if (multi) {
                        values = val.split(',');
                    }
                    $(ele[0]).select2("val", values);
                }
                else {
                    if (multi) {
                        $(ele[0]).select2("val", []);
                    }
                    else {
                        $(ele[0]).select2("val", "");
                    }
                }
                
                
                
            })
        }
    }
}])
mdl.directive('cPhotoUpload', ["$parse", function ($parse) {
    return {
        restrict: "CAE",
        template: "<div><input type='file' multiple accept='image/*'/><img style='height:80px'/></div>",
        replace: true,
        link: function (scope, ele, attr) {
            scope.$watch(attr.ngModel, function (val, oldVal) {
                if (typeof val != 'object') {
                    if ((!val) || (val == null) || (val == "")) {
                        $(ele[0]).find("img").removeAttr("src")
                    }
                    else {
                        $(ele[0]).find("img").attr("src", val);
                    }
                }
            });
            var inputFile = $(ele[0]).find("input[type='file']");
            var img = $(ele[0]).find("img");
            inputFile.on("change", function (event) {
                var input = $(event.target)[0] || event.target;
                if (input) {
                    var fileSize, fileName;
                    fileName = input.files[0].name;
                    fileSize = input.files[0].size;
                    if (fileName.indexOf('.png') == -1 && fileName.indexOf('.jpg') == -1) {
                        var apiError = {};
                        apiError.Error = "nameError";
                        $parse(attr.ngModel).assign(scope, apiError);
                        return
                    }

                    if (fileSize > 200 * 1024) {
                        var apiError = {};
                        apiError.Error = "sizeError";
                        $parse(attr.ngModel).assign(scope, apiError);
                        return
                    }

                    var reader = new FileReader();
                    reader.onload = function () {
                        var dataURL = reader.result;

                        img[0].src = dataURL;
                        input.value = "";
                        $parse(attr.ngModel).assign(scope, dataURL);

                        if (attr.ngChange) {
                            scope.$eval(attr.ngChange);
                        }

                        scope.$applyAsync();
                    };
                    if (attr.fileName) {
                        $parse(attr.fileName).assign(scope, event.target.files[0].name);
                    }
                    reader.readAsDataURL(event.target.files[0]);
                }
            });
        }
    }
}]);
mdl.directive("cAttachFile", ["$parse", function ($parse) {
    return {
        restrict: "CEA",
        template: "<div class='input-group'>" +
        "<div type='text' class='form-control' id='content'>" +
        "</div>" +
        "<span class=\"input-group-addon\">" +
        "<span class=\"fa fa-file-text-o\">" +
        "</span>" +
        "</span>" +
        "<span class=\"input-group-addon\">" +
        "<span style='cursor:pointer' id='btnUpload'>Upload" +
        "</span>" +
        "</span>" +
        "</div>",
        replace: true,
        link: function (scope, ele, attr) {
            var file = $("<input type='file' style='display:none'/>").appendTo("body");
            if (attr.accept) {
                file.attr("accept", attr.accept);
            }
            file.bind("change", function (event) {
                var input = event.target;

                var reader = new FileReader();
                reader.onload = function () {
                    var dataURL = reader.result;
                    input.value = "";
                    $parse(attr.ngModel).assign(scope, dataURL);
                    if (attr.onReadComplete) {
                        var fn = scope.$eval(attr.onReadComplete);
                        if (angular.isFunction(fn)) {
                            fn(dataURL);
                        }
                    }
                    scope.$applyAsync();
                };
                reader.readAsDataURL(event.target.files[0]);
                $(ele[0]).find('#content').html(event.target.files[0].name)
                $parse(attr.fileName).assign(scope, event.target.files[0].name);
                $parse(attr.fileSize).assign(scope, event.target.files[0].size);
            });
            if (attr.title) {
                $(ele[0]).find('#btnUpload').html(attr.title)
            }
            attr.$observe("url", function (val) {
                if (!val) {
                    $(ele[0]).find('#content').empty();
                }
                else {
                    $(ele[0]).find('#content').empty();
                    $(ele[0]).find('#content').html("<a href='" + val + "' target='_blank'>Download</a>");
                }
            })
            scope.$on("$destroy", function () {
                file.remove();
            })
            $(ele[0]).find('#btnUpload').bind("click", function (e) {

                file.trigger("click");
            })

        }
    }
}]);
mdl.directive("cSearchBox", ["$parse", function ($parse) {
    return {
        restrict: "CEA",
        template:
        '<div class="input-group">' +
        '<input type="text" class="form-control" placeholder="Search" id="txtSearch" />' +
        '<div class="input-group-btn" id="clear" style="display:none">' +
        '<button class="btn btn-default"><span class="glyphicon glyphicon-remove" ></span></button>' +
        '</div>' +
        '<div class="input-group-btn" id="btn">' +

        '<button class="btn btn-default">' +
        '<span class="glyphicon glyphicon-search"></span>' +
        '</button>' +
        '</div>' +
        '</div>',
        replace: true,
        link: function (scope, ele, attr) {
            attr.$observe("placeholder", function (v) {
                ele.find("#txtSearch").attr("placeholder",v)
            });
            scope.$watch(attr.ngModel, function (v) {
                ele.find("#txtSearch").val(v);
            })
            ele.find("#clear").click(function () {

                ele.find("#txtSearch").val("");
                if (attr.ngModel) {
                    $parse(attr.ngModel).assign(scope, ele.find("#txtSearch").val());
                }
                if (attr.ngChange) {
                    var fn = scope.$eval(attr.ngChange);
                    if (angular.isFunction(fn)) {
                        fn(ele.find("#txtSearch").val())
                    }
                }
                if (attr.onSearch) {
                    var fn = scope.$eval(attr.onSearch);
                    if (angular.isFunction(fn)) {
                        fn(ele.find("#txtSearch").val())
                    }
                }
            });
            ele.find("#btn").click(function () {
                if (attr.ngModel) {
                    $parse(attr.ngModel).assign(scope, ele.find("#txtSearch").val());
                }
                if (attr.ngChange) {
                    var fn = scope.$eval(attr.ngChange);
                    
                }
                if (attr.onSearch) {
                    var fn = scope.$eval(attr.onSearch);
                    if (angular.isFunction(fn)) {
                        fn(ele.find("#txtSearch").val())
                    }
                }
            });
            ele.find("#txtSearch").keyup(function (evt) {
                var code = evt.keyCode || evt.which;
                if ($(this).val() != "") {
                    ele.find("#clear").show();
                }
                else {
                    ele.find("#clear").hide();
                }
                if (code === 13) {
                    if (attr.ngModel) {
                        $parse(attr.ngModel).assign(scope, $(this).val());
                    }
                    if (attr.ngChange) {
                        var fn = scope.$eval(attr.ngChange);
                       
                    }
                    if (attr.onSearch) {
                        var fn = scope.$eval(attr.onSearch);
                        if (angular.isFunction(fn)) {
                            fn($(this).val())
                        }
                    }
                }
            });
        }
    }
}]);
mdl.directive("cHtmlContent", [function () {
    return {
        link: function (scope, ele, attr) {
            scope.$watch(attr.ngModel, function (val) {
                $(ele[0]).empty();
                $(ele[0]).html(val);
            });
        }
    }
}]);
mdl.directive("cHeaderSort", ["$parse", function ($parse) {
    return {
        restrict: "CEA",
        template: "<th>" +
        "                    <div class=\"dropdown\"  style=\"width:100%\">" +
        "                       <span data-toggle=\"dropdown\" style=\"width:100%;float:left\">" +
        "                          <span id='caption' ></span>" +

        "                         <span class=\"caret pull-right\" style=\"margin-top:10px\"></span>" +
        "<i class='fa fa-sort-alpha-asc pull-right' aria-hidden='true' style='margin-top:4px;display:none' id='icon-asc'></i>" +
        "<i class='fa fa-sort-alpha-desc pull-right' aria-hidden='true' style='margin-top:4px;display:none' id='icon-desc'></i>" +
        "                    </span>" +
        "                   <ul class=\"dropdown-menu\">" +
        "                      <li><a style='cursor:point' id='cmdAsc'><i class=\"fa fa-sort-alpha-asc\" aria-hidden=\"true\"></i>&nbsp;<span id='captionAsc'></span></a></a></li>" +
        "                     <li><a style='cursor:point' id='cmdDesc'><i class=\"fa fa-sort-alpha-desc\" aria-hidden=\"true\"></i>&nbsp;<span id='captionDesc'></span></a></li>" +
        "                    <li><a style='cursor:point' id='cmdRemove'><span id='captionRemoveSort'></span></a></li>" +
        "               </ul>" +
        "          </div>" +
        "     </th>",
        replace: true,

        link: function (scope, ele, attr) {
            attr.$observe("caption", function (v) {
                ele.find("#caption").html(v);
            });
            attr.$observe("captionAsc", function (v) {
                ele.find("#captionAsc").html(v);
            });
            attr.$observe("captionDesc", function (v) {
                ele.find("#captionDesc").html(v);
            });
            attr.$observe("captionRemoveSort", function (v) {
                ele.find("#captionRemoveSort").html(v);
            });
            ele.find('#cmdAsc').click(function () {
                ele.find("#icon-asc").show();
                ele.find("#icon-desc").hide();
                if (attr.ngModel) {
                    var data = scope.$eval(attr.ngModel);

                    if (!data) {
                        data = {};
                    }
                    data[attr.field] = 1;

                    $parse(attr.ngModel).assign(scope, data);
                }
                if (attr.ngChange) {
                    scope.$eval(attr.ngChange);
                }
            });
            ele.find('#cmdDesc').click(function () {
                ele.find("#icon-asc").hide();
                ele.find("#icon-desc").show();
                if (attr.ngModel) {
                    var data = scope.$eval(attr.ngModel);
                    if (!data) {
                        data = {};
                    }
                    data[attr.field] = -1;
                    $parse(attr.ngModel).assign(scope, data);
                }
                if (attr.ngChange) {
                    scope.$eval(attr.ngChange);
                }
            });
            ele.find('#cmdRemove').click(function () {
                ele.find("#icon-asc").hide();
                ele.find("#icon-desc").hide();
                if (attr.ngModel) {
                    var data = scope.$eval(attr.ngModel);
                    if (!data) {
                        data = {};
                    }
                    data[attr.field] = undefined;
                    $parse(attr.ngModel).assign(scope, data);
                }
                if (attr.ngChange) {
                    scope.$eval(attr.ngChange);
                }
            });
        }

    }
}]);
mdl.directive("cMenu", ["$parse", function ($parse) {
    return {
        restrict: "ECA",
        template: '<div><a href="#" class="btn btn-success dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
        '<span class="glyphicon glyphicon-filter"></span>' +
        '</a>' +
        '<ul class="dropdown-menu"></ul></div>',
        // replace: true,
        link: function (scope, ele, attr) {
            function paint(data) {
                ele.find("ul").empty();
                for (var i = 0; i < data.length; i++) {
                    var li = $("<li><span></span></li><li role='separator' class='divider'></li>");
                    li.attr("role-value", data[i].value);

                    li.find("span").html(data[i].text);
                    li.appendTo(ele.find("ul")[0]);
                }
                ele.find("li").click(function (li) {
                    if (attr.ngModel) {
                        $parse(attr.ngModel).assign(scope, $(this).attr("role-value"));
                    }
                    if (attr.ngChange) {
                        scope.$eval(attr.ngChange);
                    }
                })
            }
            if (attr.source) {
                var data = scope.$eval(attr.source);
                paint(data);

                //scope.$watch(attr.source, function (v, o) {

                //    paint(v);
                //});
            }
        }
    }
}]);
/*
ex: <div c-pager data-config="myConfig"></div>
scope.myConfig={
   numOfPageSelector:5,
   totalItems:1723,
    pageSize:20, pageIndex:0
}
*/
mdl.directive("cPager", ["$parse", function ($parse) {
    function createPager(numOfShow, totalItems, pageSize, pageIndex) {
        if (totalItems == 0) {
            return {
                totalPages: 0,
                pageIndex: pageIndex,
                pageSize: pageSize,
                totalItems: 0,
                first: 0,
                last: numOfPage,
                numOfGroups: 0,
                numOfShow2: 0,
                groupIndex: 0,
                pagers: []
            };
        }
        var numOfPage = Math.floor(totalItems / pageSize);
        if (pageIndex > numOfPage) {
            pageIndex = numOfPage;
        }
        if ((totalItems % pageSize > 0) && (totalItems > pageSize)) {
            numOfPage++;
        }

        var numOfGroups = Math.floor(numOfPage / numOfShow);
        if (numOfPage % numOfShow > 0) {
            numOfGroups++;
        }
        var groupIndex = Math.floor(pageIndex / numOfShow);
        if ((pageIndex % numOfShow > 0) && (pageIndex > numOfShow)) {
            groupIndex++;
        }

        var numOfShow2 = Math.floor(numOfShow / 2);

        var start = 0;
        var end = start + numOfShow;
        if ((groupIndex > 0)) {
            if (groupIndex < numOfGroups) {
                start = pageIndex - numOfShow2;
                end = start + numOfShow;
            }
            else {
                start = (groupIndex - 1) * numOfShow + 1;
                end = start + numOfShow;
            }
        }
        if (end > numOfPage) {
            var n = end - numOfPage;
            start = start - n;
            end = end - n;
        }

        var ret = {
            totalPages: numOfPage,
            pageIndex: pageIndex,
            pageSize: pageSize,
            totalItems: totalItems,
            first: 0,
            last: numOfPage,
            numOfGroups: numOfGroups,
            numOfShow2: numOfShow2,
            groupIndex: groupIndex,
            pagers: []
        };

        for (var i = start; i < end; i++) {
            ret.pagers.push({
                index: i,
                caption: (i + 1)

            });
        }
        if (pageIndex < numOfPage - 1) {
            ret.next = pageIndex + 1;
        }
        if (pageIndex > 1) {
            ret.previous = pageIndex - 1;
        }
        return ret;
    };
    function paint(ele, data, a, $parse, s, config) {
        $(ele).empty();
        if (!data) return;

        // vẽ first btn
        var f_li = $("<li><a style='cursor:point'></a></li>");
        f_li.find('a').text("«");
        f_li.attr("role-value", data.first);
        f_li.appendTo(ele);


        // vẽ next btn
        var n_li = $("<li><a style='cursor:point'></a></li>");
        n_li.find('a').text("‹");
        n_li.attr("role-value", data.pageIndex - 1 <= 0 ? 0 : data.pageIndex - 1);
        n_li.appendTo(ele);

        if (data.pageIndex == 0) {
            f_li.addClass("disabled");
            n_li.addClass("disabled");
        }
        var flag = false;
        if (data.pagers) {
            // vẽ li btn
            for (var i = 0; i < data.pagers.length; i++) {
                if (data.pagers[i].caption * 1 >= 0 && data.pagers[i].index * 1 >= 0) {
                    var li = $("<li><a style='cursor:point'></a></li>");
                    li.find('a').text(data.pagers[i].caption);

                    li.attr("role-value", data.pagers[i].index);
                    if (data.pageIndex === data.pagers[i].index) {
                        li.addClass("active");
                    }
                    li.appendTo(ele);
                    if (!flag)
                        flag = true;
                }
            }
        }
        if (!flag) {
            var li = $("<li><a style='cursor:point'></a></li>");
            li.find('a').text("1");
            li.attr("role-value", 0);
            li.addClass("active");
            li.appendTo(ele);
        }

        // vẽ pre btn
        var p_li = $("<li><a style='cursor:point'></a></li>");
        p_li.find('a').text("›");
        p_li.attr("role-value", data.pageIndex + 1 > data.last - 1 ? data.last - 1 : data.pageIndex + 1);
        p_li.attr("name", "preBtn");
        p_li.appendTo(ele);

        // vẽ last btn
        var l_li = $("<li><a style='cursor:point'></a></li>");
        l_li.find('a').text("»");
        l_li.attr("role-value", data.last - 1);
        l_li.attr("name", "lastBtn");
        l_li.appendTo(ele);
        //
        if (data.last - 1 == data.pageIndex || !flag) {
            l_li.addClass("disabled");
            p_li.addClass("disabled")
        }
        //
        $(ele).find("li").click(function () {
            var index = $(this).attr("role-value") * 1;
            if (a.ngConfig) {
                $parse(a.ngConfig).assign(s, config);
            }
            if (a.ngModel) {
                $parse(a.ngModel).assign(s, index);

            }
            if (!$(this).hasClass("disabled")) {
                if (a.ngChange) {
                    var fn = s.$eval(a.ngChange);
                    if (angular.isFunction(fn)) {
                        fn(index);
                    }
                }
                if (a.onChange) {
                    var fn = s.$eval(a.onChange);
                    if (angular.isFunction(fn)) {
                        fn(index);
                    }
                }
            }
            //if (data.last - 1 == index) {
            //    l_li.addClass("disabled");
            //    p_li.addClass("disabled")
            //}
        });

    }
    return {
        restrict: "CEA",
        template: "<ul class='pagination'></ul>",
        replace: true,
        link: function (s, e, a) {
            
            var _config = {
                numOfPageSelector: 5,
                totalItems: 0,
                pageSize: 50,
                pageIndex:0
            };
            a.$observe("numOfPageSelector", function (v, o) {
                _config.numOfPageSelector = v;
                var data = createPager(_config.numOfPageSelector, _config.totalItems, _config.pageSize, _config.pageIndex, _config);
                if (data)
                    paint(e[0], data, a, $parse, s);
            });
            a.$observe("totalItems", function (v, o) {
                _config.totalItems = v;
                var data = createPager(_config.numOfPageSelector, _config.totalItems, _config.pageSize, _config.pageIndex, _config);
                if (data)
                    paint(e[0], data, a, $parse, s);
            });
            a.$observe("pageSize", function (v, o) {
                _config.pageSize = v;
                var data = createPager(_config.numOfPageSelector, _config.totalItems, _config.pageSize, _config.pageIndex, _config);
                if (data)
                    paint(e[0], data, a, $parse, s);
            });
            a.$observe("pageIndex", function (v, o) {
                _config.pageIndex = v;
                var data = createPager(_config.numOfPageSelector, _config.totalItems, _config.pageSize, _config.pageIndex, _config);
                if (data)
                    paint(e[0], data, a, $parse, s);
            });
            a.$observe("config", function (fv, o) {
                if (angular.isUndefined(fv)) return;
                var v = s.$eval(fv);
                if (angular.isUndefined(v)) {
                    paint(e[0], [], a, $parse, s);
                }
                if (angular.isDefined(v) && (v !== 0)) {
                    var data = createPager(v.numOfPageSelector, v.totalItems, v.pageSize, v.pageIndex);
                    if (data)
                        paint(e[0], data, a, $parse, s,v);
                }
            });
        }

    }
}]);

mdl.directive("cPagerLink", ["$parse", function ($parse) {
    function createPager(numOfShow, totalItems, pageSize, pageIndex) {
        if (totalItems == 0) {
            return {
                totalPages: 0,
                pageIndex: pageIndex,
                pageSize: pageSize,
                totalItems: 0,
                first: 0,
                last: numOfPage,
                numOfGroups: 0,
                numOfShow2: 0,
                groupIndex: 0,
                pagers: []
            };
        }
        var numOfPage = Math.floor(totalItems / pageSize);
        if (pageIndex > numOfPage) {
            pageIndex = numOfPage;
        }
        if ((totalItems % pageSize > 0) && (totalItems > pageSize)) {
            numOfPage++;
        }

        var numOfGroups = Math.floor(numOfPage / numOfShow);
        if (numOfPage % numOfShow > 0) {
            numOfGroups++;
        }
        var groupIndex = Math.floor(pageIndex / numOfShow);
        if ((pageIndex % numOfShow > 0) && (pageIndex > numOfShow)) {
            groupIndex++;
        }

        var numOfShow2 = Math.floor(numOfShow / 2);

        var start = 0;
        var end = start + numOfShow;
        if ((groupIndex > 0)) {
            if (groupIndex < numOfGroups) {
                start = pageIndex - numOfShow2;
                end = start + numOfShow;
            }
            else {
                start = (groupIndex - 1) * numOfShow + 1;
                end = start + numOfShow;
            }
        }
        if (end > numOfPage) {
            var n = end - numOfPage;
            start = start - n;
            end = end - n;
        }

        var ret = {
            totalPages: numOfPage,
            pageIndex: pageIndex,
            pageSize: pageSize,
            totalItems: totalItems,
            first: 0,
            last: numOfPage,
            numOfGroups: numOfGroups,
            numOfShow2: numOfShow2,
            groupIndex: groupIndex,
            pagers: []
        };

        for (var i = start; i < end; i++) {
            ret.pagers.push({
                index: i,
                caption: (i + 1)

            });
        }
        if (pageIndex < numOfPage - 1) {
            ret.next = pageIndex + 1;
        }
        if (pageIndex > 1) {
            ret.previous = pageIndex - 1;
        }
        return ret;
    };
    function paint(ele, data, attr, $parse, s, config) {
        $(ele).empty();
        if (!data) return;
        var idxF = parseInt(data.pageIndex);
        // vẽ li btn first
        var f_li = $("<li><a aria-label='Previous'><span aria-hidden='true'>&laquo;</span></a></li>");
        f_li.find('a').text("«");
        f_li.find('a').attr("href", data.urlConfig + "home/" + data.first);
        f_li.appendTo(ele);
        // vẽ li btn pre
        var pre_li = $("<li><a aria-label='Previous'><span aria-hidden='true'></span></a></li>");
        pre_li.find('a').text("‹");
        pre_li.find('a').attr("href", data.urlConfig + "home/" + (idxF - 1));
        pre_li.appendTo(ele);
        // vẽ li btn
        if (parseInt(data.first) == parseInt(idxF) || (data.first == 0 && data.last == 0)) {
            pre_li.addClass("disabled");
            f_li.addClass("disabled");
            pre_li.find('a').removeAttr("href");
            f_li.find('a').removeAttr("href");
        } else {
            pre_li.removeClass("disabled");
            f_li.removeClass("disabled");
        }

        if (data.last <= data.numberShow) {
            if (data.last <= 0) {
                var li = $("<li class='page-indicator'><a href='#'>1 <span class='sr-only'></span></a></li>");
                li.find('a').text(1);
                li.find('a').attr("href", data.urlConfig + "home/" + 0);
                li.removeClass("active");
                if (idxF === 0) {
                    li.addClass("active");
                }
                li.appendTo(ele);
            } else {
                for (var i = 0; i < data.last; i++) {
                    var li = $("<li class='page-indicator'><a href='#'>1 <span class='sr-only'></span></a></li>");
                    li.find('a').text((i + 1));
                    li.find('a').attr("href", data.urlConfig + "home/" + i);
                    li.removeClass("active");
                    if (i == idxF) {
                        li.addClass("active");
                    } 
                    li.appendTo(ele);
                }
            }
        } else {
            if (idxF > (data.numberShow / 2 + 1)) {
                if (idxF < data.last - 2) {
                    for (var i = (idxF - data.numberShow / 2) < 0 ? 0 : Math.round(idxF - data.numberShow / 2); i < Math.round(idxF + data.numberShow / 2); i++) {
                        var li = $("<li class='page-indicator'><a href='#'>1 <span class='sr-only'></span></a></li>");
                        li.find('a').text((i + 1));
                        li.find('a').attr("href", data.urlConfig + "home/" + i);
                        li.removeClass("active");
                        if (parseInt(data.pageIndex) === i) {
                            li.addClass("active");
                        }
                        li.appendTo(ele);
                    }
                } else {
                    for (var i = data.last - data.numberShow; i < data.last; i++) {
                        var li = $("<li class='page-indicator'><a href='#'>1 <span class='sr-only'></span></a></li>");
                        li.find('a').text((i + 1));
                        li.find('a').attr("href", data.urlConfig + "home/" + i);
                        li.removeClass("active");
                        if (parseInt(data.pageIndex) === i) {
                            li.addClass("active");
                        }
                        li.appendTo(ele);
                    }
                }
            } else {
                for (var i = 0; i < data.numberShow; i++) {
                    var li = $("<li class='page-indicator'><a href='#'>1 <span class='sr-only'></span></a></li>");
                    li.find('a').text((i + 1));
                    li.find('a').attr("href", data.urlConfig + "home/" + i);
                    li.removeClass("active");
                    if (parseInt(data.pageIndex) === i) {
                        li.addClass("active");
                    }
                    li.appendTo(ele);
                }
            }
        }

        // vẽ li btn pre
        var next_li = $("<li><a aria-label='Previous'><span aria-hidden='true'></span></a></li>");
        next_li.find('a').text("›");
        next_li.find('a').attr("href", data.urlConfig + "home/" + (idxF + 1));
        next_li.appendTo(ele);
        // vẽ last btn
        var last_li = $("<li><a aria-label='Previous'><span aria-hidden='true'>&laquo;</span></a></li>");
        last_li.find('a').text("»");
        last_li.find('a').attr("href", data.urlConfig + "home/" + (data.last - 1));
        last_li.appendTo(ele);
        // vẽ li btn
        if ((parseInt(data.last) - 1 == parseInt(idxF)) || data.last == 0) {
            next_li.addClass("disabled");
            last_li.addClass("disabled");
            next_li.find('a').removeAttr("href");
            last_li.find('a').removeAttr("href");
        } else {
            next_li.removeClass("disabled");
            last_li.removeClass("disabled");
        }
    }
    return {
        restrict: "CEA",
        template: "<ul class='pagination'>" + 
        //"<li class='disabled'><a href='#' aria-label='Previous'><span aria-hidden='true'>&laquo;</span></a></li>" + 
        //"<li class='page-indicator' data-page-id='1'><a href='#'>1 <span class='sr-only'></span></a></li>" + 
        //"<li class='disabled'><a href='#' aria-label='Next'><span aria-hidden='true'>&raquo;</span></a></li>" + 
        "</ul>",
        replace: true,
        link: function (s, e, attr) {
            var totalItem = 0;
            var pagerIndex = 0;
            var numberShow = 1;
            var pageSize = 0;
            var urlConfig = "";
            if (attr["totalitem"]) {
                totalItem = parseInt(attr["totalitem"]);
            }
            if (attr["pagerindex"]) {
                pagerIndex = parseInt(attr["pagerindex"]);
            }
            if (attr["numbershow"]) {
                numberShow = parseInt(attr["numbershow"]);
            }
            if (attr["pagesize"]) {
                pageSize = parseInt(attr["pagesize"]);
            }
            if (attr["urlconfig"]) {
                urlConfig = attr["urlconfig"];
            }
            attr.$observe("pagesize", function (v, o) {
                var data = createPager(numberShow, totalItem, pageSize, pageIndex);
                data.urlConfig = urlConfig;
                data.numberShow = numberShow;
                if (data) {
                    paint(e[0], data, attr, $parse, s, v);
                }
            })
            attr.$observe("pagerindex", function (v, o) {
                var data = createPager(numberShow, totalItem, pageSize, pageIndex);
                data.urlConfig = urlConfig;
                data.numberShow = numberShow;
                if (data) {
                    paint(e[0], data, attr, $parse, s, v);
                }
            })
        }
    }
}]);

mdl.directive('cIsNumber', ["$parse", function ($parse) {
    return {
        restrict: "CEA",
        template: '<input type="number" class="form-control" id="numberNumOfStaff"'
                      + 'min= "1" />',
        replace: true,
        link: function (scope, ele, attr) {
            attr.$observe("placeholder", function (v) {
                ele.find("#placeholder").html(v);
            })
            scope.$watch(attr.ngModel, function (newValue, oldValue) {
                if (newValue == undefined) {
                    $(ele[0]).val(oldValue);
                    $parse(attr.ngModel).assign(scope, oldValue);
                }
            });
        }
    };
}]);

mdl.directive('cChooseFile', ["$parse", function ($parse) {
    return {
        restrict: "CEA",
        template: '<div><div class="radio radio-success">'
        + '<input tabindex="7" type="radio" name="resumeApply" id="rad3" value="3" data-type="new_attachment"/>'
        + '<label style="position: absolute;" for="resumeApply">'
        + '<a id="textA" class="relative">'
        + '<span id="title"></span> '
        + '<i class="glyphicon glyphicon-upload" data-toggle="tooltip" title="Replace" data-placement="top"></i>'
        + '</a>'
        + '</label>'
        + '<input for="resumeApply" accept=".doc, .docx, .pdf" style="width: 100%;margin-left: -20px;z-index: 9999;position: absolute;" type="file" name="resumeFile" id="fileAttach" value="Attach new"/></div>'
        + '<span id="resume-filename" class="small"></span></div>'       ,
        replace: true,
        link: function (scope, ele, attr) {

            var dataScope = {};

            ele.bind("click", function () {
                //$(ele.find("input")[0]).removeAttr('checked');
                //$(ele.find("#rad3")).reset();
                if ($(ele.find("#rad3")).attr('checked')) {
                    $(ele.find("#rad3")).prop("checked", true);
                    //$(ele.find("#rad3")).attr("checked", true);
                } else {
                    $(ele.find("#rad3")).attr("checked", true);
                }
                dataScope.picked = 3;
                $parse(attr.ngModel).assign(scope, dataScope);
            })
            attr.$observe("title", function (v) {
                ele.find("#title").html(v);
            })
            ele.bind("change", function (evt) {
                var dataFile = "";
                var file = (evt.srcElement || evt.target).files;
                if (file && file.length > 0) {
                    file = file[0];
                    $("#resume-filename").text(file.name + ' - ' + Math.round(file.size / 1024) + 'KB');
                    if ((file.name.indexOf(".doc") != -1) || (file.name.indexOf(".docx") != -1) || (file.name.indexOf(".pdf") != -1)) {
                        if (file.size <= 2048 * 1024) {
                            var reader = new FileReader();
                            reader.onload = function (loadEvent) {
                                dataFile = loadEvent.target.result;
                                dataScope.dataFile = dataFile;
                                dataScope.fileName = file.name;
                                $parse(attr.ngModel).assign(scope, dataScope);
                            }
                            reader.readAsDataURL(evt.target.files[0]);
                        } else {
                            var apiError = {};
                            apiError.Error = "sizeError";
                            $parse(attr.ngModel).assign(scope, apiError);
                            return
                        }
                    } else {
                        var apiError = {};
                        apiError.Error = "formatError";
                        $parse(attr.ngModel).assign(scope, apiError);
                        return
                    }
                }
            })

            scope.$watch(attr.ngModel, function (newValue, oldValue) {
            });
        }
    };
}]);

mdl.directive('cEnter', ["$parse", function ($parse) {
    return {
        restrict: "CEA",
        replace: true,
        link: function(scope, element, attrs) {
            element.bind("keypress", function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.$eval(attrs.cEnter);
                    });
                    event.preventDefault();
                }
            });
        }
    };
}]);