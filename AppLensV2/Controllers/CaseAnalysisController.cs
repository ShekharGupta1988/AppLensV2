using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace AppLensV2
{
    public class CaseAnalysisController : ApiController
    {
        [HttpGet]
        [Route("api/caseanalysis/{siteName}/sessions")]
        public async Task<IHttpActionResult> GetSupportCenterSessionsForSite(string siteName)
        {
            var result = await CaseAnalysisHelper.GetSupportCenterSessionsForSite(siteName);
            return Ok(result);
        }

        [HttpGet]
        [Route("api/supportcentersessions/{sessionId}")]
        public async Task<IHttpActionResult> GetSupportCenterSessionData(string sessionId)
        {
            var result = await CaseAnalysisHelper.GetSupportCenterDataForSession(sessionId, DateTime.UtcNow.AddDays(-15), DateTime.UtcNow);
            return Ok(result);
        }

        [HttpGet]
        [Route("api/supportcenterworkflows/{workflowId}")]
        public async Task<IHttpActionResult> GetSupportCenterWorkflowData(string workflowId)
        {
            var result = await CaseAnalysisHelper.GetSupportCenterDataForTicketWorkflow(workflowId, DateTime.UtcNow.AddDays(-15), DateTime.UtcNow);
            return Ok(result);
        }
    }
}
