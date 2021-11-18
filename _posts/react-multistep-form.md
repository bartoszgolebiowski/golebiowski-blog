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

# Scenario

Let's assume the following example.
The user has picked up some items from our site and wants to finalize the order. Unfortunately, the user does not have an account, so he needs to fill up address information before purchasing articles. 

So the form will consist of three steps:
- First step, the user will provide basic personal details.
- Second step, the user will provide address details.
- Last step, the user will provide credit card details. 
  
The user should have the possibility to navigate between steps. 

![Multistep form vizualization](/blog/react-multistep-form/multistep-scenario.png)

Every step should have validation, to minimalize possible issues with corrupted input data. The form should inform the user if provided data is not valid. 

The form should contain information about the current step like the title and how many steps are left. It should improve the user experience. 