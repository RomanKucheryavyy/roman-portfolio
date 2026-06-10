import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Hero from '@/components/sections/Hero'
import Featured from '@/components/sections/Featured'
import ClientWork from '@/components/sections/ClientWork'
import About from '@/components/sections/About'
import Contact from '@/components/sections/Contact'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Featured />
        <ClientWork />
        <About />
        <Contact />
      </main>
      <Footer />
      <div className="grain" aria-hidden="true" />
    </>
  )
}
