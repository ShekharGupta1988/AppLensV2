module SupportCenter {
    export class PerfAnalysisResponse implements IAnalysisResponse {
        public static $inject: string[] = ["$stateParams", "$http", "TimeParamsService", "SiteService", "$q"]

        constructor(private $stateParams: IStateParams, private $http: ng.IHttpService, private TimeParamsService: ITimeParamsService, private SiteService: IResourceService, private $q: ng.IQService) {
        }

        getAnalysisResponse(): ng.IPromise<IAnalysisResult> {
            var self = this;
            var deferred = this.$q.defer<IAnalysisResult>();

            let analysis = { Promise: null, Response: null, SelectedAbnormalTimePeriod: null };
            analysis.Promise = this.$http({
                method: "GET",
                url: UriPaths.DiagnosticsPassThroughAPIPath(),
                headers: {
                    'GeoRegionApiRoute': UriPaths.PerfAnalysisPath(this.SiteService.site, this.TimeParamsService.StartTime, this.TimeParamsService.EndTime, this.TimeParamsService.TimeGrain),
                    'IsInternal': this.TimeParamsService.IsInternal
                }
            }).success((data: any) => {


                analysis.Response = angular.isDefined(data.Properties) ? data.Properties: data;
                analysis.SelectedAbnormalTimePeriod = {};
                analysis.SelectedAbnormalTimePeriod.index = analysis.Response.AbnormalTimePeriods.length - 1;
                analysis.SelectedAbnormalTimePeriod.data = analysis.Response.AbnormalTimePeriods[analysis.SelectedAbnormalTimePeriod.index];

                deferred.resolve(analysis);

            })
            .error((data: any) => {
                deferred.reject(new ErrorModel(0, "Error in call to perfanalysis API"));
            });

            return deferred.promise;
        }
    }
}