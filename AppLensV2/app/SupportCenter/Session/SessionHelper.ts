///<reference path="../../references.ts" />

module SupportCenter {
    "use strict";

    export class SessionHelper {
        
        public GetUIModelForEvent(event: SupportCenterEvent): any {

            let uiModel = {
                eventName: event.EventName.toLowerCase(),
                message: '',
                icon: '',
                iconColor: '',
                body: undefined,
                timestamp: this.GetDateString(new Date(event.Timestamp))
            };

            switch (event.EventName.toLowerCase()) {

                case "currentapphealth":
                    {
                        uiModel.message = "This app was <span>running healthy</span> during that timeframe.";
                        uiModel.icon = "done";
                        uiModel.iconColor = 'green';

                        let isHealthy = _.find(event.EventData, function (item) {
                            return item.Name.toLowerCase() === 'ishealthy';
                        });

                        if (angular.isDefined(isHealthy)) {
                            if (isHealthy.Value.toLowerCase() === "false") {
                                uiModel.message = "This app was <span>experiencing Http server errors</span> during that timeframe."
                                uiModel.icon = "error";
                                uiModel.iconColor = 'red';
                            }
                        }

                        break;
                    }

                case "appanalysissummary":
                    {

                        uiModel.message = "During this time, We discovered <span>{downtimeCount} abnormal dips</span> in availability for this app.";
                        uiModel.iconColor = '#FFAB00';
                        uiModel.icon = "info";
                        let downtimeCount = _.find(event.EventData, function (item) {
                            return item.Name.toLowerCase() === 'numberofdowntimes';
                        });

                        if (angular.isDefined(downtimeCount)) {
                            uiModel.message = uiModel.message.replace("{downtimeCount}", downtimeCount.Value);
                        }

                        break;
                    }

                case "click":
                    {
                        let feature = _.find(event.EventData, function (item) {
                            return item.Name.toLowerCase() === 'name';
                        });

                        let container = _.find(event.EventData, function (item) {
                            return item.Name.toLowerCase() === 'containername';
                        });

                        uiModel.message = `Customer clicked <span>${feature.Value}</span> in <span>${container.Value}</span>.`;
                        uiModel.iconColor = '#BF360C';
                        uiModel.icon = "mouse";

                        break;
                    }

                case "solutionexpanded":
                    {
                        let solution = _.find(event.EventData, function (item) {
                            return item.Name.toLowerCase() === 'solution';
                        });

                        let order = _.find(event.EventData, function (item) {
                            return item.Name.toLowerCase() === 'order';
                        });

                        uiModel.message = `Customer expanded "<span>${solution.Value}</span>" solution. The order of the solution in the solutions list was ${order.Value}`;
                        uiModel.iconColor = '#00BCD4';
                        uiModel.icon = "arrow_drop_down_circle";

                        break;
                    }

                case "solutiontried":
                    {
                        let solutionTried = _.find(event.EventData, function (item) {
                            return item.Name.toLowerCase() === 'solution';
                        });

                        let triedOrder = _.find(event.EventData, function (item) {
                            return item.Name.toLowerCase() === 'order';
                        });


                        let triedSolutionActionType = _.find(event.EventData, function (item) {
                            return item.Name.toLowerCase() === 'actiontype';
                        });


                        let triedSolutionActionName = _.find(event.EventData, function (item) {
                            return item.Name.toLowerCase() === 'actionname';
                        });

                        uiModel.message = `Customer tried "<span>${solutionTried.Value}</span>" solution. The order of the solution in the solutions list was ${triedOrder.Value}.<br/>The action type was <span>${triedSolutionActionType.Value}</span> and action was <span>${triedSolutionActionName.Value}</span>`;
                        uiModel.iconColor = '#64DD17';
                        uiModel.icon = "settings_applications";

                        break;
                    }

                case "message":
                    {
                        let message = _.find(event.EventData, function (item) {
                            return item.Name.toLowerCase() === 'message';
                        });

                        uiModel.message = `${message.Value}`;
                        uiModel.iconColor = '#9C27B0';
                        uiModel.icon = "message";
                        break;
                    }

                case "detectorviewopened": {

                    let source = _.find(event.EventData, function (item) {
                        return item.Name.toLowerCase() === 'source';
                    });

                    uiModel.message = `"<span>${source.Value}</span>" detector view opened by customer.`;
                    uiModel.iconColor = '#FFAB00';
                    uiModel.icon = "info";

                    break;
                }

                case "downtimevisitedsummary": {

                    let startTime = _.find(event.EventData, function (item) {
                        return item.Name.toLowerCase() === 'starttime';
                    });

                    let endTime = _.find(event.EventData, function (item) {
                        return item.Name.toLowerCase() === 'endtime';
                    });

                    let isDowntimeNow = _.find(event.EventData, function (item) {
                        return item.Name.toLowerCase() === 'isdowntimenow';
                    });

                    let observationsItem = _.find(event.EventData, function (item) {
                        return item.Name.toLowerCase() === 'observations';
                    });

                    let solutionsItem = _.find(event.EventData, function (item) {
                        return item.Name.toLowerCase() === 'solutions';
                    });

                    uiModel.message = `Customer <span>viewed a downtime</span>. The downtime began at ${this.GetDateString(new Date(startTime.Value))} and ended at ${this.GetDateString(new Date(endTime.Value))}`;

                    if (isDowntimeNow.Value === "true") {
                        uiModel.message = `Customer <span>viewed a downtime</span>. The downtime began at ${this.GetDateString(new Date(startTime.Value))} and was still going on when customer viewed this.`;
                    }

                    uiModel.icon = "insert_chart";
                    uiModel.iconColor = "#4DB6AC";

                    uiModel.body = {
                        startTime: this.GetDateString(new Date(startTime.Value)),
                        endTime: this.GetDateString(new Date(endTime.Value)),
                        observations: observationsItem.Value.split(/[,|]+/),
                        solutions: solutionsItem.Value.split(/[,|]+/)
                    };

                    if (uiModel.body.observations.length === 1 && uiModel.body.observations[0] === '') {
                        uiModel.body.observations = [];
                    }

                    if (uiModel.body.solutions.length === 1 && uiModel.body.solutions[0] === '') {
                        uiModel.body.solutions = [];
                    }
                    
                    break;
                }

                default:

                    uiModel.message = `Event <span>${event.EventName}</span> found.`;
                    uiModel.icon = "explore";
                    uiModel.iconColor = '#B0BEC5';
                    uiModel.body = event.EventData;
                    break;
            }

            return uiModel;
        }

        public GetDateString(dateObj: Date): string {

            return `${this.Pad(dateObj.getUTCMonth() + 1)}/${this.Pad(dateObj.getUTCDate())}/${dateObj.getUTCFullYear()} ${this.Pad(dateObj.getUTCHours())}:${this.Pad(dateObj.getUTCMinutes())} (UTC)`;
        }

        private Pad(n: number): string {
            return (n < 10) ? ("0" + n.toString()) : n.toString();
        }
    }
}