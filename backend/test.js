import prisma from "./src/utils/prisma.js";

async function test() {
  console.log("prisma.post:", prisma.post); // should NOT be undefined

  const posts = await prisma.post.findMany();
  console.log("Posts:", posts);
}

test().catch(console.error);
