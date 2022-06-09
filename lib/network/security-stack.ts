import { NestedStack, NestedStackProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as helpers from '../../utils/helpers';

export class SecurityStack extends NestedStack {
  selectedVPC: ec2.IVpc;
  selectedSubnets: ec2.ISubnet[];

  slsDebuggerBrokerExecRoleName: string;
  slsDebuggerBrokerExecRole: iam.IRole;

  slsDebuggerBrokerTaskRoleName: string;
  slsDebuggerBrokerTaskRole: iam.IRole;

  slsDebuggerBrokerELBSecGroupName: string;
  slsDebuggerBrokerELBSecGroup: ec2.ISecurityGroup;

  slsDebuggerBrokerECSSecGroupName: string;
  slsDebuggerBrokerECSSecGroup: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props?: NestedStackProps) {
    super(scope, id, props);

    this.selectedSubnets = helpers.getSubnets(this);

    // --------------------------------------------------------------------------------
    //
    // VPC
    //
    if (process.env.VPC_ID) {
      this.selectedVPC = ec2.Vpc.fromLookup(
        this, 'SelectedVPC',
        {
          vpcId: process.env.VPC_ID
        }
      );
    } else {
      this.selectedVPC = ec2.Vpc.fromLookup(
        this, 'SelectedVPC',
        {
          isDefault: true
        }
      );
    }

    // --------------------------------------------------------------------------------
    //
    // IAM Roles
    //
    this.slsDebuggerBrokerExecRoleName = `${helpers.ENTITY_PREFIX}task-exec-role${helpers.STAGE}`
    this.slsDebuggerBrokerExecRole = new iam.Role(
      this,
      this.slsDebuggerBrokerExecRoleName,
      {
        roleName: this.slsDebuggerBrokerExecRoleName,
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'managed-policy',
            'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
          )
        ]
      }
    );
    Tags.of(this.slsDebuggerBrokerExecRole).add(
      helpers.ENTITY_TAG_KEY, helpers.ENTITY_TAG_VALUE
    )

    this.slsDebuggerBrokerTaskRoleName = `${helpers.ENTITY_PREFIX}task-role${helpers.STAGE}`
    this.slsDebuggerBrokerTaskRole = new iam.Role(
      this,
      this.slsDebuggerBrokerTaskRoleName,
      {
        roleName: this.slsDebuggerBrokerTaskRoleName,
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
      }
    );
    Tags.of(this.slsDebuggerBrokerTaskRole).add(
      helpers.ENTITY_TAG_KEY, helpers.ENTITY_TAG_VALUE
    )

    // --------------------------------------------------------------------------------
    //
    // External ELB Security Group
    //
    this.slsDebuggerBrokerELBSecGroupName = `${helpers.ENTITY_PREFIX}ex-elb-sg${helpers.STAGE}`
    this.slsDebuggerBrokerELBSecGroup = new ec2.SecurityGroup(
      this,
      this.slsDebuggerBrokerELBSecGroupName,
      {
        securityGroupName: this.slsDebuggerBrokerELBSecGroupName,
        description: 'ServerlessDebugger Broker External ELB Security Group',
        vpc: this.selectedVPC,
        allowAllOutbound: true
      }
    );
    this.slsDebuggerBrokerELBSecGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(helpers.getPort())
    );
    this.slsDebuggerBrokerELBSecGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(444)
    );
    Tags.of(this.slsDebuggerBrokerELBSecGroup).add(
      helpers.ENTITY_TAG_KEY, helpers.ENTITY_TAG_VALUE
    )

    // --------------------------------------------------------------------------------
    //
    // Broker Service Security Group
    //
    this.slsDebuggerBrokerECSSecGroupName = `${helpers.ENTITY_PREFIX}svc-sg${helpers.STAGE}`
    this.slsDebuggerBrokerECSSecGroup = new ec2.SecurityGroup(
      this,
      this.slsDebuggerBrokerECSSecGroupName,
      {
        securityGroupName: this.slsDebuggerBrokerECSSecGroupName,
        description: 'Thundra Lambda Debug Broker Service ELB Security Group',
        vpc: this.selectedVPC,
        allowAllOutbound: true
      }
    );
    this.slsDebuggerBrokerECSSecGroup.addIngressRule(
      this.slsDebuggerBrokerELBSecGroup,
      ec2.Port.tcp(4444)
    )
    this.slsDebuggerBrokerECSSecGroup.addIngressRule(
      this.slsDebuggerBrokerELBSecGroup,
      ec2.Port.tcp(5555)
    )
    Tags.of(this.slsDebuggerBrokerECSSecGroup).add(
      helpers.ENTITY_TAG_KEY, helpers.ENTITY_TAG_VALUE
    )
  }
}
