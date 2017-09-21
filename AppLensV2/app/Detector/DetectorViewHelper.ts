///<reference path="../references.ts" />

module SupportCenter {
    "use strict";

    export class DetectorViewHelper {

        constructor(private $window: angular.IWindowService) {
        }

        public static DetailedGraphEnabledDetectors = [
            { name: 'cpuanalysis', metric: 'Overall CPU Percent' },
            { name: 'memoryanalysis', metric: 'Percent Physical Memory Used' },
            { name: 'pagefileoperations', metric: 'Page Reads/sec' },
            { name: 'tcpopensocketcount', metric: 'TotalOpenSocketCount' },
            { name: 'tcpconnectionsusage', metric: 'Outbound' }
        ];

        public GetChartOptions(detectorName: string = '', svc: IDetectorsService = null, resource: Resource = null): any {

            var options: any = {
                chart: {
                    type: 'multiBarChart',
                    height: this.graphHeight,
                    margin: {
                        top: 0,
                        right: 20,
                        bottom: 50,
                        left: 60
                    },
                    color: DetectorViewHelper.defaultColors,
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
                    },
                    multibar: {
                        dispatch: {
                            elementClick: function (e) {
                                if ((detectorName === "loganalyzer" || detectorName === "nodeloganalyzer")
                                    && e.data !== null && e.data.key !== null) {

                                    var startTime = new Date((new Date(e.data.x)).getTime() - ((new Date()).getTimezoneOffset() * 60 * 1000));
                                    var idateTime = startTime.getTime() + (5 * 60 * 1000);
                                    var endTime = new Date(idateTime);
                                    svc.getDetectorResponseWithDates(resource, detectorName, startTime, endTime).then(function (data: DetectorResponse) {

                                        var logData = "";

                                        for (var i = 0; i < data.Data[1].length; i++) {
                                            if (data.Data[1][i].Name === "Logs") {
                                                logData = data.Data[1][i].Value;
                                            }
                                        }

                                        var myWindow = window.open("", "_blank", "width=800,height=600");
                                        myWindow.document.body.innerHTML = '';
                                        myWindow.document.write("<pre>" + logData + "</pre>");
                                        if (window.focus) {
                                            myWindow.focus();
                                        }
                                        if (!myWindow.closed) {
                                            myWindow.focus();
                                        }

                                    }, function (err) {

                                    });

                                }
                            }
                        }
                    }
                }
            };

            switch (detectorName.toLowerCase()) {
                case 'overallruntimeavailability':
                case 'runtimeavailability':
                case 'cpuanalysis':
                case 'workercpuanalysis':
                case 'multirolecpuanalysis':
                case 'multirolecpuanalysisdetailed':
                case 'machinememoryusage':
                case 'machinememoryusagedetailed':
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
                case 'multirolehttperrordisribution':
                case 'workerrolehttperrordistribution':
                case 'outboundnetworkconnections':
                case 'functioninstanceallocations':
                case 'tcpconnectionsusage':
                case 'tcpconnectionsusagedetailed':
                case 'tcpopensocketcount':
                case 'tcpopensocketcountdetailed':
                case 'containerstoragecapacity':
                case 'httpqueuelength':
                case 'committedmemoryusage':
                case 'pagefileoperations':
                case 'pagefileoperationsdetailed':
                    options.chart.type = 'lineChart';
                    options.chart.useInteractiveGuideline = true;
                    break;
                case 'aseexternalconnectionhealth':
                    options.chart.type = 'lineChart';
                    options.chart.useInteractiveGuideline = true;
                    options.chart.yAxis.axisLabel = 'Availability';
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
                case 'filesystemusage':
                    options.chart.type = 'pieChart';
                    options.chart.showLabels = true;
                    options.chart.x = function (d) { return d.key; };
                    options.chart.y = function (d) { return d.y; };
                    options.chart.height = 400;
                    options.chart.duration = 500;
                    options.chart.labelThreshold = 0.0001;
                    options.chart.labelSunbeamLayout = true;
                    options.chart.labelsOutside = true;
                    options.chart.pie = {};
                    options.chart.donut = true;
                    break;
            }
            return options;
        }
        
        public GetChartData(startTimeStr: string, endTimeStr: string, metrics: DiagnosticMetricSet[], detectorName: string = ''): any {

            var self = this;
            var perWorkerGraph: boolean = false;

            var diskUsageData: any = {};
            
            var chartData = [];

            if (!self.IsNvd3ChartEnabled(detectorName)) {
                return self.GetGoogleChartData(startTimeStr, endTimeStr, metrics, detectorName);
            }

            var fileStorageTitle = [];
            
            var startTime = new Date(startTimeStr);
            var endTime = new Date(endTimeStr);
            var coeff = 1000 * 60 * 5;

            for (let metric of metrics) {

                var skipMetric = false;
                for (var i = 0; i < DetectorViewHelper.DetailedGraphEnabledDetectors.length; i++) {
                    if (detectorName.indexOf(DetectorViewHelper.DetailedGraphEnabledDetectors[i].name) >= 0 && metric.Name !== DetectorViewHelper.DetailedGraphEnabledDetectors[i].metric) {
                        skipMetric = true;
                        break;
                    }
                }

                if (skipMetric) {
                    continue;
                }

                if (detectorName.indexOf('filesystemusage') >= 0) {
                    diskUsageData = {
                        key: metric.Name,
                        y: metric.Values[0].Total
                    };
                    if (metric.Name !== "Total" && metric.Name !== "Used") {
                        chartData.push(diskUsageData);
                    }
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

        public GetGoogleChartData(startTimeStr: string, endTimeStr: string, metrics: DiagnosticMetricSet[], detectorName: string = ''): any {
            var chartObject: any = {};
            chartObject.type = "Timeline";
            var chartObjectRows = [];

            for (let metric of metrics) {
                chartObjectRows.push({ c: [{ v: metric.Name.substring(metric.Name.lastIndexOf("-") + 1) }, { v: new Date(metric.StartTime.replace("Z", "")) }, { v: new Date(metric.EndTime.replace("Z", "")) }] });
            }

            chartObject.data = {
                "cols": [
                    { label: "UpgradeDomain", type: "string" },
                    { label: "Start", type: "datetime" },
                    { label: "End", type: "datetime" }
                ],
                "rows": chartObjectRows
            };

            chartObject.options = {
                'title': 'Upgrade Domain',
                'width': this.$window.innerWidth * 0.75,
                'height': this.graphHeight * 2
            };

            return chartObject;
        }

        public IsNvd3ChartEnabled(detectorName: string): boolean {
            let isNv3ChartEnabled: boolean = false;
            switch (detectorName) {
                case 'rebootrolesstuck':
                    isNv3ChartEnabled = false;
                    break;
                default:
                    isNv3ChartEnabled = true;
                    break;
            }

            return isNv3ChartEnabled;
        }

        public GetDetailedChartData(metrics: DiagnosticMetricSet[], detectorName: string = ''): DetailedGraphData {
            var self = this;
            var perWorkerGraph: boolean = false;

            var chartData = [];
            var allDetailedChartData: DetailedGraphData = new DetailedGraphData();

            for (let metric of metrics) {
                if (metric.Name === 'Percent Physical Memory Used') {
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
        
        public static defaultColors: [string] = ["#DD2C00", "#0D47A1", "#00695C", "#3E2723", "#FF6F00", "#aa0000", "#311B92", "#D4E157", "#4DB6AC", "#880E4F"];
        public static runtimeAvailabilityColors: [string] = ["#117dbb", "hsl(120, 57%, 40%)"];
        public static requestsColors: [string] = ["#117dbb", "hsl(120, 57%, 40%)", "#D4E157", "rgb(173, 90, 16)", "#aa0000"];

    }
}