import { Duration, NestedStack, NestedStackProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as iam from 'aws-cdk-lib/aws-iam';
import * as helpers from '../../utils/helpers';

interface ECSStackProps extends NestedStackProps {
    readonly selectedVPC: ec2.IVpc,
    readonly selectedSubnets: ec2.ISubnet[];
    readonly brokerECSSecGroup: ec2.ISecurityGroup,
    readonly brokerExecutionRole: iam.IRole,
    readonly brokerTaskRole: iam.IRole,
    readonly targetGroups: {
        readonly internalELBClientTargetGroup: elb.IApplicationTargetGroup,
        readonly externalELBClientTargetGroup: elb.IApplicationTargetGroup,
        readonly internalELBApplicationTargetGroup: elb.IApplicationTargetGroup,
        readonly externalELBApplicationTargetGroup: elb.IApplicationTargetGroup,
    },
    readonly listeners: {
        readonly internalELBClientListener: elb.IApplicationListener,
        readonly externalELBClientListener: elb.IApplicationListener,
        readonly internalELBApplicationListener: elb.IApplicationListener,
        readonly externalELBApplicationListener: elb.IApplicationListener,
    }
}

export class ECSStack extends NestedStack {
    selectedVPC: ec2.IVpc;
    selectedSubnets: ec2.ISubnet[];

    slsDebuggerBrokerExecutionRole: iam.IRole;
    slsDebuggerBrokerTaskRole: iam.IRole;

    slsDebuggerBrokerECSSecGroup: ec2.ISecurityGroup;

    slsDebuggerBrokerExternalELBApplicationTargetGroup: elb.IApplicationTargetGroup;
    slsDebuggerBrokerExternalELBApplicationListener: elb.IApplicationListener;

    slsDebuggerBrokerInternalELBApplicationTargetGroup: elb.IApplicationTargetGroup;
    slsDebuggerBrokerInternalELBApplicationListener: elb.IApplicationListener;

    slsDebuggerBrokerExternalELBClientTargetGroup: elb.IApplicationTargetGroup;
    slsDebuggerBrokerExternalELBClientListener: elb.IApplicationListener;

    slsDebuggerBrokerInternalELBClientTargetGroup: elb.IApplicationTargetGroup;
    slsDebuggerBrokerInternalELBClientListener: elb.IApplicationListener;

    slsDebuggerBrokerECSClusterName: string;
    slsDebuggerBrokerECSCluster: ecs.ICluster;

    slsDebuggerBrokerECSTaskDefinitionName: string;
    slsDebuggerBrokerECSTaskDefinition: ecs.TaskDefinition;

    slsDebuggerBrokerFargateServiceName: string;
    slsDebuggerBrokerFargateService: ecs.CfnService;

    constructor(scope: Construct, id: string, props: ECSStackProps) {
        super(scope, id, props);

        this.selectedVPC = props.selectedVPC;
        this.selectedSubnets = props.selectedSubnets;

        this.slsDebuggerBrokerECSSecGroup = props.brokerECSSecGroup;
        this.slsDebuggerBrokerExecutionRole = props.brokerExecutionRole;
        this.slsDebuggerBrokerTaskRole = this.slsDebuggerBrokerTaskRole;

        this.slsDebuggerBrokerInternalELBClientTargetGroup = props.targetGroups.internalELBClientTargetGroup;
        this.slsDebuggerBrokerExternalELBClientTargetGroup = props.targetGroups.externalELBClientTargetGroup;
        this.slsDebuggerBrokerInternalELBApplicationTargetGroup = props.targetGroups.internalELBApplicationTargetGroup
        this.slsDebuggerBrokerExternalELBApplicationTargetGroup = props.targetGroups.externalELBApplicationTargetGroup

        this.slsDebuggerBrokerInternalELBClientListener = props.listeners.internalELBClientListener;
        this.slsDebuggerBrokerExternalELBClientListener = props.listeners.externalELBClientListener;
        this.slsDebuggerBrokerInternalELBApplicationListener = props.listeners.internalELBApplicationListener;
        this.slsDebuggerBrokerExternalELBApplicationListener = props.listeners.externalELBApplicationListener;

        // --------------------------------------------------------------------------------
        //
        // ECS Cluster
        //
        this.slsDebuggerBrokerECSClusterName = `${helpers.ENTITY_PREFIX}ecs-cluster${helpers.STAGE}`
        this.slsDebuggerBrokerECSCluster = new ecs.Cluster(
            this,
            this.slsDebuggerBrokerECSClusterName,
            {
                clusterName: this.slsDebuggerBrokerECSClusterName,
                vpc: this.selectedVPC,
            }
        )
        Tags.of(this.slsDebuggerBrokerECSCluster).add(
            helpers.ENTITY_TAG_KEY, helpers.ENTITY_TAG_VALUE
        )

        this.slsDebuggerBrokerECSTaskDefinitionName = `${helpers.ENTITY_PREFIX}ecs-task-definition${helpers.STAGE}`
        this.slsDebuggerBrokerECSTaskDefinition = new ecs.TaskDefinition(
            this,
            this.slsDebuggerBrokerECSTaskDefinitionName,
            {
                family: this.slsDebuggerBrokerECSTaskDefinitionName,
                networkMode: ecs.NetworkMode.AWS_VPC,
                compatibility: ecs.Compatibility.FARGATE,
                // CPU Parameters
                // 256   (.25 vCPU)  - Available memory values: 512 (0.5 GB), 1024 (1 GB), 2048 (2 GB)
                // 512   (.5 vCPU)   - Available memory values: 1024 (1 GB), 2048 (2 GB), 3072 (3 GB), 4096 (4 GB)
                // 1024  (1 vCPU)    - Available memory values: 2048 (2 GB), 3072 (3 GB), 4096 (4 GB), 5120 (5 GB), 6144 (6 GB), 7168 (7 GB), 8192 (8 GB)
                // 2048  (2 vCPU)    - Available memory values: Between 4096 (4 GB) and 16384 (16 GB) in increments of 1024 (1 GB)
                // 4096  (4 vCPU)    - Available memory values: Between 8192 (8 GB) and 30720 (30 GB) in increments of 1024 (1 GB)
                cpu: '256',
                // Memory Parameters
                // 512 (0.5 GB), 1024 (1 GB), 2048 (2 GB)                                                    - Available cpu values: 256 (.25 vCPU)
                // 1024 (1 GB), 2048 (2 GB), 3072 (3 GB), 4096 (4 GB)                                        - Available cpu values: 512 (.5 vCPU)
                // 2048 (2 GB), 3072 (3 GB), 4096 (4 GB), 5120 (5 GB), 6144 (6 GB), 7168 (7 GB), 8192 (8 GB) - Available cpu values: 1024 (1 vCPU)
                // Between 4096 (4 GB) and 16384 (16 GB) in increments of 1024 (1 GB)                        - Available cpu values: 2048 (2 vCPU)
                // Between 8192 (8 GB) and 30720 (30 GB) in increments of 1024 (1 GB)                        - Available cpu values: 4096 (4 vCPU)
                memoryMiB: '512',
                // Task Role
                // The name of the IAM role that grants containers in the task permission to call AWS APIs on your behalf.
                // Default: - A task role is automatically created for you.
                taskRole: this.slsDebuggerBrokerTaskRole,
                executionRole: this.slsDebuggerBrokerExecutionRole
            }
        )
        Tags.of(this.slsDebuggerBrokerECSTaskDefinition).add(
            helpers.ENTITY_TAG_KEY, helpers.ENTITY_TAG_VALUE
        )

        this.slsDebuggerBrokerECSTaskDefinition.addContainer(
            helpers.BROKER_CONTAINER_NAME,
            {
                image: ecs.ContainerImage.fromRegistry(
                    helpers.ECR_IMAGE_URI
                ),
                portMappings: [
                    {
                        containerPort: 4444
                    },
                    {
                        containerPort: 5555
                    }
                ],
                environment: {
                    THUNDRA_LICENSE_KEY: process.env.THUNDRA_LICENSE_KEY || ''
                }
            }
        )

        // --------------------------------------------------------------------------------
        //
        // ECS Service
        //
        this.slsDebuggerBrokerFargateServiceName = `${helpers.ENTITY_PREFIX}fargate-service${helpers.STAGE}`
        this.slsDebuggerBrokerFargateService = new ecs.CfnService(
            this,
            this.slsDebuggerBrokerFargateServiceName,
            {
                serviceName: this.slsDebuggerBrokerFargateServiceName,

                cluster: this.slsDebuggerBrokerECSCluster.clusterArn,
                taskDefinition: this.slsDebuggerBrokerECSTaskDefinition.taskDefinitionArn,
                desiredCount: 1,
                // This may need to be adjusted if the container takes a while to start up
                healthCheckGracePeriodSeconds: 60,
                launchType: ecs.LaunchType.FARGATE,
                networkConfiguration: {
                    awsvpcConfiguration: {
                        assignPublicIp: 'ENABLED',
                        subnets: this.selectedSubnets.map((s) => s.subnetId),
                        securityGroups: [
                            this.slsDebuggerBrokerECSSecGroup.securityGroupId
                        ]
                    }
                },
                loadBalancers: [
                    {
                        containerName: helpers.BROKER_CONTAINER_NAME,
                        containerPort: 5555,
                        targetGroupArn: this.slsDebuggerBrokerInternalELBClientTargetGroup.targetGroupArn,
                    },
                    {
                        containerName: helpers.BROKER_CONTAINER_NAME,
                        containerPort: 5555,
                        targetGroupArn: this.slsDebuggerBrokerExternalELBClientTargetGroup.targetGroupArn,
                    },
                    {
                        containerName: helpers.BROKER_CONTAINER_NAME,
                        containerPort: 4444,
                        targetGroupArn: this.slsDebuggerBrokerInternalELBApplicationTargetGroup.targetGroupArn,
                    },
                    {
                        containerName: helpers.BROKER_CONTAINER_NAME,
                        containerPort: 4444,
                        targetGroupArn: this.slsDebuggerBrokerExternalELBApplicationTargetGroup.targetGroupArn,
                    }
                ]
            }
        )
        Tags.of(this.slsDebuggerBrokerFargateService).add(
            helpers.ENTITY_TAG_KEY, helpers.ENTITY_TAG_VALUE
        )

        this.slsDebuggerBrokerFargateService.node.addDependency(
            this.slsDebuggerBrokerInternalELBClientListener
        )
        this.slsDebuggerBrokerFargateService.node.addDependency(
            this.slsDebuggerBrokerExternalELBClientListener
        )
        this.slsDebuggerBrokerFargateService.node.addDependency(
            this.slsDebuggerBrokerInternalELBApplicationListener
        )
        this.slsDebuggerBrokerFargateService.node.addDependency(
            this.slsDebuggerBrokerExternalELBApplicationListener
        )
    }
}
