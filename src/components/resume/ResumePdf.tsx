import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ResumeData } from '@/lib/resume-data'

const styles = StyleSheet.create({
  // NOTE: no page-level lineHeight — @react-pdf computes unitless multipliers
  // against the font size where they're DEFINED and inherits the result, so a
  // page value sized for 9pt body text would clip the 20pt name.
  page: { paddingVertical: 26, paddingHorizontal: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#111' },
  name: { fontSize: 19, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 6 },
  contact: { fontSize: 8, color: '#555', textAlign: 'center', marginBottom: 2, lineHeight: 1.35 },
  summary: { fontSize: 9, color: '#333', marginTop: 6, marginBottom: 2, lineHeight: 1.4 },
  sectionTitle: {
    fontSize: 10, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1,
    borderBottomWidth: 1, borderBottomColor: '#bbb', paddingBottom: 2, marginTop: 7, marginBottom: 4,
  },
  inlineList: { fontSize: 8.5, color: '#333', lineHeight: 1.4 },
  entry: { marginBottom: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  company: { fontSize: 9.5, fontFamily: 'Helvetica-Bold' },
  title: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#222' },
  dates: { fontSize: 8, color: '#555' },
  bullet: { flexDirection: 'row', marginTop: 1.5, paddingLeft: 8 },
  bulletDot: { width: 8, fontSize: 9 },
  bulletText: { flex: 1, fontSize: 8.5, color: '#333', lineHeight: 1.35 },
  eduDegree: { fontSize: 8.5, color: '#333', marginTop: 1.5, lineHeight: 1.4 },
  listItem: { fontSize: 8.5, color: '#333', marginBottom: 2, paddingLeft: 8, lineHeight: 1.4 },
  skills: { fontSize: 8.5, color: '#333', lineHeight: 1.45 },
  projectName: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  projectTech: { fontSize: 8.5, fontFamily: 'Helvetica', color: '#555' },
})

export default function ResumePDF({ resume }: { resume: ResumeData }) {
  return (
    <Document title={`${resume.name} — Resume`} author={resume.name}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.name}>{resume.name}</Text>
        <Text style={styles.contact}>
          {resume.location} | {resume.phone} | {resume.email}
        </Text>
        <Text style={styles.contact}>
          {resume.linkedin} | {resume.github}
          {resume.website ? ` | ${resume.website}` : ''}
        </Text>

        {resume.summary ? <Text style={styles.summary}>{resume.summary}</Text> : null}

        <Text style={styles.sectionTitle}>Professional Experience</Text>
        {resume.experience.map((exp, i) => (
          <View key={i} style={styles.entry} wrap={false}>
            <View style={styles.rowBetween}>
              <Text style={styles.company}>{exp.company}, {exp.location}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.title}>{exp.title}</Text>
              <Text style={styles.dates}>{exp.dates}</Text>
            </View>
            {exp.bullets.map((b, j) => (
              <View key={j} style={styles.bullet}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Certifications</Text>
        <Text style={styles.inlineList}>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>
            {resume.certifications.length}x Salesforce Certified:
          </Text>{' '}
          {resume.certifications.map((cert) => `${cert.name} (${cert.date})`).join('  ·  ')}
        </Text>

        <Text style={styles.sectionTitle}>Education</Text>
        {resume.education.map((edu, i) => (
          <View key={i} style={[styles.rowBetween, { marginBottom: 3 }]}>
            <Text style={styles.eduDegree}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>{edu.school}, {edu.location}</Text>
              {' — '}
              {edu.degree}
              {edu.gpa ? ` (${edu.gpa} GPA)` : ''}
            </Text>
            <Text style={styles.dates}>{edu.dates}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Technical Skills</Text>
        <Text style={styles.skills}>{resume.skills.join(', ')}</Text>

        {resume.projects.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Projects</Text>
            {resume.projects.map((project, i) => (
              <View key={i} style={{ marginBottom: 6 }} wrap={false}>
                <Text style={styles.projectName}>
                  {project.name} <Text style={styles.projectTech}>({project.tech})</Text>
                </Text>
                {project.bullets.map((b, j) => (
                  <View key={j} style={styles.bullet}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </>
        ) : null}
      </Page>
    </Document>
  )
}
