// External dependencies
import express from 'express';

// Internal dependencies
import {
    signUp,
    logIn,
    requireAuthentication,
    forgotPassword,
    resetPassword,
    changePassword,
} from '../controllers/authController';
import { getProfile, deleteUser } from '../controllers/userController';

import checkRequestBody from '../middleware/checkRequestBody';

const userRouter = express.Router();

userRouter.post('/signup', checkRequestBody, signUp);
userRouter.post('/login', checkRequestBody, logIn);
userRouter.get('/getProfile', requireAuthentication, getProfile);
userRouter.delete('/deleteMe', requireAuthentication, deleteUser);
userRouter.post('/forgotPassword', checkRequestBody, forgotPassword);
userRouter.patch('/resetPassword/:token', checkRequestBody, resetPassword);
userRouter.patch('/changePassword', requireAuthentication, checkRequestBody, changePassword);

export default userRouter;
