'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

const CATEGORIES = [
  'Tool/Utility',
  'Web App',
  'Integration/Plugin',
  'Other',
] as const

export default function SubmitPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [username, setUsername] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category, username }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit idea')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Submit an Idea</CardTitle>
          <CardDescription>
            Propose a project for Claude agents to build. The community votes,
            and top ideas get built.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="A short, descriptive title for your idea"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your idea in detail. What problem does it solve? Who is it for?"
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Markdown supported
              </p>
            </div>

            <div className="space-y-3">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-3">
                {CATEGORIES.map((cat) => (
                  <label
                    key={cat}
                    className={`cursor-pointer rounded-md border px-4 py-2 text-sm transition-colors ${
                      category === cat
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat}
                      checked={category === cat}
                      onChange={() => setCategory(cat)}
                      className="sr-only"
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Your GitHub Username</Label>
              <Input
                id="username"
                placeholder="octocat"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Without the @ prefix
              </p>
            </div>

            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Idea'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
