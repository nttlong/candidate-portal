const DB = require("./lv.db");
const utils = require("./../libs/lv.utils");
const models = require("./lv.model");
/**
 * Lấy danh sách các job
 * @param {any} pageSize số dòng cho 1 trang
*@param {any} pageIndex Trang cần lấy bắt đầu từ 0
 * @param {any} handler
 */
var getListOfTopRequistion = (pageSize, pageIndex, handler) => {
    DB.cnn((err, db) => {
        if (err) handler(err);
        else {
            try {
                var operators = [];
                operators.push({
                    $sort: { PublishDate:-1}
                });
                operators.push({
                    $skip: (pageIndex * pageSize)
                });
                operators.push({
                    $limit: pageSize
                });
                operators.push({
                    $lookup: {
                        from: "ls_recruiters",
                        localField: "RecruiterId",
                        foreignField: "_id",
                        as: "Recruiter"
                    }
                });
                operators.push({
                    $unwind:"$Recruiter"
                })
                 operators.push({
                    $project: {
                        RecruiterName: "$Recruiter.RecruiterName",
                        RecruiterCode: "$Recruiter.RecruiterCode",
                        GroupCode: "$Job.GroupCode",
                        JobCode: "$Job.JobCode",
                        PostDate: 1,
                        PublishDate: 1,
                        JobName: "$Job.JobName",
                        IsHot: 1,
                        RequisitionID:"$_id"
                    }
                })
                 db.collection("ls_requisition")
                     .aggregate(operators)
                     .toArray((err, list) => {
                         handler(err, list);
                     })
                //operators.push({
                //    "$unwind": "$Requisition"
                //});
                //operators.push({
                //    $sort: {
                //        "Requisition.PublishDate": -1
                //    }
                //});
                //operators.push({
                //    $skip: (pageIndex * pageSize)
                //});
                //operators.push({
                //    $limit: pageSize
                //});
                //operators.push({
                //    $project: {
                //        _id: 0,
                //        RecruiterName: 1,
                //        RecruiterCode: 1,
                //        GroupCode: "$Requisition.Job.GroupCode",
                //        JobCode: "$Requisition.Job.JobCode",
                //        id: "$Requisition.RequisitionID",
                //        PostDate: "$Requisition.PostDate",
                //        PublishDate: "$Requisition.PublishDate",
                //        JobName: "$Requisition.Job.JobName",
                //        IsHot:"$Requisition.IsHot"
                //    }
                //})
                //db.collection("ls_recruiters")
                //    .aggregate(operators)
                //    .toArray((err, result) => {
                //        if (err) handler(err);
                //        else {
                //            handler(undefined, result);
                //        }
                //    })
            }
            catch (ex) {
                handler(ex);
            }


        }
    });
}

/**
 * Lấy tổng số các requisition
 * @param {any} handler
 */
var getTotalRequisition = (handler) => {
   
    DB.cnn((err, db) => {
        if (err) {
            handler(err);
        }
        else {
            db.collection("ls_requisition")
                .count({}, (err, result) => {
                    handler(err, result);
                })
        }
    })
}
var _getOperationForFindRequisition = (filter, language) => {
     /*
    filter: {

                        content: clientData.content,
                        recruiterCode: clientData.recruitercode,
                        sortType: clientData.bytype,
                        jobs: clientData.jobsChecked,
                        locations: clientData.locationChecked,
                        levels: levelsChecked,
                        recruiters: companyChecked,
                        pageIndex: pageIndex
                    }
    */
    var operators = [{
        $lookup: {
            from: "ls_recruiters",
            localField: "RecruiterId",
            foreignField: "_id",
            as:"Recruiter"
        }
    }, {
            $unwind:"$Recruiter"
    }];
    if (filter.recruiters && (filter.recruiters.length>0)) {
        var matchRecruiter = {
            $or: []
        };
        filter.recruiters.forEach(item => {
            
            
            matchRecruiter.$or.push({
                "Recruiter.RecruiterCode": { $regex: new RegExp("^" + item + "$", "i") }
            })
        })
        operators.push({
            $match: matchRecruiter
        })
    }
    

    

    var matchContent = {
        $or: []
    }
    if (filter.content && (filter.content!=="all")) {
        var regSearch = { $regex: new RegExp("^"+filter.content+"$","i") };
        var findGroupName = {};
        findGroupName["Job.GroupName." + language] = regSearch;
        matchContent.$or.push(findGroupName);
        var findJobName = {};
        findJobName["Job.JobName." + language] = regSearch;
        matchContent.$or.push(findJobName);
        var findLocation = {};
        findLocation["Location.LocationName." + language] = regSearch;
        matchContent.$or.push(findLocation);
        var findProvince = {};
        findLocation["Location.ProvinceName." + language] = regSearch;
        matchContent.$or.push(findProvince);
        var findSkill = {};
        findSkill["Skill"] = regSearch;
        matchContent.$or.push(findSkill);
    }
    var matchJobs = {
        $or:[]
    }
    if (filter.jobs && (filter.jobs.length>0)) {
        filter.jobs.forEach(key => {
            var group = key.split("::")[0];
            var Code = key.split("::")[1];
            var findJobCondional = {
                $and: []
            };
            var whereByGoupCode = {}
            var whereByJobCode = {}
            whereByGoupCode["Job.GroupCode"] = { $regex: new RegExp("^" + group + "$", "i") };
            whereByJobCode["Job.JobCode"] = { $regex: new RegExp("^" + Code + "$", "i") };

            findJobCondional.$and.push(whereByGoupCode);
            findJobCondional.$and.push(whereByJobCode);
            matchJobs.$or.push(findJobCondional);

        });
    }
    var matchLocation = {
        $or:[]
    }
    if (filter.locations && (filter.locations.length>0)) {
        filter.locations.forEach(key => {
            var group = key.split("::")[0];
            var Code = key.split("::")[1];
            var findJobCondional = {
                $and: []
            };
            var whereByGoupCode = {}
            var whereByJobCode = {}
            whereByGoupCode["Locations.LocationCode"] = { $regex: new RegExp("^" + group + "$", "i") };
            whereByJobCode["Locations.ProvinceCode"] = { $regex: new RegExp("^" + Code + "$", "i") };

            findJobCondional.$and.push(whereByGoupCode);
            findJobCondional.$and.push(whereByJobCode);
            matchLocation.$or.push(findJobCondional);

        });
    }
    var matchLevels = {
        $or:[]
    }
    if (filter.levels && filter.levels.length > 0) {
        filter.levels.forEach(key => {
            var whereBy = {};
            whereBy["ExperienceLevel.Code"] = { $regex: new RegExp("^" + key + "$", "i") };
            matchLevels.$or.push(whereBy);
        })
    }
    
    if (matchContent.$or.length > 0) {
        operators.push({ $match: matchContent });
    }
    var match2 = {
        $and:[]
    }
    if (matchJobs.$or.length > 0) {
        //match2.$and.push({
        //    $match: matchJobs
        //})
        operators.push({
            $match: matchJobs
        })
    }
    if (matchLocation.$or.length > 0) {
        //match2.$and.push({
        //    $match: matchLocation
        //})
        operators.push({
            $match: matchLocation
        })
    }
    if (matchLevels.$or.length > 0) {
        //match2.$and.push({
        //    $match: matchLevels
        //})
        operators.push({
            $match: matchLevels
        })
    }
    //if (match2.$and.length > 0) {
    //    operators.push({ $match: match2 });
    //}
   
    return operators;
}

var checkItemInArrayObj = (item, array) => {
    for (var i = 0; i < array.length; i++){
        if (item.id.equals(array[i].RequisitionId)) {
            return true;
        } 
    }
    return false;
}

var findRequisition = (filter, language, handler) => {
    var emailuser = filter.emailuser;
    var query =
        models.ls_requisition()
            .lookup("ls_recruiters", "RecruiterId", "_id", "recruiter")
            .unwind("recruiter").query();

    if (filter.locations.length > 0 && filter.locations[0].indexOf('all') == -1) {
        //query = query.unwind("Locations").query();
        filter.locations.forEach(location => {
            var code = location.split('::')[0];
            var pCode = location.split('::')[1];
            var index = filter.locations.indexOf(location);
            if (index === 0) {
                query = query.where("(Locations.Code==code)and(Locations.Provinces.Code==pCode)", {
                    code: code,
                    pCode: pCode
                });
            }
            else {
                query = query.whereOr("(Locations.Code==code)and(Locations.Provinces.Code==pCode)", {
                    code: code,
                    pCode: pCode
                });
            }
        });
        query = query.query();
    }
    if (filter.jobs.length > 0 && filter.jobs[0].indexOf('all') == -1) {
        filter.jobs.forEach(job => {
            var code = job.split('::')[0];
            var pCode = job.split('::')[1];
            var index = filter.jobs.indexOf(job);
            if (index === 0) {
                query = query.where("(Job.GroupCode==code)and(Job.JobCode==pCode)", {
                    code: code,
                    pCode: pCode
                });
            }
            else {
                query = query.whereOr("(Job.GroupCode==code)and(Job.JobCode==pCode)", {
                    code: code,
                    pCode: pCode
                });
            }
        });
        query = query.query();
    }
    if (filter.levels.length > 0) {
        filter.levels.forEach(item => {
            query = query.whereOr("(ExperienceLevel.Code==code)", {
                code: item
            });
        })
        query = query.query();
    }
    if (filter.salary && filter.salary != 0) {
        if (filter.salary < 0) {
            query = query.where("(SalaryType==type)", {
                type: (filter.salary == -1 ? "0" : "2")
            });
        } else if (filter.salary == 0) {
            
        } else {
            if (filter.salary < 5000000) {
                query = query.where("(SalaryType==type)and(Salary<=_salary)", {
                    type: "1",
                    _salary: 5000000
                });
            } else if (filter.salary < 2000000) {
                query = query.where("(SalaryType==type)and(salary<=Salary)and(Salary>=_salary)", {
                    type: "1",
                    salary: Number(filter.salary),
                    _salary: Number(filter.salary) + 5000000
                });
            } else {
                query = query.where("(SalaryType==type)and(Salary>=_salary)", {
                    type: "1",
                    _salary: Number(filter.salary)
                });
            }
        }
        query = query.query();
    }
    if ((filter.content) && (filter.content !== "all")) {
        query = query.where("(contains(Locations.Name." + language + ",txtSearch))or" +
            "(contains(Locations.Provinces.Name." + language + ",txtSearch))or" +
            "(contains(Jobs.GroupName." + language + ",txtSearch))or" +
            "(contains(Jobs.JobName." + language + ",txtSearch))or" +
            "(contains(JobTitle,txtSearch))"
            , {
           txtSearch: filter.content
            }).query();
        var items = filter.content.split(',');
        items.forEach(item => {
            query = query.whereOr("(contains(MetaGroupSearch.PublishSearch.Job_JobName_vn,content))or" +
                "(contains(MetaGroupSearch.PublishSearch.Job_JobName_en,content))or" +
                "(contains(MetaGroupSearch.PublishSearch.Job_GroupName_vn,content))or" +
                "(contains(MetaGroupSearch.PublishSearch.Job_GroupName_en,content))or" +
                "(contains(MetaGroupSearch.PublishSearch.JobTitle,content))or" +
                "(contains(MetaGroupSearch.PublishSearch.Description_vn,content))or" +
                "(contains(MetaGroupSearch.PublishSearch.Description_en,content))or" +
                "(contains(MetaGroupSearch.PublishSearch.ExperienceLevel_Name_vn,content))or" +
                "(contains(MetaGroupSearch.PublishSearch.ExperienceLevel_Name_en,content))or" +
                "(contains(MetaGroupSearch.PublishSearch.Requirements_vn,content))or" +
                "(contains(MetaGroupSearch.PublishSearch.Requirements_en,content))or" +
                "(contains(MetaGroupSearch.PublishSearch.Locations_Name_vn,content))or" +
                "(contains(MetaGroupSearch.PublishSearch.Locations_Name_en,content))or" +
                "(contains(MetaGroupSearch.PublishSearch.Locations_Provinces_Name_vn,content))or" +
                "(contains(MetaGroupSearch.PublishSearch.Locations_Provinces_Name_en,content))", {
                    content: utils.clear_tress(item)
                })
                .query();
        });
        

    }
    if (filter.recruiters.length > 0) {
        filter.recruiters.forEach(recruiter => {
            var code = recruiter;
            var index = filter.recruiters.indexOf(recruiter);
            if (index === 0) {
                query = query.where("(recruiter.RecruiterCode==code)", {
                    code: code
                })
            } else {
                query = query.whereOr("(recruiter.RecruiterCode==code)", {
                    code: code
                })
            }
        })
        query = query.query();
    }
    // clone 1 query khác để đếm số item 
    var query_clone = query.clone();
    if (filter.sortType == "byDate" || filter.sortType == "by-post-date"){
        query.sort("PublishDate", -1).query();
    } else if (filter.sortType == "by-salary") {
        query.sort("Salary", -1).query();
    }
    query    
        .select({
            RecruiterCode: "recruiter.RecruiterCode",
            RecruiterName: "recruiter.RecruiterName",
            GroupCode: "Job.GroupCode",
            JobCode: "Job.JobCode",
            JobName: "Job.JobName." + language,
            GroupName: "Job.GroupName." + language,
            Locations:1,
            id: "_id",
            Salary: 1,
            SalaryType: 1,
            PublishDate: 1,
            JobTitle: 1,
            IsHot: 1
        })
        .skip(filter.pageIndex * filter.numberItem)
        .limit(filter.numberItem)
        .toArray((err, lst) => {
            if (err)
                handler(err);
            else {
                if (lst.length > 0) {
                    query_clone.count().then(count => { // đếm tổng item
                        var dataRes = {};
                        dataRes.totalItems = count;
                        if (!emailuser) {
                            dataRes.lstData = lst;
                            handler(undefined, dataRes);
                        } else {
                            var qr_user = models.ls_candidate()
                                .where("(UserEmail==user)", {
                                    user: emailuser
                                })
                                .unwind("RequistionSaveList")
                                .select({
                                    RequisitionId: "RequistionSaveList.RequisitionId"
                                })
                                .toArray((err, lstuser) => {
                                    if (err) handler(err);
                                    else {
                                        if (lstuser.length > 0) {
                                            lst.forEach(item => {
                                                item.isSaved = checkItemInArrayObj(item, lstuser);
                                            })
                                            dataRes.lstData = lst;
                                            handler(undefined, dataRes);
                                        } else {
                                            dataRes.lstData = lst;
                                            handler(undefined, dataRes);
                                        }
                                    }
                                })
                        }
                    }).catch(ex => {
                        handler(ex);
                    })
                } else {
                    handler(undefined, [])
                }
            }
        });
}
var getTotalItemsRequisition = (filter, language, handler) => {
    var operators = _getOperationForFindRequisition(filter, language);
    operators.push({
        $count:"totalItems"
    })
    DB.cnn((err, db) => {
        if (err) handler(err);
        else {
            db.collection("ls_recruiters")
                .aggregate(operators)
                .toArray((err, lst) => {
                    if (err) handler(err);
                    else {
                        if (lst.length === 0) {
                            handler(undefined,0)
                        }
                        else {
                            handler(undefined, lst[0].totalItems);
                        }
                    }
                    
                });
        }
    });
}
/**
 * Lấy candidate và requisition theo recruiterCode và ID
 * @param {any} recruiterCode
 * @param {any} requisitionID
 * @param {any} handler
 */
var getRequisitionForCandidate = (email, recruiterCode, requisitionID, handler) => {
    var _getCandidate = (db, handler) => {
        db.collection("sys_Users")
            .aggregate([
                {
                    $match: {
                        Email: {
                            $regex: new RegExp("^" + email + "$", "i")
                        }
                    }
                }, {
                    $lookup:
                    {
                        from: "ls_candidate",
                        localField: "Email",
                        foreignField: "UserEmail",
                        as: "Candidate"
                    }
                }, {
                    $unwind: "$Candidate"
                },
                {
                    $project: {
                        Email: 1,
                        FirstName: 1,
                        LastName: 1,
                        CLContent: "Candidate.CLContent",
                        Mobile: "Candidate.Mobile",
                        Photo: "Candidate.Photo",
                        LastestModifiedOn: 1,
                        LastestModifiedOnUTC: 1,
                        ModifiedOn: 1,
                        ModifiedOnUTC: 1,
                        CVFile: 1
                    }
                }
            ]).toArray((err, lst) => {
                if (err) handler(err);
                else {
                    if (lst.length === 0) {
                        handler(undefined, null)
                    }
                    else {
                        handler(undefined, lst[0])
                    }
                }
            })
    };
    var _getRequisition = (db, handler) => {
        db.collection("ls_recruiters")
            .aggregate([
                {
                    $match: {
                        RecruiterCode: {
                            $regex: new RegExp("^" + recruiterCode + "$", "i")
                        }
                    }
                }, {
                    $unwind: "$Requisition"
                }, {
                    $match: {
                        "Requisition.RequisitionID": requisitionID
                    }
                }, {
                    $project: {
                        RecruiterCode: 1,
                        RecruiterName: 1,
                        Job: "$Requisition.Job",
                        Location: "$Requisition.Location",
                        Description: "$Requisition.Description",
                        Skills: "$Requsition.Skills",
                        ExperienceLevel: "$Requsition.ExperienceLevel",
                        PubslishDate: "$Requsition.PubslishDate",
                        IsPublish: "$Requsition.IsPublish",
                        LanguageCV: 1,
                        RequisitionID:"$Requisition.RequisitionID"
                    }
                }
            ])
            .toArray((err, lst) => {
                if (err) handler(err);
                else {
                    if (lst.length === 0) {
                        handler(undefined, {})
                    }
                    else {
                        handler(undefined, lst[0])
                    }
                }
            })
    };
    DB.cnn((err, db) => {
        if (err) handler(err);
        else {
            _getCandidate(db, (err, candidate) => {
                if (err) handler(err)
                else {
                    _getRequisition(db, (err, requisition) => {
                        if (err) handler(err);
                        else {
                            handler(undefined, {
                                candidate: candidate,
                                requisition: requisition
                            })
                        }
                    })
                }

            })

        }
    });
};
/**
 * Tạo mẩu tin apply
 * @param {any} email
 */
var generateApply = (email) => {
    return {
        CandidateEmail: email.toLowerCase(),
        AppliedDate: new Date(),
        ApplieDateUTC: utils.getUTCDate(new Date()),
        ApplyType: 1,
        Status: 0,
        CreatedOn: new Date(),
        CreatedBy: email,
        CreateOnUTC: utils.getUTCDate(new Date())

    }
}

/**
 * Ứng viên apply job
 * @param {any} email email ứng viên
 * @param {any} requisitionID requisition
 * @param {any} handler
 */
var candidateApplyJob = (email, recruiterCode, requisitionID, done) => {
    var findRequistionIndex = (db, handler) => {
        db.collection("ls_recruiters").aggregate([

            {
                $match: {
                    RecruiterCode: {
                        $regex:
                        new RegExp("^" + recruiterCode + "$", "i")
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
            if (err) handler(err);
            else {
                if (lst.length === 0) {
                    handler(undefined, undefined)
                }
                else {
                    var index = lst[0].index;
                    handler(undefined, index);
                }
            }
        });
    }
    /**
     * Kiểm tra xem đã apply hay chưa?
     * @param {any} db
     * @param {any} hanlder (err,true|false)
     */
    var hasApplied = (db, handler) => {
        db.collection("ls_recruiters").aggregate([
            {
                $match: {
                    RecruiterCode: {
                        $regex:
                        new RegExp("^" + recruiterCode + "$", "i")
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
                    Requisition: 1,
                    TypeOfCandidateApplyList: {
                        $type: "$Requisition.CandidateApplyList"
                    }
                }
            }, {
                $match: {
                    TypeOfCandidateApplyList: "array"
                }
            }, {
                $unwind: "$Requisition.CandidateApplyList"
            }, {
                $match: {
                    "Requisition.CandidateApplyList.CandidateEmail": {
                        $regex: new RegExp("^" + email + "$", "i")
                    }
                }
            }
        ]).toArray((err, lst) => {
            if (err) handler(err);
            else {
                if (lst.length === 0) {
                    handler(undefined, false)

                }
                else {

                    handler(undefined, true);
                }
            }
        });
    }
    var findCandidateApplyList = (db, handler) => {
        db.collection("ls_recruiters").aggregate([

            {
                $match: {
                    UserEmail: {
                        $regex:
                        new RegExp("^" + recruiterCode + "$", "i")
                    }
                }
            }, {
                $unwind: "$Requisition"
            }, {
                $match: {
                    "Requisition.RequisitionID": requisitionID
                }
            }

        ]).toArray((err, lst) => {
            if (err) handler(err);
            else {
                if (lst.length === 0) {
                    handler(undefined, undefined)

                }
                else {

                    handler(undefined, lst[0].Requisition.CandidateApplyList);
                }
            }
        });
    }

    DB.cnn((err, db) => {
        db.collection("ls_candidate").findOne({
            UserEmail: {
                $regex: new RegExp("^" + email + "$", "i")
            }
        }, (err, item) => {
            if (!err) {
                if (item === null) {
                    db.collection("ls_candidate")
                        .insertOne({
                            UserEmail: emai,
                            RecruiterReviews: [],
                            MarriageStatus: {},
                            Experience: [],
                            Degree: [],
                            Cer: [],
                            Desire: {
                                Location: {},
                                Job: {}
                            },
                            CurrentJob: {},
                            Location: {},
                            AllowSearch: false,
                            Nationality: {}



                        })
                }
            }
        });
    });
    DB.cnn((err, db) => {
        hasApplied(db, (err, ok) => {
            if (err) done(err)
            else {
                if (ok) {
                    done(undefined, {});
                }
                else {
                    findCandidateApplyList(db, (err, ApplyList) => {
                        if (err) done(err)
                        else {

                            findRequistionIndex(db, (err, RequitionIndex) => {
                                if (err) done(err);
                                else {
                                    if (!ApplyList) {
                                        var setter = {
                                            $set: {}
                                        };
                                        setter.$set["Requisition." + RequitionIndex + ".CandidateApplyList"] = [generateApply(email)];
                                        db.collection("ls_recruiters")
                                            .updateOne({
                                                RecruiterCode: {
                                                    $regex: new RegExp("^" + recruiterCode + "$", "i")
                                                }
                                            }, setter, done)
                                    }
                                    else {
                                        var push = {
                                            $push: {}
                                        }
                                        push.$push["Requisition." + RequitionIndex + ".CandidateApplyList"] = generateApply(email);
                                        db.collection("ls_recruiters")
                                            .updateOne({
                                                RecruiterCode: {
                                                    $regex: new RegExp("^" + recruiterCode + "$", "i")
                                                }
                                            }, {
                                                push
                                            }, done)
                                    }
                                }
                            })
                        }

                    })
                }
            }
        })
    });
};
/**
 * lấy danh sách các requisition của 1 kha
 * @param {any} recruiterCode
 * @param {any} filter
 * @param {any} language
 */
var getRequisitionOfCustomerByReruiterCode = (recruiterCode, filter, language) => {
    return new Promise(resolve => {
        try {
            DB.cnn((err, db) => {
                if (err) throw (err);
                else {
                    DB.aggregate(db, "ls_recruiters")
                        .match({
                            RecruiterCode: utils.createEqualRegExp(recruiterCode)
                        })
                        .unwind("Requisition")
                        .project([
                            'RequisitionID:Requisition.RequisitionID',
                            'GroupName:Requisition.Job.GroupName.' + language,
                            'JobName:Requisition.Job.JobName.' + language,
                            'LocationName:Requisition.Location.LocationName.' + language,
                            'ProvinceName:Requisition.Location.ProvinceName.' + language,
                            'NumOfStaff:Requisition.NumOfStaff',
                            'ReceiveTo:Requisition.NumOfStaff',
                            'RecruiterCode',
                            'PostDate:Requisition.PostDate',
                            'PublishDate:Requisition.PublishDate',
                            'FromDate:Requisition.ReceiveFrom',
                            'ToDate:Requisition.ReceiveTo',
                            'GroupCode:Requisition.Job.GroupCode',
                            'JobCode:Requisition.Job.JobCode',
                            'SalaryType:Requisition.SalaryType',
                            'Salary:Requisition.Salary',
                            'IsHot:Requisition.IsHot',
                            'LinkPhoto:Requisition.LinkPhoto',
                            'RecruiterName',
                            'Address',
                            'HitCount:Requisition.HitCount'
                        ])
                        .sort({
                            ToDate:-1
                        })
                        .skip(0)
                        .limit(50)
                        .done()
                        .then(list => {
                            resolve(list);
                        })
                        .catch(ex => {
                            throw (ex);
                        })
                }
            })
        }
        catch (ex) {
            throw (ex);
        }
    });
}
/**
 *
 * lấy chi tiết requisition theo mã KH và RequisitionID
 * @param {any} RecruiterCode
 * @param {any} RequisitionID
 * @param {any} language
 */
var getRequistionByRecruiterCodeAndRequisitionId = (RecruiterCode, RequisitionID,language) => {
    return new Promise(resolve => {
        DB.cnn((err, db) => {
            if (err) throw (ex);
            else {
                DB.aggregate(db, "ls_recruiters")
                    .match({
                        RecruiterCode: { $regex: utils.createEqualRegExp(RecruiterCode) }
                    })
                    .unwind("Requisition")
                    .match({
                        "Requisition.RequisitionID": RequisitionID
                    })
                    .project([
                        "RecruiterCode",
                        "RequisitionID:Requisition.RequisitionID",
                        "JobName:Requisition.Job.JobName." + language,
                        "GroupName:Requisition.Job.GroupName." + language,
                        'LocationName:Requisition.Location.LocationName.' + language,
                        'ProvinceName:Requisition.Location.ProvinceName.' + language,
                        "Description:Requisition.Description." + language,
                        "OverView:OverView." + language,
                        "SalaryType:Requisition.SalaryType",
                        "Salary:Requisition.Salary",
                        "IsHot:Requisition.IsHot",
                        "PublishDate:Requisition.PublishDate",
                        "PhotoLink:Requisition.LinkPhoto",
                        "ReceiveFrom:Requisition.ReceiveFrom",
                        "ReceiveTo:Requisition.ReceiveTo",
                        "HitCount:Requisition.HitCount"

                    ])
                    .done()
                    .then(list => {
                        if (list.length == 0) {
                            resolve({})
                        }
                        else {
                            resolve(list[0])
                        }
                    })
                    .catch(ex => {
                        throw (ex);
                    })
            }
        })
    })
}
var findJobs = (event) => {
    utils._try(() => {

        var clientData = utils.readData(event);
        var pageIndex = parseInt(clientData["pageIndex"]) || 0;
        var numberItem = parseInt(clientData["numberItem"]) || 0;
        var user = clientData["user"] || null;
        var jobGroup = clientData["job-group"] || "all";
        var job = clientData["job"] || "all";
        var location = clientData.location || "all";
        var recruitercode = clientData.recruitercode || "all";
        var bytype = clientData.bytype || "byDate";
        var jobsChecked = clientData.jobsChecked || [job];
        var locationChecked = clientData.locationChecked || [location];
        var levelsChecked = clientData.levelsChecked;
        var companyChecked = clientData.companyChecked || [recruitercode];
        var salary = clientData.salary || 0;
        var filter = {
            emailuser: user,
            numberItem: numberItem,
            content: unescape(clientData.content),
            recruiterCode: clientData.recruitercode,
            sortType: clientData.bytype,
            jobs: clientData.jobsChecked,
            locations: clientData.locationChecked,
            levels: levelsChecked,
            recruiters: companyChecked,
            salary: salary,
            pageIndex: pageIndex
        }
        findRequisition(filter, utils.getCurrentLanguageCode(event), (err, lst) => {
            if (err) event.done(err);
            else {
                utils.writeData(event, lst)
                event.done();
            }
        });
    }, event);
}
module.exports = {
    getListOfTopRequistion: getListOfTopRequistion,
    getTotalRequisition: getTotalRequisition,
    findRequisition: findRequisition,
    getTotalItemsRequisition: getTotalItemsRequisition,
    getRequisitionForCandidate: getRequisitionForCandidate,
    candidateApplyJob: candidateApplyJob,
    getRequisitionOfCustomerByReruiterCode: getRequisitionOfCustomerByReruiterCode,
    getRequistionByRecruiterCodeAndRequisitionId: getRequistionByRecruiterCodeAndRequisitionId,
    findJobs: findJobs
}