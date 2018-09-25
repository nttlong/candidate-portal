var Service = require('node-windows').Service;
var path = require("path");


// Create a new service object
var svc = new Service({
    name: 'candidate web server service',
    description: 'Dịch vụ web server của candidate portal port 1214',
    script: path.join(__dirname, "server.js")
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function () {
    svc.start();
});

svc.install();