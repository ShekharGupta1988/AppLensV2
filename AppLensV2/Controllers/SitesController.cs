using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using Newtonsoft.Json.Linq;

namespace AppLensV2
{
    public class SitesController : ApiController
    {
        [HttpGet]
        [Route("api/diagnostics")]
        public async Task<HttpResponseMessage> GetDiagnosticResult()
        {
            IEnumerable<string> temp = null;
            string apiRoute = null;
            if (Request.Headers.TryGetValues("GeoRegionApiRoute", out temp))
            {
                apiRoute = temp.FirstOrDefault().ToString();
            }

            string method = "GET";
            if (Request.Headers.TryGetValues("GeoRegionApiMethod", out temp))
            {
                method = temp.FirstOrDefault().ToString();
            }

            temp = null;
            string IsInternal = "true";
            if (Request.Headers.TryGetValues("IsInternal", out temp))
            {
                IsInternal = temp.FirstOrDefault().ToString();
            }

            var response =  await GeoRegionClient.Execute(apiRoute, IsInternal, method);
            return response;
        }

        [HttpGet]
        [Route("api/stamps/{stamp}/sites/{siteName}")]
        public async Task<IHttpActionResult> GetSite(string stamp, string siteName)
        {
            return await GetSiteInternal(stamp, siteName);
        }

        [HttpGet]
        [Route("api/sites/{siteName}")]
        public async Task<IHttpActionResult> GetSite(string siteName)
        {
            return await GetSiteInternal(null, siteName);
        }

        [HttpGet]
        [Route("api/stamps/{stampName}/cluster")]
        public async Task<IHttpActionResult> GetStampCluster(string stampName)
        {
            var result = await SupportObserverClient.GetStampCluster(stampName);
            if(result.StatusCode != HttpStatusCode.OK)
            {
                return ResponseMessage(Request.CreateErrorResponse(result.StatusCode, (string)result.Content));
            }

            return Ok(result.Content);
        }

        [HttpGet]
        [Route("api/hostingEnvironments/{hostingEnvironmentName}")]
        public async Task<IHttpActionResult> GetHostingEnvironmentDetails(string hostingEnvironmentName)
        {
            var hostingEnvironmentDetails = await SupportObserverClient.GetHostingEnvironmentDetails(hostingEnvironmentName);

            if (hostingEnvironmentDetails.StatusCode != HttpStatusCode.OK)
            {
                return ResponseMessage(Request.CreateErrorResponse(hostingEnvironmentDetails.StatusCode, (string)hostingEnvironmentDetails.Content));
            }

            return Ok(new { Details = hostingEnvironmentDetails.Content });
        }

        private async Task<IHttpActionResult> GetSiteInternal(string stamp, string siteName)
        {
            var hostnamesTask = SupportObserverClient.GetHostnames(stamp, siteName);
            var siteDetailsTask = stamp == null ? SupportObserverClient.GetSite(siteName) : SupportObserverClient.GetSite(stamp, siteName);

            var hostNameResponse = await hostnamesTask;
            var siteDetailsResponse = await siteDetailsTask;

            if (siteDetailsResponse.StatusCode != HttpStatusCode.OK)
            {
                return ResponseMessage(Request.CreateErrorResponse(siteDetailsResponse.StatusCode, (string)siteDetailsResponse.Content));
            }

            if (hostNameResponse.StatusCode != HttpStatusCode.OK)
            {
                return ResponseMessage(Request.CreateErrorResponse(hostNameResponse.StatusCode, (string)hostNameResponse.Content));
            }

            return Ok(new
            {
                SiteName = siteName,
                Details = siteDetailsResponse.Content,
                HostNames = hostNameResponse.Content
            });
        }

        [HttpPost]
        [Route("api/cases/{caseId}/feedback")]
        public void CaseFeedback(string caseId, [FromBody]JToken jsonBody)
        {
            int feedbackOption = jsonBody.Value<int>("feedbackOption");
            string additionalNotes = jsonBody.Value<string>("additionalNotes");
            string url = jsonBody.Value<string>("url");
            var properties = new Dictionary<string, string>();
            properties.Add("CaseId", caseId);
            properties.Add("FeedbackOption", feedbackOption.ToString());
            properties.Add("AdditionalNotes", additionalNotes);
            properties.Add("url", url);

            switch (feedbackOption)
            {
                case 0:
                    ApplicationInsightsClient.Instance.TrackMetric("APPLENS_RESULT_SUCCESS", 1);
                    break;
                case 1:
                    ApplicationInsightsClient.Instance.TrackMetric("APPLENS_RESULT_PARTIALSUCCESS", 1);
                    break;
                case 2:
                    ApplicationInsightsClient.Instance.TrackMetric("APPLENS_RESULT_FAILED", 1);
                    break;
            }

            ApplicationInsightsClient.Instance.TrackTrace(string.Format("CASE_FEEDBACK:{0}, FeedbackOption:{1}", caseId, feedbackOption), properties);
        }

        [HttpGet]
        [Route("api/detectors/{detectorName}/files/{fileName}")]
        public async Task<IHttpActionResult> GetDetectorFiles(string detectorName, string fileName)
        {
            var result = await GithubClient.GetFileContent(detectorName, fileName);
            return Ok(result);
        }

        [HttpPost]
        [Route("api/detectors/{detectorName}/feedback")]
        public void DetectorFeedback(string detectorName, [FromBody]JToken jsonBody)
        {
            int feedbackOption = jsonBody.Value<int>("feedbackOption");
            string url = jsonBody.Value<string>("url");
            var properties = new Dictionary<string, string>();
            properties.Add("url", url);

            string metricName = string.Format("DETECTOR_{0}", detectorName.ToUpper());

            switch (feedbackOption)
            {
                case 0:
                    ApplicationInsightsClient.Instance.TrackMetric(string.Format("{0}_SUCCESS", metricName), 1, properties);
                    break;
                case 1:
                    ApplicationInsightsClient.Instance.TrackMetric(string.Format("{0}_FAILURE", metricName), 1, properties);
                    break;
            }
        }
    }
}
