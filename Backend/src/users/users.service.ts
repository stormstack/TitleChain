import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findOrCreate(walletAddress: string): Promise<User> {
    let user = await this.usersRepository.findOne({ where: { walletAddress } });
    if (!user) {
      user = this.usersRepository.create({ walletAddress });
      await this.usersRepository.save(user);
    }
    return user;
  }

  async findByWallet(walletAddress: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { walletAddress } });
  }
}
