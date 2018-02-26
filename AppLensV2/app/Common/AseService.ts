///<reference path="../references.ts" />

module SupportCenter {
    "use strict";

    export interface IResourceService {
        promise: ng.IPromise<any>;
        site: Site;
        hostingEnvironment: HostingEnvironment;
        resource: Resource;
        sites: Array<Site>;
        GetStampCluster(): ng.IPromise<string>;
    }

    export class AseService implements IResourceService {

        static $inject = ['$http', '$stateParams', 'ErrorHandlerService', '$q'];
        constructor(private $http: ng.IHttpService, private $stateParams: IStateParams, private ErrorHandlerService: IErrorHandlerService, private $q: ng.IQService) {
            var self = this;

            if (!angular.isDefined(this.$stateParams.siteName) || this.$stateParams.siteName === '') {
                this.promise = this.$http.get(UriPaths.AppServiceEnvironmentDetails(this.$stateParams))
                    .success(function (data: any) {
                        self.resource = new HostingEnvironment(data.Details.Subscription, data.Details.ResourceGroupName, data.Details.Name, data.Details.InternalStampName);
                        self.hostingEnvironment = self.resource as HostingEnvironment;

                        self.hostingEnvironment.VNetName = data.Details.VNETName;
                        self.hostingEnvironment.VNetId = data.Details.VNETId;
                        self.hostingEnvironment.VNetSubnetName = data.Details.VNETSubnetName;
                        self.hostingEnvironment.VNetResourceGroup = data.Details.VNETResourceGroup;
                        self.hostingEnvironment.VNetSubnetAddressRange = data.Details.VNETSubnetAddressRange;
                        self.hostingEnvironment.MultiRoleSizeAndCount = data.Details.MultiSize + "(Count:" + data.Details.MultiRoleCount + ")";
                        self.hostingEnvironment.SmallWorkerSizeAndCount = data.Details.SmallDedicatedWebWorkerSize + "(Count:" + data.Details.SmallDedicatedWebWorkerRoleCount + ")"; 
                        self.hostingEnvironment.MediumWorkerSizeAndCount = data.Details.MediumDedicatedWebWorkerSize + "(Count:" + data.Details.MediumDedicatedWebWorkerRoleCount + ")"; 
                        self.hostingEnvironment.LargeWorkerSizeAndCount = data.Details.LargeDedicatedWebWorkerSize + "(Count:" + data.Details.LargeDedicatedWebWorkerRoleCount + ")";
                    })
                    .error(function (err: any) {
                        self.ErrorHandlerService.showError(ErrorModelBuilder.Build(err));
                    });
            }
        }
        
        public promise: ng.IPromise<any>;
        public site: Site;
        public hostingEnvironment: HostingEnvironment;
        public resource: Resource;
        public sites: Site[];

        public GetStampCluster(): ng.IPromise<string> {

            var deferred = this.$q.defer<string>();
            let url: string = UriPaths.StampClusterAPIPath(this.hostingEnvironment.resourceInternalStamp);
            this.$http.get(url)
                .success((data: any) => {
                    deferred.resolve(data);
                });

            return deferred.promise;
        }
    }
}
