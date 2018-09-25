[
    "./libs/lv.utils",
    "fs",
    (
        utils,
        fs,
        app) => {
        app.loadListOfPage = (event) => {
            fs.readdir("./app_data/pages", (err, files) => {
                var ret = [];
                files.forEach(file => {
                    if (file.indexOf(".") > -1) {
                        ret.push({
                            name: file,
                            isFile: true
                        });
                    }
                    else {
                        ret.push({
                            name: file,
                            isFile: false
                        });
                    }

                });
                utils.writeData(event, {
                    data: ret,
                    postData: event.req.jsonData,
                    test: "1"
                });
                event.done();
            })


        }
    }];