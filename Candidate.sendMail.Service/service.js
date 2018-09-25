var Service = require('node-windows').Service;
var path = require("path");


// Create a new service object
var svc = new Service({
    name: 'candidate sendmail service',
    description: 'Dịch vụ gởi mail của trang web candidate',
    script: path.join(__dirname,"app.js")
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function () {
    svc.start();
});

svc.install();