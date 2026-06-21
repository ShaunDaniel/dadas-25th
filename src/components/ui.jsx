import { useMemo } from 'react'
import { motion } from 'framer-motion'

export const EASE = [0.62, 0.01, 0.30, 1]

/* Animated letter-by-letter reveal (React-Bits "SplitText" style) */
export function SplitText({ text, className = '', delay = 0, stagger = 0.045 }) {
  const chars = useMemo(() => Array.from(String(text)), [text])
  return (
    <span className={className} aria-label={text}>
      {chars.map((c, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="inline-block"
          style={{ whiteSpace: 'pre' }}
          initial={{ opacity: 0, y: '0.5em', filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.85, ease: EASE, delay: delay + i * stagger }}
        >
          {c === ' ' ? ' ' : c}
        </motion.span>
      ))}
    </span>
  )
}

/* Soft rise + de-blur reveal for blocks of content */
export function FadeUp({ children, delay = 0, className = '', as = 'div' }) {
  const M = motion[as] || motion.div
  return (
    <M
      className={className}
      initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </M>
  )
}

export function Eyebrow({ children, delay = 0.1 }) {
  return (
    <FadeUp delay={delay}>
      <p className="eyebrow">{children}</p>
    </FadeUp>
  )
}

export function Ornament({ delay = 0.2, mini = false }) {
  const w = mini ? 'w-12 sm:w-16' : 'w-16 sm:w-24'
  return (
    <FadeUp delay={delay} className="flex items-center justify-center gap-3 py-1">
      <span className={`h-px ${w} foil-line`} />
      <span className="block h-[7px] w-[7px] rotate-45 bg-gradient-to-br from-white to-platinum-2 shadow-[0_0_7px_rgba(199,201,204,0.7)]" />
      <span className={`h-px ${w} foil-line`} />
    </FadeUp>
  )
}

export function Crest({ delay = 0 }) {
  return (
    <FadeUp delay={delay} className="flex justify-center">
      <span className="crest" aria-hidden="true">
        <span className="crest__ring" />
        <span className="crest__num">XXV</span>
      </span>
    </FadeUp>
  )
}

export function Aurora() {
  return (
    <div className="aurora" aria-hidden="true">
      <span className="aurora__layer aurora__a" />
      <span className="aurora__layer aurora__b" />
      <span className="aurora__layer aurora__c" />
    </div>
  )
}

export function Dust({ count = 22 }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        left: Math.random() * 100,
        top: 45 + Math.random() * 55,
        dur: 12 + Math.random() * 10,
        delay: Math.random() * 12,
        size: 1.5 + Math.random() * 2.8,
      })),
    [count],
  )
  return (
    <div className="dust" aria-hidden="true">
      {bits.map((b, i) => (
        <span
          key={i}
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
