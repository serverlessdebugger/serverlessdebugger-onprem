import { Duration, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as route53 from 'aws-cdk-lib/aws-route53';

interface DNSStackProps extends NestedStackProps {
    readonly internalELB: elb.IApplicationLoadBalancer,
    readonly externalELB: elb.IApplicationLoadBalancer;
}

export class DNSStack extends NestedStack {

    selectedHostedZone: route53.IHostedZone;

    slsDebuggerBrokerInternalELBDNSRecordName: string;
    slsDebuggerBrokerExternalELBDNSRecordName: string;

    slsDebuggerBrokerInternalELB: elb.IApplicationLoadBalancer;
    slsDebuggerBrokerExternalELB: elb.IApplicationLoadBalancer;

    constructor(scope: Construct, id: string, props: DNSStackProps) {
        super(scope, id, props);

        this.slsDebuggerBrokerInternalELB = props.internalELB;
        this.slsDebuggerBrokerExternalELB = props.externalELB;

        // --------------------------------------------------------------------------------
        //
        // DNS Record
        //
        this.selectedHostedZone = route53.HostedZone.fromLookup(
            this,
            'hosted-zone',
            {
                domainName: process.env.HOSTED_ZONE_NAME || ''
            }
        )

        this.slsDebuggerBrokerInternalELBDNSRecordName = `${process.env.BROKER_PRIVATE_SUBDOMAIN}.${process.env.HOSTED_ZONE_NAME}`
        this.slsDebuggerBrokerExternalELBDNSRecordName = `${process.env.BROKER_PUBLIC_SUBDOMAIN}.${process.env.HOSTED_ZONE_NAME}`

        new route53.CnameRecord(
            this,
            'internal-elb-cname-record',
            {
                comment: 'Creating records for private elb of ServerlessDebugger broker',
                zone: this.selectedHostedZone,
                domainName: this.slsDebuggerBrokerInternalELB.loadBalancerDnsName,
                recordName: this.slsDebuggerBrokerInternalELBDNSRecordName,
                ttl: Duration.seconds(300)
            }
        )

        new route53.CnameRecord(
            this,
            'external-elb-cname-record',
            {
                comment: 'Creating records for public elb of ServerlessDebugger broker',
                zone: this.selectedHostedZone,
                domainName: this.slsDebuggerBrokerExternalELB.loadBalancerDnsName,
                recordName: this.slsDebuggerBrokerExternalELBDNSRecordName,
                ttl: Duration.seconds(300)
            }
        )
    }
}
