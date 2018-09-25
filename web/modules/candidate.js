const utils = require("./../libs/lv.utils");
const categories = require("./../modules/node.sys.categories"); 
const aut = require("./../libs/lv.authenticate");
const Data = require("./../modules/lv.db");
const models = require("./../modules/lv.model");
const EMAIL = require("./../modules/node.Email")
/**
 * Ứng viên applu job
 * @param {any} event
 */
var apply_job = (event) => {
    utils._try(() => {
        try {
            var clientData = utils.readData(event);
            var user = aut.getUser(event.req);
            var appliedCount = models.ls_requisition()
                .where("(_id==id)and(CandidateApplyList.CandidateEmail==email)",
                {
                    id: utils.objectID(clientData.id),
                    email: user.Email
                })
                .count.sync();
            if (appliedCount > 0) {
                utils.writeData(event, { apiError: { errorType: "OperatorIsAlready" } });
                event.done();
                return;
            }

            var dataPush = {};
            dataPush.CandidateEmail = user.Email;
            dataPush.AppliedDate = new Date();
            dataPush.AppliedDateUTC = utils.getUTCDate(new Date());
            dataPush.ApplyType = clientData.type;
            dataPush.Status = 0;

            if (clientData.type == 1 && !clientData.dataF) {
                utils.writeData(event, { apiError: { errorType: "NoCv" } });
                event.done();
                return;
            }

            if (clientData.type == 3) {
                dataPush.dataFile = clientData.dataFile;
                dataPush.fileName = clientData.fileName;
            }

            models.ls_requisition()
                .where("_id==id", { id: utils.objectID(clientData.id) })
                .push("CandidateApplyList", dataPush).commit.sync();
            models.ls_requisition()
                .where("_id==id", { id: utils.objectID(clientData.id) })
                .inc("TotalApplyCandidate")
                .commit.sync();

            var requisition = models.ls_requisition()
                .where("_id==id", { id: utils.objectID(clientData.id) })
                .toItem.sync();
            if (!requisition) {
                utils.writeData(event, {});
                event.done();
                return;

            }
            var recruiter = models.ls_recruiters()
                .where("_id==RecruiterId", requisition)
                .toItem.sync();
            if (!recruiter) {
                utils.writeData(event, {});
                event.done();
                return;
            }
            if (!utils.isEmail(recruiter.UserEmail)) {
                utils.writeData(event, {});
                event.done();
                return;
            }
            var recruiterUser = models.sys_Users()
                .where("Email==UserEmail", recruiter)
                .toItem.sync();
            
            var sysConfig = models.sys_global_language_setting().toItem.sync();
            if (!sysConfig.DefaultLanguageCode) {
                sysConfig.DefaultLanguageCode = "vn";
                models.sys_global_language_setting().set({ DefaultLanguageCode: "vn" }).commit();

            }
            if (!recruiterUser.Settings) recruiterUser.Settings = {};
            if (!recruiterUser.Settings.DefaultLanguage) {
                recruiterUser.SettingsDefaultLanguage = "vn";
                models.sys_Users()
                    .set("Settings.DefaultLanguage", "vn")
                    .commit();
            }

            var lan = requisition.LanguageCV;
            if (lan === "any" || !lan) {
                lan = recruiterUser.Settings.DefaultLanguage;
            }
            var candidate = {
                FullName: user.FirstName + " " + user.LastName,
                FirstName: user.FirstName,
                LastName: user.LastName,
                UserId: user.UserId
            }
            recruiterUser.FullName = recruiterUser.FirstName + " " + recruiterUser.LastName;
            var dataForEmail = {
                candidate: candidate,
                requisition: requisition,
                RootUrl: utils.getRootUrl(event.req),
                LinkToJob: utils.getRootUrl(event.req) + "/job/" + recruiter.RecruiterCode + "/" + requisition.Job.GroupCode + "/" + requisition.Job.Code + "/" + eval(JSON.stringify(requisition._id)),
                LinkToCandidate: utils.getRootUrl(event.req) + "/candidate/myresume/" + user.UserId,
                recruiterUser: recruiterUser,
                AppliedDate:new Date()
            }
            var defSubject = "v/v Ứng viên {{candidate.FullName}} đã apply job {{requisition.Code}}";
            var defBody = "Hi {{recruiterUser.FullName}},<br>" +
                "Đã có ứng viên {{candidate.FullName}} apply job vào lúc {{AppliedDate}}, với mã đăng tuyển là {{requisition.Code}}, " +
                "xem chi tiết của đăng tuyển tại <a href=\"{{LinkToJob}}\">{{LinkToJob}}</a> " +
                "và xem chi tiết hồ sơ ứng viên tại <a href=\"{{LinkToCandidate}}\">{{LinkToCandidate}}</a><br/>" +
                "Chân thành cảm ơn";
            var emailTemplate = EMAIL.getTemplate.sync(null, "CandidateApply", undefined, defSubject, defBody, dataForEmail, "Template email gởi về cho nhà truyển dụng mỗi khi ứng viên apply job");
            var ret = EMAIL.sendEmail.sync(null, recruiterUser.Email, emailTemplate.Subject, emailTemplate.Body, null, dataForEmail);
            utils.writeData(event, {});
            event.done();
            return;
        }
        catch (ex) {
            utils.writeData(event, {});
            event.done();
        }
    }, event);
}
module.exports = {
    apply_job: apply_job
}