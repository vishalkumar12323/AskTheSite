import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elasticache from "aws-cdk-lib/aws-elasticache";

interface CacheStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
};

export class CacheStack extends cdk.Stack {
    public readonly cache: elasticache.CfnServerlessCache;

    constructor(scope: Construct, id: string, props: CacheStackProps) {
        super(scope, id, props);

        // Security Group
        const cacheSecurityGroup = new ec2.SecurityGroup(this, "CacheSecurityGroup", {
            vpc: props.vpc,
            description: "SecurityGroup for AskTheSite ElastiCache",
            allowAllOutbound: true
        });

        // Serverless ElastiCache
        this.cache = new elasticache.CfnServerlessCache(this, "RedisCache", {
            engine: 'valkey',
            serverlessCacheName: 'askthesite-cache',

            subnetIds: props.vpc.selectSubnets({
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
            }).subnetIds,

            securityGroupIds: [
                cacheSecurityGroup.securityGroupId
            ],
        });

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
            value: cacheSecurityGroup.securityGroupId,
            description: "ElastiCache security Group ID"
        });
    };
};