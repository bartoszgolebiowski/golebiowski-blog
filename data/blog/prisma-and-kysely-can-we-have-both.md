---
title: 'Prisma and Kysely: Can we have both, and why?'
date: '2023-06-18'
tags: ['prisma', 'kysely', 'orm', 'sql', 'nodejs', 'typescript']
draft: false
summary: 'Developers can face the dilemma of choosing between Prisma and Kysely as their preferred database toolkit. Prisma offers a powerful ORM and database toolkit, while Kysely provides a lightweight and flexible SQL query builder. By combining the two, developers can leverage Prisma robust data modeling capabilities alongside Kysely versatile querying options, creating a comprehensive solution for efficient and scalable database management.'
---

# Prisma

## What is Prisma?

[Prisma](https://www.prisma.io/) is an open-source next-generation [ORM](https://www.prisma.io/dataguide/types/relational/what-is-an-orm#introduction) tool that provides a set of tools for developers to interact with databases in a more efficient and [type-safe manner](https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety/operating-against-partial-structures-of-model-types). It consists of several components, including [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/generating-prisma-client) and [Prisma Studio](https://www.prisma.io/docs/concepts/components/prisma-studio), and [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate). Prisma Client is an auto-generated and type-safe query builder for Node.js and TypeScript, while Prisma Studio is a GUI tool for viewing and editing data in the database. The [Prisma schema](https://www.prisma.io/docs/concepts/components/prisma-schema) is a file where developers define their application models in an intuitive data modeling language. It offers methods for querying, creating, updating, and deleting data in the database, and it provides benefits like static typing.

## How does Prisma work?

Prisma works by utilizing [Prisma engine](https://www.prisma.io/docs/concepts/components/prisma-engines). These engines are implemented in Rust and provide a low-level API that is used by the higher-level interfaces. The Prisma engine acts as the direct interface to the database, and all higher-level interfaces communicate with the database through this engine layer. For example, Prisma Client connects to the query engine to read and write data in the database.

![Prisma engine](https://www.prisma.io/docs/static/320926a7434b307f785cae5107e8e370/663f3/typical-flow-query-engine-at-runtime.png)

## Migrations

[Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate) is a database migration tool that helps manage changes to the database schema. Whenever developer makes changes to the Prisma schema, they can run the `prisma migrate dev` command to generate a migration file. This file contains the SQL statements that will be executed to update the database schema.  
Later on, when the application is deployed to production, the developer can run the `prisma migrate deploy` command to apply the migration to the database. Remeber to commit the migration file to the version control system.

```diff
model Product {
    id        String   @id
    createdAt DateTime @default(now())
    createdBy String
    updatedAt DateTime @updatedAt
    updatedBy String
    name      String
-   comment   String
}
```

```bash
$ npx prisma migrate dev --name drop_comment_for_product
```

File generated: `prisma/migrations/20230616092528_drop_comment_for_product.sql`

```sql
ALTER TABLE "LinePlan" DROP COLUMN "comment";
```

# Kysely

## What is Kysely?

[Kysely](https://github.com/kysely-org/kysely) is a type-safe and autocompletion-friendly TypeScript SQL query builder. A query builder helps developers construct SQL queries programmatically without the need for manual SQL coding. It is a lightweight alternative to ORMs. Kysely ensures that the queries are syntactically correct and type-safe at compile-time. Inspired by [Knex](https://github.com/knex/knex). It supports various features like subqueries, joins, and more, and offers auto-completion for enhanced development experience.

## How does Kysely work?

Kysely is a bridge between the database and the application. To make it type-safe, it uses TypeScript's type system to ensure that the queries are syntactically correct and type-safe at compile-time. The developer needs to provide the database schema to Kysely, and it will generate the types for the tables and columns. It provides a set of methods with autocompletion for constructing SQL queries. To sum up, Kysely just generates the SQL queries and executes them against the database.

## Migrations

Kysely provides a migration feature that allows you to manage and apply database schema changes over time. Migrations are written in TypeScript and are executed using the Kysely library. The migration process involves creating migration files, defining the necessary schema changes in the migration files, and running the migrations to apply the changes to the database. It does not provide a CLI tool for managing migrations, but it provides a set of APIs that can be used to create a [custom migration tool](https://github.com/acro5piano/kysely-migration-cli).

```typescript
import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Migration code to apply schema changes
}

export async function down(db: Kysely<any>): Promise<void> {
  // Migration code to revert schema changes
}
```

```typescript
import * as path from 'path'
import { env } from '~/env.mjs'
import { Pool } from 'pg'
import { promises as fs } from 'fs'
import { Kysely, Migrator, PostgresDialect, FileMigrationProvider } from 'kysely'

async function migrateToLatest() {
  const db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: env.DATABASE_URL,
      }),
    }),
  })

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'some/path/to/migrations'),
    }),
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`Migration "${it.migrationName}" was executed successfully.`)
    } else if (it.status === 'Error') {
      console.error(`Failed to execute migration "${it.migrationName}".`)
    }
  })

  if (error) {
    console.error('Failed to migrate:')
    console.error(error)
    process.exit(1)
  }

  await db.destroy()
}

migrateToLatest()
```

# Combining Prisma and Kysely

Disclaimer: This is my personal opinion.

## Querying

I would prefer to use Kysely.  
I would use a solution as close as possible to plain SQL. New libraries are created all the time, and it is hard to know which one will be maintained in the future.
But plain old SQL is a standard, and it will be supported for a long time. In case of Kysely solution will get outdated, it should be less time-consuming to switch to another query builder or just use plain SQL, that to switch from Prisma to another ORM.

How about type safety?

We will take advantage of [kysely-prisma](https://github.com/valtyr/prisma-kysely). It is a library that generates Kysely types from the Prisma schema.

## Models

I would prefer to use Prisma.  
In Prisma, the data model is defined in the [schema](https://www.prisma.io/docs/concepts/components/prisma-schema) and serves as the foundation for your application models. The data model defines the structure and relationships between your models, which map to tables or collections in your database. The Prisma schema is a declarative language that is used to define the data model. It is a very powerful tool that allows you to define the data model in a way that is easy to understand and maintain. Right now we do not have native support for [multiple schemas](https://github.com/prisma/prisma/issues/2377), but Prisma team is working on it.

There is [extension](https://marketplace.visualstudio.com/items?itemName=Prisma.prisma) for VS Code that allows highlighting syntax and provides auto-completion. There is also a tool that allows you to visualize the Prisma schema, like [Prisma Schema Visualizer](https://prisma-editor.up.railway.app/schema/store).

## Migrations

I would prefer to use Primsa.  
The huge advantage of Prisma is that it is just generating plain SQL migration scripts. Just modify the Prisma schema and run `prisma migrate dev` command. It will create a migration file for you.

To apply migrations to the database, simply execute the Prisma `prisma migrate deploy` command. This command will apply all migrations, including those that have already been applied and those that have not. You can create a new migration file and include SQL statements in it. This ensures that the migration is only applied once. It is a very convenient solution.

# Conclusion

Prisma provides better amazing DX. The [API](https://www.prisma.io/docs/concepts/components/prisma-client/crud) is intuitive, typescript friendly, and easy to use. It is also mature and has a large community. There can be some [issues](https://codedamn.com/news/product/dont-use-prisma) with performance, but Prisma provides an escape hatch to use [raw SQL](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#executerawunsafe) queries.

In general, Prisma is an excellent tool for building applications. But if you know from the beginning that you will need to deal with a huge amount of data, you should consider using plain SQL or query builder.

ORMs can boost your productivity, but it can also slow you down. It is a trade-off between productivity and performance.

Both Prisma and Kysely are great tools. They are both very powerful and easy to use. They both have their strengths and weaknesses. It is up to you to decide which one is better for your project. I hope this article has helped you make a decision.
