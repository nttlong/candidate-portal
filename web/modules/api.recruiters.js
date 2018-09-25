const models = require("./../modules/lv.model");
const utils = require("./../libs/lv.utils");
const api_public = require("./api_public");
var sync = require('sync');
const FS = require('fs');
const logs = require("./../libs/lv.logs");
const Data = require("./lv.db");

require("./api/post_requisition")
var handlerError = (reject, callback, err) => {
    if (callback) callback(err);
    else reject(err);
};
var handler = (resolve, callback, data) => {
    if (callback) callback(data);
    else resolve(data);
};
api_public.createApi("get_access_token")
    .setDescription("This api use for recruiter information extraction")
    .setBody(sender => {

        sync(() => {
            try {
                var data = sender.params;

                var recuiter = models.ls_recruiters()
                    .where("ClientEndPointService.AppId==AppId", sender)
                    .toItem.sync();

                if (!recuiter) {
                    sender.error({
                        error: {
                            code: "VER01",
                            description: "Inavlid AppId or recuiter was not found"
                        }
                    });
                    return;
                }

                var ret = models.sys_api_access_token()
                    .insert({

                        Code: recuiter.RecruiterCode,
                        Id: recuiter._id

                    }).commit.sync();
                var token = JSON.parse(JSON.stringify(ret._id));
                sender.done({
                    AccessToken: token,
                    Code: recuiter.RecruiterCode,
                    Name: recuiter.RecruiterName,
                    CreatedOn: recuiter.CreatedOn,
                    AdminEmail: recuiter.UserEmail,
                    LogoPath: utils.getRootUrl(sender.server.req) + "/photo/logo/" + recuiter.RecruiterCode + ".png"

                });

            }
            catch (ex) {
                logs.info("clientData", ex);
                sender.error(ex);
            }
        })

    })
    .setReturnInfo("AccessToken", "text", "Token for operatoion")
    .setReturnInfo("Code", "text", "Code of recruiter")
    .setReturnInfo("Name", "text", "Name of recruiter")
    .setReturnInfo("LogoPath", "text", "hyperlink to logo of recruiter")
    .regist(module);
api_public.createApi("get_list_of_requistion")
    .setDescription("This api use for get list of requisition of recruiter according on App Id and access Token")
    .setParamInfo("pageIndex", "number", false, "page index")
    .setParamInfo("pageSize", "number", true, "num of items per page")
    .setReturnInfo("items", "array", "List of requisition")
    .setReturnInfo("totalItems", "number", "total items of requisition of recruiter")
    .setBody(sender => {
        try {
            sender.params.pageIndex = sender.params.pageIndex || 0;
            var items = models.ls_requisition()
                .where("RecruiterId==_id", sender.server.recruiter)
                .skip(sender.params.pageIndex * sender.params.pageSize)
                .limit(sender.params.pageSize)
                .toArray.sync();
            var totalItems = models.ls_requisition()
                .where("RecruiterId==_id", sender.server.recruiter)
                .count.sync();
            sender.done({
                items: items,
                totalItems: totalItems
            });
        }
        catch (ex) {
            sender.error(ex);
        }


    })
    .regist(module);
api_public.createApi("post_requisition")
    .setDescription("This api create new requisition")
    .setParamInfo("Code", "text", true, "Code of requisition")
    .setParamInfo("Job.GroupCode", "text", false, "Code of Job Type")
    .setParamInfo("Job.GroupName.en", "text", false, "Name of job type in English")
    .setParamInfo("Job.GroupName.vn", "text", false, "Name of job type in Vietnamese")
    .setParamInfo("Job.JobCode", "text", false, "Code of Job")
    .setParamInfo("Job.JobName.en", "text", false, "Name of Job in English")
    .setParamInfo("Job.JobName.vn", "text", false, "Name of Job in Vietnamese")
    .setParamInfo("ExperienceLevel.Code", "text", false, "Code of level")
    .setParamInfo("ExperienceLevel.Name.en", "text", false, "Name of level in English")
    .setParamInfo("ExperienceLevel.Name.vn", "text", false, "Name of level in Vietnamese")
    .setParamInfo("Locations", "array", false, "List of location for recruitement")
    .setParamInfo("Locations.Code", "text", false, "Code of location for recruitement")
    .setParamInfo("Locations.Name.en", "text", false, "English name of location for recruitement")
    .setParamInfo("Locations.Name.vn", "text", false, "Vietnamese name of location for recruitement")
    .setParamInfo("Locations.Name.vn", "text", false, "Vietnamese name of location for recruitement")
    .setParamInfo("Locations.Provinces.Code", "text", false, "Code of province in each location")
    .setParamInfo("Locations.Provinces.Name.en", "text", false, "English name of province in each location")
    .setParamInfo("Locations.Provinces.Name.vn", "text", false, "Vietnamese name of province in each location")
    .setParamInfo("Locations.Provinces.Name.vn", "text", false, "Vietnamese name of province in each location")
    .setParamInfo("JobTitle", "text", true, "Job title of requisition")
    .setParamInfo("Requirements.vn", "text", false, "requisition requirement in Vietnamese")
    .setParamInfo("Requirements.en", "text", false, "requisition requirement in English")
    .setParamInfo("Description.en", "text", true, "Job description in English")
    .setParamInfo("Description.vn", "text", true, "Job description in Vietnamese")
    .setParamInfo("NumOfStaff", "number", true, "The number of person that recruiter is looking for hire")
    .setParamInfo("SalaryType", "number", true, "The advertising salary range in 0,1,2 (0:negotiative, 1: start at, 2: competetion)")
    .setReturnInfo("ID", "text", "ID of requisition if post is successfull")
    .setBody(sender => {
        try {
            var data = sender.params;
            var recruiter = models.ls_recruiters()
                .where("UserEmail==UserEmail", sender.server.recruiter).toItem.sync();
            data.ReceiveFrom = new Date(data.ReceiveFrom);
            data.ReceiveTo = new Date(data.ReceiveTo);
            data.PublishDate = new Date();
            data.RecruiterId = sender.server.recruiter._id;
            data.RecieverEmail = recruiter.ContactInfo.Email;
            data.RecieverContact = recruiter.ContactInfo.ContactName;
            var ret = models.ls_requisition()
                .insert(data)
                .commit.sync();
            sender.done({ ID: ret._id })
        }
        catch (ex) {
            if (ex.isUnique &&
                (ex.fields.indexOf("Code") > -1)) {
                sender.error({
                    code: "DUP001",
                    message: "'Code' of requisition is already to use",
                    param: "Code"
                });
            }
            else {
                sender.error(ex);
            }
        }
    }).regist(module);

api_public.createApi("get_list_requisition_ats_to_cp")
    .setDescription("Api lấy các Requisiton được posting từ ATS lên CP")
    .setParamInfo("pageIndex", "number", false, "page index")
    .setParamInfo("pageSize", "number", true, "num of items per page")
    .setReturnInfo("items", "array", "List of requisition")
    .setBody(sender => {
        try {
            var items = models.ls_requisition()
                .where("IsFromATS==true", { true: true })
                .toArray.sync();
            sender.done({
                items: items
            });
        }
        catch (ex) {
            sender.error(ex);
        }
    }).regist(module);

api_public.createApi("get_uv_apply_requisition_ats_to_cp")
    .setParamInfo("pageIndex", "number", false, "page index")
    .setDescription("Lấy danh sách ứng viên đã apply vào Job posting từ ATS lên CP")
    .setReturnInfo("items", "array", "List of requisition")
    .setBody(sender => {
        //Data.cnn((err, db) => {
        //    try {
        //        var data_requisition = db.collection("ls_requisition")
        //            .aggregate([
        //                {
        //                    "$match": {
        //                        "IsFromATS": true
        //                    }
        //                }, {
        //                    "$unwind": "$CandidateApplyList"
        //                }
        //            ]).toArray.sync();
        //        sender.done({
        //            items: data_requisition
        //        });
        //    }
        //    catch (ex) {
        //        sender.error(ex);
        //    }
        //})
        try {
            var items = models.ls_requisition()
                .where("IsFromATS==true", { true: true })
                .unwind("CandidateApplyList")
                .select({
                    "Code": 1,
                    "JobWCode": 1,
                    "CandidateApplyList": 1
                })
                .toArray.sync();
            sender.done({
                items: items
            });
        }
        catch (ex) {
            sender.error(ex);
        }
    }).regist(module);


api_public.createApi("get_uv_by_email")
    .setParamInfo("candidateEmail", "text", true, "UserEmail cua ung vien")
    .setDescription("Lấy ứng viên từ Email")
    .setReturnInfo("items", "item", "User")
    .setBody(sender => {
        try {
            var data = sender.params;
            var userEmail = data.candidateEmail;
            var items = models.ls_candidate()
                .where("UserEmail==email", { email: userEmail })
                .select({
                    "UserEmail": 1,
                    "BirthDate": 1,
                    "Mobile": 1,
                    "Nationality": 1,
                    "Sex": 1,
                    "MarriageStatus": 1,
                    "Location": 1,
                    "FullAddress": 1,
                    "Degree": 1,
                    "Cer": 1
                })
                .toItem.sync();
            sender.done({
                items: items
            });
        }
        catch (ex) {
            sender.error(ex);
        }
    }).regist(module);


api_public.createApi("get_sys_user_by_email")
    .setParamInfo("candidateEmail", "text", true, "UserEmail cua ung vien")
    .setDescription("Lấy ứng viên sys_user theo Email")
    .setReturnInfo("items", "item", "User")
    .setBody(sender => {
        try {
            var data = sender.params;
            var userEmail = data.candidateEmail;
            var items = models.sys_Users()
                .where("Email==email", { email: userEmail })
                .select({
                    "LastName": 1,
                    "FirstName": 1
                })
                .toItem.sync();
            sender.done({
                items: items
            });
        }
        catch (ex) {
            sender.error(ex);
        }
    }).regist(module);


api_public.createApi("post_data_vong_tuyen_dung")
    .setDescription("This api đẩy vòng tuyển dụng lên candidate")
    .setReturnInfo("ID", "text", "ID of requisition if post is successfull")
    .setBody(sender => {
        try {
            var data = sender.params;
            data.RecruiterId = sender.server.recruiter._id;

            var index = -1;
            Data.cnn((err, db) => {
                if (err) event.done(err);
                else {
                    var code = sender.params.candidateEmail ? sender.params.candidateEmail.Code : sender.params.Code;
                    var Email = sender.params.candidateEmail ? sender.params.candidateEmail.Email : sender.params.Email;
                    var data_post = sender.params.candidateEmail ? sender.params.candidateEmail.DataPush.recordset : sender.params.DataPush;
                    index = db.collection("ls_requisition").aggregate([
                        {
                            $match: {
                                Code: code
                            }
                        }, {
                            $project: {
                                index: {
                                    $indexOfArray: ["$CandidateApplyList.CandidateEmail", Email]
                                }
                            }
                        }
                    ]).toArray((err, list) => {
                        var str = "CandidateApplyList." + list[0].index + ".Tasks";
                        var push = {};
                        push["$push"] = {};

                        for (var i = 0; i < data_post.length; i++) {
                            push["$push"][str] = data_post[i];
                            db.collection("ls_requisition").update({
                                Code: code
                            }, push);
                        }
                        sender.done({
                            items: list
                        });
                    })
                }
            });

        }
        catch (ex) {
            if (ex.isUnique &&
                (ex.fields.indexOf("Code") > -1)) {
                sender.error({
                    code: "DUP001",
                    message: "'Code' of requisition is already to use",
                    param: "Code"
                });
            }
            else {
                sender.error(ex);
            }
        }
    }).regist(module);

api_public.createApi("update_requisition_statusresult")
    .setDescription("This api update trường StatusResult khi save đổi kết quả từ ATS lên CP")
    .setReturnInfo("ID", "text", "ID of requisition if post is successfull")
    .setBody(sender => {
        try {
            Data.cnn((err, db) => {
                if (err) event.done(err);
                else {
                    var code = sender.params.Code;
                    var Email = sender.params.Email;
                    var CodeStepMonitorIdTask = sender.params.CodeStepMonitorIdTask;
                    var StatusResult = sender.params.StatusResult;
                    var Status = sender.params.Status;
                    db.collection("ls_requisition").aggregate([
                        {
                            $match: {
                                Code: code
                            }
                        }, {
                            $project: {
                                index: {
                                    $indexOfArray: ["$CandidateApplyList.CandidateEmail", Email]
                                }
                            }
                        }
                    ]).toArray((err, indexOfCandidateEmail) => {
                        var _sts;
                        if (StatusResult == 2) {
                            _sts = 5;
                        } else if (StatusResult == 3) {
                            _sts = 6;
                        }



                        if (_sts) {
                            var str = "CandidateApplyList." + indexOfCandidateEmail[0].index + ".Status";
                            var push = {};
                            push["$set"] = {};
                            push["$set"][str] = _sts;

                            db.collection("ls_requisition").update(
                                {
                                    Code: code
                                }, push
                            );
                        } else {

                        }

                        db.collection("ls_requisition").aggregate([
                            {
                                $match: {
                                    Code: code
                                }
                            }, {
                                $project: {
                                    "CandidateApplyList": 1
                                }

                            }, {
                                $unwind: "$CandidateApplyList"
                            }, {
                                $match: { "CandidateApplyList.CandidateEmail": Email }
                            }, {
                                $replaceRoot: {
                                    newRoot: "$CandidateApplyList"
                                }
                            }, {
                                $project: {
                                    index: {
                                        $indexOfArray: ["$Tasks.CodeStepMonitorIdTask", CodeStepMonitorIdTask]
                                    }
                                }
                            }
                        ]).toArray((err, indexOfCandidateTask) => {
                            var str = "CandidateApplyList." + indexOfCandidateEmail[0].index + ".Tasks." + indexOfCandidateTask[0].index + ".Result";

                            var push = {};
                            push["$set"] = {};
                            push["$set"][str] = Status;

                            db.collection("ls_requisition").update(
                                {
                                    Code: code
                                }, push
                            )
                            sender.done({
                                items: indexOfCandidateTask
                            });
                        })
                    })
                }
            });

        }
        catch (ex) {
            if (ex.isUnique &&
                (ex.fields.indexOf("Code") > -1)) {
                sender.error({
                    code: "DUP001",
                    message: "'Code' of requisition is already to use",
                    param: "Code"
                });
            }
            else {
                sender.error(ex);
            }
        }
    }).regist(module);


api_public.createApi("update_requisition_candidateapply_status")
    .setDescription("This api update trường StatusResult khi save đổi kết quả từ ATS lên CP")
    .setReturnInfo("ID", "text", "ID of requisition if post is successfull")
    .setBody(sender => {
        try {
            Data.cnn((err, db) => {
                if (err) event.done(err);
                else {
                    var code = sender.params.Code;
                    var Email = sender.params.Email;
                    var CodeStepMonitorIdTask = sender.params.CodeStepMonitorIdTask;
                    var StatusResult = sender.params.StatusResult;
                    var IsInterview = sender.params.IsInterview;
                    db.collection("ls_requisition").aggregate([
                        {
                            $match: {
                                Code: code
                            }
                        }, {
                            $project: {
                                index: {
                                    $indexOfArray: ["$CandidateApplyList.CandidateEmail", Email]
                                }
                            }
                        }
                    ]).toArray((err, indexOfCandidateEmail) => {
                        db.collection("ls_requisition").aggregate([
                            {
                                $match: {
                                    Code: code
                                }
                            }, {
                                $project: {
                                    "CandidateApplyList": 1
                                }

                            }, {
                                $unwind: "$CandidateApplyList"
                            }, {
                                $match: { "CandidateApplyList.CandidateEmail": Email }
                            }, {
                                $replaceRoot: {
                                    newRoot: "$CandidateApplyList"
                                }
                            }, {
                                $project: {
                                    index: {
                                        $indexOfArray: ["$Tasks.CodeStepMonitorIdTask", CodeStepMonitorIdTask]
                                    }
                                }
                            }
                        ]).toArray((err, indexOfCandidateTask) => {
                            var str = "CandidateApplyList." + indexOfCandidateEmail[0].index + ".Tasks." + indexOfCandidateTask[0].index + ".Status";
                            var strIn = null;
                            if (IsInterview) {
                                "CandidateApplyList." + indexOfCandidateEmail[0].index + ".Tasks." + indexOfCandidateTask[0].index + ".IsInterview";
                            }
                            var push = {};
                            push["$set"] = {};
                            push["$set"][str] = StatusResult;
                            if (strIn) {
                                push["$set"][strIn] = true;
                            }
                            db.collection("ls_requisition").update(
                                {
                                    Code: code
                                }, push
                            )
                            sender.done({
                                items: indexOfCandidateTask
                            });
                        })
                    })
                }
            });

        }
        catch (ex) {
            if (ex.isUnique &&
                (ex.fields.indexOf("Code") > -1)) {
                sender.error({
                    code: "DUP001",
                    message: "'Code' of requisition is already to use",
                    param: "Code"
                });
            }
            else {
                sender.error(ex);
            }
        }
    }).regist(module);


api_public.createApi("update_requisition_candidate_apply_status")
    .setDescription("This api update trường StatusResult khi save đổi kết quả từ ATS lên CP")
    .setReturnInfo("ID", "text", "ID of requisition if post is successfull")
    .setBody(sender => {
        try {
            Data.cnn((err, db) => {
                if (err) event.done(err);
                else {
                    var code = sender.params.Code;
                    var Email = sender.params.Email;
                    var Status = sender.params.Status;
                    db.collection("ls_requisition").aggregate([
                        {
                            $match: {
                                Code: code
                            }
                        }, {
                            $project: {
                                index: {
                                    $indexOfArray: ["$CandidateApplyList.CandidateEmail", Email]
                                }
                            }
                        }
                    ]).toArray((err, indexOfCandidateEmail) => {
                        var str = "CandidateApplyList." + indexOfCandidateEmail[0].index + ".Status";
                        var push = {};
                        push["$set"] = {};
                        push["$set"][str] = Status;

                        db.collection("ls_requisition").update(
                            {
                                Code: code
                            }, push
                        );
                    })
                }
            });

        }
        catch (ex) {
            if (ex.isUnique &&
                (ex.fields.indexOf("Code") > -1)) {
                sender.error({
                    code: "DUP001",
                    message: "'Code' of requisition is already to use",
                    param: "Code"
                });
            }
            else {
                sender.error(ex);
            }
        }
    }).regist(module);





