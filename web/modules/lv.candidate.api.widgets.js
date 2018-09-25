["./../libs/lv.utils",
    (utils,app) => {
    app.navbar_change_language = (event) => {
        utils.debug();
        event.res.cookie('language', event.form.lang);
        event.res.end(JSON.stringify({
            action: {
                refresh: true
            }
        }));
        event.done();
    }
}];