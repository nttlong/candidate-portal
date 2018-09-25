[
    "./../modules/lv.db",
    "./../libs/lv.authenticate",
    "./../libs/lv.utils",
    "./../modules/lv.model",
    "./../modules/node.sys.account",
    (db, aut, utils,models,account, app) => {
        utils.debug();
        app.login = (event) => {
            //throw (__dirname);

            var isError = false;
            var formError = {
                errorType: "",
                message: "",
                field: ""
            }
            if ((!event.form.password) || (event.form.password == "")) {
                formError.errorType = "passwordIsEmpty";
                formError.message = "Please enter password";
                formError.field = "password";
                isError = true;
            }
            if ((!event.form.username) || (event.form.username == "")) {
                formError.errorType = "usernameIsEmpty";
                formError.message = "Please enter username";
                formError.field = "username";
                isError = true;
            }
            if (isError) {
                event.res.end(JSON.stringify({
                    formError: formError
                }));
                event.done();
                return;
            }
            db.execStore("sys_accounts_login", {
                UserName: event.form.username,
                Password: event.form.password,
                SessionID: event.req.sessionID
            }, (err, ret) => {
                if (err) {
                    var x = event;
                    if (err.isCustomError) {
                        event.res.end(JSON.stringify({
                            formError: {
                                message: err.error.errorMessage,
                                errorType: err.error.errorType
                            }
                        }));
                        event.done();
                    }
                }
                else {
                    aut.setAuthenticate(event.req, ret);

                    var retUrl = event.rootUrl;
                    if ((event.form.__url) && (event.form.__url.indexOf('?retUrl=') > -1)) {
                        retUrl = event.form.__url.split('retUrl=')[1].split('&')[0];
                    }
                    else {
                        if (event.req.queryStrings && event.req.queryStrings.retUrl) {
                            retUrl = event.req.queryStrings.retUrl;
                        }
                    }
                    var retAction = {
                        Action: {
                            Redirect: retUrl
                        }
                    }
                    //		__url	"http://localhost:12345/account/login?retUrl=http://www.google.com"	string

                    event.res.end(JSON.stringify(retAction));
                    event.done();
                }
            });


        }
        app.verifyUser = (event) => {

            if (!aut.getUser(event.req)) {
                event.isAuthenticated = false;
                utils.redirect(event.res, event.rootUrl + "/account/login?retUrl=" + event.rootUrl + event.req.url);

                event.done();
            }
            else {
                event.isAuthenticated = true;
                event.done();
            }
        }
        app.verifyAdminUser = (event) => {
            utils._try(() => {
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
                var role=models.sys_roles().unwind("UserEmails")
                    .where("UserEmails", user.Email)
                    .toItem.sync();
                if (role == null) {
                    event.isAuthenticated = false;
                    utils.redirect(event.res, utils.getRootUrl(event.req) + "/account/login?retUrl=" + event.rootUrl + event.req.url);

                    event.done();
                    return;
                }
                event.isAuthenticated = true;
            }, event);
           
        }
        app.register = (event) => {

            var reg_email = /^([\w\.\-]+)@([\w\-]+)((\.(\w){2,3})+)$/i;
            var retError = {
                errorType: "",
                message: "",
                field: ""
            };
            var err = false;
            var FirstName = event.form["FirstName"];
            var LastName = event.form["LastName"];
            var Password = event.form["Password"];
            var ConfirmPassword = event.form["ConfirmPassword"];
            var Email = event.form["Email"];
            if ((!FirstName) || (FirstName == "")) {
                retError.errorType = "FirstNameIsEmpty";
                retError.message = "Please enter firstname";
                retError.field = "FirstName";
                err = true;
            }
            else {
                if ((!LastName) || (LastName == "")) {
                    retError.errorType = "LastNameIsEmpty";
                    retError.message = "Please enter lastname";
                    retError.field = "LastName";
                    err = true;

                }
                else {
                    if ((!Email) || (Email == "")) {
                        retError.errorType = "EmailIsEmpty";
                        retError.message = "Please enter email";
                        retError.field = "Email";
                        err = true;

                    }
                    else {
                        if (!reg_email.test(Email)) {
                            retError.errorType = "EmailIsInvalid";
                            retError.message = "The email is invalid";
                            retError.field = "Email";
                            err = true;
                        }
                        else {
                            if ((!Password) || (Password == "")) {
                                retError.errorType = "PasswordIsEmpty";
                                retError.message = "Please enter password";
                                retError.field = "Password";
                                err = true;
                            }
                            else {
                                if (Password != ConfirmPassword) {
                                    retError.errorType = "PasswordIsNotEqualConfirmPassword";
                                    retError.message = "Password and confirm password is not match";
                                    retError.field = "Password";
                                    err = true;
                                }
                            }
                        }

                    }

                }

            }

            if (err) {
                
                event.res.end(JSON.stringify({
                    formError: retError
                }))
                event.done();
            }
            else {
                db.execStore('sys_fn_accounts_create', {
                    Email: Email,
                    Password: Password,
                    UserName: Email,
                    FirstName: FirstName,
                    LastName: LastName,
                    Creator: "application"
                }, (err, data) => {
                    event.res.end(JSON.stringify({
                        data
                    }))
                    event.done();
                });
            }


        }
        app.sign_out = (event) => {

            db.execStore("sys_fn_accounts_signout_by_token", {
                Token: aut.getToken(event.req)
            }, (err, result) => {
                aut.removeUser(event.req);
                event.res.end(JSON.stringify({
                    action: {
                        redirect: event.rootUrl + ""
                    }
                }));
                event.done();
            });
            //sys_fn_accounts_signout_by_token
        }
        app.do_recovery_password = (event) => {

            var email = event.form.email;
            if ((!email) || (email == null)) {
                event.res.end(JSON.stringify({
                    formError: {
                        errorType: "EmailIsEmpty",
                        field: "email"
                    }
                }));
                event.done();
                return;
            }
            var reg_email = /^([\w\.\-]+)@([\w\-]+)((\.(\w){2,3})+)$/i;
            if (!reg_email.test(email)) {
                event.res.end(JSON.stringify({
                    formError: {
                        errorType: "EmailIsInvalid",
                        field: "email"
                    }
                }));
                event.done();
                return;
            }
            db.execStore("st_account_password_recovery_create_token", {
                email: email,
                sessionId: event.req.sessionID,
                lang: event.req.currentLanguageCode,
                rootUrl: event.rootUrl + "/"

            }, (err, result) => {
                if (err) event.done(err);
                else {
                    event.res.end(JSON.stringify({
                        action: {
                            redirect: event.rootUrl + "/account/password-recovery-message",
                            refresh: false
                        }
                    }));
                    event.done();
                }
            });

        }
        app.do_reset_password = (event) => {

            var password = event.form.password;
            if ((!password) || (password == null)) {
                event.res.end(JSON.stringify({
                    formError: {
                        errorType: "PasswordIsEmpty"
                    }
                }));
                event.done();
                return;
            }
            db.execStore('st_account_reset_password', {
                password: password,
                sessionId: event.req.sessionID,
                lang: event.req.currentLanguageCode,
                rootUrl: event.rootUrl,
                token: event.form.token
            }, (err, result) => {
                if (err) event.done(err);
                else {
                    event.res.end(JSON.stringify({
                        action: {
                            redirect: event.rootUrl + "/account/login",
                            refresh: false
                        }
                    }));
                    event.done();
                }
            });
        }
        app.loginByLinkedIn = (event) => {
            var data = db;

            data.execStore("st_sys_signin_by_linkedin", {
                JSONParam: event.form.linkedin,
                SessionID: event.req.sessionID
            }, (err, ret) => {
                if (err) event.done(err);
                else {
                    data.cnn((err, db) => {
                        db.collection("sys_logins").findOne({
                            SessionId: event.req.sessionID,
                            "User.LinkToLinkedIn.Email": {
                                $regex: new RegExp(event.form.linkedin.Email, "i")
                            }
                        }, (err, ret) => {
                            if (err) event.done(err);
                            else {
                                if (ret != null) {
                                    aut.setAuthenticate(event.req, ret);
                                    console.log(event.req);
                                    event.res.end(JSON.stringify({
                                        formData: {

                                        }
                                    }));
                                    event.done();
                                }
                                else {
                                    event.res.end(JSON.stringify({
                                        formError: {
                                            errorType: "loginFail"
                                        }
                                    }));
                                    event.done();
                                }
                            }
                        });
                    })

                }

            })

        }
        app.loginByGoogle = (event) => {
            var data = db;

            data.execStore("st_sys_signin_by_google", {
                JSONParam: event.form.google,
                SessionID: event.req.sessionID
            }, (err, ret) => {
                if (err) event.done(err);
                else {
                    data.cnn((err, db) => {
                        db.collection("sys_logins").findOne({
                            SessionId: event.req.sessionID,
                            "User.LinkToGoogle.Email": {
                                $regex: new RegExp(event.form.google.Email, "i")
                            }
                        }, (err, ret) => {
                            if (err) event.done(err);
                            else {
                                if (ret != null) {
                                    aut.setAuthenticate(event.req, ret);
                                    console.log(event.req);
                                    event.res.end(JSON.stringify({
                                        formData: {

                                        }
                                    }));
                                    event.done();
                                }
                                else {
                                    event.res.end(JSON.stringify({
                                        formError: {
                                            errorType: "loginFail"
                                        }
                                    }));
                                    event.done();
                                }
                            }
                        });
                    })

                }

            })

        }
        app.loginByFacebook = (event) => {
            var data = db;

            data.execStore("st_sys_signin_by_facebook", {
                JSONParam: event.form.facebook,
                SessionID: event.req.sessionID
            }, (err, ret) => {
                if (err) event.done(err);
                else {
                    data.cnn((err, db) => {
                        db.collection("sys_logins").findOne({
                            SessionId: event.req.sessionID,
                            "User.LinkToFacebook.Email": {
                                $regex: new RegExp(event.form.facebook.Email, "i")
                            }
                        }, (err, ret) => {
                            if (err) event.done(err);
                            else {
                                if (ret != null) {
                                    aut.setAuthenticate(event.req, ret);
                                    console.log(event.req);
                                    event.res.end(JSON.stringify({
                                        formData: {

                                        }
                                    }));
                                    event.done();
                                }
                                else {
                                    event.res.end(JSON.stringify({
                                        formError: {
                                            errorType: "loginFail"
                                        }
                                    }));
                                    event.done();
                                }
                            }
                        });
                    })

                }

            })

        }
        app.register_by_google = (event) => {

            event.done();
        }
    }];
