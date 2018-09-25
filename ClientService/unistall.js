var Service = require('node-windows').Service;
var path = require("path");
var svc = new Service({
    name: 'Candidate-sync-service-test-thu',
    script: path.join(__dirname, "server.js")
});

// Listen for the "uninstall" event so we know when it's done.
svc.on('uninstall', function () {
    console.log('Uninstall complete.');
    console.log('The service exists: ', svc.exists);
});

// Uninstall the service.
svc.uninstall();