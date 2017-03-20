﻿///<reference path="../references.ts" />

module SupportCenter {
    "use strict";

    export class DetectorViewHelper {

        constructor(private $window: angular.IWindowService) {
        }

        public GetChartOptions(detectorName: string = ''): any {

            var options: any = {
                chart: {
                    type: 'multiBarChart',
                    height: this.graphHeight,
                    margin: {
                        top: 20,
                        right: 20,
                        bottom: 50,
                        left: 60
                    },
                    color: this.defaultColors,
                    useInteractiveGuideline: false,
                    transitionDuration: 350,
                    showLegend: true,
                    stacked: true,
                    clipEdge: false,
                    showControls: false,
                    x: function (d) { return d.x; },
                    y: function (d) { return d.y; },
                    xAxis: {
                        showMaxMin: false,
                        axisLabel: 'Time (UTC)',
                        staggerLabels: true,
                        tickFormat: function (d) { return d3.time.format('%m/%d %H:%M')(new Date(d)); }
                    },
                    yAxis: {
                        axisLabel: '',
                        showMaxMin: false,
                        tickFormat: d3.format('.2f')
                    }
                }
            };

            switch (detectorName.toLowerCase()) {
                case 'runtimeavailability':
                case 'cpuanalysis':
                case 'workercpuanalysis':
                case 'multirolecpuanalysis':
                case 'multirolecpuanalysisdetailed':
                case 'sitecpuanalysis':
                case 'sitecpuanalysisdetailed':
                case 'workeravailability':
                case 'sitememoryanalysis':
                case 'multirolememoryanalysis':
                case 'workermemoryanalysis':
                case 'workercpuanalysisdetailed':
                case 'exceptioncount':
                case 'garbagecollectiongen2':
                case 'garbagecollection':
                case 'handlecount':
                case 'threadcount':
                case 'appdomainsunloaded':
                case 'asehealth':
                case 'storagehealth':
                    options.chart.type = 'lineChart';
                    options.chart.useInteractiveGuideline = true;
                    break;
                case 'sitememoryanalysisdetailed':
                case 'workermemoryanalysisdetailed':
                case 'multirolememoryanalysisdetailed':
                    options.chart.type = 'stackedAreaChart';
                    options.chart.useInteractiveGuideline = true;
                    break;
                case 'sitelatency':
                case 'frontendlatency':
                case 'stampfrontendlatency':
                case 'workerlatency':
                case 'datarolelatency':
                    options.chart.type = 'lineChart';
                    options.chart.useInteractiveGuideline = true;
                    options.chart.yAxis.axisLabel = 'Milliseconds';
                    break;
            }
            return options;
        }
        
        public GetChartData(startTimeStr: string, endTimeStr: string, metrics: DiagnosticMetricSet[], detectorName: string = ''): any {

            var self = this;
            var perWorkerGraph: boolean = false;
            
            var chartData = [];
            
            var startTime = new Date(startTimeStr);
            var endTime = new Date(endTimeStr);
            var coeff = 1000 * 60 * 5;

            for (let metric of metrics) {

                if ((detectorName.indexOf('cpuanalysis') >= 0 && metric.Name !== "PercentTotalProcessorTime") || (detectorName.indexOf('memoryanalysis') >= 0 && metric.Name !== 'PercentOverallMemory')) {
                    continue;
                }

                var workerChartData: any = {};

                coeff = this.GetTimeSpanInMilliseconds(metric.TimeGrain);
                var roundedStartTime = new Date(Math.round(startTime.getTime() / coeff) * coeff);
                var roundedEndTime = new Date(Math.round(endTime.getTime() / coeff) * coeff);

                var defaultValue: number = 0;
                if (metric.Name.toLowerCase().indexOf("availability") > -1) {
                    defaultValue = 100;
                }

                let workerName = Constants.aggregatedWorkerName;
                for (let point of metric.Values) {
                    if ((!angular.isDefined(point.IsAggregated) || point.IsAggregated === false) && angular.isDefined(point.RoleInstance)) {
                        perWorkerGraph = true;
                        workerName = point.RoleInstance;
                    }

                    if (!angular.isDefined(workerChartData[workerName])) {

                        workerChartData[workerName] = {
                            key: workerName === Constants.aggregatedWorkerName ? metric.Name : workerName + '(' + metric.Name + ')',
                            worker: workerName,
                            isActive: true,
                            values: [],
                            area: false
                        };
                    }
                }

                // Take care of the case where no metric sets have data
                if (Object.keys(workerChartData).length < 1) {
                    workerChartData[Constants.aggregatedWorkerName] = {
                        key: metric.Name,
                        worker: workerName,
                        isActive: true,
                        values: [],
                        area: false
                    };
                }

                metric.Values.sort(this.SortDataForGraphing);

                for (let worker in workerChartData) {

                    var workerData = _.filter(metric.Values, function (item) {
                        return item.RoleInstance === worker || worker === Constants.aggregatedWorkerName;
                    });

                    var nextElementToAdd = workerData.pop();

                    for (var d = new Date(roundedStartTime.getTime()); d < roundedEndTime; d.setTime(d.getTime() + coeff)) {

                        let xDate = new Date(d.getTime());
                        let yValue = defaultValue;

                        if (angular.isDefined(nextElementToAdd) && xDate.getTime() === new Date(nextElementToAdd.Timestamp).getTime()) {
                            yValue = nextElementToAdd.Total;

                            var last = nextElementToAdd;

                            //For bug in CPU data where points are repeated.
                            do {
                                nextElementToAdd = workerData.pop();
                            }
                            while (angular.isDefined(nextElementToAdd) && new Date(nextElementToAdd.Timestamp).getTime() <= new Date(last.Timestamp).getTime());
                            
                        }

                        workerChartData[worker].values.push(
                            {
                                x: self.ConvertToUTCTime(xDate),
                                y: yValue
                            }
                        );
                    }
                    chartData.push(workerChartData[worker]);
                }
            }

            return chartData;
        }

        public GetDetailedChartData(metrics: DiagnosticMetricSet[], detectorName: string = ''): DetailedGraphData {
            var self = this;
            var perWorkerGraph: boolean = false;

            var chartData = [];
            var allDetailedChartData: DetailedGraphData = new DetailedGraphData();

            for (let metric of metrics) {
                if (metric.Name === 'PercentOverallMemory') {
                    continue;
                }

                var startTime = new Date(metric.StartTime);
                var endTime = new Date(metric.EndTime);

                var coeff = this.GetTimeSpanInMilliseconds(metric.TimeGrain);
                var roundedStartTime = new Date(Math.round(startTime.getTime() / coeff) * coeff);
                var roundedEndTime = new Date(Math.round(endTime.getTime() / coeff) * coeff);

                var defaultValue: number = 0;

                metric.Values.sort(this.SortDataForGraphing);

                // Create instance list
                if (allDetailedChartData.instanceList === null || allDetailedChartData.instanceList.length < 1) {
                    metric.Values.forEach(function (point, index) {
                        if (allDetailedChartData.instanceList.indexOf(point.RoleInstance) < 0) {
                            allDetailedChartData.instanceList.push(point.RoleInstance);
                            allDetailedChartData.processesRemovedPerWorker[point.RoleInstance] = 0;
                        }
                    });
                }

                allDetailedChartData.processList.push(metric.Name);

                for (let index in allDetailedChartData.instanceList) {

                    var workerData = _.filter(metric.Values, function (item) {
                        return item.RoleInstance === allDetailedChartData.instanceList[index];
                    });

                    var workerChartData = [];
                    var processMaxUsageOnWorker = 0;
                    var nextElementToAdd = workerData.pop();

                    if (!angular.isDefined(nextElementToAdd) || !angular.isDefined(nextElementToAdd.Timestamp)) {
                        continue;
                    }

                    while (new Date(nextElementToAdd.Timestamp).getTime() < roundedStartTime.getTime()) {
                        nextElementToAdd = workerData.pop();
                    }

                    for (var d = new Date(roundedStartTime.getTime()); d < roundedEndTime; d.setTime(d.getTime() + coeff)) {

                        let xDate = new Date(d.getTime());
                        let yValue = defaultValue;

                        if (angular.isDefined(nextElementToAdd) && xDate.getTime() === new Date(nextElementToAdd.Timestamp).getTime()) {
                            yValue = nextElementToAdd.Total;

                            var last = nextElementToAdd;

                            //For bug in CPU data where points are repeated.
                            do {
                                nextElementToAdd = workerData.pop();
                            }
                            while (angular.isDefined(nextElementToAdd) && new Date(nextElementToAdd.Timestamp).getTime() <= new Date(last.Timestamp).getTime());
                        }

                        if (yValue > processMaxUsageOnWorker) {
                            processMaxUsageOnWorker = yValue;
                        }

                        workerChartData.push(new GraphPoint(self.ConvertToUTCTime(xDate), yValue));
                    }

                    if (processMaxUsageOnWorker > 0.5 || metrics.length < 40) {
                        allDetailedChartData.metricData.push(new GraphSeries(metric.Name, allDetailedChartData.instanceList[index], workerChartData))
                    }
                    else {
                        allDetailedChartData.processesRemovedPerWorker[allDetailedChartData.instanceList[index]] += 1;
                    }

                }
            }

            return allDetailedChartData;
        }

        public ConvertToUTCTime(localDate: Date): Date {
            var utcTime = new Date(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate(), localDate.getUTCHours(), localDate.getUTCMinutes(), localDate.getUTCSeconds());
            return utcTime;
        }

        private GetTimeSpanInMilliseconds(timeSpan: string) {
            var a = timeSpan.split(':');
            return ((+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2])) * 1000;
        }

        private SortDataForGraphing(a: DiagnosticMetricSample, b: DiagnosticMetricSample) {
            var dateA = new Date(a.Timestamp).getTime();
            var dateB = new Date(b.Timestamp).getTime();
            if (dateA > dateB) {
                return -1;
            }
            if (dateA < dateB) {
                return 1;
            }
            return 0;
        }

        private graphHeight: any = this.$window.innerHeight * 0.2;
        
        private defaultColors: [string] = ["#DD2C00", "#0D47A1", "#00695C", "#3E2723", "#FF6F00", "#aa0000", "#311B92", "#D4E157", "#4DB6AC", "#880E4F"];
        public static runtimeAvailabilityColors: [string] = ["#117dbb", "hsl(120, 57%, 40%)"];
        public static requestsColors: [string] = ["#117dbb", "hsl(120, 57%, 40%)", "#D4E157", "rgb(173, 90, 16)", "#aa0000"];

    }
}