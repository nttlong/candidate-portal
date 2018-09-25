const Data = require("./lv.db");
const utils = require("./../libs/lv.utils");
const models = require("./../modules/lv.model");
var get_ls_marriage_status_item_from_code = (db, code, handler) => {
    db.collection("ls_marriage_status")
        .findOne({
            Code: { $regex: new RegExp("^" + code + "$", "i") }
        }, (err, item) => {
            handler(err, item);
        })
}
var get_ls_nations_item_from_code = (db, code, handler) => {
    db.collection("ls_nations")
        .findOne({
            Code: { $regex: new RegExp("^" + code + "$", "i") }
        }, (err, item) => {
            handler(err, item);
        })
}
var getJobFromFullCode = (db, fullJobCode, handler) => {
    var GroupCode = fullJobCode.split("::")[0];
    var JobCode = fullJobCode.split("::")[1];
    db.collection("ls_group_jobs")
        .aggregate([{
            $unwind: "$Jobs"
        }, {

            $match: {
                $and: [
                    {
                        Code: { $regex: new RegExp("^" + GroupCode + "$", "i") },
                        "Jobs.Code": { $regex: new RegExp("^" + JobCode + "$", "i") }
                    }

                ]
            }
        }]).toArray((err, lst) => {
            if (err) handler(err);
            else {
                if (lst.length == 0) handler(undefined, null);
                else {
                    handler(undefined, lst[0]);
                }
            }
        })
}
var getLocationFromFullCode = (db, fullJobCode, handler) => {
    var GroupCode = fullJobCode.split("::")[0];
    var JobCode = fullJobCode.split("::")[1];
    db.collection("ls_locations")
        .aggregate([{
            $unwind: "$Provinces"
        }, {

            $match: {
                $and: [
                    {
                        Code: { $regex: new RegExp("^" + GroupCode + "$", "i") },
                        "Provinces.Code": { $regex: new RegExp("^" + JobCode + "$", "i") }
                    }

                ]
            }
        }]).toArray((err, lst) => {
            if (err) handler(err);
            else {
                if (lst.length == 0) handler(undefined, null);
                else {
                    handler(undefined, lst[0]);
                }
            }
        })
}

/**
 * Hàm lấy thông tin Location của 1 mảng object
 */
var getLocationFullCodeFromArrayObject = (db, fullJobCode, handler) => {
    if (fullJobCode) {
        var arrayFullJobCode = fullJobCode.split(",");
        var qr = models.ls_locations().unwind("Provinces").query();
        arrayFullJobCode.forEach(item => {
            var objMatch = {};
            var GroupCode = item.split("::")[0];
            var JobCode = item.split("::")[1];
            qr = qr.whereOr("(Code==gCode)and(Provinces.Code==jCode)", { gCode: GroupCode, jCode: JobCode });
        })
        qr.toArray()
            .then(result => {
                handler(null, result);
            })
            .catch(ex => {
                handler(ex);
            });
    } else {
        handler(null, []);
    }
}

/**
 * Hàm lấy thông tin Job của 1 mảng object
 */
var getJobFromFullCodeFromArrayObject = (db, fullJobCode, handler) => {
    if (fullJobCode) {
        var arrayFullJobCode = fullJobCode.split(",");
        var qr = models.ls_group_jobs().unwind("Jobs").query();

        arrayFullJobCode.forEach(item => {
            var GroupCode = item.split("::")[0];
            var JobCode = item.split("::")[1];
            qr = qr.whereOr("(Code==jCode)and(Jobs.Code==jCodes)", {
                jCode: GroupCode, jCodes: JobCode
            });
        })
        qr.toArray()
            .then(result => {
                handler(null, result);
            })
            .catch(ex => {
                handler(ex);
            })
    } else {
        handler(null, []);
    }
}

/**
 * Lấy thông tin cá nhân của ứng viên
 * @param {any} Email
 * @param {any} language
 * @param {any} handler
 */
var getPersonalInfo = (Email, language, handler) => {
    var operators = [];
    var matchCandidate = {
        $match: {
            UserEmail: { $regex: new RegExp("^" + Email + "$", "i") }
        }
    };
    var lookup = {
        $lookup: {
            from: "sys_Users",
            localField: "UserEmail",
            foreignField: "Email",
            as: "Users"
        }
    }
    var unwind = {
        $unwind: "$Users"
    }
    var project = {
        $project: {
            FirstName: "$Users.FirstName",
            LastName: "$Users.LastName",
            RecentCompany: 1,
            Photo: 1,
            RecentInfo: 1,
            TotalExpYear: 1,
            TopDegree: 1
        }
    }
    operators.push(matchCandidate);
    operators.push(lookup);
    operators.push(unwind);
    operators.push(project);
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_candidate")
                .aggregate(operators)
                .toArray((err, lst) => {
                    if (err) handler(err);
                    else {
                        if (lst.length == 0) {
                            handler(undefined, null)
                        }
                        else {
                            handler(undefined, lst[0])
                        }
                    }
                })
        }
    })
}
/**
 * Cập nhật thông tin cá nhân của ứng viên
 * @param {any} Email
 * @param {any} language
 * @param {any} data
 * @param {any} handler
 */
var savePersonalInfo = (Email, language, data, handler) => {
    data = utils.trimData(data);
    var check = utils.checkRequireFields([
        "FirstName",
        "LastName"

    ], data);
    if (check.length > 0) {
        handler(undefined, {
            apiError: check[0]
        });
        return;
    }
    var updater = {
        $set: {}
    }
    var JobItem;
    var candidate;
    Data.cnn((err, db) => {
        utils.sequences()
            .then(next => {
                if (data.RecentInfo) {
                    getJobFromFullCode(db, data.RecentInfo.Job.FullCode, (err, item) => {
                        JobItem = item;
                        next(err);
                    });
                } else {
                    next();
                }
            })
            .then(next => {
                db.collection("ls_candidate")
                    .findOne({
                        UserEmail: utils.createEqualRegExp(Email)
                    }, (err, item) => {
                        candidate = item;
                        next(err);
                    })
            })
            .then(next => {
                try {
                    db.collection("sys_Users")
                        .updateOne({
                            Email: utils.createEqualRegExp(Email)
                        }, {
                                $set: {
                                    FirstName: data.FirstName,
                                    LastName: data.LastName
                                }
                            }, (err, result) => {
                                next(err)
                            })
                }
                catch (ex) {
                    next(ex);
                }
            })
            .then(next => {
                if (err) next(err);
                else {
                    var dataItem = {};

                    if (JobItem) {
                        dataItem = {
                            UserEmail: Email,
                            RecentInfo: {
                                Job: {
                                    FullCode: data.RecentInfo.Job.FullCode,
                                    GroupCode: JobItem.Code,
                                    JobCode: JobItem.Jobs.Code,
                                    GroupName: JobItem.Name,
                                    JobName: JobItem.Jobs.Name
                                },
                                CompanyName: data.RecentInfo.CompanyName
                            },
                            TotalExpYear: data.TotalExpYear,
                            TopDegree: data.TopDegree,
                            LatestModifiedOn: data.LatestModifiedOn,
                            LatestModifiedOnUTC: data.LatestModifiedOnUTC
                        }
                    } else {
                        dataItem = {
                            UserEmail: Email,
                            TotalExpYear: data.TotalExpYear,
                            TopDegree: data.TopDegree,
                            LatestModifiedOn: data.LatestModifiedOn,
                            LatestModifiedOnUTC: data.LatestModifiedOnUTC
                        }
                    }

                    if (candidate == null) {
                        db.collection("ls_candidate")
                            .insertOne(dataItem
                                , (err, result) => {
                                    next(err);
                                })
                    }
                    else {
                        db.collection("ls_candidate")
                            .updateOne({
                                UserEmail: utils.createEqualRegExp(Email)
                            },
                                {
                                    $set: dataItem
                                }, (err, result) => {
                                    next(err);
                                })
                    }

                }
            }).done(err => {
                if (err) handler(err);
                else {
                    handler(undefined, {});
                }
            });


    })


}
/**
 * Load over view
 * @param {any} Email
 * @param {any} language
 * @param {any} handler
 */
var loadOverView = (Email, language, handler) => {
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_candidate")
                .aggregate([
                    {
                        $match: {
                            UserEmail: {
                                $regex: new RegExp("^" + Email + "$", "i")
                            }
                        }
                    },
                    {
                        $project: {
                            Overview: 1
                        }
                    }
                ]).toArray((err, lst) => {
                    if (err) handler(err);
                    else {
                        if (lst.length == 0) handler(undefined, null);
                        else {
                            handler(undefined, lst[0])
                        }
                    }
                })
        }
    })
}
var saveOverView = (Email, language, content, handler) => {
    content = utils.trimData(content);
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_candidate")
                .updateOne({
                    UserEmail: {
                        $regex: new RegExp("^" + Email + "$", "i")
                    }
                }, {
                        $set: {
                            Overview: content
                        }
                    }, (err, result) => {
                        handler(err, result);

                    });
        }
    })
}
/**
 * lấy danh sách quá trình đào tạo
 * @param {any} Email
 * @param {any} language
 * @param {any} handler
 */
var getEducation = (Email, language, handler) => {
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_candidate")
                .aggregate([
                    {
                        $match: {
                            UserEmail: {
                                $regex: new RegExp("^" + Email + "$", "i")
                            }
                        }
                    }
                ]).toArray((err, lst) => {
                    if (err) handler(err);
                    else {
                        if (lst.length == 0) handler(undefined, []);
                        else {
                            handler(undefined, lst[0].Degree);
                        }
                    }
                })
        }
    });
}
var saveEducation = (Email, language, items, handler) => {
    items = utils.trimData(items);
    var check = utils.checkRequireFieldsList([
        "Major",
        "SchoolName",
        "MajorLevel"
    ], items);
    if (check.length > 0) {
        handler(undefined, {
            apiError: check[0]
        });
        return;
    }
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_candidate")
                .updateOne({
                    UserEmail: {
                        $regex: new RegExp("^" + Email + "$", "i")
                    }
                }, {
                        $set: {
                            Degree: items,
                            LatestModifiedOn: items.LatestModifiedOn,
                            LatestModifiedOnUTC: items.LatestModifiedOnUTC
                        }
                    }, (err, result) => {
                        handler(err, result);
                    })
        }
    })
}
/**
 * Lấy danh sách chứng chỉ
 * @param {any} Email
 * @param {any} language
 * @param {any} handler
 */
var getCertificate = (Email, language, handler) => {
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_candidate")
                .aggregate([
                    {
                        $match: {
                            UserEmail: {
                                $regex: new RegExp("^" + Email + "$", "i")
                            }
                        }
                    }
                ]).toArray((err, lst) => {
                    if (err) handler(err);
                    else {
                        if (lst.length == 0) handler(undefined, []);
                        else {
                            handler(undefined, lst[0].Cer);
                        }
                    }
                })
        }
    });
}
var saveCertificate = (Email, language, items, handler) => {
    items = utils.trimData(items);
    var check = utils.checkRequireFieldsList([
        "Name",
        "CerIssuedPlace",
        "Level"
    ], items);
    if (check.length > 0) {
        handler(undefined, {
            apiError: check[0]
        });
        return;
    }
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_candidate")
                .updateOne({
                    UserEmail: {
                        $regex: new RegExp("^" + Email + "$", "i")
                    }
                }, {
                        $set: {
                            Cer: items,
                            LatestModifiedOn: items.LatestModifiedOn,
                            LatestModifiedOnUTC: items.LatestModifiedOnUTC
                        }
                    }, (err, result) => {
                        handler(err, result);
                    })
        }
    })
};
var getDesire = (Email, language, handler) => {
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_candidate")
                .findOne({
                    UserEmail: {
                        $regex: new RegExp("^" + Email + "$", "i")
                    }
                }, (err, data) => {
                    if (err) handler(err);
                    if (data == null) {
                        handler(undefined, {
                            DesireLocation: {},
                            DesireMajor: {}
                        }); return
                    }
                    if (data != null) {
                        if (!data.Desire) {
                            data.Desire = {
                                Location: {
                                    Name: {}
                                },
                                Job: {
                                    Name: {}
                                }
                            }

                        }
                        if (!data.Desire.Location) {
                            data.Desire.Location = {
                                Name: {}
                            }
                        }
                        if (!data.Desire.Job) {
                            data.Desire.Job = {
                                Name: {}
                            }
                        }
                        handler(undefined, data.Desire)
                    }
                })
        }
    })
}
var saveDesire = (Email, language, data, handler) => {
    data = utils.trimData(data);
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            getLocationFullCodeFromArrayObject(db, data.dataFullLocCode, (err, location) => {
                if (err) handler(err);
                else {
                    getJobFromFullCodeFromArrayObject(db, data.dataFullJobCode, (err, job) => {
                        if (err) handler(err)
                        else {
                            var arrLoc = [];
                            location.forEach(item => {
                                var obj = {};
                                obj.Code = item.Provinces.Code;
                                obj.LocationCode = item.Code;
                                obj.Name = item.Provinces.Name;
                                obj.LocationName = item.Name;
                                arrLoc.push(obj);
                            })

                            var arrJob = [];
                            job.forEach(item => {
                                var obj = {};
                                obj.Code = item.Jobs.Code;
                                obj.Name = item.Jobs.Name;
                                obj.GroupCode = item.Code;
                                obj.GroupName = item.Name;
                                arrJob.push(obj);
                            })
                            data.Location = arrLoc;
                            data.Job = arrJob;
                            db.collection("ls_candidate")
                                .updateOne({
                                    UserEmail: {
                                        $regex: new RegExp("^" + Email + "$", "i")
                                    }
                                }, {
                                        $set: { Desire: data }
                                    }
                                    , (err, result) => {
                                        handler(err, result);
                                    });
                        }
                    })
                }
            })
        }
    })
}
/**
 * Lấy thông tin liên hệ
 * @param {any} email
 * @param {any} language
 * @param {any} handler
 */
var getContactInfo = (email, language, handler) => {
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_candidate")
                .aggregate([
                    {
                        $match: {
                            UserEmail: {
                                $regex: new RegExp("^" + email + "$", "i")
                            }
                        }
                    }, {
                        $project: {
                            UserEmail: 1,
                            Mobile: 1,
                            BirthDate: 1,
                            Nationality: 1,
                            Sex: 1,
                            MarriageStatus: 1,
                            Location: 1,
                            FullAddress: 1
                        }
                    }
                ])
                .toArray((err, lst) => {
                    if (err) handler(err)
                    else {
                        if (lst.length == 0) {
                            var basicInfo = {
                                UserEmail: email,
                                Nationality: {},
                                MarriageStatus: {},
                                Location: {}
                            };
                            db.collection("ls_candidate").insertOne(basicInfo, (err, result) => { })
                            handler(undefined, basicInfo)
                        }
                        else {
                            if (!lst[0].Nationality) {
                                lst[0].Nationality = {}
                            }
                            if (!lst[0].MarriageStatus) {
                                lst[0].MarriageStatus = {}
                            }
                            if (!lst[0].Location) {
                                lst[0].Location = {}
                            }
                            handler(undefined, lst[0])
                        }
                    }
                })

        }

    })
}
var getUserInfoByUserId = (UserId, handler) => {
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("sys_Users")
                .findOne({ UserId: UserId }, (err, user) => {
                    handler(err, user)
                })
        }
    });
}
var saveContact = (Email, language, data, handler) => {
    var check = utils.checkRequireFields([
        "Mobile",
        "BirthDate",
        "Nationality.Code",
        "Sex",
        "MarriageStatus.Code",
        "Location.FullCode",
        "FullAddress"
    ], data);
    if (check.length > 0) {
        handler(undefined, {
            apiError: check[0]
        });
        return;
    }

    data = utils.trimData(data);
    data = utils.convertDateFields(["BirthDate"], data);
    var marriage_statusItem;
    var nation;
    var location;
    var candidate =
        Data.cnn((err, db) => {

            utils.sequences()
                .then(next => {
                    try {
                        get_ls_marriage_status_item_from_code(db, data.MarriageStatus.Code, (err, item) => {
                            if (err) next(err);
                            else {
                                marriage_statusItem = item;
                                next();
                            }
                        });
                    }
                    catch (ex) {
                        next(ex)
                    }
                })
                .then(next => {
                    try {
                        getLocationFromFullCode(db, data.Location.FullCode, (err, item) => {
                            location = item;
                            next(err);
                        });
                    }
                    catch (ex) {
                        next(ex);
                    }
                })
                .then(next => {
                    try {
                        get_ls_nations_item_from_code(db, data.Nationality.Code, (err, item) => {
                            nation = item;
                            next(err);
                        });
                    }
                    catch (ex) {
                        next(ex);
                    }
                })
                .then(next => {
                    try {
                        db.collection("ls_candidate")
                            .findOne({
                                UserEmail: utils.createEqualRegExp(Email)
                            }, (err, item) => {
                                candidate = item;
                                next(err);
                            })
                    }
                    catch (ex) {
                        next(ex);
                    }
                })
                .then(next => {
                    try {
                        var isNew = true;
                        if (candidate != null) {
                            isNew = false;

                        }
                        data.Location.Code = location.Code;
                        data.Location.Name = location.Name;
                        data.Location.Province = location.Provinces;
                        data.MarriageStatus.Name = marriage_statusItem.Name;
                        data.Nationality = nation;
                        data.UserEmail = Email;
                        if (isNew) {
                            db.collection("ls_candidate")
                                .insertOne(data, (err, result) => {
                                    next(err);
                                });
                        }
                        else {
                            var keys = Object.keys(data);
                            var updater = {
                                $set: {}
                            }
                            keys.forEach(key => {
                                if (key != "_id") {
                                    updater.$set[key] = data[key];
                                }
                            });
                            db.collection("ls_candidate")
                                .updateOne({
                                    UserEmail: {
                                        $regex: utils.createEqualRegExp(Email)
                                    }
                                }, updater, (err, result) => {
                                    next(err);
                                })
                        }
                    }
                    catch (ex) {
                        next(ex);
                    }
                })
                .done((err, result) => {
                    handler(err, result)
                })

        })
};


module.exports = {
    getPersonalInfo: getPersonalInfo,
    savePersonalInfo: savePersonalInfo,
    loadOverView: loadOverView,
    saveOverView: saveOverView,
    getEducation: getEducation,
    saveEducation: saveEducation,
    getCertificate: getCertificate,
    saveCertificate: saveCertificate,
    getDesire: getDesire,
    saveDesire: saveDesire,
    getUserInfoByUserId: getUserInfoByUserId,
    getContactInfo: getContactInfo,
    saveContact: saveContact

}