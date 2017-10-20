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
        abnormaltimeperiods: any
    }

    export class DetectorViewCtrl {
        public static $inject: string[] = ["DetectorsService", "$stateParams", "$window", "FeedbackService", "$mdToast", "$timeout"];
        public showDetailedView: boolean = true;
        public detectorFeedbackOption: number = -1;
        private nameElement: any;
        private detectorName: string;
        public api: any;
        public isLoading: boolean;

        public abnormaltimeperiods: any;
        public singleObservationMessage: string;
        public singleSolutionMessage: string;
        public metricsets: DiagnosticMetricSet[];

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
            for (var i = 0; i < DetectorViewHelper.DetailedGraphEnabledDetectors.length; i++) {
                if (detectorName.indexOf(DetectorViewHelper.DetailedGraphEnabledDetectors[i].name) >= 0) {
                    return true;
                }
            }
            return false;
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

        isSolutionProvided(): boolean {
            if (angular.isDefined(this.abnormaltimeperiods) && this.abnormaltimeperiods.length !== 0) {
                for (let abnormalTimePeriod of this.abnormaltimeperiods) {
                    if (abnormalTimePeriod.Solutions.length > 0) {
                        return true;
                    }
                }
            }
            return false;
        }

        isSameObservations(): boolean {
            let observations: string[] = [];
            if (angular.isDefined(this.abnormaltimeperiods) && this.abnormaltimeperiods.length !== 0) {
                for (let abnormaltimeperiod of this.abnormaltimeperiods) {
                    observations.push(abnormaltimeperiod.Message);
                }
            }

            let s = observations.pop();

            let isSame = observations.every((ss: string) => {
                return s === ss;
                }
            )

            if (isSame) {
                this.singleObservationMessage = s;
            }

            let onlyOneObservationProvided = this.abnormaltimeperiods.length == 1;

            return isSame && !onlyOneObservationProvided;
        }

        isSameSolution(): boolean {
            let solutions: string[] = [];
            if (angular.isDefined(this.abnormaltimeperiods) && this.abnormaltimeperiods.length !== 0) {
                for (let abnormaltimeperiod of this.abnormaltimeperiods) {
                    for (let solution of abnormaltimeperiod.Solutions) {
                        if (solution.Description !== '') {
                            solutions.push(solution.DisplayName + ": " + solution.Description);
                        } else {
                            solutions.push(solution.DisplayName);
                        }
                    }
                }
            }

            let s = solutions.pop();

            let isSame = solutions.every((ss: string) => {
                return s === ss;
            }
            )

            if (isSame) {
                this.singleSolutionMessage = s;
            }

            return isSame;
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
            abnormaltimeperiods: '='
        };
    }
}