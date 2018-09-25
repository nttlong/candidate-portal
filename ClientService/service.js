var Service = require('node-windows').Service;
var path = require("path");
var svc = new Service({
    name: 'Candidate-sync-service-test-thu',
    description: 'Dịch vụ đồng bộ dữ liệu từ candidate portal port 1124',
    script: path.join(__dirname, "server.js")
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function () {
    //svc.start();
});

svc.install();
