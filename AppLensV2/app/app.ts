﻿///<reference path="references.ts" />

module SupportCenter {
    "use strict";

    var app = angular.module("supportCenterApp", ["ngMaterial", "ngMdIcons", "ngLetterAvatar", "ui.router", "nvd3", "ngSanitize", "btford.markdown", "jlareau.bowser", "md.data.table"])

        .service("DetectorsService", DetectorsService)
        .service("SiaService", SiaService)
        .service("SiteService", SiteService)
        .service("TimeParamsService", TimeParamsService)
        .service("FeedbackService", FeedbackService)
        .service("ErrorHandlerService", ErrorHandlerService)
        .service("AseService", AseService)
        .service("AnalysisResponseFactory", AnalysisResponseFactory)
        .service("ResourceServiceFactory", ResourceServiceFactory)
        .service("ThemeService", ThemeService)
        .controller("HomeCtrl",HomeCtrl)
        .controller("MainCtrl", MainCtrl)
        .controller("AppServiceEnvironmentCtrl", AppServiceEnvrionmentCtrl)
        .controller("SiteCtrl", SiteCtrl)
        .controller("DetectorCtrl", DetectorCtrl)
        .controller("SiaCtrl", SiaCtrl)
        .controller("AppProfileCtrl", AppProfileCtrl)
        .controller("AseProfileCtrl", AseProfileCtrl)
        .controller("CaseFeedbackCtrl", CaseFeedbackCtrl)
        .directive("detectorView", [() => new DetectorViewDir()])
        .directive("detailedDetectorView", [() => new DetailedDetectorViewDir()])
        .directive("downtimeTimeline", [() => new DowntimeTimelineDir()])
        .config(($mdThemingProvider: angular.material.IThemingProvider,
            $mdIconProvider: angular.material.IIconProvider,
            $locationProvider: angular.ILocationProvider,
            $stateProvider: angular.ui.IStateProvider) => {

            // App Analysis Theme
            $mdThemingProvider.theme('default')
                .primaryPalette('teal')
                .accentPalette('red');

            // Perf Analysis Theme
            $mdThemingProvider.theme('default2')
                .primaryPalette('blue')
                .accentPalette('red');

            // ASE Theme
            $mdThemingProvider.theme('default3')
                .primaryPalette('brown')
                .accentPalette('red');

            $mdThemingProvider.alwaysWatchTheme(true);

            $mdIconProvider
                .icon('menu', './app/assets/svg/menu.svg', 24);

            $mdIconProvider
                .icon('evidence', './app/assets/svg/search.svg', 30);

            $mdIconProvider
                .icon('success', './app/assets/svg/success.svg', 30);

            $mdIconProvider
                .icon('warning', './app/assets/svg/warning.svg', 30);

            $stateProvider
                .state('homePage', {
                    url: '/',
                    templateUrl: 'app/Home/home.html',
                    controller: 'HomeCtrl',
                    controllerAs: 'home',
                })
                .state('sites', {
                    url: '/sites/{siteName}?{startTime}&{endTime}&{timeGrain}&{isInternal}&{vNext}',
                    templateUrl: 'app/Main/main.html',
                    controller: 'MainCtrl',
                    controllerAs: 'main'
                })
                .state('stampsites', {
                    url: '/stamps/{stamp}/sites/{siteName}?{startTime}&{endTime}&{timeGrain}&{isInternal}&{vNext}',
                    templateUrl: 'app/Main/main.html',
                    controller: 'MainCtrl',
                    controllerAs: 'main'
                })
                .state('appServiceEnvironment', {
                    url: '/hostingEnvironments/{hostingEnvironmentName}?{startTime}&{endTime}&{timeGrain}&{isInternal}&{vNext}',
                    templateUrl: 'app/AppServiceEnvironment/appServiceEnvironment.html',
                    controller: 'AppServiceEnvironmentCtrl',
                    controllerAs: 'ase'
                })
                .state('sites.appanalysis', {
                    url: '/appanalysis',
                    views: {
                        'mainContent': {
                            templateUrl: 'app/Site/site.html',
                            controller: 'SiteCtrl',
                            controllerAs: 'site'
                        }
                    },
                    params: {
                        analysisType: 'appAnalysis'
                    }
                })
                .state('stampsites.appanalysis', {
                    url: '/appanalysis',
                    views: {
                        'mainContent': {
                            templateUrl: 'app/Site/site.html',
                            controller: 'SiteCtrl',
                            controllerAs: 'site'
                        }
                    },
                    params: {
                        analysisType: 'appAnalysis'
                    }
                })
                .state('sites.perfanalysis', {
                    url: '/perfanalysis',
                    views: {
                        'mainContent': {
                            templateUrl: 'app/Site/site.html',
                            controller: 'SiteCtrl',
                            controllerAs: 'site'
                        }
                    },
                    params: {
                        analysisType: 'perfAnalysis'
                    }
                })
                .state('stampsites.perfanalysis', {
                    url: '/perfanalysis',
                    views: {
                        'mainContent': {
                            templateUrl: 'app/Site/site.html',
                            controller: 'SiteCtrl',
                            controllerAs: 'site'
                        }
                    },
                    params: {
                        analysisType: 'perfAnalysis'
                    }
                })
                .state('appServiceEnvironment.aseAvailabilityAnalysis', {
                    url: '/aseAvailabilityAnalysis',
                    views: {
                        'childContent': {
                            templateUrl: 'app/Sia/sia.html',
                            controller: 'SiaCtrl',
                            controllerAs: 'sia'
                        }
                    },
                    params: {
                        analysisType: 'aseAvailabilityAnalysis'
                    }
                })
                // Old state - just exists to redirect to [sites/stampsites].appanalysis.detector
                .state('sites.detector', {
                    url: '/detectors/{detectorName}',
                    views: {
                        'childContent': {
                            templateUrl: 'app/Detector/detector.html',
                            controller: 'DetectorCtrl',
                            controllerAs: 'detector'
                        }
                    }
                })
                .state('sites.appanalysis.sia', {
                    views: {
                        'childContent': {
                            templateUrl: 'app/Sia/sia.html',
                            controller: 'SiaCtrl',
                            controllerAs: 'sia'
                        }
                    }
                })
                .state('stampsites.appanalysis.sia', {
                    views: {
                        'childContent': {
                            templateUrl: 'app/Sia/sia.html',
                            controller: 'SiaCtrl',
                            controllerAs: 'sia'
                        }
                    }
                })
                .state('sites.appanalysis.detector', {
                    url: '/detectors/{detectorName}',
                    views: {
                        'childContent': {
                            templateUrl: 'app/Detector/detector.html',
                            controller: 'DetectorCtrl',
                            controllerAs: 'detector'
                        }
                    }
                })
                .state('stampsites.appanalysis.detector', {
                    url: '/detectors/{detectorName}',
                    views: {
                        'childContent': {
                            templateUrl: 'app/Detector/detector.html',
                            controller: 'DetectorCtrl',
                            controllerAs: 'detector'
                        }
                    }
                })
                .state('appServiceEnvironment.detector', {
                    url: '/detectors/{detectorName}',
                    views: {
                        'childContent': {
                            templateUrl: 'app/Detector/detector.html',
                            controller: 'DetectorCtrl',
                            controllerAs: 'detector'
                        }
                    }
                })
                .state('sites.perfanalysis.sia', {
                    views: {
                        'childContent': {
                            templateUrl: 'app/Sia/sia.html',
                            controller: 'SiaCtrl',
                            controllerAs: 'sia'
                        }
                    }
                })
                .state('stampsites.perfanalysis.sia', {
                    views: {
                        'childContent': {
                            templateUrl: 'app/Sia/sia.html',
                            controller: 'SiaCtrl',
                            controllerAs: 'sia'
                        }
                    }
                })
                .state('sites.perfanalysis.detector', {
                    url: '/detectors/{detectorName}',
                    views: {
                        'childContent': {
                            templateUrl: 'app/Detector/detector.html',
                            controller: 'DetectorCtrl',
                            controllerAs: 'detector'
                        }
                    }
                })
                .state('stampsites.perfanalysis.detector', {
                    url: '/detectors/{detectorName}',
                    views: {
                        'childContent': {
                            templateUrl: 'app/Detector/detector.html',
                            controller: 'DetectorCtrl',
                            controllerAs: 'detector'
                        }
                    }
                });

            $locationProvider.html5Mode(true);
        });

    app.filter('worker', function () {
        return function (input) {
            return input.replace("SmallDedicatedWebWorkerRole_IN", "SDW")
                .replace("MediumDedicatedWebWorkerRole_IN", "MDW")
                .replace("LargeDedicatedWebWorkerRole_IN", "LDW")
                .replace("WebWorkerRole_IN_", "W").replace(" - aggregated", "");
        };
    });

    app.filter('correlatedcolor', function () {
        return function (input) {

            if (input == 1)
                return "#ff7043";
            if (input == 0)
                return "#ffc400";

            return "#ffffff";
        };
    });
}