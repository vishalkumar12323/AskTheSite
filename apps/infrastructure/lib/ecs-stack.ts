import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as logs from "aws-cdk-lib/aws-logs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

interface EcsStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;

    apiRepository: ecr.Repository;
    webRepository: ecr.Repository;
    workerRepository: ecr.Repository;

    /** Pre-created SGs from SecurityGroupsStack – avoids cross-stack SG cycles. */
    ecsSecurityGroup: ec2.SecurityGroup;
    albSecurityGroup: ec2.SecurityGroup;

    googleAIApiKeySecret: secretsmanager.ISecret;

    databaseSecret: secretsmanager.ISecret;

    cacheEndpoint: string;
    cachePort: string;
}

export class EcsStack extends cdk.Stack {
    public readonly cluster: ecs.Cluster;

    public readonly executionRole: iam.Role;
    public readonly taskRole: iam.Role;

    public readonly ecsSecurityGroup: ec2.SecurityGroup;
    public readonly albSecurityGroup: ec2.SecurityGroup;

    public readonly apiTaskDefinition: ecs.FargateTaskDefinition;
    public readonly webTaskDefinition: ecs.FargateTaskDefinition;
    public readonly workerTaskDefinition: ecs.FargateTaskDefinition;


    constructor(scope: Construct, id: string, props: EcsStackProps) {
        super(scope, id, props);

        this.cluster = new ecs.Cluster(this, "AskTheSiteCluster", {
            vpc: props.vpc,
            clusterName: "askthesite-cluster",
        });

        this.executionRole = new iam.Role(this, "EcsTaskExecutionRole", {
            roleName: "ask-the-site-ecs-execution-role",
            assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),

            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
            ]
        });

        this.taskRole = new iam.Role(this, "EcsTaskRole", {
            roleName: "askthesite-ecs-task-role",
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
        });

        // Security Groups are created in SecurityGroupsStack to prevent
        // cross-stack SG reference cycles. All ingress rules between SGs
        // are also configured there.
        this.ecsSecurityGroup = props.ecsSecurityGroup;
        this.albSecurityGroup = props.albSecurityGroup;


        // ----------------------------------------------------------------
        // Configuration for API Service
        // API LogGroup
        const apiLogGroup = new logs.LogGroup(this, "ApiLogGroup", {
            logGroupName: "/ecs/askthesite/api",
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        // API Task Definition
        this.apiTaskDefinition = new ecs.FargateTaskDefinition(this, "ApiTaskDefinition", {
            family: "askthesite-api",
            cpu: 256,
            memoryLimitMiB: 512,

            executionRole: this.executionRole,
            taskRole: this.taskRole,
        });

        this.apiTaskDefinition.addContainer("ApiContainer", {
            image: ecs.ContainerImage.fromEcrRepository(props.apiRepository, "v1"),
            logging: ecs.LogDrivers.awsLogs({
                streamPrefix: "api",
                logGroup: apiLogGroup
            }),
            environment: {
                NODE_ENV: "production",
                PORT: "3001",
                REDIS_URL: `redis://:${props.cacheEndpoint}:${props.cachePort}`
            },
            secrets: {
                DB_HOST: ecs.Secret.fromSecretsManager(
                    props.databaseSecret,
                    "host"
                ),
                DB_PORT: ecs.Secret.fromSecretsManager(
                    props.databaseSecret,
                    "port"
                ),
                DB_USER: ecs.Secret.fromSecretsManager(
                    props.databaseSecret,
                    "username"
                ),
                DB_PASSWORD: ecs.Secret.fromSecretsManager(
                    props.databaseSecret,
                    "password"
                ),
                DB_NAME: ecs.Secret.fromSecretsManager(
                    props.databaseSecret,
                    "dbname"
                ),
            }
        }).addPortMappings({
            containerPort: 3001,
            protocol: ecs.Protocol.TCP
        });

        // API Service
        const apiService = new ecs.FargateService(this, "ApiService", {
            serviceName: "askthesite-api-service",
            cluster: this.cluster,
            taskDefinition: this.apiTaskDefinition,

            desiredCount: 1,
            assignPublicIp: false,

            securityGroups: [
                this.ecsSecurityGroup
            ],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
            },

            platformVersion: ecs.FargatePlatformVersion.LATEST
        });



        // ----------------------------------------------------------------
        // Configuration for WEB Service
        // WEB LogGroup
        const webLogGroup = new logs.LogGroup(this, "WebLogGroup", {
            logGroupName: "/ecs/askthesite/web",
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        // WebTaskDefinition
        this.webTaskDefinition = new ecs.FargateTaskDefinition(this, "WebTaskDefinition", {
            family: "askthesite-web",
            cpu: 256,
            memoryLimitMiB: 512,

            executionRole: this.executionRole,
            taskRole: this.taskRole
        });

        this.webTaskDefinition.addContainer("WebContainer", {
            image: ecs.ContainerImage.fromEcrRepository(props.webRepository, "v1"),
            logging: ecs.LogDrivers.awsLogs({
                streamPrefix: "web",
                logGroup: webLogGroup
            }),
            environment: {
                NODE_ENV: "production",
                PORT: "3000"
            }
        }).addPortMappings({
            containerPort: 3000,
            protocol: ecs.Protocol.TCP
        });

        // WEB Service
        const webService = new ecs.FargateService(this, "WebService", {
            serviceName: "askthesite-web-service",
            cluster: this.cluster,
            taskDefinition: this.webTaskDefinition,

            desiredCount: 1,
            assignPublicIp: false,

            securityGroups: [
                this.ecsSecurityGroup
            ],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
            },

            platformVersion: ecs.FargatePlatformVersion.LATEST
        });


        // ----------------------------------------------------------------
        // Configuration for WORKER Service
        // WORKER LogGroup
        const workerLogGroup = new logs.LogGroup(this, "WorkerLogGroup", {
            logGroupName: "/ecs/askthesite/worker",
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        // WorkerTaskDefinition
        this.workerTaskDefinition = new ecs.FargateTaskDefinition(this, "WorkerTaskDefinition", {
            family: "askthesite-worker",
            cpu: 256,
            memoryLimitMiB: 512,

            executionRole: this.executionRole,
            taskRole: this.taskRole
        });

        this.workerTaskDefinition.addContainer("WorkerContainer", {
            image: ecs.ContainerImage.fromEcrRepository(props.workerRepository, "v1"),
            logging: ecs.LogDrivers.awsLogs({
                streamPrefix: "worker",
                logGroup: workerLogGroup
            }),
            environment: {
                NODE_ENV: "production",
                REDIS_URL: `redis://${props.cacheEndpoint}:${props.cachePort}`
            },
            secrets: {
                GEMINI_API_KEY: ecs.Secret.fromSecretsManager(
                    props.googleAIApiKeySecret
                )
            }
        });

        // WORKER Service
        const workerService = new ecs.FargateService(this, "WorkerService", {
            serviceName: "askthesite-worker-service",
            cluster: this.cluster,
            taskDefinition: this.workerTaskDefinition,

            desiredCount: 1,
            assignPublicIp: false,

            securityGroups: [
                this.ecsSecurityGroup
            ],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
            },

            platformVersion: ecs.FargatePlatformVersion.LATEST
        });



        // Outputs
        new cdk.CfnOutput(this, "ClusterName", {
            value: this.cluster.clusterName,
            description: "AskTheSite ECS Cluster name"
        });

        new cdk.CfnOutput(this, "ClusterArn", {
            value: this.cluster.clusterArn,
            description: "AskTheSite ECS Cluster arn"
        });

        new cdk.CfnOutput(this, 'ExecutionRoleArn', {
            value: this.executionRole.roleArn,
        });

        new cdk.CfnOutput(this, 'TaskRoleArn', {
            value: this.taskRole.roleArn,
        });

        new cdk.CfnOutput(this, "ApiServiceName", {
            value: apiService.serviceName,
            description: "AskTheSite API ECS service"
        });

        new cdk.CfnOutput(this, "WebServiceName", {
            value: webService.serviceName,
            description: "AskTheSite Web ECS service"
        });

        new cdk.CfnOutput(this, "WorkerServiceName", {
            value: workerService.serviceName,
            description: "AskTheSite Worker ECS service"
        });
    }
};