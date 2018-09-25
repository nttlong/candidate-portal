const Data = require("./../modules/lv.db");
const utils = require("./../libs/lv.utils");
const auth = require("./../libs/lv.authenticate");
/**
 * Lấy danh sách các location
 * @param {any} language ex:vn,en,..
 * @param {any} handler (err,list) với list={[{id:..,text:..,children:[{id:..,text:..}]]}
 */
var getListOfLocations = (language, handler) => {
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_locations")
                .find({})
                .toArray((err, list) => {
                    if (err) handler(err);
                    else {
                        var ret = [];
                        list.forEach(item => {
                            var oItem = {
                                id: item.Code,
                                children: []
                            };
                            oItem.text = item["Name"][language];
                            if (item.Provinces) {
                                item.Provinces.forEach(cItem => {
                                    oItem.children.push({
                                        id: item.Code + "::" + cItem.Code,
                                        text: cItem.Name[language]
                                    })
                                })
                            }
                            ret.push(oItem);
                        });
                        handler(undefined, ret);
                    }

                })
        }
    })
}
/**
 * Lấy danh sách công việc
 * @param {any} language
 * @param {any} handler (err,list) với list={[{id:..,text:..,children:[{id:..,text:..}]]}
 */
var getListOfJobs = (language, handler) => {
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_group_jobs")
                .find({})
                .toArray((err, list) => {
                    if (err) handler(err);
                    else {
                        var ret = [];
                        list.forEach(item => {
                            var oItem = {
                                id: item.Code,
                                children: []
                            };
                            oItem.text = item["Name"][language];
                            if (item.Jobs) {
                                item.Jobs.forEach(cItem => {
                                    oItem.children.push({
                                        id: item.Code + "::" + cItem.Code,
                                        text: cItem.Name[language]
                                    })
                                })
                            }
                            ret.push(oItem);
                        });
                        handler(undefined, ret);
                    }

                })
        }
    })
}
/**
 * Lấy danh sách kinh nghiệm
 * @param {any} language
 * @param {any} handler
 */
var get_ls_experience_levels = (language, handler) => {
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_experience_levels")
                .find({})
                .toArray((err, list) => {
                    if (err) handler(err);
                    else {
                        var ret = [];
                        list.forEach(item => {
                            var oItem = {
                                id: item.Code
                            };
                            oItem.text = item["Name"][language];

                            ret.push(oItem);
                        });
                        handler(undefined, ret);
                    }

                })
        }
    })
}
/**
 * Lấy danh sách các nhà tuyển dụng
 * @param {any} language
 * @param {any} hanlder
 */
var get_ls_recruiters = (language, handler) => {
    Data.cnn((err, db) => {
        if (err) hanlder(err);
        else {
            db.collection("ls_recruiters").aggregate([
                {
                    $project: {
                        RecruiterCode: 1,
                        RecruiterName: 1
                    }
                }
            ]).toArray((err, list) => {
                if (err) handler(err);
                else {
                    var ret = [];
                    list.forEach(item => {
                        var oItem = {
                            id: item.RecruiterCode,
                            children: []
                        };
                        oItem.text = item.RecruiterName;

                        ret.push(oItem);
                    });
                    handler(undefined, ret);
                }
            })
        }
    })
}
var get_ls_nations = (language, handler) => {
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_nations")
                .find({})
                .toArray((err, list) => {
                    if (err) handler(err);
                    else {
                        var ret = [];
                        list.forEach(item => {
                            var oItem = {
                                id: item.Code
                            };
                            oItem.text = item["Name"][language];

                            ret.push(oItem);
                        });
                        handler(undefined, ret);
                    }

                })
        }
    })
}
var get_ls_marriage_status = (language, handler) => {
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_marriage_status")
                .find({})
                .toArray((err, list) => {
                    if (err) handler(err);
                    else {
                        var ret = [];
                        list.forEach(item => {
                            var oItem = {
                                id: item.Code
                            };
                            oItem.text = item["Name"][language];

                            ret.push(oItem);
                        });
                        handler(undefined, ret);
                    }

                })
        }
    })
}
var load_ls_marriage_status = (event) => {
    utils._try(() => {
        var user = auth.getUser(event.req);
        var lang = utils.getCurrentLanguageCode(event);
        get_ls_marriage_status(lang, (err, list) => {
            if (err) event.done(err);
            else {
                utils.writeData(event, list);
                event.done();
            }
        })

    }, event);
}
var load_ListOfLocations = (event) => {
    utils._try(() => {
        var user = auth.getUser(event.req);
        var lang = utils.getCurrentLanguageCode(event);
        getListOfLocations(lang, (err, list) => {
            if (err) event.done(err);
            else {
                utils.writeData(event, list);
                event.done();
            }
        })

    }, event);
}
var load_ls_nations = (event) => {
    utils._try(() => {
        var user = auth.getUser(event.req);
        var lang = utils.getCurrentLanguageCode(event);
        get_ls_nations(lang, (err, list) => {
            if (err) event.done(err);
            else {
                utils.writeData(event, list);
                event.done();
            }
        })

    }, event);
}
var loadSearchDataForSearchBox = (event) => {
    utils._try(() => {
        var language = utils.getCurrentLanguageCode(event);
        var listOfLocation;
        var listOfJobs;
        var listOfExperienceLevel;
        var listOfRecruiters;
        utils.paralellCaller()
            .call(emit => {
                getListOfLocations(language, (err, list) => {
                    listOfLocation = list;
                    emit(err);
                })
            })
            .call(emit => {
                getListOfJobs(language, (err, list) => {
                    listOfJobs = list;
                    emit(err);
                })
            })
            .call(emit => {
                get_ls_experience_levels(utils.getCurrentLanguageCode(event), (err, list) => {
                    listOfExperienceLevel = list;
                    emit(err);

                });
            })
            .call(emit => {
                get_ls_recruiters(utils.getCurrentLanguageCode(event), (err, list) => {
                    listOfRecruiters = list;
                    emit(err);
                })
            })
            .done((err) => {
                if (err) event.done(err);
                else {
                   
                    event.req.routeInfo.params.jobGroup = event.req.routeInfo.params["job-group"]
                    event.req.routeInfo.params.content = (event.req.routeInfo.params.content == "all") ? "" : event.req.routeInfo.params.content;
                  
                    event.req.categories = {
                        listOfLocations: listOfLocation,
                        listOfJobs: listOfJobs,
                        listOfExperienceLevels: listOfExperienceLevel,
                        listOfRecruiters: listOfRecruiters,
                        values: ((event.req.routeInfo) && (event.req.routeInfo.params)) ? event.req.routeInfo.params : {}
                    }
                    event.setModel("categories", event.req.categories);
                    event.done();
                }
            })
    }, event);
}
module.exports = {
    getListOfLocations: getListOfLocations,
    getListOfJobs: getListOfJobs,
    get_ls_experience_levels: get_ls_experience_levels,
    get_ls_recruiters: get_ls_recruiters,
    get_ls_nations: get_ls_nations,
    get_ls_marriage_status: get_ls_marriage_status,
    load_ls_marriage_status: load_ls_marriage_status,
    load_ListOfLocations: load_ListOfLocations,
    load_ls_nations: load_ls_nations,
    loadSearchDataForSearchBox: loadSearchDataForSearchBox

}