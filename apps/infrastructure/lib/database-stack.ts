import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

interface DatabaseStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
    /** Pre-created SG from SecurityGroupsStack – avoids cross-stack SG cycles. */
    databaseSecurityGroup: ec2.SecurityGroup;
}

export class DatabaseStack extends cdk.Stack {
    public readonly database: rds.DatabaseInstance;
    public readonly databaseSecurityGroup: ec2.SecurityGroup;

    public readonly databaseSecret: secretsmanager.ISecret;


    constructor(scope: Construct, id: string, props: DatabaseStackProps) {
        super(scope, id, props);

        // Security Group is created in SecurityGroupsStack to prevent
        // cross-stack SG reference cycles.
        this.databaseSecurityGroup = props.databaseSecurityGroup;

        this.database = new rds.DatabaseInstance(this, "PostgresDatabase", {
            vpc: props.vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
            },

            engine: rds.DatabaseInstanceEngine.postgres({
                version: rds.PostgresEngineVersion.VER_17
            }),

            instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),

            allocatedStorage: 20,
            maxAllocatedStorage: 100,

            databaseName: "askthesite",

            credentials: rds.Credentials.fromGeneratedSecret('postgres'),

            securityGroups: [this.databaseSecurityGroup],

            multiAz: false,
            publiclyAccessible: false,
            backupRetention: cdk.Duration.days(0), // Free Tier: automated backups must be disabled (max = 0)

            deletionProtection: false,
            removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
            storageEncrypted: false // Free Tier: storage encryption is not supported
        });

        this.databaseSecret = this.database.secret!


        // Outputs
        new cdk.CfnOutput(this, 'DatabaseEndpoint', {
            value: this.database.instanceEndpoint.hostname,
            description: 'PostgreSQL database endpoint',
        });

        new cdk.CfnOutput(this, 'DatabasePort', {
            value: this.database.instanceEndpoint.port.toString(),
            description: 'PostgreSQL database port',
        });

        new cdk.CfnOutput(this, 'DatabaseSecretName', {
            value: this.database.secret!.secretName,
            description: 'Secrets Manager secret containing database credentials',
        });
    }
}