///<reference path="../references.ts" />

module SupportCenter {
    "use strict";

    export interface IDetectorsService {
        getDetectors(resource: Resource): ng.IPromise<DetectorDefinition[]>;
        getDetectorResponse(resource: Resource, detectorName: string): ng.IPromise<DetectorResponse>;
        getDetectorResponseWithDates(resource: Resource, detectorName: string, startTime: Date, endTime: Date): ng.IPromise<DetectorResponse>;
        getDetectorWiki(detectorName: string): ng.IPromise<string>;
        getDetectorSolution(detectorName: string): ng.IPromise<string>;

        detectorsList: DetectorDefinition[];
    }

    export interface ICache<T> {
        [K: string]: T;
    }

    export class DetectorsService implements IDetectorsService {

        private detectorsResponseCache: ICache<DetectorResponse>;
        private detectorsWikiCache: ICache<string>;
        private detectorsSolutionCache: ICache<string>;
        private detectorsListCache: ICache<DetectorDefinition[]>;
        public detectorsList: DetectorDefinition[];

        static $inject = ['TimeParamsService', '$q', '$http'];

        constructor(private TimeParamsService: ITimeParamsService, private $q: ng.IQService, private $http: ng.IHttpService) {
            this.detectorsResponseCache = {};
            this.detectorsWikiCache = {};
            this.detectorsSolutionCache = {};
            this.detectorsListCache = {};
            this.detectorsList = [];
        }

        getDetectors(resource: Resource): ng.IPromise<DetectorDefinition[]> {

            var detectors: DetectorDefinition[] = [];
            var deferred = this.$q.defer<DetectorDefinition[]>();

            if (angular.isDefined(this.detectorsListCache["detectorList"])) {
                deferred.resolve(this.detectorsListCache["detectorList"]);
                return deferred.promise;
            }

            var self = this;

            this.$http({
                method: "GET",
                url: UriPaths.DiagnosticsPassThroughAPIPath(),
                headers: {
                    'GeoRegionApiRoute': UriPaths.ListDetectorsPath(resource),
                    'IsInternal': this.TimeParamsService.IsInternal
                }
            })
                .success((data: any) => {


                    if (angular.isDefined(data) && angular.isDefined(data.Value)) {

                        _.each(data.Value, function (item: any) {

                            if (angular.isDefined(item.Properties)) {

                                var detector = new DetectorDefinition(
                                    item.Properties.Name,
                                    item.Properties.DisplayName,
                                    item.Properties.Description,
                                    item.Properties.Rank,
                                    item.Properties.IsEnabled, -1);

                                detectors.push(detector);
                            }
                            else {
                                
                            }
                        });
                    }
                    else if (angular.isDefined(data)) {
                        _.each(data, function (item: any) {
                            var detector = new DetectorDefinition(
                                item.Name,
                                item.DisplayName,
                                item.Description,
                                item.Rank,
                                item.IsEnabled, -1);

                            detectors.push(detector);
                        });
                    }
                    else {
                        deferred.reject(new ErrorModel(0, "Invalid Get Detectors Api response"));
                    }

                    self.detectorsListCache["detectorList"] = detectors;
                    self.detectorsList = detectors;
                    deferred.resolve(self.detectorsList);
                })
                .error((err: any) => {
                    deferred.reject(ErrorModelBuilder.Build(err));
                });

            return deferred.promise;
        }

        getDetectorResponse(resource: Resource, detectorName: string): ng.IPromise<DetectorResponse> {
            return this.getDetectorResponseWithDates(resource, detectorName, null, null);
        }

        getDetectorResponseWithDates(resource: Resource, detectorName: string, startTime: Date = null, endTime: Date = null): ng.IPromise<DetectorResponse> {

            var deferred = this.$q.defer<DetectorResponse>();

            var apiRoute = UriPaths.DetectorResourcePath(resource, detectorName, this.TimeParamsService.StartTime, this.TimeParamsService.EndTime, this.TimeParamsService.TimeGrain);

            if (startTime != null && endTime != null) {
                apiRoute = UriPaths.DetectorResourcePath(resource, detectorName, startTime.toJSON(), endTime.toJSON(), this.TimeParamsService.TimeGrain);
            }
            else if (angular.isDefined(this.detectorsResponseCache[detectorName])) {
                deferred.resolve(this.detectorsResponseCache[detectorName]);
                return deferred.promise;
            }

            this.$http({
                method: "GET",
                url: UriPaths.DiagnosticsPassThroughAPIPath(),
                headers: {
                    'GeoRegionApiRoute': apiRoute,
                    'IsInternal': this.TimeParamsService.IsInternal
                }
            })
                .success((data: any) => {

                    var response = new DetectorResponse(this.TimeParamsService.StartTime, this.TimeParamsService.EndTime, [], [], null);

                    if (angular.isDefined(data)) {
                        response = angular.isDefined(data.Properties) ? data.Properties : data;
                        deferred.resolve(response);

                        var timeDifferenceInMinutes = 24 * 60;
                        if (startTime != null && endTime != null) {
                            var msMinute = 60 * 1000,
                                msDay = 60 * 60 * 24 * 1000;

                            timeDifferenceInMinutes = Math.floor(((endTime.getTime() - startTime.getTime()) % msDay) / msMinute);
                        }
                        if (timeDifferenceInMinutes > 10) {
                            this.detectorsResponseCache[detectorName] = response;
                        }

                    }
                    else {
                        deferred.reject(new ErrorModel(0, "Properties field not present in Get Detector Data Api response"));
                    }

                })
                .error((err: any) => {
                    deferred.reject(ErrorModelBuilder.Build(err));
                });

            return deferred.promise;
        }

        getDetectorWiki(detectorName: string): ng.IPromise<string> {
            return this.getDetectorDocument(detectorName, "wiki.md");
        }

        getDetectorSolution(detectorName: string): ng.IPromise<string> {
            return this.getDetectorDocument(detectorName, "solution.md");
        }

        private getDetectorDocument(detectorName: string, documentName: string): ng.IPromise<string> {

            var cacheObject = undefined;
            var deferred = this.$q.defer<string>();

            switch (documentName.toLocaleLowerCase()) {
                case "solution.md":
                    cacheObject = this.detectorsSolutionCache;
                    break;
                case "wiki.md":
                    cacheObject = this.detectorsWikiCache;
                    break;
            }

            if (angular.isDefined(cacheObject) && angular.isDefined(cacheObject[detectorName])) {
                deferred.resolve(cacheObject[detectorName]);
                return deferred.promise;
            }

            this.$http({
                method: "GET",
                url: UriPaths.DetectorsDocumentApiPath(detectorName, documentName)
            })
                .success((data: string) => {
                    if (angular.isDefined(data) && data !== '') {

                        if (angular.isDefined(cacheObject)) {
                            cacheObject[detectorName] = data;
                        }

                        deferred.resolve(data);
                    }
                    else {
                        deferred.reject(new ErrorModel(0, ''));
                    }
                })
                .error((err: any) => {
                    deferred.reject(ErrorModelBuilder.Build(err));
                });

            return deferred.promise;
        }
    }
}