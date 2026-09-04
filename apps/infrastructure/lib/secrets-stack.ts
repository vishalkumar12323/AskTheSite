import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export class SecretStack extends cdk.Stack {
    public readonly googleAIApiKeySecret: secretsmanager.Secret;

    constructor(scope: Construct, id: string, props: cdk.StackProps) {
        super(scope, id, props);

        this.googleAIApiKeySecret = new secretsmanager.Secret(this, "GoogleAIApiKeySecret", {
            secretName: "google-ai-api-key",
            description: "Google AI Api key for AskTheSite worker"
        });


        new cdk.CfnOutput(this, "GoogleAIApiSecretName", {
            value: this.googleAIApiKeySecret.secretName,
            description: "Google AI Api secret name"
        });
    };
};