["./../libs/lv.authenticate",
    "./../modules/lv.db",
    "./../libs/lv.utils",
    (aut,
        db,
        utils,
        api) => {
        utils.debug();
    api.verifyUser = (event) => {
        if (event.req.url.toLowerCase() == "/company/login") {
            event.done();
            return;
        }
       
        if (!aut.getUser(event.req)) {
            event.res.redirect(event.rootUrl + "/company/login")
           
            event.done();
        }
        else {
            db.cnn((err, db) => {
                if (err) {
                    event.res.redirect(event.rootUrl + "/company/login")
                    event.done();
                }
                else {
                    db.collection("ls_recruiters")
                        .findOne({
                            UserEmail: new RegExp(aut.getUser(event.req).Email,"i")
                        }, (err, data) => {
                            if (data != null) {
                                event.res.end("{}");
                            }
                            else {
                                event.res.redirect(event.rootUrl + "/company/login")
                            }
                            event.done();
                        })
                }
            });
        }
    }
}];