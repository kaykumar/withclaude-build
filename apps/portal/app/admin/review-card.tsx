'use client'

import { useState } from 'react'
import type { Idea } from '@/lib/github'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export default function ReviewCard({ idea }: { idea: Idea }) {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>(
    'pending'
  )
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const excerpt =
    idea.body.length > 200 ? idea.body.slice(0, 200) + '...' : idea.body

  const submittedDate = new Date(idea.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  async function handleApprove() {
    setError(null)
    setIsApproving(true)
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueNumber: idea.number }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to approve')
      }
      setStatus('approved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve')
    } finally {
      setIsApproving(false)
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return
    setError(null)
    setIsRejecting(true)
    try {
      const res = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueNumber: idea.number,
          reason: rejectReason,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to reject')
      }
      setStatus('rejected')
      setRejectDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject')
    } finally {
      setIsRejecting(false)
    }
  }

  if (status === 'approved') {
    return (
      <Card className="border-green-500/30 bg-green-500/5 opacity-75">
        <CardHeader>
          <CardTitle>{idea.title}</CardTitle>
          <CardDescription>
            <Badge className="bg-green-600 text-white">Approved</Badge>
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (status === 'rejected') {
    return (
      <Card className="border-red-500/30 bg-red-500/5 opacity-75">
        <CardHeader>
          <CardTitle>{idea.title}</CardTitle>
          <CardDescription>
            <Badge className="bg-red-600 text-white">Rejected</Badge>
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{idea.title}</CardTitle>
        <CardDescription>
          <span className="flex items-center gap-2">
            <span className="text-muted-foreground">
              by{' '}
              <a
                href={`https://github.com/${idea.user.login}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:underline"
              >
                @{idea.user.login}
              </a>
            </span>
            <span className="text-muted-foreground/50">|</span>
            <span className="text-muted-foreground">{submittedDate}</span>
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {excerpt}
        </p>
        {idea.labels.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {idea.labels.map((label) => (
              <Badge
                key={label.name}
                className="text-xs"
                style={{
                  backgroundColor: `#${label.color}20`,
                  color: `#${label.color}`,
                  borderColor: `#${label.color}40`,
                }}
              >
                {label.name}
              </Badge>
            ))}
          </div>
        )}
        {error && (
          <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          onClick={handleApprove}
          disabled={isApproving}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          {isApproving ? 'Approving...' : 'Approve'}
        </Button>
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogTrigger
            render={
              <Button variant="destructive">Reject</Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Idea</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting &ldquo;{idea.title}&rdquo;. This
                will be posted as a comment on the issue.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <Textarea
                placeholder="Reason for rejection..."
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isRejecting || !rejectReason.trim()}
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <a
          href={idea.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto"
        >
          <Button variant="ghost" size="sm">
            View on GitHub
          </Button>
        </a>
      </CardFooter>
    </Card>
  )
}
