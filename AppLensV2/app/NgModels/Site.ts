///<reference path="../references.ts" />

module SupportCenter {
    "use strict";

    export abstract class Resource {
        subscriptionId: string;
        resourceGroup: string;
        resourceName: string;
        resourceInternalStamp: string;

        constructor(subscriptionId: string, resourceGroup: string, resourceName: string, resourceInternalStamp: string) {
            this.subscriptionId = subscriptionId;
            this.resourceGroup = resourceGroup;
            this.resourceName = resourceName;
            this.resourceInternalStamp = resourceInternalStamp;
        }
    }

    export class Site extends Resource {
        constructor(
            public name: string,
            public subscriptionId: string,
            public resourceGroup: string,
            public hostNames: string[],
            public stampName: string,
            public internalStampName: string
        ) {
            super(subscriptionId, resourceGroup, name, internalStampName);
        }

        kind: string
        sku: string;
        stack: string;
        isLocalCacheEnabled: string;
        numberOfContinousWebJobs: number;
        numberOfTriggeredWebJobs: number;
        numberOfSlots: number;
        isLinux: boolean;
    }

    export class HostingEnvironment extends Resource {
        constructor(
            subscriptionId: string,
            resourceGroup: string,
            hostingEnvironmentName: string,
            internalStampName: string
        ) {
            super(subscriptionId, resourceGroup, hostingEnvironmentName, internalStampName);
        }

        VNetName: string;
        VNetId: string;
        VNetSubnetName: string;
        VNetSubnetAddressRange: string;
        MultiRoleSizeAndCount: string;
        SmallWorkerSizeAndCount: string;
        MediumWorkerSizeAndCount: string;
        LargeWorkerSizeAndCount: string;
        VNetResourceGroup: string;
    }
}