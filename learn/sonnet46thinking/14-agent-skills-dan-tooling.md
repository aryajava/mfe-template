# 14. Agent Skills & Tooling
> **Model:** Claude Sonnet 4.6 (Thinking) | [← Kembali ke Index](./catatan_sonnet46thinking.md)

---

## 37 Agent Skills di `.agents/skills/`

Template ini hadir dengan sistem agent skill yang kaya. Semua tersimpan di `.agents/skills/`:

### Development Skills
| Skill | Fungsi |
|-------|--------|
| `implement` | Implementasi fitur dari deskripsi |
| `implement-spec` | Implementasi dari spec tertulis |
| `tdd` | Test-driven development (red-green-refactor) |
| `prototype` | Throwaway prototype untuk validasi desain |
| `code-review` | Review kode vs standar repo & spec |
| `diagnosing-bugs` | Loop diagnosis bug terstruktur |
| `resolving-merge-conflicts` | Resolve git merge/rebase conflicts |

### Planning & Design Skills
| Skill | Fungsi |
|-------|--------|
| `research` | Investigasi topik, dokumentasi temuan |
| `domain-modeling` | Buat/edit CONTEXT.md dan ADR |
| `codebase-design` | Desain modul dengan deep module vocabulary |
| `to-spec` | Ubah idea menjadi spec tertulis |
| `to-tickets` | Pecah spec menjadi tickets |
| `to-questionnaire` | Ubah spec menjadi questionnaire |
| `grilling` / `grill-me` | Stress-test ide/rencana dengan pertanyaan kritis |
| `grill-with-docs` | Grilling dengan domain docs sebagai referensi |
| `improve-codebase-architecture` | Identifikasi peluang perbaikan arsitektur |

### Collaboration Skills
| Skill | Fungsi |
|-------|--------|
| `wayfinder` | Orkestrasi task kompleks multi-step |
| `triage` | Triase issue GitHub |
| `retro` | Retrospektif sprint/project |
| `handoff` / `claude-handoff` | Handoff konteks antar agent |
| `loop-me` | Loop agent untuk monitoring jangka panjang |
| `ask-matt` | Eskalasi ke manusia spesifik |

### Setup Skills
| Skill | Fungsi |
|-------|--------|
| `setup-pre-commit` | Setup Husky + lint-staged + Prettier |
| `setup-matt-pocock-skills` | Setup TypeScript skills Matt Pocock style |
| `setup-ts-deep-modules` | Setup TypeScript deep modules pattern |
| `git-guardrails-claude-code` | Block destructive git commands |
| `migrate-to-shoehorn` | Migrasi type assertions ke shoehorn |

### Writing Skills
| Skill | Fungsi |
|-------|--------|
| `writing-for-agents` | Menulis SKILL.md, AGENTS.md, CLAUDE.md |
| `writing-beats` | Menulis story beats / narrative |
| `writing-fragments` | Menulis fragments / sketches |
| `writing-shape` | Shape up planning documents |
| `wizard` | Generate bash wizard untuk setup manual manusia |
| `scaffold-exercises` | Scaffold exercise directories |
| `teach` | Membuat materi pembelajaran |

## Issue Tracker — GitHub

Repo: `aryajava/mfe-template`

```bash
# CLI commands
gh issue create --title "..." --body "..."
gh issue view <number> --comments
gh issue list --state open --json number,title,body,labels,comments
gh issue comment <number> --body "..."
gh issue edit <number> --add-label "..."
gh issue close <number> --comment "..."
```

**Triage labels (5 label kanonikal):**

| Label | Arti |
|-------|------|
| `needs-triage` | Issue baru, belum dikategorikan |
| `needs-info` | Butuh info tambahan dari reporter |
| `ready-for-agent` | Siap dikerjakan AI agent |
| `ready-for-human` | Butuh keputusan/aksi manusia |
| `wontfix` | Tidak akan diperbaiki |

## Domain Docs Protocol

Sebelum mulai eksplorasi codebase, agent harus:

1. **Baca `CONTEXT.md`** di root (atau `CONTEXT-MAP.md` jika ada)
2. **Baca ADR** di `docs/adr/` yang relevan dengan area yang akan diubah
3. **Gunakan vocabulary dari glossary** — jangan drift ke sinonim berbeda
4. **Flag ADR conflicts** secara eksplisit jika output bertentangan ADR yang ada

Jika file-file itu tidak ada → lanjut tanpa komentar. Jangan suggestkan membuatnya kecuali diminta.

---
*Lanjut → [15. Pola Penting & Insight](./15-pola-penting-dan-insight.md)*
