export interface ServiceErrorDetails {
    statusCode: number;
    errorMessage: string;
    errorName: string;
}

export interface ServiceErrorInput {
    http_code?: number;
    status?: number | string;
    message?: string;
    name?: string;
}
