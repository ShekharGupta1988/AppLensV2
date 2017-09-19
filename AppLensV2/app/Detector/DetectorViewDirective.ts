///<reference path="../references.ts" />

module SupportCenter {
    "use strict";

    export interface IDetectorViewScope extends ng.IScope {
        loading: string;
        chartoptions: any;
        chartdata: any;
        info: any;
        responsemetadata: any;
        wiki: string;
        solution: string;
        additionaldata: any;
        metricsets: DiagnosticMetricSet[];
        selectedworker: string;
        detectorsource: string;
        abnormaltimeperiod: AbnormalTimePeriod;
    }

    export class DetectorViewCtrl {
        public static $inject: string[] = ["DetectorsService", "$stateParams", "$window", "FeedbackService", "$mdToast", "$timeout"];
        public showDetailedView: boolean = true;
        public detectorFeedbackOption: number = -1;
        private nameElement: any;
        private detectorName: string;
        public api: any;
        public isLoading: boolean;

        constructor(private DetectorsService: IDetectorsService, private $stateParams: IStateParams, private $window: angular.IWindowService, private FeedbackService: IFeedbackService, private $mdToast: angular.material.IToastService, private $timeout: ng.ITimeoutService) {
            this.isLoading = true;
            this.nameElement = document.getElementById('name');
            let self = this;
            this.$timeout(function () {
                self.detectorName = self.nameElement.innerText;

                if (angular.isDefined(FeedbackService.detectorsFeedbackList[self.detectorName])) {
                    self.detectorFeedbackOption = FeedbackService.detectorsFeedbackList[self.detectorName];
                }
            }, 3000);

            // This is a hack because the chart was loading incorrectly because of some problem with material I believe. 
            // TODO: revisit this experience. 
            this.$timeout(function () {
                self.isLoading = false;
            }, 1);

            
        }

        isDetailedGraphEnabled(detectorName: string) {
            return detectorName.indexOf('cpuanalysis') >= 0 ||
                detectorName.indexOf('memoryanalysis') >= 0 ||
                detectorName === 'pagefileoperations' ||
                detectorName === 'tcpconnectionsusage' ||
                detectorName === 'tcpopensocketcount'
        }

        sendDetectorFeedback(detectorName: string, feedbackOption: number) {

            if (this.detectorFeedbackOption === -1) {
                this.detectorFeedbackOption = feedbackOption;
                let self = this;
                this.FeedbackService.sendDetectorFeedback(detectorName, feedbackOption).then(function (answer) {
                    if (angular.isDefined(answer) && answer === true) {
                        self.$mdToast.showSimple("Feedback submitted successfully.Thank you !!");
                        self.FeedbackService.detectorsFeedbackList[detectorName] = feedbackOption;
                    }
                }, function () {
                });
            }
        }
    }

    export class DetectorViewDir implements ng.IDirective {

        public restrict: string = 'E';
        public replace: boolean = true;
        public templateUrl: string = './app/Detector/detectorview.html';
        public bindToController: boolean = true;
        public controllerAs: string = 'detectorviewctrl';
        public controller = DetectorViewCtrl;
        public link = function (scope: IDetectorViewScope) {
        }

        public scope: { [boundProperty: string]: string } = {
            loading: '=',
            chartoptions: '=',
            chartdata: '=',
            info: '=',
            responsemetadata: '=',
            wiki: '=',
            solution: '=',
            additionaldata: '=',
            metricsets: '=',
            selectedworker: '=',
            detectorsource: '=',
            abnormaltimeperiod: '=',
        };
    }
}