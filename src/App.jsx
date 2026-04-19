import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CRUZE_CARS } from './cars-data'
import './App.css'

gsap.registerPlugin(ScrollTrigger)

/* ------------------------------------------------------------------ */
/* Static data                                                          */
/* ------------------------------------------------------------------ */

const heroData = [
  { title: 'Luxora Zenith', mileage: '10 KM', hp: '759 HP', engine: '6.5 L', price: '$550,000', id: 'luxora-zenith' },
  { title: 'Velox Horizon',  mileage: '5 KM',  hp: '820 HP', engine: '6.0 L', price: '$480,000', id: 'velox-horizon'  },
  { title: 'Aurora Strada',  mileage: '15 KM', hp: '670 HP', engine: '4.0 L', price: '$390,000', id: 'aurora-strada'  },
]

const heroImages = [
  'assets/hero-car.jpg',
  'assets/velox-horizon.jpg',
  'assets/luxora-zenith.jpg',
]

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  accent:  '#006be6',
  ink:     '#030303',
  display: 'Orbitron',
  h2:      36,
  radius:  12,
}/*EDITMODE-END*/

const FILTERS = ['all', 'business', 'family', 'adventure', 'wedding']

/* ------------------------------------------------------------------ */
/* SVG icon strings                                                     */
/* ------------------------------------------------------------------ */

const ICON_SEAT    = `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8h12c2 0 3 1 3 3v9H9v-9c0-2 1-3 3-3Z"/><path d="M9 20v8h18v-8"/><path d="M7 28h22"/></svg>`
const ICON_GEARBOX = `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="10" cy="12" r="2.5"/><circle cx="20" cy="12" r="2.5"/><circle cx="30" cy="12" r="2.5"/><circle cx="10" cy="28" r="2.5"/><circle cx="30" cy="28" r="2.5"/><path d="M10 14.5v11M20 14.5v6M30 14.5v11"/></svg>`
const ICON_LUGGAGE = `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><rect x="11" y="12" width="18" height="20" rx="2"/><path d="M16 12V8h8v4"/><path d="M11 18h18M11 26h18"/></svg>`

/* ------------------------------------------------------------------ */
/* Small reusable pieces                                               */
/* ------------------------------------------------------------------ */

function BtnArrow() {
  return (
    <span className="btn-arrow">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m9 5 7 7-7 7"/>
      </svg>
    </span>
  )
}

function CarCard({ car }) {
  return (
    <a className="mcard" href={`car.html?id=${car.id}`}>
      <div className="shot" style={{ backgroundImage: `url('${car.img}')` }} />
      <div>
        <div className="row-name">
          <div>
            <h3>{car.name}</h3>
            <div className="sub">{car.tagline}</div>
          </div>
          <div className="price">
            ${car.price}<span className="per">/Per {car.priceUnit}</span>
          </div>
        </div>
        <div className="stats">
          <div className="mstat">
            <span className="mstat-icon" dangerouslySetInnerHTML={{ __html: ICON_SEAT }} />
            <div><span className="k">Seat</span><span className="v">{car.seats}</span></div>
          </div>
          <div className="mstat">
            <span className="mstat-icon" dangerouslySetInnerHTML={{ __html: ICON_GEARBOX }} />
            <div><span className="k">Gearbox</span><span className="v">{car.gearbox}</span></div>
          </div>
          <div className="mstat">
            <span className="mstat-icon" dangerouslySetInnerHTML={{ __html: ICON_LUGGAGE }} />
            <div><span className="k">Luggage</span><span className="v">{car.luggage}</span></div>
          </div>
        </div>
      </div>
    </a>
  )
}

/* ------------------------------------------------------------------ */
/* Main App                                                            */
/* ------------------------------------------------------------------ */

export default function App() {
  const [heroIdx,  setHeroIdxRaw] = useState(0)
  const [filter,   setFilter]     = useState('all')
  const [tweaks,   setTweaks]     = useState({ ...TWEAK_DEFAULTS })
  const [editMode, setEditMode]   = useState(false)

  const cardCtxRef = useRef(null)

  function setHero(i) {
    setHeroIdxRaw((i + heroData.length) % heroData.length)
  }

  /* ── Tweaks: apply CSS vars ───────────────────────────────────────── */
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--accent',    tweaks.accent)
    root.style.setProperty('--ink',       tweaks.ink)
    root.style.setProperty('--display',   `'${tweaks.display}', system-ui, sans-serif`)
    root.style.setProperty('--radius-md', tweaks.radius + 'px')
    root.style.setProperty('--radius-lg', (tweaks.radius + 4) + 'px')
    document.querySelectorAll('.h2').forEach(h => { h.style.fontSize = tweaks.h2 + 'px' })
  }, [tweaks])

  /* ── Edit-mode postMessage bridge ────────────────────────────────── */
  useEffect(() => {
    function onMessage(e) {
      const d = e.data
      if (!d || typeof d !== 'object') return
      if (d.type === '__activate_edit_mode')   setEditMode(true)
      if (d.type === '__deactivate_edit_mode') setEditMode(false)
      if (d.type === '__edit_mode_set_keys')   setTweaks(prev => ({ ...prev, ...d.edits }))
    }
    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: '__edit_mode_available' }, '*')
    return () => window.removeEventListener('message', onMessage)
  }, [])

  function pushEdit(partial) {
    setTweaks(prev => ({ ...prev, ...partial }))
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: partial }, '*')
  }

  function injectFont(name) {
    if (name === 'Orbitron') return
    const id = `gf-${name.replace(/ /g, '-')}`
    if (!document.getElementById(id)) {
      const l = document.createElement('link')
      l.id   = id
      l.rel  = 'stylesheet'
      l.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, '+')}:wght@500;600;700&display=swap`
      document.head.appendChild(l)
    }
  }

  /* ── HERO ANIMATION (fires once on page load) ────────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Set all hero elements to invisible before first paint
      gsap.set(
        ['.hero-info .small', '.hero-info h1', '.hero-specs .spec',
         '.hero-details .left h3', '.hero-details .left p', '.more-info',
         '.hero-prices .price-item', '.hero-details .right .btn'],
        { opacity: 0, y: 24 }
      )
      gsap.set('.hero-menu',   { opacity: 0, x: 16 })
      gsap.set('.hero-arrows', { opacity: 0, y: -12 })

      // Staggered timeline — absolute position values (seconds) for control
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .to('.hero-info .small',          { opacity: 1, y: 0, duration: 0.6              }, 0.15)
        .to('.hero-info h1',              { opacity: 1, y: 0, duration: 0.9              }, 0.28)
        .to('.hero-specs .spec',          { opacity: 1, y: 0, duration: 0.65, stagger: 0.1 }, 0.52)
        .to('.hero-menu',                 { opacity: 1, x: 0, duration: 0.7              }, 0.35)
        .to('.hero-arrows',               { opacity: 1, y: 0, duration: 0.55             }, 0.65)
        .to('.hero-details .left h3',     { opacity: 1, y: 0, duration: 0.70             }, 0.60)
        .to('.hero-details .left p',      { opacity: 1, y: 0, duration: 0.70             }, 0.72)
        .to('.more-info',                 { opacity: 1, y: 0, duration: 0.65             }, 0.82)
        .to('.hero-prices .price-item',   { opacity: 1, y: 0, duration: 0.65, stagger: 0.12 }, 0.62)
        .to('.hero-details .right .btn',  { opacity: 1, y: 0, duration: 0.65             }, 0.88)
    })

    return () => ctx.revert()
  }, [])

  /* ── SCROLL REVEALS (all sections except car cards) ──────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {

      // ── About ───────────────────────────────────────────────────────
      gsap.set('.about-left > *, .about-right > h2.h2', { opacity: 0, y: 28 })
      gsap.set('.about-body > *', { opacity: 0, y: 28 })
      ScrollTrigger.create({
        trigger: '.about', start: 'top 80%', once: true,
        onEnter: () => {
          gsap.to('.about-left > *',      { opacity: 1, y: 0, duration: 0.75, stagger: 0.12, ease: 'power2.out' })
          gsap.to('.about-right > h2.h2', { opacity: 1, y: 0, duration: 0.75, ease: 'power2.out', delay: 0.10 })
          gsap.to('.about-body > *',      { opacity: 1, y: 0, duration: 0.75, stagger: 0.12, ease: 'power2.out', delay: 0.22 })
        },
      })

      // ── Models title + filters (cards handled separately) ───────────
      gsap.set('.models-title, .models-filters', { opacity: 0, y: 24 })
      ScrollTrigger.create({
        trigger: '.models', start: 'top 80%', once: true,
        onEnter: () => {
          gsap.to('.models-title',   { opacity: 1, y: 0, duration: 0.70, ease: 'power2.out' })
          gsap.to('.models-filters', { opacity: 1, y: 0, duration: 0.70, ease: 'power2.out', delay: 0.10 })
        },
      })

      // ── Brands ──────────────────────────────────────────────────────
      gsap.set('.brands-left .eyebrow, .brands-left h2.h2, .brands-left .btn', { opacity: 0, y: 24 })
      gsap.set('.brand-tile', { opacity: 0, y: 28, scale: 1.03 })
      ScrollTrigger.create({
        trigger: '.brands', start: 'top 80%', once: true,
        onEnter: () => {
          gsap.to('.brands-left .eyebrow', { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out' })
          gsap.to('.brands-left h2.h2',    { opacity: 1, y: 0, duration: 0.70, ease: 'power2.out', delay: 0.08 })
          gsap.to('.brands-left .btn',     { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out', delay: 0.16 })
          gsap.to('.brand-tile',           { opacity: 1, y: 0, scale: 1, duration: 0.80, stagger: 0.12, ease: 'power2.out', delay: 0.10 })
        },
      })

      // ── Why ─────────────────────────────────────────────────────────
      gsap.set('.why .eyebrow, .why h2.h2', { opacity: 0, y: 20 })
      gsap.set('.why-cell', { opacity: 0, y: 30 })
      ScrollTrigger.create({
        trigger: '.why', start: 'top 80%', once: true,
        onEnter: () => {
          gsap.to('.why .eyebrow', { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out' })
          gsap.to('.why h2.h2',    { opacity: 1, y: 0, duration: 0.70, ease: 'power2.out', delay: 0.08 })
          gsap.to('.why-cell',     { opacity: 1, y: 0, duration: 0.75, stagger: 0.12, ease: 'power2.out', delay: 0.15 })
        },
      })

      // ── Testimonials ────────────────────────────────────────────────
      gsap.set('.testi-head', { opacity: 0, y: 28 })
      gsap.set('.testi-grid .showroom, .testi-grid .tcard', { opacity: 0, y: 30 })
      ScrollTrigger.create({
        trigger: '.testi', start: 'top 80%', once: true,
        onEnter: () => {
          gsap.to('.testi-head', { opacity: 1, y: 0, duration: 0.75, ease: 'power2.out' })
          gsap.to('.testi-grid .showroom, .testi-grid .tcard', {
            opacity: 1, y: 0, duration: 0.80, stagger: 0.07, ease: 'power2.out', delay: 0.15,
          })
        },
      })

      // ── Blog ────────────────────────────────────────────────────────
      gsap.set('.blog-head',   { opacity: 0, y: 28 })
      gsap.set('.blog-feat',   { opacity: 0, y: 20, scale: 1.03 })
      gsap.set('.blog-item',   { opacity: 0, y: 28 })
      gsap.set('.blog-browse', { opacity: 0, y: 20 })
      ScrollTrigger.create({
        trigger: '.blog', start: 'top 80%', once: true,
        onEnter: () => {
          gsap.to('.blog-head',   { opacity: 1, y: 0, duration: 0.75, ease: 'power2.out' })
          gsap.to('.blog-feat',   { opacity: 1, y: 0, scale: 1, duration: 0.85, ease: 'power2.out', delay: 0.10 })
          gsap.to('.blog-item',   { opacity: 1, y: 0, duration: 0.70, stagger: 0.10, ease: 'power2.out', delay: 0.10 })
          gsap.to('.blog-browse', { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out', delay: 0.30 })
        },
      })

      // ── Footer ──────────────────────────────────────────────────────
      gsap.set('.footer-top h2.h2, .footer-row, .footer-meta', { opacity: 0, y: 20 })
      gsap.set('.footer-logo', { opacity: 0 })
      ScrollTrigger.create({
        trigger: '.footer', start: 'top 85%', once: true,
        onEnter: () => {
          gsap.to('.footer-top h2.h2', { opacity: 1, y: 0, duration: 0.80, ease: 'power2.out' })
          gsap.to('.footer-row',       { opacity: 1, y: 0, duration: 0.75, ease: 'power2.out', delay: 0.12 })
          gsap.to('.footer-meta',      { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out', delay: 0.22 })
          gsap.to('.footer-logo',      { opacity: 1,       duration: 0.90, ease: 'power3.out', delay: 0.10 })
        },
      })

      ScrollTrigger.refresh()
    })

    return () => ctx.revert()
  }, [])

  /* ── CAR CARDS (re-animates whenever filter changes) ─────────────── */
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      // Kill previous card tweens before re-animating new DOM nodes
      if (cardCtxRef.current) cardCtxRef.current.revert()

      const cards = gsap.utils.toArray('.mcard')
      const shots = gsap.utils.toArray('.mcard .shot')
      if (!cards.length) return

      cardCtxRef.current = gsap.context(() => {
        gsap.set(cards, { opacity: 0, y: 30 })
        gsap.set(shots, { scale: 1.03 })
        gsap.to(cards, { opacity: 1, y: 0,   duration: 0.70, stagger: 0.08, ease: 'power2.out', delay: 0.05 })
        gsap.to(shots, { scale: 1,            duration: 0.85, stagger: 0.08, ease: 'power2.out', delay: 0.05 })
      })
    })

    return () => cancelAnimationFrame(raf)
  }, [filter])

  /* ── Derived state ───────────────────────────────────────────────── */
  const visibleCars = CRUZE_CARS.filter(c => filter === 'all' || c.category === filter)
  const hero = heroData[heroIdx]

  return (
    <div className="page" id="page">

      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-left">
            <a href="#">Home</a>
            <a href="#about">About</a>
            <a href="#models">Models</a>
            <a href="#blog">Blog</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="nav-logo">CRUZE</div>
          <div className="nav-right">
            <a href="#contact">Contact</a>
            <button className="search" aria-label="Search">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="top">
        <div className="hero-stage" id="heroStage">

          {heroImages.map((img, i) => (
            <div key={i} className={`hero-slide${heroIdx === i ? ' active' : ''}`}>
              <div className="img" style={{ backgroundImage: `url('${img}')` }} />
              <div className="overlay-tint" />
            </div>
          ))}

          <div className="hero-menu">
            {heroImages.map((img, i) => (
              <div
                key={i}
                className={`hero-thumb${heroIdx === i ? ' active' : ''}`}
                style={{ backgroundImage: `url('${img}')` }}
                onClick={() => setHero(i)}
              />
            ))}
          </div>

          <div className="hero-info">
            <div>
              <div className="small">Model</div>
              <h1>{hero.title}</h1>
            </div>
            <div className="hero-specs">
              <div className="spec"><div className="small">Mileage</div><div className="v">{hero.mileage}</div></div>
              <div className="spec"><div className="small">Horsepower</div><div className="v">{hero.hp}</div></div>
              <div className="spec"><div className="small">Engine</div><div className="v">{hero.engine}</div></div>
            </div>
          </div>
        </div>

        <div className="hero-arrows">
          <button className="arrow-btn" aria-label="Previous" onClick={() => setHero(heroIdx - 1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="m15 5-7 7 7 7"/></svg>
          </button>
          <button className="arrow-btn" aria-label="Next" onClick={() => setHero(heroIdx + 1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="m9 5 7 7-7 7"/></svg>
          </button>
        </div>

        <div className="hero-details wrap-inner">
          <div className="left">
            <h3>Model Description</h3>
            <p>A refined expression of craftsmanship and engineering. Finished in factory pearl with an atelier-grade interior, every Cruze release is hand-selected for enthusiasts who expect more than just a car — they expect an instrument.</p>
            <a className="more-info" href={`car.html?id=${hero.id}`}>More Info <span aria-hidden="true">→</span></a>
          </div>
          <div className="right">
            <div className="hero-prices">
              <div className="price-item">
                <div className="lbl">Total Price</div>
                <div className="val">{hero.price}</div>
                <div className="sub">Inclusive of taxes</div>
              </div>
              <div className="price-item" style={{ textAlign: 'right' }}>
                <div className="lbl">Engine</div>
                <div className="val">6.5 L V12</div>
                <div className="sub">By Cruze Atelier</div>
              </div>
            </div>
            <a className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '12px' }} href="#contact">
              Approach Now
              <BtnArrow />
            </a>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="about" id="about">
        <div className="wrap">
          <div className="about-grid">
            <div className="about-left">
              <span className="eyebrow">About Us</span>
              <div>
                <div className="metric-num">550<sup>+</sup></div>
                <div className="metric-lbl">Models Sold</div>
              </div>
            </div>
            <div className="about-right">
              <h2 className="h2">Discover Cruze Excellence, Where Elite<br/>Cars Meet Your Passion and Precision in<br/>Every Deal You Make!</h2>
              <div className="about-body">
                <div className="small">Find top luxury cars fast!</div>
                <div className="about-thumb" style={{ backgroundImage: "url('assets/about-car.jpg')" }} />
                <div>
                  <p>Cruze curates a collection of the world's most desirable machines. From track-ready supercars to grand tourers, every listing is vetted by our specialists and delivered with the paperwork, warranty and concierge you deserve.</p>
                  <a className="btn btn-primary learn" href="#models">
                    Learn More
                    <BtnArrow />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODELS CATALOG */}
      <section className="models" id="models">
        <div className="wrap">
          <div className="models-title">
            <h2>Cars</h2>
          </div>
          <div className="models-filters">
            {FILTERS.map(f => (
              <button
                key={f}
                className={`filter-chip${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All cars' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="models-grid">
            {visibleCars.length === 0
              ? <div className="models-empty">No cars in this category yet — check back soon.</div>
              : visibleCars.map(car => <CarCard key={car.id} car={car} />)
            }
          </div>
        </div>
      </section>

      {/* BRANDS */}
      <section className="brands">
        <div className="wrap">
          <div className="brands-grid">
            <div className="brands-left">
              <span className="eyebrow">Model Brands</span>
              <h2 className="h2">Discover Top Brands of<br/>Our Stunning Models</h2>
              <a className="btn btn-primary" href="#models">
                Explore Models
                <BtnArrow />
              </a>
            </div>
            <div className="brands-right">
              <div className="brand-tile" style={{ backgroundImage: "url('assets/brand-1.jpg')" }}>
                <span className="lbl"><span className="bar" style={{ background: '#fff' }} />Audi</span>
              </div>
              <div className="brand-tile" style={{ backgroundImage: "url('assets/brand-2.jpg')" }}>
                <span className="lbl"><span className="bar" style={{ background: '#ff6a00' }} />Ferrari</span>
              </div>
              <div className="brand-tile" style={{ backgroundImage: "url('assets/brand-3.jpg')" }}>
                <span className="lbl"><span className="bar" style={{ background: '#d4a300' }} />Volvo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CRUZE */}
      <section className="why">
        <div className="wrap">
          <div style={{ textAlign: 'center' }}>
            <span className="eyebrow">Why Cruze?</span>
            <h2 className="h2 h2-center">Why Choose Cruze for Your<br/>Luxury Journey</h2>
          </div>
          <div className="why-grid">
            <div className="why-cell">
              <div className="why-icon">
                <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M24 4 6 10v14c0 11 8 19 18 22 10-3 18-11 18-22V10L24 4Z"/>
                  <path d="m16 24 6 6 12-12"/>
                </svg>
              </div>
              <h3>Prime Warranty</h3>
              <p>Every model ships with full manufacturer coverage and a Cruze-backed concierge warranty for peace of mind.</p>
            </div>
            <div className="why-cell">
              <div className="why-icon">
                <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="6" y="14" width="36" height="24" rx="2"/>
                  <path d="M6 22h36M14 30h6"/>
                </svg>
              </div>
              <h3>Easy Financing</h3>
              <p>Flexible, bespoke financing with transparent rates — pre-approval in as little as forty-eight hours.</p>
            </div>
            <div className="why-cell">
              <div className="why-icon">
                <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 20h24l-6-6M40 28H16l6 6"/>
                </svg>
              </div>
              <h3>Smart Trade-In</h3>
              <p>Get a market-leading valuation on your current ride, then apply it instantly to your next Cruze acquisition.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testi" id="testi">
        <div className="wrap">
          <div className="testi-head">
            <div>
              <span className="eyebrow">Testimonials</span>
              <h2 className="h2" style={{ marginTop: '16px' }}>See What Our Clients<br/>Say About Their Rides</h2>
            </div>
            <a className="btn btn-primary" href="#contact">
              Book Test Drive
              <BtnArrow />
            </a>
          </div>

          <div className="testi-grid">
            <div className="showroom" style={{ backgroundImage: "url('assets/testimonial-showroom1.jpg')" }} />

            <div className="tcard wide">
              <p className="quote">"Cruze made buying my McLaren effortless with Easy Financing. The Prime Warranty ensures I drive with total confidence on every thrilling journey!"</p>
              <div className="tcust">
                <div className="avatar" style={{ backgroundImage: "url('assets/customer-1.jpg')" }} />
                <div><div className="name">Alex Reed</div><div className="loc">New York</div></div>
              </div>
            </div>

            <div className="tcard small">
              <p className="quote">"Smart Trade-In at Cruze was fair. Loving my new Lamborghini!"</p>
              <div className="tcust">
                <div className="avatar" style={{ backgroundImage: "url('assets/customer-2.jpg')" }} />
                <div><div className="name">Mark Lane</div><div className="loc">Florida</div></div>
              </div>
            </div>

            <div className="tcard small">
              <p className="quote">"The Cruze team simplified financing for my Ferrari with ease!"</p>
              <div className="tcust">
                <div className="avatar" style={{ backgroundImage: "url('assets/customer-3.jpg')" }} />
                <div><div className="name">Luke Nash</div><div className="loc">Illinois</div></div>
              </div>
            </div>

            <div className="tcard wide">
              <p className="quote">"Cruze's Smart Trade-In valued my car perfectly. Exceptional service — now I love my dream Mercedes!"</p>
              <div className="tcust">
                <div className="avatar" style={{ backgroundImage: "url('assets/customer-1.jpg')" }} />
                <div><div className="name">Paul Gray</div><div className="loc">Texas</div></div>
              </div>
            </div>

            <div className="showroom" style={{ backgroundImage: "url('assets/testimonial-showroom2.jpg')" }} />
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section className="blog" id="blog">
        <div className="wrap">
          <div className="blog-head">
            <span className="eyebrow">Blog Posts</span>
            <h2 className="h2 h2-center" style={{ marginTop: '12px' }}>Our Latest Posts</h2>
            <p>Inside looks at fresh arrivals, market movement and the craft behind every Cruze acquisition.</p>
          </div>

          <div className="blog-grid">
            <div className="blog-feat" style={{ backgroundImage: "url('assets/velox-horizon.jpg')" }}>
              <div className="body">
                <h3>Top Lamborghini Aventador<br/>Review for Buyers</h3>
              </div>
              <div className="chip">
                <span className="tag-chip dark">Review</span>
                <span className="read-time">5 min read</span>
              </div>
            </div>

            <div className="blog-list">
              <div className="blog-item">
                <div className="meta">
                  <span className="tag-chip" style={{ background: '#E0E3E6' }}>Events</span>
                  <h4>Exciting Cruze 2025 Model<br/>Launch Event Highlights</h4>
                </div>
                <span className="r">4 min read</span>
              </div>
              <div className="blog-item">
                <div className="meta">
                  <span className="tag-chip" style={{ background: '#E0E3E6' }}>Reviews</span>
                  <h4>Ultimate McLaren 570S<br/>Performance Review</h4>
                </div>
                <span className="r">3 min read</span>
              </div>
              <div className="blog-item">
                <div className="meta">
                  <span className="tag-chip" style={{ background: '#E0E3E6' }}>Reviews</span>
                  <h4>Smart Trade-In Tips for<br/>Upgrading Your Ride</h4>
                </div>
                <span className="r">4 min read</span>
              </div>
            </div>
          </div>

          <div className="blog-browse">
            <a className="btn btn-primary" href="#">
              Browse All Posts
              <BtnArrow />
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer" id="contact">
        <div className="footer-inner">
          <div className="footer-top">
            <h2 className="h2">Drive Your Dreams with<br/>the Cruze Elite Luxury!</h2>
            <div className="footer-info">
              <div className="footer-row">
                <div className="footer-col">
                  <a href="#">Home</a>
                  <a href="#about">About</a>
                  <a href="#models">Models</a>
                  <a href="#blog">Blog</a>
                  <a href="#contact">Contact</a>
                </div>
                <div className="footer-col">
                  <a href="#">Style Guide</a>
                  <a href="#">Licences</a>
                  <a href="#">Changelog</a>
                </div>
                <div className="footer-col">
                  <a href="#">Info@Cruze.Com</a>
                  <a href="#">+1 (123) 456-7890</a>
                  <a href="#">Miami, Florida</a>
                  <a href="#">Tampa, Florida</a>
                </div>
                <div className="footer-cta">
                  <span className="small">Find top luxury cars fast!</span>
                  <a className="btn btn-invert" href="#models">
                    Explore Models
                    <BtnArrow />
                  </a>
                </div>
              </div>

              <div className="footer-meta">
                <div>Powered by <a href="#">Webflow</a>, Designed by <a href="#">AM Templates</a></div>
                <div className="footer-socials">
                  <a href="#" aria-label="Instagram">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
                    </svg>
                  </a>
                  <a href="#" aria-label="X">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 3l7 9-7 9h2.5L11 13.8 16.5 21H21l-7.3-9.4L20.5 3H18l-5.7 7L7 3H3z"/>
                    </svg>
                  </a>
                  <a href="#" aria-label="YouTube">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22 7.5a3 3 0 0 0-2.1-2.1C18 5 12 5 12 5s-6 0-7.9.4A3 3 0 0 0 2 7.5 31 31 0 0 0 1.6 12 31 31 0 0 0 2 16.5a3 3 0 0 0 2.1 2.1C6 19 12 19 12 19s6 0 7.9-.4a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-4.5 31 31 0 0 0-.4-4.5ZM10 15V9l5 3-5 3Z"/>
                    </svg>
                  </a>
                  <a href="#" aria-label="TikTok">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 3v3a5 5 0 0 0 5 5v3a8 8 0 0 1-5-1.7V15a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3V3h3Z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-logo">
            <div className="word">CRUZE</div>
          </div>
        </div>
      </footer>

      {/* TWEAKS PANEL */}
      <div className={`tweaks-panel${editMode ? ' on' : ''}`}>
        <h4>Tweaks</h4>
        <div className="tweaks-row">
          <label>Accent</label>
          <input type="color" value={tweaks.accent}
            onChange={e => pushEdit({ accent: e.target.value })} />
        </div>
        <div className="tweaks-row">
          <label>Ink</label>
          <input type="color" value={tweaks.ink}
            onChange={e => pushEdit({ ink: e.target.value })} />
        </div>
        <div className="tweaks-row">
          <label>Display font</label>
          <select value={tweaks.display}
            onChange={e => { injectFont(e.target.value); pushEdit({ display: e.target.value }) }}>
            <option value="Orbitron">Orbitron</option>
            <option value="Space Grotesk">Space Grotesk</option>
            <option value="Syncopate">Syncopate</option>
            <option value="Archivo">Archivo</option>
          </select>
        </div>
        <div className="tweaks-row">
          <label>Heading size</label>
          <input type="range" min="28" max="56" value={tweaks.h2}
            onChange={e => pushEdit({ h2: +e.target.value })} />
        </div>
        <div className="tweaks-row">
          <label>Radius</label>
          <input type="range" min="0" max="24" value={tweaks.radius}
            onChange={e => pushEdit({ radius: +e.target.value })} />
        </div>
      </div>

    </div>
  )
}
