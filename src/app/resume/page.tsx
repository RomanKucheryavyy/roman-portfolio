'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Lock, Mail, FileText, WandSparkles, Download, ArrowLeft, LoaderCircle } from 'lucide-react'
import { RESUME_DATA, type ResumeData } from '@/lib/resume-data'

type TabId = 'resume' | 'tailor' | 'cover-letter'

function PinGate({ onUnlock }: { onUnlock: (pin: string) => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length < 4) return
    setVerifying(true)
    setError(false)
    try {
      const res = await fetch('/api/resume/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      if (res.ok) {
        localStorage.setItem('resume_pin', pin)
        onUnlock(pin)
      } else {
        setError(true)
        setPin('')
        inputRef.current?.focus()
      }
    } catch {
      setError(true)
      setPin('')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8">
          <Lock size={24} className="text-white/40" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white mb-2">Resume Builder</h1>
        <p className="text-white/40 text-sm mb-8">Enter your PIN to access</p>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false) }}
            placeholder="••••••"
            className={`w-full text-center text-2xl tracking-[0.5em] bg-transparent border-b-2 ${
              error ? 'border-red-500' : 'border-white/20 focus:border-white/50'
            } pb-3 text-white font-mono placeholder:text-white/15 focus:outline-none transition-colors duration-300`}
            maxLength={8}
            autoComplete="off"
          />
          {error && <p className="text-red-400 text-xs mt-3 font-mono">Incorrect PIN</p>}
          <button
            type="submit"
            disabled={pin.length < 4 || verifying}
            className="mt-8 w-full py-3 rounded-full bg-white text-black font-mono text-sm font-semibold tracking-wider uppercase hover:opacity-80 transition-all duration-300 disabled:opacity-30"
          >
            {verifying ? 'Verifying...' : 'Unlock'}
          </button>
        </form>
        <a href="/" className="inline-block mt-6 text-white/20 text-xs font-mono hover:text-white/40 transition-colors">
          ← Back to portfolio
        </a>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-mono text-[10px] text-white/30 uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  )
}

function ResumePreview({ resume }: { resume: ResumeData }) {
  const headingClass = 'font-bold text-sm border-b border-gray-300 pb-1 mb-3 uppercase tracking-wider'
  return (
    <div className="text-black text-xs leading-relaxed">
      <h1 className="text-2xl font-bold text-center mb-1">{resume.name}</h1>
      <p className="text-center text-gray-500 text-[10px] mb-1">
        {resume.location} | {resume.phone} | {resume.email}
      </p>
      <p className="text-center text-gray-500 text-[10px] mb-4">
        {resume.linkedin} | {resume.github}
        {resume.website ? ` | ${resume.website}` : ''}
      </p>
      {resume.summary && (
        <p className="text-[11px] text-gray-700 mb-4 leading-relaxed">{resume.summary}</p>
      )}

      <h2 className={headingClass}>Professional Experience</h2>
      {resume.experience.map((exp, i) => (
        <div key={i} className="mb-4">
          <div className="flex justify-between items-baseline">
            <h3 className="font-bold text-[11px]">{exp.company}, {exp.location}</h3>
          </div>
          <div className="flex justify-between items-baseline">
            <p className="font-semibold text-[10px]">{exp.title}</p>
            <p className="text-gray-500 text-[10px]">{exp.dates}</p>
          </div>
          <ul className="list-disc ml-4 mt-1 space-y-0.5">
            {exp.bullets.map((b, j) => (
              <li key={j} className="text-[10px] text-gray-700 leading-relaxed">{b}</li>
            ))}
          </ul>
        </div>
      ))}

      <h2 className={headingClass}>Certifications</h2>
      <p className="text-[10px] text-gray-700 mb-4 leading-relaxed">
        <span className="font-bold">{resume.certifications.length}x Salesforce Certified:</span>{' '}
        {resume.certifications.map((cert) => `${cert.name} (${cert.date})`).join('  ·  ')}
      </p>

      <h2 className={headingClass}>Education</h2>
      {resume.education.map((edu, i) => (
        <div key={i} className="flex justify-between items-baseline mb-1">
          <p className="text-[10px] text-gray-700">
            <span className="font-bold">{edu.school}, {edu.location}</span>
            {' — '}
            {edu.degree}
            {edu.gpa ? ` (${edu.gpa} GPA)` : ''}
          </p>
          <p className="text-gray-500 text-[10px]">{edu.dates}</p>
        </div>
      ))}

      <h2 className={`${headingClass} mt-4`}>Technical Skills</h2>
      <p className="text-[10px] text-gray-700">{resume.skills.join(', ')}</p>

      {resume.projects.length > 0 && (
        <>
          <h2 className={`${headingClass} mt-4`}>Projects</h2>
          {resume.projects.map((project, i) => (
            <div key={i} className="mb-3">
              <p className="font-bold text-[11px]">
                {project.name} <span className="font-normal text-gray-500">({project.tech})</span>
              </p>
              <ul className="list-disc ml-4 space-y-0.5">
                {project.bullets.map((b, j) => (
                  <li key={j} className="text-[10px] text-gray-700">{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

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

export default function ResumeBuilder() {
  const [pin, setPin] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('resume')
  const [resume, setResume] = useState<ResumeData>(RESUME_DATA)
  const [jobDescription, setJobDescription] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [tailoredResume, setTailoredResume] = useState<ResumeData | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')
  const [pdfBuilding, setPdfBuilding] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('resume_pin')
    if (stored) setPin(stored)
  }, [])

  const handleTailor = useCallback(async () => {
    if (!jobDescription.trim() || !pin) return
    setAiLoading(true)
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
      setAiLoading(false)
    }
  }, [jobDescription, pin, resume])

  const handleCoverLetter = useCallback(async () => {
    if (!jobDescription.trim() || !pin) return
    setAiLoading(true)
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
      setAiLoading(false)
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

  if (!pin) return <PinGate onUnlock={setPin} />

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'resume', label: 'My Resume', icon: <FileText size={16} /> },
    { id: 'tailor', label: 'Tailor', icon: <WandSparkles size={16} /> },
    { id: 'cover-letter', label: 'Cover Letter', icon: <Mail size={16} /> },
  ]

  const downloadBtnClass =
    'absolute top-3 right-3 z-10 flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-xs font-mono uppercase tracking-wider hover:bg-gray-800 transition-all duration-200 disabled:opacity-40 shadow-lg'
  const aiBtnClass =
    'flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-mono text-sm font-semibold tracking-wider uppercase hover:opacity-80 transition-all duration-300 disabled:opacity-30'
  const textareaClass =
    'w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white text-sm font-body focus:outline-none focus:border-white/30 resize-none placeholder:text-white/15 transition-colors'

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="text-white/30 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </a>
          <h1 className="font-display text-lg font-bold text-white">
            Resume <span className="text-gradient">Builder</span>
          </h1>
        </div>
        <button
          onClick={() => { localStorage.removeItem('resume_pin'); setPin(null) }}
          className="text-white/20 hover:text-white/50 text-xs font-mono transition-colors"
        >
          Lock
        </button>
      </header>

      <div className="border-b border-white/5 px-6 flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-mono transition-colors border-b-2 -mb-px ${
              activeTab === t.id ? 'text-white border-white' : 'text-white/30 border-transparent hover:text-white/50'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-mono">
            {error}
          </div>
        )}

        {activeTab === 'resume' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Section title="Summary">
                <textarea
                  value={resume.summary}
                  rows={4}
                  onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm font-body focus:outline-none focus:border-white/30 resize-none transition-colors"
                />
              </Section>
              {resume.experience.map((exp, i) => (
                <Section key={i} title={`${exp.company} — ${exp.title}`}>
                  <p className="text-white/30 text-xs font-mono mb-2">{exp.dates}</p>
                  {exp.bullets.map((bullet, j) => (
                    <textarea
                      key={j}
                      value={bullet}
                      rows={2}
                      onChange={(e) => {
                        setResume((prev) => {
                          const next = structuredClone(prev)
                          next.experience[i].bullets[j] = e.target.value
                          return next
                        })
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-xs font-body focus:outline-none focus:border-white/30 resize-none mb-2 transition-colors"
                    />
                  ))}
                </Section>
              ))}
              <Section title="Skills">
                <input
                  value={resume.skills.join(', ')}
                  onChange={(e) =>
                    setResume({ ...resume, skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm font-body focus:outline-none focus:border-white/30 transition-colors"
                />
              </Section>
            </div>
            <div className="relative">
              <button
                onClick={() => handleDownloadResume('base')}
                disabled={pdfBuilding}
                title="Download as PDF"
                className={downloadBtnClass}
              >
                {pdfBuilding ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />}
                {pdfBuilding ? 'Building…' : 'Download PDF'}
              </button>
              <div className="bg-white rounded-xl p-8 text-black overflow-auto max-h-[80vh]">
                <ResumePreview resume={resume} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tailor' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Section title="Paste Job Description">
                <textarea
                  value={jobDescription}
                  rows={12}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className={textareaClass}
                />
              </Section>
              <button onClick={handleTailor} disabled={aiLoading || !jobDescription.trim()} className={aiBtnClass}>
                {aiLoading ? <LoaderCircle size={16} className="animate-spin" /> : <WandSparkles size={16} />}
                {aiLoading ? 'Tailoring...' : 'Tailor Resume'}
              </button>
            </div>
            <div className="relative">
              {tailoredResume && (
                <button
                  onClick={() => handleDownloadResume('tailored')}
                  disabled={pdfBuilding}
                  title="Download tailored resume as PDF"
                  className={downloadBtnClass}
                >
                  {pdfBuilding ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />}
                  {pdfBuilding ? 'Building…' : 'Download PDF'}
                </button>
              )}
              <div className="bg-white rounded-xl p-8 text-black overflow-auto max-h-[80vh]">
                {tailoredResume ? (
                  <ResumePreview resume={tailoredResume} />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    Paste a job description and click Tailor to see the result
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cover-letter' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Section title="Company Name (optional)">
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Google, Amazon..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm font-body focus:outline-none focus:border-white/30 placeholder:text-white/15 transition-colors"
                />
              </Section>
              <Section title="Paste Job Description">
                <textarea
                  value={jobDescription}
                  rows={10}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className={textareaClass}
                />
              </Section>
              <button onClick={handleCoverLetter} disabled={aiLoading || !jobDescription.trim()} className={aiBtnClass}>
                {aiLoading ? <LoaderCircle size={16} className="animate-spin" /> : <Mail size={16} />}
                {aiLoading ? 'Generating...' : 'Generate Cover Letter'}
              </button>
            </div>
            <div className="relative">
              {coverLetter && (
                <button
                  onClick={handleDownloadCoverLetter}
                  disabled={pdfBuilding}
                  title="Download cover letter as PDF"
                  className={downloadBtnClass}
                >
                  {pdfBuilding ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />}
                  {pdfBuilding ? 'Building…' : 'Download PDF'}
                </button>
              )}
              <div className="bg-white rounded-xl p-8 text-black overflow-auto max-h-[80vh]">
                {coverLetter ? (
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap font-body text-sm leading-relaxed">{coverLetter}</div>
                    <button
                      onClick={() => navigator.clipboard.writeText(coverLetter)}
                      className="mt-6 text-xs text-gray-500 hover:text-black transition-colors font-mono"
                    >
                      Copy to clipboard
                    </button>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    Paste a job description and click Generate to see the result
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
