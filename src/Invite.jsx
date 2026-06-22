import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion'
import { Aurora, Dust, EASE } from './components/ui.jsx'
import { buildSlides } from './components/slides.jsx'

/* engraved corner flourish */
function Fil({ pos }) {
  return (
    <svg className={`fil fil--${pos}`} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M1 39 C1 19 19 1 39 1" stroke="currentColor" strokeWidth="1" opacity="0.75" />
      <path d="M1 30 C1 16 16 1 30 1" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      <circle cx="1.5" cy="38.5" r="1.4" fill="currentColor" />
    </svg>
  )
}

export default function Invite({ guest, slug }) {
  const slides = useMemo(() => buildSlides(guest, slug), [guest, slug])
  const n = slides.length
  const reduce = useReducedMotion()

  const [[index, dir], setState] = useState([0, 0])
  const [showHint, setShowHint] = useState(true)
  const lockRef = useRef(false)

  const paginate = useCallback(
    (step) => {
      setShowHint(false)
      setState(([cur]) => {
        const next = Math.min(n - 1, Math.max(0, cur + step))
        return next === cur ? [cur, 0] : [next, step]
      })
    },
    [n],
  )

  const jump = useCallback(
    (to) => {
      setShowHint(false)
      setState(([cur]) => (to === cur ? [cur, 0] : [to, to > cur ? 1 : -1]))
    },
    [],
  )

  /* keyboard + wheel + swipe */
  useEffect(() => {
    const onKey = (e) => {
      if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key)) paginate(1)
      else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) paginate(-1)
      else if (e.key === ' ') { e.preventDefault(); paginate(1) }
      else if (e.key === 'Home') jump(0)
      else if (e.key === 'End') jump(n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [paginate, jump, n])

  const onWheel = (e) => {
    const scroller = e.target.closest?.('.card__inner--scroll')
    if (scroller && scroller.scrollHeight > scroller.clientHeight + 2) {
      const atTop = scroller.scrollTop <= 0
      const atBot = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1
      if ((e.deltaY > 0 && !atBot) || (e.deltaY < 0 && !atTop)) return
    }
    if (Math.abs(e.deltaY) < 8 || lockRef.current) return
    lockRef.current = true
    paginate(e.deltaY > 0 ? 1 : -1)
    setTimeout(() => (lockRef.current = false), 900)
  }

  const touch = useRef({ x: 0, y: 0 })
  const onTouchStart = (e) => {
    touch.current = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
  }
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touch.current.x
    const dy = e.changedTouches[0].clientY - touch.current.y
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) paginate(dx < 0 ? 1 : -1)
    else if (Math.abs(dy) > 55 && Math.abs(dy) > Math.abs(dx)) paginate(dy < 0 ? 1 : -1)
  }

  /* desktop pointer tilt */
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 120, damping: 18 })
  const sry = useSpring(ry, { stiffness: 120, damping: 18 })
  const rotateX = useTransform(srx, (v) => `${v}deg`)
  const rotateY = useTransform(sry, (v) => `${v}deg`)
  const onPointerMove = (e) => {
    if (reduce || e.pointerType === 'touch') return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    ry.set(px * 7)
    rx.set(-py * 7)
  }
  const onPointerLeave = () => { rx.set(0); ry.set(0) }

  /* 3D card turn — a refined rotateY pivot with perspective + a little lateral
     drift and depth. Transform + opacity only, so it stays smooth on phones.
     Kept to a partial turn (no edge-on vanish, no backface flicker). */
  const stageVariants = reduce
    ? { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        enter: (d) => ({ opacity: 0, rotateY: d >= 0 ? 42 : -42, x: d >= 0 ? '12%' : '-12%', scale: 0.9 }),
        center: { opacity: 1, rotateY: 0, x: '0%', scale: 1 },
        exit: (d) => ({ opacity: 0, rotateY: d >= 0 ? -42 : 42, x: d >= 0 ? '-12%' : '12%', scale: 0.9 }),
      }

  return (
    <main
      className="relative h-[100svh] w-full overflow-hidden grain select-none"
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={(e) => {
        if (e.target.closest('a, button')) return
        paginate(1)
      }}
    >
      <div className="stage-bg" />
      <Aurora />
      <Dust count={16} />

      {/* monogram */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-40 text-platinum/70 tracking-[0.5em] text-xs uppercase whitespace-nowrap pointer-events-none"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 14px)', paddingLeft: '0.5em' }}
      >
        Dada · XXV
      </div>

      <div className="absolute inset-0 z-10" style={{ perspective: 1800 }}>
        <motion.div
          className="absolute inset-0"
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
          /* one-time page-entry pop — plays on first mount for every link */
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.84, y: 46, filter: 'blur(16px)' }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: reduce ? 0.5 : 1.15, ease: EASE }}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
        >
          <AnimatePresence custom={dir} initial={false}>
            <motion.div
              key={slides[index].key}
              custom={dir}
              variants={stageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: reduce ? 0.45 : 0.72, ease: EASE }}
              className="absolute inset-0 grid place-items-center px-4"
              style={{ transformStyle: 'preserve-3d', transformPerspective: 1100 }}
            >
              <div className="card">
                <div className="card__frame">
                  <span className="card__deco" />
                  <Fil pos="tl" />
                  <Fil pos="tr" />
                  <Fil pos="br" />
                  <Fil pos="bl" />
                  {slides[index].node}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* arrows */}
      <button
        className="nav-btn left-[clamp(6px,2vw,28px)]"
        aria-label="Previous page"
        disabled={index === 0}
        onClick={() => paginate(-1)}
      >
        &#8249;
      </button>
      <button
        className="nav-btn right-[clamp(6px,2vw,28px)]"
        aria-label="Next page"
        disabled={index === n - 1}
        onClick={() => paginate(1)}
      >
        &#8250;
      </button>

      {/* dots */}
      <nav
        className="absolute bottom-[clamp(16px,3.5svh,34px)] left-1/2 -translate-x-1/2 z-50 flex gap-4"
        aria-label="Invitation pages"
      >
        {slides.map((s, i) => (
          <button
            key={s.key}
            className={`dot ${i === index ? 'is-on' : ''}`}
            aria-label={`Go to page ${i + 1}`}
            aria-current={i === index ? 'true' : undefined}
            onClick={() => jump(i)}
          />
        ))}
      </nav>

      {showHint && (
        <p className="hint absolute bottom-[clamp(40px,8svh,64px)] left-1/2 -translate-x-1/2 z-40 m-0 text-platinum text-[0.8rem] tracking-[0.22em] uppercase italic whitespace-nowrap pointer-events-none">
          tap, swipe or scroll
        </p>
      )}
    </main>
  )
}
