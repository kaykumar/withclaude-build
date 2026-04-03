import Link from "next/link";
import Image from "next/image";
import { getIdeas, type Idea } from "@/lib/github";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import IdeaFilters from "./components/idea-filters";

const LABEL_STYLES: Record<string, string> = {
  idea: "",
  "needs-review": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  building: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shipped: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { filter, q } = await searchParams;

  const ideas = await getIdeas(filter || undefined);

  const filteredIdeas = q
    ? ideas.filter(
        (idea) =>
          idea.title.toLowerCase().includes(q.toLowerCase()) ||
          idea.body.toLowerCase().includes(q.toLowerCase())
      )
    : ideas;

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center sm:py-28">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Build with{" "}
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Claude
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Submit ideas. Community votes. Claude agents build them. All open
            source.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/submit">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 text-base font-semibold shadow-lg shadow-primary/25"
              >
                Submit an Idea
              </Button>
            </Link>
            <Link href="#ideas">
              <Button
                variant="outline"
                size="lg"
                className="border-border text-base"
              >
                Browse Ideas
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Ideas Section */}
      <section id="ideas" className="mx-auto w-full max-w-6xl px-6 py-12">
        <IdeaFilters />

        {filteredIdeas.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="rounded-full bg-muted p-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="h-8 w-8 text-muted-foreground"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold">No ideas found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {q
                ? `No results for "${q}". Try a different search.`
                : "No ideas match this filter yet. Be the first to submit one!"}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredIdeas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function IdeaCard({ idea }: { idea: Idea }) {
  const excerpt =
    idea.body.length > 120 ? idea.body.slice(0, 120) + "..." : idea.body;

  return (
    <Link href={idea.html_url} target="_blank" rel="noopener noreferrer">
      <Card className="group h-full border-border bg-card/50 transition-all hover:border-primary/40 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {idea.labels.map((label) => (
              <Badge
                key={label.name}
                variant="outline"
                className={
                  LABEL_STYLES[label.name] ||
                  "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                }
              >
                {label.name}
              </Badge>
            ))}
          </div>
          <CardTitle className="text-base font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {idea.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {excerpt}
          </p>
        </CardContent>
        <CardFooter className="pt-0 text-xs text-muted-foreground">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              {idea.user.avatar_url && (
                <Image
                  src={idea.user.avatar_url}
                  alt={idea.user.login}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              )}
              <span>{idea.user.login}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-3.5 w-3.5"
                >
                  <path d="M1 8.74c0 .983.713 1.825 1.69 1.943.904.108 1.817.19 2.737.243.363.02.688.231.85.556l1.052 2.103a.75.75 0 001.342 0l1.052-2.103c.162-.325.487-.535.85-.556.92-.053 1.833-.134 2.738-.243C14.287 10.565 15 9.723 15 8.74V4.26c0-.983-.713-1.825-1.69-1.943A44.36 44.36 0 008 2a44.36 44.36 0 00-5.31.317C1.713 2.435 1 3.277 1 4.26v4.48z" />
                </svg>
                {idea.comments}
              </span>
              <span>{getRelativeTime(idea.created_at)}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
