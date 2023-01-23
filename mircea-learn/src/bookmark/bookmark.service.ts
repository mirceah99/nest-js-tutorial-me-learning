import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createBookmarkDto, editBookmarkDto } from './dto';
import { ForbiddenException } from '@nestjs/common/exceptions';

@Injectable()
export class BookmarkService {
  constructor(private prismaService: PrismaService) {}
  getBookmarks(userId: number) {
    return this.prismaService.bookmark.findMany({
      where: {
        userId,
      },
    });
  }

  async createBookmark(userId: number, dto: createBookmarkDto) {
    return await this.prismaService.bookmark.create({
      data: { ...dto, userId },
    });
  }

  getBookmarkById(userId: number, bookmarkId: number) {
    return this.prismaService.bookmark.findFirst({
      where: {
        userId,
        id: bookmarkId,
      },
    });
  }

  async editBookmarkById(
    userId: number,
    bookmarkId: number,
    dto: editBookmarkDto,
  ) {
    const bookmark = await this.getBookmarkById(userId, bookmarkId);
    if (!bookmark) throw new ForbiddenException('Access deny');
    return this.prismaService.bookmark.update({
      where: {
        id: bookmarkId,
      },
      data: { ...dto },
    });
  }

  async deleteBookmarkById(userId: number, bookmarkId: number) {
    const bookmark = await this.getBookmarkById(userId, bookmarkId);
    if (!bookmark) throw new ForbiddenException('Access deny');

    await this.prismaService.bookmark.delete({ where: { id: bookmarkId } });
  }
}
