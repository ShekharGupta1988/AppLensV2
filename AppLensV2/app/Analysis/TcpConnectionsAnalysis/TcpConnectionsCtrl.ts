///<reference path="../../references.ts" />

module SupportCenter {
    "use strict";

    export class TcpConnectionsCtrl {

        public static $inject: string[] = ["$http", "$q", "DetectorsService", "SiaService", "$mdSidenav", "SiteService", "$stateParams", "$state", "$window", "$mdPanel", "FeedbackService", "$mdToast", "ErrorHandlerService", "$mdDialog", "bowser", "ThemeService"];

        constructor(private $http: ng.IHttpService, private $q: ng.IQService, private DetectorsService: IDetectorsService, private SiaService: ISiaService, private $mdSidenav: angular.material.ISidenavService, private SiteService: IResourceService, private $stateParams: IStateParams, private $state: angular.ui.IStateService, private $window: angular.IWindowService, private $mdPanel: angular.material.IPanelService, private FeedbackService: IFeedbackService, private $mdToast: angular.material.IToastService, private ErrorHandlerService: IErrorHandlerService, private $mdDialog: angular.material.IDialogService, private bowser: any, public ThemeService: IThemeService) {

            this.portRejectionsChartData = [];
            this.tcpConnectionsChartData = [];
            this.tcpConnectionsPhysicalChartData = [];
            let helper: DetectorViewHelper = new DetectorViewHelper(this.$window);
            this.portRejectionsChartOptions = helper.GetChartOptions('portexhaustion');
            //this.tcpConnectionsChartOptions = helper.GetChartOptions('outboundnetworkconnections');
            this.tcpConnectionsPhysicalChartOptions = helper.GetChartOptions('tcpconnectionsusage');
            this.containerHeight = this.$window.innerHeight * 0.25 + 'px';

            this.analysisType = this.$stateParams.analysisType;

            if (!angular.isDefined(this.$stateParams.siteName) || this.$stateParams.siteName === '') {
                // TODO: show error or redirect to home page.
            }

            var self = this;
            this.SiteService.promise.then(function (data: any) {
                self.site = self.SiteService.resource;
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
        tcpConnectionsChartOptions: any;
        portRejectionsChartData: any;
        tcpConnectionsPhysicalChartOptions: any;
        tcpConnectionsPhysicalChartData: any;
        portRejectionsChartOptions: any;
        tcpConnectionsChartData: any;
        dataLoading: boolean = true;
        portRejectionsDataLoading: boolean = true;
        tcpConnectionsDataLoading: boolean = true;
        containerHeight: string;
        analysisType: string;
        site: Resource;
        avgAvailability: string;

        toggleSideNav(): void {
            this.$mdSidenav('left').toggle();
        }

        private getTcpConnections(): void {

            var outboundnetworkconnections = 'outboundnetworkconnections';
            var self = this;
            let helper: DetectorViewHelper = new DetectorViewHelper(this.$window);

            this.DetectorsService.getDetectorResponse(self.site, outboundnetworkconnections).then(function (data: DetectorResponse) {

                let chartDataList: any = helper.GetChartData(data.StartTime, data.EndTime, data.Metrics, outboundnetworkconnections);

                var iterator = 0;
               
                _.each(chartDataList, function (item: any) {
                    var f: string;

                    item.color = DetectorViewHelper.requestsColors[iterator];
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

            var portexhaustion = 'portexhaustion';
            var self = this;
            let helper: DetectorViewHelper = new DetectorViewHelper(this.$window);

            this.DetectorsService.getDetectorResponse(self.site, portexhaustion).then(function (data: DetectorResponse) {

                let chartDataList: any = helper.GetChartData(data.StartTime, data.EndTime, data.Metrics, portexhaustion);

                var iterator = 0;

                _.each(chartDataList, function (item: any) {
                    var f: string;

                    item.color = DetectorViewHelper.requestsColors[iterator];
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