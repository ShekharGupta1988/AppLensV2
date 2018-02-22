///<reference path="../references.ts" />

module SupportCenter {
    "use strict";

    export interface IIncidentViewScope extends ng.IScope {

    }

    export interface IIncidentCtrl {
    }

    export class IncidentCtrl implements IIncidentCtrl {
        public static $inject: string[] = ["DetectorsService", "ResourceServiceFactory", "$stateParams", "$state"];
        public loadingLSIs: boolean = true;
        public loadingCRIs: boolean = true;
        public serviceHealthResponse: DetectorResponse;
        public customerIncidentResponse: DetectorResponse;
        public incidentNotifications: IncidentNotification[];
        public criIncidentNotifications: IncidentNotification[];

        constructor(private detectorService: IDetectorsService, private ResourceServiceFactory: ResourceServiceFactory, private $stateParams: IStateParams, private $state: angular.ui.IStateService) {
            var self = this;
            let resourceService = ResourceServiceFactory.GetResourceService();
            resourceService.promise.then(function (data: any) {
                detectorService.getDetectorResponse(resourceService.resource, 'servicehealth').then(function (data: DetectorResponse) {
                    self.serviceHealthResponse = data;
                    self.incidentNotifications = self.findActiveIncidents(data);
                    self.incidentNotifications.forEach(incident => {
                        incident.title = incident.status === IncidentStatus.Active ? "Active Live Site Incident may be affecting this app" : "Past Live Site Incident may have affected this app";
                    });
                    self.loadingLSIs = false;
                });

                detectorService.getDetectorResponse(resourceService.resource, 'customerincident').then(function (data: DetectorResponse) {
                    self.customerIncidentResponse = data;
                    self.criIncidentNotifications = self.findActiveIncidents(data);
                    self.criIncidentNotifications.forEach(incident => {
                        incident.title = incident.status === IncidentStatus.Active ? "Active incident may be affecting this app" : "Past incident may have affected this app";
                    });
                    self.loadingCRIs = false;
                });
            });
        }

        findActiveIncidents(response: DetectorResponse, isLSI: boolean = true) {

            return response.AbnormalTimePeriods.filter(incident => {
                if (incident.MetaData.length > 0) {
                    return incident.MetaData[0].filter(nameValuePair => nameValuePair.Name === "ShowNotification" && nameValuePair.Value === "True").length > 0;
                }
                return false;
            }).map(incidentToNotify => {
                let incidentNotification: IncidentNotification = new IncidentNotification();
                incidentNotification.abnormalTimePeriod = incidentToNotify;
                incidentToNotify.MetaData[0].forEach(nameValuePair => {
                    if (nameValuePair.Name === "Link") {
                        incidentNotification.link = nameValuePair.Value;
                    }
                    else if (nameValuePair.Name === "MessageHTML") {
                        incidentNotification.message = nameValuePair.Value;
                    }
                    else if (nameValuePair.Name === "Status") {
                        incidentNotification.status = IncidentStatus[nameValuePair.Value]
                    }
                });

                return incidentNotification;
            });
        }

        public openServiceHealth() {
            let stateParts = this.$state.current.name.split('.');
            this.$state.go(`${stateParts[0]}.${stateParts[1]}.detector`, { detectorName: 'servicehealth' });
        }
    }

    class IncidentNotification {
        abnormalTimePeriod: DetectorAbnormalTimePeriod;
        link: string;
        message: string;
        title: string;
        status: IncidentStatus;

    }

    enum IncidentStatus {
        Active,
        Mititgated,
        Resolved
    }

    export class IncidentDir implements ng.IDirective {

        public restrict: string = 'E';
        public replace: boolean = true;
        public templateUrl: string = './app/Incident/incidentdirective.html';
        public bindToController: boolean = true;
        public controllerAs: string = 'incidentctrl';
        public controller = IncidentCtrl;
        //public link = function (scope: IIncidentViewScope, ctrl: IDowntimeTimelineCtrl) {
        //}

        //public scope: { [boundProperty: string]: string } = {

        //};
    }
}