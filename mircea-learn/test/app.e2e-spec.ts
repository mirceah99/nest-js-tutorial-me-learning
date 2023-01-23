import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';
import { editBookmarkDto } from 'src/bookmark/dto';
const port = 4001;
const url = `http://localhost:${port}`;
describe('app e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    await app.listen(port);
    prisma = app.get(PrismaService);
    pactum.request.setBaseUrl(url);
    await prisma.cleanDb();
  });
  afterAll(async () => {
    app.close();
  });
  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'test@email.com',
      password: 'qwertyuiop123',
    };
    describe('Signup', () => {
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post(`/auth/signup`)
          .withBody({ password: 'qwertyuiop123' })
          .expectStatus(400);
      });
      it('should throw if password to short', () => {
        return pactum
          .spec()
          .post(`/auth/signup`)
          .withBody({ email: 'test@test.com', password: 'qwex' })
          .expectStatus(400);
      });
      it('should throw if to many attributes', () => {
        return pactum
          .spec()
          .post(`/auth/signup`)
          .withBody({ ...dto, x: 'x' })
          .expectStatus(400);
      });
      it('should sing up', () => {
        return pactum
          .spec()
          .post(`/auth/signup`)
          .withBody(dto)
          .expectStatus(201);
      });
    });
    describe('Sign in', () => {
      it('should sing in', () => {
        return pactum
          .spec()
          .post(`/auth/signin`)
          .withBody(dto)
          .expectStatus(200)
          .stores('userAuth', 'access_token');
      });
    });
  });
  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get(`/users/me`)
          .withHeaders({
            Authorization: `Bearer $S{userAuth}`,
          })
          .expectStatus(200);
      });
      it('should get 401 unauthorized', () => {
        return pactum.spec().get(`/users/me`).expectStatus(401);
      });
    });
    describe('Edit user', () => {
      it('should edit current user', () => {
        const dto = { firstName: 'Tiron', email: 'xx@gmail.com' };
        return pactum
          .spec()
          .patch(`/users`)
          .withHeaders({
            Authorization: `Bearer $S{userAuth}`,
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.email);
      });
    });
  });
  describe('Bookmarks', () => {
    describe('Get empty Bookmarks', () => {
      it('should get empty array', () => {
        return pactum
          .spec()
          .get(`/bookmarks`)
          .withHeaders({
            Authorization: `Bearer $S{userAuth}`,
          })
          .expectStatus(200)
          .expectBody([]);
      });
    });
    describe('Create Bookmarks', () => {
      const dto = {
        title: 'Test1',
        link: 'google.com',
      };
      it('should create bookmark', () => {
        return pactum
          .spec()
          .post(`/bookmarks`)
          .withHeaders({
            Authorization: `Bearer $S{userAuth}`,
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id');
      });
    });
    describe('Get Bookmarks', () => {
      it('should get 1 elem array', () => {
        return pactum
          .spec()
          .get(`/bookmarks`)
          .withHeaders({
            Authorization: `Bearer $S{userAuth}`,
          })
          .expectStatus(200)
          .expectJsonLength(1);
      });
    });
    describe('Get Bookmark by id', () => {
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get(`/bookmarks/{id}`)
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: `Bearer $S{userAuth}`,
          })
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}');
      });
    });
    describe('Edit Bookmark by id', () => {
      const dto: editBookmarkDto = {
        description: 'new 123',
      };
      it('should edit bookmark by id', () => {
        return pactum
          .spec()
          .patch(`/bookmarks/{id}`)
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: `Bearer $S{userAuth}`,
          })
          .expectStatus(200)
          .withBody(dto)
          .expectBodyContains(dto.description);
      });
    });
    describe('Delete Bookmark by id', () => {
      it('should edit delete bookmark by id', () => {
        return pactum
          .spec()
          .delete(`/bookmarks/{id}`)
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: `Bearer $S{userAuth}`,
          })
          .expectStatus(204);
      });
    });
    it('should get empty array because deleted', () => {
      return pactum
        .spec()
        .get(`/bookmarks`)
        .withHeaders({
          Authorization: `Bearer $S{userAuth}`,
        })
        .expectStatus(200)
        .expectJsonLength(0);
    });
  });
});
