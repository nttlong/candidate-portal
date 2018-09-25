using System.Collections;
using System.Data;

namespace CandidateClient
{
    public class RetAPI
    {
        public Error error { get; set; }
        public Hashtable data { get; set; }
        public DataTable items { get; set; }
        public int totalItems { get; set; }
        public int pageIndex { get; set; }
        public int totalPage { get; set; }
        public string description { get; set; }
        public string message { get; set; }
    }
}