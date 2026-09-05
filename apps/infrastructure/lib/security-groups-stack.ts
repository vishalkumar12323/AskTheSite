import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

interface SecurityGroupsStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
}

/**
 * Owns ALL security groups for the AskTheSite application.
 *
 * Keeping every SG in a single stack means every inter-SG ingress/egress rule
 * is a same-stack reference – no cross-stack CloudFormation Fn::GetAtt /
 * Fn::ImportValue is generated, so CDK never records a dependency that would
 * create a cycle with DatabaseStack or EcsStack.
 */
export class SecurityGroupsStack extends cdk.Stack {
    // Consumed by DatabaseStack
    public readonly databaseSecurityGroup: ec2.SecurityGroup;

    // Consumed by CacheStack
    public readonly elastiCacheSecurityGroup: ec2.SecurityGroup;

    // Consumed by EcsStack
    public readonly ecsSecurityGroup: ec2.SecurityGroup;
    public readonly albSecurityGroup: ec2.SecurityGroup;

    constructor(scope: Construct, id: string, props: SecurityGroupsStackProps) {
        super(scope, id, props);

        // ── ALB ──────────────────────────────────────────────────────────────
        this.albSecurityGroup = new ec2.SecurityGroup(this, "AlbSecurityGroup", {
            vpc: props.vpc,
            securityGroupName: "askthsite-alb-sg",
            description: "Security group for AskTheSite Application Load Balancer",
            allowAllOutbound: true,
        });
        this.albSecurityGroup.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic from the internet"
        );

        // ── ECS ───────────────────────────────────────────────────────────────
        this.ecsSecurityGroup = new ec2.SecurityGroup(this, "EcsSecurityGroup", {
            vpc: props.vpc,
            securityGroupName: "askthesite-ecs-sg",
            description: "Security Group for the AskTheSite ECS tasks",
            allowAllOutbound: true,
        });
        // ALB → ECS (web container)
        this.ecsSecurityGroup.addIngressRule(
            this.albSecurityGroup,
            ec2.Port.tcp(3000),
            "Allow ALB to reach Web container"
        );
        // ALB → ECS (API container)
        this.ecsSecurityGroup.addIngressRule(
            this.albSecurityGroup,
            ec2.Port.tcp(3001),
            "Allow ALB to reach API container"
        );

        // ── Database ──────────────────────────────────────────────────────────
        this.databaseSecurityGroup = new ec2.SecurityGroup(this, "DatabaseSecurityGroup", {
            vpc: props.vpc,
            description: "Security group for AskTheSite PostgreSQL database",
            allowAllOutbound: true,
        });
        // ECS → PostgreSQL
        this.databaseSecurityGroup.addIngressRule(
            this.ecsSecurityGroup,
            ec2.Port.tcp(5432),
            "Allow ECS to access PostgreSQL"
        );

        // ── ElastiCache ───────────────────────────────────────────────────────
        this.elastiCacheSecurityGroup = new ec2.SecurityGroup(this, "CacheSecurityGroup", {
            vpc: props.vpc,
            description: "Security group for AskTheSite ElastiCache",
            allowAllOutbound: true,
        });
        // ECS → Valkey / Redis
        this.elastiCacheSecurityGroup.addIngressRule(
            this.ecsSecurityGroup,
            ec2.Port.tcp(6379),
            "Allow ECS to access Valkey"
        );

        // ── Outputs ───────────────────────────────────────────────────────────
        new cdk.CfnOutput(this, "EcsSecurityGroupId", {
            value: this.ecsSecurityGroup.securityGroupId,
            description: "ECS security group ID",
        });
        new cdk.CfnOutput(this, "AlbSecurityGroupId", {
            value: this.albSecurityGroup.securityGroupId,
            description: "ALB security group ID",
        });
        new cdk.CfnOutput(this, "DatabaseSecurityGroupId", {
            value: this.databaseSecurityGroup.securityGroupId,
            description: "PostgreSQL security group ID",
        });
        new cdk.CfnOutput(this, "CacheSecurityGroupId", {
            value: this.elastiCacheSecurityGroup.securityGroupId,
            description: "ElastiCache security group ID",
        });
    }
}
