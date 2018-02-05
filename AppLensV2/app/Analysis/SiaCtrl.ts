﻿///<reference path="../references.ts" />

module SupportCenter {
    "use strict";

    export class SiaCtrl {

        public static $inject: string[] = ["SiaService", "$window", "ErrorHandlerService", "ThemeService", "$stateParams", "ResourceServiceFactory"];

        constructor(private SiaService: ISiaService, private $window: angular.IWindowService, private ErrorHandlerService: IErrorHandlerService, private ThemeService: IThemeService, private $stateParams: IStateParams, private ResourceServiceFactory: ResourceServiceFactory) {

            var self = this;
            this.DetectorData = {};

            this.isLoading = true;
            this.isVNext = true;
            if (angular.isDefined(this.$stateParams.vNext) && this.$stateParams.vNext === 'false') {
                this.isVNext = false;
            }

            this.analysisType = this.$stateParams.analysisType;

            let service = ResourceServiceFactory.GetResourceService();
            service.promise.then(function (data: any) {

                self.SiaService.getSiaResponse().then(function (data: IAnalysisResult) {
                    self.SiaResponse = data.Response;
                    self.selectedAbnormalTimePeriod = data.SelectedAbnormalTimePeriod;
                    self.DetectorData = self.SiaService.PrepareDetectorViewParams(self.SiaResponse);
                    self.isLoading = false;
                }, function (err) {
                    self.isLoading = false;
                    self.ErrorHandlerService.showError(ErrorModelBuilder.Build(err));
                });
            }, function (err) {
                // Error in calling Site Details
                self.isLoading = false;
            });
        }

        public selectDowntime(index: number): void {
            if (index >= 0) {
                this.SiaService.selectAppDowntime(index);
            }
        }

        public isVNext: boolean;
        public SiaResponse: SiaResponse;
        public DetectorData: ICache<DetectorViewParams>;
        public isLoading: boolean;
        public selectedAbnormalTimePeriod: any;
        public analysisType: string;
    }
}
