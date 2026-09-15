import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";

interface AlbStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
    albSecurityGroup: ec2.SecurityGroup;

    apiService: ecs.FargateService;
    webService: ecs.FargateService;
    workerService: ecs.FargateService;
}

export class AlbStack extends cdk.Stack {
    public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
    public readonly albSecurityGroup: ec2.SecurityGroup;

    public readonly apiService: ecs.FargateService;
    public readonly webService: ecs.FargateService;
    public readonly workerService: ecs.FargateService;

    constructor(scope: Construct, id: string, props: AlbStackProps) {
        super(scope, id, props);


        this.albSecurityGroup = props.albSecurityGroup;
        this.apiService = props.apiService;
        this.webService = props.webService;
        this.workerService = props.workerService;



        // ----------------------------------------------------------------
        // Application Load Balancer
        this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, "AskThesiteALB", {
            vpc: props.vpc,
            loadBalancerName: "askthesite-alb",

            internetFacing: true,
            securityGroup: this.albSecurityGroup,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC
            }
        });


        // API Service Target Group
        const apiTargetGroup = new elbv2.ApplicationTargetGroup(this, "ApiTargetGroup", {
            vpc: props.vpc,
            port: 3001,
            protocol: elbv2.ApplicationProtocol.HTTP,
            targetType: elbv2.TargetType.IP,

            healthCheck: {
                path: "/api/v1/health",
                protocol: elbv2.Protocol.HTTP,
                port: "3001",
                healthyHttpCodes: "200-399",

                interval: cdk.Duration.seconds(30),
                timeout: cdk.Duration.seconds(5),
                healthyThresholdCount: 2,
                unhealthyThresholdCount: 3
            }
        });


        // WEB Service Target Group
        const webTargetGroup = new elbv2.ApplicationTargetGroup(this, "WebTargetGroup", {
            vpc: props.vpc,
            port: 3000,
            protocol: elbv2.ApplicationProtocol.HTTP,
            targetType: elbv2.TargetType.IP,


            healthCheck: {
                path: "/",
                protocol: elbv2.Protocol.HTTP,
                port: "3000",
                healthyHttpCodes: "200-399",

                interval: cdk.Duration.seconds(30),
                timeout: cdk.Duration.seconds(5),
                healthyThresholdCount: 2,
                unhealthyThresholdCount: 3
            }
        });

        // WORKER Service Target Group
        const workerTargetGroup = new elbv2.ApplicationTargetGroup(this, "WorkertargetGroup", {
            vpc: props.vpc,
            port: 3002,
            protocol: elbv2.ApplicationProtocol.HTTP,
            targetType: elbv2.TargetType.IP,

            healthCheck: {
                path: "/health",
                protocol: elbv2.Protocol.HTTP,
                port: "3002",
                healthyHttpCodes: "200-299",

                interval: cdk.Duration.seconds(30),
                timeout: cdk.Duration.seconds(5),
                healthyThresholdCount: 2,
                unhealthyThresholdCount: 3,
            }
        })

        // Attaching ECS Services to target groups
        this.apiService.attachToApplicationTargetGroup(apiTargetGroup);
        this.webService.attachToApplicationTargetGroup(webTargetGroup);
        this.workerService.attachToApplicationTargetGroup(workerTargetGroup);


        // Create HTTP Listener
        const httpListener = this.loadBalancer.addListener("HttpListener", {
            port: 80,
            open: false,
            protocol: elbv2.ApplicationProtocol.HTTP,
            defaultTargetGroups: [webTargetGroup],
        });


        // Add API path-based routing
        httpListener.addTargetGroups("ApiPathRule", {
            priority: 10,
            conditions: [
                elbv2.ListenerCondition.pathPatterns([
                    "/api/*"
                ])
            ],
            targetGroups: [apiTargetGroup]
        });

        // Add WORKER path-based routing
        httpListener.addTargetGroups("WorkerHealthCheckPathRule", {
            priority: 2,
            conditions: [
                elbv2.ListenerCondition.pathPatterns([
                    "/health"
                ])
            ],
            targetGroups: [workerTargetGroup]
        });



        // ALB Outputs
        new cdk.CfnOutput(this, "AlbDNSName", {
            value: this.loadBalancer.loadBalancerDnsName,
            description: "AskTheSite Application Load Balancer DNS name"
        });

        new cdk.CfnOutput(this, "AlbArn", {
            value: this.loadBalancer.loadBalancerArn,
            description: "AskTheSite Application Load Balancer Arn"
        });
    };
} 