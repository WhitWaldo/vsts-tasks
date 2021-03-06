import msRestAzure = require('./azure-arm-common');
import tl = require('vsts-task-lib/task');
import Model = require("./azureModels");
import util = require('util');
import webClient = require('./webClient');
import Q = require('q');
import {
    AzureEndpoint,
    AKSCluster
} from './azureModels';

import {
    ServiceClient,
    ToError
} from './AzureServiceClient';

export class AzureAksService {

    public _client: ServiceClient;

    constructor(endpoint: AzureEndpoint) {
        this._client = new ServiceClient(endpoint.applicationTokenCredentials, endpoint.subscriptionID, 30);
    }

    public beginRequest(uri: string,  parameters: {}) : Promise<webClient.WebResponse> {
         var webRequest = new webClient.WebRequest();
         webRequest.method = 'GET';
         webRequest.uri = this._client.getRequestUri(uri, parameters, null,'2017-08-31');
        return this._client.beginRequestExpBackoff(webRequest, 3).then((response)=>{
            if(response.statusCode >= 200 && response.statusCode < 300) {
                return response;
            } else {
                throw ToError(response);
            }
        });
    } 

    public getAccessProfile(resourceGroup : string , clusterName : string ): Promise<Model.AKSClusterAccessProfile> {
        return this.beginRequest(`//subscriptions/{subscriptionId}/resourceGroups/{ResourceGroupName}/providers/Microsoft.ContainerService/managedClusters/{ClusterName}/accessProfiles/clusterUser`,
        {
            '{ResourceGroupName}': resourceGroup,
            '{ClusterName}': clusterName
        }).then((response) => {
            return  response.body;
        }, (reason) => {
            throw Error(tl.loc('CantDownloadAccessProfile',clusterName,  this._client.getFormattedError(reason)));
        });
    }
}