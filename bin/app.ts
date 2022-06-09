#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecurityStack } from '../lib/network/security-stack';
import { InternalELBStack } from '../lib/elb/internal-elb-stack';
import { ExternalELBStack } from '../lib/elb/external-elb-stack';
import { ECSStack } from '../lib/ecs/ecs-stack';
import { DNSStack } from '../lib/dns/dns-stack';
import { validateEnvironmentVariables } from '../utils/validations';
import * as helpers from '../utils/helpers';

const result = require('dotenv').config({
  path: './.env',
  override: false
})
if (result.error) {
  throw "Cannot locate .env file. Either create it manually or run `cp sample.env .env` in project's directory";
}

validateEnvironmentVariables();

const app = new cdk.App();

const props = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
};

const slsDebuggerStack = new cdk.Stack(
  app,
  `sls-debugger-main-stack`,
  props
);

const securityStack = new SecurityStack(slsDebuggerStack, 'sls-debugger-security-stack')

const internalELBStack = new InternalELBStack(slsDebuggerStack, 'sls-debugger-internal-elb-stack', {
  selectedVPC: securityStack.selectedVPC,
  selectedSubnets: securityStack.selectedSubnets,
  brokerELBSecGroup: securityStack.slsDebuggerBrokerELBSecGroup
})
internalELBStack.addDependency(
  securityStack,
  'We need the selected VPC and Subnets, as well as the created security groups.'
)

const externalELBStack = new ExternalELBStack(slsDebuggerStack, 'sls-debugger-external-elb-stack', {
  selectedVPC: securityStack.selectedVPC,
  selectedSubnets: securityStack.selectedSubnets,
  brokerELBSecGroup: securityStack.slsDebuggerBrokerELBSecGroup
})
externalELBStack.addDependency(
  securityStack,
  'We need the selected VPC and Subnets, as well as the created security groups.'
)

const ecsStack = new ECSStack(slsDebuggerStack, 'sls-debugger-ecs-stack', {
  selectedVPC: securityStack.selectedVPC,
  selectedSubnets: securityStack.selectedSubnets,
  brokerECSSecGroup: securityStack.slsDebuggerBrokerECSSecGroup,
  brokerExecutionRole: securityStack.slsDebuggerBrokerExecRole,
  brokerTaskRole: securityStack.slsDebuggerBrokerTaskRole,
  targetGroups: {
    internalELBClientTargetGroup: internalELBStack.slsDebuggerBrokerInternalELBClientTargetGroup,
    externalELBClientTargetGroup: externalELBStack.slsDebuggerBrokerExternalELBClientTargetGroup,
    internalELBApplicationTargetGroup: internalELBStack.slsDebuggerBrokerInternalELBApplicationTargetGroup,
    externalELBApplicationTargetGroup: externalELBStack.slsDebuggerBrokerExternalELBApplicationTargetGroup
  },
  listeners: {
    internalELBClientListener: internalELBStack.slsDebuggerBrokerInternalELBClientListener,
    externalELBClientListener: externalELBStack.slsDebuggerBrokerExternalELBClientListener,
    internalELBApplicationListener: internalELBStack.slsDebuggerBrokerInternalELBApplicationListener,
    externalELBApplicationListener: externalELBStack.slsDebuggerBrokerExternalELBApplicationListener
  }
})
ecsStack.addDependency(
  securityStack,
  'We need the selected VPC and Subnets, as well as the created security groups.'
)
ecsStack.addDependency(
  internalELBStack,
  'We need the ELB Target Groups and Listeners for our service.'
)
ecsStack.addDependency(
  externalELBStack,
  'We need the ELB Target Groups and Listeners for our service.'
)

let internalELBDNS;
let externalELBDNS;
if (helpers.stringToBoolean(process.env.CREATE_DNS_MAPPING)) {
  const dnsStack = new DNSStack(slsDebuggerStack, 'sls-debugger-dns-stack', {
    internalELB: internalELBStack.slsDebuggerBrokerInternalELB,
    externalELB: externalELBStack.slsDebuggerBrokerExternalELB
  })
  dnsStack.addDependency(
    internalELBStack,
    'We need the ELBs as a target for our DNS records.'
  )
  dnsStack.addDependency(
    externalELBStack,
    'We need the ELBs as a target for our DNS records.'
  )

  internalELBDNS = `${helpers.getProtocol()}${dnsStack.slsDebuggerBrokerInternalELBDNSRecordName}`
  externalELBDNS = `${helpers.getProtocol()}${dnsStack.slsDebuggerBrokerExternalELBDNSRecordName}`
} else {
  internalELBDNS = `${helpers.getProtocol(true)}${internalELBStack.slsDebuggerBrokerInternalELB.loadBalancerDnsName}`
  externalELBDNS = `${helpers.getProtocol(true)}${externalELBStack.slsDebuggerBrokerExternalELB.loadBalancerDnsName}`
}

new cdk.CfnOutput(
  slsDebuggerStack,
  `${helpers.ENTITY_PREFIX}broker-internal-url${helpers.STAGE}`,
  {

    description: `Set this value as \`thundra_agent_lambda_debugger_broker_host\` in your lambda
                  to use the internal load balancer for communication.

                  You can also set this as the broker host in Thundra debug client configuration
                  if you want to use the internal endpoint. Beware that you would need to connect
                  to your VPC in order to access this endpoint.`,
    value: internalELBDNS
  }
)

new cdk.CfnOutput(
  slsDebuggerStack,
  `${helpers.ENTITY_PREFIX}broker-external-url${helpers.STAGE}`,
  {
    description: `Set this value as \`thundra_agent_lambda_debugger_broker_host\` in your lambda
                  to use the external load balancer for communication. Beware that your lambda
                  should have access to the internet.

                  You can also set this as the broker host in Thundra debug client configuration
                  if you want to use the external endpoint.`,
    value: externalELBDNS
  }
)

new cdk.CfnOutput(
  slsDebuggerStack,
  `${helpers.ENTITY_PREFIX}broker-port${helpers.STAGE}`,
  {
    description: 'Set this as the broker port in Thundra debug client configuration.',
    value: helpers.getPort()
  }
)
