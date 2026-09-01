import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";

interface EcsStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
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