import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOrCreateUser(auth0Sub: string, email: string, name?: string) {
    return this.prisma.user.upsert({
      where: { auth0Sub },
      update: {},
      create: {
        auth0Sub,
        email,
        name,
      },
    });
  }
}
