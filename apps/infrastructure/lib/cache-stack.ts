import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elasticache from "aws-cdk-lib/aws-elasticache";

interface CacheStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
    /** Pre-created SG from SecurityGroupsStack – avoids cross-stack SG cycles. */
    elastiCacheSecurityGroup: ec2.SecurityGroup;
};

export class CacheStack extends cdk.Stack {
    public readonly cache: elasticache.CfnServerlessCache;
    public readonly elastiCacheSecurityGroup: ec2.SecurityGroup;

    public readonly cacheEndpoint: string;
    public readonly cachePort: string;

    constructor(scope: Construct, id: string, props: CacheStackProps) {
        super(scope, id, props);

        // Security Group is created in SecurityGroupsStack to prevent
        // cross-stack SG reference cycles.
        this.elastiCacheSecurityGroup = props.elastiCacheSecurityGroup;

        // Serverless ElastiCache
        this.cache = new elasticache.CfnServerlessCache(this, "RedisCache", {
            engine: 'valkey',
            serverlessCacheName: 'askthesite-cache',

            subnetIds: props.vpc.selectSubnets({
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
            }).subnetIds,

            securityGroupIds: [
                this.elastiCacheSecurityGroup.securityGroupId
            ],
        });

        this.cacheEndpoint = this.cache.attrEndpointAddress;
        this.cachePort = this.cache.attrEndpointPort;

        // Outputs
        new cdk.CfnOutput(this, "CacheEndpoint", {
            value: this.cache.attrEndpointAddress,
            description: "Elasticache endpoint for AskTheSite"
        });

        new cdk.CfnOutput(this, "CachePort", {
            value: this.cache.attrEndpointPort,
            description: "ElastiCache Port"
        });

        new cdk.CfnOutput(this, "CacheSecurityGroupId", {
            value: this.elastiCacheSecurityGroup.securityGroupId,
            description: "ElastiCache security Group ID"
        });
    };
};