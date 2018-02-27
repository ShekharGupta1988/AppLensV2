using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace AppLensV2
{
    public class CaseAnalysisHelper
    {
        private static List<string> IgnorableEvents = new List<string>() { "SCIFrameBlade", "StartUp" };

        private static List<string> CommonEventParams = new List<string>()
        {
            "sessionId",
            "ticketBladeWorkflowId",
            "subscriptionId",
            "resourceGroup",
            "resourceType",
            "resourceName",
            "appStack"
        };

        public static async Task<List<SupportCenterWorkflowData>> GetSupportCenterSessionsForSite(string siteName)
        {
            string query = KustoQueries.GetSupportCenterBladeOpenedQuery(siteName);
            var result = await KustoManager.Instance.ExecuteQueryAsync(query, "appsvcux", "APPSvcUX");

            List<SupportCenterWorkflowData> workflowList = new List<SupportCenterWorkflowData>();

            if (result != null)
            {
                foreach (DataRow row in result.Rows)
                {
                    string ticketId = row["ticketWorkflowId"].ToString();
                    var timeStamp = Utilities.GetDateTimeInUtcFormat(DateTime.Parse(row["TIMESTAMP"].ToString()));
                    string sessionId = row["localSessionId"].ToString();

                    if (!string.IsNullOrWhiteSpace(ticketId))
                    {
                        bool itemExists = workflowList.Exists(p => p.TicketWorkflowId != null && p.TicketWorkflowId.Equals(ticketId, StringComparison.OrdinalIgnoreCase));
                        if (!itemExists)
                        {
                            var workFlowItem = new SupportCenterWorkflowData();
                            workFlowItem.Timestamp = timeStamp;
                            workFlowItem.TicketWorkflowId = ticketId;

                            workFlowItem.MsSolveCaseId = await GetSrIdFromWorkflowId(ticketId);

                            workflowList.Add(workFlowItem);
                        }
                    }
                    else
                    {
                        // Support Center Blade was opened individually
                        var item = new SupportCenterWorkflowData();
                        item.Timestamp = timeStamp;
                        item.Sessions.Add(new SupportCenterSessionData()
                        {
                            SessionId = sessionId
                        });

                        workflowList.Add(item);
                    }
                }
            }

            return workflowList;
        }

        public static async Task<SupportCenterWorkflowData> GetSupportCenterDataForTicketWorkflow(string ticketWorkflowId, DateTime startTime, DateTime endTime)
        {
            string query = KustoQueries.GetSupportCenterUserDataForTicketQuery(ticketWorkflowId, startTime, endTime);
            var resultTask = KustoManager.Instance.ExecuteQueryAsync(query, "appsvcux", "APPSvcUX");
            var srIdTask = GetSrIdFromWorkflowId(ticketWorkflowId);

            var result = await resultTask;

            var workFlowData = new SupportCenterWorkflowData();
            workFlowData.TicketWorkflowId = ticketWorkflowId;
            workFlowData.MsSolveCaseId = await srIdTask;

            if(result != null)
            {
                foreach (DataRow row in result.Rows)
                {
                    var action = row["action"].ToString();
                    var data = row["data"].ToString();
                    var sessionId = row["localSessionId"].ToString();
                    var timeStamp = Utilities.GetDateTimeInUtcFormat(DateTime.Parse(row["TIMESTAMP"].ToString()));

                    if (!IgnorableEvents.Any(s => s.Equals(action, StringComparison.OrdinalIgnoreCase)))
                    {
                        var sessionDataItem = workFlowData.Sessions.FirstOrDefault(p => p.SessionId.Equals(sessionId, StringComparison.OrdinalIgnoreCase));
                        if(sessionDataItem == null)
                        {
                            sessionDataItem = new SupportCenterSessionData();
                            sessionDataItem.SessionId = sessionId;
                            sessionDataItem.Timestamp = timeStamp;

                            workFlowData.Sessions.Add(sessionDataItem);
                        }

                        sessionDataItem.Events.Add(new SupportCenterEvent()
                        {
                            EventName = action,
                            Timestamp = timeStamp,
                            EventData = ParseDataEntry(data)
                        });
                    }
                }
            }

            if (workFlowData.Sessions.Any())
            {
                workFlowData.Timestamp = workFlowData.Sessions.FirstOrDefault().Timestamp;
            }

            return workFlowData;
        }

        public static async Task<SupportCenterSessionData> GetSupportCenterDataForSession(string sessionId, DateTime startTime, DateTime endTime)
        {
            string query = KustoQueries.GetSupportCenterUserDataForSessionQuery(sessionId, startTime, endTime);
            var result = await KustoManager.Instance.ExecuteQueryAsync(query, "appsvcux", "APPSvcUX");

            var sessionData = new SupportCenterSessionData();
            sessionData.SessionId = sessionId;

            if (result != null)
            {
                foreach (DataRow row in result.Rows)
                {
                    var action = row["action"].ToString();

                    if (!IgnorableEvents.Any(s => s.Equals(action, StringComparison.OrdinalIgnoreCase)))
                    {
                        var eventData = new SupportCenterEvent();

                        var data = row["data"].ToString();

                        eventData.EventName = action;
                        eventData.Timestamp = Utilities.GetDateTimeInUtcFormat(DateTime.Parse(row["TIMESTAMP"].ToString()));
                        eventData.EventData = ParseDataEntry(data);
                        sessionData.Events.Add(eventData);
                    }
                }
            }

            if (sessionData.Events.Any())
            {
                sessionData.Timestamp = sessionData.Events.FirstOrDefault().Timestamp;
            }

            return sessionData;
        }

        public static async Task<string> GetSrIdFromWorkflowId(string workflowId)
        {
            // Temporary workaround. For more details, See issue https://github.com/ShekharGupta1988/AppLensV2/issues/1016
            string srId = null;
            try
            {
                string query = KustoQueries.GetSrIdFromWorkflowIdQuery(workflowId);
                var result = await KustoManager.Instance.ExecuteQueryAsync(query, "azsupport", "AzureSupportability");

                if (result != null && result.Rows != null && result.Rows.Count > 0)
                {
                    srId = result.Rows[0][0].ToString();
                }
            }
            catch
            {
            }

            return srId;
        }

        private static NameValuePropertyBag ParseDataEntry(string data)
        {
            NameValuePropertyBag output = new NameValuePropertyBag();

            data.Replace("\"", string.Empty).Split(new Char[] { ';' }).ToList().ForEach((item) =>
             {
                 var dataPairParts = item.Split(new Char[] { '=' }).ToList();
                 if (dataPairParts != null && dataPairParts.Count > 1)
                 {
                     var outputItem = new NameValuePair();
                     outputItem.Name = dataPairParts[0];
                     outputItem.Value = dataPairParts[1];

                     if (!CommonEventParams.Any(p => p.Equals(outputItem.Name, StringComparison.OrdinalIgnoreCase)))
                     {
                         output.Add(outputItem);
                     }
                 }
             });

            return output;
        }
    }
}