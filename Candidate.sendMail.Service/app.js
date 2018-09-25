const log4js = require('log4js');
log4js.configure({
    appenders: {
        debug: { type: 'file', filename: './logs/debug/log.log' },
        info: { type: 'file', filename: './logs/info/log.log' }
    },
    categories: {
        default: { appenders: ['debug'], level: 'debug' },
        info: { appenders: ['info'], level: 'info' }
    }
});
const logger = log4js.getLogger('debug');
const logger_info = log4js.getLogger('info');
var MongoClient = require('mongodb').MongoClient;
const nodemailer = require('nodemailer');
const fs = require('fs');


var dbContext = null;
var config = null;
var emailSettings = null;
var listItems = [];
var loadSettings = (callback) => {
    logger_info.info("load settings");
    dbContext.collection("sys_email_config")
        .findOne({}, (error, data) => {
            if (error) {
                logger.debug(error);
            }
            else {
                emailSettings = data;
                logger_info.info(JSON.stringify(emailSettings));
                callback();
            }
        });
};
var sentItems = (callback) => {
    console.clear();
    console.log(listItems);
    callback();
};
var sendItem = (callback) => {
    if (listItems.length > 0) {
        var item = listItems.pop();
        var mailer = require("nodemailer");
        var mail = {
            from: emailSettings.Email,
            to: item.MailTo,
            subject: item.Subject,
            text: item.Content,
            html: item.HtmlContent
        };
        // Use Smtp Protocol to send Email
        var smtpConfig = {
            host: emailSettings.MailServer,
            auth: {
                user: emailSettings.Username,
                pass: emailSettings.Password
            },
            // direct:true,
            port: emailSettings.Port,
            secure: emailSettings.UseSSL,
            use_authentication: !config.UseDefaultCredentials,
            tls: { rejectUnauthorized: false },
        };
        logger_info.info(smtpConfig);
        var smtpTransport = mailer.createTransport(smtpConfig);
        smtpTransport.verify((err, test) => {
            if (!err) {
                smtpTransport.sendMail(mail, function (error, response) {
                    var time = new Date();
                    var utcDate = Date.UTC(time.getUTCFullYear(), time.getUTCMonth(), time.getUTCDate(), time.getUTCHours(), time.getUTCMinutes(), time.getUTCSeconds(), time.getUTCMilliseconds());
                    if (error) {
                        logger.debug(error);
                        dbContext.collection("sys_email_sent").updateOne({_id:item._id}, {
                            $set: {
                                HasError: true,
                                HasSent: false,
                                SentOn: new Date(),
                                ErrorDescription: JSON.stringify(error),
                                SentDateUTC: utcDate
                            }
                        }, (e, r) => {
                            if (e) {
                                logger.debug(e);
                            }
                            else {
                                logger_info.info("update data success ");
                            }
                        });
                        sendItem(callback);
                    } else {
                        smtpTransport.close();
                      
                        dbContext.collection("sys_email_sent").updateOne({ _id: item._id}, {
                            $set: {
                                HasError: false,
                                HasSent:true,
                                SentOn: new Date(),
                                ErrorDescription: "",
                                SentDateUTC: utcDate
                            }
                        }, (e, r) => {
                            if (e) {
                                logger.debug(e);
                            }
                            else {
                                logger_info.info("update data success ");
                            }
                        });
                        sendItem(callback);
                    }
                });
            }
        });
    }
    else {
        callback();
    }
}
var loadItems = () => {
    dbContext.collection("sys_email_sent").find({ HasSent: false, HasError:false }).toArray((error, data) => {
        if (error) {
            log4js.debug(error);

        }
        else {
            listItems = data;
            sentItems(() => {
                sendItem(() => {
                    setTimeout(() => {
                        loadItems();
                    }, 3000);
                });
            });
        }
    });
};
var startProcess = () => {
    fs.readFile('./config/email.json', 'utf8', (err, data) => {

        if (err) {
            logger.error(err);
        }
        config = Function("", "return " + data)();
        logger_info.info(config);
        MongoClient.connect(config.url, function (err, db) {
            if (err) throw logger.debug(err);
            logger_info.info("Open connect '" + config.url + "'");
            dbContext = db;
            loadSettings(() => {
                loadItems();
            });
        });
    });
};
startProcess();


