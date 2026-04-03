import { getIdeas } from '@/lib/github'
import type { Idea } from '@/lib/github'
import ReviewCard from './review-card'
import { Badge } from '@/components/ui/badge'

export default async function AdminPage() {
  const ideas: Idea[] = await getIdeas('needs-review')

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            Moderator Dashboard
          </h1>
          <Badge className="bg-purple-600 text-white">
            {ideas.length} pending
          </Badge>
        </div>
        <p className="mt-2 text-muted-foreground">
          Review and approve community ideas
        </p>
      </div>

      {ideas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-muted-foreground/25 py-16 text-center">
          <p className="text-lg text-muted-foreground">
            No ideas awaiting review
          </p>
          <p className="mt-1 text-sm text-muted-foreground/75">
            New submissions will appear here when community members submit ideas.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {ideas.map((idea) => (
            <ReviewCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  )
}
