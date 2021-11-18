import matter from "gray-matter";
import fs from "fs";
import { join } from "path";

const postsDirectory = join(process.cwd(), "_posts");

const basicMetaTags = [
  "title",
  "excerpt",
  "description",
  "keywords",
  "content",
  "coverImage",
  "date",
  "author",
  "slug",
  "twitterCard",
  "twitterSite",
  "twitterTitle",
  "twitterDescription",
  "twitterImage",
  "ogTitle",
  "ogDescription",
  "ogImage",
  "ogURL",
  "ogSiteName",
];

export function getAllPosts(fields = basicMetaTags) {
  const slugs = getPostSlugs();
  const posts = slugs.map((slug) => getPostBySlug(slug, fields));
  return posts;
}

function getPostSlugs() {
  return fs.readdirSync(postsDirectory);
}

function getPostBySlug(slug, fields = []) {
  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = join(postsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const items = {};

  fields.forEach((field) => {
    if (typeof data[field] !== "undefined") {
      items[field] = data[field];
    }
    if (field === "content") {
      items[field] = content;
    }
  });

  return items;
}
