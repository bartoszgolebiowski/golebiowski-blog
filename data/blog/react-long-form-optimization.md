---
title: 'How to Handle Complex Long Forms: Optimization Methods'
date: '2023-05-03'
tags: ['React', 'Form', 'optimization', 'rerender', 'memoization']
draft: false
summary: 'Learn how to optimize complex long forms in React using memoization, useMemo, and other optimization techniques.'
---

# Introduction

If you've worked with React and long, complex forms before, you might have encountered performance issues caused by too many rerenders. In this article, we'll examine a example of a complex form with some render issues and explore four optimization methods to make it perform better:

- [useMemo](https://reactjs.org/docs/hooks-reference.html#usememo)
- [memo](https://reactjs.org/docs/react-api.html#reactmemo)
- [Debounce](https://www.npmjs.com/package/debounce)
- Multistep Forms

We'll explain each approach and show you how to implement them in your code.

Let's dive in!

## The naive approach

In the first section, we'll take a look at the naive approach to building a long and complex form in React. This approach involves using the built-in useState hook to store the state of the form, and deriving the errors from the form state. We'll be creating a form with 25 inputs, including basic inputs, selects, and a complex input that adds items to an array. The form also has complex validation logic and an HTTP requests for data. This form is too complex to be created as an uncontrolled component. To keep things simple, we'll be building everything with vanilla React, without using any third-party libraries.

![The form](/blog/react-long-form-optimization/form.png?style=centerme)

Unfortunately, every keystroke, selection, and item addition results in a rerender of all 25 inputs, making the form slow and unresponsive. To further compound the issue, I added a rerender counter and some heavy calculations to emphasize the inefficiency of the form. This will serve as our starting point for the optimization process.

Here is the [sourcecode](https://github.com/bartoszgolebiowski/react-long-form/blob/main/src/vanilla/Naive.tsx) and profiling [data](/blog/react-long-form-optimization/naive/profiling-data.05-02-2023.12-15-34.json) for naive approach. You can load it into the React Profiler to see the results. Single rerender takes around 54.65ms in production build.

## memo

React.memo is a [higher-order component](https://legacy.reactjs.org/docs/higher-order-components.html) that you can use to memoize a component. Memoization is a technique used to optimize performance by caching the result of a function so that it doesn't have to be recomputed every time it's called with the same input.

The React.memo function takes two arguments: the first argument is the component to be memoized, and the second argument is an optional comparison function. The comparison function is used to determine whether the component should be rerendered or not. If the comparison function returns true, the component will not be rerendered. If it returns false, the component will be rerendered.

```jsx
const TextFieldMemo = React.memo(
  TextField,
  (prev, next) => prev.value === next.value && prev.error === next.error
)
```

By default, React.memo will perform a shallow comparison of the component's props to determine whether it should be rerendered. However, if the props are complex objects, this shallow comparison may not be sufficient. In such cases, you can provide a custom comparison function as the second argument to React.memo that performs a deep comparison of the props. This way, you can ensure that the component only rerenders when the relevant props have actually changed. I use memo to memoize individual inputs of the form.

While using the React.memo, there were a few issues that had to be addressed.  
Firstly, inline event handlers change their reference on every re-render, so it is recommended to use the [useCallback](https://reactjs.org/docs/hooks-reference.html#usecallback) hook to deal with this. However, if the event handler is only using setState, it can be skipped in the dependency array of useMemo.  
Secondly, memoizing components with children can be difficult. In such cases, we need to first memoize the children components before memoizing the parent component.

![memo-form](/blog/react-long-form-optimization/memo/render.png?style=centerme)

Here is the [sourcecode](https://github.com/bartoszgolebiowski/react-long-form/blob/main/src/vanilla/Memo.tsx) and profiling [data](/blog/react-long-form-optimization/memo/profiling-data.05-02-2023.12-29-38.json) for memo approach. You can load it into the React Profiler to see the results. Single rerender takes around 5.6ms in production build. This is a 89.78% improvement over the naive approach.

```
(54.65 - 5.6) / 54.65 * 100% = 0.8978 * 100% = 89.78%
```

## useMemo

The useMemo hook is the second optimization method we'll explore. It's a hook that memoizes the result of a function call or a React Component. This hook is particularly useful when you have a function that gets called multiple times but only needs to be called once. This is exactly what we need for our complex long form - we want to memoize sections that don't change, so that we don't waste CPU resources by repeatedly rerendering them. I use useMemo to memoize sections of the form, instead of individual inputs.

I encountered a few issues while using useMemo, extactly the same as with memo. This is because useMemo and memo are very similar. The only difference is that useMemo is a hook, while memo is a higher-order component.

```jsx
const section1 = useMemo(
  () => (
    <Section
      section="section-1"
      values={createValues('section-1')}
      errors={createErrors('section-1')}
      selectOptions={createSelectOptions('section-1')}
      onChangeInputSelect={handleFormChangeInputAndSelect}
      onChangeDynamic={handleFormChangeDynamicInputs('section-1-dynamic-name-5')}
    />
  ),
  [
    formData['section-1-text-name-1'],
    formData['section-1-text-name-2'],
    formData['section-1-select-name-3'],
    formData['section-1-select-name-4'],
    formData['section-1-dynamic-name-5'],
    errors['section-1-text-name-1'],
    errors['section-1-text-name-2'],
    errors['section-1-select-name-3'],
    errors['section-1-select-name-4'],
    errors['section-1-dynamic-name-5'],
    selectOptions['section-1-select-name-3'].data,
    selectOptions['section-1-select-name-4'].data,
  ]
)
```

![useMemo-form](/blog/react-long-form-optimization/useMemo/render.png?style=centerme)

Here is the [sourcecode](https://github.com/bartoszgolebiowski/react-long-form/blob/main/src/vanilla/UseMemo.tsx) and profiling [data](/blog/react-long-form-optimization/useMemo/profiling-data.05-02-2023.12-54-16.json) for useMemo approach. You can load it into the React Profiler to see the results. Single rerender takes around 16.62ms in production build. This is a 69.75% improvement over the naive approach.

```
(54.65 - 16.62) / 54.65 * 100% = 0.6975 * 100% = 69.75%
```

## Mutlistep form

The third optimization method we'll explore is the multistep form. This is a form that is split into multiple steps, with each step containing a subset of the form fields. This is a common pattern in web applications, and it's particularly useful for long forms. By splitting the form into multiple steps, we can reduce the number of fields that need to be rendered at any given time, which can significantly improve performance. Unfortunately, this apporach requires the approvement of the client, so it is not always possible to implement it.

```jsx
<Wizard>
  <Step>
    <Section
      section="section-1"
      values={createValues('section-1')}
      errors={createErrors('section-1')}
      selectOptions={createSelectOptions('section-1')}
      onChangeInputSelect={handleFormChangeInputAndSelect}
      onChangeDynamic={handleFormChangeDynamicInputs('section-1-dynamic-name-5')}
    />
  </Step>
  <Step>
    <Section
      section="section-2"
      values={createValues('section-2')}
      errors={createErrors('section-2')}
      selectOptions={createSelectOptions('section-2')}
      onChangeInputSelect={handleFormChangeInputAndSelect}
      onChangeDynamic={handleFormChangeDynamicInputs('section-2-dynamic-name-5')}
    />
  </Step>
</Wizard>
```

![multistep-form](/blog/react-long-form-optimization/memo/render.png?style=centerme)

Here is the [sourcecode](https://github.com/bartoszgolebiowski/react-long-form/blob/main/src/vanilla/Wizard.tsx) and profiling [data](/blog/react-long-form-optimization/wizard/profiling-data.05-02-2023.13-30-48.json) for multistep approach. You can load it into the React Profiler to see the results. Single rerender takes around 13.52ms in production build. This is a 89.78% improvement over the naive approach.

```
(54.65 - 13.52) / 54.65 * 100% = 0.7531 * 100% = 75.31%
```

## debounce

Debounce is particularly useful for input fields, where the user is likely to type quickly, causing multiple onChange events to be triggered. By wrapping the onChange function in a debounce function, we can limit the number of times the function is called, improving the performance of the application.

To implement debounce in our complex long form, we first had to switch the controlled input components to uncontrolled. Then we set the state of the form using the debounce function. By doing this, we were able to reduce the number of times the form rerendered and improve the performance of the application.

It's worth noting that debounce is not a silver bullet for performance optimization, and it's important to use it judiciously. If the debounce time is set too long, it can cause the user to experience lag when typing, while a debounce time that is too short may not significantly improve performance. Finding the right balance is key.

![Debounce-form](/blog/react-long-form-optimization/debounce/render.png?style=centerme)

Here is the [sourcecode](https://github.com/bartoszgolebiowski/react-long-form/blob/main/src/vanilla/Debounce.tsx) and profiling [data](/blog/react-long-form-optimization/debounce/profiling-data.05-02-2023.13-08-00.json) for naive approach. You can load it into the React Profiler to see the results. Single rerender takes around 55ms in production build. In this case, debounce does not reduce the time of single rerender, but reduce the number of rerenders.

## Conclusion

![conclusion-chart](/blog/react-long-form-optimization/actualDuration.png?style=centerme)
[Results](/blog/react-long-form-optimization/mean.csv) of all approaches, naive, memo, useMemo, multistep and debounce for production build. I used the [Profiler API](https://pl.legacy.reactjs.org/docs/profiler.html) to measure the time of single rerender. React version [17.0.2](https://www.npmjs.com/package/react/v/17.0.2) and React DOM version [17.0.2](https://www.npmjs.com/package/react-dom/v/17.0.2).

In this article, we explored four different approaches to optimizing a complex long form. We started with a naive approach, which rendered the entire form on every change. Then we explored three different optimization methods: memo, useMemo, multistep and deboucne. Each of these methods has its own advantages and disadvantages, and it's important to understand the tradeoffs involved in each approach. By understanding these tradeoffs, we can make informed decisions about which approach is best for our application.

From my experience, the best approach is to wrap input components in memo. This approach is the easiest to implement and provides the best performance improvement. If you have a complex form with many fields, you can also consider using useMemo or multistep. These approaches are more complex to implement, but they can provide significant performance improvements. As last resort, you can use debounce, but it is not recommended. It is better to use it only for input fields, where the user is likely to type quickly, causing multiple onChange events to be triggered.
