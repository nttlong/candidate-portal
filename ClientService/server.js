const host = require("./libs/lv.host.app");
const logs = require("./libs/lv.logs");
const client = require("./libs/CandidatePortalClient");


host.run();

//setTimeout(function () {
//    var Service = require('node-windows').Service;
//    var path = require("path");
//    var svc = new Service({
//        name: 'Service_dong_bo_uv_ve_ATS',
//        description: 'sync data from candidate to ats',
//        script: path.join(__dirname, "ServicesChuyenHsuv.js")
//    });

//    // Listen for the "install" event, which indicates the
//    // process is available as a service.
//    svc.on('install', function () {
//        //svc.start();
//    });

//    svc.install();
//},3000)
//var runService = () => {
//    logs.info("test", client.getConfig());
//    setTimeout(() => {
//        runService();
//    }, 2500);
//}

//client.loadInfo().then(resukt => {
//    runService();
//}).catch(ex => { logs.debug(ex)});