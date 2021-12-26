---
title: 'React multistep form with validation'
description: 'How to handle multistep forms in react with validation'
keywords: 'react,formik, system-ui, mutltiform, validation, yup'
slug: 'react-multistep-form'
excerpt: 'Forms are primary components available almost on any website. 
We are using them to collect information from users. 
Starting from a simple contact form to a complex multistep order form.
Managing multistep forms can be cumbersome, especially when we add custom validation.'
image: '/blog/react-multistep-form/cover.png'
date: '2021-11-14T13:25:52.919Z'
author: Bartosz Golebiowski

twitterCard: 'summary'
twitterSite: '@bgolebiowski24'
twitterTitle: 'React multistep form with validation'
twitterDescription: 'In this article, I would like to share my solution to handle complex multistep forms. I will use React as UI library, Formik as form library, and Yup as validation library.'
twitterImage: 'https://bgolebiowski.com/blog/react-multistep-form/twitter-cover.png'

ogTitle: 'React multistep form with validation'
ogDescription: 'In this article, I would like to share my solution to handle complex multistep forms. I will use React as UI library, Formik as form library, and Yup as validation library.' 
ogImage: 'https://bgolebiowski.com/blog/react-multistep-form/og-cover.png'
ogURL: 'https://bgolebiowski.com/blog/react-multistep-form'
ogSiteName: 'Golebiowski blog'
---

# Introduction

Forms are primary components available almost on any website. 
We are using them to collect information from users. 
Starting from a simple contact form to a complex multistep order form.
Managing multistep forms can be cumbersome, especially when we add custom validation. 

In this article I would like to share my solution to handle complex multistep forms.
I will use [React](https://github.com/facebook/react), [Formik](https://github.com/formium/formik) as form library, and [Yup](https://github.com/jquense/yup) as validation library. 

# Demo

[Sandbox](https://codesandbox.io/s/practical-payne-0fkkp?file=/src/App.tsx)

[Github Gist](https://gist.github.com/bartoszgolebiowski/ed7ce444a0fe1c2acf13a7b2dcec7463)

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


```TSX
import {
  Label,
  Input,
  InputProps,
  Text,
  Flex
} from "@theme-ui/components";
import { useField } from "formik";

interface Field extends InputProps {
  label: string;
}

const FieldInput = ({ label, ...props }: Field) => {
  const [field, meta] = useField(props);
  const shouldDisplay = meta.touched && meta.error

  return (
    <Flex>
      <Label>
        {label}
        <Input {...field} {...props} />
        {shouldDisplay ? (
          <Text>{meta.error}</Text>
        ) : null}
      </Label>
    </Flex>
  );
};
```

With this element, we can create a component responsible for containing inputs for a single step. To provide the best [accessibility](https://www.w3.org/WAI/tutorials/forms/labels/#associating-labels-implicitly) I put input as a child of label component. 

```TSX
import * as React from "react";
import { FormikConfig, FormikHelpers} from "formik";

type Values = {
  firstName: string;
  lastName: string;
  code: string;
  email: string;
  phone: string;
  cardNumber: string;
  cardExpiry: string;
  cardCVC: string;
};

type SingleStep = {
  validationSchema: FormikConfig<Values>["validationSchema"];
  onSubmit: FormikConfig<Values>["onSubmit"];
  label: string;
};

const SingleStep: React.FC<SingleStep> = (props) => {
  return <>{props.children}</>;  
};

const App = () => {
  <SingleStep
    label="Person details"
    onSubmit={(values, helper) => console.log("completed step number 1")}
    validationSchema={() => {
      return Yup.object().shape({
        firstName: Yup.string().required("Required"),
        lastName: Yup.string().required("Required"),
      });
    }}
  >
    <FieldInput placeholder="First name" label="First name" name="firstName" />
    <FieldInput placeholder="Last name" label="Last name" name="lastName" />
  </SingleStep>;
};
```

At first glance, the SingleStep component does not do anything. It just renders children. But we pass some additional props which we will use in another component responsible for managing multiple SingleStep components. [Accessing Children Components/Nodes](https://www.reactenlightenment.com/basic-react-components/6.8.html).
**onSubmit** will be invoked whenever the user successfully filled up the form and submit SingleStep. **validationSchema** will be used for validation SingleStep's form. When validation will pass, the user can submit the form. 

the Component used for collecting SingleStep components is called MultistepForm. 

```tsx
const MultistepForm: React.FC<FormikConfig<Values>> = (props) => {
  const [snap, setSnap] = React.useState<Values>(props.initialValues);
  const [step, setStep] = React.useState(0);
  const steps = React.Children.toArray(props.children) as React.ReactElement<
    SingleStep
  >[];
  const currentStep = steps[step];
  const stepProps = currentStep.props;

  const nextPage = (value: Values) => {
    setSnap(value);
    setStep(step + 1);
  };

  const prevPage = (value: Values) => {
    setSnap(value);
    setStep(step - 1);
  };

  const hasPrev = step !== 0;
  const hasNext = step !== steps.length - 1;

  const handleSubmit = (value: Values, helper: FormikHelpers<Values>) => {
    if (stepProps.onSubmit) {
      stepProps.onSubmit(value, helper);
    }
    if (!hasNext) {
      props.onSubmit(value, helper);
    } else {
      nextPage(value);
    }
  };

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
            <Text>{step + 1}/{steps.length}</Text>
          </Flex>
          {currentStep}
          <Flex>
            {hasPrev ? (
              <Button onClick={() => prevPage(formik.values)}>
                Previous
              </Button>
            ) : null}
            <Button type="submit">
              {hasNext ? "Next" : "Submit"}
            </Button>
          </Flex>
        </Form>
      )}
    </Formik>
  );
};
```

It is responsible for assembling SingleStep react's components. It also provides meta-information about the current form step number and basic functionality responsible for navigation between SingleStep components. The MultistepForm component sustains all SingleStep form values. The user can freely navigate through all form steps and values will persist.
It also extracts "onSubmit" and "validationSchema" props from the SingleStep component and injects them into Formik Component. Due to that our application will dynamically change Formik properties. 

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
