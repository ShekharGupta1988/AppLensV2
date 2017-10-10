module SupportCenter {
    export class ResourceServiceFactory {
        public static $inject: string[] = ["$http", "$stateParams", "ErrorHandlerService", "AseService", "SiteService"]
        constructor(private $http: ng.IHttpService, private $stateParams: IStateParams, private ErrorHandlerService: IErrorHandlerService, private aseService: AseService, private siteService: SiteService) {
        }

        GetResourceService(): IResourceService {
            let resourceService;
            switch (this.$stateParams.analysisType) {
                case Constants.aseAvailabilityAnalysis:
                case Constants.deploymentAnalysis:
                    resourceService = this.aseService;
                    break;
                default:
                    resourceService = this.siteService;
                    break;
            }
            return resourceService;
        }
    }
}