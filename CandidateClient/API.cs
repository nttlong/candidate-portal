using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Net;
using System.Text;

namespace CandidateClient
{
    public class API
    {
        private static string _url;
        private static string _AppId;

        public static void SetUrl(string url)
        {
            _url = url;
        }

        public static void SetAppId(string AppId)
        {
            _AppId = AppId;
        }

        public static RetAPI Call(string api_name, object posData)
        {
            var data = new
            {
                AppId = _AppId,
                data = Newtonsoft.Json.JsonConvert.SerializeObject(posData)
            };
            using (var client = new WebClient())
            {
                client.Headers[HttpRequestHeader.ContentType] = "application/json";
                client.Headers[HttpRequestHeader.Accept] = "application/json";
                var jsonData = Encoding.UTF8.GetBytes(Newtonsoft.Json.JsonConvert.SerializeObject(data));
                byte[] result = client.UploadData(_url+ "/jobs_api/" + api_name, "POST", jsonData);
                var txt = UnicodeEncoding.UTF8.GetString(result);
                var ret = Newtonsoft.Json.JsonConvert.DeserializeObject<RetAPI>(txt);
                return ret;
                
            }
        }
    }
}
