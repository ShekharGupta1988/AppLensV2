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

namespace AppLensV2
{
    /// <summary>
    /// Client for Support Observer API communication
    /// </summary>
    public sealed class SupportObserverClient
    {
        /// <summary>
        /// Support API Endpoint
        /// </summary>
        private const string SupportObserverApiEndpoint = "https://support-bay-api.azurewebsites.net/observer/";
        
        /// <summary>
        /// Signing Key
        /// </summary>
        private static string hashKey;

        /// <summary>
        /// Signing Key
        /// </summary>
        public static string SimpleHashAuthenticationHashKey
        {
            get
            {
                if (string.IsNullOrEmpty(hashKey))
                {
                    if (Debugger.IsAttached)
                    {
                        hashKey =
                            ConfigHelper.Evaluate(ConfigurationManager.AppSettings["SimpleHashAuthenticationHashKey"]);
                    }
                    else
                    {
                        hashKey = Environment.GetEnvironmentVariable("APPSETTING_SimpleHashAuthenticationHashKey");
                    }
                }

                return hashKey;
            }
        }

        /// <summary>
        /// Get site details for siteName
        /// </summary>
        /// <param name="siteName">Site Name</param>
        /// <returns>Stamp</returns>
        internal static async Task<dynamic> GetSite(string siteName)
        {
            using (var client = new HttpClient())
            {
                client.Timeout = TimeSpan.FromSeconds(60);
                client.MaxResponseContentBufferSize = Int32.MaxValue;
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                client.DefaultRequestHeaders.Add("client-hash", SignData(string.Format("{{\"site\":\"{0}\"}}", siteName), SimpleHashAuthenticationHashKey));

                var response = await client.GetAsync(SupportObserverApiEndpoint + "sites/" + siteName + "/adminsite");

                if (response.IsSuccessStatusCode)
                {
                    var res = await response.Content.ReadAsAsync<dynamic>();
                    return res;
                }

                return null;
            }
        }

        /// <summary>
        /// Get resource group for site
        /// </summary>
        /// <param name="subscription">Site Subscription</param>
        /// <param name="webspace">Site WebSpace</param>
        /// <returns>Stamp</returns>
        internal static async Task<dynamic> GetResourceGroup(string site)
        {
            using (var client = new HttpClient())
            {
                client.Timeout = TimeSpan.FromSeconds(60);
                client.MaxResponseContentBufferSize = Int32.MaxValue;
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                client.DefaultRequestHeaders.Add("client-hash", SignData(string.Format("{{\"site\":\"{0}\"}}", site), SimpleHashAuthenticationHashKey));

                var response = await client.GetAsync(SupportObserverApiEndpoint + "sites/" + site + "/resourcegroupname?api-version=2");

                if (response.IsSuccessStatusCode)
                {
                    var res = await response.Content.ReadAsAsync<dynamic>();
                    return res;
                }

                return null;
            }
        }

        /// <summary>
        /// Get Stamp for siteName
        /// </summary>
        /// <param name="siteName">Site Name</param>
        /// <returns>Stamp</returns>
        internal static async Task<dynamic> GetStamp(string siteName)
        {
            using (var client = new HttpClient())
            {
                client.Timeout = TimeSpan.FromSeconds(60);
                client.MaxResponseContentBufferSize = Int32.MaxValue;
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                client.DefaultRequestHeaders.Add("client-hash", SignData(string.Format("{{\"site\":\"{0}\"}}", siteName), SimpleHashAuthenticationHashKey));

                var response = await client.GetAsync(SupportObserverApiEndpoint + "sites/" + siteName + "/stamp");

                if (response.IsSuccessStatusCode)
                {
                    var res = await response.Content.ReadAsAsync<dynamic>();
                    return res;
                }

                return null;
            }
        }

        /// <summary>
        /// Get Hostnames for a site
        /// </summary>
        /// <param name="siteName">SiteName</param>
        /// <returns>Hostnames</returns>
        internal static async Task<dynamic> GetHostnames(string siteName)
        {
            using (var client = new HttpClient())
            {
                client.Timeout = TimeSpan.FromSeconds(60);
                client.MaxResponseContentBufferSize = int.MaxValue;
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                client.DefaultRequestHeaders.Add("client-hash", SignData(string.Format("{{\"site\":\"{0}\"}}", siteName), SimpleHashAuthenticationHashKey));

                var response = await client.GetAsync(SupportObserverApiEndpoint + "sites/" + siteName + "/hostnames?api-version=2.0");

                if (response.IsSuccessStatusCode)
                {
                    var res = await response.Content.ReadAsAsync<dynamic>();
                    return res;
                }

                return null;
            }
        }

        /// <summary>
        /// Sign Data
        /// </summary>
        /// <param name="data">data</param>
        /// <param name="key">key</param>
        /// <returns>hash value</returns>
        private static string SignData(string data, string key)
        {
            var signedList = new List<string>();
            using (var hmacSha1 = new HMACSHA1())
            {
                hmacSha1.Key = Encoding.UTF8.GetBytes(key);
                byte[] hashBytes = hmacSha1.ComputeHash(Encoding.UTF8.GetBytes(data));
                return Convert.ToBase64String(hashBytes);
            }
        }
    }
}