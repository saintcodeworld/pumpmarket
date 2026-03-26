declare module 'jsonwebtoken' {
  export interface SignOptions {
    algorithm?: string;
    audience?: string | string[];
    expiresIn?: string | number;
    issuer?: string;
    jwtid?: string;
    keyid?: string;
    notBefore?: string | number;
    subject?: string;
    header?: object;
    encoding?: string;
    allowTimestamps?: boolean;
    mutatePayload?: boolean;
  }

  export interface VerifyOptions {
    algorithms?: string[];
    audience?: string | string[];
    complete?: boolean;
    issuer?: string | string[];
    jwtid?: string;
    clockTimestamp?: number;
    clockTolerance?: number;
    maxAge?: string | number;
    subject?: string;
    allowTimestamps?: boolean;
    clockTimestamp?: number;
    nonce?: string;
  }

  export interface JwtPayload {
    iss?: string;
    sub?: string;
    aud?: string | string[];
    exp?: number;
    nbf?: number;
    iat?: number;
    jti?: string;
    [key: string]: any;
  }

  export interface Jwt {
    sign(payload: string | object | Buffer, secretOrPrivateKey: string | Buffer, options?: SignOptions): string;
    verify(token: string, secretOrPublicKey: string | Buffer, options?: VerifyOptions): JwtPayload | string;
    decode(token: string, options?: { complete?: boolean; json?: boolean }): JwtPayload | string | { header: object; payload: JwtPayload | string; signature: string };
  }

  const jwt: Jwt;
  export default jwt;
}
