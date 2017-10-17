///<reference path="../references.ts" />

module SupportCenter {
    "use strict";

    export class DetectorResponse {
        constructor(
            public StartTime: string,
            public EndTime: string,
            public Metrics: DiagnosticMetricSet[],
            public Data: NameValuePair[][],
            public ResponseMetaData: ResponseMetaData,
            public AbnormalTimePeriods: DetectorAbnormalTimePeriod[]
        ) {
        }
    }

    export class DetectorAbnormalTimePeriod {
        constructor(
            public StartTime: string,
            public EndTime: string,
            public MetaData: NameValuePair[][],
            public Message: string = '',
            public Source: string = '',
            public Priority: number = 0,
            public Visible?: boolean,
            public Instance: string = ''
        ) {
        }
    }

    export class DiagnosticMetricSet {
        constructor(
            public Name: string,
            public Unit: string,
            public StartTime: string,
            public EndTime: string,
            public TimeGrain: string,
            public Values: DiagnosticMetricSample[]
        ) {
        }
    }

    export class DiagnosticMetricSample {
        constructor(
            public Timestamp: string,
            public Total: number,
            public Maximum: number,
            public Minimum: number,
            public RoleInstance: string,
            public IsAggregated: boolean
        ) {
        }
    }
    
    export class ResponseMetaData {
        constructor(
            public DataSource: DataSource
        ) {
        }
    }

    export class DataSource {
        constructor(
            public Instructions: string[],
            public DataSourceUri: NameValuePair[][]
        ) {
        }
    }

    export class NameValuePair {
        constructor(
            public Name: string,
            public Value: string
        ) {
        }
    }
}