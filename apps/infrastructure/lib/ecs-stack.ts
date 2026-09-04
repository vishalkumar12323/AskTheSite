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

    databaseSecurityGroup: ec2.SecurityGroup;
    elastiCacheSecurityGroup: ec2.SecurityGroup;
}

export class EcsStack extends cdk.Stack {
    public readonly cluster: ecs.Cluster;

    public readonly executionRole: iam.Role;
    public readonly taskRole: iam.Role;

    public readonly ecsSecurityGroup: ec2.SecurityGroup;
    public readonly albSecurityGroup: ec2.SecurityGroup;


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

        // Security Group for ECS Task.
        this.ecsSecurityGroup = new ec2.SecurityGroup(this, "EcsSecurityGroup", {
            vpc: props.vpc,
            securityGroupName: "askthesite-ecs-sg",
            description: "Security Group for the AskThesite ECS task",
            allowAllOutbound: true
        });

        // Security Group for ALB
        this.albSecurityGroup = new ec2.SecurityGroup(this, "AlbSecurityGroup", {
            vpc: props.vpc,
            securityGroupName: "askthsite-alb-sg",
            description: "Security group for AskTheSite Application Load Balancer",
            allowAllOutbound: true
        });
        this.albSecurityGroup.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(80),
            "Allow Http traffic from the internet"
        );


        // Allow ALB SG -> ECS Web Container
        this.ecsSecurityGroup.addIngressRule(
            this.albSecurityGroup,
            ec2.Port.tcp(3000),
            "Allow ALB to reach Web container"
        );

        // Allow ALB SG -> ECS API Container
        this.ecsSecurityGroup.addIngressRule(
            this.albSecurityGroup,
            ec2.Port.tcp(3001),
            "Allow ALB to reach API container"
        );


        props.databaseSecurityGroup.addIngressRule(
            this.ecsSecurityGroup,
            ec2.Port.tcp(5432),
            "Allow ECS to Access PostgreSQL"
        );

        props.elastiCacheSecurityGroup.addIngressRule(
            this.ecsSecurityGroup,
            ec2.Port.tcp(6379),
            "Allow ECS to access Valkey"
        );

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