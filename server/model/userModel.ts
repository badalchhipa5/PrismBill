// External dependencies
import mongoose, { Schema, type Document } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Internal dependencies
import { User } from '@prismbill/shared-type';

interface UserDocument extends User, Document {
    verifyPassword(candidatePassword: string, password: string): Promise<boolean>;
    isPasswordChangedAfter(JWTTimestamp: number): boolean;
    createPasswordResetToken(): string;
}

const userSchema = new Schema<UserDocument>({
    userEmail: {
        type: String,
        unique: true,
        required: [true, 'Please provide an email address.'],
        lowercase: true,
        trim: true,
        validate: {
            validator: (value: string): boolean => validator.isEmail(value),
            message: 'Please enter a valid email address.',
        },
    },
    userName: {
        type: String,
        required: [true, 'Please provide a username.'],
    },
    userFirstName: {
        type: String,
    },
    userLastName: {
        type: String,
    },
    userPassword: {
        type: String,
        required: [true, 'Please provide a password.'],
        select: false,
        minlength: [8, 'Password must be at least 8 characters long.'],
    },
    userConfirmPassword: {
        type: String,
        required: [true, 'Please confirm your password.'],
        validate: {
            validator: function (this: UserDocument, el: string): boolean {
                return el === this.userPassword;
            },
            message: "Password and confirm password aren't the same!",
        },
    },
    userBills: {
        type: [{ type: String }],
    },
    userPasswordChangedAt: Date,
    userPasswordResetToken: String,
    userPasswordResetExpireAt: Date,
    userAccountDeletionRequestedAt: Date,
    userAccountStatus: {
        type: String,
        default: 'active',
        enum: ['active', 'archive'],
    },
});

// Des: Encrypt password before saving to DB.

userSchema.pre('save', async function () {
    // Encrypt password.
    if (!this.isModified('userPassword')) return;

    this.userPassword = await bcrypt.hash(this.userPassword, 16);
    this.userConfirmPassword = undefined;
});

// Des: Update password changed date before saving to DB.
userSchema.pre('save', function () {
    if (!this.isModified('userPassword') || this.isNew) return;
    this.userPasswordChangedAt = new Date(Date.now() - 1000); // Subtract 1 second to ensure the token is created after the password has been changed.
});

// des: Schema method for password verification.
userSchema.methods.verifyPassword = async function (
    candidatePassword: string,
    password: string
): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, password);
};

// Des: Schema method for last password changed.
userSchema.methods.isPasswordChangedAfter = function (JWTTimestamp: number) {
    // If password changed date exist check if it changed after JWT assigned.
    if (this.userPasswordChangedAt) {
        // Convert date into timestamp.
        const changedTimestamp = this.userPasswordChangedAt.getTime() / 1000;

        //  If user password changed after JWT assigned: Return True, Else False.
        return JWTTimestamp < changedTimestamp;
    }

    // Return: Password Haven't changed.
    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.userPasswordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.userPasswordResetExpireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now.

    return resetToken;
};

export const UserModel = mongoose.model<UserDocument>('Users', userSchema);
