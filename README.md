# ServerlessDebugger Self-Hosted CDK

This is the self-hosted version of Thundra's [ServerlessDebugger](https://serverlessdebugger.com). ServerlessDebugger brings the traditional debugging experience to the AWS Lambdas. It comes in as a VSCode extension and can be installed on your VSCode IDE in seconds and enable you to put breakpoints in your Lambda functions. All done with no code changes!

Apart from the SaaS version of the ServerlessDebugger, we offer a way to install the debug broker into your own AWS account to satisfy your needs. To get the pricing and the license key for the self-hosted version, visit our [Pricing Page](https://www.serverlessdebugger.com/pricing).

# Prerequisites

You would need a couple of things ready before you start running commands.

1. NodeJS and NPM
2. Install NPM package for AWS CDK
    - This project currently uses v2.27.0.
3. AWS Account and AWS CLI

# Installation

To setup the self-hosted version of ServerlessDebugger, you have to have an AWS account with proper access to create resources and apply this CDK. You can see the details of what's in this CDK [below](#whats-in-this-cdk) or by reading the code itself.

You can start by just copying the `sample.env` as `.env` and move on from there. In the repository's directory, run the following command.

```bash
cp sample.env .env
```

In the `.env` file, we've documented which variables are needed and why. Some parts of this stack is optional and some are required. See [below](#environment-variables) for more details.

Once the necessary environment variables are set, you can run the following commands in order.

```bash
npm install     # To install the necessary dependencies.
cdk bootstrap   # To prepare the AWS account with CDK Toolkit.
cdk synth       # To see if the stack synthesises without any problem.
cdk deploy      # To deploy the stack on the AWS account.
```

# What's in this CDK?

In this stack, there are various recources at play. In no particular order, the main resources includes the following;

1. One AWS ECS Cluster
2. One AWS Fargate Service
3. One Internal ELB
    - Internal Application Load Balancer
    - With necessary Target Groups and Listeners
4. One External ELB
    - Internet Facing Application Load Balancer
    - With necessary Target Groups and Listeners
5. DNS Records to set custom domain

In an architectural view, self-hosted version can be used in multiple ways depending on whether your lambdas are in a VPC or not. See the below image to have an understanding of what's going on. If you encounter any issue or have feedbacks, don't hesitate to [contact us](https://serverlessdebugger.com/contact-us).

![Self-Hosted ServerlessDebugger](/self-hosted-serverless-debug-broker.png)

## Environment Variables

| Variable Name             | Expectation   | Default       | Requires              | Description   |
|---                        |---            |---            |---                    |---            |
| STAGE                     | Optional      | dev           | -                     | Sets a suffix to all the resources. Used to separate environments, such as dev, staging, prod. Beware of that some resources have a name limitation of 32 characters. Can set this to and empty string.        |
| ENTITY_PREFIX             | Optional      | slsd          | -                     | Sets a prefix to all the resources. Used to differentiate ServerlessDebugger resources from others. Beware of that some resources have a name limitation of 32 characters. Can set this to and empty string.        |
| USE_HTTPS                 | Optional      | false         | -                     | Decide if the broker endpoints should use SSL encryption. Expects `SSL_CERTIFICATE_ARN`.          |
| SSL_CERTIFICATE_ARN       | Optional      | -             | USE_HTTPS             | Requires `USE_HTTPS` to be set to true. We expect customers to create and manage their own SSL certification.            |
| VPC_ID                    | Optional      | Default VPC   | -                     | VPC to use to deploy the application. If it's not given, stack will use the default VPC.         |
| SUBNET_IDS                | **Required**  | -             | At least 2 subnet ids | Subnets to use to deploy the application. Requires at least 2 subnet ids.            |
| THUNDRA_LICENSE_KEY       | **Required**  | -             | -                     | Thundra License Key for the self-hosted ServerlessDebugger. [Contact Us](https://www.serverlessdebugger.com/contact-us) if needed.             |
| CREATE_DNS_MAPPING        | Optional      | false         | -                     | Sets a custom domain for the self-hosted broker.          |
| HOSTED_ZONE_NAME          | Optional      | -             | CREATE_DNS_MAPPING    | Hosted zone name to use. Requires `CREATE_DNS_MAPPING` to be set to true.            |
| PUBLIC_BROKER_SUBDOMAIN   | Optional      | -             | CREATE_DNS_MAPPING    | Subdomain for the internet facing ELB to use. Requires `CREATE_DNS_MAPPING` to be set to true.             |
| INTERNAL_BROKER_SUBDOMAIN | Optional      | -             | CREATE_DNS_MAPPING    | Subdomain for the internal ELB to use. Requires `CREATE_DNS_MAPPING` to be set to true.             |
