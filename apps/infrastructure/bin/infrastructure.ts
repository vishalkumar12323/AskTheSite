#!/usr/bin/env node

import * as cdk from "aws-cdk-lib";
import { NetworkStack } from "../lib/network-stack";
import { SecurityGroupsStack } from "../lib/security-groups-stack";
import { DatabaseStack } from "../lib/database-stack";
import { CacheStack } from "../lib/cache-stack";
import { EcrStack } from "../lib/ecr-stack";
import { EcsStack } from "../lib/ecs-stack";
import { SecretStack } from "../lib/secrets-stack";

const app = new cdk.App();

const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
};

/* 
======================
 Network Stack
======================
*/
const networkStack = new NetworkStack(app, "AskTheSite-NetworkStack", {
    stackName: "AskTheSite-NetworkStack",
    env,
    description: "Network infrastructure for AskTheSite"
});


/* 
======================
 SECRET manager Stack
======================
*/
const secretsStack = new SecretStack(app, "AskTheSite-SecretsStack", {
    env,
    stackName: "AskTheSite-SecretsStack",
    description: "Secret Manager resources for AskTheSite"
});


/* 
======================
 Security Groups Stack
======================
 All security groups live here so that inter-SG ingress rules are
 same-stack references. This prevents the cross-stack dependency cycle
 that would otherwise arise between DatabaseStack and EcsStack.
*/
const securityGroupsStack = new SecurityGroupsStack(app, "AskTheSite-SecurityGroupsStack", {
    env,
    vpc: networkStack.vpc,
    stackName: "AskTheSite-SecurityGroupsStack",
    description: "Security Groups for AskTheSite (DB, Cache, ECS, ALB)"
});

securityGroupsStack.addStackDependency(networkStack);


/* 
======================
 Database Stack
======================
*/

const databaseStack = new DatabaseStack(app, "AskTheSite-DatabaseStack", {
    env,
    stackName: "AskTheSite-DatabaseStack",
    description: "PostgreSQL Database infrastructure for AskTheSite",
    vpc: networkStack.vpc,
    databaseSecurityGroup: securityGroupsStack.databaseSecurityGroup,
});

databaseStack.addStackDependency(networkStack);
databaseStack.addStackDependency(securityGroupsStack);


/* 
======================
 ElastiCache Stack
======================
*/

const cacheStack = new CacheStack(app, "AskTheSite-CacheStack", {
    env,
    vpc: networkStack.vpc,
    elastiCacheSecurityGroup: securityGroupsStack.elastiCacheSecurityGroup,
    stackName: "AskTheSite-CacheStack",
    description: "ElastiCache infrastructure for AskTheSite"
});

cacheStack.addStackDependency(networkStack);
cacheStack.addStackDependency(securityGroupsStack);


/* 
======================
 ECR Stack
======================
*/

const ecrStack = new EcrStack(app, "AskTheSite-EcrStack", {
    env
});


/* 
======================
 ECS Stack
======================
*/
const ecsStack = new EcsStack(app, "AskTheSite-EcsStack", {
    env,
    vpc: networkStack.vpc,

    apiRepository: ecrStack.apiRepository,
    webRepository: ecrStack.webRepository,
    workerRepository: ecrStack.workerRepository,

    // SGs come from SecurityGroupsStack – no reference to Database/Cache stacks for SGs
    ecsSecurityGroup: securityGroupsStack.ecsSecurityGroup,
    albSecurityGroup: securityGroupsStack.albSecurityGroup,

    googleAIApiKeySecret: secretsStack.googleAIApiKeySecret,
    databaseSecret: databaseStack.databaseSecret,   // EcsStack → DatabaseStack (one-way, no cycle)

    cacheEndpoint: cacheStack.cacheEndpoint,
    cachePort: cacheStack.cachePort,
});

ecsStack.addStackDependency(networkStack);
ecsStack.addStackDependency(secretsStack);
ecsStack.addStackDependency(securityGroupsStack);
ecsStack.addStackDependency(databaseStack);
ecsStack.addStackDependency(cacheStack);
