import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { SplitText, FadeUp, Eyebrow, Ornament, Crest, EASE } from './ui.jsx'

const FOIL_COLORS = ['#C7C9CC', '#E9EBEE', '#F1E9DB', '#B8BAC0', '#FFFFFF']

function celebrate() {
  const fire = (opts) => confetti({ colors: FOIL_COLORS, ticks: 260, scalar: 0.9, disableForReducedMotion: true, ...opts })
  fire({ particleCount: 90, spread: 75, origin: { y: 0.4 }, startVelocity: 42 })
  setTimeout(() => fire({ particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.6 } }), 220)
  setTimeout(() => fire({ particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.6 } }), 380)
}

function Inner({ children, scroll = false }) {
  return (
    <div className={`card__inner items-center text-center ${scroll ? 'card__inner--scroll' : 'justify-center'}`}>
      {children}
    </div>
  )
}

/* ---- Page: Personal (only when a guest slug matches) ---- */
function Personal({ guest }) {
  const [ok, setOk] = useState(true)
  const file = guest.img.includes('.') ? guest.img : `${guest.img}.jpg`
  const src = `${import.meta.env.BASE_URL}guests/${file}`

  useEffect(() => {
    const t = setTimeout(celebrate, 450)
    return () => clearTimeout(t)
  }, [])

  return (
    <Inner>
      <Eyebrow>An invitation, just for you</Eyebrow>
      <Ornament delay={0.2} />
      <FadeUp delay={0.35} className="flex justify-center py-1">
        <span className="photo-frame">
          <span className="photo-frame__inner">
            {ok ? (
              <img src={src} alt={guest.name} onError={() => setOk(false)} />
            ) : (
              <span className="photo-frame__mono">{guest.name.charAt(0)}</span>
            )}
          </span>
        </span>
      </FadeUp>
      <h1 className="my-1 leading-none">
        <SplitText
          text={guest.name}
          className="font-script text-midnight text-[clamp(3rem,2rem+10vw,5rem)]"
          stagger={0.08}
          delay={0.55}
        />
      </h1>
      <FadeUp delay={0.9} as="p">
        <span className="block max-w-[30ch] mx-auto text-midnight/85 italic text-[clamp(1rem,0.94rem+0.6vw,1.2rem)] leading-relaxed">
          {guest.message}
        </span>
      </FadeUp>
      <FadeUp delay={1.2}>
        <p className="eyebrow mt-2 opacity-50">Turn the page &rsaquo;</p>
      </FadeUp>
    </Inner>
  )
}

/* ---- Page 1: The Announcement ---- */
function Announcement() {
  return (
    <Inner>
      <Crest delay={0.1} />
      <Eyebrow delay={0.25}>A Silver Jubilee</Eyebrow>
      <Ornament delay={0.4} />
      <h1 className="relative my-2 flex justify-center">
        <span className="watermark" aria-hidden="true">25</span>
        <SplitText
          text="Dada"
          className="font-script text-midnight text-[clamp(4rem,2.4rem+18vw,7.5rem)] leading-[0.9] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]"
          stagger={0.13}
          delay={0.5}
        />
      </h1>
      <FadeUp delay={0.9} as="p">
        <span className="block uppercase tracking-[0.24em] font-medium text-[clamp(1.1rem,0.95rem+1.7vw,1.6rem)]">
          Twenty-Five Years
        </span>
      </FadeUp>
      <FadeUp delay={1.1} as="p">
        <span className="block tracking-[0.36em] opacity-55 text-[clamp(0.74rem,0.66rem+0.5vw,0.9rem)] pl-[0.36em]">
          2001 &nbsp;&ndash;&nbsp; 2026
        </span>
      </FadeUp>
    </Inner>
  )
}

/* ---- Page 2: The Celebration (verbatim) ---- */
function Celebration() {
  return (
    <Inner scroll>
      <Eyebrow>The Celebration</Eyebrow>
      <span aria-hidden="true" className="quote-mark">&ldquo;</span>
      <blockquote className="max-w-[32ch] mx-auto text-midnight -mt-1">
        {/* opening aphorism — set apart as an epigraph */}
        <FadeUp delay={0.3} as="p">
          <span className="block font-serif italic text-[clamp(1.02rem,0.98rem+0.45vw,1.18rem)] leading-[1.45] text-midnight/90">
            They say the true measure of a man's wealth is found in the devotion of those who surround him.
          </span>
        </FadeUp>

        <FadeUp delay={0.5} as="p">
          <span className="block mt-[0.75em] text-[clamp(0.95rem,0.92rem+0.34vw,1.06rem)] leading-[1.6]">
            As <em className="not-italic font-semibold tracking-wide">Dada</em> marks this remarkable silver
            milestone, we find ourselves profoundly moved by the realization that his greatest fortune is
            not merely the years he has accumulated, but the beautiful constellation of family and friends
            who walk alongside him.
          </span>
        </FadeUp>

        <FadeUp delay={0.66} as="p">
          <span className="block mt-[0.7em] text-[clamp(0.95rem,0.92rem+0.34vw,1.06rem)] leading-[1.6]">
            To possess the love, loyalty, and presence of such exceptional souls on his special day is a
            gift of immeasurable grace.
          </span>
        </FadeUp>

        {/* closing blessing — emphasised, with a hairline divider */}
        <FadeUp delay={0.84} className="flex justify-center">
          <span className="block h-px w-12 foil-line my-[0.8em]" />
        </FadeUp>
        <FadeUp delay={0.92} as="p">
          <span className="block font-serif italic text-[clamp(1.04rem,1rem+0.5vw,1.2rem)] leading-[1.45]">
            He is truly, deeply blessed
            <br className="hidden sm:block" /> to have you in his life.
          </span>
        </FadeUp>
      </blockquote>
    </Inner>
  )
}

/* ---- Page 3: The Details ---- */
function Row({ label, children, delay }) {
  return (
    <FadeUp delay={delay} className="flex flex-col gap-1">
      <dt className="text-[0.7rem] tracking-[0.34em] uppercase opacity-55 font-medium">{label}</dt>
      <dd className="m-0 font-medium leading-tight text-[clamp(1.3rem,1.1rem+2vw,1.7rem)]">{children}</dd>
    </FadeUp>
  )
}
function Details() {
  const cal =
    'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Dada%27s%2025th%20Birthday%20%E2%80%94%20Silver%20Jubilee&dates=20260717T083000Z/20260717T123000Z&details=A%20Silver%20Jubilee%20celebration%20for%20Dada.%20We%20can%27t%20wait%20to%20celebrate%20with%20you.&location=Vacay%20Homes%20BLR'
  return (
    <Inner>
      <Eyebrow>You are invited</Eyebrow>
      <Ornament delay={0.2} />
      <dl className="w-full max-w-[30ch] mx-auto flex flex-col gap-[clamp(13px,2.8vw,20px)] mt-1">
        <Row label="Date" delay={0.35}>
          17<sup className="text-[0.55em]">th</sup> July 2026
          <span className="block italic font-normal opacity-65 mt-0.5 text-[clamp(0.82rem,0.78rem+0.5vw,0.95rem)]">
            Dada's 25th Birthday
          </span>
        </Row>
        <Row label="Time" delay={0.5}>
          2:00 in the afternoon
        </Row>
        <Row label="Venue" delay={0.65}>
          <a
            className="text-midnight no-underline border-b border-platinum-2 pb-px hover:border-midnight transition-colors"
            href="https://maps.app.goo.gl/SezZ1JKGFyVz3q5Y8?g_st=iw"
            target="_blank"
            rel="noopener"
            aria-label="Get directions to Vacay Homes BLR (opens Google Maps in a new tab)"
          >
            Vacay Homes BLR <span aria-hidden="true" className="text-[0.7em] opacity-70">&#8599;</span>
          </a>
          <span className="block italic font-normal opacity-65 mt-0.5 text-[clamp(0.82rem,0.78rem+0.5vw,0.95rem)]">
            🥂
          </span>
        </Row>
      </dl>
      <FadeUp delay={0.85} className="mt-3">
        <a
          className="group relative inline-block overflow-hidden uppercase tracking-[0.28em] text-[0.74rem] font-medium px-7 py-3 border border-platinum-2 rounded-[2px] text-midnight shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)] hover:bg-midnight/5 transition-colors"
          href={cal}
          target="_blank"
          rel="noopener"
        >
          Add to Calendar
          <span className="pointer-events-none absolute top-0 -left-1/2 h-full w-2/5 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent transition-[left] duration-700 ease-[cubic-bezier(0.62,0.01,0.3,1)] group-hover:left-[140%]" />
        </a>
      </FadeUp>
    </Inner>
  )
}

/* ---- Page 4: Closing ---- */
function Closing({ guest }) {
  return (
    <Inner>
      <Eyebrow>With love</Eyebrow>
      <Ornament delay={0.2} />
      <motion.p
        className="m-0 leading-[1.3] text-[clamp(1.55rem,1.2rem+3.8vw,2.5rem)]"
        initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 1, ease: EASE, delay: 0.4 }}
      >
        We can't wait to
        <br />
        celebrate with you
      </motion.p>
      <h2 className="m-0 leading-none">
        <SplitText
          text={guest ? `See you there, ${guest.name}` : 'See you there'}
          className="font-script text-midnight/90 text-[clamp(1.9rem,1.4rem+5vw,2.9rem)]"
          stagger={0.06}
          delay={0.7}
        />
      </h2>
      <Ornament delay={1.1} mini />
    </Inner>
  )
}

export function buildSlides(guest) {
  const slides = []
  if (guest) slides.push({ key: 'personal', node: <Personal guest={guest} /> })
  slides.push({ key: 'announce', node: <Announcement /> })
  slides.push({ key: 'celebrate', node: <Celebration /> })
  slides.push({ key: 'details', node: <Details /> })
  slides.push({ key: 'closing', node: <Closing guest={guest} /> })
  return slides
}
