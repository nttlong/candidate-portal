
var compileSourceCode = (sourceCode, page) => {
    var codeInstance = page || {}
    if (sourceCode instanceof Function) {
        return {
            instance: sourceCode
        };
    }
    if (sourceCode && (sourceCode != null)) {
        try {
            var fn = eval(sourceCode);

            if (fn instanceof Array) {
                var retCompiler = compileCodeWithInjection(fn);
                return retCompiler;
            }
            else {
                try {
                    fn.apply(me, codeInstance);
                    return {
                        instance: codeInstance
                    };
                }
                catch (ex) {
                    return {
                        error: {
                            message: ex.message || ex
                        }
                    };
                }
            }
        }
        catch (ex) {
            return {
                error: {
                    message: ex.message || ex
                }
            };
        }
    }
    else {

        return {
            instance: null
        };
    }
}
var compileCode = (view, page) => {
    if (view.Code instanceof Array) {
        var retCompileSource = compileCodeWithInjection(view.Code, page);
        return retCompileSource
    }
    else {
        var retCompileSource = compileSourceCode(view.Code, page);
        if (retCompileSource.error) {
            retCompileSource.error.source = view.absFilePath;
        }
        return retCompileSource
    }
}
var compileCodeWithInjection = (fn, page) => {
    var codeInstance = {} || page
    var args = [];
    for (var i = 0; i < fn.length - 1; i++) {
        try {
            args.push(require(fn[i]));
        }
        catch (ex) {
            return {
                error: {
                    message: ex.message || ex,
                    module: fn[i]
                }
            };
            break;
        }
    }
    args.push(codeInstance);
    try {
        fn[fn.length - 1].apply(codeInstance, args);
        return {
            instance: codeInstance
        };
    }
    catch (ex) {
        return {
            error: {
                message: ex.message || ex
            }
        };
    }
}
module.exports = {
    compileCode: compileCode,
    compileSourceCode: compileSourceCode,
    compileCodeWithInjection: compileCodeWithInjection
}