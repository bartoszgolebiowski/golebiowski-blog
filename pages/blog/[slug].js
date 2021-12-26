import React from "react";
import ErrorPage from "next/error";
import { useRouter } from "next/router";
import { getPostBySlug } from "../../lib/get-single-post";
import { getAllPosts } from "../../lib/get-all-posts";
import { markdownToHtml } from "../../lib/markdown-to-html";
import PostHead from "../../components/post-head";
import PostHeader from "../../components/post-header";
import PostBody from "../../components/post-body";

export default function Post({ post }) {
  const router = useRouter();
  if (!router.isFallback && !post?.slug) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <>
      <PostHead post={post} />
      <article
        sx={{
          mb: "2rem",
        }}
      >
        <PostHeader post={post} />
        <PostBody post={post} />
      </article>
    </>
  );
}

export async function getStaticProps({ params }) {
  const post = getPostBySlug(params.slug);

  const content = await markdownToHtml(post?.content || "");

  return {
    props: {
      post: {
        ...post,
        content,
      },
    },
  };
}

export async function getStaticPaths() {
  const posts = getAllPosts(["slug"]);

  return {
    paths: posts.map((post) => {
      return {
        params: {
          slug: post.slug,
        },
      };
    }),
    fallback: false,
  };
}
