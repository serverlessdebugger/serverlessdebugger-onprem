import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

// --------------------------------------------------------------------------------
//
// Constants
//
export const ENTITY_TAG_KEY: string = 'PRODUCT'
export const ENTITY_TAG_VALUE: string = 'SERVERLESS_DEBUGGER'

// Since some of the entities have a hard cap of str length 32,
// it's up to you what to set here. If you don't want any prefix,
// use empty string. This can be set in .env file.
//
// It will be added to the beginning of the names.
//
// NOTE: Suffix with a dash, so that entity names are more readable.
export const ENTITY_PREFIX: string = (process.env.ENTITY_PREFIX || 'slsd') + '-'

// This can be set in .env file. However, if you don't want
// stage suffix, you can set this to an empty string.
//
// It will be added to the end of the names.
//
// NOTE: Prefix with a dash, so that entity names are more readable.
export const STAGE: string = '-' + (process.env.STAGE || 'dev')

// Targets the Thundra's repository to fetch the broker's image.
export const ECR_IMAGE_URI: string = 'public.ecr.aws/i9q5q2b9/thundra-self-hosted-lambda-debug-broker:latest'

export const BROKER_CONTAINER_NAME: string = (process.env.BROKER_CONTAINER_NAME || 'sls-debugger-broker-container')

// --------------------------------------------------------------------------------
//
// Methods
//
export const getSubnets: Function = (scope: Construct): ec2.ISubnet[] => {
    const subnets: ec2.ISubnet[] = [];
    const subnetIds = (process.env.SUBNET_IDS || '').split(',');

    subnetIds.forEach(subnetId => {
        subnets.push(
            ec2.Subnet.fromSubnetId(
                scope,
                subnetId.trim(),
                subnetId.trim(),
            )
        )
    });

    return subnets;
}

export const getPort: Function = (): Number => {
    let port: Number;

    if (stringToBoolean(process.env.USE_HTTPS)) {
        port = 443;
    } else {
        port = 80;
    }

    return port;
}

export const getProtocol: Function = (returnWS: Boolean = false): string => {
    let protocol: string;

    if (returnWS) {
        if (stringToBoolean(process.env.USE_HTTPS)) {
            protocol = 'wss://'
        } else {
            protocol = 'ws://'
        }
    } else {
        if (stringToBoolean(process.env.USE_HTTPS)) {
            protocol = elb.Protocol.HTTPS
        } else {
            protocol = elb.Protocol.HTTP
        }
    }

    return protocol;
}

export const getCertificateArn: Function = (): string | undefined => {
    let certificateArn: string | undefined = undefined;

    if (stringToBoolean(process.env.USE_HTTPS)) {
        certificateArn = process.env.SSL_CERTIFICATE_ARN
    }

    return certificateArn;
}

export const stringToBoolean: Function = (input: string): Boolean => {
    const trueValues = ['y', 'yes', 't', 'true', 'on', '1'];
    const falseValues = ['n', 'no', 'f', 'false', 'off', '0'];
    const value = input.toLowerCase();

    if (trueValues.indexOf(value) !== -1) {
        return true
    } else if (falseValues.indexOf(value) !== -1) {
        return false
    } else {
        throw new Error(`Invalid truth value ${input}`);
    }
}
