import type { ProficiencyData } from "@/features/concepts/api/conceptsApi";

const cell = (value: string | number | null) => {
  const text = value === null ? "" : String(value);
  return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** One row per concept (and per student when the professor sees the class). Scores from 0 to 1. */
export function proficiencyCsv(data: ProficiencyData, label: (concept: string) => string): string {
  const lines = [["concept", "label", "answers", "score", "students", "practice_answers", "practice_score", "exam_answers", "exam_score"].join(",")];
  for (const item of data.concepts) {
    lines.push([item.concept, label(item.concept), item.total, item.score, item.students, item.practice.total, item.practice.score, item.exam.total, item.exam.score].map(cell).join(","));
  }
  if (data.students?.length) {
    lines.push("", ["student", "concept", "answers", "score"].join(","));
    for (const student of data.students) {
      for (const concept of Object.keys(student.concepts)) {
        lines.push([student.name, label(concept), student.concepts[concept].total, student.concepts[concept].score].map(cell).join(","));
      }
    }
  }
  return lines.join("\n") + "\n";
}

export function download(fileName: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
