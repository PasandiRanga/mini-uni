import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	constructor(private authService: AuthService) {
		super();
	}

	async canActivate(context: ExecutionContext) {
		const req = context.switchToHttp().getRequest<Request>();
		const authHeader = req.headers.authorization as string | undefined;
		const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : undefined;

		if (token && this.authService.isTokenBlacklisted(token)) {
			throw new UnauthorizedException('Token has been revoked');
		}

		const result = (await super.canActivate(context)) as boolean;

		// If AuthGuard('jwt') authenticated, ensure request is logged in
		// (AuthGuard may set request.user internally)
		return result;
	}
}

