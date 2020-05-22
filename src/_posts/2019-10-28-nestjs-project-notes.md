---
category: Development
tags:
  - js
  - nodejs
  - nestjs
  - note
title: 'Nestjs 项目开发笔记'
description: 'Nestjs 项目开发笔记'
date: 2019-10-28
vssue-title: 'Nestjs 项目开发笔记'
---

前段时间团队有一个开发管理端项目的需求，决定使用 Nodejs + Typescript 开发。对社区现有的框架进行了简单调研后，选择了 [Nestjs](https://nestjs.com/) 作为开发框架。

这篇文章对 Nestjs 项目开发过程中的经验进行简单的记录。

<!-- more -->

## 与其他框架简单对比

项目前期简单调研了一些支持 Typescript 的框架，不过没有逐一进行深入了解。最终决定使用纯 TS 开发、社区活跃度较高的 Nestjs。

|                Name                        |  Typescript 支持   | 维护团队  |  活跃度  |                                    GitHub Stars                                           |
| :----------------------------------------: | :----------------: | :------: | :------: | :---------------------------------------------------------------------------------------: |
|   [Nestjs](https://nestjs.com/)            |    使用 TS 开发     |  社区    |    高    | ![GitHub stars](https://img.shields.io/github/stars/nestjs/nest?style=social)             |
|   [Loopback](https://loopback.io/)         |    使用 TS 开发     |  IBM     |   高    | ![GitHub stars](https://img.shields.io/github/stars/strongloop/loopback-next?style=social) |
|   [Midwayjs](https://midwayjs.org/midway/) |  基本使用 TS 开发   |   阿里   |    中    | ![GitHub stars](https://img.shields.io/github/stars/midwayjs/midway?style=social)          |
|   [FoalTS](https://foalts.org/)            |    使用 TS 开发     |  社区    |   中     | ![GitHub stars](https://img.shields.io/github/stars/FoalTS/foal?style=social)             |
|   [Stix](https://stix.netlify.com/)        |    使用 TS 开发     |  社区    |   低    | ![GitHub stars](https://img.shields.io/github/stars/SpoonX/stix?style=social)              |
|   [Eggjs](https://eggjs.org/)              |      支持 TS        |  阿里    |   高    | ![GitHub stars](https://img.shields.io/github/stars/eggjs/egg?style=social)                |
|   [Thinkjs](https://thinkjs.org)           |      支持 TS        |  360    |   低    | ![GitHub stars](https://img.shields.io/github/stars/thinkjs/thinkjs?style=social)           |

## Modules 与 依赖注入

> Nestjs 的 依赖注入 参考了 Angular 的思路，如果使用过 Angular 的话，会觉得 Nestjs 的写法非常熟悉。

### 基本用法

Nestjs 的依赖注入是以 Module 为单位的。所有需要注入到其他地方的类，需要使用 `@Injectable()` 标记为可注入，同时还要在所属 Module 中注册为 `providers` :

```ts {4}
// sample.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class SampleService {
  getMessage(): string {
    return 'This is a sample';
  }
}
```

```ts {6}
// sample.module.ts
import { Module } from '@nestjs/common';
import { SampleService } from './sample.service';

@Module({
  providers: [SampleService],
})
export class SampleModule {}
```

然后，就可以在 `SampleModule` 的作用域内注入 `SampleService` 依赖了:

```ts {8,11}
// sample.module.ts
import { Module } from '@nestjs/common';
import { SampleService } from './sample.service';
import { SampleController } from './sample.controller';

@Module({
  providers: [SampleService],
  controllers: [SampleController],
})
export class SampleModule {
  constructor(private readonly service: SampleService) {}
}
```

```ts {7,11}
// sample.controller.ts
import { Controller, Get } from '@nestjs/common';
import { SampleService } from './sample.service';

@Controller('/')
export class SampleController {
  constructor(private readonly service: SampleService){}

  @Get('/')
  getSample(): string {
    return this.service.getMessage();
  }
}
```

### 依赖注入的作用域

由于 Nestjs 的依赖注入需要在作用域内，我们不是在某一个 Module 中注册了 `providers` ，就能在其他地方注入的。

#### Module 作用域

想要在 A Module 中注入 B Module 的 `providers` 时，我们需要使用 Module 的 `imports` 和 `exports` 功能。

在 `ConfigModule` 中导出允许别的 Module 使用的 `providers` :

```ts {7}
// config.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';

@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

```ts
// config.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  private config = {
    message: 'Hello, world',
  };

  get message(): string {
    return this.config.message;
  }
}
```

在 `SampleModule` 中导入 `ConfigModule` ，此时 `ConfigModule` 中导出的 `providers` 就在 `SampleModule` 的作用域内可用了：

```ts {8}
// sample.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from './config.module';
import { SampleService } from './sample.service';
import { SampleController } from './sample.controller';

@Module({
  imports: [ConfigModule],
  providers: [SampleService],
  controllers: [SampleController],
})
export class SampleModule {}
```

```ts {10,20}
// sample.controller.ts
import { Controller, Get } from '@nestjs/common';
import { SampleService } from './sample.service';
import { ConfigService } from './config.service';

@Controller('/')
export class SampleController {
  constructor(
    private readonly service: SampleService,
    private readonly config: ConfigService
  ) {}

  @Get('/')
  getSample(): string {
    return this.service.getMessage();
  }

  @Get('/config')
  getHello(): string {
    return this.config.message;
  }
}
```

#### Module 作用域外

在一些情况下，我们需要在 Module 的作用域外进行依赖注入。

这里以后文要提到的 TypeORM + TypeGraphQL 为例，假设数据库的配置项是通过 `ConfigService` 来获取的：

```ts
// config.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  private config = {
    database: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      name: process.env.DB_NAME,
    },
    debug: process.env.DEBUG === 'true',
  };

  get database(): {
    host: string;
    port: string;
    user: string;
    password: string;
    name: string;
  } {
    return { ...this.config.database };
  }

  get env(): {
    isDev: boolean;
  } {
    return {
      isDev: this.config.debug,
    };
  }
}
```

在 `GraphqlModule` 中引入 `TypeOrmModule` 和 `GraphQLModule` 时，设置对应的数据库配置：

```ts {14-16,29-31}
// graphql.module.ts
import * as path from 'path';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { User } from './entities/user.entity';
import { UserResolver } from './resolvers/user.resolver';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mariadb',
        host: config.database.host,
        port: Number(config.database.port),
        username: config.database.user,
        password: config.database.password,
        database: config.database.name,
        entities: [path.posix.join(__dirname, '/entities/*.entity{.ts,.js}')],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([User]),
    GraphQLModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        path: '/graphql',
        installSubscriptionHandlers: true,
        autoSchemaFile: true,
        useGlobalPrefix: true,
        debug: config.env.isDev,
        playground: config.env.isDev,
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        context: ({ req, res }) => ({ req, res }),
      }),
    }),
  ],
  providers: [UserResolver],
})
export class GraphqlModule {}
```

### 思考和问题

#### 项目目录结构问题

Nestjs 的思想是以模块为单位划分功能，那么项目目录结构是应该以 Module 为单位，还是像传统 Web 框架一样按照 `controllers`, `services` 等为单位更合适呢？

- 以 Module 为单位

  > 每个 Module 内部也可以再按照 `controllers`, `services` 划分

```
project
├── modules
│   ├── config
│   │   ├── config.module.ts
│   │   └── config.service.ts
│   └── sample
│       ├── sample.controller.ts
│       ├── sample.module.ts
│       └── sample.service.ts
└── main.ts
```

- 传统 Web 框架

```
project
├── controllers
│   └── sample.controller.ts
├── modules
│   ├── config.module.ts
│   └── sample.module.ts
├── services
│   ├── config.service.ts
│   └── sample.service.ts
└── main.ts
```

目前我们的项目使用的是前者，以 Module 为单位划分目录更符合 Nestjs 的模块组成逻辑。

::: tip
像 Eggjs 这类框架，尊崇 “约定大于规范” 的思想，牺牲部分灵活性，将目录结构通过框架级的约定限制住。这在开发人员较多且流动较频繁时，是拥有一定优势的：只要熟悉该框架，就可以较快掌握项目逻辑。同时，也不会有目录规范该如何制定的烦恼。

而像 Nestjs 这类框架，虽然给了用户更多的自由，但官方尚未提供一些最佳实践方面的指导，导致不同项目可能会有很大的结构差异。

此外，也看到一些[讨论](https://github.com/xingyuzhe/blog/issues/1#issuecomment-417978007)，认为使用 Nestjs 组织代码的方式比 Eggjs 更优。只是不清楚他们具体是如何组织代码的。
:::

#### 依赖注入作用域的限制

依赖注入在 Nestjs 的 Module 内部用起来十分便利，但在某些情况下会受到作用域的限制：

- 在 Middlewares 和 Guards 中注入依赖。 

  Middlewares 和 Guards 本身不属于任何 Modules ，而是要在 Module 中使用时引入。那么，Middlewares 和 Guards 中需要注入的依赖，就必须在使用的 Module 作用域中可用，有时候不太直观。

- 在 `main.ts` (项目入口文件) 中使用模块内依赖。

  由于项目入口文件在所有模块之外，需要在创建 Nestjs App (`const app = await NestFactory.create(AppModule)`) 之后，通过 `app.get()` 方法来获取依赖。此时你获取到的依赖并不仅限于 `AppModule` 作用域内，而是从所有子模块的作用域内去解析，这导致个别情况下获取到的并不是你想要的依赖。为了避免这种情况，建议确保你想通过 `app.get()` 获取的依赖存在于 `AppModule` 的作用域内，这样 Nestjs 就不会再去解析子模块作用域了。

  此外，在使用 Express 生态的时候，也需要通过 `app.use()` 等方式进行调用，而不能在 Nestjs 的 Module 中使用，不太符合 Nestjs 本身的引用逻辑。
  
  > 比如 Express 中间件和 Nestjs 中间件本质上是一个东西，但是前者要 `app.use()`，后者要 `consumer.apply()`

## TypeORM 与 TypeGraphQL

我们的项目选择使用 [typeorm](https://typeorm.io) + [type-graphql](https://typegraphql.ml) 来构建 GraphQL API ，配合 [class-transformer](https://github.com/typestack/class-transformer#readme) 和 [class-validator](https://github.com/typestack/class-validator#readme) 来完成参数转换和校验。

### Entities & ObjectType

typeorm + type-graphql 可以通过单个 class 来同时声明 [Entities](https://typeorm.io/#/entities) 和 [ObjectType](https://typegraphql.ml/docs/types-and-fields.html) ，不需要额外去编写 GraphQL Schema 文件和 ORM 映射文件。

```ts
// user.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Field, ID, ObjectType } from 'type-graphql';

@Entity('t_users')
@ObjectType()
export class User {
  @PrimaryGeneratedColumn({ name: 'id' })
  @Field(() => ID)
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 128 })
  @Field()
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  @Field()
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  @Field()
  updatedAt: string;
}
```

### DTO & ArgsType

type-graphql + class-transformer + class-validator 可以通过单个 class 来同时声明 [DTO](https://docs.nestjs.com/controllers#request-payloads) 和 [ArgsType](https://typegraphql.ml/docs/resolvers.html#arguments) ，不需要额外去编写 GraphQL Schema 文件和 [参数验证逻辑](https://docs.nestjs.com/techniques/validation)。

```ts
// user.dto.ts
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Length, Min } from 'class-validator';
import { ArgsType, Field, ID } from 'type-graphql';

@ArgsType()
export class QueryUserDto {
  @Field(() => ID, { nullable: true })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  id?: number;

  @Field({ nullable: true })
  @IsOptional()
  @Length(1, 128)
  name?: string;

  @Field({ nullable: true })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  createdAt?: string;

  @Field({ nullable: true })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  updatedAt?: string;
}
```

### Repository & Resolver

通过 TypeORM 的 [Repository](https://docs.nestjs.com/techniques/database#repository-pattern) 和 TypeGraphQL 的 [Resolver](https://docs.nestjs.com/graphql/resolvers-map) 可以快速构建简单的 GraphQL API。

```ts
// user.resolver.ts
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { QueryUserDto } from '../dto/user.dto';

@Resolver(() => User)
export class UserResolver {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  @Query(() => User, { name: 'User', nullable: true })
  async getUser(@Args() args: QueryUserDto): Promise<User> {
    return this.repository.findOne({ where: args });
  }
}
```

### 思考和问题

#### 开发体验优秀

Nestjs 本身基于 TypeScript ，配合 TypeORM 和 TypeGraphQL ，开发中各种类型检查和代码提示都很全面，避免了很多类型方面的低级错误，也提高了开发效率。

GraphQL 只需要把所有可供查询的对象都封装好，消费方按需取用即可，使得 API 开发的工作量降低。

总而言之，整体的开发体验十分优秀。

#### 关联查询问题

目前在关联查询方面遇到一些问题。这里以 Nestjs 官网的[例子](https://docs.nestjs.com/graphql/resolvers-map) 来说明：

```ts {10,16}
@Resolver('Author')
export class AuthorResolver {
  constructor(
    private readonly authorsService: AuthorsService,
    private readonly postsService: PostsService,
  ) {}

  @Query('author')
  async getAuthor(@Args('id') id: number) {
    return await this.authorsService.findOneById(id);
  }

  @ResolveProperty('posts')
  async getPosts(@Parent() author) {
    const { id } = author;
    return await this.postsService.findAll({ authorId: id });
  }
}
```

假设这里的 `authorsService` 和 `postsService` 都是使用的 TypeORM Repository，那么在查询 `author` 时，如果需要获取该作者所有 `posts` ，就会分别生成两条 SQL 语句，而不是直接进行 JOIN 关联查询。这在数据量较大时，会造成比较严重的性能问题。

目前调研到如下解决方案：

- type-graphql 作者在考虑[如何让 type-graphql 与 typeorm 更好地集成](https://github.com/MichalLytek/type-graphql/issues/44)，避免大量的 SQL 查询数，但目前还没有太多进展。
- facebook 有一个 [dataloader](https://github.com/graphql/dataloader) 的解决方案，但本质上是做数据缓存，而不是 SQL 优化。
- [join-monster](https://github.com/acarl005/join-monster) 项目，将 GraphQL query 转化为 SQL，但目前还没有和 typeorm / type-graphql 较好的协同方式。
- type-graphql 社区有人提过初步的 [解决方案](https://github.com/MichalLytek/type-graphql/issues/405)，和 join-monster 十分类似，即通过 `GraphQLResolveInfo` 来生成对应的 typeorm 查询条件。我们的项目目前就是借鉴该方法的思路，将实现方式做了一些简化，仅针对部分数据量较大的查询接口进行了优化。

## 小结

Nestjs 的优势这里不多评说，仅列出一些问题。

- Nestjs 相当于在 Express 的基础上了增加了 Typescript 和依赖注入的支持，很多常用的功能还是要借助于 Nestjs 和 Express 生态来实现，如 config 和 logger 等模块仍需要自行实现或引入。相对于 Eggjs 这样的企业级 “全家桶” 框架，提供了更多灵活性，但缺少了开箱即用的便利性。不过 Eggjs 本身的定位是 “[框架的框架](https://github.com/xingyuzhe/blog/issues/1#issuecomment-416621181)”，和 Nestjs 并不在一个比较层面上。
- Nestjs 虽然兼容几乎所有的 Express 生态，但编写 Express 和编写 Nestjs 的风格是有一定差距的。具体问题在上文均有提到过，如何才能让 Nestjs 项目结构更加 “优雅” 也是一个值得探讨的问题。
- Nestjs 文档质量一般，条理不算清楚。很多用法都是 有人提问题 -> 作者解答 -> 加到文档里，所以你会发现文档中有很多代码示例，但并没有给出为何能这么使用的原因。 换句话说， Nestjs 的文档更像是教程和示例，并没有详细的 API 文档。好在 Nestjs 的社区比较活跃，大部分问题通过 StackOverflow 和 GitHub Issue 都能找到答案。

---

文章写得比较散，相当于这段时间使用 Nestjs 进行项目开发的简单笔记，还有待进一步的学习和实践。
