import * as helpers from './helpers';

export const validateEnvironmentVariables: Function = (): void => {
    let validationErrors: string[] = [];

    if (helpers.stringToBoolean(process.env.USE_HTTPS)) {
        if (process.env.SSL_CERTIFICATE_ARN === undefined) {
            validationErrors.push(
                'Make sure to set SSL_CERTIFICATE_ARN in .env or set USE_HTTPS to false.'
            )
        }
    }

    if (process.env.SLSDEBUG_LICENSE_KEY === undefined) {
        validationErrors.push(
            'Make sure to set SLSDEBUG_LICENSE_KEY in .env'
        )
    }

    if (process.env.SUBNET_IDS === undefined) {
        validationErrors.push(
            'Make sure to set SUBNET_IDS in .env'
        )
    }

    if (helpers.stringToBoolean(process.env.CREATE_DNS_MAPPING)) {
        // Check if HOSTED_ZONE_NAME is set
        if (process.env.HOSTED_ZONE_NAME === undefined) {
            validationErrors.push(
                'Make sure to set HOSTED_ZONE_NAME in .env or set CREATE_DNS_MAPPING to false'
            )
        }

        // Check if BROKER_PUBLIC_SUBDOMAIN is set
        if (process.env.BROKER_PUBLIC_SUBDOMAIN === undefined) {
            validationErrors.push(
                'Make sure to set BROKER_PUBLIC_SUBDOMAIN in .env or set CREATE_DNS_MAPPING to false'
            )
        }

        // Check if BROKER_PRIVATE_SUBDOMAIN is set
        if (process.env.BROKER_PRIVATE_SUBDOMAIN === undefined) {
            validationErrors.push(
                'Make sure to set BROKER_PRIVATE_SUBDOMAIN in .env or set CREATE_DNS_MAPPING to false'
            )
        }
    }

    if (validationErrors.length !== 0) {
        throw new Error(`\n\t${validationErrors.join('\n\t')}`);
    }
}
