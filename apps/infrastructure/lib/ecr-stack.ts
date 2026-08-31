import * as cdk from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";

export class EcrStack extends cdk.Stack {
    public readonly apiRepository: ecr.Repository;
    public readonly webRepository: ecr.Repository;
    public readonly workerRepository: ecr.Repository;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.apiRepository = new ecr.Repository(this, "ApiRepository", {
            repositoryName: "askthesite-api",
            imageScanOnPush: true,
            imageTagMutability: ecr.TagMutability.IMMUTABLE,

            lifecycleRules: [
                {
                    maxImageCount: 10
                }
            ],
            removalPolicy: cdk.RemovalPolicy.RETAIN
        });

        this.webRepository = new ecr.Repository(this, "WebRepository", {
            repositoryName: "askthesite-web",
            imageScanOnPush: true,
            imageTagMutability: ecr.TagMutability.IMMUTABLE,

            lifecycleRules: [
                {
                    maxImageCount: 10,
                }
            ],
            removalPolicy: cdk.RemovalPolicy.RETAIN
        });

        this.workerRepository = new ecr.Repository(this, "WorkerRepository", {
            repositoryName: "askthesite-worker",
            imageScanOnPush: true,
            imageTagMutability: ecr.TagMutability.IMMUTABLE,

            lifecycleRules: [
                {
                    maxImageCount: 10,
                }
            ],
            removalPolicy: cdk.RemovalPolicy.RETAIN
        });

        // Output

        new cdk.CfnOutput(this, "ApiRepository", {
            value: this.apiRepository.repositoryUri,
            description: "ECR repository URI for the API service"
        });

        new cdk.CfnOutput(this, "WebRepository", {
            value: this.webRepository.repositoryUri,
            description: "ECR repository URI for the WEB service"
        });

        new cdk.CfnOutput(this, "WorkerRepository", {
            value: this.workerRepository.repositoryUri,
            description: "ECR repository URI for the WORKER service"
        });
    }
}