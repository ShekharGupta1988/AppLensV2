///<reference path="../references.ts" />

module SupportCenter {
    "use strict";

    export interface IIncidentViewScope extends ng.IScope {

    }

    export interface IIncidentCtrl {
    }

    export class IncidentCtrl implements IIncidentCtrl {
        public static $inject: string[] = ["DetectorsService", "ResourceServiceFactory", "$stateParams", "$state", "clipboard", "$window", "$mdToast"];
        public loadingLSIs: boolean = true;
        public loadingCRIs: boolean = true;
        public serviceHealthResponse: DetectorResponse;
        public customerIncidentResponse: DetectorResponse;
        public incidentNotifications: IncidentNotification[];
        public criIncidentNotifications: IncidentNotification[];
        public incidentStatus = IncidentStatus;
        private stampCluster: string;
        private startTime: string;
        private endTime: string;

        constructor(private detectorService: IDetectorsService, private ResourceServiceFactory: ResourceServiceFactory, private $stateParams: IStateParams, private $state: angular.ui.IStateService, public clipboard: any, private $window: angular.IWindowService, private $mdToast: angular.material.IToastService) {
            var self = this;
            let resourceService = ResourceServiceFactory.GetResourceService();
            resourceService.promise.then(function (data: any) {
                detectorService.getDetectorResponse(resourceService.resource, 'servicehealth').then(function (data: DetectorResponse) {
                    self.serviceHealthResponse = data;
                    self.incidentNotifications = self.findActiveIncidents(data);
                    self.incidentNotifications.forEach(incident => {
                        incident.messageTitle = incident.status === IncidentStatus.Active ? "Service Incident may be affecting this app" : "Service Incident may have affected this app";
                    });
                    self.loadingLSIs = false;

                    self.startTime = data.StartTime;
                    self.endTime = data.EndTime;
                });

                detectorService.getDetectorResponse(resourceService.resource, 'customerincident').then(function (data: DetectorResponse) {
                    self.customerIncidentResponse = data;
                    self.criIncidentNotifications = self.findActiveIncidents(data);
                    self.criIncidentNotifications.forEach(incident => {
                        incident.messageTitle = incident.status === IncidentStatus.Active ? "Service incident may be affecting this app" : "Service incident may have affected this app";
                    });
                    self.loadingCRIs = false;

                    self.startTime = data.StartTime;
                    self.endTime = data.EndTime;
                });

                resourceService.GetStampCluster().then(function (data: string) {
                    self.stampCluster = data;
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
                        incidentNotification.status = IncidentStatus[nameValuePair.Value];
                        incidentNotification.statusColor = this.getBorderColor(incidentNotification.status);
                    }
                    else if (nameValuePair.Name === "Id") {
                        incidentNotification.id = nameValuePair.Value;
                    }
                    else if (nameValuePair.Name === "Title") {
                        incidentNotification.title = nameValuePair.Value;
                    }
                    else if (nameValuePair.Name === "Stamp") {
                        incidentNotification.stamp = nameValuePair.Value;
                    }
                });

                return incidentNotification;
            });
        }

        public copyReport(text: string) {
            this.clipboard.copyText(this.replaceAll(text.replace(/\s+/g, ' ').trim(), '</p>', '\r\n\r\n').replace(/<(?:.|\n)*?>/gm, ''));
            this.$mdToast.showSimple("Report copied to clipboard !!");
            this.logEvent('IncidentDirective_ReportCopied');
        }

        public openNetVMATool() {

            var url: string = `https://netvma.westcentralus.cloudapp.azure.com/?startTime=${this.startTime}&endTime=${this.endTime}&value=${this.stampCluster}&destValue=&pathQuery=false&sdnPath=false&runAutoAnalysis=false&filterByLowAvailabilityOnly=false`;
            this.$window.open(url, "_blank");
            this.logEvent('IncidentDirective_NetVMAToolOpened');
        }

        private replaceAll(str, find, replace): string {
            return str.replace(new RegExp(find, 'g'), replace);
        }

        private logEvent(event: string) {
            var appInsightsClient = _.find(Object.keys(this.$window.window), function (item) { return item === 'appInsights' });
            if (appInsightsClient) {
                this.$window.window[appInsightsClient].trackEvent(event);
            }
        }

        public openServiceHealth() {
            let stateParts = this.$state.current.name.split('.');
            this.$state.go(`${stateParts[0]}.${stateParts[1]}.detector`, { detectorName: 'servicehealth' });
        }

        private getBorderColor(status: IncidentStatus) {
            switch (status) {
                case IncidentStatus.Resolved:
                    return '#0a8f5b';
                case IncidentStatus.Mitigated:
                    return '#ffb900';
                case IncidentStatus.Active:
                default:
                    return '#f36c4f';
            }
        }
    }

    class IncidentNotification {
        abnormalTimePeriod: DetectorAbnormalTimePeriod;
        link: string;
        message: string;
        messageTitle: string;
        status: IncidentStatus;
        statusColor: string;
        id: string;
        title: string;
        stamp: string;
    }

    enum IncidentStatus {
        Active,
        Mitigated,
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