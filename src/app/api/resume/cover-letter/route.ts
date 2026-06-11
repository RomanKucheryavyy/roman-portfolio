import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

export async function POST(req: Request) {
  let body: { resumeData?: unknown; jobDescription?: string; companyName?: string; pin?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { resumeData, jobDescription, companyName, pin } = body
  if (!pin || !process.env.RESUME_PIN || pin !== process.env.RESUME_PIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!resumeData || !jobDescription?.trim()) {
    return NextResponse.json({ error: 'Missing resume data or job description' }, { status: 400 })
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI is not configured on the server' }, { status: 500 })
  }

  try {
    const anthropic = new Anthropic()
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: [
        'You write sharp, genuine cover letters. You will receive a resume as JSON, a job description, and optionally a company name.',
        'Write a concise cover letter (3-4 short paragraphs, under 350 words) in the first person as the candidate.',
        'Ground every claim in the resume — never invent experience. Mirror the language of the job description naturally, lead with the strongest relevant hook, and close with a confident, warm sign-off.',
        'Format as plain text with blank lines between paragraphs. Start with "Dear Hiring Team," (or "Dear [Company] Team," if a company name is given) and end with "Sincerely,\\nRoman Kucheryavyy". No headers, no placeholders, no markdown.',
      ].join(' '),
      messages: [
        {
          role: 'user',
          content: `RESUME JSON:\n${JSON.stringify(resumeData)}\n\nCOMPANY: ${companyName || '(not specified)'}\n\nJOB DESCRIPTION:\n${jobDescription.slice(0, 12000)}`,
        },
      ],
    })

    const coverLetter = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim()

    return NextResponse.json({ coverLetter })
  } catch (err) {
    console.error('cover-letter failed:', err)
    return NextResponse.json({ error: 'Failed to generate cover letter. Try again.' }, { status: 500 })
  }
}
