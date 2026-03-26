import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { v4 as uuidv4 } from "uuid";
import type { AiResumeJson } from "../types";
import { scheduleFileDeletion } from "../utils/fileCleanup";

export type ResumeTemplate = "minimal" | "modern" | "executive";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderList(items: string[]): string {
  return items.map((it) => `<li>${escapeHtml(it)}</li>`).join("");
}

function renderSkills(skills: AiResumeJson["skills"]): string {
  return skills
    .map((s) => {
      const items = s.items.map((i) => escapeHtml(i)).join(", ");
      return `<div class="section-row"><div class="k">${escapeHtml(s.category)}</div><div class="v">${items}</div></div>`;
    })
    .join("");
}

function renderExperience(exp: AiResumeJson["experience"]): string {
  return exp
    .map((e) => {
      const bullets = e.bullets.length ? `<ul class="bullets">${e.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>` : "";
      return `<div class="block">
        <div class="row"><div class="company">${escapeHtml(e.company)}</div><div class="duration">${escapeHtml(e.duration)}</div></div>
        <div class="role">${escapeHtml(e.role)}</div>
        ${bullets}
      </div>`;
    })
    .join("");
}

function renderEducation(ed: AiResumeJson["education"]): string {
  return ed
    .map((x) => `<div class="edu-row"><div class="degree">${escapeHtml(x.degree)}</div><div class="school">${escapeHtml(x.school)}</div><div class="year">${escapeHtml(x.year)}</div></div>`)
    .join("");
}

function renderProjects(projects: AiResumeJson["projects"]): string {
  return projects
    .map((p) => {
      const bullets = `<ul class="bullets">${p.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`;
      const tech = p.tech.length ? `<div class="tech">${p.tech.map((t) => escapeHtml(t)).join(" · ")}</div>` : "";
      return `<div class="block">
        <div class="row"><div class="company">${escapeHtml(p.name)}</div></div>
        <div class="role">${escapeHtml(p.description)}</div>
        ${tech}
        ${bullets}
      </div>`;
    })
    .join("");
}

function getTemplatePath(template: ResumeTemplate, templatesDir: string): string {
  const file =
    template === "minimal"
      ? "resume-minimal.html"
      : template === "modern"
        ? "resume-modern.html"
        : "resume-executive.html";
  return path.join(templatesDir, file);
}

export async function generateResumePdf(input: {
  resumeJson: AiResumeJson;
  template: ResumeTemplate;
  generatedDir: string;
}): Promise<{ fileId: string; filePath: string }> {
  const { resumeJson, template, generatedDir } = input;
  fs.mkdirSync(generatedDir, { recursive: true });

  const fileId = `${uuidv4()}.pdf`;
  const filePath = path.join(generatedDir, fileId);

  const templatesDir = path.resolve(__dirname, "../templates");
  const templatePath = getTemplatePath(template, templatesDir);
  const templateHtml = await fs.promises.readFile(templatePath, "utf8");

  const context = {
    NAME: escapeHtml(resumeJson.name ?? ""),
    EMAIL: escapeHtml(resumeJson.email ?? ""),
    PHONE: escapeHtml(resumeJson.phone ?? ""),
    LINKEDIN: escapeHtml(resumeJson.linkedin ?? ""),
    GITHUB: escapeHtml(resumeJson.github ?? ""),
    SUMMARY: escapeHtml(resumeJson.summary ?? ""),
    SKILLS_HTML: renderSkills(resumeJson.skills ?? []),
    EXPERIENCE_HTML: renderExperience(resumeJson.experience ?? []),
    EDUCATION_HTML: renderEducation(resumeJson.education ?? []),
    PROJECTS_HTML: renderProjects(resumeJson.projects ?? []),
  };

  const html = templateHtml.replace(/{{(NAME|EMAIL|PHONE|LINKEDIN|GITHUB|SUMMARY|SKILLS_HTML|EXPERIENCE_HTML|EDUCATION_HTML|PROJECTS_HTML)}}/g, (_m, key: string) => {
    return (context as Record<string, string>)[key] ?? "";
  });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.emulateMediaType("print");
    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", bottom: "16mm", left: "14mm", right: "14mm" },
    });
  } finally {
    await browser.close();
  }

  // Cleanup after 60 minutes.
  scheduleFileDeletion(filePath, 60 * 60 * 1000);

  return { fileId, filePath };
}

