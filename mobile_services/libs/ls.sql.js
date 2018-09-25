

var FS = require("fs");
var MSSQL = require("mssql");
var ___config;
var _onError = (err) => {
    console.log(err);
}
var onError = (callback) => {
    _onError = callback;
}
MSSQL.on("error", err => {
    if (_onError && (typeof _onError === "function")) {
        _onError(err);
    }
});
var handlerResult = (resolve, callback, result) => {
    if (callback) callback(undefined, result);
    else resolve(result);
};
var handlerError = (reject, callback, err) => {
    if (_onError && (typeof _onError === "function")) {
        _onError(err);
    }
    if (callback) callback(err);
    else reject(err);
};
var getConnectionConfig = (callback) => {
    return new Promise((resolve, reject) => {
        if (___config) {
            handlerResult(resolve, callback, ___config);
            return;
        }
        FS.readFile("./app_data/configs/sqlConnection.json", "utf-8", (err, result) => {
            if (err) {
                handlerError(reject, callback, err);
            }
            else {
                var data = Function("return " + result)();
                ___config = data;
                handlerResult(resolve, callback, ___config);
            }
        });
    });
};
var connect = (config, callback) => {
    return new Promise((resolve, reject) => {
        try {
            new MSSQL.ConnectionPool(config).connect()
                .then(cnn => {
                    handlerResult(resolve, callback, cnn);
                })
                .catch(ex => {
                    handlerError(reject, callback, ex);
                });

        }
        catch (ex) {
            handlerError(reject, callback, ex);
        }

    });
};
var command = (commandText) => {
    function ret() {
        var me = this;
        me._commandText = commandText;
        me.command = (cmdText) => {
            me._commandText = cmdText;
            return me;
        };
        me.inputParams = (params) => {
            me._inputParams = params;
            return me;
        };
        me.outputParams = (params) => {
            me._outputParams = params;
            return me;
        };
        me.exec = (callback) => {
            return new Promise((resolve, reject) => {
                getConnectionConfig().then(config => {
                    connect(config).then(cnn => {
                        try {
                            var req = cnn.request();
                            if (me._inputParams) {
                                Object.keys(me._inputParams).forEach(key => {
                                    req.input(key, me._inputParams[key]);
                                });
                            }
                            if (me._outputParams) {
                                Object.keys(me._outputParams).forEach(key => {
                                    req.output(key);
                                });
                            }
                            console.log("txt", me._commandText);
                            req.query(me._commandText)
                                .then(result => {
                                    handlerResult(resolve, callback, result)

                                })
                                .catch(ex => {
                                    handlerError(reject, callback, ex);
                                });
                        }
                        catch (ex) {
                            handlerError(reject, callback, ex);
                        }



                    }).catch(ex => {
                        handlerError(reject, callback, ex);
                    });

                }).catch(ex => {
                    handlerError(reject, callback, ex);
                });

            });
        }

    };
    return new ret();
};
var execSQL = (sql, params, callback) => {
    return new Promise((resolve, reject) => {
        getConnectionConfig()
            .then(config => {
                connect(config)
                    .then(cnn => {
                        var req = cnn.request();
                        if (params) {
                            var keys = Object.keys(params);
                            keys.forEach(key => {
                                req.input(key, params[key]);
                            });
                        }
                        req.query(sql)
                            .then(result => {
                                cnn.close();
                                handlerResult(resolve, callback, result.recordset);
                            })
                            .catch(ex => {
                                cnn.close();
                                handlerError(reject, callback, ex);
                            });
                    })
                    .catch(ex => {
                        cnn.close();
                        handlerError(reject, callback, ex);
                    });
            })
            .catch(ex => {
                handlerError(reject, callback, ex);
            });
    });
};
var query = (sql) => {
    function ret() {
        var me = this;
        me._sql = sql;
        me.connect = (callback) => {
            return new Promise((resolve, reject) => {
                if (me._cnn) {
                    handlerResult(resolve, callback, me._cnn);
                    return;
                }
                getConnectionConfig()
                    .then(config => {
                        connect(config)
                            .then(cnn => {
                                handlerResult(resolve, callback, cnn);
                            })
                            .catch(ex => {
                                handlerError(reject, callback, ex);
                            })

                    })
                    .catch(ex => {
                        handlerError(reject, callback, ex);
                    });
            });
        };
        me.sql = (_sql) => {
            me._sql = _sql;
            return me;
        };
        me.sort = (_sort) => {
            me._sort = _sort;
            return me;
        };
        me.build_sort = () => {

            try {
                if (me._sort) {

                    var keys = Object.keys(me._sort);
                    var _SQL = "select * from (" + me._sql + ") [$sql_sort] order by ";
                    keys.forEach(key => {
                        if (me._sort[key] == 1) {
                            _SQL += "[" + key + "] DESC,"
                        }
                        else {
                            _SQL += "[" + key + "] ASC,"
                        }

                    });
                    _SQL = _SQL.substring(0, _SQL.length - 1);
                    me._sql = _SQL;
                }
                return me;
            }
            catch (ex) {
                handlerError(() => { }, () => { }, ex);
                throw (ex);
            }

        };
        me.build_row_number = () => {
            //ROW_NUMBER() OVER(ORDER BY name ASC) AS RowNumber
            var ret = ""
            if (me._sort) {

                var keys = Object.keys(me._sort);

                keys.forEach(key => {
                    if (me._sort[key] == 1) {
                        ret += "[" + key + "] DESC,"
                    }
                    else {
                        ret += "[" + key + "] ASC,"
                    }

                });
                ret = ret.substring(0, ret.length - 1);
                return "ROW_NUMBER() OVER(ORDER BY  " + ret + ") AS [$row]"
            }
        };
        me.params = (pars) => {
            me._params = pars;
            return me;
        };
        me.buil_sql_row_number = () => {
            var SQL = "select * from (select *," + me.build_row_number() + " from(" + me._sql + ") [$sql1]) [$sql2]";
            SQL = SQL + "Where [$row] between " + (me._skip + 1) + " and " + (me._skip + me._limit);
            me._sql = SQL;

        }
        me.toArray = (callback) => {
            return new Promise((resolve, reject) => {
                try {
                    getConnectionConfig((ex, config) => {
                        if (ex) handlerError(reject, callback, ex);
                        else {
                            connect(config, (ex, cnn) => {
                                if (ex) { cnn.close(); handlerError(reject, callback, ex) }
                                else {
                                    var req = cnn.request();
                                    if (me._sort && (me._skip !== null)) {
                                        me.buil_sql_row_number();
                                    }
                                    else {
                                        me.build_sort();
                                    }
                                    if (me._params) {
                                        var keys = Object.keys(me._params);
                                        keys.forEach(key => {
                                            req.input(key, me._params[key]);
                                        });
                                    }
                                    req.query(me._sql)
                                        .then(result => {
                                            cnn.close();
                                            handlerResult(resolve, callback, result.recordset);
                                        })
                                        .catch(ex => {
                                            cnn.close();
                                            handlerError(reject, callback, ex);
                                        });
                                }
                            });
                        }
                    });


                }
                catch (ex) {
                    handlerError(reject, callback, ex);
                }

            });
        };
        me.skip = (num) => {
            me._skip = num;
            return me;
        };
        me.limit = (num) => {
            me._limit = num;
            return me;
        };
        me.pageSize = (num) => {
            me._pageSize = num;
            return me;
        };
        me.pageIndex = (num) => {
            me._pageIndex = num;
            return me;
        };
        me.count = (callback) => {
            return new Promise((resolve, reject) => {
                try {
                    var sql = "select count(*) [$count] from (" + me._sql + ") [$sqlCount]";
                    try {
                        me.connect()
                            .then(cnn => {
                                try {
                                    var req = cnn.request();
                                    if (me._params) {
                                        Object.keys(me._params)
                                            .forEach(key => {
                                                req.input(key, me._params[key]);
                                            });
                                    }
                                    req.query(sql)
                                        .then(result => {
                                            cnn.close();
                                            if (result.recordset.length === 0) {
                                                handlerResult(resolve, callback, 0);
                                            }
                                            else {

                                                handlerResult(resolve, callback, result.recordset[0].$count);
                                            }


                                        })
                                        .catch(ex => {
                                            cnn.close();
                                            handlerError(reject, callback, ex);
                                        });
                                }
                                catch (ex) {
                                    cnn.close();
                                    handlerError(reject, callback, ex);
                                }
                            })
                            .catch(ex => {
                                handlerError(reject, callback, ex);
                            })
                    }
                    catch (ex) {
                        handlerError(reject, callback, ex);
                    }
                }
                catch (ex) {
                    handlerError(reject, callback, ex);
                }
            });



        };
        me.key = (_key) => {
            var keys = [];
            if (typeof _key === "string") {
                keys = _key.split(",");
            }
            if (_key instanceof Array) {
                keys = _key
            }
            if (typeof _key === "object") {
                _sort = _key;
            }
            var _sort = {};
            keys.forEach(k => {
                _sort[k] = 0;
            });
            me.sort(_sort);
            return me;
        };
        me.toPage = (callback) => {
            return new Promise((resolve, reject) => {
                var ret = {
                    items: null,
                    total: null,
                    error_items: null,
                    error_total: null
                };
                function emit() {
                    if ((ret.error_items || ret.items) && (ret.error_total || ret.total)) {
                        if (ret.error_items) {
                            handlerError(reject, callback, {
                                error_items: ret.error_items,
                                error_total: ret.error_total
                            });
                        }
                        else if (ret.error_total) {
                            handlerError(reject, callback, {
                                error_items: ret.error_items,
                                error_total: ret.error_total
                            });
                        }
                        else {
                            handlerResult(resolve, callback, {
                                items: ret.items,
                                totalItem: ret.total,
                                pageIndex: me._pageIndex,
                                pageSize: me._pageSize
                            });
                        }
                    }

                }
                function runPhase() {
                    try {
                        var qrCount = query();
                        qrCount.sql(me._sql);
                        qrCount.params(me._params);
                        me.skip((me._pageIndex) * me._pageSize)
                            .limit(me._pageSize);
                        me.toArray((ex, items) => {
                            ret.items = items;
                            ret.error_items = ex;
                            emit();
                        });
                        qrCount.count((ex, total) => {
                            ret.total = total;
                            ret.error_total = ex;
                            emit();
                        });
                    }
                    catch (ex) {
                        ret.error_items = ex;
                        ret.error_total = ex;
                    }
                }
                getConnectionConfig()
                    .then(config => {
                        runPhase();
                    })
                    .catch(ex => {
                        ret.error_items = ex;
                        ret.error_total = ex;
                    });
            });
        };
    };
    return new ret();
};
var entity = (name) => {
    function ret() {
        var me = this;
        me.name = name;
        me.toQueryString = () => {
            return "select * from [" + me.name + "]";
        };
        me.columns = (_columns) => {
            me._columns = _columns;
            return me;
        };
        me.column = (name, type, isRequire) => {
            if (!me._columns) {
                me._columns[name] = {
                    type: type,
                    isRequire: isRequire
                }
            }
            return me;
        };
        me._toSQlCreateTable = () => {
            var col = "";
            var keys = Object.keys(me._columns);
            keys.forEach(key => {
                col += "[" + key + "] " + me._columns[key].type;
                if (me._columns[key].isRequire) {
                    col += " not null ";
                }
                if (me._columns[key].isIdentity) {
                    col += " Identity(1,1) ";
                }
                col += ",";
            });
            col = col.substring(0, col.length - 1);
            var sql = `if(object_id('${me.name}') is null) ` +
                "begin " +
                `create table [${me.name}](${col})` +
                "end";
            return sql;
        }
        me.create = (callback) => {
            return new Promise((resolve, reject) => {
                getConnectionConfig()
                    .then(config => {
                        connect(config).then(cnn => {
                            try {
                                var req = cnn.request();
                                req.query(me._toSQlCreateTable())
                                    .then(result => {
                                        handlerResult(resolve, callback, result);
                                    })
                                    .catch(ex => {
                                        handlerError(reject, callback, ex);
                                    });
                            }
                            catch (ex) {
                                handlerError(reject, callback, ex);
                            }
                        })
                            .catch(ex => {
                                handlerError(reject, callback, ex);
                            });
                    })
                    .catch(ex => {
                        handlerError(reject, callback, ex);
                    })
            });

        };
        me.createColumn = (name, dataType, isRequire, defaulValue, callback) => {
            return new Promise((resolve, reject) => {
                /*
                if(not exists(select * from sys.columns where OBJECT_NAME(object_id)='hrm_employees'))
                    begin
                    alter table hrm_employees add test int default 'A'
                    end
                */
                try {
                    me._columns[name] = {
                        type: dataType,
                        isRequire: isRequire,
                        defaulValue: defaulValue
                    };
                    var txt = " " + dataType + " ";
                    if (!isRequire) {
                        txt += " null ";
                    }
                    if (defaulValue) {
                        txt += " default ";
                        if (typeof defaulValue === "number") {
                            txt += defaulValue + " ";
                        }
                        else {
                            txt += "N'" + defaulValue + "' "
                        }
                    }
                    var _cmdText = `if(not exists(select * from sys.columns where (OBJECT_NAME(object_id)='${me.name}')and(name='${name}')))` +
                        "begin " +
                        `alter table [${me.name}] add [${name}] ` +
                        txt +
                        " end";
                    getConnectionConfig().then(config => {
                        connect(config)
                            .then(cnn => {
                                try {
                                    var req = cnn.request();
                                    req.query(_cmdText)
                                        .then(result => {
                                            handlerResult(resolve, callback, result);
                                        })
                                        .catch(ex => {
                                            handlerError(resolve, callback, ex);
                                        });
                                }
                                catch (ex) {
                                    handlerError(reject, callback, ex);
                                }

                            }).catch(ex => {
                                handlerError(reject, callback, ex);
                            })
                    }).catch(ex => {
                        handlerError(reject, callback, ex);
                    })
                }
                catch (ex) {
                    handlerError(reject, callback, ex);
                }
            });
        };
        me.createIndex = (columns, isUnique, callback) => {
            return new Promise((resolve, reject) => {
                try {
                    var txtColumns = "";
                    var isError;
                    var uk_name = "IX_" + me.name + "_";
                    Object.keys(columns).forEach(key => {
                        if (!me._columns[key]) {
                            handlerError(reject, callback, { message: `"${key}" was notf found` });
                            isError = true;
                            return;
                        }
                        else {
                            uk_name += "_" + key;
                            txtColumns += `[${key}],`;
                        }
                    });
                    txtColumns = txtColumns.substring(0, txtColumns.length - 1);
                    if (isError) return;
                    var cmd = `Create ${(isUnique ? 'UNIQUE' : '')} index [${uk_name}] on [${me.name}] (` +
                        `${txtColumns}` +
                        ")WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = ON, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]";
                    var txtCommand = `if(not exists(select * from  sys.indexes where object_name(object_id)='${me.name}' and name='${uk_name}')) begin ${cmd} end`
                    getConnectionConfig()
                        .then(config => {
                            connect(config)
                                .then(cnn => {
                                    var req = cnn.request();
                                    req.query(txtCommand)
                                        .then(result => {
                                            handlerResult(resolve, callback, result);
                                        }).catch(ex => {
                                            handlerError(reject, callback, ex);
                                        });
                                }).catch(ex => {
                                    handlerError(reject, callback, ex);
                                });
                        })
                        .catch(ex => {
                            handlerError(reject, callback, ex);
                        });
                }
                catch (ex) {
                    handlerError(reject, callback, ex);
                }

            });
        };
        me.createKey = (columns, callback) => {
            return new Promise((resolve, reject) => {
                try {
                    var cols = "";
                    var isError;
                    Object.keys(columns).forEach(key => {
                        if (!me._columns[key]) {
                            handlerError(reject, callback, { message: `"${key}" was notf found` });
                            isError = true;
                            return;
                        }
                        else {

                            cols += `[${key}],`;
                        }
                    });
                    if (isError) { return; }
                    var cmd = `alter table [${me.name}] add constraint [PK_${me.name}](${cols})  WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]`;
                    var cmdText = `if(not exists(select * from  sys.indexes where object_name(object_id)='${me.name}' and name='PK_${me.name}')) begin ${cmd} end`;
                    getConnectionConfig().then(config => {
                        connect(config).then(cnn => {
                            var req = cnn.request();
                            req.query(cmdText).then(result => {
                                handlerResult(resolve, callback, result);
                            }).catch(ex => {
                                handlerError(reject, callback, ex);
                            })
                        }).catch(ex => {
                            handlerError(reject, callback, ex);
                        });
                    }).catch(ex => {
                        handlerError(reject, callback, ex);
                    });

                }
                catch (ex) {
                    handlerError(reject, callback, ex);
                }
            });
            /*
            ALTER TABLE dbo.hrm_employees1 ADD CONSTRAINT
	PK_hrm_employees1 PRIMARY KEY CLUSTERED
	(
	ID
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

            */
        }
    }
    return new ret();
};
module.exports = {
    onError: onError,
    getConnectionConfig: getConnectionConfig,
    connect: connect,
    query: query,
    entity: entity,
    command: command
}
var hrm_employee = entity("hrm_employees1");
hrm_employee.columns({
    ID: { isRequire: true, type: 'int' },
    First_Name: { isRequire: true, type: 'nvarchar(50)' },
    Last_Name: { isRequire: true, type: 'nvarchar(50)' },
});
hrm_employee.createIndex({ ID: 0 }, true).then(res => {
    console.log(res);
}).catch(ex => {
    console.log(ex);
});
//hrm_employee.create()
//    .then(result => {
//        hrm_employee.createColumn("EmployeeCode", "nvarchar(50)", true, "EMP0001");
//    })
//    .catch(ex => {
//        console.log(ex);
//    });

//command(hrm_employee._toSQlCreateTable())
//.exec()
//.then(result=>{
//    console.log(result);
//})
//.catch(ex=>{
//    console.log(ex);
//})

//ole.log(hrm_employee._toSQlCreateTable());

