import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Braces,
  Check,
  ChevronUp,
  CircleDot,
  Code2,
  Database,
  Github,
  Globe2,
  Layers3,
  Linkedin,
  Mail,
  Menu,
  MousePointer2,
  Orbit,
  Plus,
  Radar,
  Send,
  Sparkles,
  Terminal,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import WorldCanvas from "@/components/WorldCanvas";
import {
  highlights,
  journey,
  navItems,
  projects,
  sectionScenes,
  skills,
  socialPlaceholders,
  formatDailyDate,
  getDailyQuote,
} from "@/lib/portfolio";

type SceneId = keyof typeof sectionScenes;
type ContactState = "idle" | "sending" | "success" | "error";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="section-label">
      <span className="section-label-dot" />
      <span>{children}</span>
    </div>
  );
}

function IconForSkill({ index }: { index: number }) {
  const icons = [Terminal, Zap, Code2, Braces, Github, Database];
  const Icon = icons[index] ?? CircleDot;
  return <Icon size={17} strokeWidth={1.7} />;
}

export default function Home() {
  const [activeSection, setActiveSection] = useState<SceneId>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSkill, setActiveSkill] = useState(0);
  const [contactState, setContactState] = useState<ContactState>("idle");
  const [contactError, setContactError] = useState("");
  const [quoteDate, setQuoteDate] = useState(() => new Date());
  const [dailyQuote, setDailyQuote] = useState(() => getDailyQuote());
  const [quotePulse, setQuotePulse] = useState(false);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sectionElements = navItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id && visible.target.id in sectionScenes) {
          setActiveSection(visible.target.id as SceneId);
        }
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0.08, 0.2, 0.5] },
    );
    sectionElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frame = 0;
    let currentX = -100;
    let currentY = -100;
    let targetX = -100;
    let targetY = -100;
    const onPointerMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
    };
    const onPointerOver = (event: PointerEvent) => {
      document.body.classList.toggle("cursor-hover", Boolean((event.target as HTMLElement).closest("[data-cursor-hover]")));
    };
    const render = () => {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      if (cursorDotRef.current) cursorDotRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      if (cursorRingRef.current) cursorRingRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      frame = requestAnimationFrame(render);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerover", onPointerOver, { passive: true });
    frame = requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerover", onPointerOver);
    };
  }, []);

  useEffect(() => {
    const midnightWatcher = window.setInterval(() => {
      const now = new Date();
      const nextQuote = getDailyQuote(now);
      if (nextQuote !== dailyQuote) {
        setQuoteDate(now);
        setDailyQuote(nextQuote);
        setQuotePulse(false);
        window.requestAnimationFrame(() => setQuotePulse(true));
      }
    }, 60_000);
    return () => window.clearInterval(midnightWatcher);
  }, [dailyQuote]);

  const handleContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setContactState("sending");
    setContactError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          message: formData.get("message"),
          website: formData.get("website"),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "The message could not be delivered right now.");
      setContactState("success");
      toast.success("Message sent.");
    } catch (error) {
      setContactState("error");
      setContactError(error instanceof Error ? error.message : "The message could not be delivered right now.");
      toast.error("Message not sent — please try again.");
    }
  };

  const replaySignal = () => {
    setQuotePulse(false);
    window.requestAnimationFrame(() => setQuotePulse(true));
    toast("Signal replayed — the field is listening.");
  };

  const currentScene = sectionScenes[activeSection];

  return (
    <div className="portfolio-shell" style={{ "--scene-primary": currentScene.primary, "--scene-secondary": currentScene.secondary } as React.CSSProperties}>
      <WorldCanvas scene={currentScene} />
      <div className="grain-layer" aria-hidden="true" />
      <div className="cursor-dot" ref={cursorDotRef} aria-hidden="true" />
      <div className="cursor-ring" ref={cursorRingRef} aria-hidden="true"><span /></div>

      <header className="topbar">
        <button className="brand-lockup" onClick={() => scrollToSection("home")} data-cursor-hover aria-label="Go to home">
          <span className="brand-mark"><span /></span>
          <span className="brand-name">EJAJULLA<span className="brand-name-muted">/K</span></span>
        </button>
        <nav className={`desktop-nav ${menuOpen ? "is-open" : ""}`} aria-label="Primary navigation">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={activeSection === item.id ? "nav-link active" : "nav-link"}
              onClick={() => setMenuOpen(false)}
              data-cursor-hover
            >
              <span>{item.label}</span>
              {activeSection === item.id && <i />}
            </a>
          ))}
        </nav>
        <button className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label="Toggle navigation" data-cursor-hover>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <aside className="scene-status" aria-live="polite">
        <span className="status-pulse" />
        <span>WORLD STATE / {currentScene.label}</span>
      </aside>

      <main>
        <section id="home" className="hero section-shell">
          <div className="hero-copy">
            <div className="hero-kicker reveal-up"><span>01</span><span className="line" /><span>DEVELOPER / DIGITAL BUILDER</span></div>
            <div className="hero-identity reveal-up delay-1"><span>PORTFOLIO / 001</span><strong>EJAJULLA KHAN</strong></div>
            <h1 className="hero-title reveal-up delay-1">
              <span>MAKE</span>
              <span className="hero-title-outline">DIGITAL</span>
              <span>FEEL <em>ALIVE.</em></span>
            </h1>
            <p className="hero-description reveal-up delay-2">I’m <strong>Ejajulla Khan</strong> — exploring software, web development and interactive experiences that reward curiosity.</p>
            <div className="hero-actions reveal-up delay-3">
              <button className="magnetic-button primary-button" onClick={() => scrollToSection("projects")} data-cursor-hover>
                <span>Enter the work</span><ArrowUpRight size={17} />
              </button>
              <button className="text-button" onClick={() => scrollToSection("about")} data-cursor-hover>
                <span>Read the signal</span><ArrowRight size={16} />
              </button>
            </div>
          </div>
          <div className="hero-coordinate" aria-hidden="true"><span>24° 41′ 18″ N</span><span>73° 53′ 47″ E</span></div>
          <div className="hero-scroll-hint"><MousePointer2 size={15} /><span>Scroll to move through the world</span><ArrowDown size={15} /></div>
          <div className="hero-side-note"><span>SCROLL DEPTH</span><strong>001 / 006</strong></div>
        </section>

        <section id="about" className="section-shell about-section">
          <div className="section-inner two-column-grid">
            <div className="section-intro">
              <SectionLabel>02 / IDENTITY SIGNAL</SectionLabel>
              <h2 className="display-heading">A builder<br /><span>in orbit.</span></h2>
              <p className="section-lede">The best digital experiences don’t just work. They create a small gravitational pull — a reason to stay, look closer and try something.</p>
              <button className="circle-link" onClick={() => scrollToSection("skills")} data-cursor-hover aria-label="Go to skills"><ArrowDown size={19} /></button>
            </div>
            <div className="identity-orbit">
              <div className="orbit-rings"><span /><span /><span /></div>
              <div className="identity-core"><span className="core-overline">IDENTITY / 001</span><strong>EJ</strong><span className="core-caption">CURIOUS BY DEFAULT</span></div>
              <div className="orbit-label label-top">SOFTWARE</div>
              <div className="orbit-label label-right">WEB / UI</div>
              <div className="orbit-label label-bottom">INTERACTION</div>
              <div className="orbit-label label-left">LEARNING</div>
            </div>
          </div>
          <div className="section-inner about-bottom-grid">
            <div className="micro-note"><Sparkles size={15} /><span>Every placeholder here is designed to be edited with your real story.</span></div>
            <div className="about-copy"><p>I’m interested in the space where logic becomes feeling: Python scripts, thoughtful interfaces, expressive frontends and the tiny decisions that make technology more human.</p><p>This world is a starting point, not a claim about a history that hasn’t been written here yet.</p></div>
          </div>
        </section>

        <section id="skills" className="section-shell skills-section">
          <div className="section-inner">
            <div className="section-heading-row"><div><SectionLabel>03 / THE CONSTELLATION</SectionLabel><h2 className="display-heading">Tools for<br /><span>making signals.</span></h2></div><div className="heading-aside"><span>SELECT A NODE</span><strong>{String(activeSkill + 1).padStart(2, "0")} / {String(skills.length).padStart(2, "0")}</strong></div></div>
            <div className="skills-interface">
              <div className="skill-map" aria-label="Interactive skill constellation">
                <div className="map-grid" />
                <div className="map-crosshair" />
                <div className="map-orbit orbit-a" /><div className="map-orbit orbit-b" />
                <div className="map-core"><Radar size={26} strokeWidth={1.4} /><span>CORE<br />SYSTEM</span></div>
                {skills.map((skill, index) => {
                  const positions = ["node-north", "node-east", "node-south-east", "node-south-west", "node-west", "node-north-west"];
                  return <button key={skill.name} className={`skill-node ${positions[index]} ${activeSkill === index ? "selected" : ""}`} onClick={() => setActiveSkill(index)} data-cursor-hover aria-label={`Show ${skill.name} skill`}><span className="node-line" /><span className="node-orb" style={{ "--node-color": skill.color } as React.CSSProperties}><IconForSkill index={index} /></span><span className="node-name">{skill.name}</span></button>;
                })}
              </div>
              <div className="skill-detail glass-panel">
                <div className="detail-topline"><span>NODE DETAILS</span><span className="detail-index">{String(activeSkill + 1).padStart(2, "0")}</span></div>
                <div className="detail-icon" style={{ "--node-color": skills[activeSkill].color } as React.CSSProperties}><IconForSkill index={activeSkill} /></div>
                <span className="detail-category">{skills[activeSkill].category} / SIGNAL</span>
                <h3>{skills[activeSkill].name}</h3>
                <p>{skills[activeSkill].detail}</p>
                <div className="detail-footer"><span className="mini-bars"><i /><i /><i /><i /><i /></span><span>ACTIVE / EXPLORING</span></div>
              </div>
            </div>
          </div>
        </section>

        <section id="projects" className="section-shell projects-section">
          <div className="section-inner">
            <div className="section-heading-row projects-heading"><div><SectionLabel>04 / SELECTED WORLDS</SectionLabel><h2 className="display-heading">Projects with<br /><span>an atmosphere.</span></h2></div><p className="heading-copy">The work section is intentionally modular. Replace the editable slots with the builds, experiments and milestones that make your story real.</p></div>
            <div className="project-stack">
              {projects.map((project) => (
                <article key={project.index} className={`project-card accent-${project.accent}`} data-cursor-hover>
                  <div className="project-visual"><div className="visual-scanlines" /><div className="visual-shape" /><div className="visual-orbit" /><span className="visual-code">{`{`} / / / {project.index} {`}`}</span><span className="visual-label">VISUAL PLACEHOLDER</span></div>
                  <div className="project-copy"><div className="project-meta"><span>{project.eyebrow}</span><span>{project.index}</span></div><h3>{project.title}</h3><p>{project.description}</p><div className="project-tags">{project.technologies.map((tech) => <span key={tech}>{tech}</span>)}</div><button className="project-link" onClick={() => toast(project.note)} data-cursor-hover><span>Open project signal</span><ArrowUpRight size={16} /></button></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="journey" className="section-shell journey-section">
          <div className="section-inner">
            <div className="section-heading-row"><div><SectionLabel>05 / CONTINUOUS LEARNING</SectionLabel><h2 className="display-heading">The path is<br /><span>still unfolding.</span></h2></div><div className="journey-stamp"><Orbit size={19} /><span>NO FINAL FORM<br /><b>KEEP BUILDING</b></span></div></div>
            <div className="journey-path"><div className="journey-line" />{journey.map((item, index) => <div className={`journey-item ${index % 2 ? "reverse" : ""}`} key={item.marker}><div className="journey-marker"><span>{item.marker}</span></div><div className="journey-card"><span className="journey-kicker">EDITABLE MILESTONE</span><h3>{item.title}</h3><p>{item.text}</p><button className="tiny-add" onClick={() => toast("Replace this milestone with your real story.")} data-cursor-hover><Plus size={15} /></button></div></div>)}</div>
            <div className="highlights-row">{highlights.map((highlight) => <div className="highlight-item" key={highlight.label}><span>{highlight.label}</span><strong>{highlight.value}</strong></div>)}</div>
          </div>
        </section>

        <section id="contact" className="section-shell contact-section">
          <div className="contact-orbit" aria-hidden="true"><span /><span /><span /></div>
          <div className="section-inner contact-inner">
            <div className="contact-copy"><SectionLabel>06 / OPEN CHANNEL</SectionLabel><h2 className="contact-heading">Let’s build<br /><span>something.</span></h2><p>Have a project, an experiment or an impossible little idea? The channel is open.</p><div className="social-row">{socialPlaceholders.map((social) => <button key={social.label} className="social-link" onClick={() => toast(`Add your ${social.label} URL in Home.tsx.`)} data-cursor-hover><span>{social.short === "GH" ? <Github size={17} /> : social.short === "in" ? <Linkedin size={17} /> : <Mail size={17} />}</span>{social.label}<ArrowUpRight size={14} /></button>)}</div></div>
            <form className="contact-form glass-panel" onSubmit={handleContact} aria-busy={contactState === "sending"}>
              <div className="form-topline"><span>TRANSMISSION FORM</span><span><span className="status-pulse" /> SECURE / RESEND</span></div>
              {contactState === "success" ? <div className="form-success" aria-live="polite"><div className="success-mark"><Check size={23} /></div><h3>Message sent.</h3><p>Thank you for reaching out. Your signal is on its way.</p><button type="button" className="text-button" onClick={() => setContactState("idle")} data-cursor-hover>Send another <ArrowRight size={15} /></button></div> : <><label className="contact-trap" aria-hidden="true"><span>Website</span><input tabIndex={-1} autoComplete="off" name="website" /></label><label><span>Your name</span><input required name="name" autoComplete="name" placeholder="How should I call you?" /></label><label><span>Your email</span><input required type="email" name="email" autoComplete="email" placeholder="name@signal.com" /></label><label><span>Message</span><textarea required name="message" rows={4} maxLength={5000} placeholder="Tell me what you’re imagining..." /></label>{contactState === "error" && <p className="form-error" role="alert">{contactError}</p>}<button className="magnetic-button primary-button form-submit" type="submit" disabled={contactState === "sending"} data-cursor-hover><span>{contactState === "sending" ? "Sending signal..." : "Send the signal"}</span>{contactState === "sending" ? <span className="form-spinner" aria-hidden="true" /> : <Send size={16} />}</button><small>Your message is sent securely and never exposed in the browser.</small></>}
            </form>
          </div>
        </section>

        <section id="daily-signal" className={`section-shell daily-quote-section ${quotePulse ? "signal-burst" : ""}`}>
          <div className="quote-ambient quote-ambient-one" aria-hidden="true" />
          <div className="quote-ambient quote-ambient-two" aria-hidden="true" />
          <div className="section-inner quote-inner">
            <div className="quote-heading-row"><SectionLabel>07 / TODAY’S SIGNAL</SectionLabel><span className="quote-date">DATE / {formatDailyDate(quoteDate)}</span></div>
            <div className="quote-symbol" aria-hidden="true"><span /><span /><span /></div>
            <blockquote key={dailyQuote} className="daily-quote">“{dailyQuote}”</blockquote>
            <div className="quote-footer"><span>ONE THOUGHT / ONE DAY</span><button className="quote-replay" onClick={replaySignal} data-cursor-hover><Sparkles size={14} /><span>Replay signal</span><ArrowUpRight size={14} /></button></div>
          </div>
        </section>

        <section id="outro" className="section-shell outro-section">
          <div className="outro-lines" aria-hidden="true"><span /><span /><span /></div>
          <div className="section-inner outro-inner"><SectionLabel>08 / END OF CURRENT TRANSMISSION</SectionLabel><h2 className="outro-name"><span>EJAJULLA</span><strong>KHAN</strong></h2><p>Until the next idea.</p><button className="text-button" onClick={() => scrollToSection("home")} data-cursor-hover>Return to the signal <ChevronUp size={15} /></button></div>
        </section>
      </main>

      <footer className="site-footer"><div className="footer-brand"><span className="brand-mark"><span /></span><strong>EJAJULLA KHAN</strong></div><span className="footer-note">BUILT WITH CURIOSITY / 2026</span><button className="back-top" onClick={() => scrollToSection("home")} data-cursor-hover aria-label="Back to top"><ChevronUp size={17} /></button></footer>
    </div>
  );
}
