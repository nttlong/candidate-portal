var Service = require('node-windows').Service;
var path = require("path");
// Listen for the "install" event, which indicates the
// process is available as a service.
var install = (data, callback) => {
    var svc = new Service({
        name: data.name,
        description: data.description,
        script: data.script
    });
    svc.on('install', function () {
        //svc.start();
    });
    svc.install();
}

var start = (data, callback) => {
    var svc = new Service({
        name: data.name,
        description: data.description,
        script: data.script
    });
    svc.start();
}

var stop = (data, callback) => {
    var svc = new Service({
        name: data.name,
        script: data.script
    });

    // Uninstall the service.
    svc.stop();
}

var uninstall = (data, callback) => {
    var svc = new Service({
        name: data.name,
        script: data.script
    });
    
    // Listen for the "uninstall" event so we know when it's done.
    svc.on('uninstall', function () {
        console.log('Uninstall complete.');
        console.log('The service exists: ', svc.exists);
    });

    // Uninstall the service.
    svc.uninstall();
}

module.exports = {
    install: install,
    start: start,
    stop: stop,
    uninstall: uninstall
}
