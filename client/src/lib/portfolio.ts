export type Project = {
  index: string;
  title: string;
  eyebrow: string;
  description: string;
  technologies: string[];
  accent: string;
  note: string;
};

export type Skill = {
  name: string;
  category: string;
  detail: string;
  icon: string;
  color: string;
};

export const navItems = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "journey", label: "Journey" },
  { id: "contact", label: "Contact" },
];

export const skills: Skill[] = [
  { name: "Python", category: "Logic", detail: "Scripting, automation and the ideas that turn into tools.", icon: "PY", color: "#b7ff6a" },
  { name: "JavaScript", category: "Motion", detail: "Interfaces with enough energy to feel responsive and alive.", icon: "JS", color: "#e8ff79" },
  { name: "React", category: "Systems", detail: "Composable UI systems built for curiosity and clarity.", icon: "R", color: "#79efff" },
  { name: "HTML / CSS", category: "Surface", detail: "The visual grammar behind every digital world.", icon: "<>" , color: "#ff9a7a" },
  { name: "Git / GitHub", category: "Flow", detail: "Versioned thinking, shared momentum and clean handoffs.", icon: "GH", color: "#d5b2ff" },
  { name: "SQL", category: "Structure", detail: "Making data legible, useful and ready for the next layer.", icon: "DB", color: "#8aa8ff" },
];

export const projects: Project[] = [
  {
    index: "01",
    title: "Your next digital world",
    eyebrow: "PROJECT SLOT / EDITABLE",
    description: "A cinematic placeholder for the project you want visitors to remember. Replace this copy with a concise story about the problem, the build and the feeling you created.",
    technologies: ["React", "TypeScript", "WebGL"],
    accent: "lime",
    note: "Add your project URL in portfolio.ts",
  },
  {
    index: "02",
    title: "A tool with a pulse",
    eyebrow: "PROJECT SLOT / EDITABLE",
    description: "Use this space for a product, experiment or automation project. Keep the description grounded in what you actually made — no invented metrics, no filler.",
    technologies: ["Python", "API", "Interface"],
    accent: "violet",
    note: "Add your project URL in portfolio.ts",
  },
  {
    index: "03",
    title: "Something worth exploring",
    eyebrow: "PROJECT SLOT / EDITABLE",
    description: "The third slot is intentionally open. Turn it into a case study, a learning milestone or a strange little experiment that deserves a home.",
    technologies: ["HTML", "CSS", "JavaScript"],
    accent: "orange",
    note: "Add your project URL in portfolio.ts",
  },
];

export const journey = [
  { marker: "01", title: "Add your origin", text: "A short, honest sentence about what pulled you toward software and building." },
  { marker: "02", title: "Add a build phase", text: "Describe a project, experiment or stretch of learning that changed how you think." },
  { marker: "03", title: "Add the current signal", text: "What are you exploring now? Keep this present-tense and specific." },
  { marker: "04", title: "Leave room for next", text: "A future milestone placeholder for the next world you decide to make." },
];

export const highlights = [
  { label: "Projects", value: "Add a build worth revisiting" },
  { label: "Learning", value: "Add a concept in motion" },
  { label: "Tools", value: "Add the stack you reach for" },
];

export const sectionScenes: Record<string, { label: string; primary: string; secondary: string }> = {
  home: { label: "MIDNIGHT / ORBIT", primary: "#30228c", secondary: "#4fdcff" },
  about: { label: "BLUE HAZE / OPEN", primary: "#203e9c", secondary: "#9c9cff" },
  skills: { label: "CYAN / ACTIVE", primary: "#0d78a4", secondary: "#b17cff" },
  projects: { label: "INDIGO / CINEMATIC", primary: "#4c1f9a", secondary: "#e58dff" },
  journey: { label: "VIOLET / ATMOSPHERIC", primary: "#5a2c9f", secondary: "#72dfff" },
  contact: { label: "DEEP BLUE / OPEN", primary: "#163e7f", secondary: "#81e8ff" },
};

export const socialPlaceholders = [
  { label: "GitHub", short: "GH" },
  { label: "LinkedIn", short: "in" },
  { label: "Email", short: "@" },
];

export const dailyQuotes = [
  "Make the next small thing unusually thoughtful.",
  "A clear idea is already halfway to becoming a world.",
  "Let curiosity choose the direction, then let craft set the pace.",
  "Build what you wish existed, even if it starts as a quiet prototype.",
  "The best interface is an invitation to look closer.",
  "Keep the signal. Lose the noise.",
  "A little more attention can turn a tool into an experience.",
];

export function getDailyQuote(date = new Date()) {
  const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return dailyQuotes[((dayNumber % dailyQuotes.length) + dailyQuotes.length) % dailyQuotes.length];
}

export function formatDailyDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date).toUpperCase();
}
