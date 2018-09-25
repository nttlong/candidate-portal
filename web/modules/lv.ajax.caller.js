[
    "./../modules/lv.startup",
    "./../modules/lv.db",
    "./../libs/lv.authenticate",
    (lv_start_up,
        db,
        aut,
        app) => {
    app.exec = (event) => {
       

        var api = global.lv_api_store_caller[event.req.query.token];
        var Config = {
            "Customer": "default",
            "RootUrl": event.req.protocol + "://" + event.req.headers.host + "/" + global.getConfig().rootWebServerDir,
            "SessionId": event.req.sessionID,
            "ViewPath": "~/templates/default/" + event.req.url + ".html"
        };
        var Language = {
            Current: lv_start_up.sys_settings().languages[event.req.currentLanguageCode],
            Support: lv_start_up.sys_settings().LanguageSupports
        };
        db.execStore(api, {
            User: aut.getUser(event.req),
            JsonPostData: event.req.jsonData,
            Config: Config,
            Language: Language
        }, (err, data) => {
            
            if (err) {
                event.res.status(500).send(JSON.stringify(err));
                event.done();
            }
            else {
                event.res.end(JSON.stringify(data));
                event.done();
            }


        });

    }
}]