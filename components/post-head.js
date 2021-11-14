import Head from "next/head";

export default function PostHead({ post }) {
  return (
    <Head>
      <title>{post.title}</title>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="description" content={post.description} />
      <meta name="image" content={post.image} />
      <meta name="keywords" content={post.keywords} />

      <meta itemprop="name" content={post.title} />
      <meta itemprop="description" content={post.description} />
      <meta itemprop="image" content={post.image} />

      <meta name="og:title" content={post.ogTitle} />
      <meta name="og:description" content={post.ogDescription} />
      <meta name="og:image" content={post.ogImage} />
      <meta name="og:url" content={post.ogUrl} />
      <meta name="og:site_name" content={post.ogSiteName} />
      <meta name="og:type" content="Article" />

      <meta name="article:section" content="Technology" />
      <meta name="article:author" content={post.author} />
      <meta name="article:tag" content={post.keywords} />

      <meta name="twitter:card" content={post.twitterCard} />
      <meta name="twitter:site" content={post.twitterSite} />
      <meta name="twitter:title" content={post.twitterTitle} />
      <meta name="twitter:description" content={post.twitterDescription} />
      <meta name="twitter:image" content={post.twitterImage} />
    </Head>
  );
}
