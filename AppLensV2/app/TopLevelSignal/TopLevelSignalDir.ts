///<reference path="../references.ts" />

module SupportCenter {
    "use strict";

    export interface ITopLevelSignalCtrl {
        getTemplateUrl(): string;
        updateChartInfo(ctrl: TopLevelSignalCtrl, analysisType: string): void;
    }

    export interface ITopLevelSignalScope extends ng.IScope {
        template: string;
        getTemplateUrl(): string;
        updateChart(analysisType: string): void;
    }

    export class TopLevelSignalCtrl implements ITopLevelSignalCtrl {
        public static $inject: string[] = ["$scope", "DetectorsService", "$stateParams", "$window", "ResourceServiceFactory", 'ErrorHandlerService'];
        public topLevelDetectorName: string;
        public viewHelper: DetectorViewHelper;
        public dataLoading: boolean;
        public containerHeight: string;
        public resourceService: IResourceService;
        public detectorsService: IDetectorsService;
        public chartOptions: any;
        public chartData: any;

        constructor(private $scope: ITopLevelSignalScope, private DetectorsService: IDetectorsService, private $stateParams: IStateParams, private $window: angular.IWindowService, private resourceServiceFactory: ResourceServiceFactory, private ErrorHandlerService: IErrorHandlerService) {
            let self = this;
            self.viewHelper = new DetectorViewHelper(this.$window);
            this.containerHeight = this.$window.innerHeight * 0.25 + 'px';
            self.resourceService = this.resourceServiceFactory.GetResourceService();
            self.detectorsService = this.DetectorsService;
            this.$scope.updateChart = function (analysisType: string) { self.updateChartInfo(self, analysisType) };
        }

        getTemplateUrl(): string {
            return "app/TopLevelSignal/deployment-toplevelview.html";
        }

        getAnalysisType(): string {
            let self = this;
            return self.$stateParams.analysisType;
        }

        updateChartInfo(ctrl: TopLevelSignalCtrl, analysisType: string): void {
            let self = ctrl;
            let topLevelDetector;
            ctrl.dataLoading = true;
            switch (this.$stateParams.analysisType) {
                case Constants.deploymentAnalysis:
                    topLevelDetector = "asedeployment";
                    break;
                case Constants.aseAvailabilityAnalysis:
                    topLevelDetector = "overallruntimeavailability";
                    break;
            }
            self.resourceService.promise.then(function (data: any) {
                self.detectorsService.getDetectorResponse(self.resourceService.resource, topLevelDetector).then(function (detectorResponse: DetectorResponse) {
                    self.chartOptions = self.viewHelper.GetChartOptions(topLevelDetector, self.detectorsService, self.resourceService.resource);
                    self.chartData = self.viewHelper.GetChartData(detectorResponse.StartTime, detectorResponse.EndTime, detectorResponse.Metrics, topLevelDetector);
                    self.chartOptions.chart.height = self.chartOptions.chart.height + (self.chartData.length / 8) * 20;
                    self.chartOptions.chart.margin.top = 20 + (self.chartData.length / 8) * 20;
                    ctrl.dataLoading = false;
                });
            });
        }
    }

    export class TopLevelSignalDir implements ng.IDirective {
        restrict = 'E';
        templateUrl = './app/TopLevelSignal/placeholder.html';
        controller = TopLevelSignalCtrl;
        controllerAs = "ctrl";
        public link = function (scope: ITopLevelSignalScope, controller: ITopLevelSignalCtrl) {
            scope.$watch("ctrl.getAnalysisType()", function (value: string) {
                scope.updateChart(value);
            }, true);
        }
    }
}