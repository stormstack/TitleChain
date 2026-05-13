import { Body, Controller, Get, Post, Request, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

class LoginDto {
  walletAddress: string;
  signature: string;
  message: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() body: LoginDto) {
    return this.authService.login(body.walletAddress, body.signature, body.message);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Request() req) {
    return req.user;
  }
}
