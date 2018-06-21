///<reference path="../references.ts" />

module SupportCenter {
    "use strict";

    export class AppServiceEnvrionmentCtrl {

        public static $inject: string[] = ["$http", "$q", "DetectorsService", "SiaService", "$mdSidenav", "AseService", "$stateParams", "$state", "$window", "$mdPanel", "FeedbackService", "$mdToast", "ErrorHandlerService", "$mdDialog", "bowser", "ThemeService"];

        constructor(private $http: ng.IHttpService, private $q: ng.IQService, private DetectorsService: IDetectorsService, private SiaService: ISiaService, private $mdSidenav: angular.material.ISidenavService, private AseService: IResourceService, private $stateParams: IStateParams, private $state: angular.ui.IStateService, private $window: angular.IWindowService, private $mdPanel: angular.material.IPanelService, private FeedbackService: IFeedbackService, private $mdToast: angular.material.IToastService, private ErrorHandlerService: IErrorHandlerService, private $mdDialog: angular.material.IDialogService, private bowser: any, public ThemeService: IThemeService) {

            if (bowser.msie || bowser.msedge || bowser.firefox) {

                ErrorHandlerService.showError({
                    Message: "Yikes... We have some outstanding browser specific issues which we are fixing. For Better experience, you can use Chrome browser for now"
                });
            }

            let helper: DetectorViewHelper = new DetectorViewHelper(this.$window);
            this.containerHeight = this.$window.innerHeight * 0.25 + 'px';

            if (!angular.isDefined(this.$stateParams.stamp) || this.$stateParams.stamp === '') {
                // TODO: show error or redirect to home page.
            }

            if (!angular.isDefined(this.$stateParams.startTime)) {
                this.$stateParams.startTime = '';
            }

            if (!angular.isDefined(this.$stateParams.endTime)) {
                this.$stateParams.endTime = '';
            }

            if (!angular.isDefined(this.$stateParams.timeGrain)) {
                this.$stateParams.timeGrain = '';
            }

            var self = this;

            this.AseService.promise.then(function (data: any) {
                self.hostingEnvironment = self.AseService.hostingEnvironment;

                self.DetectorsService.getDetectors(self.hostingEnvironment).then(function (data: DetectorDefinition[]) {
                    self.detectors = data;
                    self.detectorListLoaded = true;
                    self.SiaService.getSiaResponse().then(function (data: IAnalysisResult) {
                        var siaResponse = data.Response;
                        _.each(siaResponse.NonCorrelatedDetectors, function (item: DetectorDefinition) {
                            _.each(self.DetectorsService.detectorsList, function (detector: DetectorDefinition) {
                                if (item.DisplayName === detector.DisplayName) {
                                    detector.Correlated = 0;
                                }
                            });
                        });

                        _.each(siaResponse.Payload, function (item: AnalysisData) {
                            _.each(self.DetectorsService.detectorsList, function (detector: DetectorDefinition) {
                                if (item.DetectorDefinition.DisplayName === detector.DisplayName) {
                                    detector.Correlated = 1;
                                }
                            });
                        });
                    }, function (err) {
                        // Error in App Analysis
                        self.ErrorHandlerService.showError(ErrorModelBuilder.Build(err));
                    });
                }, function (err) {
                    self.detectorListLoaded = true;
                    self.ErrorHandlerService.showError(ErrorModelBuilder.Build(err));
                });
            }, function (err) {
                // Error in calling ASE Details

                self.detectorListLoaded = true;
            });

            switch (this.$state.current.name) {
                case "appServiceEnvironment":
                case "appServiceEnvironment.aseAvailabilityAnalysis":
                case "appServiceEnvironment.aseAvailabilityAnalysis.sia":
                    this.setSelectedItem("aseAvailabilityAnalysis");
                    break;
                case "appServiceEnvironment.aseDeploymentAnalysis":
                case "appServiceEnvironment.aseDeploymentAnalysis.sia":
                    this.setSelectedItem("aseDeploymentAnalysis");
                    break;
                default:
                    this.setSelectedItem(this.$state.params['detectorName']);
                    break;
            }
        }

        detectors: DetectorDefinition[];
        detectorListLoaded: boolean = false;
        selectedItem: string;
        hostingEnvironment: HostingEnvironment;
        containerHeight: string;

        toggleSideNav(): void {
            this.$mdSidenav('left').toggle();
        }

        setSelectedItem(name: string): void {
            let self = this;
            this.selectedItem = name;
            if (name === 'aseAvailabilityAnalysis') {
                this.$state.go('appServiceEnvironment.' + name + ".sia")
            }
            else if (name === 'aseDeploymentAnalysis') {
                this.$state.go('appServiceEnvironment.' + name + ".sia")
            }
            else {
                if (this.$state.current.name.indexOf('appServiceEnvironment') >= 0) {
                    if ((this.$state.current.name.indexOf('.detector')) < 0 || (this.$state.current.name.indexOf('.detector') >= 0 && this.$state.params['detectorName'] !== name)) {
                        let analysisType = this.$state.current.name.replace("appServiceEnvironment.", "").replace(".detector", "").replace(".sia", "");
                        this.$state.go("appServiceEnvironment." + analysisType + ".detector", { detectorName: name });
                    }
                }
            }

            var sidenav = this.$mdSidenav('left');
            if (sidenav.isOpen()) {
                sidenav.close();
            }
        }

        sendFeedback(): void {
            this.FeedbackService.sendGeneralFeedback();
        }

        showCaseFeedbackForm(ev): void {

            let self = this;

            this.$mdDialog.show({
                controllerAs: 'casefeedbackctrl',
                controller: CaseFeedbackCtrl,
                templateUrl: 'supportcasefeedback.html',
                parent: angular.element(document.body),
                hasBackdrop: true,
                targetEvent: ev,
                clickOutsideToClose: true,
                disableParentScroll: true,
                escapeToClose: true,
                focusOnOpen: false
            })
                .then(function (answer) {
                    if (angular.isDefined(answer) && answer === true) {
                        self.$mdToast.showSimple("Feedback submitted successfully.Thank you !!");
                    }
                }, function () {
                });
        }

        goToHomepage() {
            this.$window.open('/', '_self');
        }

        showAseProfile($env): void {

            var position = this.$mdPanel.newPanelPosition()
                .absolute()
                .center();

            var config = {
                attachTo: angular.element(document.body),
                controllerAs: 'aseprofilectrl',
                controller: AseProfileCtrl,
                disableParentScroll: true,
                templateUrl: 'aseprofile.html',
                hasBackdrop: true,
                panelClass: 'app-profile-dialog',
                position: position,
                trapFocus: true,
                zIndex: 150,
                clickOutsideToClose: true,
                escapeToClose: true,
                focusOnOpen: true
            };

            this.$mdPanel.open(config);
        }
    }

    export class AseProfileCtrl {

        constructor(private AseService: IResourceService, public ThemeService: IThemeService) {
            var self = this;
            this.properties = [];

            this.AseService.promise.then(function (data: any) {
                self.hostingEnv = self.AseService.hostingEnvironment;

                self.properties.push(new NameValuePair("Subscription Id", self.hostingEnv.subscriptionId));
                self.properties.push(new NameValuePair("Resource Group", self.hostingEnv.resourceGroup));
                self.properties.push(new NameValuePair("Internal Stamp Name", self.hostingEnv.resourceInternalStamp));
                self.properties.push(new NameValuePair("VNet Name", self.hostingEnv.VNetName));
                self.properties.push(new NameValuePair("VNet Id", self.hostingEnv.VNetId));
                self.properties.push(new NameValuePair("VNet Subnet Name", self.hostingEnv.VNetSubnetName));
                self.properties.push(new NameValuePair("VNet Subnet Address Range", self.hostingEnv.VNetSubnetAddressRange));
                self.properties.push(new NameValuePair("MultiRole Size and Count", self.hostingEnv.MultiRoleSizeAndCount));
                self.properties.push(new NameValuePair("Small Worker Size and Count", self.hostingEnv.SmallWorkerSizeAndCount));
                self.properties.push(new NameValuePair("Medium Worker Size and Count", self.hostingEnv.MediumWorkerSizeAndCount));
                self.properties.push(new NameValuePair("Large Worker Size and Count", self.hostingEnv.LargeWorkerSizeAndCount));
                
            }, function (err) {
            });
        }

        hostingEnv: HostingEnvironment;
        properties: NameValuePair[]
    }
}
