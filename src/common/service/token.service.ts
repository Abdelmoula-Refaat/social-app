import jwt,  { JwtPayload, Secret, SignOptions } from "jsonwebtoken";

class TokenService {

    constructor() { }

    GenerateToken({
        payload,
        secret_key,
        options
    }: {
        payload: object;
        secret_key: Secret;
        options?: SignOptions;
    }) : string {
        return jwt.sign(payload, secret_key, options);
    }

    VerifyToken({
        token,
        secret_key
    }: {
        token: string;
        secret_key: Secret;
    }) : JwtPayload {
        return jwt.verify(token, secret_key) as JwtPayload;
    }
}

export default new TokenService();