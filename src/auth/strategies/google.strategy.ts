import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';

/**
 * Google OAuth 2.0 Strategy.
 * Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.
 * Callback URL is dynamic based on API_URL.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(configService: ConfigService) {
        const apiUrl = configService.get<string>('API_URL', 'http://localhost:8080');
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID', ''),
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET', ''),
            callbackURL: `${apiUrl}/auth/google/callback`,
            scope: ['email', 'profile'],
        });
    }

    validate(
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
    ): void {
        const user = {
            googleId: profile.id,
            email: profile.emails?.[0]?.value || '',
            nome: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
            fotoUrl: profile.photos?.[0]?.value || '',
        };
        done(null, user);
    }
}
