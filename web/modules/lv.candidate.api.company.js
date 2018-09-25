["./../libs/lv.utils",
    "./../modules/lv.db",
    "./../libs/lv.authenticate",

    (utils,
        db,
        aut,
        api) => {
        api.login = (event) => {

            var isError = false;
            var formError = {
                errorType: "",
                message: "",
                field: ""
            }
            if ((!event.form.Password) || (event.form.Password == "")) {
                formError.errorType = "passwordIsEmpty";
                formError.message = "Please enter password";
                formError.field = "Password";
                isError = true;
            }
            if ((!event.form.Email) || (event.form.Email == "")) {
                formError.errorType = "EmailIsEmpty";
                formError.message = "Please enter Email";
                formError.field = "Email";
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
                UserName: event.form.Email,
                Password: event.form.Password,
                SessionID: event.req.sessionID
            }, (err, ret) => {
                if (err) {

                    if (err.isCustomError) {
                        formError.errorType = "loginFail";
                        event.res.end(JSON.stringify({
                            formError: formError
                        }));
                        event.done();
                    }
                }
                else {
                    if (ret.errorType) {
                        formError.errorType = "loginFail";
                        event.res.end(JSON.stringify({
                            formError: formError
                        }));
                        event.done();
                    }
                    else {

                        db.cnn((err, dbCnn) => {
                            if (err) {
                                formError.errorType = "loginFail";
                                event.res.end(JSON.stringify({
                                    formError: formError
                                }));
                                event.done();
                            }
                            else {
                                dbCnn.collection("ls_recruiters")
                                    .findOne({
                                        UserEmail: new RegExp(ret.User.Email, "i")
                                    }, (err, retRec) => {
                                        if (err) {
                                            formError.errorType = "loginFail";
                                            event.res.end(JSON.stringify({
                                                formError: formError
                                            }));
                                            event.done();
                                        }
                                        else {
                                            if (retRec == null) {
                                                formError.errorType = "loginFail";
                                                event.res.end(JSON.stringify({
                                                    formError: formError
                                                }));
                                                event.done();
                                            }
                                            else {
                                                aut.setAuthenticate(event.req, ret);
                                                var retUrl = event.rootUrl;
                                                event.res.end(JSON.stringify({
                                                    action: {
                                                        redirect: event.rootUrl + "/company",
                                                        refresh: false
                                                    }
                                                }));

                                                event.done();
                                            }
                                        }
                                    });
                            }
                        });



                    }

                }
            });

        }
    }];