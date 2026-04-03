import { createIdea } from '@/lib/github'

export async function POST(request: Request) {
  try {
    const { title, description, category, username } = await request.json()

    if (!title || !description || !category || !username) {
      return Response.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const url = await createIdea(title, description, category, username)

    return Response.json({ url })
  } catch (error) {
    console.error('Failed to create idea:', error)
    return Response.json(
      { error: 'Failed to create idea. Please try again.' },
      { status: 500 }
    )
  }
}
