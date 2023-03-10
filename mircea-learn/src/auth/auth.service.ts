import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { ForbiddenException } from '@nestjs/common/exceptions';
import { JwtService } from '@nestjs/jwt/dist';
@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}
  async signin(dto: AuthDto) {
    // find user by email if user doesn't exist exception
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new ForbiddenException('incorrect credentials!');
    }

    //check password
    const correctPassword = await argon.verify(user.passwordHash, dto.password);

    if (!correctPassword)
      throw new ForbiddenException('incorrect credentials!');
    // everything right send back user

    return this.signToken(user.id, user.email);
  }
  async signup(dto: AuthDto) {
    try {
      const hash = await argon.hash(dto.password);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash: hash,
        },
      });

      delete user.passwordHash;

      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException(`email ${dto.email} already used!`);
        }
      }
      throw error;
    }
  }
  async signToken(
    userId: number,
    userEmail: string,
  ): Promise<{ access_token: string }> {
    const payLoad = { sub: userId, email: userEmail };
    return {
      access_token: await this.jwt.signAsync(payLoad, {
        secret: process.env.SECRET,
        expiresIn: '15m',
      }),
    };
  }
}
