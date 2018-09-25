const models = require("./lv.model");
var ENTITIES = require("./../libs/lv.entity");
const utils = require("./../libs/lv.utils");
const Jimp = require("jimp");
const contentDisposition = require('content-disposition');
const aut = require("./../libs/lv.authenticate");
const FS = require("fs");
/**
 * Lấy hình của ứng viên
 * @param {any} event
 */
var getCandidatePhoto = (event) => {
    utils._try(() => {
        try {
            var UserId = event.req.routeInfo.params.UserId;
            if (!global.cache) global.cache = {};
            if (!global.cache.photo) global.cache.photo = {};
            if (!global.cache.photo.candidate) global.cache.photo.candidate = {};
            if (!global.cache.photo.candidate[UserId]) {
                var userPhoto = models.sys_Users()
                    .where("UserId", UserId)
                    .lookup("ls_candidate", "Email", "UserEmail", "candidate")
                    .unwind("candidate")
                    .select({ Photo: "candidate.Photo" })
                    .toItem.sync();
                if (userPhoto && userPhoto.Photo) {
                    global.cache.photo.candidate[UserId] = userPhoto.Photo;
                    utils.writeImage(event, global.cache.photo.candidate[UserId]);
                }
                else {
                    if (!global.cache.photo.candidate.emptyPhoto) {
                        var data = FS.readFile.sync(null, "./app_data/data/EmployeeMan.png");
                        global.cache.photo.candidate.emptyPhoto ="data:image/png;base64,"+(new Buffer(data)).toString('base64');
                    }
                    //utils.writeJSON(event, {});
                    utils.writeImage(event, global.cache.photo.candidate.emptyPhoto);
                }
            }
            else {
                utils.writeImage(event, global.cache.photo.candidate[UserId], "CandidatePhoto" + UserId);
                event.done();
            }
        } catch (e) {
            event.done({ message: e.message || e });
        }
    }, event);
    

}
/**
 * Lấy hình của requisition
 * @param {any} event
 */
var getRequisitionPhoto = (event) => {
    utils._try(() => {
        try {
            var RequisitionId = event.req.routeInfo.params.RequisitionID;
            if (!global.cache) global.cache = {};
            if (!global.cache.photo) global.cache.photo = {};
            if (!global.cache.photo.requisition) global.cache.photo.requisition = {};
            if (!global.cache.photo.requisition[RequisitionId]) {
                var reqPhoto = models.ls_requisition()
                    .where("_id", utils.objectID(RequisitionId))
                    .select({ Photo: "Photo" })
                    .toItem.sync();
                if (reqPhoto && reqPhoto.Photo) {
                    global.cache.photo.requisition[RequisitionId] = reqPhoto.Photo;
                    utils.writeImage(event, global.cache.photo.requisition[RequisitionId]);
                }
                else {
                    if (!global.cache.photo.requisition.emptyPhoto) {
                        var data = FS.readFile.sync(null, "./app_data/data/NoImage.png");
                        global.cache.photo.requisition.emptyPhoto = "data:image/png;base64," + (new Buffer(data)).toString('base64');
                    }
                    //utils.writeJSON(event, {});
                    utils.writeImage(event, global.cache.photo.requisition.emptyPhoto);
                }
            }
            else {
                var reqPhoto = models.ls_requisition()
                    .where("_id", utils.objectID(RequisitionId))
                    .select({ Photo: "Photo" })
                    .toItem.sync();
                if (reqPhoto && reqPhoto.Photo) {
                    global.cache.photo.requisition[RequisitionId] = reqPhoto.Photo;
                    utils.writeImage(event, global.cache.photo.requisition[RequisitionId]);

                } else {
                    utils.writeImage(event, global.cache.photo.requisition[RequisitionId], "RequisitionPhoto" + RequisitionId);
                    event.done();
                }
                
            }
        } catch (e) {
            event.done({ message: e.message || e });
        }
    }, event);


}
/**
 * Download attachment của task
 * @param {any} event
 */
var getAttachmentOfTask = (event) => {
    var taskId = event.req.routeInfo.params.taskId;
    models.ls_requisition()
        .unwind("CandidateApplyList")
        .unwind("CandidateApplyList.Tasks")
        .where("CandidateApplyList.Tasks.TaskID", utils.objectID(taskId))
        .select({
            AttachmentFileContent: "CandidateApplyList.Tasks.AttachmentFileContent",
            AttachmentFileName: "CandidateApplyList.Tasks.AttachmentFileName"
        })
        .toItem((err, result) => {
            if (result && result.AttachmentFileContent) {

                utils.downLoad(event, result.AttachmentFileContent, result.AttachmentFileName)
            }
            else {
                event.done();
            }
        })
}
/**
 * Download excel data từ sys_export_token
 * @param {any} event
 */
var exportExcel = (event) => {
    utils._try(() => {
        try {
            var token = event.req.routeInfo.params.token;
            var item = models.sys_export_token()
                .where("_id==id", { id: utils.objectID(token) })
                .toItem.sync();
            if (item === null) {
                event.res.redirect(utils.getRootUrl(event.req) + "invalid-request");
                event.done();
                return;
            }

            var db = ENTITIES.getConnect.sync();
            var op = (item.Operators) ? JSON.parse(item.Operators) : [];
            op = JSON.parse(op);
            for (var i = 0; i < op.length; i++) {
                if (Object.keys(op[i]).indexOf("$match") > -1) {
                    if (Object.keys(op[i]["$match"]).indexOf("_id") > -1) {
                        op[i]["$match"]["_id"] = utils.objectID(op[i]["$match"]["_id"]);
                    }
                }
            }
            db.collection(item.Source)
                .aggregate(op)
                .toArray((err, list) => {
                    utils.downLoadExcel(event, list, item.FileName, err => {
                        event.done();
                    });

                });


        }
        catch (ex) {
            event.res.redirect(utils.getRootUrl(event.req) + "invalid-request");
            event.done();
        }

    }, event);
}
var captcha = (event) => {
    utils._try(() => {
        var len = Math.floor(Math.random() * 2) + 4;
        var image = new Jimp(len * 70, 80, 0xFFFFFFFF, function (err, image) {
            var txt = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM123456789";

            Jimp.loadFont(Jimp.FONT_SANS_32_BLACK).then(function (font) {
                var x = 5;
                var retTxt = "";
                for (var i = 0; i < len; i++) {
                    var m = new Jimp(80, 80, 0xFFFFFFFF);
                    var index = Math.floor(1 + Math.random() * txt.length);
                    var S = txt[index];
                    var a = Math.floor((Math.random() > 0.5) ? ((-1) * Math.random() * 25) : (Math.random() * 25));

                    m.print(font, 0, 0, S);
                    m.rotate(a, true);

                    var dx = x - Math.sin(a) * 32 + 10;
                    var dy = - Math.cos(a) * 32 + 10;
                    x += 40;
                    m.posterize(Math.random() * 100);
                    m.sepia();
                    if (Math.random() > 0.5) {
                        m.invert();
                        image.blit(m, x, 0);

                    }
                    else {
                        image.composite(m, x, 0);
                    }


                    retTxt += S;
                }
                image.getBase64(Jimp.MIME_PNG, (err, data) => {
                    if (err) {
                        event.done(err);
                    }
                    else {
                        if (!global.http_session) global.http_session = {};
                        if (!global.http_session[event.req.sessionID]) global.http_session[event.req.sessionID] = {};
                        global.http_session[event.req.sessionID].captcha = retTxt;
                        utils.writeData(event, { data: data });
                        event.done();
                    }
                });
            })
                .catch(ex => {
                    event.done(err);
                });
        });
    }, event);

}
var getCaptchaContent = (reqOrEvent) => {
    var req = reqOrEvent.req || reqOrEvent;
    if (!global.http_session) global.http_session = {};
    if (!global.http_session[req.sessionID]) global.http_session[req.sessionID] = {};
    return global.http_session[req.sessionID].captcha;
};
/**
 * Download candidate cv attach file xem route:~/attachments/candidate/vc/{UserId}
 * @param {any} event
 */
var downloadCandidateCVAttachment = (event) => {
    utils._try(() => {
        try {
            var userId = event.req.routeInfo.params.UserId;
            var viewUser = models.sys_Users()
                .where("UserId==userId", { userId: userId })
                .toItem.sync();
            if (!viewUser) {
                event.res.end("invalid request")
                event.done();
                return;
            }
            var user = aut.getUser(event.req);
            if (!user) {
                var rooturl = utils.getRootUrl(event.req);
                event.res.redirect(utils.toAbsUrl(event, "account/login") + "?retUrl=" + utils.toAbsUrl(event, event.req.url));
                event.done();
                return;
            }

            if (user.Email.toLowerCase() != viewUser.Email.toLowerCase()) {
                var recruiter = models.ls_recruiters()
                    .where("UserEmail==Email", user)
                    .toItem.sync();
                if (!recruiter) {
                    event.res.end("invalid request")
                    event.done();
                    return;
                }
                var count = models.ls_requisition()
                    .where("(RecruiterId==id)and(CandidateApplyList.CandidateEmail==email)", {
                        id: recruiter._id,
                        email: viewUser.Email
                    }).count.sync();
                if (count == 0) {
                    count = models.ls_candidate()
                        .where("(UserEmail==Email)and(AllowSearch==IsAllowSearch)", {
                            Email: viewUser.Email,
                            IsAllowSearch: true
                        }).count.sync();
                    if (count == 0) {
                        utils.writeData(event, "Invalid request");
                        event.done();
                        return;
                    }
                }
            }
            var cvData = models.ls_candidate()
                .where("UserEmail==Email", viewUser)
                .select({ CV_Attachment: 1 })
                .toItem.sync();
            if (!cvData) {
                event.res.end("invalid request or resource was not found")
                event.done();
                return;
            }
            if (cvData.CV_Attachment) {
                utils.downLoad(event, cvData.CV_Attachment.Data, cvData.CV_Attachment.FileName);
                event.done();
                return;
            }
            event.res.end("invalid request or resource was not found")
            event.done();

        } catch (ex) {
            event.done(ex);
        }
    }, event);
}
/**
 * Download cv của ứng viên khi nộp đơn bằng opt 3 (nộp file khác cv)
 */
var downloadCandidateCVUpLoad = (event) => {
    utils._try(() => {
        try {
            var userId = event.req.routeInfo.params.UserId;
            var requisition = event.req.routeInfo.params.Requisition;
            var reqCode = models.ls_requisition()
                .where("_id==code", { code: utils.objectID(requisition) });
            var viewUser = models.sys_Users()
                .where("UserId==userId", { userId: userId })
                .toItem.sync();
            if (!viewUser) {
                event.res.end("invalid request")
                event.done();
                return;
            }
            if (!reqCode) {
                event.res.end("invalid request")
                event.done();
                return;
            }
            var user = aut.getUser(event.req);
            if (!user) {
                var rooturl = utils.getRootUrl(event.req);
                event.res.redirect(utils.toAbsUrl(event, "account/login") + "?retUrl=" + utils.toAbsUrl(event, event.req.url));
                event.done();
                return;
            }
            var dataRequisition = models.ls_requisition()
                .where("_id==code", { code: utils.objectID(requisition) })
                .unwind("CandidateApplyList")
                .where("CandidateApplyList.CandidateEmail==email", { email: viewUser.Email })
                .toItem.sync();
            if (!dataRequisition) {
                event.res.end("invalid request")
                event.done();
                return;
            } else {
                utils.downLoad(event, dataRequisition.CandidateApplyList.dataFile, dataRequisition.CandidateApplyList.fileName);
                event.done();
                return;
            }
            event.res.end("invalid request or resource was not found")
            event.done();
        } catch (ex) {
            event.done(ex);
        }
    }, event);
}
module.exports = {
    getCandidatePhoto: getCandidatePhoto,
    getRequisitionPhoto: getRequisitionPhoto,
    getAttachmentOfTask: getAttachmentOfTask,
    exportExcel: exportExcel,
    captcha: captcha,
    getCaptchaContent: getCaptchaContent,
    downloadCandidateCVAttachment: downloadCandidateCVAttachment,
    downloadCandidateCVUpLoad: downloadCandidateCVUpLoad
}