'use client'
import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
import Link from 'next/link'
import { Mail, FileText, WandSparkles, Download, ArrowLeft, LoaderCircle, CircleAlert } from 'lucide-react'
import type { ResumeData } from '@/lib/resume-data'
import { Button } from './_ui/Button'
import { Field, FIELD_LABEL, Input, Textarea } from './_ui/Field'
import { Panel } from './_ui/Panel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './_ui/tabs'
import { useCopyToClipboard, type CopyState } from './_ui/useCopyToClipboard'
import { cn } from '@/lib/utils'

/**
 * The builder itself: the résumé editor and its paper preview, the tailor and
 * cover-letter tools, and the PDF downloads. Only someone holding the PIN
 * needs it, so page.tsx loads this module once there is a PIN rather than
 * shipping it to every visitor of /resume. It holds no résumé data: that
 * arrives as a prop, from /api/resume/data.
 */

type TabId = 'resume' | 'tailor' | 'cover-letter'

/** A group of fields under one heading: one experience entry and its bullets. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className={FIELD_LABEL}>{title}</h2>
      {children}
    </div>
  )
}

function ResumePreview({ resume }: { resume: ResumeData }) {
  const headingClass = 'font-bold text-sm border-b border-paper-rule pb-1 mb-3 uppercase tracking-wider'
  return (
    <div className="text-paper-ink text-xs leading-relaxed">
      <h1 className="text-2xl font-bold text-center mb-1">{resume.name}</h1>
      <p className="text-center text-paper-muted text-[10px] mb-1">
        {resume.location} | {resume.phone} | {resume.email}
      </p>
      <p className="text-center text-paper-muted text-[10px] mb-4">
        {resume.linkedin} | {resume.github}
        {resume.website ? ` | ${resume.website}` : ''}
      </p>
      {resume.summary && (
        <p className="text-[11px] text-paper-body mb-4 leading-relaxed">{resume.summary}</p>
      )}

      <h2 className={headingClass}>Professional Experience</h2>
      {resume.experience.map((exp, i) => (
        <div key={i} className="mb-4">
          <div className="flex justify-between items-baseline">
            <h3 className="font-bold text-[11px]">{exp.company}, {exp.location}</h3>
          </div>
          <div className="flex justify-between items-baseline">
            <p className="font-semibold text-[10px]">{exp.title}</p>
            <p className="text-paper-muted text-[10px]">{exp.dates}</p>
          </div>
          <ul className="list-disc ml-4 mt-1 space-y-0.5">
            {exp.bullets.map((b, j) => (
              <li key={j} className="text-[10px] text-paper-body leading-relaxed">{b}</li>
            ))}
          </ul>
        </div>
      ))}

      <h2 className={headingClass}>Certifications</h2>
      <p className="text-[10px] text-paper-body mb-4 leading-relaxed">
        <span className="font-bold">{resume.certifications.length}x Salesforce Certified:</span>{' '}
        {resume.certifications.map((cert) => `${cert.name} (${cert.date})`).join('  ·  ')}
      </p>

      <h2 className={headingClass}>Education</h2>
      {resume.education.map((edu, i) => (
        <div key={i} className="flex justify-between items-baseline mb-1">
          <p className="text-[10px] text-paper-body">
            <span className="font-bold">{edu.school}, {edu.location}</span>
            {' — '}
            {edu.degree}
            {edu.gpa ? ` (${edu.gpa} GPA)` : ''}
          </p>
          <p className="text-paper-muted text-[10px]">{edu.dates}</p>
        </div>
      ))}

      <h2 className={`${headingClass} mt-4`}>Technical Skills</h2>
      <p className="text-[10px] text-paper-body">{resume.skills.join(', ')}</p>

      {resume.projects.length > 0 && (
        <>
          <h2 className={`${headingClass} mt-4`}>Projects</h2>
          {resume.projects.map((project, i) => (
            <div key={i} className="mb-3">
              <p className="font-bold text-[11px]">
                {project.name} <span className="font-normal text-paper-muted">({project.tech})</span>
              </p>
              <ul className="list-disc ml-4 space-y-0.5">
                {project.bullets.map((b, j) => (
                  <li key={j} className="text-[10px] text-paper-body">{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

const COPY_LABELS: Record<CopyState, string> = { idle: 'Copy to clipboard', copied: 'Copied', error: 'Copy failed' }
const COPY_STATES = Object.keys(COPY_LABELS) as CopyState[]

/**
 * The site's focus ring is white, which vanishes on the white sheet, so the
 * controls that sit on the paper draw it in the paper's ink instead.
 */
const PAPER_FOCUS = 'focus-visible:outline-paper-ink'

/**
 * The cover letter's copy control, on the paper. It used to call
 * navigator.clipboard.writeText bare: no word on whether it worked, and an
 * unhandled rejection wherever the clipboard is refused. The shared hook
 * falls back to execCommand and reports the outcome; every label sits in one
 * grid cell so the line never changes width, and a status line announces it.
 */
function CopyLetter({ text }: { text: string }) {
  const { copy, state } = useCopyToClipboard()
  return (
    <>
      <button
        type="button"
        onClick={() => {
          void copy(text)
        }}
        className={cn(
          'mt-6 inline-grid cursor-pointer text-left font-mono text-label text-paper-muted transition-colors hover:text-paper-ink',
          PAPER_FOCUS
        )}
      >
        {COPY_STATES.map((s) => (
          <span key={s} className={cn('col-start-1 row-start-1', s !== state && 'invisible')}>
            {COPY_LABELS[s]}
          </span>
        ))}
      </button>
      <span role="status" className="sr-only">
        {state === 'idle' ? '' : COPY_LABELS[state]}
      </span>
    </>
  )
}

/** A sheet of paper: the preview of what the PDF will print. */
const SHEET = 'bg-white rounded-xl p-8 text-paper-ink overflow-auto max-h-[80vh]'
/** Room at the top for the Download PDF button pinned over the sheet's corner,
 *  so it no longer sits on the centred name. */
const SHEET_UNDER_BUTTON = 'pt-16'
/** A sheet scrolls once the résumé outgrows 80vh, so it takes focus: the
 *  arrow keys can then scroll it without a mouse. An empty sheet holds only
 *  a hint, with nothing to scroll, so it stays out of the tab order. */
const sheetRegion = (filled: boolean) =>
  filled ? ({ role: 'region', 'aria-label': 'Preview', tabIndex: 0 } as const) : {}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

interface BuilderProps {
  pin: string
  resume: ResumeData
  /** The page owns the résumé, so edits survive locking and unlocking again. */
  setResume: Dispatch<SetStateAction<ResumeData | null>>
  onLock: () => void
}

export default function Builder({ pin, resume, setResume, onLock }: BuilderProps) {
  const [jobDescription, setJobDescription] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [tailoredResume, setTailoredResume] = useState<ResumeData | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  /** Which AI tool is waiting on Claude, so only its own button shows the wait. */
  const [aiLoading, setAiLoading] = useState<'tailor' | 'cover-letter' | null>(null)
  const [error, setError] = useState('')
  const [pdfBuilding, setPdfBuilding] = useState(false)

  const handleTailor = useCallback(async () => {
    if (!jobDescription.trim()) return
    setAiLoading('tailor')
    setError('')
    try {
      const res = await fetch('/api/resume/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: resume, jobDescription, pin }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Request failed with status ${res.status}`)
      setTailoredResume(data.resume)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to tailor resume.')
    } finally {
      setAiLoading(null)
    }
  }, [jobDescription, pin, resume])

  const handleCoverLetter = useCallback(async () => {
    if (!jobDescription.trim()) return
    setAiLoading('cover-letter')
    setError('')
    try {
      const res = await fetch('/api/resume/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: resume, jobDescription, companyName, pin }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Request failed with status ${res.status}`)
      setCoverLetter(data.coverLetter)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate cover letter.')
    } finally {
      setAiLoading(null)
    }
  }, [jobDescription, companyName, pin, resume])

  const handleDownloadResume = useCallback(async (variant: 'base' | 'tailored') => {
    const source = variant === 'tailored' ? tailoredResume : resume
    if (!source) return
    setPdfBuilding(true)
    setError('')
    try {
      const [{ pdf }, mod] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/resume/ResumePdf'),
      ])
      const ResumePDF = mod.default
      const blob = await pdf(<ResumePDF resume={source} />).toBlob()
      downloadBlob(blob, `${source.name.replace(/\s+/g, '_')}${variant === 'tailored' ? '-Tailored' : ''}_Resume.pdf`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate PDF.')
    } finally {
      setPdfBuilding(false)
    }
  }, [resume, tailoredResume])

  const handleDownloadCoverLetter = useCallback(async () => {
    if (!coverLetter) return
    setPdfBuilding(true)
    setError('')
    try {
      const [{ pdf }, mod] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/resume/CoverLetterPdf'),
      ])
      const CoverLetterPDF = mod.default
      const blob = await pdf(
        <CoverLetterPDF resume={resume} coverLetter={coverLetter} companyName={companyName} />
      ).toBlob()
      const suffix = companyName ? `_${companyName.replace(/\s+/g, '_')}` : ''
      downloadBlob(blob, `${resume.name.replace(/\s+/g, '_')}${suffix}_CoverLetter.pdf`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate PDF.')
    } finally {
      setPdfBuilding(false)
    }
  }, [coverLetter, resume, companyName])

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'resume', label: 'My Resume', icon: <FileText size={16} className="hidden sm:block" /> },
    { id: 'tailor', label: 'Tailor', icon: <WandSparkles size={16} className="hidden sm:block" /> },
    { id: 'cover-letter', label: 'Cover Letter', icon: <Mail size={16} className="hidden sm:block" /> },
  ]

  // The paper's download button: Button's paper variant, pinned to the sheet's corner.
  const download = {
    variant: 'paper',
    pending: pdfBuilding,
    pendingLabel: (
      <>
        <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />
        Building…
      </>
    ),
    className: cn('absolute top-3 right-3 z-10 shadow-lg', PAPER_FOCUS),
  } as const
  const downloadFace = (
    <>
      <Download size={14} aria-hidden="true" />
      Download PDF
    </>
  )

  return (
    <div className="min-h-svh bg-black">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            aria-label="Back to portfolio"
            className="-m-3 p-3 text-ink-meta transition-colors hover:text-white"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
          <h1 className="font-display text-lead font-bold text-white">
            Resume <span className="text-gradient">Builder</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={onLock}
          // A 29x16 word: on phones its hit area is 45x44 (an ::after, as TAP_TEXT in pill.ts, a little wider).
          className="relative cursor-pointer font-mono text-label text-ink-meta transition-colors hover:text-white max-md:after:absolute max-md:after:-inset-x-2 max-md:after:-inset-y-3.5 max-md:after:content-['']"
        >
          Lock
        </button>
      </header>

      <main id="main" tabIndex={-1} className="outline-none">
        <Tabs defaultValue="resume">
          <TabsList className="px-6">
            {tabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>
                {t.icon}
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="max-w-6xl mx-auto px-6 py-8">
            {error && (
              <Panel
                role="alert"
                accent="var(--color-spectrum-red)"
                className="mb-6 flex items-start gap-2 p-4 font-mono text-small text-ink-body"
              >
                <CircleAlert size={16} className="mt-0.5 shrink-0 text-spectrum-red" aria-hidden="true" />
                {error}
              </Panel>
            )}

            <TabsContent value="resume" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Field label="Summary">
                  <Textarea
                    value={resume.summary}
                    rows={4}
                    onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                  />
                </Field>
                {resume.experience.map((exp, i) => (
                  <Section key={i} title={`${exp.company} — ${exp.title}`}>
                    <p className="mb-2 font-mono text-label text-ink-meta">{exp.dates}</p>
                    {exp.bullets.map((bullet, j) => (
                      <Field key={j} label={`${exp.company} — ${exp.title}: bullet ${j + 1}`} hideLabel className="mb-2">
                        <Textarea
                          value={bullet}
                          rows={2}
                          onChange={(e) => {
                            setResume((prev) => {
                              if (!prev) return prev
                              const next = structuredClone(prev)
                              next.experience[i].bullets[j] = e.target.value
                              return next
                            })
                          }}
                        />
                      </Field>
                    ))}
                  </Section>
                ))}
                <Field label="Skills">
                  <Input
                    value={resume.skills.join(', ')}
                    onChange={(e) =>
                      setResume({ ...resume, skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })
                    }
                  />
                </Field>
              </div>
              <div className="relative">
                <Button {...download} onClick={() => handleDownloadResume('base')} title="Download as PDF">
                  {downloadFace}
                </Button>
                <div {...sheetRegion(true)} className={cn(SHEET, SHEET_UNDER_BUTTON)}>
                  <ResumePreview resume={resume} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tailor" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Field label="Paste Job Description">
                  <Textarea
                    value={jobDescription}
                    rows={12}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job description here..."
                    className="min-h-72"
                  />
                </Field>
                <Button
                  onClick={handleTailor}
                  disabled={!jobDescription.trim() || aiLoading === 'cover-letter'}
                  pending={aiLoading === 'tailor'}
                  pendingLabel={
                    <>
                      <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
                      Tailoring...
                    </>
                  }
                >
                  <WandSparkles size={16} aria-hidden="true" />
                  Tailor Resume
                </Button>
              </div>
              <div className="relative">
                {tailoredResume && (
                  <Button {...download} onClick={() => handleDownloadResume('tailored')} title="Download tailored resume as PDF">
                    {downloadFace}
                  </Button>
                )}
                <div {...sheetRegion(tailoredResume !== null)} className={cn(SHEET, tailoredResume && SHEET_UNDER_BUTTON)}>
                  {tailoredResume ? (
                    <ResumePreview resume={tailoredResume} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-paper-muted text-sm">
                      Paste a job description and click Tailor to see the result
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cover-letter" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Field label="Company Name (optional)">
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Google, Amazon..."
                  />
                </Field>
                <Field label="Paste Job Description">
                  <Textarea
                    value={jobDescription}
                    rows={10}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job description here..."
                    className="min-h-60"
                  />
                </Field>
                <Button
                  onClick={handleCoverLetter}
                  disabled={!jobDescription.trim() || aiLoading === 'tailor'}
                  pending={aiLoading === 'cover-letter'}
                  pendingLabel={
                    <>
                      <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
                      Generating...
                    </>
                  }
                >
                  <Mail size={16} aria-hidden="true" />
                  Generate Cover Letter
                </Button>
              </div>
              <div className="relative">
                {coverLetter && (
                  <Button {...download} onClick={handleDownloadCoverLetter} title="Download cover letter as PDF">
                    {downloadFace}
                  </Button>
                )}
                <div {...sheetRegion(coverLetter !== '')} className={cn(SHEET, coverLetter && SHEET_UNDER_BUTTON)}>
                  {coverLetter ? (
                    <div>
                      <div className="whitespace-pre-wrap font-body text-sm leading-relaxed">{coverLetter}</div>
                      <CopyLetter text={coverLetter} />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-paper-muted text-sm">
                      Paste a job description and click Generate to see the result
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  )
}
