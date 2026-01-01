
export const enum ErrorCodes {
    METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
    SERVER_ERROR = 'SERVER_ERROR',

    //auth
    NO_AUTH_TOKEN = 'NO_AUTH_TOKEN',
    INVALID_AUTH_TOKEN = 'INVALID_AUTH_TOKEN',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',
    INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN',
    SESSION_EXPIRED = 'SESSION_EXPIRED',
    UNAUTHORIZED = 'UNAUTHORIZED',
    USER_LOGIN_FAILED = 'USER_LOGIN_FAILED',
    INVALID_EMAIL_OR_PASS = 'INVALID_EMAIL_OR_PASS',

    //users
    USER_CREATION_ERROR = 'USER_CREATION_ERROR',
    USER_CREATED_LOGIN_FAILED = 'USER_CREATED_LOGIN_FAILED',
    USER_BOARDING_FAILED = 'USER_BOARDING_FAILED',
    USER_NOTFOUND = 'USER_NOTFOUND',    
    USER_CHECKOUT_NOT_FOUND = 'USER_CHECKOUT_NOT_FOUND',
    USER_CHECKOUT_ERROR = 'USER_CHECKOUT_ERROR',

    //SQL
    SQL_ERROR = 'SQL_ERROR',

    //others
    ALREADY_EXISTS = 'ALREADY_EXISTS',
    INVALID_INPUT = 'INVALID_INPUT',

}

export const enum ErrorMessages {
    METHOD_NOT_ALLOWED = 'Method Not Allowed',
    SERVER_ERROR = 'Server Error',

    //auth
    NO_AUTH_TOKEN = 'No authentication token provided',
    INVALID_AUTH_TOKEN = 'Invalid authentication token',
    TOKEN_EXPIRED = 'Token expired',
    INVALID_REFRESH_TOKEN = 'Invalid refresh token',
    SESSION_EXPIRED = 'Session expired',
    UNAUTHORIZED = 'Unauthorized access',
    USER_LOGIN_FAILED = 'User login failed',
    INVALID_EMAIL_OR_PASS = 'Invalid email or password',

    //users
    USER_CREATION_ERROR = 'Unable to create a new user',
    USER_CREATED_LOGIN_FAILED = 'User created but auto-login failed. Please log in manually.',
    USER_BOARDING_FAILED = 'User boarding failed. Invalid data provided',
    USER_NOTFOUND = 'User not found or unregistered in the system',
    USER_CHECKOUT_NOT_FOUND="User checkout not found",
    USER_CHECKOUT_ERROR="Problem exist during checkout",

    //SQL
    SQL_ERROR = 'Database query error',

    //others
    ALREADY_EXISTS = 'Already exists',
    INVALID_INPUT = 'Invalid input',

}