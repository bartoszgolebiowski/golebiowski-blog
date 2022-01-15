---
title: 'React multistep form with validation'
date: '2021-11-14'
tags: ['form','validation','formik','yup','testing', 'multistep']
draft: false
summary: 'Forms are primary components available almost on any website. 
We are using them to collect information from users. 
Starting from a simple contact form to a complex multistep order form.
Managing multistep forms can be cumbersome, especially when we add custom validation.'
---

# Introduction

Forms are primary components available almost on any website.
We are using them to collect information from users.
Starting from a simple contact form to a complex multistep order form.
Managing multistep forms can be cumbersome, especially when we add custom validation.

In this article I would like to share my solution to handle complex multistep forms.
We will use [React](https://github.com/facebook/react), [Formik](https://github.com/formium/formik) as form library, and [Yup](https://github.com/jquense/yup) as validation library.
Testing framework [Jest](https://github.com/facebook/jest), and [React Testing Library](https://github.com/testing-library/react-testing-library).

# Demo

[Sandbox](https://codesandbox.io/s/peaceful-wilson-pckxl)

# Use case

Let's assume the following example.
The user has picked up some items from our site and wants to finalize the order. Unfortunately, the user does not have an account, so he needs to fill up address information before purchasing articles.

So the form will consist of three steps:

- First step, the user will provide basic personal details.
- Second step, the user will provide address details.
- Last step, the user will provide credit card details.

The user should have the possibility to navigate between steps.

![Multistep form vizualization](/blog/react-multistep-form/multistep-scenario.png?style=centerme)

Every step should have validation, to minimalize possible issues with corrupted input data. The form should inform the user if provided data is not valid.

The form should contain information about the current step like the title and how many steps are left. It should improve the user experience.

# Implementation

We will start from a basic form.
It will consist of the header, two inputs, and go next button. All fields are required, and whenever the user presses the go button, go to the next step, or display an error message under the input.

The first component we will create is a simple input field.
It will consist of a single label, a single input, and logic for displaying errors.

```tsx
import { Label, Input, InputProps, Text, Flex } from '@theme-ui/components'
import { useField } from 'formik'

interface Field extends InputProps {
  label: string
}

const FieldInput = ({ label, ...props }: Field) => {
  const [field, meta] = useField(props)
  const shouldDisplay = meta.touched && meta.error

  return (
    <Flex>
      <Label>
        {label}
        <Input {...field} {...props} />
        {shouldDisplay ? <Text>{meta.error}</Text> : null}
      </Label>
    </Flex>
  )
}
```

With this element, we can create a component responsible for containing inputs for a single step. To provide the best [accessibility](https://www.w3.org/WAI/tutorials/forms/labels/#associating-labels-implicitly) we put input as a child of label component.

```tsx
import * as React from 'react'
import { FormikConfig, FormikHelpers } from 'formik'

type Values = {
  firstName: string
  lastName: string
  code: string
  email: string
  phone: string
  cardNumber: string
  cardExpiry: string
  cardCVC: string
}

type SingleStep = {
  validationSchema: FormikConfig<Values>['validationSchema']
  onSubmit: FormikConfig<Values>['onSubmit']
  label: string
}

const SingleStep: React.FC<SingleStep> = (props) => {
  return <>{props.children}</>
}

const App = () => {
  ;<SingleStep
    label="Person details"
    onSubmit={(values, helper) => console.log('completed step number 1')}
    validationSchema={() => {
      return Yup.object().shape({
        firstName: Yup.string().required('Required'),
        lastName: Yup.string().required('Required'),
      })
    }}
  >
    <FieldInput placeholder="First name" label="First name" name="firstName" />
    <FieldInput placeholder="Last name" label="Last name" name="lastName" />
  </SingleStep>
}
```

At first glance, the SingleStep component does not do anything. It just renders children. But we pass some additional props which we will use in another component responsible for managing multiple SingleStep components. [Accessing Children Components/Nodes](https://www.reactenlightenment.com/basic-react-components/6.8.html).
**onSubmit** will be invoked whenever the user successfully filled up the form and submit SingleStep. **validationSchema** will be used for validation SingleStep's form. When validation will pass, the user can submit the form. The Component used for collecting SingleStep components is called MultistepForm.

```tsx
const MultistepForm: React.FC<FormikConfig<Values>> = (props) => {
  const [snap, setSnap] = React.useState<Values>(props.initialValues)
  const [step, setStep] = React.useState(0)
  const steps = React.Children.toArray(props.children) as React.ReactElement<SingleStep>[]
  const currentStep = steps[step]
  const stepProps = currentStep.props

  const nextPage = (value: Values) => {
    setSnap(value)
    setStep(step + 1)
  }

  const prevPage = (value: Values) => {
    setSnap(value)
    setStep(step - 1)
  }

  const hasPrev = step !== 0
  const hasNext = step !== steps.length - 1

  const handleSubmit = (value: Values, helper: FormikHelpers<Values>) => {
    if (stepProps.onSubmit) {
      stepProps.onSubmit(value, helper)
    }
    if (!hasNext) {
      props.onSubmit(value, helper)
    } else {
      nextPage(value)
    }
  }

  return (
    <Formik
      initialValues={snap}
      onSubmit={handleSubmit}
      validationSchema={stepProps.validationSchema}
    >
      {(formik) => (
        <Form>
          <Flex>
            <Text>{currentStep.props.label}</Text>
            <Text>
              {step + 1}/{steps.length}
            </Text>
          </Flex>
          {currentStep}
          <Flex>
            {hasPrev ? <Button onClick={() => prevPage(formik.values)}>Previous</Button> : null}
            <Button type="submit">{hasNext ? 'Next' : 'Submit'}</Button>
          </Flex>
        </Form>
      )}
    </Formik>
  )
}
```

It is responsible for assembling SingleStep react's components. It also provides meta-information about the current form step number and basic functionality responsible for navigation between SingleStep components. The MultistepForm component sustains all SingleStep form values. The user can freely navigate through all form steps and values will persist.
It also extracts **onSubmit** and **validationSchema** props from the SingleStep component and injects them into Formik Component. Due to that our application will dynamically change Formik properties.

This is how we combine all components to provide multi-step form functionality.

```tsx
<MultistepForm
  initialValues={initialValues}
  onSubmit={(value, helper) => {
    alert(JSON.stringify(value, null, 2));
  }}
>
  <SingleStep
    label="Person details"
    onSubmit={(values, helper) =>
      console.log("completed step number 1")
    }
    validationSchema={() => {
      return Yup.object().shape({...});
    }}
  >
    <FieldInput name="firstName"/>
    <FieldInput name="lastName"/>
  </SingleStep>
  <SingleStep
    label="Location details"
    onSubmit={(values, helper) =>
      console.log("completed step number 2")
    }
    validationSchema={() => {
      return Yup.object().shape({...});
    }}
  >
    <FieldInput name="email"/>
    <FieldInput name="phone"/>
  </SingleStep>
  <SingleStep
    label="Card details"
    onSubmit={(values, helper) =>
      console.log("completed step number 3")
    }
    validationSchema={() => {
      return Yup.object().shape({...});
    }}
  >
    <FieldInput name="cardNumber"/>
    <FieldInput name="cardExpiry"/>
    <FieldInput name="cardCVC"/>
  </SingleStep>
</MultistepForm>
```

Whenever the user passes validation **validationSchema** for a single step and submits form **onSubmit** will be invoked.
This MultistepForm can be used not only for creating new items but also works for editing purposes. It requires passing to the **initialValues** object with any values.

Currently, we have a solution for one specific multiform. It would be pretty hard to reuse it in other use cases. To resolve this situation, we can use [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html).

```tsx
interface Props<T> extends FormikConfig<T> {}

const MultistepForm = <T extends object>(props: Props<T>) => {
  const [snap, setSnap] = React.useState<T>(props.initialValues);
  const [step, setStep] = React.useState(0);
  const steps = React.Children.toArray(props.children) as React.ReactElement<
    SingleStepProps<T>
  >[];
  const currentStep = steps[step];
  const stepProps = currentStep.props;

  const nextPage = (value: T) => {...};
  const prevPage = (value: T) => {...};
  const handleSubmit = (value: T, helper: FormikHelpers<T>) => {...};

  return ...
}
```

Similar changes for SingleStepForm component types.

```tsx
export interface Props<T> {
  validationSchema: FormikConfig<T>['validationSchema']
  onSubmit: FormikConfig<T>['onSubmit']
  label: string
  children: React.ReactNode
}

const SingleStepForm = <T extends object>(props: Props<T>) => {
  return <>{props.children}</>
}
```

Modern IDE will understand interfaces and types, and we can take advantage of [IntelliSense](https://en.wikipedia.org/wiki/IntelliSense).

# Testing

To provide stable functionality we should create some [tests](https://kentcdodds.com/blog/write-tests#write-tests).
Out tests scenario should include:

1. The correct label for inputs for a specific single-step.
2. The correct metadata like title and step counter.
3. The single-step validation.
4. The integration.

## The correct label for inputs for a specific single-step and The correct metadata like title and step counter.

Simple static testing. We will not interact with our multi-step form. Every single step should have tests to make sure that title, counter and inputs are correct.

```jsx
it('should render person details with empty values and correct step number', async () => {
  render(<ContactForm {...props} />)
  expect(screen.getByText(/Person details/i)).toBeInTheDocument()
  expect(screen.getByRole('contentinfo', { name: 'step-1' })).toBeInTheDocument()
  expect(screen.getByLabelText(/first name/i)).toHaveValue('')
  expect(screen.getByLabelText(/last name/i)).toHaveValue('')
})
```

## The single-step validation.

Testing with a small amount of interaction. First, we check if validation works correctly for empty fields. Second tests test case with valid input form values. This initial input form values are provided via **initialValues** property.
It is important to check existing elements via [**getBy...**](https://testing-library.com/docs/queries/about/#types-of-queries) and non existing elements via [**queryBy...**](https://testing-library.com/docs/queries/about/#types-of-queries) Using **get** throws an error when an element was not found, but **query** returns null.

```jsx
it('should not redirect to next step when step is not filled', async () => {
  render(<ContactForm {...props} />)

  userEvent.click(screen.getByRole('button', { name: 'Next' }))
  await waitFor(() => expect(screen.queryAllByText(/required/i)).toHaveLength(2))
})

it('should render person details with filled values, next button should redirect to next step', async () => {
  const initialValues: Values = {
    ...defaultInitialValues,
    firstName: 'John',
    lastName: 'Doe',
  }

  render(<ContactForm {...props} initialValues={initialValues} />)

  expect(screen.getByLabelText(/first name/i)).toHaveValue(initialValues.firstName)
  expect(screen.getByLabelText(/last name/i)).toHaveValue(initialValues.lastName)
  userEvent.click(screen.getByRole('button', { name: 'Next' }))
  expect(screen.queryAllByText(/required/i)).toHaveLength(0)
})
```

## The integration.

It checks the whole component from start to end. This test contains all features covered like navigation and interacting with every single step form with assertions for metadata, function invocation, and so on.

```jsx
it('should be possible to fill all steps and submit form', async () => {
  const exampleValues: Values = {
    firstName: 'John',
    lastName: 'Doe',
    code: 'de8c7627dd023b4ee4f4eca10ca8871962c42f49d9c3103c2be135f7b94ca048',
    email: 'john.snow@gmail.com',
    phone: '+48123456789',
    cardNumber: '123456789012',
    cardExpiry: '12/20',
    cardCVC: '123',
  }

  render(<ContactForm {...props} />)
  const type = async (element: HTMLElement, value: string) => {
    userEvent.type(element, value)
    await screen.findByDisplayValue(value)
  }

  await type(screen.getByLabelText(/first name/i), exampleValues.firstName)
  await type(screen.getByLabelText(/last name/i), exampleValues.lastName)
  userEvent.click(screen.getByRole('button', { name: 'Next' }))
  await waitForElementToBeRemoved(() => screen.queryByText(/Person details/i))
  expect(onSubmitFirstStep).toBeCalled()

  await type(screen.getByLabelText(/code/i), exampleValues.code)
  await type(screen.getByLabelText(/email/i), exampleValues.email)
  await type(screen.getByLabelText(/phone/i), exampleValues.phone)
  userEvent.click(screen.getByRole('button', { name: 'Next' }))
  await waitForElementToBeRemoved(() => screen.queryByText(/location details/i))
  expect(onSubmitSecondStep).toBeCalled()

  await type(screen.getByLabelText(/card number/i), exampleValues.cardNumber)
  await type(screen.getByLabelText(/card expiry/i), exampleValues.cardExpiry)
  await type(screen.getByLabelText(/card cvc/i), exampleValues.cardCVC)
  userEvent.click(screen.getByRole('button', { name: /submit/i }))
  await waitFor(() => expect(onSubmitThirdStep).toBeCalled())
  expect(onSubmitFinal.mock.calls[0][0]).toStrictEqual(exampleValues)
})
```

A thing worth mentioning here is function **type**. It is responsible for filling up selected input. It also contains some [assertion](https://github.com/testing-library/user-event/issues/424#issuecomment-669270822). This assertion is used to remove **Warning: An update to App inside a test was not wrapped in act(...).** from console after running tests. More information about this warning [here](https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning).

## Final thougth

I hope you have enjoyed it. Thank you for your time.
