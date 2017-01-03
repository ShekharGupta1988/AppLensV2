using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace AppLensV2
{
    public class SitesController : ApiController
    {
        [HttpGet]
        [Route("api/diagnostics")]
        public async Task<IHttpActionResult> GetDiagnosticResult()
        {
            IEnumerable<string> temp = null;
            string apiRoute = null;
            if (Request.Headers.TryGetValues("GeoRegionApiRoute", out temp))
            {
                apiRoute = temp.FirstOrDefault().ToString();
            }

            var result = await GeoRegionClient.GetResource(apiRoute);

            if (result == null)
            {
                return Ok();
            }

            return Ok(result);
        }

        [HttpGet]
        [Route("api/sites/{siteName}")]
        public async Task<IHttpActionResult> GetSite(string siteName)
        {
            var stampTask = SupportObserverClient.GetStamp(siteName);
            var hostnamesTask = SupportObserverClient.GetHostnames(siteName);
            var siteDetailsTask = SupportObserverClient.GetSite(siteName);

            var stampResponse = await stampTask;
            var hostNameResponse = await hostnamesTask;
            var siteDetailsResponse = await siteDetailsTask;

            var resourceGroup = await SupportObserverClient.GetResourceGroup((string)siteDetailsResponse.First.SiteName);
            siteDetailsResponse.First.ResourceGroupName = resourceGroup;

            return Ok(new
            {
                SiteName = siteName,
                Details = siteDetailsResponse,
                Stamp = stampResponse,
                HostNames = hostNameResponse
            });
        }
        
        [HttpGet]
        [Route("api/detectors/{detectorName}/files/{fileName}")]
        public async Task<IHttpActionResult> GetDetectorFiles(string detectorName, string fileName)
        {
            var result = await GithubClient.GetFileContent(detectorName, fileName);
            return Ok(result);
        }
    }
}
