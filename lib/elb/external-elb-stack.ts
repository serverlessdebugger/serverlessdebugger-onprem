import { Duration, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as helpers from '../../utils/helpers';

interface ExternalELBStackProps extends NestedStackProps {
    readonly selectedVPC: ec2.IVpc,
    readonly selectedSubnets: ec2.ISubnet[];
    readonly brokerELBSecGroup: ec2.ISecurityGroup
}

export class ExternalELBStack extends NestedStack {
    selectedVPC: ec2.IVpc;
    selectedSubnets: ec2.ISubnet[];

    slsDebuggerBrokerExternalELBName: string;
    slsDebuggerBrokerExternalELB: elb.IApplicationLoadBalancer;

    slsDebuggerBrokerELBSecGroup: ec2.ISecurityGroup;

    slsDebuggerBrokerExternalELBApplicationTargetGroupName: string;
    slsDebuggerBrokerExternalELBApplicationTargetGroup: elb.IApplicationTargetGroup;
    slsDebuggerBrokerExternalELBApplicationListenerName: string;
    slsDebuggerBrokerExternalELBApplicationListener: elb.IApplicationListener;

    slsDebuggerBrokerExternalELBClientTargetGroupName: string;
    slsDebuggerBrokerExternalELBClientTargetGroup: elb.IApplicationTargetGroup;
    slsDebuggerBrokerExternalELBClientListenerName: string;
    slsDebuggerBrokerExternalELBClientListener: elb.IApplicationListener;

    constructor(scope: Construct, id: string, props: ExternalELBStackProps) {
        super(scope, id, props);

        this.selectedVPC = props.selectedVPC;
        this.selectedSubnets = props.selectedSubnets;
        this.slsDebuggerBrokerELBSecGroup = props.brokerELBSecGroup;

        // --------------------------------------------------------------------------------
        //
        // ELB Target Groups
        //
        this.slsDebuggerBrokerExternalELBApplicationTargetGroupName = `${helpers.ENTITY_PREFIX}external-elb-application-target-group${helpers.STAGE}`
        this.slsDebuggerBrokerExternalELBApplicationTargetGroup = new elb.ApplicationTargetGroup(
            this,
            this.slsDebuggerBrokerExternalELBApplicationTargetGroupName,
            {
                targetGroupName: this.slsDebuggerBrokerExternalELBApplicationTargetGroupName,
                healthCheck: {
                    enabled: true,
                    interval: Duration.seconds(30),
                    path: '/ping',
                    port: '4444',
                    protocol: elb.Protocol.HTTP
                },
                port: 4444,
                protocol: elb.ApplicationProtocol.HTTP,
                targetType: elb.TargetType.IP,
                vpc: this.selectedVPC
            }
        )

        this.slsDebuggerBrokerExternalELBClientTargetGroupName = `${helpers.ENTITY_PREFIX}external-elb-client-target-group${helpers.STAGE}`
        this.slsDebuggerBrokerExternalELBClientTargetGroup = new elb.ApplicationTargetGroup(
            this,
            this.slsDebuggerBrokerExternalELBClientTargetGroupName,
            {
                targetGroupName: this.slsDebuggerBrokerExternalELBClientTargetGroupName,
                healthCheck: {
                    enabled: true,
                    interval: Duration.seconds(30),
                    path: '/ping',
                    port: '5555',
                    protocol: elb.Protocol.HTTP
                },
                port: 5555,
                protocol: elb.ApplicationProtocol.HTTP,
                targetType: elb.TargetType.IP,
                vpc: this.selectedVPC
            }
        )

        // --------------------------------------------------------------------------------
        //
        // ELB
        //
        this.slsDebuggerBrokerExternalELBName = `${helpers.ENTITY_PREFIX}external-elb${helpers.STAGE}`
        this.slsDebuggerBrokerExternalELB = new elb.ApplicationLoadBalancer(
            this,
            this.slsDebuggerBrokerExternalELBName,
            {
                loadBalancerName: this.slsDebuggerBrokerExternalELBName,
                internetFacing: false,
                securityGroup: this.slsDebuggerBrokerELBSecGroup,
                vpc: this.selectedVPC,
                vpcSubnets: {
                    subnets: this.selectedSubnets
                }
            }
        )


        // --------------------------------------------------------------------------------
        //
        // ELB Listeners
        //
        this.slsDebuggerBrokerExternalELBApplicationListenerName = `${helpers.ENTITY_PREFIX}external-elb-application-listener${helpers.STAGE}`
        this.slsDebuggerBrokerExternalELBApplicationListener = new elb.ApplicationListener(
            this,
            this.slsDebuggerBrokerExternalELBApplicationListenerName,
            {
                loadBalancer: this.slsDebuggerBrokerExternalELB,
                certificates: [
                    {
                        certificateArn: helpers.getCertificateArn(),
                    }
                ],
                defaultAction: elb.ListenerAction.forward([
                    this.slsDebuggerBrokerExternalELBApplicationTargetGroup
                ]),
                port: 444,
                protocol: helpers.getProtocol()
            }
        )

        this.slsDebuggerBrokerExternalELBClientListenerName = `${helpers.ENTITY_PREFIX}external-elb-client-listener${helpers.STAGE}`
        this.slsDebuggerBrokerExternalELBClientListener = new elb.ApplicationListener(
            this,
            this.slsDebuggerBrokerExternalELBClientListenerName,
            {
                loadBalancer: this.slsDebuggerBrokerExternalELB,
                certificates: [
                    {
                        certificateArn: helpers.getCertificateArn()
                    }
                ],
                defaultAction: elb.ListenerAction.forward([

                    this.slsDebuggerBrokerExternalELBClientTargetGroup
                ]),
                port: helpers.getPort(),
                protocol: helpers.getProtocol()
            }
        )
    }
}