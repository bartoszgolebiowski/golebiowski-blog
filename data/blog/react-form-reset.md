---
title: 'Form Reset Mastery in React: Effortlessly Restoring User Inputs'
date: '2023-05-14'
tags: ['React', 'Form', 'Reset', 'Controlled components', 'Uuncontrolled components', 'UX']
draft: false
summary: 'Learn how to reset forms to their initial state in React, whether you are working with controlled or uncontrolled inputs. This comprehensive guide provides step-by-step instructions for implementing form resets, ensuring a seamless user experience. Gain insights into managing form resets in React and choose the approach that suits your project`s needs.'
---

# Introduction

Forms are a fundamental part of web development, and the ability to reset them to their initial state is vital for enhancing user experiences. In this comprehensive article, we'll delve into the world of form resets in React, equipping you with practical strategies to effortlessly restore user inputs. Building upon the [React Tree Form Edit](https://bgolebiowski.com/blog/react-tree-form-edit), we'll expand its functionality by adding a clear function that can be utilized in any form solution.

# Demo

[Sandbox](https://codesandbox.io/p/github/bartoszgolebiowski/react-edit-form/master?file=/src/App.tsx:1,1&workspaceId=fd0b0a2c-04b1-49fb-ab9c-5b409574ffdd)

# Use case

Imagine a scenario where we are editing an existing item, but suddenly decide to undo all the actions performed and start afresh. In such cases, we can employ a clever technique using React's [key](https://react.dev/reference/react/useState#resetting-state-with-a-key) keyword. By assigning a unique key to the form component, we can effortlessly reset the form and restore its initial state, without the need for additional logic or memoization.

<details>
When the "key" prop of a React component changes, it triggers the unmounting and remounting of that component. This behavior is part of React's [reconciliation](https://react.dev/learn/preserving-and-resetting-state) process, which is responsible for efficiently updating the user interface to reflect changes in the component tree.

React uses the "key" prop as a unique identifier for each component instance within a collection (e.g., in a list or when dynamically rendering components). [When the "key" prop of a component changes](https://react.dev/learn/preserving-and-resetting-state#option-2-resetting-state-with-a-key), React interprets it as a signal that the component is different from its previous instance. As a result, React unmounts the old component and mounts a new one with the updated key value.

This unmounting and remounting process ensures that the component is re-initialized and re-rendered from scratch, effectively resetting its state and other internal properties. It provides a reliable way to manage component instances and maintain consistency in the component tree when dynamic changes occur.

By leveraging the "key" prop and taking advantage of React's unmount/remount behavior, we can effectively reset a component and restore its initial state when needed, such as in the scenario of undoing actions and starting afresh.

</details>

In addition to utilizing the "key" keyword for resetting controlled forms, we can also leverage the native [clear button](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/reset) approach for uncontrolled forms.

When working with uncontrolled forms, the native clear button allows users to easily reset the form inputs without the need for complex state management. By simply adding the "type" attribute with a value of "reset" to a button element within the form, users can trigger the form's built-in reset functionality.

## Unontrolled components

Uncontrolled components offer a straightforward approach for resetting forms. By including a `<button type="reset">...</button>` within the form structure, we can easily implement the form reset functionality. When this button is clicked, all inputs within the form will be set to their initial values specified in the "defaultValue" or "defaultChecked" [prop](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement#instance_properties). This approach simplifies the process of resetting uncontrolled forms, providing a convenient and user-friendly experience.

![Unontrolled components](/blog/react-form-reset/uncontrolled-form.gif?style=centerme)

```jsx
<form>
  <p>
    <label htmlFor="first">
      First:
      <input type="text" id="first" defaultValue="1" />
    </label>
  </p>
  <p>
    <label htmlFor="second">
      Second:
      <input type="text" id="second" defaultValue="2" />
    </label>
  </p>
  <p>
    <label htmlFor="third">
      Third:
      <input type="text" id="third" defaultValue="3" />
    </label>
  </p>
  <div>
    <button type="submit">Submit</button>
    <button type="reset">Restore initial state</button>
  </div>
</form>
```

## Controlled components

When dealing with more complex forms that do not align with the requirements of uncontrolled components, utilizing the "key" prop solution becomes beneficial. By passing the "key" prop to the component responsible for managing our form, we can effectively reset it without needing to modify the existing code within the component itself. This approach allows us to handle form resets in the parent component, offering flexibility and maintainability while ensuring a seamless user experience.

![Controlled components create](/blog/react-form-reset/controlled-form-create.gif?style=centerme)

This is a create form example:

```jsx
const [key, setKey] = React.useState(String(Date.now()))
const generateKey = () => setKey(String(Date.now()))
;<Form key={key}>
  <div>
    <button type="submit">Submit</button>
    <button type="button" onClick={generateKey}>
      Restore initial state
    </button>
  </div>
</Form>
```

![Controlled components edit](/blog/react-form-reset/controlled-form-edit.gif?style=centerme)

This is an edit form example:

```jsx
const [key, setKey] = React.useState(String(Date.now()))
const generateKey = () => setKey(String(Date.now()))
;<Form key={key} initialValues={initialValues}>
  <div>
    <button type="submit">Submit</button>
    <button type="button" onClick={generateKey}>
      Restore initial state
    </button>
  </div>
</Form>
```

# Conclusion

In conclusion, when it comes to resetting forms, the native approach with the `<button type="reset">...</button>` works perfectly for uncontrolled forms. It provides a simple and convenient way to reset the form inputs to their initial values specified in the "defaultValue" or "defaultChecked" prop.

However, for more complex forms that require controlled components, the native approach is not a valid option. In such cases, the "key" prop solution comes to the rescue. By assigning a unique key to the component responsible for managing the form, we can effectively reset the form without modifying the existing code within the component itself. It offers flexibility and maintainability, ensuring a smooth user experience.

When utilizing the "key" prop solution, it's important to keep in mind that the component will be unmounted and remounted. To optimize performance, we should aim to unmount and mount only the specific form part, rather than the entire page or component tree. This allows us to efficiently reset the form while minimizing unnecessary re-renders and ensuring a seamless user interface.

By understanding and implementing the appropriate form reset approach based on whether the form is controlled or uncontrolled, we can provide users with a user-friendly and intuitive experience when editing and resetting form inputs.
