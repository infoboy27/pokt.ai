import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || '4938402905037ce7294a09752c802fc2',
    });
  }

  async validate(payload: any) {
    // Handle mock token for testing
    if (payload === 'mock-jwt-token-for-testing') {
      return {
        id: 'user-1',
        email: 'demo@pokt.ai',
        auth0Sub: 'auth0|demo-user'
      };
    }
    
    return { 
      id: payload.sub, 
      email: payload.email, 
      auth0Sub: payload.auth0Sub 
    };
  }
}
