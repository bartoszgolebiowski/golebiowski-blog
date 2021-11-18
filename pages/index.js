import Link from "next/link";
import Head from "next/head";
import { Feed } from "feed";
import fs from "fs";
import { getAllPosts } from "../lib/get-all-posts";

export default function Home(props) {
  const { articles } = props;

  return (
    <>
      <Head>
        <title>Golebiowski Blog</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ul>
        {articles.map((article) => (
          <li key={article.title}>
            <h2>
              <Link href={`/blog/${article.slug}`}>{article.title}</Link>
            </h2>
            <p>{article.excerpt}</p>
            <p style={{ textAlign: "end" }}>{article.author}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

const generateRSSFeed = (articles) => {
  const baseUrl = "https://bgolebiowski.com";
  const author = {
    name: "Bartosz Golebiowski",
    email: "contact@bgolebiowski.com",
    link: "https://twitter.com/bgolebiowski24",
  };

  // Construct a new Feed object
  const feed = new Feed({
    title: "Articles by Bartosz Golebiowski",
    description:
      "Blog with articles about frontend technology, react, micro-frontends, single-spa",
    id: baseUrl,
    link: baseUrl,
    language: "en",
    feedLinks: {
      rss2: `${baseUrl}/rss.xml`,
    },
    author,
  });

  articles.forEach((post) => {
    const {
      title,
      excerpt,
      keywords,
      content,
      coverImage,
      date,
      author,
      slug,
    } = post;
    const url = `${baseUrl}/blog/${slug}`;

    feed.addItem({
      title,
      id: url,
      link: url,
      description: excerpt,
      content,
      author: [author],
      date: new Date(date),
      image: coverImage,
      category: keywords,
    });
  });

  fs.writeFileSync("public/rss.xml", feed.rss2());
};

export const getStaticProps = async () => {
  const articles = await getAllPosts();
  articles.sort((a, b) => (new Date(a.date) < new Date(b.date) ? 1 : -1));

  generateRSSFeed(articles);

  return {
    props: {
      articles,
    },
  };
};
