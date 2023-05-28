---
title: 'Building Better Web Applications: Harnessing the Power of HTMX and Progressive Enhancement with Astro.build'
date: '2023-05-27'
tags: ['HTMX', 'astro.build', 'UX', 'Progressive Enhancement', 'Web Development']
draft: false
summary: 'By adopting Progressive Enhancement with HTMX and Astro.build, we can build web applications that are accessible and usable for a wider audience. We`ll show how even without JavaScript, our solutions still work, and with JavaScript enabled, we enhance the user experience by adding interactivity and responsiveness.'
---

# Introduction

Over the years, web pages and applications have become more interactive and reliant on JavaScript. However, this has created challenges for users who have limited browser capabilities or disable JavaScript. Many modern web applications don't work well without JavaScript or even don't work at all, leaving some users with a subpar experience.

In this article, we present an alternative approach called [Progressive Enhancement](https://www.gatsbyjs.com/docs/glossary/progressive-enhancement/#what-is-progressive-enhancement). It focuses on delivering a core functional experience to all users, regardless of JavaScript support. We'll explore how to achieve this using [HTMX](https://htmx.org/), a lightweight JavaScript library, and the [astro.build](https://astro.build/) framework for server rendering. For validation, we'll use [HTML5 Constraint Validation API](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation) and [Zod](https://github.com/colinhacks/zod) to validate the data on the server. We will also use [Tailwind CSS](https://tailwindcss.com/) for styling.

By adopting Progressive Enhancement with HTMX and Astro.build, we can build web applications that are accessible and usable for a wider audience. We'll show how even without JavaScript, our solutions still work, and with JavaScript enabled, we enhance the user experience by adding interactivity and responsiveness.

In this article we'll cover:

- Multistep form
- Pagination table

# Demo

[Sandbox](https://codesandbox.io/p/github/bartoszgolebiowski/htmx-astro/master?workspaceId=fd0b0a2c-04b1-49fb-ab9c-5b409574ffdd)

I encounter some issues with cookies in the code sandbox, so I recommend to [clone](https://github.com/bartoszgolebiowski/htmx-astro) the repo and running it locally.

# What is HTMX?

[HTMX](https://htmx.org/) is a JavaScript library that enables easy communication between the server and the client in web applications. It allows for dynamic updates and interactions without complex coding. HTMX also has enrolled in the [Github Accelerator Program](https://github.blog/2023-04-12-github-accelerator-our-first-cohort-and-whats-next/), which means that it's a well-maintained and actively developed project.

How HTMX looks like in practice? Let's take a look at the following example:

```html
<form
  class="mt-4 p-4 border border-gray-300 rounded-lg w-80"
  method="post"
  <!-- Begin HTMX attributes -->
  hx-post="/steps/step-1" 
  hx-target="#content" 
  hx-swap="innerHTML" 
  hx-push-url="/steps/step-2"
  <!-- End HTMX attributes -->
  >
  <label class="block mb-2">
    Name
    <input class="border border-gray-300 rounded-lg p-2 w-full" name="name" required />
  </label>
  <label class="block mb-2">
    Email
    <input
      class="border border-gray-300 rounded-lg p-2 w-full"
      type="email"
      name="email"
      required
    />
  </label>
  <div class="flex justify-between items-center mt-4 flex-row-reverse">
    <button
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
      type="submit"
    >
      Next
    </button>
  </div>
</form>
```

This is a simple HTML form that sends a POST request to the server when the user clicks the Next button. The server responds with a new HTML document that replaces the content of the #content element on the page. We need to have in mind that the new HTML document is not a full page, but rather a fragment of HTML that will be inserted into the DOM. The browser's history is also updated with a new URL.

The great thing about HTMX is that it gracefully degrades users who disable JavaScript. This means that even without JavaScript, your application's core functionality remains accessible and usable. However, with JavaScript enabled, HTMX enhances the user experience by enabling smooth and interactive interactions.

In a nutshell, HTMX makes it easy to create dynamic and interactive web experiences while ensuring accessibility and usability for all users, regardless of their browser capabilities or JavaScript preferences.

The size of the library is only [13.8 KB](https://bundlephobia.com/package/htmx.org@1.9.2) (minified and gzipped), so it's a great choice for projects that need to be lightweight and fast.

# What is Astro.build?

[Astro](https://astro.build/) is an amazing framework for building web applications. It's based on the idea of server rendering, which means that the HTML is generated on the server and then sent to the client. I won't go into details about how Astro works, but if you're interested, you can read more about it [here](https://docs.astro.build/en/guides/server-side-rendering/). The reason why I chose Astro for this article is that it allows me just to write HTML files and use HTMX without any additional configuration.

# Example

All examples are based on the same idea. Instead of making a request to the server and rendering a new HTML document, we'll use HTMX to fetch the data and update the page. This way, we can create a dynamic and interactive experience without writing any JavaScript code. On the top of the page, we have a generated timestamp, which is updated every page refresh. When the value is updated it means that we performed a hard reload.

Here is the folder structure, where within page components I just imported components from the HTMX folder.

![Multistep folder structure](/blog/htmx-astro/multistep-folder-structure.png?style=centerme)

It is super convenient because I can use composition and reuse components.

![Multistep folder structure](/blog/htmx-astro/page-htmx-composition.png?style=centerme)

## Multistep form

This is a simple multistep form that allows users to enter their name and email address and other fields. We will use native HTML5 validation to ensure that the user enters the correct data. The form will be submitted to the server when the user clicks the Next button.

### Javascript enabled

When the user clicks the Next button, HTMX sends a POST request to the server. The server responds with a new HTML document that replaces the content of the #content element on the page. The browser's history is also updated with a new URL.

![Multistep JavaScript enabled](/blog/htmx-astro/multistep-js-on.gif?style=centerme)

This form looks like it was written in React or other JavaScript frameworks, but it's just plain HTML. The only JavaScript code we need is HTMX, which is a lightweight library that makes it easy to create dynamic and interactive web experiences.

![Multistep requests](/blog/htmx-astro/multistep-requests.png?style=centerme)

To provide this functionality, the user needs to download 26.5 KB of resources (HTML, CSS, and JavaScript).

### Javascript disabled

When the user clicks the Next button, the browser sends a POST request to the server. The submission will reload the page and the user will see the next step of the form. The browser's history is also updated with a new URL. The browser has performed a hard reload, so the timestamp is be updated.

![Multistep JavaScript disabled](/blog/htmx-astro/multistep-js-off.gif?style=centerme)

This is what the user sees when JavaScript is disabled.

![Multistep requests](/blog/htmx-astro/multistep-requests-js-off.png?style=centerme)

The form is still functional, but it doesn't look as nice as when JavaScript is enabled. The user needs to download 11.3 KB of resources (HTML, CSS).

## Pagination

This is a simple pagination component that allows users to navigate between pages. We will use HTMX to perform updates on the page. The example consists of a page size selector and pagination buttons. We update the URL with the page number, so the user can share the link with others.

### Javascript enabled

When the Next button is clicked, HTMX initiates a GET request to the server. In response, the server sends a new HTML document that replaces the existing content within the #content element on the page. Additionally, the browser's history is updated with a new URL, reflecting the changes made through HTMX. The browser has performed a soft reload, so the timestamp is not updated.

![Pagination JavaScript enabled](/blog/htmx-astro/pagination-js-on.gif?style=centerme)

The network tab looks similar to the previous example, firstly the user will download the HTML, CSS, and JavaScript, but when the user clicks on the pagination buttons or page size selector only the partial HTML will be downloaded. The response only contains the HTML that needs to be updated.

### Javascript disabled

Upon clicking the Next button, the browser triggers a GET request to the server. The server responds by sending a new HTML document and performing a hard reload of the page. This action updates the browser's history with a new URL. Since a hard reload is executed, the timestamp in the browser is also updated to reflect the most recent changes.

![Pagination JavaScript disabled](/blog/htmx-astro/pagination-js-off.gif?style=centerme)

The pagination table is still functional.

# Conclusion

I'm pleasantly surprised by how straightforward it is to use HTMX with Astro. All I had to do was add the HTMX script tag, and voila! I could start using HTMX right away without any extra configuration.

Initially, it might be a bit tricky to switch to returning HTML documents for POST requests instead of JSON responses, but it's worth it for the benefits it brings to users. Instead of parsing JSON and updating the DOM on the client, we can simply return an HTML document and replace the content of the targeted element on the page. This approach simplifies the process and makes it easier to update the page's content.

The only thing I struggled with was the fact that I could not find the way to return Astro component as a response to a POST request, instead, I just make a redirect to the HTMX component.

```tsx
if (isHXRequest(Astro.request)) {
  return Astro.redirect('/htmx/step-2', 302)
}
return Astro.redirect('/steps/step-2', 302)
```

it would be nice to have something like this:

```tsx
if (isHXRequest(Astro.request)) {
  return Astro.render(<Step2 />)
}
return Astro.redirect('/steps/step-2', 302)
```

Zod is a amazing data validation library that can be used for both client-side and server-side validation. The same schema can be shared between the client and the server. However, when JavaScript is disabled, Zod will not work on the client, so I decided to use the browser's native HTML5 validation. For server-side validation, we continue to utilize Zod's powerful capabilities. This combination ensures comprehensive data validation and a smooth user experience across different scenarios.

HTMX is a great library for creating dynamic and interactive web experiences. It's lightweight, easy to use, and works well with Astro. It's also compatible with all major browsers. If you're looking for a way to make your website more interactive without writing any JavaScript code in the browser, then HTMX is the perfect solution for you.
