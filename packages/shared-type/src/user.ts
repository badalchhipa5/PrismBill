export interface User {
    userName: string;
    userEmail: string;
    userFirstName: string;
    userLastName: string;
    userPassword: string;
    userConfirmPassword: string | undefined;
    userRole: 'user' | 'viewer';
    userBills?: string[];
    userPasswordResetToken?: string;
    userPasswordResetExpireAt?: Date;
    userPasswordChangedAt?: Date;
    userAccountDeletionRequestedAt?: Date;
    userAccountStatus: 'active' | 'archive';
}

export interface AuthenticatedUser extends User {
    _id: string | unknown;
    save: () => Promise<AuthenticatedUser>;
}
