const Data = require("./lv.db");
const utils = require("./../libs/lv.utils")
const mongo = require("mongodb");
const asyncLock = require("async-lock");
const GUID = require("guid");
const EmailSender = require("./node.Email");
const account = require("./node.sys.account");

/**
 * Lấy danh sách khách hàng
 * @param {any} filter bộ lọc {contentSearch,sorts,pageSize,pageIndex}
 * @param {any} handler
 */
var getListOfCustomers = (filter, handler) => {
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            var operators = [];
            operators.push({
                $project: {
                    RecruiterCode: 1,
                    RecruiterName: 1,
                    RecruiterType: 1,
                    CandidateSite: 1,
                    Description: 1,
                    Address: 1,
                    CreatedOn: 1,
                    CreatedBy: 1,
                    ModifiedOn: 1,
                    ModifiedBy: 1,
                    Logo: 1,
                    UserEmail:1
                }
            })
            if (filter.contentSearch) {
                var where = {
                    $match: {
                        $or: []
                    }
                }
                where.$match.$or.push({
                    RecruiterCode: { $regex: new RegExp(filter.contentSearch, "i") }
                });
                where.$match.$or.push({
                    RecruiterName: { $regex: new RegExp(filter.contentSearch, "i") }
                });
                where.$match.$or.push({
                    CandidateSite: { $regex: new RegExp(filter.contentSearch, "i") }
                });
                where.$match.$or.push({
                    Description: { $regex: new RegExp(filter.contentSearch, "i") }
                });
                where.$match.$or.push({
                    Address: { $regex: new RegExp(filter.contentSearch, "i") }
                });
                where.$match.$or.push({
                    CreatedBy: { $regex: new RegExp(filter.contentSearch, "i") }
                });
                where.$match.$or.push({
                    ModifiedBy: { $regex: new RegExp(filter.contentSearch, "i") }
                });
                operators.push(where);
            }
            operators.push({
                $sort: { RecruiterCode: 1 }
            })
            db.collection("ls_recruiters")
                .aggregate(operators).toArray((err, res) => {
                    if (err) handler(err)
                    else {

                        handler(undefined, res);
                    }
                });
        }
    });
};
/**
 * Lấy thong tin customer the id
 * @param {any} id
 * @param {any} handler
 */
var getCustomerById = (id, handler) => {

    Data.cnn((err, db) => {
        var coll = db.collection("ls_recruiters");
        coll.aggregate([{ $match: { _id: id } }, {

            $project: {
                Requisition: 0
            }
        }]).toArray((err, data) => {
            if (err || (data.length == 0)) {
                coll.aggregate([{
                    $match: {
                        _id:
                        mongo.ObjectID(id)
                    }
                }, {
                    $project: {
                        Requisition: 0
                    }
                }]).toArray((err, data) => {
                    if (err) {
                        handler(err);
                    }
                    else {
                        if (data.length > 0) {
                            handler(undefined, data[0]);
                        }
                        else {
                            handler(undefined, {});
                        }

                    }
                });
            }
            else {
                if (data.length > 0) {
                    handler(undefined, data[0]);
                }
                else {
                    handler(undefined, {});
                }

            }
        })



    });
}
/**
 * Cap nhat thong tin khach hang
 * @param {any} id
 * @param {any} data
 * @param {any} handler
 */
var saveCustomerInfo = (id, ModifiedBy, data, handler) => {

    data.ModifiedBy = ModifiedBy;
    data.ModifiedOn = new Date();
    data.ModifiedOnUTC = utils.getUTCDate(new Date());
    data = utils.trimData(data);
    var check = utils.checkRequireFields([
        "RecruiterCode",
        "RecruiterName",
        "CandidateSite",
        "ShortName"

    ], data);
    if (check.length > 0) {
        handler(undefined, {
            api_Error: {
                errorType: check[0] + "IsEmpty",
                description: "Please enter '" + check[0] + "'"
            }
        });
        return;
    }
    Data.cnn((err, db) => {
        var keys = Object.keys(data);
        var updater = {
            $set: {}
        };
        for (var i = 0; i < keys.length; i++) {
            if ((keys[i] != "_id") && (keys[i] != "id")) {
                updater.$set[keys[i]] = data[keys[i]];
            }

        }
        var where = {}
        try {
            where["_id"] = mongo.ObjectID(id);
        }
        catch (ex) {
            where["_id"] = id;
        }
        db.collection("ls_recruiters")
            .updateOne(where, updater, (err) => {
                if (err) {
                    handler(err)
                }
                handler(undefined, {});
            });
    });
}
var createCustomer = (CreatedBy, data, handler) => {
    var error = {
        errorType: "",
        field: "",
        description: ""
    }
    data = utils.trimData(data);
    data.CreatedBy = CreatedBy;
    data.CreatedOn = new Date();
    data.CreatedUTC = utils.getUTCDate(new Date());
    data = utils.trimData(data);
    var check = utils.checkRequireFields([
        "RecruiterCode",
        "RecruiterName",
        "CandidateSite",
        "ShortName"

    ], data);
    if (check.length > 0) {
        handler(undefined, {
            api_Error: {
                errorType: check[0] + "IsEmpty",
                description: "Please enter '" + check[0] + "'"
            }
        });
        return;
    }
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_recruiters").findOne({
                RecruiterCode: new RegExp("^" + data.RecruiterCode + "$", "i")
            }, (err, ret) => {
                if (err) handler(err);
                else {
                    if (ret != null) {
                        handler(undefined, {
                            api_Error: {
                                errorType: "RecruiterCodeIsExisting",
                                description: "The customer is existing"
                            }
                        })
                    }
                    else {
                        db.collection("ls_recruiters").insertOne(data, (err) => {
                            if (err) {
                                handler(err);
                            }
                            else {
                                handler({});
                            }
                        });
                    }
                }
            })
        }
    });
};
var getCustomerByUserEmail = (Email, handler) => {
    Data.cnn((err, db) => {
        db.collection("ls_recruiters")
            .findOne({ UserEmail: { $regex: new RegExp("^" + Email + "$", "i") } });
    })
}
/**
 * lấy requisition by RequisitionID
 * @param {any} id
 * @param {any} handler
 */
var getRequisitionById = (UserEmail, id, handler) => {

    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_recruiters")
                .aggregate([
                    {
                        $match: {
                            UserEmail: {
                                $regex: new RegExp("^" + UserEmail + "$", "i")
                            }
                        }
                    },
                    {
                        $unwind: "$Requisition"
                    },
                    {
                        $match: {
                            "Requisition.RequisitionID": id
                        }
                    }, {
                        $project: {
                            CandidateApplyList: 0,
                            CandateViews: 0,

                        }
                    }
                ]).toArray((err, ret) => {
                    if (err) handler(err)
                    else {
                        if (ret.length > 0) {
                            if (ret[0].Requisition.LinkPhoto) {
                                db.collection("sys_attachments")
                                    .findOne({
                                        _id: ret[0].Requisition.LinkPhoto
                                    }, (err, item) => {
                                        if (err) handler(err);
                                        else {
                                            ret[0].Requisition.Photo = item.Content;
                                            handler(undefined, ret[0].Requisition);
                                        }

                                    })
                            }
                            else {
                                if (!ret[0].Requisition.ExperienceLevel) {
                                    ret[0].Requisition.ExperienceLevel = {};
                                }
                                handler(undefined, ret[0].Requisition)
                            }

                        }
                        else {
                            handler(undefined, {});
                        }
                    }

                });

        }

    });
}
/**
 * Cập nhật hoặc thêm mới requisition
 * @param {any} Requisition
 * @param {any} UserEmail
 * @param {any} handler
 */
var saveRequisition = (data, UserEmail, handler) => {
    data = utils.trimData(data);
    var lock = new asynLock();

    Data.cnn((err, db) => {
        var coll = db.collection("ls_recruiters");

        lock.acquire("ls_recriters.Requisition", done => {
            coll.findOne({ UserEmail: { $regex: new RegExp("^" + UserEmail + "$", "i") } }, (err, cust) => {
                if (err) done(err);
                else {
                    if (cust == null) {
                        done(undefined, {
                            apiError: {
                                errorType: "CustumerWasNotFound"
                            }
                        })
                    }
                    else {
                        coll.aggregate([{
                            $unwind: "$Requisition"
                        }, {
                            $match: {
                                RequistionID: data.RequisitionID
                            }
                        }]).toArray((err, ret) => {
                            if (err) done(err);
                            else {
                                if (ret.length == 0) {
                                    done(undefined, {
                                        apiError: {
                                            errorType: "RequisitionWasNotFound"
                                        }
                                    })
                                }
                                else {
                                    var keys = Object.keys()
                                }
                            }
                        })
                    }
                }
            })
            if (data.RequisitionID) {

            }
            else {

            }
        }, (err, result) => {

        });
    });
}
/**
 * lấy danh sách các candidate trong 1 requisition của 1 kh
 * @param {any} Email
 * @param {any} RequistionID
 * @param {any} handler
 */
var getCandidatesByCustomerAdminEmailAndRequisitionID = (Email, RequistionID, handler) => {
    var operators = [];
    var matchCustomer = {
        $match: {
            UserEmail: {
                $regex: new RegExp("^" + Email + "$", "i")
            }
        }
    };
    var unwindRequistion = {
        $unwind: "$Requisition"
    };
    var matchByRequsitionID = {
        $match: { "Requisition.RequisitionID": RequistionID }
    }

    var unwindCandidateApplyList = {
        $unwind: "$Requisition.CandidateApplyList"
    }

    var limit = {
        $limit: 20
    };
    var lookupUser = {
        $lookup: {
            from: "sys_Users",
            localField: "Requisition.CandidateApplyList.CandidateEmail",
            foreignField: "Email",
            as: "Users"
        }
    };
    var lookupCandidate = {
        $lookup: {
            from: "ls_candidate",
            localField: "Requisition.CandidateApplyList.CandidateEmail",
            foreignField: "UserEmail",
            as: "candidates"
        }
    };
    var unwindUser = {
        $unwind: "$Users"
    };
    var unwindCandidate = {
        $unwind: "$candidates"
    }
    var project = {
        $project: {
            FirstName: "$Users.FirstName",
            LastName: "$Users.LastName",
            UserID: "$Users.UserId",
            Sex: "$candidates.Sex",
            DesireMajor: "$candidates.Name",
            Nationality: "$canidates.Nationality",
            BirthDate: "$candidates.BirthDate",
            Email: "$CandidateEmail",
            Photo: "$candidates.Photo",
            Mobile: "$candidates.Mobile",
            Address: "$candidates.FullAddress",
            DesireLocation: "$candidates.DesireLocation.Code",
            AppliedDate: "$AppliedDate",
            AppliedDateUTC: "$AppliedDateUTC",
            CVFilePath: "$candidates.CVFile",
            Experience: "$candidates.Experience",
            CurrentJobName: "$candidates.CurrentJobName"
        }
    };
    operators.push(matchCustomer);
    operators.push(unwindRequistion);
    operators.push(matchByRequsitionID);
    operators.push(unwindCandidateApplyList);
    operators.push(limit);

    operators.push(lookupUser);
    operators.push(lookupCandidate);
    operators.push(unwindUser);
    operators.push(unwindCandidate);
    operators.push(project);
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_recruiters")
                .aggregate(operators)
                .toArray((err, data) => {
                    if (err) handler(err);
                    else {

                        handler(undefined, data);
                    }
                })
        }
    })
}
var createPhotoAttachment = (data, handler) => {
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("sys_attachments")
                .insertOne({
                    FileName: data.PhotoFile,
                    MimeType: data.Photo.split(';')[0].split(':')[1],
                    Content: data.Photo
                }, (err, result) => {
                    if (err) handler(err);
                    else {
                        handler(undefined, result.insertedId)
                    }
                });
        }
    })
}
/**
 * tạo hoặc cập nhật 1 requisition nếu có upload Photo đi kèm thì  ls_recruiters.Requisition.LinkPhoto trỏ đến sys_attacthments
 * @param {any} data thông tin requisition
 * @param {any} email địa chỉ Email của quản trị viên
 */
var createOrUpdateRequisition = (data, email, handler) => {
    var getExperienceLevel = (db, Code, handler) => {
        db.collection("ls_experience_levels")
            .findOne({
                Code: { $regex: new RegExp("^" + Code + "$", "i") }
            }, (err, item) => {
                if (err) handler(err);
                else {
                    handler(undefined, item);
                }
            });
    }
    /**
     * Tìm location
     * @param {any} db
     * @param {any} LocationCode
     * @param {any} ProvinceCode
     * @param {any} handler
     */
    var getLocation = (db, LocationCode, ProvinceCode, handler) => {
        db.collection("ls_locations")
            .aggregate([
                {
                    $unwind: "$Provinces"
                }, {
                    $match: {
                        $and: [{
                            Code: { $regex: new RegExp("^" + LocationCode + "$", "i") },
                        }, {
                            "Provinces.Code": { $regex: new RegExp("^" + ProvinceCode + "$", "i") }
                        }]
                    }
                }
            ]).toArray((err, list) => {
                if (err) handler(err);
                else {
                    if (list.length == 0) handler(undefined, null);
                    else {
                        handler(undefined, list[0])
                    }
                }
            })

    }
    var getJob = (db, GroupCode, JobCode, handler) => {
        db.collection("ls_group_jobs").aggregate([
            {
                $unwind: "$Jobs"
            }, {
                $match: {
                    $and: [
                        { Code: { $regex: new RegExp("^" + GroupCode + "$", "i") } },
                        {
                            "Jobs.Code": {
                                $regex: new RegExp("^" + JobCode + "$", "i")
                            }
                        }
                    ]
                }
            }
        ]).toArray((err, list) => {
            if (err) handler(err);
            else {
                if (list.length == 0) {
                    handler(undefined, null);
                }
                else {
                    handler(undefined, list[0]);
                }
            }
        })
    };
    data = utils.convertDateFields([
        "PostDate",
        "PostDateUTC",
        "CreateOn",
        "CreateOnUTC",
        "PublishDate",
        "ReceiveFrom",
        "ReceiveTo"

    ], data)
    if (data.IsPublished) {
        data.PublishDate = new Date();
        data.PublishDateUTC = utils.getUTCDate(new Date());
    }
    var getCustomerCodeByEmail = (db, email, handler) => {
        db.collection("ls_recruiters")
            .findOne({
                UserEmail: {
                    $regex: new RegExp("^" + email + "$", "i")
                }
            }, (err, ret) => {
                if (err) handler(err);
                else {
                    handler(undefined, ret);
                }
            })
    }
    /**
     * Tìm Province trong location theo province code
     * @param {any} db
     * @param {any} provinceCode
     * @param {any} handler
     */
    var getProvinceByProvinceCode = (db, provinceCode, handler) => {
        db.collection("ls_locations")
            .aggregate([
                {
                    $unwind: "$Provinces"
                }, {
                    $match: { "Provinces.Code": { $regex: new RegExp("^" + provinceCode + "$", "i") } }
                }
            ]).toArray((err, ret) => {
                if (err) handler(err);
                else {
                    if (ret.length == 0) handler(undefined, null);
                    else {
                        handler(undefined, ret[0]);
                    }
                }
            })
    }
    /**
     * Tìm Job trong jobgroup theo job code
     * @param {any} db
     * @param {any} JobCode
     * @param {any} handler
     */
    var getJobByJobCode = (db, JobCode, handler) => {
        db.collection("ls_group_jobs")
            .aggregate([
                {
                    $unwind: "$Jobs"
                }, {
                    $match: { "Jobs.Code": { $regex: new RegExp("^" + JobCode + "$", "i") } }
                }
            ]).toArray((err, ret) => {
                if (err) handler(err);
                else {
                    if (ret.length == 0) handler(undefined, null);
                    else {
                        handler(undefined, ret[0]);
                    }
                }

            });
    }
    /**
     * Tìm requistion
     * @param {any} db
     * @param {any} Email
     * @param {any} RequisitionID
     * @param {any} handler
     */
    var getRequisitionByAdminEmailAndRequisitionID = (db, Email, RequisitionID, handler) => {
        db.collection("ls_recruiters")
            .aggregate([
                {
                    $match: {
                        UserEmail: {
                            $regex: new RegExp("^" + Email + "$", "i")
                        }
                    }
                },
                {
                    $unwind: "$Requisition"
                }, {
                    $match: {
                        "Requisition.RequisitionID": RequisitionID
                    }
                }
            ]).toArray((err, ret) => {
                if (err) handler(err);
                else {
                    if (ret.length == 0) handler(undefined, null);
                    else handler(undefined, ret[0])
                }
            })
    }
    var InsertOrUpdateRequisition = (db, data, email, handler) => {

        getCustomerCodeByEmail(db, email, (err, customer) => {
            if (err) handler(err);
            else {
                if (customer == null) {
                    handler(undefined, {
                        apiError: {
                            errorType: "RecruiterWasNotFound",
                            description: "Recruiter was not found"
                        }
                    })
                }
                else {
                    /*Dùng transaction*/
                    var lock = new asyncLock();
                    lock.acquire("ls_recruiters" + customer.RecruiterCode, done => {
                        getRequisitionByAdminEmailAndRequisitionID(db, email, data.RequisitionID, (err, requisitionData) => {
                            if (requisitionData == null) {
                                data = utils.trimData(data);
                                data.PostDate = new Date();
                                data.CreatedOn = new Date();
                                data.CreatedUTC = utils.getUTCDate(new Date());
                                data.CreatedBy = email;
                                if (!data.RequisitionID) {
                                    data.RequisitionID = GUID.create().value;
                                }
                                db.collection("ls_recruiters")
                                    .updateOne({
                                        _id: customer._id
                                    }, {
                                        $push: {
                                            Requisition: data
                                        }
                                    }, (err, ret) => {
                                        done(err, ret);
                                    });
                            }
                            else {
                                data.ModifiedOn = new Date();
                                data.ModifiedOnUTC = utils.getUTCDate(new Date());
                                data.ModifiedBy = email;
                                db.collection("ls_recruiters").updateOne({ _id: customer._id }, {
                                    $pull: {
                                        Requisition: { RequisitionID: data.RequisitionID }
                                    }
                                }, (err, ret) => {
                                    var keys = Object.keys(data);
                                    for (var i = 0; i < keys.length; i++) {
                                        requisitionData.Requisition[keys[i]] = data[keys[i]];
                                    }
                                    db.collection("ls_recruiters")
                                        .updateOne({
                                            _id: customer._id
                                        }, {
                                            $push: {
                                                Requisition: requisitionData.Requisition
                                            }
                                        }, (err, ret) => {
                                            done(err, ret);
                                        });

                                });

                            }
                        });
                    }, (err, result) => {
                        if (err) handler(err);
                        else {
                            handler(undefined, result);
                        }
                    });
                }
            }
        });

    }

    var checkRequire = utils.checkRequireFields([
        "Job",
        "Location",
        "NumOfStaff",
        "ReceiveFrom",
        "ReceiveTo",
        "Job",
        "Location"
    ], data);
    if (checkRequire.length > 0) {
        handler(undefined, {
            apiError: checkRequire[0]
        });
    }
    else {
        Data.cnn((err, db) => {
            getLocation(db, data.Location.LocationCode, data.Location.ProvinceCode, (err, location) => {
                if (err) handler(err);
                else {
                    if (location == null) {
                        handler(undefined, {
                            apiError: {
                                errorType: "LocationWasNotFound",
                                description: "Location was not found"
                            }
                        });
                        return;
                    }
                    data.Location.LocationName = location.Name;
                    data.Location.ProvinceName = location.Provinces.Name;
                    getJob(db, data.Job.GroupCode, data.Job.JobCode, (err, jobItem) => {

                        getExperienceLevel(db, data.ExperienceLevel.Code || "na", (err, ExperienceLevelItem) => {
                            if (ExperienceLevelItem != null) {
                                data.ExperienceLevel.Name = ExperienceLevelItem.Name;
                            }
                            if (jobItem == null) {
                                handler(undefined, {
                                    apiError: {
                                        errorType: "JobWasNotFound",
                                        description: "Job was not found"
                                    }
                                });
                                return;
                            }
                            data.Job.GroupName = jobItem.Name;
                            data.Job.JobName = jobItem.Jobs.Name;
                            if (err) handler(err);
                            else {
                                if (data.Photo) {
                                    createPhotoAttachment(data, (err, id) => {
                                        data.Photo = undefined;
                                        data.LinkPhoto = id;
                                        InsertOrUpdateRequisition(db, data, email, (err, ret) => {
                                            if (err) handler(err);
                                            else {
                                                handler(undefined, ret);
                                            }
                                        })
                                    })
                                }
                                else {
                                    InsertOrUpdateRequisition(db, data, email, (err, ret) => {
                                        if (err) handler(err);
                                        else {
                                            handler(undefined, ret);
                                        }
                                    })
                                }
                            }
                        });

                    });
                }
            })


        });

    }
}
/**
 * lấy danh sách các requistion theo admin user của nhà truyển dụng
 * @param {any} email
 * @param {any} handler
 */
var getRequisitionListByAdminEmail = (email, sortBy, handler) => {
    if (!sortBy) sortBy = "CreatedOn"
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            var sort = {
                $sort: { PublishDate: -1 }
            }
            sort.$sort["Requisition." + sortBy] = -1;
            db.collection("ls_recruiters")
                .aggregate([
                    {
                        $match: {
                            UserEmail: { $regex: new RegExp("^" + email + "$", "i") }
                        }
                    }, {
                        $unwind: "$Requisition"
                    },
                    sort
                    , {
                        $limit: 8
                    }

                ])
                .toArray((err, list) => {
                    if (err) handler(err);
                    else {
                        handler(undefined, list);
                    }
                })
        }
    });
}
/**
 * Lấy danh sách cấp bậc
 * @param {any} handler
 */
var get_ls_experience_levels = (language, handler) => {
    Data.cnn((err, db) => {
        var sort = {
            $sort: {}
        }
        var project = {
            Code: 1
        }
        project["Name." + language] = 1;
        sort.$sort["Name." + language] = 1
        db.collection("ls_experience_levels")
            .aggregate([sort, {
                $project: project
            }]).toArray((err, list) => {
                handler(err, list);
            })
    });
}
/**
 * Lấy danh sách các job từ danh mục
 * @param {any} language
 * @param {any} hander
 */
var get_ls_group_jobs = (language, hander) => {


    Data.cnn((err, db) => {
        if (err) hander(err);
        else {
            db.collection("ls_group_jobs")
                .find({})
                .toArray((err, list) => {
                    hander(err, list)
                })
        }
    })
}
/**
 * Lấy danh sách khu vực
 * @param {any} language
 * @param {any} handler
 */
var get_ls_locations = (language, handler) => {
    Data.cnn((err, db) => {
        if (err) hander(err);
        else {
            db.collection("ls_locations")
                .find({})
                .toArray((err, list) => {
                    handler(err, list)
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
/**
 * lấy danh sách tất cả các ứng viên đã apply vào job của công ty
 * @param {any} filter
* @param {email} người đang login vào để xem
 * @param {any} handler
 */
var getListOfCandidateApplyJob = (email, filter, handler) => {
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_recruiters")
                .aggregate([{
                    $match: {
                        UserEmail: {
                            $regex: new RegExp("^" + email + "$", "i")
                        }
                    }
                },
                {
                    $unwind: "$Requisition"
                },
                {
                    $unwind: "$Requisition.CandidateApplyList"
                }, {
                    $replaceRoot: { newRoot: "$Requisition.CandidateApplyList" }
                },
                {
                    $lookup: {
                        from: "sys_Users",
                        localField: "CandidateEmail",
                        foreignField: "Email",
                        as: "Users"
                    }
                },
                {
                    $lookup: {
                        from: "ls_candidate",
                        localField: "CandidateEmail",
                        foreignField: "UserEmail",
                        as: "candidates"
                    }
                }
                ])
                .toArray((err, lst) => {
                    handler(err, lst);
                })
        }
    })
}
/**
 * lấy danh sách mã yêu cầu tuyển dụng
 * @param {any} email
 * @param {any} handler
 */
var getListCodeRequisition = (email, jobCode, handler) => {
    var operators = [];
    var matchRecruiter = {
        $match: {
            UserEmail: {
                $regex: new RegExp("^" + email + "$", "i")
            }
        }
    };
    //bung Requsition
    var unwindRequistion = {
        $unwind: "$Requisition"
    };
    //Tìm theo job code
    var match_jobCode = {
        $match: { "Requisition.Job.JobCode": { $regex: new RegExp("^" + jobCode + "$", "i") } }
    };
    //Dời Requsition về gốc 
    var replaceRoot = {
        $replaceRoot: {
            newRoot: "$Requisition"
        }
    };
    //Chọn các cột và lấy type của CandidateApplyList
    var projectWithTypeOfCandidateApplyList = {
        $project: {
            TypeOfCandidateApplyList: { $type: "$CandidateApplyList" },
            RequisitionID: 1,
            Jobs: 1,
            Location: 1,
            Description: 1,
            Candidates: "$CandidateApplyList"
        }
    };
    //Tính số candidate applied
    var projectWithTotalCandidateApplied = {
        $project: {
            RequisitionID: 1,
            TotalCandidates: { $size: "$Candidates" }
        }
    }
    var matcWithTotalCandidatesApplyGreaterThanZero = {
        $match: {
            TotalCandidates: {
                $gt: 0
            }
        }
    }
    var matchOnlyCandidateApplyListisArray = {
        $match: {
            TypeOfCandidateApplyList: "array"
        }
    }
    operators.push(matchRecruiter);
    operators.push(unwindRequistion);

    if (jobCode) {
        operators.push(match_jobCode);
    }
    operators.push(replaceRoot);
    operators.push(projectWithTypeOfCandidateApplyList);
    operators.push(matchOnlyCandidateApplyListisArray);
    operators.push(projectWithTotalCandidateApplied);
    operators.push(matcWithTotalCandidatesApplyGreaterThanZero);
    //operators.push(matcWithTotalCandidates_gt_0);
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_recruiters")
                .aggregate(operators)
                .toArray((err, lst) => {
                    if (err) handler(err);
                    else {
                        var ret = [];
                        lst.forEach(item => {
                            ret.push({
                                id: item.RequisitionID,
                                text: item.RequisitionID
                            })
                        });
                        handler(undefined, ret);
                    }
                });
        }
    })
}
/**
 * lấy danh sách các candidate theo requistionId
 * @param {any} email
 * @param {any} requisitionId
 * @param {any} handler
 */
var getListOfCandidateByRequisitionId = (email, requisitionId, handler) => {
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_recruiters")
                .aggregate([{
                    $match: {
                        UserEmail: { $regex: new RegExp("^" + email + "$", "i") }
                    }
                }, {
                    $unwind: "$Requisition"
                }, {
                    $match: {
                        "Requisition.RequisitionID": requisitionId
                    }
                }, {
                    $unwind: "$Requisition.CandidateApplyList"
                }, {
                    $replaceRoot: {
                        newRoot: "$Requisition.CandidateApplyList"
                    }
                }, {
                    $lookup: {
                        from: "ls_candidate",
                        localField: "CandidateEmail",
                        foreignField: "UserEmail",
                        as: "candidates"
                    }
                }, {
                    $lookup: {
                        from: "sys_Users",
                        localField: "CandidateEmail",
                        foreignField: "Email",
                        as: "Users"
                    }
                }, {
                    $unwind: "$Users"

                }, {
                    $unwind: "$candidates"
                }, {
                    $project: {
                        FirstName: "$Users.FirstName",
                        LastName: "$Users.LastName",
                        ExperienceYears: "$candidates.ExperienceYears", //số năm kinh nghiệm,
                        RecentInfo: "$candidates.RecentInfo", // thông tin công việc gần đây nhất
                        Email: "$Users.Email"

                    }
                }]).toArray((err, lst) => {
                    handler(err, lst);
                })
        }
    })
}
/**
 * Lấy danh sách các task của 1 requisition theo RequisitionID
 * @param {any} email Địa chỉ email của quản trị viên khách hàng
* @param {any} candidateEmail Địa chỉ email của ứng viên đang xem xét
 * @param {any} requisitionID RequisitionID
 * @param {any} handler
 */
var getListOfTaskOf_In_Requisition_ByRequisitionID = (email, candidateEmail, requisitionID, handler) => {
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_recruiters")
                .aggregate([
                    {
                        $match: {
                            UserEmail: { $regex: new RegExp("^" + email + "$", "i") }
                        }
                    }, {
                        $unwind: "$Requisition"
                    }, {
                        $match: {
                            "Requisition.RequisitionID": requisitionID
                        }
                    }, {
                        $unwind: "$Requisition.CandidateApplyList"
                    }, {
                        $match: {
                            "Requisition.CandidateApplyList.CandidateEmail": {
                                $regex: new RegExp("^" + candidateEmail + "$", "i")
                            }
                        }
                    }, {
                        $unwind: "$Requisition.CandidateApplyList.Tasks"
                    }, {
                        $replaceRoot: {
                            newRoot: "$Requisition.CandidateApplyList.Tasks"
                        }
                    }
                ]).toArray((err, lst) => {
                    handler(err, lst);
                })
        }
    })
};
/**
 * Thêm hoặc cập nhật 1 task cho 1 requisition
* @param {any} rootUrl url gốc của web site
* @param {any} language ngôn ngữ dùng để giao tiếp qua Email
 * @param {any} email Email của quản trị viên nhà tuyển dụng
 * @param {any} requisitionID 
 * @param {any} candidateEmail
 * @param {any} task
 * @param {any} handler

 */
var insertOrUpdateTaskForRequisition = (rootUrl, language, email, requisitionID, candidateEmail, task, handler) => {

    delete task["$$hashKey"];
    var indexOfRequisition = null;
    var indexOfCandidate = null;
    var isHasTaskIncandidateApplyList = false;
    var attachId = undefined;
    var oldTask = undefined;
    task.ActionDate = new Date();
    task.AppliedDate = new Date();
    task.AppliedDateUTC = utils.getUTCDate(new Date());
    task.Actor = email;
    var candidateUser = {};
    var requisition;
    var company;
    task = utils.convertDateFields(["InterviewTime",
        "ActionDate"
    ], task);
    if (!task.TaskID) {
        task.TaskID = GUID.create().value;
    }
    Data.cnn((err, db) => {
        utils.sequences()
            .then(next => {
                db.collection("ls_recruiters")
                    .aggregate([
                        {
                            $match: {
                                UserEmail: new RegExp("^" + email + "$", "i")
                            }
                        }, {
                            $unwind: "$Requisition"
                        }, {
                            $match: {
                                "Requisition.RequisitionID": requisitionID
                            }
                        }
                    ]).toArray((err, data) => {
                        if (err) next(err);
                        else {
                            requisition = data[0].Requisition;
                            company = data;
                            next();
                        }
                    })
            })
            .then(next => {
                db.collection("sys_Users")
                    .findOne({
                        Email: {
                            $regex: new RegExp("^" + candidateEmail + "$", "i")
                        }
                    }, (err, user) => {
                        if (err) next(err);
                        else {
                            candidateUser.FirstName = user.FirstName;
                            candidateUser.LastName = user.LastName;
                            candidateUser.Email = user.Email;
                            next();
                        }
                    })
            })
            .then(next => {
                if (task.AttachmentFileContent) {
                    var MimeType = task.AttachmentFileContent.split("data:")[1].split(";")[0]

                    db.collection("sys_attachments")
                        .insertOne({
                            FileName: task.AttachmentFileName,
                            Content: task.AttachmentFileContent,
                            MimeType: MimeType

                        }, (err, result) => {
                            if (err) next(err);
                            else {
                                attachId = result.insertedId;
                                task.AttachmentFileContent = undefined;
                                task.AttachmentID = result.insertedId;
                                next();
                            }
                        })
                }
                else {
                    next();
                }
            })
            .then(next => {
                db.collection("ls_recruiters")
                    .aggregate([
                        {
                            $match: {
                                UserEmail: {
                                    $regex: new RegExp("^" + email + "$", "i")
                                }
                            }
                        }, {
                            $project: {
                                index: {
                                    $indexOfArray: ["$Requisition.RequisitionID", requisitionID]
                                }
                            }
                        }
                    ]).toArray((err, lst) => {
                        if (err) sender(err);
                        else {
                            if (lst.length > 0) {
                                indexOfRequisition = lst[0].index;
                                next();
                            }
                            else {
                                next();
                            }
                        }
                    })
            })
            .then(next => {
                db.collection("ls_recruiters")
                    .aggregate([
                        {
                            $match: {
                                UserEmail: {
                                    $regex: new RegExp("^" + email + "$", "i")
                                }
                            }
                        }, {
                            $unwind: "$Requisition"
                        }, {
                            $match: {
                                "Requisition.RequisitionID": requisitionID
                            }
                        },
                        {
                            $project: {
                                index: {
                                    $indexOfArray: ["$Requisition.CandidateApplyList.CandidateEmail", candidateEmail.toLowerCase()]
                                }
                            }
                        }
                    ]).toArray((err, lst) => {
                        if (err) next(err);
                        else {
                            if (lst.length > 0) {
                                indexOfCandidate = lst[0].index
                                next()
                            }
                            else {
                                next();
                            }
                        }
                    })
            })
            .then(next => {
                db.collection("ls_recruiters")
                    .aggregate([
                        {
                            $match: {
                                UserEmail: {
                                    $regex: new RegExp("^" + email + "$", "i")
                                }
                            }
                        }, {
                            $unwind: "$Requisition"
                        }, {
                            $match: {
                                "Requisition.RequisitionID": requisitionID
                            }
                        }
                        , {
                            $unwind: "$Requisition.CandidateApplyList"
                        }, {
                            $unwind: "$Requisition.CandidateApplyList.Tasks"
                        }, {
                            $match: {
                                "Requisition.CandidateApplyList.Tasks.TaskID": task.TaskID
                            }
                        }, {
                            $replaceRoot: {
                                newRoot: "$Requisition.CandidateApplyList.Tasks"
                            }
                        }
                    ])
                    .toArray((err, lst) => {
                        if (err) next(err);
                        else {
                            isHasTaskIncandidateApplyList = lst.length > 0;
                            if (lst.length > 0) {
                                oldTask = lst[0];
                                var pull = {
                                    $pull: {}
                                }
                                pull.$pull["Requisition." + indexOfRequisition + ".CandidateApplyList." + indexOfCandidate + ".Tasks"] = oldTask;
                                db.collection("ls_recruiters")
                                    .updateOne({
                                        UserEmail: {
                                            $regex: new RegExp("^" + email + "$", "i")
                                        }
                                    }, pull, (err, result) => {
                                        if (err) next(err);
                                        else {
                                            next();
                                        }
                                    });
                            }
                            else {
                                next();
                            }

                        }
                    })
            })

            .done(err => {

                if (err) handler(err)
                else {
                    if ((indexOfRequisition != null) && (indexOfCandidate != null)) {
                        var setter = {
                            $push: {}
                        }

                        var keys = Object.keys(task);
                        if (!oldTask) oldTask = {};
                        keys.forEach(key => {
                            oldTask[key] = task[key];
                        });
                        oldTask.ModifiedBy = email;
                        oldTask.ModifiedOn = new Date();
                        oldTask.ModifiedOnUTC = utils.getUTCDate(new Date());

                        setter.$push["Requisition." + indexOfRequisition + ".CandidateApplyList." + indexOfCandidate + ".Tasks"] = oldTask;
                        db.collection("ls_recruiters")
                            .updateOne({
                                UserEmail: {
                                    $regex: new RegExp("^" + email + "$", "i")
                                }
                            }, setter, (err, result) => {
                                var dataForEmail = {
                                    Candidate: candidateUser,
                                    Requisition: requisition,
                                    Interview: {
                                        Date: oldTask.ActionDate,
                                        From: oldTask.InterviewTime.From,
                                        At: oldTask.InterviewLocation,
                                        Note: oldTask.Note
                                    },
                                    Company: company,
                                    WebSiteUrl: rootUrl
                                };
                                var defaultTemplateSubject = "Thư mời phỏng vấn";
                                var defaultContentTemplate = "Hi {{Candidate.FirstName}} {{Candidate.LastName}}<br/>." +
                                    "Trân trọng mời bạn phỏng vấn vào ngày {{Interview.Date}} thời gian từ {{Interview.From}} đến {{Interview.To}}<br/>." +
                                    "Bạn có thể xem lịch phỏng vấn của bạn tại <a href='{{WebSiteUrl}}/candidate/myinterview'>{{WebSiteUrl}}/candidate/myinterview</a>"
                                "Chân thành <br/>";

                                if (oldTask.IsInterview) {
                                    EmailSender.getInviteInterriewTemplateEmailByAdminEmail(language, email, defaultTemplateSubject, defaultContentTemplate, dataForEmail, (err, template) => {
                                        if (!err) {
                                            EmailSender.sendEmail(dataForEmail.Candidate.Email, template.Subject, template.Template, dataForEmail, (err, result) => {

                                            })
                                        }
                                    });
                                }
                                handler(undefined, oldTask)
                            });

                    }
                }
            })
    })
};
/**
 * Tạo mới 1 user cho khách hàng
 * @param {any} Username
 * @param {any} Password
 * @param {any} FirstName
 * @param {any} LastName
 * @param {any} Creator
 * @param {any} RecruiterId _id của ls_recruiter
 * @param {any} handler
 */
var createUser = (Username, Password, FirstName, LastName, Creator, RecruiterId, handler) => {


    var recruiter;
    var createUserResult;
    var db;
    var error;
    var id;
            try {
                 id = mongo.ObjectID(RecruiterId);
            }
            catch (ex) {
                id = RecruiterId;
            }
    utils.sequences()
        .then(next => {
            Data.cnn((err, item) => {
                db = item;
                next(err);
            })
        })
        .then(next => {
            
            db.collection("ls_recruiters")
                .findOne({
                    _id: id
                }, (err, item) => {
                    recruiter = item;
                    next(err);
                });
        })
        .then(next => {
            if (recruiter != null) {
                if (recruiter.UserEmail) {
                    error = {
                        errorType: "RecruiterEmailIsNotEmpty",
                        description: "User admin of recruiter is already"
                    }
                    next();
                }
                else {
                    account.createUser(Username, Password, FirstName, LastName, Creator, (err, result) => {
                        createUserResult = result
                        if (result.apiError) {
                            error = result.apiError;
                            next();
                        }
                        else {
                            next(err);
                        }
                    });
                }
            }
            else {
                error = {
                    errorType: "RecruiterWasNotFound",
                    description: "Recruiter was not found"
                }
                next();
            }
        })
        .then(next => {
            if (error) {
                next();
                return;
            }
            if (!recruiter.UserEmail) {
                db.collection("ls_recruiters")
                    .updateOne({
                        _id: id
                    }, {
                        $set: {
                            UserEmail: Username
                        }
                    }, (err, result) => {
                        next(err);
                    });
            }
            else {
                next();
            }
        })
        .then(next => {
            if (error) next();
            else {
                account.activeUserByEmail(Username, (err, result) => {
                    next(err);
                });
            }
        })
        .done(err => {
            if (error) {
                handler(err, { apiError: error })
            }
            else {
                handler(err, {});
            }
        })


};
module.exports = {
    getListOfCustomers: getListOfCustomers,
    getCustomerById: getCustomerById,
    saveCustomerInfo: saveCustomerInfo,
    createCustomer: createCustomer,
    getRequisitionById: getRequisitionById,
    getCandidatesByCustomerAdminEmailAndRequisitionID: getCandidatesByCustomerAdminEmailAndRequisitionID,
    createOrUpdateRequisition: createOrUpdateRequisition,
    getRequisitionListByAdminEmail: getRequisitionListByAdminEmail,
    get_ls_experience_levels: get_ls_experience_levels,
    get_ls_group_jobs: get_ls_group_jobs,
    get_ls_locations: get_ls_locations,
    getUserInfoByUserId: getUserInfoByUserId,
    getListOfCandidateApplyJob: getListOfCandidateApplyJob,
    getListCodeRequisition: getListCodeRequisition,
    getListOfCandidateByRequisitionId: getListOfCandidateByRequisitionId,
    getListOfTaskOf_In_Requisition_ByRequisitionID: getListOfTaskOf_In_Requisition_ByRequisitionID,
    insertOrUpdateTaskForRequisition: insertOrUpdateTaskForRequisition,
    createUser: createUser
}