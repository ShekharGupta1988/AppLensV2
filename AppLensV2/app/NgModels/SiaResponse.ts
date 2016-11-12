///<reference path="../references.ts" />

module SupportCenter {
    "use strict";

    export class SiaResponse {
        constructor(
            public StartTime: string,
            public EndTime: string,
            public AbnormalTimePeriods: AbnormalTimePeriod[],
            public Payload: AnalysisData[]
        ) {
        }
    }

    export class AbnormalTimePeriod {
        constructor(
            public StartTime: string,
            public EndTime: string,
            public Events: DetectorAbnormalTimePeriod[],
            public Visible?: boolean
        ) {
        }
    }

    export class AnalysisData {
        constructor(
            public Source: string,
            public Metrics: DiagnosticMetricSet[],
            public Data: NameValuePair[][],
            public DetectorMetaData: ResponseMetaData,
            public DetectorDefinition: DetectorDefinition
        ) {
        }
    }
}