const DB = require("./lv.db");
const utils = require("./../libs/lv.utils");
const aut = require("./../libs/lv.authenticate");
const Guid = require("guid");
const EMAIL = require("./node.Email");
const models = require("./../modules/lv.model");
var handlerError = (reject, callback, err) => {
    if (callback) callback(err);
    else reject(err);
}
var handlerResult = (resolve, callback, result) => {
    if (callback) callback(undefined, result);
    else resolve(result);
}
/**
 * Đăng nhập bằng face book
 * @param {any} req
 * @param {any} data
 * @param {any} handler
 */
var loginByFaceBook = (req, data, handler) => {


    var raiseError = (ex, handler, reject) => {
        if (handler) handler(ex);
        else reject(ex);
    }
    var raiseResult = (data, handler, resolve) => {
        if (handler) handler(undefined, data);
        else resolve(data);
    }
    return new Promise((resolve, reject) => {
        if ((!data) || (utils.isNull(data.email))) {
            raiseResult({
                apiError: {
                    errorType: "UserWasNotFound"
                }
            }, handler, resolve);
            return;
        }
        models.sys_Users()
            .where("LinkToFacebook.Email==email", data)
            .toItem()
            .then(result => {
                if (result == null) {
                    raiseResult({
                        apiError: {
                            errorType: "UserWasNotFound"
                        }
                    }, handler, resolve);
                }
                else {
                    var loginInfo = {
                        SessionId: req.sessionID,
                        User: result,
                        LoginTime: new Date(),
                        LoginTimeUTC: utils.getUTCDate(new Date()),
                        Token: req.sessionID,
                        IsLogOut: false

                    };
                    models.sys_logins()
                        .insert(loginInfo).commit((e, r) => {
                            aut.setAuthenticate(req, loginInfo);
                            raiseResult(loginInfo, handler, resolve);

                        });
                }
            })
            .catch(ex => {
                raiseError(ex, handler, reject);
            })
    });


   

}
/**
 * Đăng nhập bằng google
 * @param {any} req
 * @param {any} data
 * @param {any} handler
 */
var loginByGoogle = (req, data, handler) => {
    var raiseError = (ex, handler, reject) => {
        if (handler) handler(ex);
        else reject(ex);
    }
    var raiseResult = (data, handler, resolve) => {
        if (handler) handler(undefined, data);
        else resolve(data);
    }
    return new Promise((resolve, reject) => {
        if ((!data) || (utils.isNull(data.email))) {
            raiseResult({
                apiError: {
                    errorType: "UserWasNotFound"
                }
            }, handler, resolve);
            return;
        }
        models.sys_Users()
            .where("LinkToGoogle.Email==email", data)
            .toItem()
            .then(result => {
                if (result == null) {
                    raiseResult({
                        apiError: {
                            errorType: "UserWasNotFound"
                        }
                    }, handler, resolve);
                }
                else {
                    var loginInfo = {
                        SessionId: req.sessionID,
                        User: result,
                        LoginTime: new Date(),
                        LoginTimeUTC: utils.getUTCDate(new Date()),
                        Token: req.sessionID,
                        IsLogOut: false

                    };
                    models.sys_logins()
                        .insert(loginInfo).commit((e, r) => {
                            aut.setAuthenticate(req, loginInfo);
                            raiseResult(loginInfo, handler, resolve);

                        });
                }
            })
            .catch(ex => {
                raiseError(ex, handler, reject);
            })
    });

  

};
var loginByLinkedIn = (req, data, handler) => {
    var raiseError = (ex, handler, reject) => {
        if (handler) handler(ex);
        else reject(ex);
    }
    var raiseResult = (data, handler, resolve) => {
        if (handler) handler(undefined,data);
        else resolve(data);
    }
    return new Promise((resolve, reject) => {
        if ((!data) || (utils.isNull(data.email))) {
            raiseResult({
                apiError: {
                    errorType: "UserWasNotFound"
                }
            }, handler, resolve);
            return;
        }
        models.sys_Users()
            .where("LinkToFacebook.Email==email", data)
            .toItem()
            .then(result => {
                if (result == null) {
                    raiseResult({
                        apiError: {
                            errorType: "UserWasNotFound"
                        }
                    }, handler, resolve);
                }
                else {
                    var loginInfo = {
                        SessionId: req.sessionID,
                        User: result,
                        LoginTime: new Date(),
                        LoginTimeUTC: utils.getUTCDate(new Date()),
                        Token: req.sessionID,
                        IsLogOut: false

                    };
                    models.sys_logins()
                        .insert(loginInfo).commit((e, r) => {
                            aut.setAuthenticate(req, loginInfo);
                            raiseResult(loginInfo, handler, resolve);
                            
                        });
                }
            })
            .catch(ex => {
                raiseError(ex, handler, reject);
            })
    });

   

};
var loginByTwitter = (req, data, handler) => {
    var raiseError = (ex, handler, reject) => {
        if (handler) handler(ex);
        else reject(ex);
    }
    var raiseResult = (data, handler, resolve) => {
        if (handler) handler(undefined, data);
        else resolve(data);
    }
    return new Promise((resolve, reject) => {
        if ((!data) || (utils.isNull(data.email))) {
            raiseResult({
                apiError: {
                    errorType: "UserWasNotFound"
                }
            }, handler, resolve);
            return;
        }
        models.sys_Users()
            .where("LinkToTwitter.Email==email", data)
            .toItem()
            .then(result => {
                if (result == null) {
                    raiseResult({
                        apiError: {
                            errorType: "UserWasNotFound"
                        }
                    }, handler, resolve);
                }
                else {
                    var loginInfo = {
                        SessionId: req.sessionID,
                        User: result,
                        LoginTime: new Date(),
                        LoginTimeUTC: utils.getUTCDate(new Date()),
                        Token: req.sessionID,
                        IsLogOut: false

                    };
                    models.sys_logins()
                        .insert(loginInfo).commit((e, r) => {
                            aut.setAuthenticate(req, loginInfo);
                            raiseResult(loginInfo, handler, resolve);

                        });
                }
            })
            .catch(ex => {
                raiseError(ex, handler, reject);
            })
    });
};
/**
 * Tạo user
 * @param {any} Username
 * @param {any} Password
 * @param {any} Creator
 * @param {any} handler
 */
var createUser = (Username, Password, FirstName, LastName, Creator, handler) => {
    var db;
    var user;
    var error = {
        apiError: {
            errorType: "",
            field: "",
            description: ""
        }
    }
    if (utils.isNull(FirstName)) {
        error.apiError.errorType = "FirstNameIsEmpty";
        error.apiError.field = "FirstName";
        error.apiError.description = "FirstName is empty";
        handler(undefined, error);
        return;
    }
    if (utils.isNull(LastName)) {
        error.apiError.errorType = "LastNameIsEmpty";
        error.apiError.field = "LastName";
        error.apiError.description = "LastName is empty";
        handler(undefined, error);
        return;
    }
    if (utils.isNull(Username)) {
        error.apiError.errorType = "UsernameIsEmpty";
        error.apiError.field = "Username";
        error.apiError.description = "Username is empty";
        handler(undefined, error);
        return;
    }
    if (utils.isNull(Password)) {
        error.apiError.errorType = "PasswordIsEmpty";
        error.apiError.field = "Password";
        error.apiError.description = "Password is empty";
        handler(undefined, error);
        return;
    }
    utils.sequences()
        .then(next => {
            DB.cnn((err, result) => {
                if (err) handler(err);
                else {
                    db = result;
                    next(err);
                }
            })
        })
        .then(next => {
            db.collection("sys_Users").findOne({
                Email: utils.createEqualRegExp(Username)
            }, (err, item) => {
                user = item;
                next(err);
            })
        })
        .then(next => {
            if (user) {
                error.apiError.errorType = "UserIsExisting";
                error.apiError.field = "Username";
                error.apiError.description = "User is existing";
                next();
            }
            else {
                error = undefined;
                try {
                    var hasPassword = utils.sha("uid=" + Username.toLowerCase() + ";pwd=" + Password);
                    var user = {
                        FirstName: FirstName,
                        LastName: LastName,
                        UserId: Username,
                        UserName: Username,
                        UsernameLowerCase: Username.toLowerCase(),
                        Email: Username,
                        CreatedOn: new Date(),
                        CreateOnUTC: utils.getUTCDate(new Date()),
                        CreatedBy: Creator,
                        LoginCount: 0,
                        ChangedPasswordCount: 0,
                        LastestChangePassword: null,
                        LoginFailCount: 0,
                        LatestLoginTime: null,
                        Password: hasPassword
                    }
                    var ret = db.collection("sys_Users").insertOne(user, (err, result) => {
                        next(err);
                    });
                }
                catch (ex) {
                    next(ex);
                }


            }
        })
        .done(err => {
            if (err) handler(err);
            else {
                handler(undefined, error || {});
            }
        });
}
var activeUserByEmail = (Email, handler) => {
    var db;
    DB.cnn((err, db) => {
        db.collection("sys_Users")
            .updateOne({
                Email: utils.createEqualRegExp(Email)
            }, {
                $set: {
                    IsActive: true
                }
            }, (err, result) => {
                handler(err, result);
            })
    })
}
/**
 * Thoát khỏi hệ thống
 * @param {any} event
 */
var sign_out = (event) => {
    DB.cnn((err, db) => {
        if (err) event.done(err);
        else {
            utils._try(() => {
                var token = aut.getToken(event.req);
                var user = aut.getUser(event.req);
                var loginItem;
                var userItem;
                var clientData = utils.readData(event);
                utils.sequences()

                    .then(next => {
                        db.collection("sys_Users")
                            .updateOne({
                                UserName: new RegExp("^" + user.UserName + "$", "i")
                            }, {
                                $push: utils.getUTCDate(new Date())
                            }, (err, result) => {
                            });
                        db.collection("sys_logins")
                            .updateMany({
                                Token: new RegExp(" ^ " + token + "$", "i")
                            }, {
                                $set: {
                                    IsLogOut: true,
                                    LoginTimeUTC: utils.getUTCDate(new Date())

                                }
                            }, (err, result) => {
                            });
                        next();
                    })
                    .done((err, result) => {
                        if (err) event.done(err);
                        else {
                            aut.removeUser(event.req);
                            var retData = {
                                action: {
                                    redirect: event.rootUrl
                                }
                            };
                            if (clientData.retUrl) {
                                retData.action.redirect = clientData.retUrl;
                            }
                            utils.writeData(event, retData);
                            event.done();
                        }
                    });



            }, event);
        }
    })


}
var loadSettingsOfCandidate = (event) => {
    utils._try(() => {
        var user = aut.getUser(event.req);
        DB.cnn((err, db) => {
            db.collection("ls_candidate")
                .aggregate([
                    {
                        $match: {
                            UserEmail: {
                                $regex: utils.createEqualRegExp(user.Email)
                            }
                        }
                    }, {
                        $lookup:
                        {
                            from: "sys_Users",
                            localField: "UserEmail",
                            foreignField: "Email",
                            as: "User"
                        }
                    }, {
                        $unwind: "$User"
                    }, {
                        $project: {
                            FirstName: "$User.FirstName",
                            LastName: "$User.LastName",
                            Sex: 1,
                            MarriageStatus: 1,
                            Photo: 1,
                            FullAddress: 1,
                            Location: 1,
                            Nationality: 1,
                            Mobile: 1,
                            Tel:1,
                            IsAutoReceiveNews: 1,
                            AllowSearch: 1,
                            DefaultLanguage:"$User.Settings.DefaultLanguage",
                            LinkToGoogle: "$User.LinkToGoogle",
                            LinkToFacebook: "$User.LinkToFacebook",
                            LinkToLinkedIn: "$User.LinkToLinkedIn",
                            BirthDate: 1,
                            Email:"$User.Email"
                        }
                    }
                ]).toArray((err, list) => {
                    if (err) event.done(err);
                    else {
                        var data = {}
                        if (list.length > 0) {
                            data = list[0];
                        }
                        utils.writeData(event, data);
                        event.done();
                    }
                })
        })
    }, event);
};
var changePassword = (Email, Password, ConfirmPassword, handler) => {
    var hasPassword = utils.sha("uid=" + Email.toLowerCase() + ";pwd=" + Password);
    DB.cnn((err, db) => {
        db.collection("sys_Users")
            .findOne({
                Email: {
                    $regex: utils.createEqualRegExp(Email)
                }
            }, (err, user) => {
                if (err) handler(err);
                else {
                    var setter = {
                        $set: {
                            Password: hasPassword,
                            ChangedPasswordCount: (user.ChangedPasswordCount) ? (user.ChangedPasswordCount + 1) : 1,
                            LastestChangePassword: utils.getUTCDate(new Date())

                        }
                    };
                    db.collection("sys_Users")
                        .updateOne({
                            Email: {
                                $regex: utils.createEqualRegExp(Email)
                            }
                        }, setter, (err, result) => {
                            if (err) handler(err);
                            else {
                                db.collection("sys_Users")
                                    .updateOne({
                                        Email: {
                                            $regex: utils.createEqualRegExp(Email)
                                        }
                                    }, {
                                        $push: {
                                            ListOfOldPasswords: Password
                                        }
                                    }, (err, r) => {

                                    });
                                handler(result);
                            }
                        });
                }
            })
    })

}
var doChangePassword = (event) => {
    utils._try(() => {
        var clientData = utils.readData(event);
        var user = aut.getUser(event.req);
        var checks = utils.checkRequireFields([
            "PasswordOld",
            "Password",
            "ConfirmPassword"
        ], clientData);
        if (checks.length > 0) {
            utils.writeData(event, {
                apiError: checks[0]
            });
            event.done();
        }
        else {
            var passwordOld = clientData.PasswordOld;
            var email = user.Email;
            var hasPassword = utils.sha("uid=" + email.toLowerCase() + ";pwd=" + passwordOld);
            var userdata = models.sys_Users()
                .where("(Email==email)and(IsActive==isActive)", { email: email, isActive: true })
                .toItem.sync();
            if (userdata.Password !== hasPassword) {
                utils.writeData(event, {
                    apiError: {
                        errorType: "PasswordOldIsNotEqual"
                    }
                });
                event.done();
            } else if (clientData.PasswordOld == clientData.Password) {
                utils.writeData(event, {
                    apiError: {
                        errorType: "PasswordOldAndPasswordIsNotEqual"
                    }
                });
                event.done();
            } else if (clientData.Password != clientData.ConfirmPassword) {
                utils.writeData(event, {
                    apiError: {
                        errorType: "PasswordAndConfirmPasswordIsNotEqual"
                    }
                });
                event.done();
            }
            else {
                changePassword(user.Email, clientData.Password, clientData.ConfirmPassword, (err, result) => {
                    utils.writeData(event, {

                    });
                    event.done();
                });
            }
        }

    },event)
}
var login = (email, password, sessionID, handler) => {
    var hasPassword = utils.sha("uid=" + email.toLowerCase() + ";pwd=" + password);
    return new Promise((resolve, reject) => {
        var user;
        var login;
        var ret;
        var userFoundButWrongPassword = false;
        utils.sequences()
            .then(next => {
                models.sys_Users()
                    .where("(Email==email)and(IsActive==isActive)", { email: email, isActive: true })
                    .toItem()
                    .then(result => {
                        user = result;
                        next();
                    })
                    .catch(ex => {
                        next(ex);
                    })
            })
            .then(next => {
                if (!user) {
                    ret = {
                        apiError: {
                            errorType: "UserWasNotFound",
                            description: "User was not found"
                        }
                    };
                    next();
                }
                else {
                    if (user.Password !== hasPassword) {
                        ret = {
                            apiError: {
                                errorType: "EmailOrPasswordIsIncorrect",
                                description: "Email or password is incorrect"
                            }
                        };
                        models.sys_Users().where("Email==email", { email: email })
                            .inc("LoginFailCount")
                            .push("LoginFailRecords", {
                                OnTime: new Date(),
                                OnTimeUTC: (new Date()).toUTC()
                            }).commit((err, result)=>{

                            })
                        next();
                    }
                    else {
                        models.sys_Users()
                            .where("Email==email", { email: email })
                            .inc("LoginCount")
                            .set("LatestLoginTime", (new Date()).toUTC())
                            .commit((err, result) => {

                            });
                        models.sys_logins().
                            insert({
                                LoginTimeUTC: (new Date()).toUTC(),
                                LoginTime: new Date(),
                                SessionId: sessionID,
                                Token: Guid.create().value,
                                User: {
                                    _id: user._id,
                                    Email: user.Email,
                                    UserId: user.UserId,
                                    FirstName: user.FirstName,
                                    LastName: user.LastName,
                                    UserName: user.UserName
                                }
                            }).commit((err, result) => {
                                ret = result;
                                next(err);
                            })
                      


                    }
                }
            })
            .done((err, result) => {
                handler(err, ret || result);
            })
    })
    
    
}
var doLogin = (event) => {
    utils._try(() => {
        var clientData = utils.readData(event);
        var checks = utils.checkRequireFields([
            "Username",
            "Password"
        ], clientData);
        if (checks.length > 0) {
            utils.writeData(event, {
                apiError: checks[0]
            });
            event.done();
        }
        else {
            login(clientData.Username, clientData.Password, event.req.sessionID, (err, result) => {
                if (err) event.done(err);
                else {
                    if (result.apiError) {
                        utils.writeData(event, result);
                        event.done();
                    }
                    else {
                        aut.setAuthenticate(event.req, result);
                        utils.writeData(event, {
                            action: {
                                redirect: clientData.Url
                            }
                        });
                        event.done();
                    }
                }
                
            })
        }
    }, event);
}
var updateSocialLink = (event) => {
    utils._try(() => {

        try {
            var clientData = utils.readData(event);
            var user = aut.getUser(event.req);
            var lan = utils.getCurrentLanguageCode(event);
            if (!utils.isEmail(clientData.email)) {
                utils.writeData(event, {
                    apiError: {
                        errorType: "EmailIsInvalid"
                    }
                });
                event.done();
                return;
            }
            var count = models.sys_Users()
                .where("((Email==email)or(LinkToGoogle.Email==email)or" +
                "(LinkToFacebook.Email == email)or" +
                "(LinkToLinkedIn.Email == email)or" +
                "(LinkToTwitter.Email == email))and(UserId != userId)", { email: user.Email, userId: user.UserId })
                .count.sync();
            if (count > 0) {
                utils.writeData(event, {
                    apiError: {
                        errorType: "EmailIsExisting"
                    }
                });
                event.done();
                return;
            }
            var token = utils.newGuid();
            var activeItem = models.sys_activation()
                .insert({
                    Type: "RequestApproveSocialNetWorkLink",
                    Token: token,
                    Data: {
                        Email: clientData.email,
                        SocialName: clientData.socialType,
                        UserEmail: user.Email,
                        FirstName: user.FirstName,
                        LastName: user.LastName
                    },
                    CreateOnUTC: utils.getUTCDate(new Date()),
                    CreateOn: new Date()
                }).commit.sync();
            dataForSendMail = {
                RootUrl: utils.getRootUrl(event.req),
                SocialName: clientData.socialType,
                User: user,
                ActionDate: new Date(),
                Token: token,
                ActivationUrl: utils.getRootUrl(event.req) + "account/social-verify/" + token
            }
            var Schema = utils.getSchema(dataForSendMail)
            var template=EMAIL.getTemplate.sync(null, "SocialNetworkVerify" + clientData.socialType, lan,
                "v/v Xác nhận lại tài khoản sử dụng bằng {{SocialName}}",
                "Thân chào bạn {{User.FirstName}} {{User.LastName}} <br/> " +
                "Bạn vừa thiết lập mối liên kết từ tài khoản của bạn tại trang {{RootUrl}} với mạng xã hội {{SocialName}} vào lúc {{ActionDate}}.<br/>" +
                "Hãy xác nhận lại việc này bằng cách bấm vào đường link <a href='{{ActivationUrl}}'>{{ActivationUrl}}</a>, hoặc copy nội dung " +
                "'{{ActivationUrl}}' và paste vào thanh địa chỉ của trình duyệt để thực hiện việc kích hoạt.<br/>" +
                "Chân thành cảm ơn sự cộng tác của bạn với dịch vụ của chúng tôi.",
                Schema,
                "Email thông báo xác nhận lại tài khoản mạng xã hội của " + clientData.socialType);
            var ret = EMAIL.sendEmail.sync(null, clientData.email, template.Subject, template.Body, null, dataForSendMail);
            utils.writeData(event, {});
            event.done();
        }
        catch (ex) {
            event.done(ex);
        }

    }, event);
}
var verifyUser = (event) => {

    if (!aut.getUser(event.req)) {
        event.isAuthenticated = false;
        utils.redirect(event.res, event.rootUrl + "/account/login?retUrl=" + event.rootUrl + event.req.url);

        event.done();
    }
    else {
        event.isAuthenticated = true;
        event.done();
    }
};
/**
 * Thay đổi mật khẩu của user
 * @param {any} Email
 * @param {any} Password
 * @param {any} handler
 */
var changePasswordOfUser = (email, password, handler) => {
    var hasPassword = utils.sha("uid=" + email.toLowerCase() + ";pwd=" + password);
    DB.cnn((err, db) => {
        db.collection("sys_Users")
            .updateOne({
                Email: {
                    $regex: new RegExp("^" + email+"$","i")
                }
            }, {
                $set: {
                    Password: hasPassword
                }
            }, (err, result) => {
                handler(err, result);
            })
    })
}
/**
 * Kiểm tra user admin của request
 * @param {any} event
 */
var verifyAdminUser = (event) => {
    utils._try(() => {
        try {
            var user = aut.getUser(event.req);
            if (!user) {
                event.isAuthenticated = false;

                utils.redirect(event.res, utils.getRootUrl(event.req) + "/account/login?retUrl=" + event.rootUrl + event.req.url);

                event.done();
                return;
            }
            var rootUser = models.sys_Users().where("Email", "root").toItem.sync();
            if (!rootUser) {
                account.createUser.sync(null, "root", "root", "System", "Administrator", "application");
                account.activeUserByEmail.sync(null, "root");
            }
            var sys_role = models.sys_roles().where("RoleCode", "sys_admin").toItem.sync();
            if (sys_role == null) {
                models.sys_roles().insert({
                    RoleCode: "sys_role",
                    RoleName: "system administrator",
                    UserEmails: ["root"],
                    IsSystem: true
                }).commit.sync();
            }
            var role = models.sys_roles().unwind("UserEmails")
                .where("UserEmails", user.Email)
                .toItem.sync();
            if (role == null) {
                event.isAuthenticated = false;
                utils.redirect(event.res, utils.getRootUrl(event.req) + "/account/login?retUrl=" + event.rootUrl + event.req.url);

                event.done();
                return;
            }
            event.isAuthenticated = true;
            event.done();
        }
        catch (ex) {
            event.done(ex);
        }
    }, event);

};
/**
 * Login dành cho nhà tuyển dụng
 * @param {any} event
 */
var recruiterLogin = (event) => {
    utils._try(() => {
        try {
            var clientData = utils.readData(event);
            var checks = utils.checkRequireFields([
                "Email", "Password"
            ], clientData);
            if (checks.length > 0) {
                utils.writeData(event, { apiError: checks[0] });
                event.done();
            }
            var hasPassword = utils.sha("uid=" + clientData.Email.toLowerCase() + ";pwd=" + clientData.Password);
            var user = models.sys_Users()
                .where("(Email==email)and(Password==password)", {
                    email: clientData.Email,
                    password: hasPassword
                }).toItem.sync();
            if (!user) {
                utils.writeData(event, { apiError: { errorType: "LoginFail" } });
                event.done();
                return;
            }
            var recruiter = models.ls_recruiters()
                .where("UserEmail==Email", user)
                .toItem.sync();
            if (!recruiter) {
                utils.writeData(event, { apiError: { errorType: "LoginFail" } });
                event.done();
                return;
            }
            var ret = models.sys_logins().
                insert({
                    LoginTimeUTC: (new Date()).toUTC(),
                    LoginTime: new Date(),
                    SessionId: event.req.sessionID,
                    Token: Guid.create().value,
                    User: {
                        _id: user._id,
                        Email: user.Email,
                        UserId: user.UserId,
                        FirstName: user.FirstName,
                        LastName: user.LastName,
                        UserName: user.UserName
                    }
                }).commit.sync();
            aut.setAuthenticate(event.req, ret);
            var retData = {
                action: {
                    redirect: utils.getRootUrl(event.req) + "/company",
                    refresh: false
                }
            };
            utils.writeData(event, retData);
            event.done();
        }
        catch (ex) {
            event.done(ex);
        }
    }, event);
};
var verifyDeveloper = (event) => {
    utils._try(() => {
        try {
            var user = aut.getUser(event.req);

            if (!user) {
                event.isAuthenticated = false;

                utils.redirect(event.res, utils.getRootUrl(event.req) + "/account/login?retUrl=" + event.rootUrl + event.req.url);

                event.done();
                return;
            }
            //var item = models.ls_recruiters()
            //    .where("UserEmail==Email", user)
            //    .toItem.sync();
            //if (!item) {
            //    event.isAuthenticated = false;

            //    utils.redirect(event.res, utils.getRootUrl(event.req) + "/account/login?retUrl=" + event.rootUrl + event.req.url);

            //    event.done();
            //    return;
            //}
            event.isAuthenticated = true;
            event.done();
        }
        catch (ex) {
            event.done(ex);
        }
    }, event);
};
/**
 * Lấy thông tin recruiter thông qua email
 * @param {any} Email
 * @param {any} callback
 */
var getRecruiter = (reqOrEvent,callback) => 
    {
    return new Promise((resolve, reject) => {
        var user = aut.getUser(reqOrEvent.req || reqOrEvent);
            try {
                models.ls_recruiters()
                    .where("(UserEmail==email)or(Developers.Email==email)", { email: user.Email })
                    .toItem().then((result) => {
                        handlerResult(resolve, callback, result);
                    }).catch(err => {
                        handlerError(reject, callback, err);
                    });
            }
            catch (err) {
                handlerError(reject, callback, err);
            }
            
        });
    };
    module.exports = {
    getRecruiter: getRecruiter,
    loginByFaceBook: loginByFaceBook,
    loginByGoogle: loginByGoogle,
    loginByLinkedIn: loginByLinkedIn,
    createUser: createUser,
    activeUserByEmail: activeUserByEmail,
    sign_out: sign_out,
    loadSettingsOfCandidate: loadSettingsOfCandidate,
    doChangePassword: doChangePassword,
    changePassword: changePassword,
    doLogin: doLogin,
    login: login,
    updateSocialLink: updateSocialLink,
    verifyUser: verifyUser,
    changePasswordOfUser: changePasswordOfUser,
    verifyAdminUser: verifyAdminUser,
    recruiterLogin: recruiterLogin,
    loginByTwitter: loginByTwitter,
    verifyDeveloper: verifyDeveloper
};