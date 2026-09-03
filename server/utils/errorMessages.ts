export const AUTH_ERROR_MESSAGES = {
    secretMissing: 'Authentication configuration is missing. Please try again later.',
    notLoggedIn: 'You are not logged in! Please log in to get access.',
    missingCredentials: 'Please provide email and password to proceed.',
    invalidCredentials: 'Wrong user email or password. Try again with valid credentials.',
    signUpFailed: 'Unable to create your account at the moment.',
    loginFailed: 'Unable to log in at the moment.',
    deleteUserFailed: 'Unable to complete the request at the moment.',
    passwordChanged: 'User password has changed. Please login again.',
    invalidAction: "This action can't be performed because your account is already active.",
    userNotFound: 'User with this email does not exist. Please sign up to create an account.',
    passwordResetFailed: 'Unable to reset your password at the moment.',
    passwordResetTokenInvalid:
        'Your password reset token is invalid or expired. Please request a new password reset token.',
    invalidResetToken:
        'Provided reset token does not match any user. Please request a new password reset token.',
    invalidCurrentPassword:
        'Your current password is incorrect. Please provide the correct current password.',
    // Bills related errors

    noReceiptImage: 'No receipt image uploaded. Please upload a receipt image to proceed.',
    lowOcrConfidence: 'Low OCR confidence, text may be invalid.',
    dataExtractionError: 'Something went wrong ',
} as const;

export const APP_ERROR_MESSAGES = {
    somethingWentWrong: 'Something went wrong.',
    invalidInputData: 'Invalid input data.',
    sessionExpired: 'Your session has expired. Please log in again.',
    malformedToken: 'Authentication token is malformed. Please log in again.',
    duplicateUser: 'A user with this email already exists. Please sign in or use another email.',
} as const;
