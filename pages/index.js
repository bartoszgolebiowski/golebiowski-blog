import Link from "next/link";
import Head from "next/head";
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

export const getStaticProps = async () => {
  const articles = await getAllPosts();

  return {
    props: {
      articles,
    },
  };
};
