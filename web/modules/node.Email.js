const Data = require("./lv.db");
const utils = require("./../libs/lv.utils")
const mongo = require("mongodb");
const asyncLock = require("async-lock");
const GUID = require("guid")
const mustache = require("mustache");
const Handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const moment = require("node-moment");
const models = require("./lv.model")
//var $ = require('jQuery');
/**
 * lấy template email mời phỏng vấn
 * @param {any} language
 * @param {any} email Email của Admin user nhà tuyển dụng
 * @param {any} defaultTemplateSubject
 * @param {any} defaultContentTemplate
 * @param {any} dataModel Dữ liệu dùng để gởi mail {Candidate: , Requisition: ,Interview: {Date:  From: ,At: InterviewLocation,Note:},Company: company,WebSiteUrl: }
 * @param {any} handler (err,result:{Template:[template nội dung],SchemaModel:[schema model],Subject:[Template subject]})
 */
var getInviteInterriewTemplateEmailByAdminEmail = (language, email,defaultTemplateSubject, defaultContentTemplate, dataModel, handler) => {
    var templateEmail;
    var defaultTemplate;
    Data.cnn((err, db) => {
        if (err) handler(err);
        else {
            utils.sequences()
                .then(next => {
                    db.collection("ls_recruiters")
                        .findOne({
                            UserEmail: {
                                $regex: new RegExp("^" + email+"$","i")
                            }
                        }, (err, item) => {
                            if (err) next(err);
                            else {
                                if (item.EmailInterviewTemplate && item.EmailInterviewTemplate[language]) {
                                    templateEmail = item.EmailInterviewTemplate[language]
                                }
                                next();
                            }
                        })
                })
                .then(next => {
                    if (!templateEmail) {
                        var schemaModel = utils.getSchema(dataModel);
                        getTemplateEmailFromFile("EmailInterviewTemplate", language, defaultTemplateSubject, defaultContentTemplate, schemaModel,"Email mời phỏng vấn", (err, result) => {
                            defaultTemplate = result;
                            next(err);
                        });
                    }
                    else {
                        next();
                    }
                })
                .then(next => {
                    if (!templateEmail) {
                        var model = [];
                        var schemaModel = utils.getSchema(dataModel);
                        templateEmail = {
                            Template: defaultTemplate.Body,
                            SchemaModel: defaultTemplate.DatasourceSchema,
                            Subject: defaultTemplate.Subject,
                            CreatedOn: new Date(),
                            CreatedBy: "application",
                        }
                        var setter = {
                            $set: {}
                        }
                        setter.$set["EmailInterviewTemplate." + language] = templateEmail;
                        db.collection("ls_recruiters")
                            .updateOne({
                                UserEmail: {
                                    $regex: new RegExp("^" + email + "$", "i")
                                }
                            }, 
                                setter
                            , (err, result) => {
                                if (err) next(err);
                                else {
                                    next();
                                }
                            })
                    }
                    else {
                        templateEmail.SchemaModel = utils.getSchema(dataModel);
                        var setter = {
                            $set: {}
                        }
                        setter.$set["EmailInterviewTemplate." + language + ".SchemaModel"] = templateEmail.SchemaModel
                        db.collection("ls_recruiters")
                            .updateOne({
                                UserEmail: {
                                    $regex: new RegExp("^" + email + "$", "i")
                                }
                            }, {
                                setter
                            }, (err, result) => {

                            });
                        next()
                    }
                }).done(err => {
                    if (err) handler(err);
                    else {
                        handler(undefined,templateEmail)
                    }
                })
        }
    })
}
/**
 * lấy template email từ chối
 * @param {any} language
 * @param {any} email Email của Admin user nhà tuyển dụng
 * @param {any} defaultTemplateSubject
 * @param {any} defaultContentTemplate
 * @param {any} dataModel Dữ liệu dùng để gởi mail {Candidate: , Requisition: ,Interview: {Date:  From: ,At: InterviewLocation,Note:},Company: company,WebSiteUrl: }
 * @param {any} handler (err,result:{Template:[template nội dung],SchemaModel:[schema model],Subject:[Template subject]})
 */
var getRejectCandidateEmail = (language, email, defaultTemplateSubject, defaultContentTemplate, dataModel, handler) => {
    var recruiter;
    var defaultTemplate
   
    utils.sequences()
        .then(next => {
            models.ls_recruiters()
                .where("UserEmail", email)
                .toItem((err, result) => {
                    recruiter = result;
                    next(err);
                })
            })
        
        .then(next => {
            if ((!recruiter.EmailRejectTemplate) || (!recruiter.EmailRejectTemplate[language])) {
                var schemaModel = utils.getSchema(dataModel);
               
                getTemplateEmailFromFile("EmailRejectTemplate", language, defaultTemplateSubject, defaultContentTemplate, schemaModel, "Email từ chối ứng viên", (err, result) => {
                    if (err) next(err);
                    else {
                        defaultTemplate = result;

                        models.ls_recruiters()
                            .where("UserEmail", email)
                            .set("EmailRejectTemplate." + language, {
                                Body: result.Body,
                                SchemaModel: schemaModel,
                                Subject: result.Subject,
                                Files: result.Files ? result.Files : null,
                                CreatedOn: new Date(),
                                CreatedBy: "application"
                            }).commit((err, result) => {
                                next(err);

                            });
                    }
                    
                });
            }
            else {
                defaultTemplate = recruiter.EmailRejectTemplate[language];
                next();
            }
        })
        .done(err => {
            handler(err, defaultTemplate);
        })
}
/**
 * Gởi email đến ứng viên
 * @param {any} mailTo 
 * @param {any} subjectTemplate
 * @param {any} contentTemplate
 * @param {any} data dữ liệu dùng để merge vào template
 * @param {any} handler
 */
var sendEmail = (mailTo, subjectTemplate, contentTemplate, files, data, handler) => {
    Data.cnn((err, db) => {
        try {
            var templateSubject = Handlebars.compile(subjectTemplate);
            var templateBody = Handlebars.compile(contentTemplate);
            var subject = templateSubject(data);
            var content = templateBody(data);
            db.collection("sys_email_sent")
                .insertOne({
                    Content: content,
                    HtmlContent: content,
                    MailTo: mailTo,
                    Subject: subject,
                    Files: files,
                    CreatedOn: new Date(),
                    CreatedOnUTC: utils.getUTCDate(new Date()),
                    HasSent: false, HasError: false,
                    Data: data

                }, (err, result) => {
                    handler(err, result)
                })
        }
        catch (ex) {
            handler(ex);
        }
    })
};
var _directoryOftemplateEmail;
/**
 * Cài đặt thư mục chứa template email
 * @param {any} value
 */
var setDirectoryOftemplateEmail = (value) => {
    _directoryOftemplateEmail = value;
}
setDirectoryOftemplateEmail("./app_data/templateEmails");
/**
 * Lấy template email từ thư mục (được đặt trong setDirectoryOftemplateEmail):{Subject,Body,DatasourceSchema}
 * @param {any} TemplateName
 * @param {any} Language
 * @param {any} Subject
 * @param {any} Content
 * @param {any} Schema
 */
var getTemplateEmailFromFile = (TemplateName, Language, Subject, Body, Schema, Description, handler) => {
    //if ((Subject == "") || (Body == "") || (!Schema) || (Schema.length == 0)) {
    //    handler(undefined, { Subject: Subject, Body: Body, Schema });
    //    return;
    //}
    var _path = path.join(_directoryOftemplateEmail, TemplateName);
    var _dir = path.join(_path, Language);
    var _templatePathSubject = path.join(_dir, "subject.txt");
    var _templatePathBody = path.join(_dir, "body.html");
    var _templatePathSchema = path.join(_dir, "schema.json");
    utils.sequences()
        .then(next => {
            fs.exists(_path, ok => {
                if (!ok) {
                    fs.mkdirSync(_path);
                    next();
                }
                else {
                    next();
                }
            })
        })
        .then(next => {
           
            fs.exists(_dir, ok => {
                if (!ok) {
                    fs.mkdirSync(_dir);
                    next();
                }
                else {
                    next();
                }
            })
        })
        .then(next => {
            fs.exists(_templatePathBody, ok => {
                if (!ok) {
                    fs.writeFile(_templatePathBody, Body, "utf-8", (err, result) => {
                        next(err);
                    })
                }
                else {
                    fs.readFile(_templatePathBody, "utf-8", (err, result) => {
                        Body = result;
                        next(err);
                    })
                }
            })
        })
        .then(next => {
            fs.exists(_templatePathSchema, ok => {
                if (!ok) {
                    fs.writeFile(_templatePathSchema, JSON.stringify(Schema), "utf-8", err => {
                        next(err);
                    })
                }
                else {
                    fs.readFile(_templatePathSchema, "utf-8", (err, result) => {
                        if (err) {
                            next(err);
                            return;
                        }
                        try {
                            Schema = JSON.parse(result);
                            next();
                        }
                        catch (ex) {
                            next(ex);
                        }
                        
                    })
                }
            })
        })
        .then(next => {
            fs.exists(_templatePathSubject, ok => {
                if (!ok) {
                    fs.writeFile(_templatePathSubject, Subject, "utf-8", err => {
                        next(err);
                    })
                }
                else {
                    fs.readFile(_templatePathSubject, "utf-8", (err, result) => {
                        Subject = result;
                        next(err);
                    })
                }
            })
        })
        .done(err => {
            handler(err, { Subject: Subject, Body: Body, Schema });
        })
    
}
/**
 * lay template email tu database neu chua co lay tu file neu chua co file tao file va tao datbase (err,result:{Body:[template nội dung],SchemaModel:[schema model],Subject:[Template subject]})
 * @param {any} TemplateName
 * @param {any} Language
 * @param {any} Subject
 * @param {any} Body
 * @param {any} Schema
 * @param {any} handler (err,result:{Body:[template nội dung],SchemaModel:[schema model],Subject:[Template subject]})
 */
var getTemplate = (TemplateName, Language, Subject, Body, Schema, Description, handler) => {

    return new Promise((resolve, reject) => {
        models.sys_email_template()
            .where("(TemplateName==TemplateName)and(Language==Language)",
            {
                TemplateName: TemplateName,
                Language: Language
            })
            .toItem()
            .then(data => {
                if (data == null) {
                    getTemplateEmailFromFile(TemplateName, Language, Subject, Body, Schema, Description, (err, data) => {
                        if (err) {
                            if (handler) handler(err);
                            else reject(err);
                        }
                        else {
                            data.Language = Language;
                            data.TemplateName = TemplateName;
                            models.sys_email_template()
                                .insert(data)
                                .commit()
                                .then(result => {
                                    if (handler) handler(undefined, data);
                                    else resolve(data);
                                })
                                .catch(ex => {
                                    if (handler) handler(ex);
                                    else reject(ex);
                                })

                        }

                    });
                }
                else {
                    if (handler) handler(undefined, data);
                    else resolve(data);
                }
            })
            .catch(ex => {
                if (handler) handler(ex);
                else reject(ex);
            })
    })


    //Data.cnn((err, db) => {
    //    db.collection("sys_email_template")
    //        .findOne({
    //            TemplateName: {
    //                $regex: utils.createEqualRegExp(TemplateName)
    //            },
    //            Language: Language
    //        }, (err, item) => {
    //            if (err) handler(err)
    //            else {
    //                if (item == null) {
    //                    getTemplateEmailFromFile(TemplateName, Language, Subject, Body, Schema, Description, (err, data) => {
    //                        data.Language = Language;
    //                        db.collection("sys_email_template")
    //                            .insertOne(data, (err, result) => {
    //                                handler(err, data);
    //                            });
    //                    })
    //                }
    //                else {
    //                    handler(undefined, item);
    //                }
    //            }
    //        })
    //})
}
module.exports = {
    getInviteInterriewTemplateEmailByAdminEmail: getInviteInterriewTemplateEmailByAdminEmail,
    sendEmail: sendEmail,
    getTemplateEmailFromFile: getTemplateEmailFromFile,
    getTemplate: getTemplate,
    getRejectCandidateEmail: getRejectCandidateEmail
}

//Handlebars.registerHelper("date_format", (path, options) => {

//    if ((!value) || (value == null)) return " ";
//    return moment(value).format(options.toUpperCase())

//});
//Handlebars.registerHelper("current_time", (format) => {


//    return moment(new Date()).format(format.toUpperCase())

//});

//var t = Handlebars.compile("{{current_time 'dd/MM/yyyy'}}");
//var x = t({});
//console.log(x);