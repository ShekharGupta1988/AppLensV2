///<reference path="../../references.ts" />

module SupportCenter {
    "use strict";

    export interface IAppRestartAnalysisService {
        getEmailText(siteName: string, analysisResult: DetectorAbnormalTimePeriod[], type: any): string;
        getHelpfulTipName(evidence: NameValuePair[]): string
    }

    export class AppRestartAnalysisService implements IAppRestartAnalysisService {

        static $inject = ['$window', '$stateParams'];

        constructor(public $window: ng.IWindowService, private $stateParams: IStateParams) {
        }

        getEmailText(siteName: string, analysisResult: DetectorAbnormalTimePeriod[], type: any): string {

            var self = this;
            var text: string = `Application : ${siteName}\r\n`;

            var startTime: Date;
            var endTime: Date;

            if (angular.isUndefined(this.$stateParams.startTime)) {
                if (angular.isDefined(this.$stateParams.endTime)) {
                    endTime = this.ConvertToUTCTime(new Date(this.$stateParams.endTime));
                }
                else {
                    endTime = this.ConvertToUTCTime(new Date());            
                }

                startTime = new Date(endTime.getTime());
                startTime.setHours(startTime.getHours() - 24);
            }
            else {
                startTime = this.ConvertToUTCTime(new Date(this.$stateParams.startTime));
                if (angular.isDefined(this.$stateParams.endTime)) {
                    endTime = this.ConvertToUTCTime(new Date(this.$stateParams.endTime));
                }
                else {
                    endTime = new Date(startTime.getTime());
                    endTime.setHours(endTime.getHours() + 24);
                }
            }
            

            text += `Start Time : ${d3.time.format('%m/%d %H:%M')(startTime)} (UTC)\r\n`;
            text += `End Time : ${d3.time.format('%m/%d %H:%M')(endTime)} (UTC)\r\n\r\n`; 

            if (analysisResult.length <= 0) {
                if (type === 0) {
                    text += `During this time period your application didn't experience any restarts.`
                }
                else if (type === 1) {
                    text += `During this time period your application did experienced restarts. However, at this point of time, we couldn't find any reasons for the application restart.`;
                }
            }
            else {
                text += `We found your application experienced restarts due to following reasons:\n`;
                analysisResult.forEach(function (item) {
                    text += `- ${item.Message}\n`;

                    item.MetaData.forEach(function (metadataItem) {

                        let helpfulTipName = self.getHelpfulTipName(metadataItem);
                        if (helpfulTipName !== '') {

                            let link = self.getHelpfulLink(metadataItem);
                            if (link !== '') {
                                text += `  ${helpfulTipName} : ${link}\n`;
                            }
                        }
                    });

                    text += '\n';
                });
            }

            return text;
        }

        getHelpfulTipName(evidence: NameValuePair[]): string {
            let displayName = _.find(evidence, function (item) { return item.Name === 'displayedName' });
            if (angular.isDefined(displayName)) {
                return displayName.Value;
            }

            return '';
        }

        private getHelpfulLink(evidence: NameValuePair[]): string {

            var link: string = '';
            let feature = _.find(evidence, function (item) { return item.Name === 'feature' });
            if (angular.isUndefined(feature)) {
                return link;
            }

            switch (feature.Value.toLowerCase()) {

                case 'autoheal':
                    link = 'https://blogs.msdn.microsoft.com/waws/2015/11/04/auto-heal-your-azure-web-app/';
                    break;

                case 'crashdiagnoser':
                    link = 'https://blogs.msdn.microsoft.com/asiatech/2015/12/28/use-crash-diagnoser-site-extension-to-capture-dump-for-intermittent-exception-issues-or-performance-issues-on-azure-web-app/';
                    break;

                case 'appanalysis':
                case 'perfanalysis':
                case 'memoryanalysis':
                    // TODO
                    break;

                case 'auditlogs':
                    link = 'https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-group-audit';
                    break;

                case 'localcache':
                    link = 'https://docs.microsoft.com/en-us/azure/app-service/app-service-local-cache';
                    break;

                case 'trafficmanager':
                    link = 'https://docs.microsoft.com/en-us/azure/app-service-web/web-sites-traffic-manager';
                    break;
            }

            return link;
        }

        private ConvertToUTCTime(localDate: Date): Date {
            var utcTime = new Date(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate(), localDate.getUTCHours(), localDate.getUTCMinutes(), localDate.getUTCSeconds());
            return utcTime;
        }
    }
}