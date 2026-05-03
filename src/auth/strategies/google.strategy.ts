import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';

/**
 * Google OAuth 2.0 Strategy.
 * Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.
 * Callback URL: /auth/google/callback
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(configService: ConfigService) {
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID', ''),
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET', ''),
            callbackURL: configService.get<string>(
                'GOOGLE_CALLBACK_URL',
                'http://localhost:8080/auth/google/callback',
            ),
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
            email: profile.emails?.[0]?.value || '',
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            picture: profile.photos?.[0]?.value || '',
        };
        done(null, user);
    }
}
