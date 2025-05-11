// src/auth/auth.controller.ts
import { Controller, Get, Req, Res } from '@nestjs/common';
import { ConfidentialClientApplication, AuthorizationUrlRequest, AuthorizationCodeRequest } from '@azure/msal-node';
import * as cookieParser from 'cookie-parser';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
 
}
