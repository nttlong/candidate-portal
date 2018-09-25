const hanldeBars = require("handlebars");
//const handleBar=require('handlebars');
const fs = require('fs');
var _onError;
var onError = (handler) => {
    _onError = handler;
}
var get_from_cache = (page) => {
    if (!global.argo) global.argo = {};
    if (!global.argo.cache) global.argo.cache = {};
    if (!global.argo.cache.code) global.argo.cache.code = {};
    var key = page.toLowerCase();
    return global.argo.cache.code[key];

};
var set_to_cache = (page, value) => {
    if (!global.argo) global.argo = {};
    if (!global.argo.cache) global.argo.cache = {};
    if (!global.argo.cache.code) global.argo.cache.code = {};
    var key = page.toLowerCase();
    global.argo.cache.code[key] = value;
    return value;

};
var _getServerScript = (page, content) => {
    if (!page) throw ("invalid page");
    var ret = get_from_cache(page);
    if (ret) return ret;
    var startReg = /\<script\s+server\>/;
    var endReg = '</script>';
    var m = startReg.exec(content);
    if (m) {
        var s1 = content.indexOf('>', m.index) + 1;
        var s2 = content.indexOf(endReg, s1);
        var script = content.substring(s1, s2);
        content = content.substring(0, m.index) +
            content.substring(s2 + endReg.length, content.length);
        ret = set_to_cache(page,
            {
                content: content,
                script: script
            });
        return ret;
    }
    else {
        ret = set_to_cache(page,
            {
                content: content
            });
        return ret;
    }
};
var compile = (page, content, request, response, handler) => {
    if (!page) throw ("invalid page");
    var config = _getServerScript(page, content);
    if (config.script) {
        var fn = Function("var ret= " + config.script + "; return  ret");
        var ins = {
            req: request,
            res: response
        };
        fn()(ins);
        if (ins.load) {
            ins.load((e, r) => {
                if (e) {
                    handler(e);
                    if (_onError) {
                        _onError(e);
                    }
                }
                if (ins.model) {
                    var tmp = hanldeBars.compile(config.content);
                    var ret = tmp(ins.model);

                    handler(undefined, ret);
                }
                else {
                    var tmp = hanldeBars.compile(config.content);
                    var ret = tmp({});

                    handler(undefined, ret);
                }
            });
        }
        else {
            handler(undefined, content);
        }
    }
    else {
        handler(undefined, content);
    }

}

module.exports = {
    compile: compile,
    onError: onError
}