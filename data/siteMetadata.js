const siteMetadata = {
  title: 'bgolebiowski blog',
  author: 'Bartosz Golebiowski',
  headerTitle: 'Golebiowski blog',
  description: 'Blog with articles about frontend technology, react, micro-frontends, single-spa',
  language: 'en-us',
  theme: 'system', // system, dark or light
  siteUrl: 'https://bgolebiowski.com/',
  siteRepo: 'https://github.com/bartoszgolebiowski/golebiowski-blog',
  siteLogo: '/static/images/logo.png',
  image: '/static/images/avatar.png',
  socialBanner: '/static/images/twitter-card.png',
  email: 'bartosz.golebiowski24@gmail.com',
  twitter: 'https://twitter.com/BartoszEbiowski',
  linkedin: 'https://www.linkedin.com/in/bartosz-go%C5%82%C4%99biowski-12723a159/',
  github: 'https://github.com/bartoszgolebiowski',
  locale: 'en-US',
  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID, // e.g. UA-000000-2 or G-XXXXXXX
  },
  comment: {
    // Select a provider and use the environment variables associated to it
    // https://vercel.com/docs/environment-variables
    provider: 'giscus', // supported providers: giscus, utterances, disqus
    giscusConfig: {
      // Visit the link below, and follow the steps in the 'configuration' section
      // https://giscus.app/
      repo: process.env.NEXT_PUBLIC_GISCUS_REPO,
      repositoryId: process.env.NEXT_PUBLIC_GISCUS_REPOSITORY_ID,
      category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY,
      categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID,
      mapping: 'pathname', // supported options: pathname, url, title
      reactions: '1', // Emoji reactions: 1 = enable / 0 = disable
      // Send discussion metadata periodically to the parent window: 1 = enable / 0 = disable
      metadata: '0',
      // theme example: light, dark, dark_dimmed, dark_high_contrast
      // transparent_dark, preferred_color_scheme, custom
      theme: 'light',
      // theme when dark mode
      darkTheme: 'transparent_dark',
      // If the theme option above is set to 'custom`
      // please provide a link below to your custom theme css file.
      // example: https://giscus.app/themes/custom_example.css
      themeURL: '',
    },
  },
}

module.exports = siteMetadata
