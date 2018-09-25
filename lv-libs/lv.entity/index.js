const Mongo = require("mongodb");
const MATHJS = require('mathjs');
const logs = require("lv.logs");
const fs = require("fs");
const PATH = require("path");
var getUTCDate = (date) => {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}
var setConnectionString = (value) => {
    global.entity_connectionstring = value;
}
if (!global.cache) global.cache = {};
if (!global.cache.enitities_query) global.cache.enitities_query = {};
if (!global.cache.enitities_query.functions) global.cache.enitities_query.functions = {};
var registerFunction = (name, config) => {

    global.cache.enitities_query.functions[name.toLowerCase()] = config;
}
var getRegisterFunction = (name) => {
    return global.cache.enitities_query.functions[name.toLowerCase()]
}
var getField = (obj) => {
    if (!obj.object) {
        var ret = obj.name;
        while (ret.indexOf('$') > -1) {
            ret = ret.replace('$', '.');
        }
        return ret;
    }
    var ret = obj.index.dimensions[0].value;
    return getField(obj.object) + "." + ret;
}
var clearTress = (value) => {

    var map = {
        "%C3%A9": "e", "%C3%A8": "e", "%E1%BA%BB": "e", "%E1%BA%BD": "e", "%E1%BA%B9": "e", "%C3%AA": "e", "%E1%BA%BF": "e", "%E1%BB%81": "e", "%E1%BB%83": "e", "%E1%BB%85": "e", "%E1%BB%87": "e",
        "%C3%A1": "a", "%C3%A0": "a", "%E1%BA%A3": "a", "%C3%A3": "a", "%E1%BA%A1": "a", "%C3%A2": "a", "%E1%BA%A5": "a", "%E1%BA%A7": "a", "%E1%BA%A9": "a", "%E1%BA%AB": "a", "%E1%BA%AD": "a", "%C4%83": "a", "%E1%BA%AF": "a", "%E1%BA%B1": "a", "%E1%BA%B3": "a", "%E1%BA%B5": "a", "%E1%BA%B7": "a",
        "%C3%AD": "i", "%C3%AC": "i", "%E1%BB%89": "i", "%C4%A9": "i", "%E1%BB%8B": "i",
        "%C3%B3": "o", "%C3%B2": "o", "%E1%BB%8F": "o", "%C3%B5": "o", "%E1%BB%8D": "o", "%C3%B4": "o", "%E1%BB%91": "o", "%E1%BB%93": "o", "%E1%BB%95": "o", "%E1%BB%97": "o", "%E1%BB%99": "o", "%C6%A1": "o", "%E1%BB%9B": "o", "%E1%BB%9D": "o", "%E1%BB%9F": "o", "%E1%BB%A1": "o", "%E1%BB%A3": "o",
        "%C3%BA": "u", "%C3%B9": "u", "%E1%BB%A7": "u", "%C5%A9": "u", "%E1%BB%A5": "u", "%C6%B0": "u", "%E1%BB%A9": "u", "%E1%BB%AB": "u", "%E1%BB%AD": "u", "%E1%BB%AF": "u", "%E1%BB%B1": "u",
        "%C3%BD": "y", "%E1%BB%B3": "y", "%E1%BB%B7": "y", "%E1%BB%B9": "y", "%E1%BB%B5": "y",
        "%C4%91": "d",
        "a%CC%81": "a", "a%CC%80": "a", "a%CC%89": "a", "a%CC%83": "a", "a%CC%A3": "a", "%C3%A2": "a", "%C3%A2%CC%81": "a", "%C3%A2%CC%80": "a", "%C3%A2%CC%89": "a", "%C3%A2%CC%83": "a", "%C3%A2%CC%A3": "a", "%C4%83": "a", "%C4%83%CC%81": "a", "%C4%83%CC%80": "a", "%C4%83%CC%89": "a", "%C4%83%CC%83": "a", "%C4%83%CC%A3": "a",
        "e%CC%81": "e", "e%CC%80": "e", "e%CC%89": "e", "e%CC%83": "e", "e%CC%A3": "e", "%C3%AA": "e", "%C3%AA%CC%81": "e", "%C3%AA%CC%80": "e", "%C3%AA%CC%89": "e", "%C3%AA%CC%83": "e", "%C3%AA%CC%A3": "e",
        "i%CC%81": "i", "i%CC%80": "i", "i%CC%89": "i", "i%CC%83": "i",
        "o%CC%81": "o", "o%CC%80": "o", "o%CC%89": "o", "o%CC%83": "o", "o%CC%A3": "o", "%C3%B4": "o", "%C3%B4%CC%81": "o", "%C3%B4%CC%80": "o", "%C3%B4%CC%89": "o", "%C3%B4%CC%83": "o", "%C3%B4%CC%A3": "o", "%C6%A1": "o", "%C6%A1%CC%81": "o", "%C6%A1%CC%80": "o", "%C6%A1%CC%89": "o", "%C6%A1%CC%83": "o", "%C6%A1%CC%A3": "o",
        "u%CC%81": "u", "u%CC%80": "u", "u%CC%89": "u", "u%CC%83": "u", "u%CC%A3": "u", "%C6%B0": "u", "%C6%B0%CC%81": "u", "%C6%B0%CC%80": "u", "%C6%B0%CC%89": "u", "%C6%B0%CC%83": "u", "%C6%B0%CC%A3": "u",
        "y%CC%81": "y", "y%CC%80": "y", "y%CC%89": "y", "y%CC%A3": "y",
        "%C4%91": "d"
    };

    if (value == null) return "";
    value = value.toLowerCase();
    var ret = "";
    for (var i = 0; i < value.length; i++) {
        var k = encodeURIComponent(value[i]);
        var v = value[i];
        if (map[k]) {
            v = map[k];
        }
        if ("qwertyuiopasdfghjklzxcvbnm".indexOf(v) !== -1) {
            ret += v;
        }
        else {
            if (v === " ") {
                ret += v;
            }

        }

    }
    while (ret.indexOf("  ") > -1) ret = ret.replace("  ", " ");
    return ret;
}
var getValue = (obj, params, op) => {
    if (obj.name) {
        if ((op === "==") && (typeof params[obj.name] === "string")) {
            return { $regex: new RegExp("^" + params[obj.name] + "$", "i") }
        }
        return params[obj.name]
    }
    if ((op === "==") && (typeof obj.value === "string")) {
        if ((obj.valueType === "string")) {
            return { $regex: new RegExp("^" + obj.value + "$", "i") };
        }
        else {
            if (obj.valueType === "number") {
                return obj.value * 1;
            }
            else
                if (obj.valueType === "boolean") {
                    return obj.value === "true";
                }
                else {
                    return obj.value;
                }
        }
    }
    if (obj.valueType === "number") {
        return obj.value * 1;
    }
    else if (obj.valueType === "boolean") {
        return obj.value === "true";
    }
    else {
        return obj.value
    }

}

registerFunction('contains', {
    resolve: (agrs, params) => {
        var ret = {};
        var field = getField(agrs[0]);
        var value = getValue(agrs[1], params)
        ret[field] = { $regex: new RegExp(value, "i") }
        return ret
    }
});
var createEntity = (name) => {
    logs.info("Create modle", name);
    try {
        if (!global.cache) global.cache = {};
        if (!global.cache.entities) global.cache.entities = {};
        if (!global.cache.entities.models) global.cache.entities.models = {};
        if (!global.cache.entities.models[name]) global.cache.entities.models[name] = {};

        var dir = getSchemaDirPath() + "/" + name;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        if (!global.cache.entities.models[name].fields) {
            var fileNameFields = getSchemaDirPath() + "/" + name + "/fields.json";
            if (!fs.existsSync(fileNameFields)) {
                var data = [];


                var txt = JSON.stringify(data);
                fs.writeFileSync(fileNameFields, txt, "utf-8");
                global.cache.entities.models[name].fields = data;
            }
            else {
                var txt = fs.readFileSync(fileNameFields, "utf-8");
                try {
                    global.cache.entities.models[name].fields = Function("return " + txt)();
                }
                catch (ex) {
                    global.cache.entities.models[name].fields = [];
                }

            }
        }
        if (!global.cache.entities.models[name].validate) {
            var script = "var validate=(db,data,callback)=>{" +
                " return new Promise((resolve, reject) => { " +
                "if(callback) callback(undefined,true);else resolve(true)" +
                "});};" +
                " module.exports = { validate: validate }";
            var fileNameValidate = getSchemaDirPath() + "/" + name + "/validate.js";
            if (!fs.existsSync(fileNameValidate)) {

                fs.writeFileSync(fileNameValidate, script, "utf-8");
            }
            var mDir = getSchemaDirPath() + "/" + name;
            var modulePath = PATH.join(PATH.relative(__dirname, mDir), "validate");
            var m = require(modulePath);
            //else {
            //    script = fs.readFileSync(fileNameValidate, "utf-8");
            //}
            global.cache.entities.models[name].validate = m.validate;
        }
        if (!global.cache.entities.models[name].beforeInsert) {
            var script = "var beforeInsert=(db,data,callback)=>{callback(undefined,data);};module.exports={beforeInsert:beforeInsert}";
            var fileNameBeforeInsert = getSchemaDirPath() + "/" + name + "/beforeInsert.js";
            if (!fs.existsSync(fileNameBeforeInsert)) {

                fs.writeFileSync(fileNameBeforeInsert, script, "utf-8");
            }
            var mDir = getSchemaDirPath() + "/" + name;
            var modulePath = PATH.join(PATH.relative(__dirname, mDir), "beforeInsert");
            var m = require(modulePath);
            global.cache.entities.models[name].beforeInsert = m.beforeInsert;
        }
        if (!global.cache.entities.models[name].beforeUpdate) {
            var script = "var beforeUpdate=(db,data,callback)=>{callback(data)};module.exports={beforeUpdate:beforeUpdate}";
            var fileNameBeforeUpdate = getSchemaDirPath() + "/" + name + "/beforeUpdate.js";
            if (!fs.existsSync(fileNameBeforeUpdate)) {

                fs.writeFileSync(fileNameBeforeUpdate, script, "utf-8");
            }
            var modulePath = PATH.join(PATH.relative(__dirname, mDir), "beforeUpdate");
            var m = require(modulePath);
            global.cache.entities.models[name].beforeUpdate = m.beforeUpdate;

        };
        logs.info("Create modle is succesfull", name);
        return global.cache.entities.models[name];
    }
    catch (ex) {
        logs.info("Create modle is fail", name);
        logs.debug(ex);
    }
};
var createFields = (name, data) => {
    var schema = createEntity(name);
    if (!schema) return;
    var fields = getFieldsOfObject(data);
    var hasChange = false;
    fields.forEach(key => {
        var item = schema.fields.find(f => {
            return f.name === key.name
        })
        if (!item) {
            schema.fields.push(key);
            hasChange = true;
        }
    });
    if (hasChange) {
        var fileName = getSchemaDirPath() + "/" + name + "/fields.json";
        fs.writeFile(fileName, JSON.stringify(schema.fields), "utf-8", err => {
            if (err) logs.debug(err);
        });
    }
};
var createFieldFromValue = (name, field, value) => {
    var data = { x: value };
    var fields = getFieldsOfObject(data);
    if (fields.length == 0) return;
    var schema = createEntity(name);

    var item = schema.fields.find(f => {
        return f.name === field;
    });
    if (!item) {
        schema.fields.push({
            name: field,
            type: fields[0].type
        });
        var fileName = getSchemaDirPath() + "/" + name + "/fields.json";
        fs.writeFile(fileName, JSON.stringify(schema.fields), err => {
            if (err) logs.debug(err);
        });
    }

}
var getOperatorFromExpr = (expr, params) => {
    var map = {
        "=": "$eq",
        "==": "$eq",
        "!=": "$ne",
        ">": "$gt",
        ">=": "$gte",
        "<": "$lt",
        "<=": "$lte"
    };


    if (typeof expr === "string") {

        while (expr.indexOf("'") > -1) expr = expr.replace("'", "\"");
        while (expr.indexOf(".") > -1) expr = expr.replace(".", "$");
        var ret = {};
        var p = MATHJS.parse(expr, {});
        var c = JSON.stringify(p);
        if ((p.op) && map[p.op]) {
            var ret = {};

            var field = getField(p.args[0]);
            var value = getValue(p.args[1], params, p.op);
            ret = {};
            if (p.op === "==") {
                ret[field] = value
            }
            else {
                ret[field] = {};
                ret[field][map[p.op]] = value
            }
            return ret;
        }
        if (p.fn) {

            if (!p.fn.name) {
                ret["$" + p.fn] = [];
                p.args.forEach(arg => {
                    var x = getOperatorFromExpr(arg, params);
                    ret["$" + p.fn].push(x);
                })
                return ret;
            }
            else {
                var customize = getRegisterFunction(p.fn.name);
                if (!customize) {
                    throw ("'" + p.fn.name + "' was not found");
                }
                return customize.resolve(p.args, params);
            }
        }
        else {
            if (p.content) {
                if (p.content.args[0].name) {
                    var isObject = false
                    var field = getField(p.content.args[0]);
                    var value = getValue(p.content.args[1], params, p.content.op);
                    ret = {};
                    if (p.content.op === "==") {
                        ret[field] = value;
                    }
                    else {
                        ret[field] = {};
                        ret[field][map[p.content.op]] = value;
                    }
                    return ret;
                }
                else {
                    var ret = {};
                    ret["$" + p.content.fn] = [];
                    p.content.args.forEach(arg => {
                        var m = getOperatorFromExpr(arg, params);
                        ret["$" + p.content.fn].push(m);
                    });
                    return ret;
                }
            }
        }
    }
    else {
        if (expr.fn) {
            if (!expr.fn.name) {
                ret = {};
                ret["$" + expr.fn] = [];
                expr.args.forEach(arg => {
                    var x = getOperatorFromExpr(arg, params);
                    ret["$" + expr.fn].push(x);
                })
                return ret;
            }
            else {
                var cFn = getRegisterFunction(expr.fn.name);
                if (!cFn) {
                    throw ("'" + expr.fn.name + "' was not found");
                }
                return cFn.resolve(expr.args, params);
            }
        }
        if (expr.content) {

            if (expr.content.op) {
                var ret = {};
                var isObject = false
                if (expr.content.args[0].name) {
                    var field = getField(expr.content.args[0]);
                    var value = getValue(expr.content.args[1], params, expr.content.op);


                    ret[field] = {};
                    if (expr.content.op === "==") {
                        ret[field] = value;
                    }
                    else {
                        ret[field] = {};
                        ret[field][map[expr.content.op]] = value;
                    }

                    return ret;
                }
                else {
                    var ret = {};
                    ret["$" + expr.content.fn] = [];
                    expr.content.args.forEach(arg => {
                        var m = getOperatorFromExpr(arg, params);
                        ret["$" + expr.content.fn].push(m);
                    });
                    return ret;
                }
            }
            if (expr.content.fn) {
                if (!expr.content.fn.name) {
                    ret = {};
                    ret["$" + expr.content.fn] = [];
                    expr.content.args.forEach(arg => {
                        var x = getOperatorFromExpr(arg, params);
                        ret["$" + expr.content.fn].push(x);
                    })
                    return ret;
                }
                else {
                    var cFn = getRegisterFunction(expr.content.fn.name);
                    if (!cFn) {
                        throw ("'" + expr.content.fn.name + "' was not found");
                    }
                    return cFn.resolve(expr.content.args, params);
                }
            }
            else {

                var ret = {};
                var isObject = false
                var field = getField(expr.content.args[0]);
                var value = getValue(expr.content.args[1], params, expr.content.op);


                ret[field] = {};
                if (expr.content.op === "==") {
                    ret[field] = value;
                }
                else {
                    ret[field][map[expr.content.op]] = value;
                }
                return ret;
            }
        }

    }
}
var getConnect = (handler) => {

    if ((global.lv) && global.lv.hcs && global.lv.hcs.db) {
        global.entity_connection = global.lv.hcs.db;
    }

    return new Promise((resolve, reject) => {
        try {
            if (global.entity_connection) {
                if (handler) handler(undefined, global.entity_connection)
                else
                    resolve(global.entity_connection);
            }
            else {
                Mongo.MongoClient.connect(global.entity_connectionstring)
                    .then(db => {
                        global.entity_connection = db
                        if (handler) handler(undefined, global.entity_connection)
                        else {
                            resolve(global.entity_connection);
                            if (_onStart) {
                                _onStart();
                                delete _onStart;
                            }
                        }
                    })
                    .catch(ex => {
                        if (handler) handler(ex)
                        else
                            reject(ex);
                    })
            }
        }
        catch (ex) {
            if (handler) handler(ex);
            else reject(ex);
        }

    });

}
function _entity_avg(owner) {
    var me = this;
    me.owner = owner;
    me.owner._group
    var mkExpr = (expr) => {
        if (typeof expr === "string") {
            if (expr[0] != "$") {
                expr = "$" + expr;
            }
            return expr;
        }
        else {
            if (typeof expr === "number") {
                return expr;
            }
            if (expr instanceof Date) {
                return expr;
            }
            if (typeof expr === "boolean") {
                return expr;
            }
            var ret = {};
            Object.keys(expr)
                .forEach(key => {
                    if (typeof expr[key] === "string") {
                        ret[key] = (expr[key][0] !== "$") ? ("$" + expr[key]) : expr[key]
                    }
                    else {
                        ret[key] = expr[key]
                    }

                })
            return ret;
        }


    }
    me.sum = (field, expr) => {
        me.owner._group[field] = { $sum: mkExpr(expr) };
        return me;
    };
    me.min = (field, expr) => {
        me.owner._group[field] = { $min: mkExpr(expr) };
        return me;
    };
    me.max = (field, expr) => {
        me.owner._group[field] = { $max: mkExpr(expr) };
        return me;
    };
    me.first = (field, expr) => {
        me.owner._group[field] = { $first: mkExpr(expr) };
        return me;
    };
    me.last = (field, expr) => {
        me.owner._group[field] = { $last: mkExpr(expr) };
        return me;
    };
    me.avg = (field, expr) => {
        me.owner._group[field] = { $avg: mkExpr(expr) };
        return me;
    };
    me.addToSet = (field, expr) => {
        me.owner._group[field] = { $addToSet: mkExpr(expr) };
        return me;
    };
    me.push = (field, expr) => {
        me.owner._group[field] = { $push: mkExpr(expr) };
        return me;
    };
    me.query = () => {
        return me.owner.query();
    };
    me.select = (fields) => {
        return me.query().select(fields);
    }
    me.selectIndex = (alias, field, conditional) => {
        return me.query().selectIndex(alias, field, conditional)
    }
    me.where = (field, operator, value) => {
        return me.query().where(field, operator, value)
    }
    me.unwind = (field) => {
        return me.query().unwind(field);
    }
    me.lookup = (alias, expr) => {
        return me.query().lookup(alias, expr);
    }
    me.skip = (num) => {
        return me.query().skip(num);
    }
    me.limit = (num) => {
        return me.query().limit(num);
    };
    me.group = (expr) => {
        return me.query().group(expr);
    };
    me.toArray = (handler) => {
        return me.query().toArray(handler)
    };
    me.toItem = (handler) => {
        return me.query().toItem(handler)
    };
}
function _entity_group(owner) {
    var me = this;
    me.owner = owner;
    me.group = (expr) => {

        if (!me._groups) {
            me._groups = [];
        }
        me._group = { _id: {} }
        if (expr instanceof Array) {
            expr.forEach(item => {
                me._group._id[item[0]] = item[1];
            });

            me._group = ret;
        }
        else {
            if (typeof expr === "string") {
                if (expr[0] != "$") {
                    expr = "$" + expr;
                }
                me._group._id = expr;
            }
            else {
                if (typeof expr == "object") {
                    Object.keys(expr).forEach(key => {
                        if ((typeof expr[key] === "string") && (expr[key][0] !== "$")) {
                            expr[key] = "$" + expr[key];
                        }
                        me._group._id[key] = expr[key];
                    })
                }
                else {
                    me._group._id = expr;
                }
            }

        }
        me._groups.push(me._group);
        return new _entity_avg(me);
    };
    me.query = () => {
        me._groups.forEach(item => {
            me.owner._operators.push({
                $group: item
            });
        })

        return me.owner;
    };
    me.select = (fields) => {
        return me.query().select(fields);
    }
    me.selectIndex = (alias, field, conditional) => {
        return me.query().selectIndex(alias, field, conditional)
    }
    me.where = (field, operator, value) => {
        return me.query().where(field, operator, value)
    }
    me.whereOr = (field, operator, value) => {
        if (value === 0) {
            return me.query().whereOr(field, operator, Number('0'));
        }
        else {
            return me.query().whereOr(field, operator, value);
        }

    }
    me.whereAnd = (field, operator, value) => {
        if (value === 0) {
            return me.query().whereAnd(field, operator, Number('0'));
        }
        else {
            return me.query().whereAnd(field, operator, value);
        }

    }
    me.unwind = (field) => {
        return me.query().unwind(field);
    }
    me.lookup = (alias, expr) => {
        return me.query().lookup(alias, expr);
    };
    me.skip = (num) => {
        return me.query().skip(num);
    }
    me.limit = (num) => {
        return me.query().limit(num);
    };
}
function _entity_setter(owner) {
    var me = this;
    me.owner = owner;
    me.set = (fields, value) => {
        if (!me.owner._setter) me.owner._setter = {};
        if (!me.owner._setter.$set) me.owner._setter.$set = {};
        if (!value) {
            createFields(me.owner.name, fields);
            var keys = Object.keys(fields);
            keys.forEach(key => {
                if ((key != "_id") && (key[0] != "$")) {
                    me.owner._setter.$set[key] = fields[key];
                }
            })
        }
        else {

            if (fields != "_id") {
                me.owner._setter.$set[fields] = value;
                setTimeout(() => { createFieldFromValue(me.owner.name, fields, value); }, 1);

            }
        }

        return me;
    };;
    me.push = (fields, value) => {
        if (!me.owner._setter) me.owner._setter = {};
        if (!me.owner._setter.$push) me.owner._setter.$push = {};
        if (typeof fields === "string") {
            me.owner._setter.$push[fields] = value;
            createFieldFromValue(me.owner.name, fields, []);
        }
        else {
            var keys = Object.keys(fields);
            keys.forEach(key => {
                if (key != "_id") {
                    me.owner._setter.$push[key] = fields[key];
                    createFieldFromValue(me.owner.name, key, []);
                }
            })
        }
        return me;
    }
    me.pull = (fields, value) => {
        if (!me.owner._setter) me.owner._setter = {};
        if (!me.owner._setter.$pull) me.owner._setter.$pull = {};
        if (typeof fields === "string") {
            me.owner._setter.$pull[fields] = value;
            createFieldFromValue(me.owner.name, fields, []);
        }
        else {
            var keys = Object.keys(fields);
            keys.forEach(key => {
                if (key != "_id") {
                    me.owner._setter.$pull[key] = fields[key];
                    createFieldFromValue(me.owner.name, key, []);
                }
            })
        }
        return me;
    }
    me.inc = (fields, value) => {
        if (!me.owner._setter) me.owner._setter = {};
        if (!me.owner._setter.$inc) me.owner._setter.$inc = {};

        if (typeof fields === "string") {
            if (!value) value = 1;
            me.owner._setter.$inc[fields] = value;
            createFieldFromValue(me.owner.name, fields, 1);
        }
        else {
            var keys = Object.keys(fields);
            keys.forEach(key => {
                if (key != "_id") {
                    me.owner._setter.$inc[key] = fields[key];
                    createFieldFromValue(me.owner.name, key, 1);
                }
            })
        }
        return me;
    }
    me.commit = (handler) => {
        return me.owner.commit(handler);
    }
}
function _entity_limit(owner) {
    var me = this;
    me.owner = owner;
    me.limit = (num) => {
        me._num = num;
        return me;
    };
    me.query = () => {
        me.owner._operators.push({
            $limit: me._num
        });
        return me.owner;
    }
    me.toArray = (handler) => {
        return me.query().toArray(handler)
    };
    me.toItem = (handler) => {
        return me.query().toItem(handler)
    };
    me.select = (fields) => {
        return me.query().select(fields);
    };
    me.selectIndex = (alias, field, conditional) => {
        return me.query().selectIndex(alias, field, conditional)
    }
    me.where = (field, operator, value) => {
        if (value === 0) {
            return me.query().where(field, operator, Number('0'));
        }
        else {
            return me.query().where(field, operator, value);
        }

    };
    me.whereOr = (field, operator, value) => {
        if (value === 0) {
            return me.query().whereOr(field, operator, Number('0'));
        }
        else {
            return me.query().whereOr(field, operator, value);
        }

    }
    me.whereAnd = (field, operator, value) => {
        if (value === 0) {
            return me.query().whereAnd(field, operator, Number('0'));
        }
        else {
            return me.query().whereAnd(field, operator, value);
        }

    }
    me.unwind = (field) => {
        return me.query().unwind(field);
    };
    me.lookup = (from, localField, foreignField, as) => {
        return me.query().lookup(from, localField, foreignField, as);
    };
    me.group = (expr) => {
        return me.query().group(expr);
    };
}
function _entity_skip(owner) {
    var me = this;
    me.owner = owner;
    me.skip = (num) => {
        me._num = num;
        return me;
    }
    me.query = () => {
        me.owner._operators.push({
            $skip: me._num
        });
        return me.owner;
    }
    me.toArray = (handler) => {
        return me.query().toArray(handler)
    };
    me.toItem = (handler) => {
        return me.query().toItem(handler)
    }
    me.select = (fields) => {
        return me.query().select(fields);
    }
    me.selectIndex = (alias, field, conditional) => {
        return me.query().selectIndex(alias, field, conditional)
    }
    me.where = (field, operator, value) => {
        if (value === 0) {
            return me.query().where(field, operator, Number('0'));
        }
        else {
            return me.query().where(field, operator, value);
        }

    }
    me.whereOr = (field, operator, value) => {
        if (value === 0) {
            return me.query().whereOr(field, operator, Number('0'));
        }
        else {
            return me.query().whereOr(field, operator, value);
        }

    }
    me.whereAnd = (field, operator, value) => {
        if (value === 0) {
            return me.query().whereAnd(field, operator, Number('0'));
        }
        else {
            return me.query().whereAnd(field, operator, value);
        }

    }
    me.unwind = (field) => {
        return me.query().unwind(field);
    }
    me.lookup = (from, localField, foreignField, as) => {
        return me.query().lookup(from, localField, foreignField, as);
    };
    me.limit = (num) => {
        return me.query().limit(num);
    };
    me.group = (expr) => {
        return me.query().group(expr);
    };
}
function _entity_sort(owner) {
    var me = this;
    me.owner = owner;
    me.sort = (fields, desc) => {
        if (typeof fields === "string") {
            me._sort = {};
            me._sort[fields] = (desc) ? -1 : 1
        }
        else {
            me.sort = fields
        }
        return me;
    }
    me.query = () => {
        me.owner._operators.push({
            $sort: me._sort
        });
        return me.owner;
    }
    me.toArray = (handler) => {
        return me.query().toArray(handler)
    };
    me.toItem = (handler) => {
        return me.query().toItem(handler)
    }
    me.select = (fields) => {
        return me.query().select(fields);
    }
    me.selectIndex = (alias, field, conditional) => {
        return me.query().selectIndex(alias, field, conditional)
    }
    me.where = (field, operator, value) => {
        if (value === 0) {
            return me.query().where(field, operator, Number('0'));
        }
        else {
            return me.query().where(field, operator, value);
        }

    }
    me.whereOr = (field, operator, value) => {
        if (value === 0) {
            return me.query().whereOr(field, operator, Number('0'));
        }
        else {
            return me.query().whereOr(field, operator, value);
        }

    }
    me.whereAnd = (field, operator, value) => {
        if (value === 0) {
            return me.query().whereAnd(field, operator, Number('0'));
        }
        else {
            return me.query().whereAnd(field, operator, value);
        }

    }
    me.unwind = (field) => {
        return me.query().unwind(field);
    }
    me.lookup = (from, localField, foreignField, as) => {
        return me.query().lookup(from, localField, foreignField, as);
    }
    me.skip = (num) => {
        return me.query().skip(num);
    };
    me.limit = (num) => {
        return me.query().limit(num);
    };
    me.count = (toField, handler) => {
        return me.query().count(toField, handler);
    };
    me.group = (expr) => {
        return me.query().group(expr);
    };
}
function _entity_lookup(owner) {
    var me = this;
    me.owner = owner;
    me.query = () => {
        me._lookups.forEach(item => {
            me.owner._operators.push({
                $lookup: item
            });
        })

        return me.owner;
    };
    me.lookup = (_from, _localField, _foreignField, _as) => {
        if (!me._lookups) me._lookups = [];
        if (!_localField) {
            var expr;


            expr = _from;

            var items = expr.split('=');
            var localField = items[0];
            var _items = items[1].split('.');
            var fromCollection = _items[0];
            var foreignField = items[1].substring(_items[0].length + 1, items[1].length);
            var alias = _items[0]

            me._from = fromCollection;
            me._localField = localField;
            me._foreignField = foreignField;
            me._as = alias;
            me._lookups.push({
                from: me._from,
                localField: me._localField,
                foreignField: me._foreignField,
                as: me._as
            })
            return me;
        }
        if (!_foreignField) {
            var expr = _localField;
            var alias = (typeof _from === "string") ? _from : _from.name

            var items = expr.split('=');
            var localField = items[0];
            var _items = items[1].split('.');
            var fromCollection = alias
            var foreignField = items[1];


            me._from = fromCollection;
            me._localField = localField;
            me._foreignField = foreignField;
            me._as = alias;
            me._lookups.push({
                from: me._from,
                localField: me._localField,
                foreignField: me._foreignField,
                as: me._as
            })
            return me;
        }
        if (!_as) {

            me._from = (typeof _from === "string") ? _from : _from.name
            me._localField = localField;
            me._foreignField = foreignField;
            me._as = _from;
            me._lookups.push({
                from: me._from,
                localField: me._localField,
                foreignField: me._foreignField,
                as: me._as
            })
            return me;
        }
        if (_as) {

            me._from = (typeof _from === "string") ? _from : _from.name
            me._localField = _localField;
            me._foreignField = _foreignField;
            me._as = _as;
            me._lookups.push({
                from: me._from,
                localField: me._localField,
                foreignField: me._foreignField,
                as: me._as
            })
            return me;
        }

    };
    me.toArray = (handler) => {
        return me.query().toArray(handler)
    };
    me.toItem = (handler) => {
        return me.query().toItem(handler)
    }
    me.select = (fields) => {
        return me.query().select(fields);
    }
    me.selectIndex = (alias, field, conditional) => {
        return me.query().selectIndex(alias, field, conditional)
    }
    me.where = (field, operator, value) => {
        if (value === 0) {
            return me.query().where(field, operator, Number('0'));
        }
        else {
            return me.query().where(field, operator, value);
        }

    }
    me.whereOr = (field, operator, value) => {
        if (value === 0) {
            return me.query().whereOr(field, operator, Number('0'));
        }
        else {
            return me.query().whereOr(field, operator, value);
        }

    }
    me.whereAnd = (field, operator, value) => {
        if (value === 0) {
            return me.query().whereAnd(field, operator, Number('0'));
        }
        else {
            return me.query().whereAnd(field, operator, value);
        }

    }
    me.unwind = (field) => {
        return me.query().unwind(field);
    }
    me.sort = (fields, desc) => {
        return me.query().sort(fields, desc);
    }
    me.skip = (num) => {
        return me.query().skip(num);
    };
    me.limit = (num) => {
        return me.query().limit(num);
    };
    me.count = (toField, handler) => {
        return me.query().count(toField, handler);
    };
    me.group = (expr) => {
        return me.query().group(expr);
    };
}
function _entity_unwind(owner) {
    var me = this;
    me.owner = owner;
    me._field;
    me.unwind = (field) => {
        if (!me._unwinds) me._unwinds = [];
        if (typeof field === "string") {
            me._field = "$" + field;
        }
        else {
            me._field = "$" + field.name;
        }
        me._unwinds.push(me._field);
        return me;
    }
    me.query = () => {
        me._unwinds.forEach(item => {
            me.owner._operators.push({ $unwind: item });
        })

        return me.owner;
    }
    me.toArray = (handler) => {
        return me.query().toArray(handler)
    };
    me.toItem = (handler) => {
        return me.query().toItem(handler)
    }
    me.select = (fields) => {
        return me.query().select(fields);
    }
    me.selectIndex = (alias, field, conditional) => {
        return me.query().selectIndex(alias, field, conditional)
    }
    me.where = (field, operator, value) => {
        if (value === 0) {
            return me.query().where(field, operator, Number('0'));
        }
        else {
            return me.query().where(field, operator, value);
        }

    }
    me.whereOr = (field, operator, value) => {
        if (value === 0) {
            return me.query().whereOr(field, operator, Number('0'));
        }
        else {
            return me.query().whereOr(field, operator, value);
        }

    }
    me.whereAnd = (field, operator, value) => {
        if (value === 0) {
            return me.query().whereAnd(field, operator, Number('0'));
        }
        else {
            return me.query().whereAnd(field, operator, value);
        }

    }
    me.lookup = (from, localField, foregnField, as) => {
        return me.query().lookup(from, localField, foregnField, as);
    }
    me.sort = (fields, desc) => {
        return me.query().sort(fields, desc);
    }
    me.skip = (num) => {
        return me.query().skip(num);
    };
    me.limit = (num) => {
        return me.query().limit(num);
    };
    me.count = (toField, handler) => {
        return me.query().count(toField, handler);
    };
    me.group = (expr) => {
        return me.query().group(expr);
    };
}
function _entity_select_fields(owner) {
    var me = this;
    me.owner = owner;
    me._project = {};
    me.select = function (fields, expr) {
        if (!expr) {
            if (fields instanceof Array) {
                fields.forEach(field => {
                    if (field.indexOf("=>") == -1) {
                        me._project[field] = 1;
                    }
                    else {
                        me._project[field.split("=>")[1]] = "$" + field.split("=>")[0];
                    }
                });
                return me;
            }
            if (typeof fields === "string") {
                if (!expr) {
                    var alias = fields;
                    while (alias.indexOf(".") > -1) alias = alias.replace(".", "_");
                    me._project[alias] = "$" + fields;
                }
                else {
                    me._project[fields] = 1;
                }

                return me;
            }
            if (typeof fields === "object") {
                Object.keys(fields).forEach(k => {
                    if (typeof fields[k] === "string") {
                        if (fields[k][0] != "$") {
                            me._project[k] = "$" + fields[k]
                        }
                    }
                    else {
                        me._project[k] = fields[k]
                    }
                })
                return me;
            }
        }
        else {

            me._project[fields] = expr;
        }
        return me;
    }
    me.selectArraySize = (aliasName, field) => {
        me._project[aliasName] = {
            $size: "$" + field
        }
        return me;
    };
    me.selectFieldType = (aliasName, field) => {
        me._project[aliasName] = {
            $type: "$" + field
        }
        return me;
    }
    me.selectIndex = (aliasName, field, conditional) => {
        if (typeof field === "string") {
            if (field[0] !== "$") {
                field = "$" + field;
            }
        }
        me._project[aliasName] = {
            $indexOfArray: [field, conditional]
        }
        return me;
    }
    me.query = () => {
        me.owner._operators.push({ $project: me._project });
        me._project = {};
        return me.owner;
    }
    me.toArray = (handler) => {
        return me.query().toArray(handler)
    }
    me.where = (field, operator, value) => {
        if (value === 0) {
            return me.query().where(field, operator, Number('0.0'));
        }
        else {
            return me.query().where(field, operator, value);
        }

    }
    me.whereOr = (field, operator, value) => {
        if (value === 0) {
            return me.query().whereOr(field, operator, Number('0'));
        }
        else {
            return me.query().whereOr(field, operator, value);
        }

    }
    me.whereAnd = (field, operator, value) => {
        if (value === 0) {
            return me.query().whereAnd(field, operator, Number('0'));
        }
        else {
            return me.query().whereAnd(field, operator, value);
        }

    }
    me.unwind = (field) => {
        return me.query().unwind(field);
    }
    me.toItem = (handler) => {
        return me.query().toItem(handler);
    };
    me.lookup = (from, localField, foreignField, as) => {


        return me.query().lookup(from, localField, foreignField, as);
    }
    me.sort = (fields, desc) => {
        return me.query().sort(fields, desc);
    }
    me.skip = (num) => {
        return me.query().skip(num);
    };
    me.limit = (num) => {
        return me.query().limit(num);
    };
    me.group = (expr) => {
        return me.query().group(expr);
    };
}
function _entity_where(owner) {
    var map = {
        "=": "$eq",
        "!=": "$ne",
        ">": "$gt",
        ">=": "$gte",
        "<": "$lt",
        "<=": "$lte"
    }
    var getConditional = (field, operator, value) => {

        if (operator instanceof Array) {

            return;
        }
        if (operator === undefined) {
            return field;
        }
        if (value === undefined) {
            var ret = {

            };
            if (map[operator]) {
                ret[field] = {};
                ret[field][map[operator]] = null
            }
            else {
                if (typeof operator === "string") {
                    ret[field] = { $regex: new RegExp("^" + operator + "$", "i") };
                }
                else {
                    ret[field] = operator;
                }
            }

            return ret;
        }

        else {
            var ret = {};
            ret[field] = {}
            ret[field][map[operator]] = value;
            return ret;
        }
    }
    var me = this;
    me.owner = owner;
    me._match = {};

    me.where = (field, operator, value) => {
        if ((operator === undefined) && (value === undefined)) {
            if (typeof field === "string") {
                me._match = getOperatorFromExpr(field);
                return me;
            }
            else {
                me._match = getConditional(field, operator, value);
                return me;
            }
        }
        if ((typeof operator === "string") ||
            (typeof operator === "number") ||
            (operator instanceof Date) ||
            (typeof operator === "boolean") ||
            (operator._bsontype === "ObjectID")) {
            me._match = getConditional(field, operator, value);
            return me;
        }
        me._match = getOperatorFromExpr(field, operator);
        return me;
    }
    me.whereAnd = (field, operator, value) => {
        var operator;
        if ((operator === undefined) && (value === undefined)) {
            if (typeof field === "string") {
                me._match = getOperatorFromExpr(field);
                return me;
            }
            else {
                me._match = getConditional(field, operator, value);
                return me;
            }


        }
        else {
            if ((typeof operator === "string") ||
                (typeof operator === "number") ||
                (operator instanceof Date) ||
                (typeof operator === "boolean")) {
                operator = getConditional(field, operator, value);

            }
            else {
                operators = getOperatorFromExpr(field, operator);
            }
        }
        me._match = getOperatorFromExpr(field, operator);

        if (me._match.$and) {
            me._match.$and.push(operator);
        }
        else {
            var f = me._match;
            if (Object.keys(me._match).length > 0) {
                me._match = { $and: [f, operators] };
            }
            else {
                me._match = { $and: [operators] };
            }
        }
        return me;
    };
    me.whereOr = (field, operator, value) => {
        var operators;
        if ((operator === undefined) && (value === undefined)) {
            if (typeof field === "string") {
                me._match = getOperatorFromExpr(field);
                return me;
            }
            else {
                me._match = getConditional(field, operator, value);
                return me;
            }


        }
        else {
            if ((typeof operator === "string") ||
                (typeof operator === "number") ||
                (operator instanceof Date) ||
                (typeof operator === "boolean")) {
                operators = getConditional(field, operator, value);

            }
            else {
                operators = getOperatorFromExpr(field, operator);
            }
        }


        if (me._match.$or) {
            me._match.$or.push(operators);
        }
        else {
            var f = me._match;
            if (Object.keys(me._match).length > 0) {
                me._match = { $or: [f, operators] };
            }
            else {
                me._match = { $or: [operators] };
            }

        }
        return me;
    }
    me.query = () => {
        me.owner._operators.push({ $match: me._match });
        return me.owner;
    };
    me.toArray = (handler) => {
        return me.query().toArray(handler);
    }
    me.toItem = (handler) => {
        return me.query().toItem(handler);
    }
    me.select = (fields) => {
        return me.query().select(fields)
    }
    me.selectIndex = (alias, field, conditional) => {
        return me.query().selectIndex(alias, field, conditional)
    }
    me.unwind = (field) => {
        return me.query().unwind(field);
    }


    me.lookup = (fromCollection, localField, foreignField, alias) => {
        return me.query().lookup(fromCollection, localField, foreignField, alias);
    }
    me.sort = (fields, desc) => {
        return me.query().sort(fields, desc);
    }
    me.skip = (num) => {
        return me.query().skip(num);
    };
    me.limit = (num) => {
        return me.query().limit(num);
    };
    me.set = (fields, value) => {
        return me.query().modifier().set(fields, value);
    }
    me.inc = (fields, value) => {
        return me.query().modifier().inc(fields, value);
    }
    me.modifier = () => {
        return me.query().modifier();
    }
    me.push = (fields, value) => {
        return me.modifier().push(fields, value);
    }
    me.pull = (fields, value) => {
        return me.modifier().pull(fields, value);
    }
    me.count = (toField, handler) => {
        return me.query().count(toField, handler);
    };
    me.group = (expr) => {
        return me.query().group(expr);
    };
    me.delete = (fields, value) => {
        return me.query().delete(fields, value);
    }
}
function _entity(name) {
    if (name) {
        createEntity(name);
    }
    var me = this;
    me._operators = [];

    me.name = name;
    me.insert = (data) => {
        if (!me._insertItems) {
            me._insertItems = [data];
        }
        else {
            me._insertItems.push(data);

        }
        return me;
    }

    me.commit = (handler) => {
        var clearTressOfArray = (items, path) => {
            if ((!items) || (items === null) || (items.length === 0)) return "";
            var ret = "";
            items.forEach(item => {
                try {
                    var val = Function("data", "return data." + path)(item);
                    ret += clearTress(val) + ",";
                }
                catch (ex) {

                }
            })
            return ret;

        }
        var createMetaText = (data) => {
            if (!global.cache) global.cache = {};
            if (!global.cache.entities) global.cache.entities = {};
            if (!global.cache.entities.models) global.cache.entities.models = {};
            if (!global.cache.entities.models[name]) global.cache.entities.models[name] = {};
            if (!global.cache.entities.models[name].metaSearch) return;
            var keys = Object.keys(global.cache.entities.models[name].metaSearch);
            var retData = {};
            keys.forEach(key => {

                var subkeys = Object.keys(global.cache.entities.models[name].metaSearch[key]);
                retData[key] = {}
                subkeys.forEach(skey => {
                    var xKey = global.cache.entities.models[name].metaSearch[key][skey];
                    try {
                        if ((skey.indexOf("(") > -1) && (skey.indexOf(")") > -1)) {
                            var fn = eval(skey);
                            var txt = fn(data);
                            retData[key][xKey] = clearTress(txt);
                        }
                        else
                            if (skey.indexOf('$') == -1) {

                                var txt = Function("data", "return data." + skey)(data);
                                retData[key][xKey] = clearTress(txt);
                            }
                            else {
                                var items = skey.split('$');
                                retData[key][xKey] = clearTressOfArray(Function("data", "return data." + items[0])(data), items[1]);
                            }
                    }
                    catch (ex) {
                        //Không có giá trị bỏ qua
                    }


                });
            })



            return retData;

        }
        var handlerError = (db, ex, callback, resolve, reject) => {
            var error = {};
            if (ex.code == 11000) {
                error.isUnique = true;
                error.ex = ex;
                error.source = ex.message.split(':')[1].split(' ')[1];
                error.collection = me.name;
                error.uniqueName = ex.message.split(':')[2].split(' ')[1];
                error.fields = [];
                db.collection(me.name).indexInformation(error.uniqueName, (err, result) => {

                    var info = result[error.uniqueName];
                    info.forEach(item => {
                        error.fields.push(item[0])
                    });
                    if (handler) handler(error);
                    else
                        reject(error);
                });

            }
            else {
                if (handler) handler(ex);
                else
                    reject(ex);
            }
        }
        return new Promise((resolve, reject) => {
            try {
                getConnect()
                    .then(db => {
                        if (me._insertItems) {
                            try {
                                if (me._insertItems.length == 1) {
                                    if (!me._insertItems[0].CreatedOn) {
                                        me._insertItems[0].CreatedOn = new Date()
                                    }
                                    if (!me._insertItems[0].CreatedOnUTC) {
                                        me._insertItems[0].CreatedOnUTC = getUTCDate(new Date());
                                    }
                                    if (!me._insertItems[0].CreatedBy) {
                                        me._insertItems[0].CreatedBy = "application"
                                    }
                                    db.collection(me.name)
                                        .insertOne(me._insertItems[0], (err, result) => {
                                            var ret = {};
                                            if (err) {
                                                handlerError(db, err, handler, resolve, reject);
                                            }
                                            else {
                                                var metaText = createMetaText(me._insertItems[0]);
                                                if (metaText) {
                                                    db.collection(me.name)
                                                        .updateOne({ _id: result.insertedId }, {
                                                            $set: {
                                                                MetaGroupSearch: metaText
                                                            }
                                                        }, (e, r) => {


                                                        });
                                                }

                                                me._insertItems[0]._id = result.insertedId;
                                                var data = me._insertItems[0];
                                                data._id = result.insertedId;
                                                me._insertItems = [];

                                                if (handler) handler(undefined, data);
                                                else
                                                    resolve(ret);
                                            }
                                        });
                                }
                                else {
                                    db.collection(me.name).insertMany(me._insertItems, (err, result) => {
                                        if (err) {
                                            if (handler) handler(err);
                                            else reject(err);
                                        }
                                        else {
                                            me._insertItems = [];
                                            me.insertManyResult = result;

                                            if (handler) handler(undefined, me);
                                            else
                                                resolve(me);
                                        }

                                    });
                                }
                            }
                            catch (ex) {
                                if (handler) handler(ex);
                                else reject(ex);
                            }

                        };
                        if (me._setter) {
                            if ((!me._operators) || (me._operators.length == 0) || (!me._operators[0].$match)) {
                                if (handler) handler({ message: "can not update without conditional" });
                                else reject({ message: "can not update without conditional" });
                                return;
                            }
                            try {
                                if (me._setter.$set) {
                                    if (!me._setter.$set.ModifiedOn) {
                                        me._setter.$set.ModifiedOn = new Date()
                                    }
                                    if (!me._setter.$set.ModifiedOnUTC) {
                                        me._setter.$set.ModifiedOnUTC = getUTCDate(new Date());
                                    }
                                    if (!me._setter.$set.ModifiedBy) {
                                        me._setter.$set.ModifiedBy = "application"
                                    }
                                }

                                db.collection(me.name)
                                    .updateMany(me._operators[0].$match, me._setter, (err, result) => {
                                        if (err) {
                                            handlerError(db, err, handler, resolve, reject);
                                        }
                                        else {
                                            db.collection(me.name).find(me._operators[0].$match)
                                                .toArray((e, lst) => {
                                                    if (lst && (lst.length > 0)) {
                                                        lst.forEach(item => {
                                                            var metaText = createMetaText(item);
                                                            if (metaText) {
                                                                db.collection(me.name)
                                                                    .updateOne({ _id: item._id }, {
                                                                        $set: {
                                                                            MetaGroupSearch: metaText
                                                                        }
                                                                    }, (e, r) => {


                                                                    });
                                                            }
                                                        });

                                                    }
                                                })

                                            me.updateManyResult = result;
                                            me._setter = undefined;
                                            if (handler) handler(undefined, me);
                                            else
                                                resolve(me);
                                        }
                                    });
                            }
                            catch (ex) {
                                if (handler) handler(ex);
                                else reject(ex);
                            }
                        }
                        if (me._deleteItems) {
                            try {
                                db.collection(getTrashCollectionName())
                                    .insertMany({
                                        collectionName: me.name,
                                        data: me._deleteItems,
                                        CreatedOn: new Date()
                                    });
                                var filter = {
                                    $or: []
                                };
                                me._deleteItems.forEach(item => {
                                    if (item._id) {
                                        filter.$or.push({ _id: item._id })
                                    }
                                });
                                db.collectionName(me.name).deleteMany(filter, (err, result) => {
                                    if (err) {
                                        if (handler) handler(err);
                                        else reject(err);
                                    }
                                    else {
                                        if (handler) handler(undefined, result);
                                        else resolve(result);
                                    }
                                });
                            }
                            catch (ex) {
                                if (handler) handler(ex);
                                else reject(ex);
                            }

                        }
                        if (me._will_delete) {
                            try {
                                if ((me._operators.length == 0) || (!me._operators[0].$match)) {
                                    if (handler) handler({ error: "delete must have where" });
                                    else reject({ error: "delete must have where" })
                                }
                                else {
                                    db.collection(me.name)
                                        .aggregate([{ $match: me._operators[0].$match }])
                                        .toArray((err, items) => {
                                            if ((!err) && (items) && (items.length > 0) && (getTrashCollectionName())) {
                                                items.forEach(item => {
                                                    db.collection(getTrashCollectionName())
                                                        .insertOne({
                                                            collectionName: me.name,
                                                            data: item,
                                                            CreatedOn: new Date()
                                                        }, (err, result) => {




                                                        });


                                                });
                                            }
                                            db.collection(me.name)
                                                .deleteMany(me._operators[0].$match, (err, result) => {
                                                    if (err) {
                                                        if (handler) handler(err)
                                                        else reject(err);
                                                    }
                                                    else {
                                                        if (handler) handler(undefined, result)
                                                        else resolve(result);
                                                    }
                                                });
                                        });

                                }
                            }
                            catch (ex) {
                                if (handler) handler(ex);
                                else reject(ex);
                            }


                        }
                    }).catch(ex => {
                        if (handler) handler(ex);
                        else reject(ex)

                    })
            }
            catch (ex) {
                if (handler) handler(ex);
                else reject(ex)
            }

        });

    };

    me.where = (field, operator, value) => {
        me._where = new _entity_where(me);
        me._where.where(field, operator, value);
        return me._where;
    };
    me.whereOr = (field, operator, value) => {
        if (!me._where) {
            me._where = new _entity_where(me);
            me._where.where(field, operator, value);
            return me._where;
        }
        else {
            me._where.whereOr(field, operator, value);
            return me._where;
        }
    };
    me.whereAnd = (field, operator, value) => {
        if (!me._where) {
            me._where = new _entity_where(me);
            me._where.where(field, operator, value);
            return me._where;
        }
        else {
            me._where.whereAnd(field, operator, value);
            return me._where;
        }
    };
    me.select = (fields, expr) => {
        if (!me._selector) {
            me._selector = new _entity_select_fields(me);
        }

        return me._selector.select(fields, expr);
    }
    me.selectIndex = (alias, field, conditional) => {
        if (!me._selector) {
            me._selector = new _entity_select_fields(me);
        }

        return me._selector.selectIndex(alias, field, conditional);
    }
    me.toArray = (handler) => {
        return new Promise((resolve, reject) => {
            try {
                getConnect()
                    .then(db => {
                        try {
                            db.collection(me.name)
                                .aggregate(me._operators)
                                .toArray((err, list) => {
                                    if (err) {
                                        if (handler) handler(err);
                                        else reject(err);
                                    }
                                    else {
                                        if (handler) handler(undefined, list);
                                        else resolve(list);
                                    }

                                });
                        }
                        catch (ex) {
                            if (handler) handler(ex);
                            else
                                reject(ex);
                        }


                    })
                    .catch(ex => {
                        if (handler) handler(ex);
                        else
                            reject(ex);
                    });
            }
            catch (ex) {
                if (handler) handler(ex);
                else reject(ex);
            }

        });

    };
    me.toItem = (handler) => {
        return new Promise((resolve, reject) => {
            try {
                getConnect()
                    .then(db => {

                        db.collection(me.name)
                            .aggregate(me._operators)
                            .toArray((err, list) => {
                                if (err) {
                                    if (handler) handler(err);
                                    else
                                        reject(err);
                                }
                                else {
                                    if (list && (list.length > 0)) {
                                        if (handler) handler(undefined, list[0]);
                                        else
                                            resolve(list[0]);
                                    }
                                    else {
                                        if (handler) handler(undefined, null);
                                        else
                                            resolve(null)
                                    }
                                }

                            });


                    })
                    .catch(ex => {
                        if (handler) handler(ex);
                        else
                            reject(ex);
                    });
            }
            catch (ex) {
                if (handler) handler(ex);
                reject(ex);
            }
        });

    };
    me.unwind = (field) => {
        var ret = new _entity_unwind(me);
        ret.unwind(field);
        return ret;
    }
    me.lookup = (_from, _localField, _foreignField, _as) => {
        var ret = new _entity_lookup(me);
        return ret.lookup(_from, _localField, _foreignField, _as)
    }
    me.sort = (fields, desc) => {
        var ret = new _entity_sort(me);
        return ret.sort(fields, desc)
    }
    me.skip = (num) => {
        return (new _entity_skip(me)).skip(num);
    };
    me.limit = (num) => {
        return (new _entity_limit(me)).limit(num);
    };
    me.modifier = () => {
        me._modifier = (new _entity_setter(me));
        return me._modifier;
    }
    me.set = me.modifier().set;
    me.inc = me.modifier().inc;
    me.push = me.modifier().push;
    me.pull = me.modifier().pull;
    me.getFields = (fields) => {
        if (typeof fields === "string") {
            return me.name + "." + fields;
        }
        if (fields instanceof Array) {
            var ret = [];
            fields.forEach(f => {
                ret.push(me.name + "." + f)
            });
            return ret;
        }
        if (typeof fields === 'object') {
            var ret = [];
            Object.keys(fields).forEach(f => {
                ret.push(me.name + "." + f)
            });
            return ret;
        }

    }
    me.count = (toFieldName, handler) => {
        var count = {

        };
        var twoParams = true;
        if (!handler && !toFieldName) {
            toFieldName = "count_" + me._operators.length
        }
        else {
            if (!handler) {
                handler = toFieldName;
                toFieldName = "countItems";
                twoParams = false;
            }

            if (!handler) {
                handler = toFieldName;
                toFieldName = "count_" + me._operators.length
            }
        }
        count["$count"] = toFieldName;
        me._operators.push(count);
        return new Promise((resolve, reject) => {
            getConnect((err, db) => {
                if (err) {
                    if (handler) handler(err);
                    else reject(err);
                }
                else {
                    db.collection(me.name)
                        .aggregate(me._operators)
                        .toArray((err, list) => {
                            if (err) {
                                if (handler) handler(err);
                                else reject(err);
                            }
                            else {
                                if (list && list.length > 0) {
                                    if (twoParams) {
                                        if (handler) handler(undefined, list[0][count.$count]);
                                        else resolve(list[0][count.$count]);
                                    }
                                    else {
                                        if (handler) handler(undefined, list[0][toFieldName]);
                                        else resolve(list[0][toFieldName]);
                                    }
                                }
                                else {
                                    if (handler) handler(undefined, 0);
                                    else resolve(0);
                                }

                            }
                        });
                }
            })
        })
    }
    me.group = (expr) => {
        return new _entity_group(me).group(expr);
    };
    me.delete = (expr) => {
        me._will_delete = true;
        return me;
    };
    me.restoreById = (_id, handler) => {
        if (typeof _id === "string") {
            _id = _id.toObjectID();
        }
        return new Promise((resolve, reject) => {
            db.collection(getTrashCollectionName())
                .findOne({
                    collectionName: me.name,
                    data: {
                        _id: _id
                    }
                }, (err, result) => {
                    if (err) {
                        if (handler) handler(err);
                        else reject(err);
                    }
                    else {
                        if (handler) handler(undefined, result);
                        else resolve(result);
                    }
                })

        });

    };
    me.createIndex = (config, options, callback) => {
        if (options instanceof Function) {
            callback = options;
            options = undefined;
        }
        var raiseError = (ex, callback, reject) => {
            if (callback) callback(ex);
            else reject(ex);
        }
        return new Promise((resolve, reject) => {
            getConnect()
                .then(db => {
                    db.collection(me.name)
                        .createIndex(config, options, (ex, result) => {
                            if (ex) {
                                raiseError(ex, callback, reject);
                            }
                            else {
                                if (callback) callback(undefined, result);
                                else resolve(result);
                            }
                        })
                })
                .catch(ex => {
                    raiseError(ex, callback, reject);
                })
        });
    };
    me.getIndexes = (callback) => {
        return new Promise((resolve, reject) => {
            getConnect()
                .then(db => {
                    try {
                        db.collection(me.name)
                            .indexInformation((err, result) => {
                                if (callback) callback(undefined, result);
                                else resolve(result);
                            });
                    }
                    catch (ex) {
                        if (callback) callback(ex);
                        else reject(ex);
                    }
                })
                .catch(ex => {
                    if (callback) callback(ex);
                    else reject(ex);
                });
        })
    };
    me.dropIndexes = (name, callback) => {
        return new Promise((resolve, reject) => {
            try {
                getConnect()
                    .then(db => {
                        if (name) {
                            db.collection(me.name).
                                dropIndex(name, (err, result) => {
                                    if (callback) callback(undefined, result);
                                    else resolve(result);
                                });
                        }
                        else {
                            db.collection(me.name).
                                dropIndexes((err, result) => {
                                    if (callback) callback(undefined, result);
                                    else resolve(result);
                                });
                        }
                    })
                    .catch(ex => {
                        if (callback) callback(ex);
                        else reject(ex);
                    });
            }
            catch (ex) {
                if (callback) callback(ex);
                else reject(ex);
            }
        });
    };
    me.createMetaSearch = (key, configs) => {
        if (!global.cache) global.cache = {};
        if (!global.cache.entities) global.cache.entities = {};
        if (!global.cache.entities.models) global.cache.entities.models = {};
        if (!global.cache.entities.models[name]) global.cache.entities.models[name] = {};
        if (!global.cache.entities.models[name].metaSearch) global.cache.entities.models[name].metaSearch = {};
        global.cache.entities.models[name].metaSearch[key] = configs;

    };
    me.clone = () => {
        var ret = new _entity(me.name);
        ret._operators = [];
        me._operators.forEach(item => {
            ret._operators.push(item);
        });
        return ret;
    }

}
var entity = (name) => {
    return new _entity(name);
}
var listAllCollections = (handler) => {

    return new Promise((resolve, reject) => {
        getConnect((err, db) => {
            if (err) {
                if (handler) handler(err);
                else {
                    reject(err);
                }
            }
            else {
                db.listCollections().toArray(function (err, collInfos) {
                    if (err) {
                        if (handler) handler(err);
                        else
                            reject(err);
                    }
                    else {
                        if (handler) handler(undefined, collInfos);
                        else resolve(collInfos);
                    }

                });
            }

        })


    });

}
var setConnection = (cnn) => {
    global.entity_connection = cnn;
}
var getTrashCollectionName = () => {
    return global.____entity_trash_collection_name
}
var setTrashCollectionName = (value) => {
    global.____entity_trash_collection_name = value;
}

String.prototype.toObjectID = function () {
    try {
        return Mongo.ObjectID(this.toString());
    }
    catch (ex) {
        throw (ex);
    }

};
String.prototype.toDate = function () {
    try {
        return new Date(this);
    }
    catch (ex) {
        return null;
    }
};

Date.prototype.toUTC = function () {
    var me = this;
    return new Date(
        me.getUTCFullYear(),
        me.getUTCMonth(),
        me.getUTCDate(),
        me.getUTCHours(),
        me.getUTCMinutes(),
        me.getUTCSeconds());
}
if (!global.cache) global.cache = {};
if (!global.cache.entities) global.cache.entities = {};
global.cache.entities.schemaDirPath = "./app_data/entities/models";
global.cache.entities.isOptimitic = false;
global.cache.entities.models = {};
/**
 * Set path to directory of model schema
 * @param {any} value
 */
var setSchemaDirPath = (value) => {
    if (!global.cache) global.cache = {};
    if (!global.cache.entities) global.cache.entities = {};
    global.cache.entities.schemaDirPath = value;

};
var getSchemaDirPath = () => {
    if (!global.cache) return null;
    if (!global.cache.entities) return null;
    return global.cache.entities.schemaDirPath;

};
var getFieldsOfObject = (obj, parent) => {
    if (obj == null) {
        if (parent) return [{ name: parent, type: "object" }];
        else return [];
    }
    var ret = [];
    Object.keys(obj).forEach(key => {
        var val = obj[key];
        var field = (parent) ? parent + "." + key : key
        var type_of = typeof val;
        if (type_of === "number") {
            ret.push({
                name: field,
                type: "number"
            });
        } else
            if (type_of === "string") {
                ret.push({
                    name: field,
                    type: "text"
                });
            } else
                if (type_of === "boolean") {
                    ret.push({
                        name: field,
                        type: "boolean"
                    });
                } else
                    if (val instanceof Date) {
                        ret.push({
                            name: field,
                            type: "date"
                        });
                    }
                    else
                        if (val && val._bsontype && (val._bsontype === "ObjectID")) {
                            ret.push({
                                name: field,
                                type: "ObjectID"
                            });
                        }
                        else
                            if (val instanceof Array) {
                                ret.push({
                                    name: field,
                                    type: "array"
                                });
                                if (val.length > 0) {
                                    var fields = getFieldsOfObject(val[0], field);
                                    fields.forEach(f => {
                                        ret.push(f);
                                    })
                                }
                            }
                            else {
                                ret.push({
                                    name: field,
                                    type: "object"
                                });
                                var fields = getFieldsOfObject(val, field);
                                fields.forEach(f => {
                                    ret.push(f);
                                })
                            }
    });
    return ret;
}
/**
 * get schema of object
 * @param {any} obj
 */
var getSchemOf = (obj) => {
    return getFieldsOfObject(obj);
}
var _onStart;
var onStart = (callback) => {
    _onStart = callback;
}
module.exports = {
    setConnectionString: setConnectionString,
    getConnect: getConnect,
    entity: entity,
    listAllCollections: listAllCollections,
    setConnection: setConnection,
    getTrashCollectionName: getTrashCollectionName,
    setTrashCollectionName: setTrashCollectionName,
    trash: entity(getTrashCollectionName()),
    setSchemaDirPath: setSchemaDirPath,
    getSchemaDirPath: getSchemaDirPath,
    getSchemOf: getSchemOf,
    onStart: onStart
}
