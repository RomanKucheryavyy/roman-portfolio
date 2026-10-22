import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ResumeData } from '@/lib/resume-data'
// Relative, so scripts/render-resume.ts (run with tsx) resolves it too.
import { PAPER } from './paper'

const styles = StyleSheet.create({
  page: { paddingVertical: 56, paddingHorizontal: 60, fontSize: 10.5, fontFamily: 'Helvetica', color: PAPER.ink },
  name: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  contact: { fontSize: 8.5, color: PAPER.muted, marginBottom: 2, lineHeight: 1.4 },
  divider: { borderBottomWidth: 1, borderBottomColor: PAPER.rule, marginTop: 10, marginBottom: 18 },
  subject: { fontSize: 9, color: PAPER.muted, marginBottom: 14 },
  body: { fontSize: 10.5, color: PAPER.ink, lineHeight: 1.5 },
})

interface CoverLetterPDFProps {
  resume: ResumeData
  coverLetter: string
  companyName?: string
}

export default function CoverLetterPDF({ resume, coverLetter, companyName }: CoverLetterPDFProps) {
  return (
    <Document title={`${resume.name} — Cover Letter`} author={resume.name}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.name}>{resume.name}</Text>
        <Text style={styles.contact}>{resume.location} | {resume.phone} | {resume.email}</Text>
        <Text style={styles.contact}>
          {resume.linkedin}
          {resume.website ? ` | ${resume.website}` : ''}
        </Text>
        <View style={styles.divider} />
        {companyName ? <Text style={styles.subject}>Re: Application — {companyName}</Text> : null}
        <Text style={styles.body}>{coverLetter}</Text>
      </Page>
    </Document>
  )
}
