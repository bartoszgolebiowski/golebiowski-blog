---
title: 'CSV validation with Zod'
date: '2023-06-18'
tags: ['typescript', 'zod', 'csv', 'validation']
draft: false
summary: 'This article explores the use of Zod, a JavaScript library, for validating CSV content. It covers how Zod`s powerful schema validation can be applied to ensure the accuracy of imported data and enhance data integrity in systems.'
---

# Introduction

CSV files are a common way of exchanging data between systems. They are simple to create and can be opened in a variety of applications. However, they are not without their problems. CSV files are prone to errors, and it is not always easy to spot them. This article explores the use of [Zod](https://github.com/colinhacks/zod), a JavaScript library, for validating CSV content. It covers how Zod's powerful schema validation can be applied to ensure the accuracy of imported data and enhance data integrity in systems. To resolve this issue I have created a [zod-csv](https://github.com/bartoszgolebiowski/zod-csv#readme) package. It is a wrapper around Zod that allows you to validate CSV files. This library is heavy inspired by [zod-form-data](https://github.com/airjp73/remix-validated-form/tree/main/packages/zod-form-data) package.

# What is Zod?

Zod is a TypeScript-first schema declaration and validation library, offering a comprehensive set of tools for defining and enforcing validation rules. With its intuitive syntax and extensive feature set, Zod simplifies the process of validating data structures, types, and values in JavaScript applications. From simple field validations to complex data structures, Zod empowers developers to ensure the integrity and quality of their data with ease. Here you have amazing [free tutorial](https://www.totaltypescript.com/tutorials/zod) from [Matt Pocock](https://twitter.com/mattpocockuk) about zod.

# CSV Validation

Here we are using `zod-csv` package. It is a wrapper around Zod that allows you to validate CSV files. It has `parseCSVContent` method for validation CSV content against schema. The Schema is created with `zod-csv` methods, like `zcsv.string()` or `zcsv.number()`. We can extend validation option with `zod` methods, all we need to do is to pass `zod schema` as a first argument to `zcsv` method.

## Header validation

On the first step we need to read CSV file content. This content is representen as raw string. So we need to parse it to JavaScript objects.  
First row of CSV file is a header and it contains information about columns. We need to parse it to array of strings. Here is important to notice, that we do not want to import to the system all columns from CSV file. We want to import only columns that we need. The application should ommit all reduntant columns and import only columns that are defined in the schema. It should also provide information about missing columns if any.

Here is an example of CSV validation with `zod-csv` package.

```ts
import { parseCSVContent, zcsv } from 'zod-csv'
import { z } from 'zod'

it("should return error when CSV's header row is not valid with schema", () => {
  const csv = `name
  John,20
  Doe,30`
  const schema = z.object({
    name: zcsv.string(z.string().min(3)),
    age: zcsv.number(),
  })
  const result = parseCSVContent(csv, schema)
  expect(result.header).toEqual(['name'])
  expect(result.errors).toEqual({
    header: {
      errorCode: 'MISSING_COLUMN',
      header: 'age',
    },
  })
})
```

## Row validation

On the second step we need to validate all rows. We need to parse CSV content to array of objects. Each object represents one row. Here is important to notice, that we do not want to import to the system all rows from CSV file. We want to import only rows that we need. The application should ommit all reduntant rows and import only rows that are defined in the schema. It should also provide information about errors in rows if any.

Here is an example of CSV validation with `zod-csv` package.

```ts
import { parseCSVContent, zcsv } from 'zod-csv'

it('should return errors when dueDate is after startDate or startDate is missing', () => {
  const csv = `name,startDate,dueDate
John,2020-01-03,2020-01-02
John,2020-01-02,2020-01-02
Doe,2020-01-01,2020-01-02
Doe,,2020-01-02
Doe,2020-01-01,
Bill,2020-01-03,2020-01-02
Bill,,`

  const schema = z
    .object({
      name: zcsv.string(),
      startDate: zcsv.date(),
      dueDate: zcsv.date(),
    })
    .refine((data) => isDueDateEqualOrAfterStartDate(data.dueDate, data.startDate), {
      message: 'Due date must be after start date',
      path: ['dueDate'],
    })
  const result = parseCSVContent(csv, schema)
  expect(result.header).toEqual(['name', 'startDate', 'dueDate'])
  expect(result.validRows).toStrictEqual([
    {
      name: 'John',
      startDate: new Date('2020-01-02'),
      dueDate: new Date('2020-01-02'),
    },
    {
      name: 'Doe',
      startDate: new Date('2020-01-01'),
      dueDate: new Date('2020-01-02'),
    },
  ])

  const errors = result.errors.rows
  const firstRow = errors['0']
  const fourthRow = errors['3']
  const fifthRow = errors['4']
  const sixthRow = errors['5']
  const seventhRow = errors['6']
  expect(firstRow).toBeInstanceOf(ZodError)
  expect(fourthRow).toBeInstanceOf(ZodError)
  expect(fifthRow).toBeInstanceOf(ZodError)
  expect(sixthRow).toBeInstanceOf(ZodError)
  expect(seventhRow).toBeInstanceOf(ZodError)
})
```

Here is an example for CSV File object.

```ts
import { parseCSV, zcsv } from "zod-csv";

it('example usage file input', async () => {
    const csv = new File(
      [`name,age\nJohn,20\nDoe,30`;],
      "test.csv",
      {
        type: "text/csv",
      }
    );

    const schema = z.object({
        name: zcsv.string(),
        age: zcsv.number(),
    });

    const result = await parseCSV(csv, schema);
    expect(result.header).toEqual(["name", "age"]);
    expect(result.validRows).toStrictEqual([
        { name: "John", age: 20 },
        { name: "Doe", age: 30 },
    ]);
});
```

# Summary

I have developed this [zod-csv](https://github.com/bartoszgolebiowski/zod-csv) library with the aim of simplifying the process of validating CSV content using Zod schema. By utilizing Zod as a [peer dependency](https://nodejs.org/en/blog/npm/peer-dependencies), the package's JavaScript size is minimized. Additionally, I have included unit tests within the library to ensure that any potential regressions are caught, and [these](https://github.com/bartoszgolebiowski/zod-csv/blob/main/src/helpers.test.ts) [tests](https://github.com/bartoszgolebiowski/zod-csv/blob/main/src/csv.test.ts) can also serve as helpful examples.

This library is designed to be type-friendly, offering exported types, as well as both module and UMD versions, enabling seamless integration in both Node.js and browser environments. [Here](https://antfu.me/posts/publish-esm-and-cjs) you can read more about it. It provides a convenient and efficient solution for validating CSV data against Zod schema, promoting code reusability and compatibility across different platforms.
