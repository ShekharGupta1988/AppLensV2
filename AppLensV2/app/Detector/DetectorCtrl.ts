///<reference path="../references.ts" />

module SupportCenter {
    "use strict";

    export class DetectorCtrl {

        public static $inject: string[] = ["DetectorsService", "$stateParams", "SiteService", "AseService", "$window", "ErrorHandlerService"];

        constructor(private DetectorsService: IDetectorsService, private $stateParams: IStateParams, private SiteService: IResourceService, private AseService: IResourceService, private $window: angular.IWindowService, private ErrorHandlerService: IErrorHandlerService) {

            var self = this;
            this.detectorName = this.$stateParams.detectorName.toLowerCase();
            
            let helper: DetectorViewHelper = new DetectorViewHelper(this.$window);

            let resourceService: IResourceService;

            //temporary solution until we can figure out how to inject controllers through app.ts
            if (this.$stateParams.hostingEnvironmentName !== undefined) {
                resourceService = AseService;
            } else {
                resourceService = SiteService;
            }

            resourceService.promise.then(function (data: any) {
                self.resource = resourceService.resource;

                self.DetectorsService.getDetectors(self.resource).then(function (data: DetectorDefinition[]) {
                    self.detectorInfo = _.find(data, function (item: DetectorDefinition) {
                        return item.Name.toLowerCase() === self.detectorName;
                    });
                });

                self.DetectorsService.getDetectorResponse(self.resource, self.detectorName).then(function (data: DetectorResponse) {
                    self.detectorResponse = data;
                    self.chartOptions = helper.GetChartOptions(self.detectorName, DetectorsService, self.resource);
                    self.chartData = helper.GetChartData(data.StartTime, data.EndTime, data.Metrics, self.detectorName);

                    self.chartOptions.chart.height =
                        self.chartOptions.chart.height + (self.chartData.length / 8) * 20;
                    self.chartOptions.chart.margin.top = 20 + (self.chartData.length / 8) * 20;
                    if (self.detectorName.indexOf('sitecpuanalysis') > 0 || self.detectorName.indexOf('sitememoryanalysis') > 0) {
                        self.chartOptions.chart.yAxis.axisLabel = 'Percent';
                    }
                    if (self.detectorName.indexOf('tcpconnectionsusage') > 0) {
                        self.chartOptions.chart.yAxis.axisLabel = 'Connection Count';
                    }
                    if (self.detectorName.indexOf('tcpopensocketcount') > 0) {
                        self.chartOptions.chart.yAxis.axisLabel = 'Open Sockets Count';
                    }

                    self.dataLoading = false;
                    if (self.detectorName.indexOf('filesystemusage') >= 0) {
                        let title = "";
                        for (let metric of data.Metrics) {
                            if (metric.Name === "Total" || metric.Name === "Used") {
                                title += metric.Name + ':' + metric.Values[0].Total.toString() + metric.Unit + "\n";
                            }
                        }
                        self.chartOptions.chart.title = title;
                        
                    }

                    self.abnormalTimePeriods = data.AbnormalTimePeriods;
                }, function (err) {
                    self.dataLoading = false;
                    self.ErrorHandlerService.showError(ErrorModelBuilder.Build(err));
                });

                self.DetectorsService.getDetectorWiki(self.detectorName).then(function (wikiResponse) {
                    self.wikiContent = wikiResponse;
                });

                self.DetectorsService.getDetectorSolution(self.detectorName).then(function (solutionResponse) {
                    self.solutionContent = solutionResponse;
                });
            }, function (err) {

                // Error in calling Site Details
                self.dataLoading = false;
            });
        }

        public detectorResponse: DetectorResponse;
        private resource: Resource;
        detectorName: string;
        chartOptions: any;
        chartData: any;
        dataLoading: Boolean = true;
        detectorInfo: DetectorDefinition;
        wikiContent: string;
        solutionContent: string;
        abnormalTimePeriods: any;
    }
}