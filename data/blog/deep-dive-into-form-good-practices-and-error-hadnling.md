---
title: 'Deep Dive into Form Good Practices and Error Handling with React, Zod, MSW, and Vitest'
date: '2023-11-19'
tags: ['zod', 'msw', 'react', 'vite', 'vitest', 'msw-service-worker', 'form', 'formik']
draft: false
summary: 'In this article, I will show you how to handle form errors using React, Zod, Formik. You will learn how to create a form that supports both create and edit operations, how to fetch data for dynamic parts of the form with loading and error handling, how to validate the form using Zod, how to mock server errors using MSW, how to use Formik to manage the form state and submission. The form will also have features such as disabling during submission, displaying field errors, validating initial values when editing, and validating submit input when submitting. I will also cover some of the edge cases and best practices for form error handling with unit tests.'
---

# Why Form Error Handling is Important

Forms are complex even the simplest ones. Many things can go wrong when submitting a form.
Here I will list some problems that I will try to resolve in this article.

1. The user can submit invalid data.
2. The user can submit valid data, but the server can return an error.
3. The user can submit partially valid data, but we are missing feedback for some fields.
4. The user can edit corrupted items.
5. The user can edit the form during a long submit request.
6. The form can be submitted multiple times.
7. The async parts of the form can fail during loading.
8. When should we display errors, after submission or after blur?
9. The reset button should clear, or restore initial values for edit.
10. Should we clean up the form after successful submission?

## The user can submit invalid data

In real-world applications, we can not trust the user. Users can submit form with missing or invalid data.
We need to validate the form before submitting it to the server. Here I am talking about client-side validation. I suggest using [zod](https://zod.dev/) for form validation. If you are not familiar with zod, you can read my [article](https://bgolebiowski.com/blog/zod-basic-usage) about it.

```ts
// src/pokemons/schema.ts
export type PetFormValues = z.infer<typeof pokemonSchema>

export const ERROR_MESSAGES = {
  name: {
    required: 'Name is required',
    outOfRange: 'Name must be between 1 and 100 characters',
  },
  type: {
    required: 'Need to check at least one type',
  },
  rarity: {
    required: 'Rarity is required',
  },
  health: {
    outOfRange: 'Health value must be between 1 and 100',
  },
  attack: {
    outOfRange: 'Attack value must be between 1 and 100',
  },
  defense: {
    outOfRange: 'Defense value must be between 1 and 100',
  },
}

export const pokemonSchema = z.object({
  name: z
    .string({
      required_error: ERROR_MESSAGES.name.required,
    })
    .min(1, { message: ERROR_MESSAGES.name.outOfRange })
    .max(100, { message: ERROR_MESSAGES.name.outOfRange }),
  type: z.array(z.number().min(1)).min(1, { message: ERROR_MESSAGES.type.required }),
  rarity: z.number().min(1, { message: ERROR_MESSAGES.rarity.required }),
  stats: z.object({
    health: z
      .number()
      .min(1, { message: ERROR_MESSAGES.health.outOfRange })
      .max(100, { message: ERROR_MESSAGES.health.outOfRange }),
    attack: z
      .number()
      .min(1, { message: ERROR_MESSAGES.attack.outOfRange })
      .max(100, { message: ERROR_MESSAGES.attack.outOfRange }),
    defense: z
      .number()
      .min(1, { message: ERROR_MESSAGES.defense.outOfRange })
      .max(100, { message: ERROR_MESSAGES.defense.outOfRange }),
  }),
})
```

```tsx
// src/pokemons/PokemonForm.tsx
import { toFormikValidationSchema } from "zod-formik-adapter";

  return (
    <Formik
      validationSchema={toFormikValidationSchema(pokemonSchema)}
    >
     {...}
    </Formik>
   )
```

First, we create a zod schema for our form. Then we use [zod-formik-adapter](https://github.com/robertLichtnow/zod-formik-adapter#readme) to utilize the zod schema in Formik.
Zod schema provides us with amazing types and validation functionality. It can be used also to provide custom error messages for each field.
This approach will help us to prevent users from submitting invalid data. Here I have [unit tests](https://github.com/bartoszgolebiowski/react-form-error/blob/main/src/pokemons/__tests__/PokemonForm.test.tsx#L34-L92C5) which cover this scenario. But what if the server will return an error?

## The user can submit valid data, but the server can return an error

Even when the user submits valid data, the server can return an error. For example, the user can try to create a Pokemon with a name that already exists in the database. We need to handle this scenario. We should submit the valid form and in case of any server error display an error message. I will use the [useMutation](https://tanstack.com/query/latest/docs/react/reference/useMutation) hook from [react-query](https://tanstack.com/query/latest/docs/react/overview) to handle the form submission.

```tsx
// src/pokemons/PokemonForm.tsx
const PokemonForm = (props: Props) => {
  const submit = useSubmit(onSubmit);

  return (
    <Formik
      onSubmit={submit.onSubmit}
    >
        {...}
        {submit.error ? <SubmitError error={submit.error} /> : null}
    </Formik>
  );
};
```

```ts
// src/pokemons/form.ts
export const useSubmit = (onSubmit: (values: PetFormValues) => Promise<void>) => {
  const mutation = useMutation({
    mutationFn: (values: PetFormValues) => onSubmit(pokemonSchema.parse(values)),
  })

  return {
    error: mutation.error ? mutation.error.message : null,
    onSubmit: mutation.mutate,
  }
}
```

I highly recommend passing as a prop submit function to the form. We should use a simple [mock function](https://jestjs.io/docs/mock-functions) to simulate this behavior. It will simplify testing and allow us to mock it. Here is [unit test](https://github.com/bartoszgolebiowski/react-form-error/blob/main/src/pokemons/__tests__/PokemonForm.test.tsx#L115-L138) which covers this scenario. I also reuse the already existing zod schema to double-check if the form values are valid before submitting them to the server.

## The user can submit partially valid data, but we are missing feedback for some fields

This part is related to the first question, what if the user fills up only some fields and submits the form? We need to display errors for all fields that are invalid. In case of submission, we should validate all fields and display errors for all of them.

```tsx
// src/pokemons/PokemonForm.tsx
const PokemonBody = (props: Props) => {
  const { children } = props;
  const form = useForm();

  return (
    <div>
      <label style={{ display: "flex", flexDirection: "column" }}>
        {form.labels.name}
        <input {...form.fields.name} />
      </label>
      {form.errors.name ? <FieldError {...form.errors.name} /> : null}
      {...}
    </div>
  )
```

The red border around the field is not enough. We should display the error message accordingly. It is worth mentioning that validation can require more sophisticated logic than just checking if the field is empty. For example, we can check if the name is unique, if the email is valid, or if the password is strong enough.

## The user can edit corrupted items

What if the user edits a corrupted item? For example, the user can edit the Pokemon name to an empty string or wrong edit object structure. We should validate initial values before displaying the form.

```tsx

const PokemonForm = (props: Props) => {
  // src/pokemons/PokemonForm.tsx
  const { initialValues } = props;
  const initialValuesRef = React.useRef(initializeFormValues(initialValues));

  if (isInvalidInitialValues(initialValuesRef.current, initialValues)) {
    return <InitialValuesError error="Invalid initial values" />;
  }

  return (
    <Formik>
      {...}
    </Formik>
  );
};
```

I am using here [useRef](https://react.dev/reference/react/useRef) hook to store initial values in case of props change. The**initializeFormValues** method is responsible for distinguishing between create and edit modes. In the case of edit mode, it will return initial values from props. In the case of create mode, it will return default empty values. The**isInvalidInitialValues** method is responsible for checking if initial values are valid. It will return true if initial values are invalid, so we can display an error message. Here is [unit test](https://github.com/bartoszgolebiowski/react-form-error/blob/main/src/pokemons/__tests__/PokemonForm.test.tsx#L322-L340).

## The user can edit the form during long submit requests and the form can be submitted multiple times

What if the user edits the form during a long submit request? We should disable the form during submission. It will prevent the user from editing/submitting the form during submission. We can use isPending from [useMutation](https://tanstack.com/query/latest/docs/react/reference/useMutation) hook. Here is [unit test](https://github.com/bartoszgolebiowski/react-form-error/blob/main/src/pokemons/__tests__/PokemonForm.test.tsx#L140-L169).

```ts
// src/pokemons/form.ts
export const useSubmit = (onSubmit: (values: PetFormValues) => Promise<void>) => {
  const mutation = useMutation({
    mutationFn: (values: PetFormValues) => onSubmit(pokemonSchema.parse(values)),
  })

  return {
    isPending: mutation.isPending,
    onSubmit: mutation.mutate,
  }
}
```

```tsx
// src/pokemons/PokemonForm.tsx
const PokemonForm = (props: Props) => {
  const submit = useSubmit(onSubmit)

  return (
    <Formik onSubmit={submit.onSubmit}>
      <fieldset style={{ display: 'contents' }} disabled={isPending}>
        <PokemonButtons />
      </fieldset>
    </Formik>
  )
}
```

```tsx
// src/pokemons/PokemonButtons.tsx
const PokemonButtons = (props: React.PropsWithChildren<Props>) => {
  const { children, isValid = false } = props

  return (
    <>
      <button type="reset">Reset</button>
      <button type="submit" disabled={!isValid}>
        {children}
      </button>
    </>
  )
}
```

An amazing feature of **fieldset**, is that it will disable all inputs and buttons inside it. We can use it to disable the whole form during submission. To reset all default styles like border, we can use [contents](https://developer.mozilla.org/en-US/docs/Web/CSS/display#contents).
Also, we should disable the submit button when the form is invalid. To inject **isValid** prop to the PokemonButtons component I use [cloneElements](https://react.dev/reference/react/cloneElement#cloneelement) from **PokemonForm** component.

```tsx
// src/pokemons/PokemonForm.tsx
type Props = {
  children: React.ReactElement<{ isValid: boolean }>;
};

const PokemonBody = (props: Props) => {
  const { children } = props;
  const form = useForm();

  return (
    <div>
      {...}
      {React.cloneElement(children, {
        isValid: form.isValid,
      })}
    </div>
  );
};
```

# The async parts of the form can fail during loading

We can not trust the server. This case is often skipped in tutorials or even in production! If you care about users you should also handle the scenario, when select options are not fetched properly. We can use [MSW](https://mswjs.io/) to mock server responses for testing purposes. It will allow us to test our error-handling logic for the async part of our form. [Here](https://github.com/bartoszgolebiowski/react-form-error/blob/main/src/mocks/node.ts) is the logic responsible for mocking server responses in our unit tests. We can also use MSW to mock server responses within [browser](https://github.com/bartoszgolebiowski/react-form-error/blob/main/src/mocks/browser.ts). We share the same handlers for both cases.

```ts
export const useOptions = () => {
  const types = useQuery({ queryKey: [TYPES_QUERY_KEY], queryFn: getTypes })

  return {
    type: {
      isLoading: types.isLoading,
      isError: types.isError,
      options: types.data ?? [],
      retry: () => types.refetch(),
    },
  }
}
```

```tsx
// src/pokemons/PokemonForm.tsx
const PokemonBody = (props: Props) => {
  const form = useForm()

  return (
    <div>
      <fieldset
        disabled={form.options.type.isLoading}
        style={{
          border: form.options.type.isError ? '1px red solid' : '',
          opacity: form.options.type.isLoading ? 0.5 : 1,
        }}
      >
        <legend>{form.labels.type}</legend>
        {form.options.type.options.map((option) => (
          <label key={option.value}>
            <input
              {...form.fields.type}
              value={option.id}
              checked={form.fields.type.value.includes(option.id)}
            />
            {option.value}
          </label>
        ))}
        {form.options.type.isError ? <OptionsError retry={form.options.type.retry} /> : null}
        {form.errors.type ? <FieldError {...form.errors.type} /> : null}
      </fieldset>
    </div>
  )
}
```

```tsx
type Props = {
  retry: () => void
}

const OptionsError = (props: Props) => {
  const { retry } = props
  return (
    <p style={{ color: 'red' }}>
      <strong>Cannot load options</strong>
      <button type="button" onClick={retry}>
        Retry
      </button>
    </p>
  )
}
```

In our test scenario, we are mocking the server response to return an error. We should display an error message and retry button. We should also disable the fieldset during loading. Here is [unit test](https://github.com/bartoszgolebiowski/react-form-error/blob/main/src/pokemons/__tests__/PokemonForm.test.tsx#L214-L252).

## When should we display errors, after submission or after blur?

From my perspective, we should display an error message for the field after blur. It will allow the user to focus on the field and fix the error. But whenever the user submits the form, we should display errors for all fields. It will allow the user to fix all errors at once. Here is [unit test](https://github.com/bartoszgolebiowski/react-form-error/blob/main/src/pokemons/__tests__/PokemonForm.test.tsx#L34-L57).

```ts
// src/pokemons/form.ts
const formHelper = (form: ReturnType<typeof useFormikContext<PetFormValues>>) => {
    const fieldErrorId = (name: keyof PetFormValues) => `${name}-error`
    const fieldErrorIdNested = (name: keyof PetFormValues['stats']) => `${name}-error`
    const fieldErrors = (name: keyof PetFormValues) => ({
        id: fieldErrorId(name),
        message: `${form.errors[name]}`,
    })
    const fieldErrorsNested = (name: keyof PetFormValues['stats']) => ({
        id: fieldErrorIdNested(name),
        message: `${form.errors.stats?.[name]}`,
    })
    const isTouchedAndError = (name: keyof PetFormValues) => form.touched[name] && form.errors[name] as string
    const isTouchedAndErrorNested = (name: keyof PetFormValues['stats']) => form.touched.stats?.[name] && form.errors.stats?.[name] as string

    return {
        fieldErrors,
        fieldErrorsNested,
        isTouchedAndError,
        isTouchedAndErrorNested
    }
}

export const useForm = () => {
    const form = useFormikContext<PetFormValues>()
    const helpers = formHelper(form)

    const errors = {
        name: helpers.isTouchedAndError('name') ? helpers.fieldErrors('name') : undefined,
        type: helpers.isTouchedAndError('type') ? helpers.fieldErrors('type') : undefined,
        rarity: helpers.isTouchedAndError('rarity') ? helpers.fieldErrors('rarity') : undefined,
        health: helpers.isTouchedAndErrorNested('health') ? helpers.fieldErrorsNested('health') : undefined,
        attack: helpers.isTouchedAndErrorNested('attack') ? helpers.fieldErrorsNested('attack') : undefined,
        defense: helpers.isTouchedAndErrorNested('defense') ? helpers.fieldErrorsNested('defense') : undefined,
    }

    return {
        errors,
    } as const
};

```

The variable _errors_ stores all errors for the form. The variable _touched_ stores information about which fields were touched. We consider the field as touched when the user focuses on it and then leaves it.

## The reset button should clear, or restore initial values for edit?

I think that the reset button should restore initial values for edit and clear for create. Here is [unit test](https://github.com/bartoszgolebiowski/react-form-error/blob/main/src/pokemons/__tests__/PokemonForm.test.tsx#L342-L383) for edit, and [here](https://github.com/bartoszgolebiowski/react-form-error/blob/main/src/pokemons/__tests__/PokemonForm.test.tsx#L94-L113) for create.

```tsx
export const useSubmit = (onSubmit: (values: PetFormValues) => Promise<void>) => {
    const [key, setKey] = React.useState("")
    const resetForm = () => setKey(generateRandomString())

    const mutation = useMutation({
        mutationFn: (values: PetFormValues) => onSubmit(pokemonSchema.parse(values)),
        onSuccess: () => resetForm(),
    })

    return {
        key,
        onSubmit: mutation.mutate,
    }
}

// src/pokemons/PokemonForm.tsx
const PokemonForm = (props: Props) => {
  const { initialValues, onSubmit } = props;
  const initialValuesRef = React.useRef(initializeFormValues(initialValues));
  const submit = useSubmit(onSubmit);

  return (
    <Formik
      key={submit.key}
      initialValues={initialValuesRef.current}
      onSubmit={submit.onSubmit}
    >
      {...}
    </Formik>
  );
};
```

## Should we clean up the form after successful submission?

I think that we should clean up the form after successful submission. It will allow the user to create another Pokemon without clearing the form. But what we should do after a successful edit submission? I think that we should not clean up the form, but reinitialize it with new values. But the question is "Is it worth implementing it?". This is quite complex logic and do users need it? I suggest consulting it with the Product Owner or UX team.

# Summary

We've been diving into the world of form handling using React, Zod, Formik, MSW, and Vitest – and it's been quite the adventure! We explored various scenarios, from nailing down validation and submitting forms to handling loading states and making smooth edits.

Think of Zod schemas as the superheroes of forms! They bring type safety, validation logic, and amazing error messages to our form values. We even teamed up Zod with Formik using the zod-formik-adapter. We added the useMutation hook from react-query to effortlessly manage server responses and errors. We also show some handy tips for submitting forms, covering everything from disabling them to validating initial values and giving them a reset.

MSW It's an interesting tool for faking server responses during testing. And when it comes to testing form components and logic, Vitest is my choice.

From validation errors to network issues, we covered it all. I showed how to handle these challenges gracefully and provide users with helpful feedback.

To wrap it up, we shared some solid tips for working with forms in React – using controlled components and writing awesome tests. I hope you enjoyed this article and learned something new. If you have any questions or feedback, please let me know in the comments below!
