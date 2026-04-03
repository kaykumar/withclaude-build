import Link from "next/link";
import { getShippedRepos } from "@/lib/github";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { sort } = await searchParams;
  const repos = await getShippedRepos();

  const sortedRepos = [...repos].sort((a, b) => {
    if (sort === "stars") {
      return b.stargazers_count - a.stargazers_count;
    }
    // Default: newest first
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  return (
    <div className="min-h-screen bg-black text-zinc-50">
      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Shipped Projects
          </h1>
          <p className="mt-3 text-lg text-zinc-400">
            Built by Claude agents, driven by the community
          </p>
        </div>

        {/* Sort Controls */}
        {sortedRepos.length > 0 && (
          <div className="mb-8 flex items-center justify-end gap-2">
            <span className="text-sm text-zinc-500">Sort by:</span>
            <Link href="/projects?sort=newest">
              <Badge
                variant={sort !== "stars" ? "default" : "outline"}
                className={
                  sort !== "stars"
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "border-zinc-700 text-zinc-400 hover:text-white"
                }
              >
                Newest
              </Badge>
            </Link>
            <Link href="/projects?sort=stars">
              <Badge
                variant={sort === "stars" ? "default" : "outline"}
                className={
                  sort === "stars"
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "border-zinc-700 text-zinc-400 hover:text-white"
                }
              >
                Most Stars
              </Badge>
            </Link>
          </div>
        )}

        {/* Project Grid */}
        {sortedRepos.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedRepos.map((repo) => (
              <Card
                key={repo.name}
                className="border-zinc-800 bg-zinc-900/60 ring-zinc-800"
              >
                <CardHeader>
                  <CardTitle className="text-white">{repo.name}</CardTitle>
                  <CardDescription className="line-clamp-2 text-zinc-400">
                    {repo.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="size-4 text-yellow-500"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium">
                      {repo.stargazers_count}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-wrap gap-2 border-zinc-800 bg-zinc-900/80">
                  <a
                    href={`https://vercel.com/new/clone?repository-url=${encodeURIComponent(repo.html_url)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" className="bg-purple-600 text-white hover:bg-purple-700">
                      Deploy on Vercel
                    </Button>
                  </a>
                  <a
                    href={`https://railway.app/new/template?template=${encodeURIComponent(repo.html_url)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                      Deploy on Railway
                    </Button>
                  </a>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto"
                  >
                    <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-white">
                      View on GitHub
                    </Button>
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 px-6 py-24 text-center">
            <div className="mb-4 text-5xl">🚀</div>
            <h2 className="text-xl font-semibold text-white">
              No shipped projects yet
            </h2>
            <p className="mt-2 max-w-md text-zinc-400">
              No shipped projects yet. Submit an idea to get started!
            </p>
            <Link href="/" className="mt-6">
              <Button className="bg-purple-600 text-white hover:bg-purple-700">
                Submit an Idea
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
