///<reference path="../references.ts" />

module SupportCenter {
    "use strict";

    export interface ISiaService {
        getSiaResponse(): ng.IPromise<IAnalysisResult>;
        selectAppDowntime(index: number): void
        PrepareDetectorViewParams(siaResponse: SiaResponse): ICache<DetectorViewParams>
    }

    export class SiaService implements ISiaService {
        private appAnalysisPromise: ng.IPromise<any>;
        private perfAnalysisPromise: ng.IPromise<any>;

        private analysisCache: ICache<IAnalysisResult>;
        private analysisPromiseCache: ICache<ng.IPromise<any>>;
        private analysisResultCache: ICache<SiaResponse>;

        public static $inject: string[] = ["DetectorsService", "TimeParamsService", "$http", "$q", "$window", "$state", "$stateParams", "AnalysisResponseFactory"];
        public selectedAbnormalTimePeriod: any;

        constructor(private DetectorsService: IDetectorsService, private TimeParamsService: ITimeParamsService, private $http: ng.IHttpService, private $q: ng.IQService, private $window: angular.IWindowService, private $state: angular.ui.IStateService, private $stateParams: IStateParams, private AnalysisFactory: AnalysisResponseFactory) {
            this.analysisPromiseCache = {};
            this.analysisResultCache = {};
            this.analysisCache = {};
        }

        getSiaResponse(): ng.IPromise<IAnalysisResult> {
            let analysisType = this.$stateParams.analysisType;
            var deferred = this.$q.defer<IAnalysisResult>();
            var self = this;

            if (!angular.isDefined(this.analysisCache[analysisType])) {
                this.analysisCache[analysisType] = { Promise: null, Response: null, SelectedAbnormalTimePeriod: null };
            }

            if (angular.isDefined(this.analysisCache[analysisType].Promise) && this.analysisCache[analysisType].Promise !== null) {
                this.analysisCache[analysisType].Promise.then(function (data: any) {
                    self.analysisCache[analysisType].Response = data.Response;
                    self.analysisCache[analysisType].SelectedAbnormalTimePeriod = data.SelectedAbnormalTimePeriod;
                    deferred.resolve(self.analysisCache[analysisType])
                });
                return deferred.promise;
            }else {
                this.analysisCache[analysisType].Promise = this.AnalysisFactory.GetAnalysis().getAnalysisResponse();
                return this.analysisCache[analysisType].Promise;
            }
        }

        public PrepareDetectorViewParams(siaResponse: SiaResponse): ICache<DetectorViewParams> {

            var detectorViewHelper: DetectorViewHelper = new DetectorViewHelper(this.$window);

            if (!angular.isDefined(siaResponse.Payload)) {
                return;
            }

            let DetectorData: ICache<DetectorViewParams> = {};

            for (let detectorAnalysisData of siaResponse.Payload) {
                
                DetectorData[detectorAnalysisData.Source] = new DetectorViewParams();
                DetectorData[detectorAnalysisData.Source].loading = false;
                DetectorData[detectorAnalysisData.Source].chartoptions = detectorViewHelper.GetChartOptions(detectorAnalysisData.Source);
                DetectorData[detectorAnalysisData.Source].chartdata = detectorViewHelper.GetChartData(siaResponse.StartTime, siaResponse.EndTime, detectorAnalysisData.Metrics, detectorAnalysisData.Source);

                if (detectorAnalysisData.Source !== 'rebootrolesstuck') {
                    DetectorData[detectorAnalysisData.Source].chartoptions.chart.height =
                        DetectorData[detectorAnalysisData.Source].chartoptions.chart.height + (DetectorData[detectorAnalysisData.Source].chartdata.length / 8) * 20;
                    DetectorData[detectorAnalysisData.Source].chartoptions.chart.margin.top = 20 + (DetectorData[detectorAnalysisData.Source].chartdata.length / 8) * 20;
                }

                DetectorData[detectorAnalysisData.Source].responsemetadata = detectorAnalysisData.DetectorMetaData;
                DetectorData[detectorAnalysisData.Source].info = detectorAnalysisData.DetectorDefinition;
                DetectorData[detectorAnalysisData.Source].metricsets = detectorAnalysisData.Metrics;
                DetectorData[detectorAnalysisData.Source].additionalData = detectorAnalysisData.Data;

                siaResponse.AbnormalTimePeriods.forEach(x => {
                    x.Visible = false;
                    x.Events.forEach(detector => {
                        detector.Visible = false
                        if (detector.Source === 'cpuanalysis') {
                            detector.Instance = detector.Message.split('\'')[1];
                        }
                    });
                    x.Events
                });

                var self = this;

                this.DetectorsService.getDetectorWiki(detectorAnalysisData.Source).then(function (wikiResponse) {
                    DetectorData[detectorAnalysisData.Source].wiki = wikiResponse;
                });

                this.DetectorsService.getDetectorSolution(detectorAnalysisData.Source).then(function (solutionResponse) {
                    DetectorData[detectorAnalysisData.Source].solution = solutionResponse;
                });                
            }

            return DetectorData;
        }

        public selectAppDowntime(index: number): void {
            if (index < this.analysisCache[this.$stateParams.analysisType].Response.AbnormalTimePeriods.length && index >= 0) {
                this.analysisCache[this.$stateParams.analysisType].SelectedAbnormalTimePeriod.index = index;
                this.analysisCache[this.$stateParams.analysisType].SelectedAbnormalTimePeriod.data = this.analysisCache[this.$stateParams.analysisType].Response.AbnormalTimePeriods[index]
            }
        }
    }

    export interface IAnalysisResult {
        Promise: ng.IPromise<IAnalysisResult>;
        Response: SiaResponse;
        SelectedAbnormalTimePeriod: any;
    }
}