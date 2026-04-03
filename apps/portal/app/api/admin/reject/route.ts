import { addLabel, removeLabel, addComment } from '@/lib/github'

export async function POST(request: Request) {
  try {
    const { issueNumber, reason } = await request.json()

    if (!issueNumber || typeof issueNumber !== 'number') {
      return Response.json(
        { error: 'issueNumber is required and must be a number' },
        { status: 400 }
      )
    }

    if (!reason || typeof reason !== 'string') {
      return Response.json(
        { error: 'reason is required' },
        { status: 400 }
      )
    }

    await removeLabel(issueNumber, 'needs-review')
    await addLabel(issueNumber, 'rejected')
    await addComment(
      issueNumber,
      `❌ **This idea has been rejected.**\n\n**Reason:** ${reason}`
    )

    return Response.json({ success: true })
  } catch (error) {
    console.error('Failed to reject idea:', error)
    return Response.json(
      { error: 'Failed to reject idea' },
      { status: 500 }
    )
  }
}
