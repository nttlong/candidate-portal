const log4js = require('log4js');
log4js.configure({
    appenders: {
        debug: {
            type: 'file', filename: './app_data/logs/debug/debug.log',
            maxLogSize: 20480,
            backups: 10
        },
        info: {
            type: 'file', filename: './app_data/logs/info/info.log',
            maxLogSize: 20480,
            backups: 10
        }
    },
    categories: {
        default: { appenders: ['debug'], level: 'debug' },
        info: { appenders: ['info'], level: 'info' }
    }
});

const debug_logger = log4js.getLogger('debug');
const info_logger = log4js.getLogger('info');
module.exports = {
    info: (message, args) => {
        if (args) {
            info_logger.info(message, args);
        }
        else {
            info_logger.info(message);
        }
    },
    debug: (message, args) => {
        if (args) {
            debug_logger.debug(message, args);
        }
        else {
            debug_logger.debug(message);
        }
    }
}