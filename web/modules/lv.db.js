var MongoClient = require('mongodb').MongoClient;
var lv_log = require("./../libs/lv.logs");
/**
 * Connect to mongo db
 * @param {any} hanlder (err,db) trong đó db la database instance
 */
var cnn = (hanlder) => {
    if (!global.lv) global.lv = {};
    if (!global.lv.hcs) global.lv.hcs = {};
    if (!global.lv.hcs.db) {
        MongoClient.connect(global.getConfig().connection, function (err, db) {
            if (err) hanlder(err)
            else {
                global.lv.hcs.db = db;
                hanlder(undefined, global.lv.hcs.db)
            }

        });
    }
    else {
        hanlder(undefined, global.lv.hcs.db)
    }
}
/**
 * Connect to database
 */
var getConnect = () => {
    return new Promise(resolve => {
        cnn((err, db) => {
            if (err) throw (err);
            else {
                resolve(db);
            }
        })
    })
}

//var url = "mongodb://localhost:27017/mydb";

//MongoClient.connect(url, function (err, db) {
//    if (err) throw err;
//    console.log("Database created!");
//    db.close();
//});
var execStore = (storeName, Params, handler) => {
    cnn((err, db) => {
        if (err) handler(err)
        else {
            db.eval(storeName+'(' + JSON.stringify(Params) + ')', function (er, doc) {
                if (er) {
                    var error = {
                        StoreName: storeName,
                        Params: Params,
                        Error: er,
                        Command: storeName + '(' + JSON.stringify(Params) + ')'
                    };
                    lv_log.debug(error);
                    handler({
                        StoreName: storeName,
                        Params: Params,
                        Error: er,
                        Command: storeName + '(' + JSON.stringify(Params) + ')'
                    });

                }
                else {
                    if (doc.error) {
                        handler({
                            isCustomError: true,
                            error: doc.error
                        });
                    }
                    else {
                        if (typeof doc.data === 'string' || doc.data instanceof String) {
                            var data = eval("(" + doc.data + ")");
                            handler(undefined, data);
                        }
                        else {
                            if (doc.data) {
                                handler(undefined, doc.data);
                            }
                            else {
                                handler(undefined, doc);
                            }
                        }
                    }
                }
                
            })
        }
    })
}
/**
 * công cụ tạo query
 * @param {any} db
 * @param {any} collectionName
 */
var aggregate = (db,collectionName) => {
    function ret(db, collection) {
        var me = this;

        me.collection = db.collection(collectionName);
        me.operators = [];
        me.match = ( where) => {
            var _match = {
                $match: where
            }
            
            me.operators.push(_match);
            return me;
        };
        me.unwind = (fieldName) => {
            var _unwind = {
                $unwind: "$" + fieldName
            };
            me.operators.push(_unwind);
            return me;
        }
        me.sort = (sorts) => {
            var _sort = {
                $sort: sorts
            };
            me.operators.push(_sort);
            return me;
        }
        me.replaceRoot = (newRoot) => {
            me.operators.push({
                $replaceRoot: {
                    newRoot: "$" + newRoot
                }
            });
            return me;
        }
        me.project = (select) => {
            var project = {
                $project: {}
            }
            select.forEach(key => {
                if (key instanceof Array) {
                    project.$project[key[1]] = "$" + key[0]
                }
                else {
                    if (key.indexOf(":") > -1) {
                        project.$project[key.split(':')[0]] = '$' + key.split(':')[1];
                    }
                    else {
                        project.$project[key] = 1
                    }

                }

            })
            me.operators.push(project);
            return me;
        };
        me.skip = (items) => {
            me.operators.push({
                $skip: items
            });
            return me;
        }
        me.limit = (items) => {
            me.operators.push({
                $limit: items
            });
            return me;
        }
        me.done = () => {
            return new Promise(resolve => {
                me.collection.aggregate(me.operators)
                    .toArray((err, list) => {
                        if (!err) {
                            resolve(list)
                        }
                        else {
                            if (me._error) {
                                me._error(err);
                            }
                        }
                    })
            });
        }
        me.error = (handler => {
            me._error = handler;
            return me;
        })
        
    }

    return new ret(db, collectionName);
}
module.exports = {
    execStore: execStore,
    cnn: cnn,
    aggregate: aggregate,
    getConnect: getConnect
}