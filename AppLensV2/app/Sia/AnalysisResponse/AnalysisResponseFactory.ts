module SupportCenter {
    export class AnalysisResponseFactory {
        public static $inject: string[] = ["$stateParams", "$http", "TimeParamsService", "AseService", "SiteService", "$q"]
        constructor(private $stateParams: IStateParams, private $http: ng.IHttpService, private TimeParamsService: ITimeParamsService, private AseService: IResourceService, private SiteService: IResourceService, private $q: ng.IQService) {
        }

        GetAnalysis(): IAnalysisResponse {
            let analysis;
            switch (this.$stateParams.analysisType) {
                case Constants.appAnalysis:
                    analysis = new AppAnalysisResponse(this.$stateParams, this.$http, this.TimeParamsService, this.SiteService, this.$q);
                    break;
                case Constants.perfAnalysis:
                    analysis = new PerfAnalysisResponse(this.$stateParams, this.$http, this.TimeParamsService, this.SiteService, this.$q);
                    break;
                case Constants.aseAvailabilityAnalysis:
                    analysis = new AseAvailabilityAnalysisResponse(this.$stateParams, this.$http, this.TimeParamsService, this.AseService, this.$q);
                    break;
                case Constants.deploymentAnalysis:
                    analysis = new DeploymentAnalysisResponse(this.$stateParams, this.$http, this.TimeParamsService, this.AseService, this.$q);
                    break;
            }
            return analysis;
        }
    }
}