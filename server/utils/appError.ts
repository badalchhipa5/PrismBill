class AppError extends Error {
    statusCode: number;
    status: string;
    isOperational: boolean;
    errors?: Record<string, { message?: string }>;
    code?: number;

    constructor(
        message: string,
        statusCode: number,
        name: string | undefined = undefined,
        isOperational = true
    ) {
        super(message);

        this.name = name || this.constructor.name;
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = isOperational;

        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;
