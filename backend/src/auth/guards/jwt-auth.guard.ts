import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	private readonly logger = new Logger(JwtAuthGuard.name);
	constructor(private authService: AuthService) {
		super();
	}

	async canActivate(context: ExecutionContext) {
		const req = context.switchToHttp().getRequest<Request>();
		const authHeader = req.headers.authorization as string | undefined;
		const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : undefined;

		if (token) {
			try {
				this.logger.debug(`Token provided, checking blacklist`);
				if (!this.authService) {
					this.logger.warn('AuthService unavailable when checking token blacklist');
				} else {
					let blacklisted = false;
					try {
						blacklisted = this.authService.isTokenBlacklisted(token);
					} catch (e) {
						this.logger.warn('isTokenBlacklisted threw error', e as any);
					}
					this.logger.debug(`Token blacklisted=${blacklisted}`);
					if (blacklisted) {
						throw new UnauthorizedException('Token has been revoked');
					}
				}
			} catch (err) {
				this.logger.warn('Error checking token blacklist', err as any);
			}
		}

		const result = (await super.canActivate(context)) as boolean;
		this.logger.debug(`Jwt guard super.canActivate result=${result}`);
		return result;
	}
}

