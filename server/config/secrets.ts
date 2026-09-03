// Internal dependencies
import requireEnvVariable from '../utils/requireEnvVariable';

/**
 * Centralized access to runtime configuration values.
 */
export default {
    server: {
        PORT: Number(requireEnvVariable('PORT')),
        MONGODB_CONNECTION_STRING: requireEnvVariable('MONGODB_CONNECTION_STRING'),
        NODE_ENV: requireEnvVariable('NODE_ENV'),
    },
    cloudinary: {
        CLOUDINARY_NAME: requireEnvVariable('CLOUDINARY_CLOUD_NAME'),
        API_KEY: requireEnvVariable('CLOUDINARY_API_KEY'),
        API_SECRET: requireEnvVariable('CLOUDINARY_API_SECRET'),
    },
    gemini: {
        API_KEY: requireEnvVariable('GEMINI_API_KEY'),
    },
    jwt: {
        JWT_SECRET: requireEnvVariable('JWT_SECRET'),
        JWT_EXPIRE: requireEnvVariable('JWT_EXPIRE'),
    },
    email: {
        EMAIL_HOST: requireEnvVariable('EMAIL_HOST'),
        EMAIL_PORT: Number(requireEnvVariable('EMAIL_PORT')),
        EMAIL_USERNAME: requireEnvVariable('EMAIL_USERNAME'),
        EMAIL_USERPASSWORD: requireEnvVariable('EMAIL_USERPASSWORD'),
    },
};
