export default function PostBody({ post }) {
  return <div dangerouslySetInnerHTML={{ __html: post.content }} />;
}
