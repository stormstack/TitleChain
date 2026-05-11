import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Keypair } from "@stellar/stellar-sdk";
import { UsersService } from "../users/users.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(walletAddress: string, signature: string, message: string): Promise<{ access_token: string }> {
    const isValid = this.verifySignature(walletAddress, signature, message);
    if (!isValid) {
      throw new UnauthorizedException("Invalid wallet signature");
    }

    const user = await this.usersService.findOrCreate(walletAddress);
    const payload = { sub: user.id, walletAddress: user.walletAddress };
    return { access_token: this.jwtService.sign(payload) };
  }

  private verifySignature(walletAddress: string, signature: string, message: string): boolean {
    try {
      const keypair = Keypair.fromPublicKey(walletAddress);
      const messageBytes = Buffer.from(message);
      const signatureBytes = Buffer.from(signature, "base64");
      return keypair.verify(messageBytes, signatureBytes);
    } catch {
      return false;
    }
  }
}
