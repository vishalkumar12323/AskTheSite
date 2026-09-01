#!/usr/bin/env node

import * as cdk from "aws-cdk-lib";
import { NetworkStack } from "../lib/network-stack";
import { DatabaseStack } from "../lib/database-stack";
import { CacheStack } from "../lib/cache-stack";
import { EcrStack } from "../lib/ecr-stack"

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
 Database Stack
======================
*/

const databaseStack = new DatabaseStack(app, "AskTheSite-DatabaseStack", {
    env,
    stackName: "AskTheSite-DatabaseStack",
    description: "PostgreSQL Database infrastructure for AskTheSite",
    vpc: networkStack.vpc
});

databaseStack.addStackDependency(networkStack);


/* 
======================
 ElastiCache Stack
======================
*/

const cacheStack = new CacheStack(app, "AskTheSite-CacheStack", {
    env,
    vpc: networkStack.vpc,
    stackName: "AskTheSite-CacheStack",
    description: "ElastiCache infrastructure for AskTheSite"
});

cacheStack.addStackDependency(networkStack);


/* 
======================
 ECR Stack
======================
*/

new EcrStack(app, "AskTheSite-EcrStack", {
    env
});