module SupportCenter {
    export class ResourceServiceFactory {
        public static $inject: string[] = ["$http", "$stateParams", "ErrorHandlerService"]
        constructor(private $http: ng.IHttpService, private $stateParams: IStateParams, private ErrorHandlerService: IErrorHandlerService) {
        }

        GetResourceService(): IResourceService {
            let resourceService;
            switch (this.$stateParams.analysisType) {
                case Constants.appAnalysis:
                case Constants.perfAnalysis:
                    resourceService = new SiteService(this.$http, this.$stateParams, this.ErrorHandlerService);
                    break;
                case Constants.aseAvailabilityAnalysis:
                case Constants.deploymentAnalysis:
                    resourceService = new AseService(this.$http, this.$stateParams, this.ErrorHandlerService);
                    break;
            }
            return resourceService;
        }
    }
}