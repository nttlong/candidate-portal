//link http://summernote.org/bower_components/summernote/dist/summernote.js
var libs_directives;
(function (libs_directives) {
    libs_directives._module.directive("bHtmlNote", ["$parse", function ($parse) {
            return {
                restrict: "CEA",
                templateUrl: function () {
                    return libs_directives.get_Template_Path() + "/HtmlNote.html";
                },
                replace: true,
                link: function (scope, ele, attr) {
                    var isInEdit = false;
                    var isInEditor = false;
                    var options = {
                        height: $(ele[0]).height(),
                        resize: true,
                        codemirror: {
                            theme: 'html'
                        },
                        callbacks: {
                            onChange: function (contents, $editable) {
                                if (!isInEdit) {
                                    isInEditor = true;
                                    if (attr["ngModel"]) {
                                        $parse(attr["ngModel"]).assign(scope, contents);
                                    }
                                    if (attr["ngChange"]) {
                                        scope.$eval(attr["ngChange"]);
                                    }
                                    scope.$apply();
                                    isInEditor = false;
                                }
                            }
                        },
                        hint: undefined
                    };
                    var x = $(ele[0])["summernote"](options);
                    scope.$watch(attr["hint"], function (value) {
                        if (angular.isUndefined(value)) {
                            return;
                        }
                        var key = scope.$eval(attr["hintKey"]);
                        var hintMatch = scope.$eval(attr["hintMatch"]);
                        if (angular.isUndefined(key)) {
                            alert("'data-hint-key' was not found");
                            return;
                        }
                        var fn = scope.$eval(attr['hintReturn']);
                        if (angular.isUndefined(fn)) {
                            alert("'data-hint-return' was not found");
                            return;
                        }
                        if (!angular.isFunction(fn)) {
                            alert("'data-hint-return' must be a function");
                            return;
                        }
                        if (angular.isUndefined(hintMatch)) {
                            alert("'data-hint-match' was not found");
                            return;
                        }
                        var list = [];
                        for (var i = 0; i < value.length; i++) {
                            list.push(value[i][key]);
                        }
                        options.hint = {
                            mentions: list,
                            match: RegExp(hintMatch),
                            search: function (keyword, callback) {
                                callback($.grep(this.mentions, function (item) {
                                    return item["indexOf"](keyword) == 0;
                                }));
                            },
                            content: function (item) {
                                return fn(item);
                            }
                        };
                        x["summernote"]("destroy");
                        x["summernote"](options);
                    });
                    var val = scope.$eval(attr["ngModel"]);
                    if (angular.isDefined(val)) {
                        isInEdit = true;
                        x["summernote"]("code", val);
                        isInEdit = false;
                    }
                    else {
                        isInEdit = true;
                        x["summernote"]("code", "");
                        isInEdit = false;
                    }
                    scope.$watch(attr["ngModel"], function (val) {
                        if (isInEditor)
                            return;
                        isInEdit = true;
                        if (angular.isDefined(val)) {
                            x["summernote"]("code", val);
                        }
                        else {
                            x["summernote"]("code", "");
                        }
                        isInEdit = false;
                    });
                }
            };
        }]);
})(libs_directives || (libs_directives = {}));
