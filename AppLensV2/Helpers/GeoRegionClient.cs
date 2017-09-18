using System;
using System.Collections.Generic;
using System.Configuration;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography.X509Certificates;
using System.Threading.Tasks;
using System.Web;
using AppLensV2.Helpers;

namespace AppLensV2
{
    public sealed class GeoRegionClient
    {
        private static string _authCertThumbprint;

        public static string GeoRegionEndpoint
        {
            get
            {
                string geoRegionEndpoint;
                if (Debugger.IsAttached)
                {
                    geoRegionEndpoint = "https://shgupgr1.cloudapp.net:1743/";
                }
                else
                {
                    geoRegionEndpoint = Environment.GetEnvironmentVariable("APPSETTING_GeoRegionEndpoint");
                }

                return geoRegionEndpoint;
            }
        }
        
        public static string AuthCertThumbprint
        {
            get
            {
                if (string.IsNullOrEmpty(_authCertThumbprint))
                {
                    if (Debugger.IsAttached)
                    {
                        _authCertThumbprint =
                            ConfigHelper.Evaluate(ConfigurationManager.AppSettings["geoRegionAuthCertThumbprint"]);
                    }
                    else
                    {
                        _authCertThumbprint = Environment.GetEnvironmentVariable("APPSETTING_GeoRegionAuthCertThumbprint");
                    }
                }

                return _authCertThumbprint;
            }
        }    

        public static async Task<HttpResponseMessage> GetResource(string apiRoute, string isPublic)
        {
            if (apiRoute == null)
            {
                throw new ArgumentNullException("apiRoute");
            }
            
            WebRequestHandler handler = new WebRequestHandler();
            X509Certificate2 certificate = GetMyX509Certificate();
            handler.ClientCertificates.Add(certificate);
            handler.ServerCertificateValidationCallback +=
                (sender, cert, chain, sslPolicyErrors) => true;

            using (var client = new HttpClient(handler))
            {
                // For now, setting timeout as 5 minutes until we address API perf issues on Diagnostic Role
                client.Timeout = TimeSpan.FromSeconds(5 * 60);
                client.MaxResponseContentBufferSize = Int32.MaxValue;
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                client.DefaultRequestHeaders.Add("internal-applens", isPublic);

                var response = await client.GetAsync(GeoRegionEndpoint + apiRoute);

                return response;
            }
        }

        private static X509Certificate2 GetMyX509Certificate()
        {
            X509Store certStore = new X509Store(StoreName.My, StoreLocation.CurrentUser);
            X509Certificate2 cert = null;

            certStore.Open(OpenFlags.ReadOnly);

            try
            {
                X509Certificate2Collection certCollection = certStore.Certificates.Find(
                                       X509FindType.FindByThumbprint,
                                       AuthCertThumbprint,
                                       false);
                // Get the first cert with the thumbprint
                if (certCollection.Count > 0)
                {
                    cert = certCollection[0];
                }
            }
            catch (Exception)
            {
                throw;
            }
            finally
            {
                certStore.Close();
            }

            return cert;
        }
    }
}
