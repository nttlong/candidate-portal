const models = require("./../modules/lv.model");
const logs = require("./../libs/lv.logs");
const utils = require("./../libs/lv.utils");
const API = require("./../modules/api.recruiters");

var run = (event) => {
    var clientData = utils.readJSON(event);
    
    if (utils.isNull(clientData.AppId)) {
        utils.writeJSON(event, {
            error: {
                code: "AUT01",
                message: "AppId is empty"
            }
        });
        event.done();
        return;
    }
    var api_name = event.req.routeInfo.params.api_name;
    
    var call = (fn,recruiter) => {
        

        try {
            clientData.server = {
                recruiter: recruiter,
                req: event.req
            };
           
            var ret = fn(clientData).then(result => {
                try {
                    if (result) {

                        logs.info(api_name, {
                            data: JSON.stringify(result)
                        });
                        utils.writeJSON(event, {
                            data: result
                        });
                        event.done();
                    }
                    else {
                        utils.writeJSON(event, {
                            error: {
                                code: "R001",
                                message:"Can not calculate result"
                            }
                        });
                        event.done();
                    }
                    
                }
                catch (ex) {
                    utils.writeJSON(event, { error: { message: ex.message || ex } });
                    event.done();
                }
            })
                .catch(ex => {
                   
                    utils.writeJSON(event, { error: { message: ex.message || ex } });
                    event.done();
                })

        }
        catch (e) {
            utils.writeJSON(event, e);
            event.done();
        }
    };
    var fn = API[api_name];
    if (!fn) {
        utils.writeJSON(event, {
            error: {
                code: "ERROR",
                message: "api name is invalid"
            }
        });
        event.done();
        return;
    }
    if (api_name !== "get_access_token") {
        if (utils.isNull(clientData.AccessToken)) {
            utils.writeJSON(event, {
                error: {
                    code: "AUT02",
                    message: "AccessToken is empty"
                }
            });
            event.done();
            return;
        }
        else {
             models.sys_api_access_token()
                .where("_id==id", { id: utils.objectID(clientData.AccessToken) })
                .toItem()
                 .then(tokenItem => {
                     if (!tokenItem) {
                         utils.writeJSON(event, {
                             error: {
                                 code: "AUT03",
                                 message: "Invalid access token"
                             }
                         });
                         event.done();
                     }
                     else {
                         models.ls_recruiters()
                             .where("(RecruiterCode==Code)and(ClientEndPointService.AppId==AppId)", {
                                 Code: tokenItem.Code,
                                 AppId: clientData.AppId
                             })
                             .toItem()
                             .then(result => {
                                 if (!result) {
                                     utils.writeJSON(event, {
                                         error: {
                                             code: "AUT04",
                                             message: "Invalid App id"
                                         }
                                     });
                                     event.done();
                                     return;
                                 }
                                 call(fn,result);
                             })
                             .catch(ex => {
                                 utils.writeJSON(event, {
                                     error: {
                                         code: "AUT04",
                                         message: "Invalid App id"
                                     }
                                 });
                                 event.done();
                             });
                         
                     }
                 })
                 .catch(ex => {
                     utils.writeJSON(event, {
                         error: {
                             code: "unknown",
                             message: "unknown error"
                         }
                     });
                     event.done();
                 })
                
        }
    }
    else {
        call(fn);
    }
   
    
}
module.exports = {
    run:run
}