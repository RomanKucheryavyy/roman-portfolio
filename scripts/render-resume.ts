/**
 * Renders the resume to PDF using the exact same document component the
 * /resume builder uses.
 *
 *   npx --yes tsx scripts/render-resume.ts [output.pdf]
 */
import { createElement } from 'react'
import { renderToFile } from '@react-pdf/renderer'
import ResumePDF from '../src/components/resume/ResumePdf'
import { RESUME_DATA } from '../src/lib/resume-data'

const out = process.argv[2] ?? 'Roman_Kucheryavyy_Resume.pdf'
await renderToFile(createElement(ResumePDF, { resume: RESUME_DATA }), out)
console.log(`written: ${out}`)
