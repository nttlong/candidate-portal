var fs = require('fs');

var _onMatchServerApi;
var onMatchServerApi = (handler) => {
    _onMatchServerApi = handler;
}
var _onError;
var onError = (handler) => {
    _onError = handler;
}

var _getListOfApi = (content,viewPath) => {
    var txt = content;
    var reg = /\"server\.api\:\/\/.*\"/;
    var regMatchCallback=/\"server\.page\:\/\/.*\"/;
    var m = reg.exec(txt);
    var ret = [];
    var index = 0;
    while (m != null) {
        var item = {
            start: m.index
        };

        item.end = txt.indexOf('"', item.start + 1) + 1;
        item.content = txt.substring(item.start, item.end);
        var strContent = item.content.split(':\/\/')[1];
        var file = strContent.split('@')[0].replace('"', '');
        var method = strContent.split('@')[1].replace('"', '');
        item.file = file;
        item.method = method;
        item.viewPath = viewPath;
        if (item.end == -1) {
            if (_onError) {
                _onError({
                    error: "Error syntax",
                    content: txt.substring(item.start, txt.length)
                })
            }
            throw ({
                error: "Error syntax",
                content: txt.substring(item.start, txt.length)
            });
        }
        txt = txt.replace(item.content, "");
        m = reg.exec(txt);
        ret.push(item);

    }
    m = regMatchCallback.exec(txt);
    while (m != null) {
        var item = {
            start: m.index
        };

        item.end = txt.indexOf('"', item.start + 1) + 1;
        item.content = txt.substring(item.start, item.end);
        var method = item.content.split(':\/\/')[1];
       
       
        item.viewPath = viewPath;
        item.method = method;
        if (item.end == -1) {
            if (_onError) {
                _onError({
                    error: "Error syntax",
                    content: txt.substring(item.start, txt.length)
                })
            }
            throw ({
                error: "Error syntax",
                content: txt.substring(item.start, txt.length)
            });
        }
        txt = txt.replace(item.content, "");
        m = regMatchCallback.exec(txt);
        ret.push(item);

    }
    return ret;
};

var runner = (page, content, handler) => {
    var next = (index) => {

        if (index < list.length) {
            if (_onMatchServerApi) {
                var sender = {
                    data: list[index],
                    page: page,
                    done: (error, renderContent) => {
                        if (error) {
                            if (_onError) {
                                _onError(error)
                            }
                            handler(error);
                        }
                        else {
                            content = content.replace(list[index].content, renderContent);
                            next(index + 1);
                        }
                    }
                };
                _onMatchServerApi(sender);
            }
            else {
                next(index + 1);
            }
        }
        else {
            handler(undefined, content);
        }
    };
    try {
        var list = _getListOfApi(content,page);
     
    }
    catch (ex) {
        handler(ex);
        if (_onError) {
            _onError(ex)
        }
    }
    next(0);
};

module.exports = {
    onMatchServerApi: onMatchServerApi,
    load: runner,
    onError: onError
};
