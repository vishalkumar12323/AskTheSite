#!/usr/bin/env node

import * as cdk from "aws-cdk-lib";
import { NetworkStack } from "../lib/network-stack";

const app = new cdk.App();

const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
};

new NetworkStack(app, "AskTheSite-NetworkStack", {
    stackName: "AskTheSite-NetworkStack",
    env,
    description: "Network infrastructure for AskTheSite"
});