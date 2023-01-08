---
title: 'React async edit form with multiple selection'
date: '2022-01-08'
tags: ['form', 'tree', 'testing', 'async', 'react-query', 'selectors', 'immer']
draft: false
summary: 'Lazy loaded options allow users to search and select options from a list without the need to load all the options at once. This can be especially useful for forms with a large number of options or for options that are constantly changing.
In this post, we will cover the simples approach for implementing async options in your forms, including using AJAX requests and APIs. We will simplify from previous blog post and add initialValues to make it possible to use this form, as an edit form.'
---

# Introduction

In this post, we will cover the simples approach for implementing async options in your forms, including using AJAX requests and APIs. We will simplify from previous blog post and add initialValues to make it possible to use this form, as an edit form.
This is improved version of [React tree form with multiple selection](https://bartoszgolebiowski.com/blog/react-tree-form).

# Demo

[Sandbox](https://codesandbox.io/p/github/bartoszgolebiowski/react-edit-form/draft/inspiring-payne)

# Use case

As a moderator on a social media app, it's important to have the tools and resources necessary to properly handle reports of inappropriate behavior. In this tutorial, we will be focusing on building a form that allows you to easily and efficiently manage reports of misbehaving users on your platform.

Our form will consist of three select inputs, which will allow you to select the relevant user accounts, posts, and comments for review. We will also show you how to unselect a user from the form and remove all related comments, while leaving the rest of the comments unchanged.

By the end of this article, you will have a functional form that will help you manage reports of inappropriate behavior on your social media platform, ensuring that you can maintain a positive and safe environment for all users.

![Async tree form vizualization](/blog/react-tree-form-edit/tree-scenario.gif?style=centerme)

## First scenario

We will be focusing on the scenario where we want to unselect a specific comment from a form that does not have any children items

![Unselect comment](/blog/react-tree-form-edit/tree-example3.png?style=centerme)

## Second scenario

We will be focusing on the scenario where we want to unselect a specific post or user from a form that has children elements. When an item is unselected, it should also include all of its children elements, which may have their own children elements as well. To handle this, we will need to implement extra logic to ensure that all related records are properly cleaned up when an item is unselected.

![Unselect post with all children](/blog/react-tree-form-edit/tree-example1.png?style=centerme)
![Unselect user with all children](/blog/react-tree-form-edit/tree-example2.png?style=centerme)

## Third scenario

We will use single form for both create and edit functionality can improve the user experience by streamlining the process and reducing the number of steps required to complete a task. It can also reduce the amount of code and maintenance required, as you only need to maintain a single form instead of multiple ones.

![Use as edit form](/blog/react-tree-form-edit/tree-scenario-3.png?style=centerme)

# Implementation

Storing form values as a [tree structure](<https://en.wikipedia.org/wiki/Tree_(data_structure)>) can simplify the algorithms for adding new values and deleting all child elements. Instead of storing form values as an array, we can use keys to represent the selected values, creating a hierarchy of values within the tree.

![Tree visualization](/blog/react-tree-form-edit/tree-visualization.png?style=centerme)

Overall, using a tree structure to store form values can provide a more efficient and flexible way to manage data within a form for our use case. However, it can be difficult to work with a tree structure in a form, as it can be difficult to keep track of the parent and child elements.

To convert a rigid tree structure into a more flexible and easy-to-manipulate form, we can use selectors. Selectors are methods that allow us to extract specific data from a complex structure and transform it into a simpler form. For example, we can use selectors to extract all of the child elements of a specific node in the tree and store them in a separate array.

Selectors can be a useful tool in the Redux JavaScript library for simplifying access or [encapsulating state shape](https://redux.js.org/usage/deriving-data-selectors#encapsulating-state-shape-with-selectors) to data in complex data structures. They can be used to extract specific pieces of information from the store and transform it into a more manageable form.

Selectors are often used in conjunction with [normalized data structures](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#managing-normalized-state-with-createentityadapter), which are designed to reduce redundancy and make it easier to update and manipulate data. Normalized data structures typically consist of a collection of entities, each with a unique identifier, and a separate collection of relationships between the entities. Selectors can be used to extract specific entities or relationships from the store and transform them into a format that is more useful for the application.

# State management

We will split our state into two parts. First part will be used to store form values and second part will be used to store options for select inputs. We will use [react-query](https://react-query.tanstack.com/) to fetch options from API.

## Form values

We will store form values as a tree structure. We will use [immer](https://immerjs.github.io/immer/docs/introduction) to simplify state updates.
We extracted logic to the reducer to make it easier to test.

_[getAllNodesForLevel](https://github.com/bartoszgolebiowski/react-edit-form/blob/master/src/form/formReducer.ts#L30)_ function returns all nodes for specific level, where:

- Level 0 is the root level (Users)
- Level 1 is the first level (Posts)
- Level 2 is the second level (Comments)

_[formReducer](https://github.com/bartoszgolebiowski/react-edit-form/blob/master/src/form/formReducer.ts#L61)_ function contains logic for adding and removing values from the tree.

```ts
export const getAllNodesForLevel = (
  tree: FormTree,
  level: number
): [FormTree[], (() => FormTree)[]] => {
  // If we're at the root level, there are no children, so just return the root node
  if (level === 0) return [[tree], []]

  // A list of all nodes at the current level
  const nodes: FormTree[] = []

  // A list of functions for getting the parent of each node at the current level
  const parentGetters: (() => FormTree)[] = []

  // Traverse the tree, starting at the root and going down one level at a time
  const traverse = (tree: FormTree, level: number) => {
    // For each node in the current level...
    Object.keys(tree).forEach((key) => {
      const node = tree[key]

      // If the current level is 1, add the child node to the nodes array and add a getter for the parent node to the parentGetters array
      if (level === 1) {
        nodes.push(node)
        parentGetters.push(() => tree)
      } else {
        // Otherwise, traverse the child node
        traverse(node, level - 1)
      }
    })
  }
  traverse(tree, level)

  return [nodes, parentGetters]
}

export const formReducer = (state: FormTree, action: Actions): FormTree => {
  switch (action.type) {
    case 'CHANGE_VALUE':
      return produce(state, (draft) => {
        const { id, parentId, level } = action.payload // get the id, parentId, and level from the action payload
        const [nodes, parentsGetters] = getAllNodesForLevel(draft, level) // get all the nodes for the level specified by the action payload
        const node = nodes.find((node) => node[id]) // find the node with the id specified by the action payload
        if (node) {
          // if the node exists
          delete node[id] // delete the node
          return draft // return the draft
        }

        if (level === 0) {
          // if the level is 0, which means the node is a root node
          draft[id] = {} // set the draft node with the id specified by the action payload to an empty object
          return draft // return the draft
        }

        if (parentId === null) {
          // if the parentId is null, which means the node is a root node
          draft[id] = {} // set the draft node with the id specified by the action payload to an empty object
          return draft // return the draft
        }

        parentsGetters.forEach((getParent) => {
          // for each parent getter
          const parent = getParent() // get the parent
          if (Object.keys(parent).includes(parentId)) {
            // if the parent has the parentId specified by the action payload
            parent[parentId][action.payload.id] = {} // set the parent node with the id specified by the action payload to an empty object
          }
        })
        return draft // return the draft
      })
    default:
      return state
  }
}
```

## Selectors

We will use [selectors](https://github.com/bartoszgolebiowski/react-edit-form/blob/master/src/form/formReducer.ts#L96) to extract specific data from the store and transform it into a more manageable form.

```ts
export const selectUsers = (state: FormTree) =>
  getAllNodesForLevel(state, 0)[0].flatMap((node) => Object.keys(node))
export const selectPosts = (state: FormTree) =>
  getAllNodesForLevel(state, 1)[0].flatMap((node) => Object.keys(node))
export const selectComments = (state: FormTree) =>
  getAllNodesForLevel(state, 2)[0].flatMap((node) => Object.keys(node))
```

## Options

We will use [react-query](https://react-query.tanstack.com/) to fetch options from [API](https://github.com/bartoszgolebiowski/react-edit-form/blob/master/src/form/api.ts). We will utlize _[select](https://tanstack.com/query/v4/docs/react/guides/migrating-to-react-query-3#query-data-selectors)_ method to extract specific data from the store and transform it into a more manageable form.

```ts
export const useSelectValues = (users: string[], posts: string[]) => {
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    initialData: [],
    select: (data) => data.map((user) => ({ id: user.id, display: user.name })),
  })

  const postsQuery = useQuery({
    queryKey: ['posts', users],
    queryFn: () => getPosts(users),
    initialData: [],
    select: (data) =>
      data.map((post) => ({ id: post.id, display: post.title, parentId: post.parentId })),
  })

  const commentsQuery = useQuery({
    queryKey: ['comments', posts],
    queryFn: () => getComments(posts),
    initialData: [],
    select: (data) =>
      data.map((comment) => ({
        id: comment.id,
        display: comment.body,
        parentId: comment.parentId,
      })),
  })

  return {
    userOptions: usersQuery.data,
    postOptions: postsQuery.data,
    commentOptions: commentsQuery.data,
  }
}
```

We will attach additional data to options, so we can easily find parent of the option. To achieve this we will use [custom data attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*) _data-parent_ property. It will be used to find parent of the option. For testing purposes we will use _data-selected_ property.

```jsx
<label htmlFor="comments">
  Comments
  <select
    multiple
    id="comments"
    value={comments}
    onChange={handleChange(2)} // pass level to the handler
  >
    {commentOptions.map((element) => (
      <option
        key={element.id}
        value={element.id}
        data-parentid={element.parentId} // attach parent id to the option
        data-selected={comments.includes(element.id)} // attach selected state to the option
      >
        {element.display}
      </option>
    ))}
  </select>
</label>
```

# Testing

For me the most important tests are integration [tests](https://github.com/bartoszgolebiowski/react-edit-form/blob/master/src/form/__tests__/Form.test.tsx). They are the most reliable and the most difficult to write, but they are the most valuable.
From client point of view, the most important thing is that the application works as expected, so we will test it from the user's perspective.
Integration/unit tests can also be used as a documentation. They are a great way to show how the application works.
To [mock](https://github.com/bartoszgolebiowski/react-edit-form/blob/master/src/mocks/handlers.ts) API calls we will use [msw](https://mswjs.io/). It is a great tool for mocking API calls. It is easy to use and it is very reliable.

```jsx
describe('Form', () => {
  it('should render form without values and with options for users', async () => {
    renderWithProvider()
    await expectUserOptionsAvailable()
  })

  it('should render form with user and with options for users and posts', async () => {
    renderWithProvider({ 1: {} })
    await expectUserOptionsAvailable()
    await expectPostOptionsAvailable()
    expectUserOptionSelected()
  })

  it('should render form with user and post and with options for users and posts and comments', async () => {
    renderWithProvider({ 1: { 1: {} } })
    await expectUserOptionsAvailable()
    await expectPostOptionsAvailable()
    await expectCommentOptionsAvailable()
    expectUserOptionSelected()
    expectPostOptionSelected()
  })

  it('should render form with user and post and comment and with options for users and posts and comments', async () => {
    renderWithProvider({ 1: { 1: { 1: {} } } })
    await expectUserOptionsAvailable()
    await expectPostOptionsAvailable()
    await expectCommentOptionsAvailable()
    expectUserOptionSelected()
    expectPostOptionSelected()
    expectCommentOptionSelected()
  })
})
```

# Conclusion

In conclusion, this updated version of the form management system is slightly improved compared to the previous version. By splitting the logic responsible for handling form values and form options, we have created a more modular and flexible system.

We have also made use of native browser data attributes, which can be useful for storing additional information about an element that is not directly related to its content or presentation. This can be helpful for storing data that is needed by JavaScript code, but is not visible to the user.
