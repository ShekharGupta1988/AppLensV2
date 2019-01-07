using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace AppLensV2
{
    public class KustoQueries
    {
        private static string _kustoTimeFormat = "yyyy-MM-dd HH:mm:ss";

        public static string GetSupportCenterBladeOpenedQuery(string resourceName)
        {
            return KustoQueryTemplate.SupportCenterBladeOpened
                .Replace("{ResourceName}", resourceName.ToLower());
        }

        public static string GetSupportCenterUserDataForTicketQuery(string ticketWorkflowId, DateTime startTime, DateTime endTime)
        {
            return KustoQueryTemplate.SupportCenterUserDataForTicket
                .Replace("{StartTime}", Utilities.GetDateTimeInUtcFormat(startTime).ToString(_kustoTimeFormat))
                .Replace("{EndTime}", Utilities.GetDateTimeInUtcFormat(endTime).ToString(_kustoTimeFormat))
                .Replace("{TicketWorkflowId}", ticketWorkflowId.ToLower());
        }

        public static string GetSupportCenterUserDataForSessionQuery(string sessionId, DateTime startTime, DateTime endTime)
        {
            return KustoQueryTemplate.SupportCenterUserDataForSession
                .Replace("{StartTime}", Utilities.GetDateTimeInUtcFormat(startTime).ToString(_kustoTimeFormat))
                .Replace("{EndTime}", Utilities.GetDateTimeInUtcFormat(endTime).ToString(_kustoTimeFormat))
                .Replace("{SessionId}", sessionId.ToLower());
        }

        public static string GetSrIdFromWorkflowIdQuery(string workflowId)
        {
            return KustoQueryTemplate.SrIdFromWorkflowId
                .Replace("{WorkflowId}", workflowId);
        }
    }

    public class KustoQueryTemplate
    {
        public static string SupportCenterBladeOpened =
            @"ClientTelemetryNew | where TIMESTAMP >= ago(15d) and source =~ ""SupportCenter""
            | parse['data'] with * ""resourceName="" resourceName ';' *
            | where resourceName =~ ""{ResourceName}"" 
            | parse['data'] with * ""ticketBladeWorkflowId="" ticketWorkflowId  ';' *
            | parse['data'] with * ""sessionId="" localSessionId  ';' *
            | order by TIMESTAMP asc
            | summarize count() by bin(TIMESTAMP, 1d),  ticketWorkflowId , localSessionId
            | sort by TIMESTAMP desc";

        public static string SupportCenterUserDataForTicket =
            @"ClientTelemetryNew | where TIMESTAMP >= datetime({StartTime}) and TIMESTAMP <= datetime({EndTime}) and source =~ ""SupportCenter""
            | parse['data'] with * ""ticketBladeWorkflowId="" ticketWorkflowId  ';' *
            | parse['data'] with * ""sessionId="" localSessionId  ';' *
            | where ticketWorkflowId =~ ""{TicketWorkflowId}""
            | project TIMESTAMP, action, ['data'], ticketWorkflowId, localSessionId
            | sort by TIMESTAMP asc";

        public static string SupportCenterUserDataForSession =
            @"ClientTelemetryNew | where TIMESTAMP >= datetime({StartTime}) and TIMESTAMP <= datetime({EndTime}) and source =~ ""SupportCenter""
            | parse['data'] with * ""ticketBladeWorkflowId="" ticketWorkflowId  ';' *
            | parse['data'] with * ""sessionId="" localSessionId  ';' *
            | where localSessionId =~ ""{SessionId}""
            | project TIMESTAMP, action, ['data'], ticketWorkflowId, localSessionId
            | sort by TIMESTAMP asc";

        public static string SrIdFromWorkflowId =
            @"SrTelemetry
            | where trackingId =~ ""{WorkflowId}"" and action =~ ""CreateSr""
            | parse ['data'] with * ""[SrId:"" srId  ""]"" *
            | project srId";
    }
}