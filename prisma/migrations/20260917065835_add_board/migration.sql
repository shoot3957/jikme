-- CreateTable
CREATE TABLE "BoardPost" (
    "id" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardComment" (
    "id" TEXT NOT NULL,
    "boardPostId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardComment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BoardPost" ADD CONSTRAINT "BoardPost_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardPost" ADD CONSTRAINT "BoardPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardComment" ADD CONSTRAINT "BoardComment_boardPostId_fkey" FOREIGN KEY ("boardPostId") REFERENCES "BoardPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardComment" ADD CONSTRAINT "BoardComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
