import { addLabel, removeLabel, addComment } from '@/lib/github'

export async function POST(request: Request) {
  try {
    const { issueNumber } = await request.json()

    if (!issueNumber || typeof issueNumber !== 'number') {
      return Response.json(
        { error: 'issueNumber is required and must be a number' },
        { status: 400 }
      )
    }

    await removeLabel(issueNumber, 'needs-review')
    await addLabel(issueNumber, 'approved')
    await addComment(
      issueNumber,
      '✅ **This idea has been approved!** Claude agents are spinning up to build it.'
    )

    return Response.json({ success: true })
  } catch (error) {
    console.error('Failed to approve idea:', error)
    return Response.json(
      { error: 'Failed to approve idea' },
      { status: 500 }
    )
  }
}
