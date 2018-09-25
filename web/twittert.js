var Twitter = require('twitter');
 /*
consumerKey: "59Xr5ZALVNUNC0YYkaQl6KFLS",
    consumerSecret: "h3lXCExI4lcZvu2udHkWwcV0rJXxI2MLzdMGBjX1KqVjERJDUI",
    accessToken: "2887824621-xdWJFLkO4XtsnQrMkmVh9cl0Yi3PhKLMryoXKKT",
    accessTokenSecret: "b1BY0CWL79zVr13gCNSm3V1IDrJt66jksbQ4gsaO9nMq3",
    callBackUrl: "http://win81-psn0.lacviet.com.vn/account/signin_by_twitter"
*/
var client = new Twitter({
    consumer_key: '59Xr5ZALVNUNC0YYkaQl6KFLS',
    consumer_secret: 'h3lXCExI4lcZvu2udHkWwcV0rJXxI2MLzdMGBjX1KqVjERJDUI',
  access_token_key: '2887824621-xdWJFLkO4XtsnQrMkmVh9cl0Yi3PhKLMryoXKKT',
  access_token_secret: 'b1BY0CWL79zVr13gCNSm3V1IDrJt66jksbQ4gsaO9nMq3'
});
 
var params = { screen_name: 'nodejs' };

client.post('https://api.twitter.com/oauth/request_token', {
    oauth_callback: "http://win81-psn0.lacviet.com.vn/account/signin_by_twitter"
}, function (error, ressult, response) {
    var authToken = ressult.split('=')[1].split('&')[0];
    //"oauth_token=KFbtAQAAAAAA2RunAAABYAunJhk&oauth_token_secret=e9cY4i2TvtA7wIiuiFY0eTiJbkX6tw8I&oauth_callback_confirmed=true"
    client.get('https://api.twitter.com/oauth/authenticate?oauth_token=' + authToken, {
       // oauth_callback: "http://win81-psn0.lacviet.com.vn/account/signin_by_twitter"
    }, function (error, ressult, response) {
        //"oauth_token=KFbtAQAAAAAA2RunAAABYAunJhk&oauth_token_secret=e9cY4i2TvtA7wIiuiFY0eTiJbkX6tw8I&oauth_callback_confirmed=true"

        //console.log(error)
        if (!error) {
            //console.log(tweets);
        }
    });
    //console.log(error)
  if (!error) {
    //console.log(tweets);
  }
    });
