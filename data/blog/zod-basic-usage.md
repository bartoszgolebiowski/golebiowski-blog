---
title: 'Enhance Your Application`s Type Safety with Zod Library'
date: '2023-07-30'
tags: ['zod', 'JavaScript', 'validation', 'TypeScript', 'schema', 'typesafe']
draft: false
summary: 'Explore the ins and outs of ZOD, a robust validation library that simplifies data validation in your projects. Learn its key features, best practices, and how to integrate it into your applications for improved data integrity and reliability.'
---

# Introduction

In the dynamic world of JavaScript development, ensuring data integrity and type safety can be a challenging task. However, with the emergence of powerful libraries like [Zod](https://github.com/colinhacks/zod) developers now have a robust solution to enhance the safety and reliability of their codebases. Zod, a runtime type-checking library, is designed to streamline the process of defining data structures as types and validating them at runtime.

## What is Type Safety?

TypeScript provide a powerful mechanism to catch these issues during the compilation phase. TypeScript serves as a solution for enhancing code quality by enforcing type checks and offering valuable feedback during development.

However, it is important to note that while TypeScript guarantees type checks during development, **it does not provide runtime validation**. This is where Zod steps in, offering an additional layer of type safety at runtime. By leveraging Zod`s runtime type-checking capabilities, developers can verify the integrity of their data structures and ensure that the actual data adheres to the expected types, even after compilation. This seamless integration of type safety with runtime validation empowers developers to build more robust and reliable JavaScript applications with ease.

## Zod features

- **Type Safety**: Zod is a powerful tool that empowers developers to achieve robust type safety in their JavaScript applications. By providing a runtime type-checking mechanism, Zod allows developers to catch type errors early in the development process, thereby reducing the likelihood of runtime surprises. With Zod, you can be confident that your data structures adhere to the expected types, ensuring a higher level of data integrity and reliability. [The guide](https://github.com/colinhacks/zod/blob/master/ERROR_HANDLING.md#error-handling-in-zod) how to parse zod`s errors.

```ts
import { z } from 'zod'

const userSchema = z.object({
  name: z.string().min(3).max(50),
  age: z.number().int().positive(),
  email: z.string().email(),
})

const validUser = {
  name: 'John Doe',
  age: 30,
  email: 'john.doe@example.com',
} as unknown

const invalidUser = {
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
} as unknown

it('should validate a valid user', () => {
  const result = userSchema.safeParse(validUser)
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data).toEqual(validUser)
    expect(result.data.name).toBe('John Doe')
    expect(result.data.age).toBe(30)
    expect(result.data.email).toBe('john.doe@example.com')
    //@ts-expect-error field does not exist, typescript will complain
    expect(result.data.test).toBe(undefined)
  }
})

it('should fail for an invalid user (missing age property)', () => {
  const result = userSchema.safeParse(invalidUser)
  expect(result.success).toBe(false)
  if (!result.success) {
    expect(result.error.issues[0].code).toBe('invalid_type')
  }
})
```

- **Ease of Use**: One of the standout features of Zod is its user-friendly and intuitive API. Defining and working with schemas using Zod is straightforward, making it easy for developers to grasp and integrate into their projects. Here we have [json-to-zod](https://transform.tools/json-to-zod) website to convert json to zod schema. It is helpful when you want to create a schema from a json object, for example, from a response of an API.

```tsx
const schema = z.object({
  id: z.number(),
  name: z.string(),
  username: z.string(),
  email: z.string(),
  address: z.object({
    street: z.string(),
    suite: z.string(),
    city: z.string(),
    zipcode: z.string(),
    geo: z.object({ lat: z.string(), lng: z.string() }),
  }),
  phone: z.string(),
  website: z.string(),
  company: z.object({
    name: z.string(),
    catchPhrase: z.string(),
  }),
})

const getUsers = () =>
  fetch('https://jsonplaceholder.typicode.com/users')
    .then((res) => res.json())
    .then((users) => z.array(schema).parseAsync(users))

const App = () => {
  const query = useQuery(['todos'], getUsers)
  if (query.isLoading) return <div>Loading...</div>
  // query.data inferred type from zod schema
}
```

- **Extensibility and Composability**: Zod is designed to be highly extensible, enabling developers to create custom types and validations to suit their specific project requirements. It also allows to compose schemas from smaller schemas, making it easy to reuse and combine validation rules.

```ts
const addressSchema = z.object({
  street: z.string(),
  suite: z.string(),
  city: z.string(),
  zipcode: z.string(),
  geo: z.object({ lat: z.string(), lng: z.string() }),
})

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  username: z.string(),
  email: z.string(),
  address: addressSchema,
  phone: z.string(),
  website: z.string(),
  company: z.object({
    name: z.string(),
    catchPhrase: z.string(),
  }),
})
```

- **Zod Schemas as the Source of Types**: Zod takes a unique approach by using its schemas as the source of truth for types. This means that instead of defining types separately, Zod schemas serve as a single source of truth for both runtime validation and TypeScript type information. This integration simplifies the development process and ensures consistency between validation rules and data structures, making maintenance and refactoring a breeze.

```ts
const addressSchema = z.object({
  street: z.string(),
  suite: z.string(),
  city: z.string(),
  zipcode: z.string(),
  geo: z.object({ lat: z.string(), lng: z.string() }),
})

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  username: z.string(),
  email: z.string(),
  address: addressSchema,
  phone: z.string(),
  website: z.string(),
  company: z.object({
    name: z.string(),
    catchPhrase: z.string(),
  }),
})

// type infered from zod schema, no need to write by hand, sync with zod schema
type UserGood = z.infer<typeof userSchema>

// type written by hand, no sync with zod schema
type UserBad = {
  id: number
  name: string
  username: string
  email: string
  address: {
    street: string
    suite: string
    city: string
    zipcode: string
    geo: {
      lat: string
      lng: string
    }
  }
  phone: string
  website: string
  company: {
    name: string
    catchPhrase: string
  }
}
```

## Examples

### Validating form in the browser

Using Zod for form validation is a great choice as it brings the power of schema validation to your UI code. It ensures that the data submitted through forms follows the expected structure and meets the defined constraints, reducing the chances of incorrect or invalid data being processed by your application. Here is the example how to use zod with [react-hook-form](https://react-hook-form.com/)

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, { message: 'Required' }),
  age: z.number().min(10),
})

const App = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  })

  return (
    <form onSubmit={handleSubmit((d) => console.log(d))}>
      <input {...register('name')} />
      {errors.name?.message && <p>{errors.name?.message}</p>}
      <input type="number" {...register('age', { valueAsNumber: true })} />{' '}
      {errors.age?.message && <p>{errors.age?.message}</p>}
      <input type="submit" />
    </form>
  )
}
```

### Validating form on the server & browser\*

We can also use zod schema to validate form on the server. With proper project configuration, we can share the same schema between the server and the client. This approach ensures that the validation rules are consistent across the application, reducing the chances of bugs and errors. We can use production-ready frameworks like [next.js](https://nextjs.org/) or [remix.run](https://remix.run/) to share the same code between the server and the client. Here is the example with remix.run.

```tsx
import { useActionData } from '@remix-run/react'
import { DataFunctionArgs, json } from '@remix-run/server-runtime'
import { withZod } from '@remix-validated-form/with-zod'
import { validationError } from 'remix-validated-form'
import { z } from 'zod'

export const validator = withZod(
  z.object({
    name: z.string().min(1, { message: "Subject Name can't be empty 321" }),
    description: z.string().min(1, { message: "Subject Description can't be empty" }),
    email: z.string().email({ message: 'Invalid email address' }),
  })
)

export const action = async ({ request }: DataFunctionArgs) => {
  const data = await validator.validate(await request.formData())
  if (data.error) return validationError(data.error)

  const { description, email, name } = data.data
  return json({
    title: `Hello ${name}!`,
    description: `Your email is ${email} and your description is ${description}`,
  })
}

export default function Demo() {
  const data = useActionData<typeof action>()

  return (
    <ValidatedForm validator={validator} method="post">
      <FormInput name="name" label="Name" />
      <FormInput name="description" label="Description" />
      <FormInput name="email" label="Email" />
      <SubmitButton />
    </ValidatedForm>
  )
}
```

### Validating I/O reads

Validating I/O reads with Zod for fs.readFile in Node.js ensures data integrity, improves security, and simplifies maintenance. By enforcing validation, file content conforms to the expected structure, preventing inconsistencies. Gracefully handling errors avoids crashes and unexpected behavior, enhancing the reliability of your Node.js application. Zod's schema validation guarantees data consistency and security, making it a valuable tool for robust and secure file processing.

```ts
import * as fs from 'fs'
import path from 'path'
import { z } from 'zod'

const userSchema = z.object({
  name: z.string(),
  age: z.number().positive(),
  email: z.string().email(),
})

const correct = path.join(__dirname, '../assets', 'correct.json')
const incorrect = path.join(__dirname, '../assets', 'incorrect.json')

function readFileAndValidate(filePath: string) {
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    const userData = JSON.parse(data)
    const result = userSchema.parse(userData) // This will throw an error if the data doesn't match the schema
    console.log('Data is valid:', result)
    return result
  } catch (error) {
    console.error('Error reading the file or data validation failed:', error.message)
  }
}

readFileAndValidate(correct)
// Data is valid: { name: 'John Doe', age: 42, email: 'john.doe@example' }
readFileAndValidate(incorrect)
// Error reading the file or data validation failed: ...
```

### Validating I/O writes

Validating I/O writes with Zod ensures data integrity, security, and consistency by validating the data before writing it to files. Zod's schema validation helps prevent errors and simplifies maintenance, future-proofing your Node.js application with reliable data handling.

```ts
import * as fs from 'fs'
import path from 'path'
import { z } from 'zod'

const logSchema = z.object({
  timestamp: z.string().datetime(),
  message: z.string(),
  level: z.enum(['log', 'verbose', 'error']),
})

const log = path.join(__dirname, '../assets', 'log.txt')

function createLogger(filePath: string) {
  function appendToFile(message: unknown, level: string, filePath: string) {
    try {
      const logRaw = {
        timestamp: new Date().toISOString(),
        message,
        level,
      }
      const lowValidated = logSchema.parse(logRaw) // This will throw an error if the user data doesn't match the schema
      const logData = JSON.stringify(lowValidated) + '\n' // Convert log object to JSON and add a newline

      fs.appendFileSync(filePath, logData, 'utf8')
      console.log('Log appended to file:', log)
    } catch (error) {
      console.error('Data validation failed:', error.message)
    }
  }
  return {
    log: (logRaw: unknown) => appendToFile(logRaw, 'log', filePath),
    verbose: (logRaw: unknown) => appendToFile(logRaw, 'verbose', filePath),
    error: (logRaw: unknown) => appendToFile(logRaw, 'error', filePath),
    info: (logRaw: unknown) => appendToFile(logRaw, 'info', filePath),
  }
}

const logger = createLogger(log)

logger.error('This is an error message')
// Log appended to file: ...
logger.log('This is a log message')
// Log appended to file: ...
logger.verbose('This is a verbose message')
// Log appended to file: ...
logger.info('This is an info message')
// Data validation failed: ...
```

### Validating API requests!!!

Validating HTTP requests with Zod brings significant benefits to your TypeScript applications. By ensuring received data adheres to expected schemas, Zod enhances data integrity, security, and reliability. This validation process prevents processing faulty data, avoids security vulnerabilities, and reduces potential bugs, leading to a more robust error handling and improved user experience. Additionally, Zod simplifies data manipulation, code maintenance, and future-proofing, making it an essential tool for validating HTTP responses in your applications.

```tsx
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'

const addressSchema = z.object({
  street: z.string(),
  suite: z.string(),
  city: z.string(),
  zipcode: z.string(),
  geo: z.object({ lat: z.string(), lng: z.string() }),
})

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  username: z.string(),
  email: z.string(),
  address: addressSchema,
  phone: z.string(),
  website: z.string(),
  company: z.object({
    name: z.string(),
    catchPhrase: z.string(),
  }),
})

const getUsers = () =>
  fetch('https://jsonplaceholder.typicode.com/users')
    .then((res) => res.json())
    .then((users) => z.array(userSchema).parseAsync(users))

function App() {
  const query = useQuery(['todos'], getUsers)

  if (query.isError) {
    return <div>{JSON.stringify(query.error)}</div>
  }

  if (query.isLoading) {
    return <div>Loading...</div>
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Id</th>
          <th>Name</th>
          <th>Username</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        {query.data.map((user) => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>{user.name}</td>
            <td>{user.username}</td>
            <td>{user.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default App
```

# Summary

Zod is a powerful validation library that empowers developers to achieve type safety and data integrity in their applications. With its intuitive API, Zod makes it easy to define data structures as types and validate them at runtime. Whether used for form validation on the browser, server-side data handling, I/O reads and writes, or validating HTTP requests and many others, Zod ensures that data follows the expected structure and meets defined constraints, preventing errors. By seamlessly integrating with TypeScript, Zod streamlines development, simplifies maintenance, and future-proofs applications. With Zod, developers can build more reliable and secure JavaScript applications with confidence.
