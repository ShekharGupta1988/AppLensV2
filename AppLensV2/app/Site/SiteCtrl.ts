///<reference path="../references.ts" />

module SupportCenter {
    "use strict";

    export class SiteCtrl {

        public static $inject: string[] = ["$http", "$q", "DetectorsService", "SiaService", "$mdSidenav", "SiteService", "$stateParams", "$state", "$window", "$mdPanel", "FeedbackService", "$mdToast", "ErrorHandlerService", "$mdDialog", "bowser", "ThemeService"];

        constructor(private $http: ng.IHttpService, private $q: ng.IQService, private DetectorsService: IDetectorsService, private SiaService: ISiaService, private $mdSidenav: angular.material.ISidenavService, private SiteService: IResourceService, private $stateParams: IStateParams, private $state: angular.ui.IStateService, private $window: angular.IWindowService, private $mdPanel: angular.material.IPanelService, private FeedbackService: IFeedbackService, private $mdToast: angular.material.IToastService, private ErrorHandlerService: IErrorHandlerService, private $mdDialog: angular.material.IDialogService, private bowser: any, public ThemeService: IThemeService) {

            this.avaiabilityChartData = [];
            this.requestsChartData = [];
            this.latencyChartData = [];
            this.portRejectionsChartData = [];
            this.tcpConnectionsChartData = [];
            let helper: DetectorViewHelper = new DetectorViewHelper(this.$window);
            this.availabilityChartOptions = helper.GetChartOptions('runtimeavailability');
            this.requestsChartOptions = helper.GetChartOptions('runtimeavailability');
            this.latencyChartOptions = helper.GetChartOptions('sitelatency');
            this.portRejectionsChartOptions = helper.GetChartOptions('portrejections');
            this.tcpConnectionsChartOptions = helper.GetChartOptions('tcpconnectionsusage');
            this.containerHeight = this.$window.innerHeight * 0.25 + 'px';

            this.analysisType = this.$stateParams.analysisType;

            if (!angular.isDefined(this.$stateParams.siteName) || this.$stateParams.siteName === '') {
                // TODO: show error or redirect to home page.
            }

            var self = this;
            this.SiteService.promise.then(function (data: any) {
                self.site = self.SiteService.resource;
                self.getRuntimeAvailability();
                self.getSiteLatency();
                self.getPortRejections();
                self.getTcpConnections();
                
                self.DetectorsService.getDetectors(self.site).then(function (data: DetectorDefinition[]) {
                    self.detectors = self.DetectorsService.detectorsList;

                    self.SiaService.getSiaResponse().then(function (data: IAnalysisResult) {
                        var siaResponse = data.Response;
                        _.each(siaResponse.NonCorrelatedDetectors, function (item: DetectorDefinition) {
                            _.each(self.DetectorsService.detectorsList, function (detector: DetectorDefinition) {
                                if (item.DisplayName == detector.DisplayName) {
                                    detector.Correlated = 0;
                                }
                            });
                        });

                        _.each(siaResponse.Payload, function (item: AnalysisData) {
                            _.each(self.DetectorsService.detectorsList, function (detector: DetectorDefinition) {
                                if (item.DetectorDefinition.DisplayName == detector.DisplayName) {
                                    detector.Correlated = 1;
                                }
                            });
                        });
                    }, function (err) {
                        // Error in App Analysis
                        self.ErrorHandlerService.showError(ErrorModelBuilder.Build(err));
                    });

                }, function (err) {
                    // Error in GetDetectors
                    self.ErrorHandlerService.showError(ErrorModelBuilder.Build(err));
                });
            }, function (err) {
                // Error in calling Site Details
                self.dataLoading = false;
            });
        }

        detectors: DetectorDefinition[];
        availabilityChartOptions: any;
        avaiabilityChartData: any;
        requestsChartOptions: any;
        latencyChartData: any;
        latencyChartOptions: any;
        requestsChartData: any;
        dataLoading: boolean = true;
        perfDataLoading: boolean = true;
        tcpConnectionsChartOptions: any;
        tcpConnectionsChartData: any;
        portRejectionsChartData: any;
        portRejectionsChartOptions: any;
        portRejectionsDataLoading: boolean = true;
        tcpConnectionsDataLoading: boolean = true;
        containerHeight: string;
        analysisType: string;
        site: Resource;
        avgAvailability: string;

        toggleSideNav(): void {
            this.$mdSidenav('left').toggle();
        }

        private getRuntimeAvailability(): void {

            var runtimeavailability = 'runtimeavailability';
            this.requestsChartOptions.chart.yAxis.axisLabel = 'Requests Count';
            this.requestsChartOptions.chart.yAxis.tickFormat = d3.format('d');
            var self = this;
            let helper: DetectorViewHelper = new DetectorViewHelper(this.$window);

            this.DetectorsService.getDetectorResponse(self.site, runtimeavailability).then(function (data: DetectorResponse) {
                
                let chartDataList: any = helper.GetChartData(data.StartTime, data.EndTime, data.Metrics, runtimeavailability);
                
                var iterator = 0;
                var requestsIterator = 0;
                _.each(chartDataList, function (item: any) {
                    var f: string;
                    if (item.key.toLowerCase().indexOf("availability") !== -1) {
                        item.color = DetectorViewHelper.runtimeAvailabilityColors[iterator];
                        iterator++;
                        self.avaiabilityChartData.push(item);
                    }
                    else {
                        item.area = true;
                        item.color = DetectorViewHelper.requestsColors[requestsIterator];
                        requestsIterator++;
                        self.requestsChartData.push(item);
                    }

                });

                if (angular.isDefined(data.Data) && data.Data.length > 0) {
                    let metSla = _.find(data.Data[0], function (ele) {
                        return ele.Name.toLocaleLowerCase() === 'metsla';
                    });

                    if (angular.isDefined(metSla) && metSla.Value === 'true') {
                        self.availabilityChartOptions.chart.forceY = [0, 100];
                    }

                    let avgAvailabilityItem = _.find(data.Data[0], function (ele) {
                        return ele.Name.toLocaleLowerCase() === 'averageappavailability';
                    });

                    if (angular.isDefined(avgAvailabilityItem)) {
                        self.avgAvailability = parseFloat(avgAvailabilityItem.Value).toFixed(2);
                    }
                }

                self.dataLoading = false;
            }, function (err) {
                self.dataLoading = false;
                self.ErrorHandlerService.showError(ErrorModelBuilder.Build(err));
            });
        }

        // Not using Site Latency yet 
        private getSiteLatency(): void {

            var sitelatency = 'sitelatency';
            this.latencyChartOptions.chart.yAxis.axisLabel = 'Response Time (ms)';
            this.latencyChartOptions.chart.yAxis.tickFormat = d3.format('d');
            var self = this;
            let helper: DetectorViewHelper = new DetectorViewHelper(this.$window);

            this.DetectorsService.getDetectorResponse(self.site, sitelatency).then(function (data: DetectorResponse) {

                let chartDataList: any = helper.GetChartData(data.StartTime, data.EndTime, data.Metrics, sitelatency);
                self.perfDataLoading = false;
                var iterator = 0;
                var requestsIterator = 0;

                _.each(chartDataList, function (item: any) {
                    item.color = DetectorViewHelper.defaultColors[iterator++];
                    if (item.key === '90th Percentile' || item.key === '95th Percentile') {
                        item.disabled = true;
                    }

                    self.latencyChartData.push(item);
                });
            }, function (err) {
                self.perfDataLoading = false;
                self.ErrorHandlerService.showError(ErrorModelBuilder.Build(err));
                });
        }


        private getTcpConnections(): void {

            var tcpconnectionsusage = 'tcpconnectionsusage';
            var self = this;
            let helper: DetectorViewHelper = new DetectorViewHelper(this.$window);

            this.DetectorsService.getDetectorResponse(self.site, tcpconnectionsusage).then(function (data: DetectorResponse) {

                let chartDataList: any = helper.GetChartData(data.StartTime, data.EndTime, data.Metrics, tcpconnectionsusage);
                self.tcpConnectionsDataLoading = false;
                var iterator = 0;

                _.each(chartDataList, function (item: any) {                    
                    iterator++;
                    self.tcpConnectionsChartData.push(item);

                });

                self.tcpConnectionsDataLoading = false;
            }, function (err) {
                self.tcpConnectionsDataLoading = false;
                self.ErrorHandlerService.showError(ErrorModelBuilder.Build(err));
            });
        }

        private getPortRejections(): void {

            var portrejections = 'portrejections';
            var self = this;
            let helper: DetectorViewHelper = new DetectorViewHelper(this.$window);

            this.DetectorsService.getDetectorResponse(self.site, portrejections).then(function (data: DetectorResponse) {

                let chartDataList: any = helper.GetChartData(data.StartTime, data.EndTime, data.Metrics, portrejections);
                self.portRejectionsDataLoading = false;
                var iterator = 0;

                _.each(chartDataList, function (item: any) {                   
                    iterator++;
                    self.portRejectionsChartData.push(item);

                });

                self.portRejectionsDataLoading = false;
            }, function (err) {
                self.portRejectionsDataLoading = false;
                self.ErrorHandlerService.showError(ErrorModelBuilder.Build(err));
            });
        }
    }
}