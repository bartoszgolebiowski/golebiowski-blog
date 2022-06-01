---
title: 'React async form with single selection'
date: '2022-03-20'
tags: ['form', 'testing', 'swr', 'caching', 'tree', 'msw', 'hooks']
draft: false
summary: 'Periodically few inputs are related to each other, and options values inside depend on the previous option from another select input. We could define all possible outcomes and filter out records, but this could be inefficient. Another issue is that we could not add/remove options till the new production update. To resolve this issue we can send a request for options values for the specific select input.'
---

# Introduction

Periodically few inputs are related to each other, and options values inside depend on the previous option from another select input. We could define all possible outcomes and filter out records, but this could be inefficient. Another issue is that we could not add/remove options till the new production update. To resolve this issue we can send a request for options values for the specific select input.

In this article, I would like to share my solution to handle forms where select options are related to selected option from a previous input. We will use [React](https://github.com/facebook/react), [swr](https://github.com/vercel/swr), Testing framework [Jest](https://github.com/facebook/jest), and [React Testing Library](https://github.com/testing-library/react-testing-library). To mock requests [msw](https://github.com/mswjs/msw).

# Demo

[Sandbox](https://codesandbox.io/s/zen-hugle-jnthf5)

# Use case

Let's assume the following example.
The user wants to report a specific comment to the administrator.
So the form will consist of three select inputs:

- First select, the user will provide the username.
- Second select, the user will provide the post.
- Last select, the user will provide the comment.

![Async form vizualization](/blog/react-async-form/async-scenario.png?style=centerme)

Whenever the user fills up a single step, the request for new data will be made. The response from the request will fill up options for the following select inputs.

Selects inputs should contain descriptive name instead of object id.

# Implementation

In the beginning, I have created a custom hook responsible for obtaining data from the server. The first iteration of this hook will not use [swr](https://github.com/vercel/swr). This hook is responsible for sending a request to the server and filling up the options for the following select inputs. In case of an unselecting the option value, it will clean up the next selects accordingly.

```tsx
// Vanilla.ts
const useSelectOptions = (key: AllKeys, parentId: number | null): SelectValues => {
  const [isLoading, setLoading] = React.useState(false)
  const [isError, setError] = React.useState(false)
  const [values, setValues] = React.useState<OptionValue[] | null>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setError(false)
        setLoading(true)
        const response = await fetch(URLS[key](parentId))
        const data = await response.json()
        setValues(selectCasted(key, data))
      } catch (error) {
        setError(true)
      }
      setLoading(false)
    }
    if (parentId) {
      fetchData()
    } else {
      setValues(null)
    }
  }, [parentId, key])

  return { isLoading, isError, values }
}

const selectCasted = (key: AllKeys, data: AllResponses): OptionValue[] => {
  switch (key) {
    case 'user':
      return SELECT.user(data as User[])
    case 'post':
      return SELECT.post(data as Post[])
    case 'comment':
      return SELECT.comment(data as Comment[])
  }
}
```

To satisfy typescript **URL** and **SELECT** variables have been created with [const assertion](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions). Instead of defining The first custom hook argument **key** as a string, it can define it as a [Literal Type](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types).

Form keys were extracted into the **AllKeys** union. It will improve DX in case of extending this form with additional select inputs. Typescript will mark locations where the developer should make changes.

Example:
Method called: **selectCasted** will inform the developer about the missing key in the switch statement. It is called [union exhaustiveness checking](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#union-exhaustiveness-checking).

```tsx
// types.ts
export type FormValues = {
  user: number | null
  post: number | null
  comment: number | null
}

export type AllKeys = keyof FormValues

// contstant.ts
export const URLS = {
  user: (id: number | null) => `https://jsonplaceholder.typicode.com/users`,
  post: (userId: number | null) => `https://jsonplaceholder.typicode.com/users/${userId}/posts`,
  comment: (postId: number | null) =>
    `https://jsonplaceholder.typicode.com/posts/${postId}/comments`,
} as const

export const SELECT = {
  user: (users: User[]): OptionValue[] => users.map((user) => ({ id: user.id, name: user.name })),
  post: (posts: Post[]): OptionValue[] => posts.map((post) => ({ id: post.id, name: post.title })),
  comment: (comments: Comment[]): OptionValue[] =>
    comments.map((comment) => ({ id: comment.id, name: comment.name })),
} as const
```

The second implementation of the custom hook will be using [SWR](https://github.com/vercel/swr). It is a fast, lightweight, and reusable data fetching library. It encapsulates data fetching logic and features which improve UX like caching, invalidating stale data, optimistic updates.

```tsx
const useSelectOptions = (key: AllKeys, parentId: number | null) => {
  const { data, error } = useSWR<AllResponses>(calcKey(key, parentId), () =>
    fetcher(URLS[key](parentId))
  )

  return {
    values: data ? selectCasted(key, data) : null,
    isLoading: !data,
    isError: !!error,
  }
}

const calcKey = (key: AllKeys, parentId: number | null) =>
  !isNull(parentId) ? `${key}/${parentId}` : null
const isNull = (parentId: number | null) => value === null
const fetcher = (url: string) => fetch(url).then((r) => r.json())
```

The main difference between custom hook written with SWR library is cache. Whenever the user selects the same option, we will reuse the cached response.

# Testing

For vanilla React and SWR components test scenarios are identical.

1. The initial render should contain three select inputs, and the first one should be enabled and filled up with options.
2. Selecting option value should trigger request, and the response should fill up options for the following select inputs.
3. Unselecting option value should clear up select inputs accordingly.
4. Submit button should be enabled when all select inputs value are provided.

## The initial render should contain three select inputs, and the first one should be enabled and filled up with options.

The first scenario is not simple static testing. Asynchronous actions are triggered on the mount. Under the hood, it makes a request to the server for initial data for **user** select.

```tsx
it('should render three selects, user select should be enabled, post and comment should be disabled', async () => {
  render(<Component />)
  await waitFor(() => expect(screen.queryByLabelText(/User/i)).toBeEnabled())
  expect(screen.getByLabelText(/Post/i)).toBeDisabled()
  expect(screen.getByLabelText(/Comment/i)).toBeDisabled()
})
```

To make our tests more stable we will Mock by intercepting requests on the network level.

```tsx
// mocks/responses.ts
export const users = [...]
export const posts1 = [...]
export const posts2 = [...]
export const comments = [...]

// mocks/handlers.ts
export const handlers = [
  rest.get("https://jsonplaceholder.typicode.com/users", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(users));
  }),
  rest.get(
    "https://jsonplaceholder.typicode.com/users/1/posts",
    (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(posts1));
    }
  ),
  rest.get(
    "https://jsonplaceholder.typicode.com/users/2/posts",
    (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(posts2));
    }
  ),
  rest.get(
    "https://jsonplaceholder.typicode.com/posts/2/comments",
    (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(comments));
    }
  ),
];

// mocks/server.ts
export const server = setupServer(...handlers);

// setupTests.ts
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Selecting option value should trigger request, and the response should fill up options for the following select inputs and unselecting option value should clear up select inputs accordingly.

We add some interaction to our form. The user will select and unselect some values. We check if the form disables/enables select inputs accordingly.

```tsx
it('should enable post select, after selecting user from select input', async () => {
  render(<Component />)
  await waitFor(() => expect(screen.queryByLabelText(/User/i)).toBeEnabled())
  userEvent.selectOptions(screen.getByLabelText(/User/i), 'Leanne Graham')
  await waitFor(() => expect(screen.queryByLabelText(/Post/i)).toBeEnabled())
})

it('should enable comment select, after selecting post from select input', async () => {
  render(<Component />)
  await waitFor(() => expect(screen.queryByLabelText(/User/i)).toBeEnabled())
  userEvent.selectOptions(screen.getByLabelText(/User/i), 'Leanne Graham')
  await waitFor(() => expect(screen.queryByLabelText(/Post/i)).toBeEnabled())
  userEvent.selectOptions(screen.getByLabelText(/Post/i), 'qui est esse')
  await waitFor(() => expect(screen.queryByLabelText(/Comment/i)).toBeEnabled())
})

it('should clear post and comment selects, post select should be enabled, comment select should be disabled', async () => {
  render(<Component />)
  await waitFor(() => expect(screen.queryByLabelText(/User/i)).toBeEnabled())
  userEvent.selectOptions(screen.getByLabelText(/User/i), 'Leanne Graham')
  await waitFor(() => expect(screen.queryByLabelText(/Post/i)).toBeEnabled())
  userEvent.selectOptions(screen.getByLabelText(/Post/i), 'qui est esse')
  await waitFor(() => expect(screen.queryByLabelText(/Comment/i)).toBeEnabled())
  userEvent.selectOptions(screen.getByLabelText(/User/i), 'Ervin Howell')
  expect(screen.getByLabelText(/Post/i)).toHaveValue('')
  expect(screen.getByLabelText(/Comment/i)).toBeDisabled()
  expect(screen.getByLabelText(/Comment/i)).toHaveValue('')
})
```

## Submit button should be enabled when all select inputs value are provided.

We should disable submit button to prevent submitting a corrupted form. Our components do not provide the possibility to set initialValues, so in that case, we need to fill up the whole form to check if the button is enabled. This is not the optimal way to perform this test scenario.

```tsx
it('should enable submit button, when all selects are filled', async () => {
  render(<Component />)
  await waitFor(() => expect(screen.queryByLabelText(/User/i)).toBeEnabled())
  userEvent.selectOptions(screen.getByLabelText(/User/i), 'Leanne Graham')
  await waitFor(() => expect(screen.queryByLabelText(/Post/i)).toBeEnabled())
  userEvent.selectOptions(screen.getByLabelText(/Post/i), 'qui est esse')
  await waitFor(() => expect(screen.queryByLabelText(/Comment/i)).toBeEnabled())
  userEvent.selectOptions(screen.getByLabelText(/Comment/i), 'et omnis dolorem')
  await waitFor(() => expect(screen.queryByRole('button', { name: /submit/i })).toBeEnabled())
})
```

## Final thougth

The presented case is simple in a real scenario the client can ask for multiple selects with the possibility to pre-filled form with predefined form values. This example can be used as the first iteration of a complex solution.
