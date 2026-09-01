import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as logs from "aws-cdk-lib/aws-logs";

interface EcsStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;

    apiRepository: ecr.Repository;
    webRepository: ecr.Repository;
    workerRepository: ecr.Repository;
}

export class EcsStack extends cdk.Stack {
    public readonly cluster: ecs.Cluster;

    public readonly executionRole: iam.Role;
    public readonly taskRole: iam.Role;

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

        // API LogGroup
        const apiLogGroup = new logs.LogGroup(this, "ApiLogGroup", {
            logGroupName: "/ecs/askthesite/api",
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        // API Task Definition
        const apiTaskDefinition = new ecs.FargateTaskDefinition(this, "ApiTaskDefinition", {
            family: "askthesite-api",
            cpu: 256,
            memoryLimitMiB: 512,

            executionRole: this.executionRole,
            taskRole: this.taskRole
        });

        apiTaskDefinition.addContainer("ApiContainer", {
            image: ecs.ContainerImage.fromEcrRepository(props.apiRepository, "v1"),
            logging: ecs.LogDrivers.awsLogs({
                streamPrefix: "api",
                logGroup: apiLogGroup
            }),
            environment: {
                NODE_ENV: "production",
                PORT: "3001"
            }
        }).addPortMappings({
            containerPort: 3001,
            protocol: ecs.Protocol.TCP
        });


        // WEB LogGroup
        const webLogGroup = new logs.LogGroup(this, "WebLogGroup", {
            logGroupName: "/ecs/askthesite/web",
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        // WebTaskDefinition
        const webTaskDefinition = new ecs.FargateTaskDefinition(this, "WebTaskDefinition", {
            family: "askthesite-web",
            cpu: 256,
            memoryLimitMiB: 512,

            executionRole: this.executionRole,
            taskRole: this.taskRole
        });

        webTaskDefinition.addContainer("WebContainer", {
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


        // WORKER LogGroup
        const workerLogGroup = new logs.LogGroup(this, "WorkerLogGroup", {
            logGroupName: "/ecs/askthesite/worker",
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        // WorkerTaskDefinition
        const workerTaskDefinition = new ecs.FargateTaskDefinition(this, "WorkerTaskDefinition", {
            family: "askthesite-worker",
            cpu: 256,
            memoryLimitMiB: 512,

            executionRole: this.executionRole,
            taskRole: this.taskRole
        });

        workerTaskDefinition.addContainer("WorkerContainer", {
            image: ecs.ContainerImage.fromEcrRepository(props.workerRepository, "v1"),
            logging: ecs.LogDrivers.awsLogs({
                streamPrefix: "worker",
                logGroup: workerLogGroup
            }),
            environment: {
                NODE_ENV: "production",
            }
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
    }
};