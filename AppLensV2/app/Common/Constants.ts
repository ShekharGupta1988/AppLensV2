///<reference path="../references.ts" />

module SupportCenter {
    "use strict";

    export class Constants {
        public static geoRegionApiRouteHeaderName: string = "GeoRegionApiRoute";
        public static aggregatedWorkerName: string = "aggregated";
        public static perfAnalysis: string = "perfAnalysis";
        public static appAnalysis: string = "appAnalysis";
        public static appRestartAnalysis: string = "appRestartAnalysis"
        public static aseAvailabilityAnalysis: string = "aseAvailabilityAnalysis";
        public static deploymentAnalysis: string = "aseDeploymentAnalysis";
    }

    export class UriPaths {

        private static siteDetails: string = "/api/sites/{siteName}";
        private static siteDetailsWithStamp: string = "/api/stamps/{stamp}/sites/{siteName}";
        private static appServiceEnvironmentDetails: string = "/api/hostingEnvironments/{hostingEnvironmentName}"
        private static diagnosticsPassThroughApiPath: string = "/api/diagnostics";
        private static detectorsDocumentAPIPath: string = "/api/detectors/{detectorName}/files/{fileName}";

        // Uri Paths of Geo Region Diagnostic Role APIs
        private static baseAPIPathSites: string = "v2/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Web/sites/{site}/diagnostics";
        private static baseAPIPathAse: string = "/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Web/hostingEnvironments/{hostingEnvironmentName}/troubleshoot";
        private static commonQueryString: string = "stampName={stamp}&hostingEnvironmentName={hostingEnvironmentName}&vnetResourceGroup={vnetResourceGroup}&vnetName={vnetName}&vnetSubnetName={vnetSubnetName}&{hostnames}&startTime={start}&endTime={end}&timeGrain={grain}";
        
        private static analysisResrouce: string = "/{analysisName}?" + UriPaths.commonQueryString;

        private static detectors: string = "/detectors";
        private static detectorResource: string = "/detectors/{detectorName}?" + UriPaths.commonQueryString;
        private static siteDiagnosticProperties: string = "/properties";

        // Uri Paths for feedback APIs
        private static caseFeedback: string = "/api/cases/{caseId}/feedback";
        private static detectorFeedback: string = "/api/detectors/{detectorName}/feedback";

        // Uri Paths for Support Center sessions
        private static supportCenterSessionsList: string = "/api/caseanalysis/{site}/sessions";
        private static supportCenterSession: string = "/api/supportcentersessions/{sessionId}";
        private static supportCenterTicketWorflow: string = "/api/supportcenterworkflows/{ticketWorkflowId}";

        public static SiteDetailsPath(params: IStateParams): string {
            if (angular.isDefined(params.stamp) && params.stamp !== '') {
                return UriPaths.siteDetailsWithStamp.replace("{stamp}", params.stamp).replace("{siteName}", params.siteName);
            } else {
                return UriPaths.siteDetails.replace("{siteName}", params.siteName);
            }
        }

        // URI path to get details for ASE
        public static AppServiceEnvironmentDetails(params: IStateParams): string {
            if (angular.isDefined(params.hostingEnvironmentName) && params.hostingEnvironmentName !== '') {
                return UriPaths.appServiceEnvironmentDetails.replace("{hostingEnvironmentName}", params.hostingEnvironmentName);
            }
        }

        public static DiagnosticsPassThroughAPIPath(): string {
            return UriPaths.diagnosticsPassThroughApiPath;
        }

        public static DetectorsDocumentApiPath(detectorName: string, fileName: string): string {
            return UriPaths.detectorsDocumentAPIPath
                .replace("{detectorName}", detectorName)
                .replace("{fileName}", fileName);
        }

        public static CaseFeedbackPath(caseId: string): string {
            return UriPaths.caseFeedback
                .replace("{caseId}", caseId);
        }

        public static DetectorFeedbackPath(detectorName: string): string {
            return UriPaths.detectorFeedback
                .replace("{detectorName}", detectorName);
        }

        public static AnalysisResourcePath(analysisResourceName: string, resource: Resource, startTime: string, endTime: string, timeGrain: string): string {
            return UriPaths.CreateGeoRegionAPIPath(UriPaths.analysisResrouce.replace("{analysisName}", analysisResourceName), resource, startTime, endTime, timeGrain);
        }
        
        public static ListDetectorsPath(resource: Resource): string {
            return UriPaths.CreateGeoRegionAPIPath(UriPaths.detectors, resource, '', '', '');
        }

        public static SiteDiagnosticPropertiesPath(site: Site): string {
            return UriPaths.CreateGeoRegionAPIPath(UriPaths.siteDiagnosticProperties, site, '', '', '');
        }

        public static DetectorResourcePath(resource: Resource, detectorName: string, startTime: string, endTime: string, timeGrain: string): string {
            return UriPaths.CreateGeoRegionAPIPath(UriPaths.detectorResource, resource, startTime, endTime, timeGrain)
                .replace("{detectorName}", detectorName);
        }
        
        public static SupportCenterSessionsListPath(siteName: string): string {
            return UriPaths.supportCenterSessionsList.replace("{site}", siteName);
        }

        public static SupportCenterSessionPath(sessionId: string): string {
            return UriPaths.supportCenterSession
                .replace("{sessionId}", sessionId);
        }

        public static SupportCenterTicketWorkflowPath(ticketWorkflowId: string): string {
            return UriPaths.supportCenterTicketWorflow
                .replace("{ticketWorkflowId}", ticketWorkflowId);
        }

        private static CreateGeoRegionAPIPath(pathFormat: string, resource: Resource, startTime: string, endTime: string, timeGrain: string): string {
            if (resource instanceof Site) {
                pathFormat = UriPaths.baseAPIPathSites + pathFormat;
            } else {
                pathFormat = UriPaths.baseAPIPathAse + pathFormat;
            }
            var path = pathFormat
                .replace("{sub}", resource.subscriptionId)
                .replace("{rg}", resource.resourceGroup)
                .replace("{site}", resource.resourceName)
                .replace("{stamp}", resource.resourceInternalStamp)
                .replace("{start}", startTime)
                .replace("{end}", endTime)
                .replace("{grain}", timeGrain);

            //refactor this later
            if (resource instanceof Site) {
                var site = resource as Site;
                var hostNamesFilter = '';
                for (let hostname of site.hostNames) {
                    hostNamesFilter += "hostNames=" + hostname;

                    if (site.hostNames[site.hostNames.length - 1] != hostname) {
                        hostNamesFilter += "&";
                    }
                }

                path =
                    path.replace("{hostnames}", hostNamesFilter)
                        .replace("{hostingEnvironmentName}", resource.stampName);
            } else {
                var hostingEnvironment = resource as HostingEnvironment;
                path =
                    path
                    .replace("{hostingEnvironmentName}", resource.resourceName)
                    .replace("{vnetResourceGroup}", hostingEnvironment.VNetResourceGroup)
                    .replace("{vnetName}", hostingEnvironment.VNetName)
                    .replace("{vnetSubnetName}", hostingEnvironment.VNetSubnetName);
            }

            return path;
        }

    }
}