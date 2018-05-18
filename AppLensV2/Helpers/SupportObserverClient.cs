using System;
using System.Collections.Generic;
using System.Configuration;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using AppLensV2.Helpers;
using Newtonsoft.Json;
using System.Net;
using Microsoft.IdentityModel.Clients.ActiveDirectory;

namespace AppLensV2
{
    public class ObserverResponse
    {
        public HttpStatusCode StatusCode;

        public dynamic Content;
    }

    /// <summary>
    /// Client for Support Observer API communication
    /// </summary>
    public sealed class SupportObserverClient
    {
        private static AuthenticationContext _authContext;
        private static ClientCredential _aadCredentials;
        private static string _supportObserverResourceUri;
        private static object lockObject = new object();
        private static bool targetSupportApiTestSlot;

        private static string SupportApiEndpoint
        {
            get
            {
                bool.TryParse(ConfigurationManager.AppSettings["TargetSupportApiTestSlot"], out targetSupportApiTestSlot);

                if (Debugger.IsAttached && targetSupportApiTestSlot)
                {
                    return "https://support-bay-api-test.azurewebsites.net/";
                }
                else
                {
                    return "https://support-bay-api.azurewebsites.net/";
                }
            }
        }

        /// <summary>
        /// Support API Endpoint
        /// </summary>
        private static string SupportObserverApiEndpoint
        {
            get
            {
                return SupportApiEndpoint + "observer/";
            }
        }

        private static AuthenticationContext AuthContext {
            get
            {
                if (_authContext == null)
                {
                    _authContext = new AuthenticationContext("https://login.microsoftonline.com/microsoft.onmicrosoft.com", TokenCache.DefaultShared);
                }

                return _authContext;
            }
        } 

        private static ClientCredential AADCredentials
        {
            get
            {
                if (_aadCredentials == null)
                {
                    var clientId = Debugger.IsAttached ? ConfigurationManager.AppSettings["clientId"] : Environment.GetEnvironmentVariable("APPSETTING_AADClientId");
                    var clientSecret = Debugger.IsAttached ? ConfigurationManager.AppSettings["clientSecret"] : Environment.GetEnvironmentVariable("APPSETTING_SupportObserverClientSecret");

                    _aadCredentials = new ClientCredential(clientId, clientSecret);
                }
                return _aadCredentials;
            }
        }

        private static string SupportObserverResourceUri
        {
            get
            {
                if (_supportObserverResourceUri == null)
                {
                    _supportObserverResourceUri = Debugger.IsAttached ? ConfigurationManager.AppSettings["resourceId"] : Environment.GetEnvironmentVariable("APPSETTING_SupportObserverResourceId");
                }

                return _supportObserverResourceUri;
            }
        }

        /// <summary>
        /// http client
        /// </summary>
        private static readonly Lazy<HttpClient> _client = new Lazy<HttpClient>(() =>
            {
                var client = new HttpClient();
                client.DefaultRequestHeaders.Accept.Clear();
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                client.Timeout = TimeSpan.FromSeconds(30);

                return client;
            }
        );

        /// <summary>
        /// http client
        /// </summary>
        private static HttpClient _httpClient
        {
            get
            {
                return _client.Value;
            }
        }

        /// <summary>
        /// Get site details for siteName
        /// </summary>
        /// <param name="siteName">Site Name</param>
        internal static async Task<ObserverResponse> GetSite(string siteName)
        {
            return await GetResourceInternal(SupportObserverApiEndpoint + "sites/" + siteName + "/adminsites?api-version=2.0");
        }

        /// <summary>
        /// Get site details for siteName
        /// </summary>
        /// <param name="stamp">Stamp</param>
        /// <param name="siteName">Site Name</param>
        internal static async Task<ObserverResponse> GetSite(string stamp, string siteName)
        {
            return await GetResourceInternal(SupportObserverApiEndpoint + "stamps/" + stamp + "/sites/" + siteName + "/adminsites?api-version=2.0");
        }

        internal static async Task<ObserverResponse> GetStampCluster(string stamp)
        {
            return await GetResourceInternal(SupportApiEndpoint + "stamps/" + stamp + "/cluster", "GetStampCluster");
        }

        private static async Task<ObserverResponse> GetResourceInternal(string endpoint, string apiName = "GetAdminSite")
        {
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri(endpoint),
                Method = HttpMethod.Get
            };
            
            request.Headers.Add("Authorization", await GetSupportObserverAccessToken());
            var response = await _httpClient.SendAsync(request);

            ObserverResponse res = await CreateObserverResponse(response, apiName);
            return res;
        }

        /// <summary>
        /// Get resource group for site
        /// </summary>
        /// <param name="site">Site</param>
        /// <returns>Resource Group</returns>
        internal static async Task<dynamic> GetResourceGroup(string site)
        {
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri(SupportObserverApiEndpoint + "sites/" + site + "/resourcegroupname?api-version=2"),
                Method = HttpMethod.Get
            };
          
            var serializedParameters = JsonConvert.SerializeObject(new Dictionary<string, string>() { { "site", site } });
            request.Headers.Add("Authorization", await GetSupportObserverAccessToken());
            var response = await _httpClient.SendAsync(request);

            ObserverResponse res = await CreateObserverResponse(response, "GetResourceGroup(2.0)");
            return res;
        }

        /// <summary>
        /// Get Stamp for siteName
        /// </summary>
        /// <param name="siteName">Site Name</param>
        /// <returns>Stamp</returns>
        internal static async Task<ObserverResponse> GetStamp(string siteName)
        {
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri(SupportObserverApiEndpoint + "sites/" + siteName + "/stamp"),
                Method = HttpMethod.Get
            };

            var serializedParameters = JsonConvert.SerializeObject(new Dictionary<string, string>() { { "site", siteName } });
            request.Headers.Add("Authorization", await GetSupportObserverAccessToken());
            var response = await _httpClient.SendAsync(request);

            ObserverResponse res = await CreateObserverResponse(response, "GetStamp");
            return res;
        }

        /// <summary>
        /// Get Hostnames for a site
        /// </summary>
        /// <param name="siteName">SiteName</param>
        /// <returns>Hostnames</returns>
        internal static async Task<ObserverResponse> GetHostnames(string stamp, string siteName)
        {
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri(SupportObserverApiEndpoint + (!string.IsNullOrWhiteSpace(stamp) ? "stamps/" + stamp + "/": string.Empty) + "sites/" + siteName + "/hostnames?api-version=2.0"),
                Method = HttpMethod.Get
            };

            request.Headers.Add("Authorization", await GetSupportObserverAccessToken());
            var response = await _httpClient.SendAsync(request);

            ObserverResponse res = await CreateObserverResponse(response, "GetHostnames(2.0)");
            return res;
        }

        internal static async Task<ObserverResponse> GetHostingEnvironmentDetails(string hostingEnvironmentName)
        {
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri(SupportObserverApiEndpoint + "hostingEnvironments/" + hostingEnvironmentName + "?api-version=2.0"),
                Method = HttpMethod.Get
            };

            var serializedParameters = JsonConvert.SerializeObject(new Dictionary<string, string>() { { "hostingEnvironment", hostingEnvironmentName } });
            request.Headers.Add("Authorization", await GetSupportObserverAccessToken());
            var response = await _httpClient.SendAsync(request);

            ObserverResponse res = await CreateObserverResponse(response, "GetHostingEnvironmentDetails(2.0)");
            return res;
        }

        private static async Task<ObserverResponse> CreateObserverResponse(HttpResponseMessage response, string apiName = "")
        {
            var observerResponse = new ObserverResponse();

            if (response == null)
            {
                observerResponse.StatusCode = HttpStatusCode.InternalServerError;
                observerResponse.Content = "Unable to fetch data from Observer API : " + apiName;
            }

            observerResponse.StatusCode = response.StatusCode;

            if (response.IsSuccessStatusCode)
            {
                observerResponse.Content = await response.Content.ReadAsAsync<dynamic>();
            }
            else if(response.StatusCode == HttpStatusCode.NotFound)
            {
                observerResponse.Content = (string)"Resource Not Found. API : " + apiName;
            }
            else
            {
                observerResponse.Content = (string)"Unable to fetch data from Observer API : " + apiName;
            }

            return observerResponse;
        }

        private static async Task<string> GetSupportObserverAccessToken()
        {
            var authResult = await AuthContext.AcquireTokenAsync(SupportObserverResourceUri, AADCredentials);
            return "Bearer " + authResult.AccessToken;
        }
    }
}