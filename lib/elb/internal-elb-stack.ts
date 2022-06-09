import { Duration, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as helpers from '../../utils/helpers';

interface InternalELBStackProps extends NestedStackProps {
    readonly selectedVPC: ec2.IVpc,
    readonly selectedSubnets: ec2.ISubnet[];
    readonly brokerELBSecGroup: ec2.ISecurityGroup
}

export class InternalELBStack extends NestedStack {
    selectedVPC: ec2.IVpc;
    selectedSubnets: ec2.ISubnet[];

    slsDebuggerBrokerInternalELBName: string;
    slsDebuggerBrokerInternalELB: elb.IApplicationLoadBalancer;

    slsDebuggerBrokerELBSecGroup: ec2.ISecurityGroup;

    slsDebuggerBrokerInternalELBApplicationTargetGroupName: string;
    slsDebuggerBrokerInternalELBApplicationTargetGroup: elb.IApplicationTargetGroup;
    slsDebuggerBrokerInternalELBApplicationListenerName: string;
    slsDebuggerBrokerInternalELBApplicationListener: elb.IApplicationListener;

    slsDebuggerBrokerInternalELBClientTargetGroupName: string;
    slsDebuggerBrokerInternalELBClientTargetGroup: elb.IApplicationTargetGroup;
    slsDebuggerBrokerInternalELBClientListenerName: string;
    slsDebuggerBrokerInternalELBClientListener: elb.IApplicationListener;

    constructor(scope: Construct, id: string, props: InternalELBStackProps) {
        super(scope, id, props);

        this.selectedVPC = props.selectedVPC;
        this.selectedSubnets = props.selectedSubnets;
        this.slsDebuggerBrokerELBSecGroup = props.brokerELBSecGroup;

        // --------------------------------------------------------------------------------
        //
        // ELB Target Groups
        //

        // internal-elb-application-target-group
        this.slsDebuggerBrokerInternalELBApplicationTargetGroupName = `${helpers.ENTITY_PREFIX}in-elb-app-tg${helpers.STAGE}`
        this.slsDebuggerBrokerInternalELBApplicationTargetGroup = new elb.ApplicationTargetGroup(
            this,
            this.slsDebuggerBrokerInternalELBApplicationTargetGroupName,
            {
                targetGroupName: this.slsDebuggerBrokerInternalELBApplicationTargetGroupName,
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

        // internal-elb-client-target-group
        this.slsDebuggerBrokerInternalELBClientTargetGroupName = `${helpers.ENTITY_PREFIX}in-elb-clt-tg${helpers.STAGE}`
        this.slsDebuggerBrokerInternalELBClientTargetGroup = new elb.ApplicationTargetGroup(
            this,
            this.slsDebuggerBrokerInternalELBClientTargetGroupName,
            {
                targetGroupName: this.slsDebuggerBrokerInternalELBClientTargetGroupName,
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

        // internal-elb
        this.slsDebuggerBrokerInternalELBName = `${helpers.ENTITY_PREFIX}in-elb${helpers.STAGE}`
        this.slsDebuggerBrokerInternalELB = new elb.ApplicationLoadBalancer(
            this,
            this.slsDebuggerBrokerInternalELBName,
            {
                loadBalancerName: this.slsDebuggerBrokerInternalELBName,
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

        // internal-elb-application-listener
        this.slsDebuggerBrokerInternalELBApplicationListenerName = `${helpers.ENTITY_PREFIX}in-elb-app-lnr${helpers.STAGE}`
        this.slsDebuggerBrokerInternalELBApplicationListener = new elb.ApplicationListener(
            this,
            this.slsDebuggerBrokerInternalELBApplicationListenerName,
            {
                loadBalancer: this.slsDebuggerBrokerInternalELB,
                certificates: [
                    {
                        certificateArn: helpers.getCertificateArn(),
                    }
                ],
                defaultAction: elb.ListenerAction.forward([
                    this.slsDebuggerBrokerInternalELBApplicationTargetGroup
                ]),
                port: 444,
                protocol: helpers.getProtocol()
            }
        )

        // internal-elb-client-listener
        this.slsDebuggerBrokerInternalELBClientListenerName = `${helpers.ENTITY_PREFIX}in-elb-clt-lnr${helpers.STAGE}`
        this.slsDebuggerBrokerInternalELBClientListener = new elb.ApplicationListener(
            this,
            this.slsDebuggerBrokerInternalELBClientListenerName,
            {
                loadBalancer: this.slsDebuggerBrokerInternalELB,
                certificates: [
                    {
                        certificateArn: helpers.getCertificateArn()
                    }
                ],
                defaultAction: elb.ListenerAction.forward([

                    this.slsDebuggerBrokerInternalELBClientTargetGroup
                ]),
                port: helpers.getPort(),
                protocol: helpers.getProtocol()
            }
        )
    }
}
