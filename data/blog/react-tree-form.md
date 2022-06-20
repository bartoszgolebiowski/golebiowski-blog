---
title: 'React async form with multiple selection'
date: '2022-06-20'
tags: ['form', 'formik', 'tree', 'testing', 'async']
draft: false
summary: 'Let`s assume a situation like this. You are a moderator on a social media app. You got the report that users with the nickname "Legend27" and "Bob123" do not behave well in the comment section. You just collected all suspicious comments, but the manager told you that "Legend27" is specially treated and can not get account suspension. To handle this situation you should unselect the "Legend27" value from the "users" input, and the application should clean up only values related to the unselected user, but the rest of the comments leave without modification.'
---

# Introduction

This article is the continuation of this [article](/blog/react-async-form) with extra steps. Instead of using single select inputs, we extend it to multiple select inputs. It has additional implications like cleaning up all children's values for the unselected item.

In this article, I would like to share my solution for handling forms with async option items with multiple selection inside select component.
We will use vanilla [React](https://github.com/facebook/react). Testing framework [Jest](https://github.com/facebook/jest) and [react-hooks-testing-library](https://github.com/testing-library/react-hooks-testing-library) for testing custom hooks.

# Demo

[Sandbox](https://codesandbox.io/s/recursing-hawking-zgy39z)

# Use case

Let's assume a situation like this. You are a moderator on a social media app. You got the report that users with the nickname "Legend27" and "Bob123" do not behave well in the comment section. You just collected all suspicious comments, but the manager told you that "Legend27" is specially treated and can not get account suspension. To handle this situation you should unselect the "Legend27" value from the "users" input, and the application should clean up only values related to the unselected user, but the rest of the comments leave without modification.

So the form will consist of three select inputs:

- First select, the user will provide the usernames.
- Second select, the user will provide the posts.
- Last select, the user will provide the comments.

![Async tree form vizualization](/blog/react-tree-form/tree-scenario.gif?style=centerme)

## First scenario

We want to unselect one specific comment which does not have any children items. This scenario is the simplest one. Zero additional javascript is required to fulfill this case.

![Unselect comment](/blog/react-tree-form/tree-example3.png?style=centerme)

## Second scenario

We want to unselect one specific post/user with children elements. Unselected item includes children elements and children elements can have additional children elements and so on. This scenario requires extra logic responsible for cleaning up all related records.

![Unselect post with all children](/blog/react-tree-form/tree-example1.png?style=centerme)
![Unselect user with all children](/blog/react-tree-form/tree-example2.png?style=centerme)

# Implementation

The most important part of this functionality is the mechanism for managing options, and values and clearing all children elements for the unselected item. This functionality is divided into two separate services. The first one is responsible only for obtaining data from the server, and the second one stores all values and options and returns API to manage those values.

## Values and options manipulation

The service is responsible for the manipulation of selected values and fetched options.
This service has been created in a functional style. The first two arguments are all values and the options related to the form. The result of this invocation is a function that requires the level of the select input. It will create the last function. The argument is the id of the selected/unselected item from the select input. This approach made this service flexible and easy to test.

```jsx
/**
 * Service used for manipulating values and options for select component
 * @param values Values of all select components
 * @param options Options of all select components
 * @returns (level:number) => (value:number) =>
 * where level is level of select component and value is value of select component
 */
export const selectServiceImpl = (values: Values, options: Options) => {
  const { findOptionsForLevel, findValuesForLevel } = selectors(values, options)
  return (level: number) => {
    const collectAllValuesToDelete = (toDelete: SingleValue[], value: number) => {
      const collectToDelete = (parentIdsToDelete: number[], level: number) => {
        if (parentIdsToDelete.length === 0) return
        const valuesLevel = findValuesForLevel(level)(mapToObject)
        const valuesToDelete = valuesLevel.filter(isParentIncluded(parentIdsToDelete))
        toDelete.push(...valuesToDelete)
        collectToDelete(valuesToDelete.map(mapToValue), level + 1)
      }

      collectToDelete([value], level + 1)
      return toDelete
    }

    return (value: number) => {
      const valueObj = values.find(sameLevelAndValue(level)(value))
      if (valueObj) {
        const elementsToDelete = collectAllValuesToDelete([valueObj], value)
        const removeValuesPredicate = (value: SingleValue) =>
          !elementsToDelete.some(sameLevelAndValue(value.level)(value.value))

        return values.filter(removeValuesPredicate)
      } else {
        return [
          ...values,
          {
            level,
            value,
            parent: findOptionsForLevel(level).find(isSameValue(value))?.parent ?? null,
          },
        ]
      }
    }
  }
}
```

## Data fetching

The custom hook is responsible for fetching data from the server. It receives two arguments. The first one is the level in the tree hierarchy **(for users it is 0, for posts, it is 1, and for comments, it is 2)**, and the second one is the async function used for fetching options for the next level. This argument is optional because the last select item does not need to fetch data. It returns all state and **onChange** method which is assigned to the select component, and is responsible for invoking logic responsible for managing state.
I take advantage of [JSDoc](https://jsdoc.app/index.html), to provide more information about the custom hook. When you hover over the "useOption" invocation in your codebase, modern IDE will display additional information included in the comment above function definition.

```jsx
/**
 * Custom hook used for creating properties for select component.
 * @param level positive integer, where 0 is the first select component.
 * @param getOptionsForNextLevel Promise based function that returns options for next select component.
 * @returns Object where:
 *    values which represents the selected values,
 *    options which represents the options for next select component
 *    onChange which represents the function to change the value of the select component.
 */
const useOptions = (
  level: number,
  getOptionsForNextLevel?: (ids: string[]) => Promise<Options>
) => {
  const { findOptionsForParents, findValuesForLevelAsStrings, invoke, setOptions, setValue } =
    useSelectContext();

  const value = findValuesForLevelAsStrings(level);
  const valueStableRef = value.join(",");
  const parentIds =
    level > 0 ? findValuesForLevelAsStrings(level - 1).map(Number) : "root";
  const options = findOptionsForParents(parentIds)(level);

  useEffect(() => {
    if (getOptionsForNextLevel) {
      const appendOptions = (options: Options) =>
        setOptions((prev) => removeDuplicate(prev.concat(options)));
      getOptionsForNextLevel(value).then(appendOptions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueStableRef]);

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    setValue(invoke(level)(value));
  };

  return {
    value,
    options,
    onChange,
  } as const;
};

export default useOptions;
```

# Testing

Out tests scenario should include:

1. The correctness of appending new values, removing chosen one with all related values.
2. Integration tests.

## The correctness of appending new values, removing chosen one with all related values.

The service for managing the state does not have any side effects. We will test it like a simple [reducer](https://redux.js.org/usage/writing-tests#example). Our service returns a new value state which we can assert.

```jsx
const V: Values = [
  { level: 0, value: 1, parent: null },
  { level: 1, value: 11, parent: 1 },
  { level: 1, value: 12, parent: 1 },
  { level: 2, value: 21, parent: 11 },
  { level: 2, value: 22, parent: 11 },
  { level: 2, value: 212, parent: 12 },
];

const O: Options = [
  { level: 0, value: 1, parent: null, label: "user1" },
  { level: 0, value: 2, parent: null, label: "user2" },
  ...
];

it("should add new value", () => {
  expect(selectServiceImpl([], O)(0)(1)).toEqual([
    {
      level: 0,
      value: 1,
      parent: null,
    },
  ]);
});

it("should remove value", () => {
  expect(
    selectServiceImpl(
      [
        {
          level: 0,
          value: 1,
          parent: null,
        },
      ],
      O
    )(0)(1)
  ).toEqual([]);
});

it("should remove value and all children 1", () => {
  expect(selectServiceImpl(V, O)(0)(1)).toEqual([]);
});

it("should remove value and all children 2", () => {
  expect(selectServiceImpl(V, O)(1)(11)).toEqual([
    {
      level: 0,
      parent: null,
      value: 1,
    },
    {
      level: 1,
      parent: 1,
      value: 12,
    },
    {
      level: 2,
      parent: 12,
      value: 212,
    },
  ]);
});

it("should remove value and all children 3", () => {
  expect(selectServiceImpl(V, O)(1)(12)).toEqual([
    {
      level: 0,
      parent: null,
      value: 1,
    },
    {
      level: 1,
      parent: 1,
      value: 11,
    },
    {
      level: 2,
      parent: 11,
      value: 21,
    },
    {
      level: 2,
      parent: 11,
      value: 22,
    },
  ]);
});
```

## Integration tests.

To test the custom hook, we will use [renderHook](@testing-library/react-hooks]). Our solution is utilizing [React Context](https://beta.reactjs.org/apis#context), and because of that inside unit tests, we need to wrap it with [Provider](https://react-hooks-testing-library.com/reference/api#wrapper). To render more than one custom hook, we can wrap it into the new custom hook.

```jsx

const getUsers = () =>
  Promise.resolve([
    { level: 0, value: 1, parent: null, label: "user1" },
    { level: 0, value: 2, parent: null, label: "user2" },
  ]);

const getPosts = (ids: string[]) =>
  Promise.resolve([
    { level: 1, value: 11, parent: 1, label: "post1" },
    ...
  ]);

const getComments = (ids: string[]) =>
  Promise.resolve([
    { level: 2, value: 21, parent: 11, label: "comment1" },
    ...
  ]);

it("should set correctly option values", async () => {
  const Wrapper: React.FC = (props) => (
    <SelectProvider {...props} getOptionsForRoot={getUsers}></SelectProvider>
  );

  const useCombinedHook = () => {
    const user = useOptions(0, getPosts);
    const post = useOptions(1, getComments);
    const comment = useOptions(2);

    return {
      user,
      post,
      comment,
    };
  };

  const { result, waitFor, waitForValueToChange } = renderHook(
    useCombinedHook,
    {
      wrapper: Wrapper,
    }
  );

  //user
  await waitFor(() =>
    expect(result.current.user.options).toEqual([
      { level: 0, value: 1, parent: null, label: "user1" },
      { level: 0, value: 2, parent: null, label: "user2" },
    ])
  );
  act(() => {
    result.current.user.onChange(onChangeEventMock("1"));
  });
  await waitForValueToChange(() => result.current.user.value);
  await waitFor(() => expect(result.current.user.value).toEqual(["1"]));
  act(() => {
    result.current.user.onChange(onChangeEventMock("2"));
  });
  await waitForValueToChange(() => result.current.user.value);
  await waitFor(() => expect(result.current.user.value).toEqual(["1", "2"]));
  //post
  await waitFor(() =>
    expect(result.current.post.options).toEqual([
      { level: 1, value: 11, parent: 1, label: "post1" },
      { level: 1, value: 12, parent: 1, label: "post2" },
      { level: 1, value: 13, parent: 1, label: "post3" },
      { level: 1, value: 14, parent: 2, label: "post4" },
      { level: 1, value: 15, parent: 2, label: "post5" },
    ])
  );
  act(() => {
    result.current.post.onChange(onChangeEventMock("11"));
  });
  await waitForValueToChange(() => result.current.post.value);
  await waitFor(() => expect(result.current.post.value).toEqual(["11"]));

  //comment
  await waitFor(() =>
    expect(result.current.comment.options).toEqual([
      { level: 2, value: 21, parent: 11, label: "comment1" },
      { level: 2, value: 26, parent: 11, label: "comment6" },
      { level: 2, value: 211, parent: 11, label: "comment11" },
      { level: 2, value: 212, parent: 11, label: "comment12" },
    ])
  );
  act(() => {
    result.current.comment.onChange(onChangeEventMock("21"));
  });
  await waitFor(() => expect(result.current.comment.value).toEqual(["21"]));
});
```

## Final thougth

I have encountered this issue during my task related to the complex tree selection functionality used for filtering items. This approach has some drawbacks like appending parentId to option item. The response can miss parentId, so it will require additional logic responsible for appending this id. This approach does not include server caching mechanisms, so every time whenever user selects a new value, it will trigger a new request to the server. To resolve this issue I suggest using [react-query](https://github.com/TanStack/query) or another solution. To sum up, it can be used as a proof of conept, for creating production-ready solution.
