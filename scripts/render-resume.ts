/**
 * Renders the resume to PDF using the exact same document component the
 * /resume builder uses, in the same paper palette as the builder's preview
 * (src/components/resume/paper.ts, which ResumePdf imports relatively so it
 * resolves here too).
 *
 *   npx --yes tsx scripts/render-resume.ts [output.pdf]
 *
 * The output carries the phone number and the case metrics. While the résumé
 * is private (RESUME_PUBLIC in src/lib/routes.ts), keep it out of public/ and
 * out of git.
 */
import { createElement } from 'react'
import { renderToFile } from '@react-pdf/renderer'
import ResumePDF from '../src/components/resume/ResumePdf'
import { RESUME_DATA } from '../src/lib/resume-data'

const out = process.argv[2] ?? 'Roman_Kucheryavyy_Resume.pdf'
await renderToFile(createElement(ResumePDF, { resume: RESUME_DATA }), out)
console.log(`written: ${out}`)
