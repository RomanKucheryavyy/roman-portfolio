import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

export async function POST(req: Request) {
  let body: { resumeData?: unknown; jobDescription?: string; pin?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { resumeData, jobDescription, pin } = body
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
      max_tokens: 8000,
      system: [
        'You are an expert resume writer. You will receive a resume as JSON and a job description.',
        'Tailor the resume to the job: rewrite the summary to mirror the role, reorder and rewrite experience bullets to highlight the most relevant work (keep them truthful — never invent employers, titles, dates, degrees, or certifications), reorder skills so the most relevant come first (you may drop clearly irrelevant ones), and reorder projects by relevance.',
        'Return ONLY the tailored resume as JSON with EXACTLY the same shape and keys as the input (name, location, phone, email, linkedin, github, website, summary, experience[{company,location,title,dates,bullets}], certifications[{name,date}], education[{school,location,degree,dates,gpa}], skills[], projects[{name,tech,bullets}]).',
        'Do not wrap the JSON in markdown fences or add commentary.',
      ].join(' '),
      messages: [
        {
          role: 'user',
          content: `RESUME JSON:\n${JSON.stringify(resumeData)}\n\nJOB DESCRIPTION:\n${jobDescription.slice(0, 12000)}`,
        },
      ],
    })

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim()
      .replace(/^```(?:json)?\s*/, '')
      .replace(/\s*```$/, '')

    const resume = JSON.parse(text)
    return NextResponse.json({ resume })
  } catch (err) {
    console.error('tailor failed:', err)
    return NextResponse.json({ error: 'Failed to tailor resume. Try again.' }, { status: 500 })
  }
}
