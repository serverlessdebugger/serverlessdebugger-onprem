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

    if (process.env.THUNDRA_LICENSE_KEY === undefined) {
        validationErrors.push(
            'Make sure to set THUNDRA_LICENSE_KEY in .env'
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

        // Check if PUBLIC_BROKER_SUBDOMAIN is set
        if (process.env.PUBLIC_BROKER_SUBDOMAIN === undefined) {
            validationErrors.push(
                'Make sure to set PUBLIC_BROKER_SUBDOMAIN in .env or set CREATE_DNS_MAPPING to false'
            )
        }

        // Check if INTERNAL_BROKER_SUBDOMAIN is set
        if (process.env.INTERNAL_BROKER_SUBDOMAIN === undefined) {
            validationErrors.push(
                'Make sure to set INTERNAL_BROKER_SUBDOMAIN in .env or set CREATE_DNS_MAPPING to false'
            )
        }
    }

    if (validationErrors.length !== 0) {
        throw new Error(`\n\t${validationErrors.join('\n\t')}`);
    }
}
