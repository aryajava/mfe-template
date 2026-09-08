# 13 — Agent Tooling Repo

> Fase 7 dari Jalur Belajar. Tooling untuk AI agent di repo ini — berguna saat memakai template bersama agent (Claude/OpenCode/dsb).

## `.agents/skills/` — Kumpulan Skill Agent

Repo punya sistem skill agent (~37 skill di `.agents/skills/`). `AGENTS.md` root merujuk ke dokumentasinya.

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
| `to-spec` / `to-tickets` / `to-questionnaire` | Ubah idea → spec → tickets/questionnaire |
| `grilling` / `grill-me` / `grill-with-docs` | Stress-test ide/rencana dengan pertanyaan kritis |
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
| `wait-what` | Jeda dan periksa ulang pemahaman |

### Setup & Writing Skills
| Skill | Fungsi |
|-------|--------|
| `setup-pre-commit` | Husky + lint-staged + Prettier |
| `setup-matt-pocock-skills` / `setup-ts-deep-modules` | Setup TypeScript skills pattern |
| `git-guardrails-claude-code` | Block destructive git commands |
| `migrate-to-shoehorn` | Migrasi type assertions |
| `writing-for-agents` | Menulis SKILL.md, AGENTS.md, CLAUDE.md |
| `wizard` | Generate bash wizard untuk setup manual |
| `teach` / `scaffold-exercises` | Materi pembelajaran & latihan |

## Issue Tracker — GitHub (`gh` CLI)

Repo: `aryajava/mfe-template` (lihat `docs/agents/issue-tracker.md`). Semua operasi pakai `gh`:

```bash
gh issue create --title "..." --body "..."          # buat issue (heredoc untuk body multi-baris)
gh issue view <n> --comments                        # baca issue + komentar
gh issue list --state open --json number,title,body,labels,comments
gh issue comment <n> --body "..."
gh issue edit <n> --add-label "..." / --remove-label "..."
gh issue close <n> --comment "..."
```

- **PR bukan permukaan request** (flag: no).
- Nomor issue & PR berbagi satu ruang nama — `#42` bisa keduanya: coba `gh pr view 42` dulu, fallback `gh issue view 42`.
- **Wayfinding (`/wayfinder`)**: map = satu issue label `wayfinder:map`; child = sub-issue dengan label `wayfinder:<type>`; blocking via GitHub native issue dependencies (`gh api .../dependencies/blocked_by`); frontier = child terbuka tanpa blocker & tanpa assignee, urutan pertama di map menang; claim = `--add-assignee @me`; resolve = komentar jawaban → close → pointer ke Decisions-so-far.

## Triage Labels (5 Label Kanonikal)

`docs/agents/triage-labels.md` — pemetaan role triage ke string label aktual:

| Label | Arti |
|-------|------|
| `needs-triage` | Issue baru, perlu evaluasi maintainer |
| `needs-info` | Menunggu info tambahan dari reporter |
| `ready-for-agent` | Fully specified, siap dikerjakan AFK agent |
| `ready-for-human` | Butuh implementasi/keputusan manusia |
| `wontfix` | Tidak akan dikerjakan |

## Domain Docs Protocol

`docs/agents/domain.md` — sebelum eksplorasi codebase, agent harus:
1. Baca `CONTEXT.md` di root, **atau** `CONTEXT-MAP.md` (jika ada) yang menunjuk satu `CONTEXT.md` per konteks.
2. Baca ADR di `docs/adr/` yang relevan (multi-konteks: cek juga `src/<context>/docs/adr/`).
3. Gunakan vocabulary dari glossary — jangan drift ke sinonim.
4. Flag konflik ADR secara eksplisit (jangan diam-diam menyimpang).

Jika file-file itu tidak ada → lanjut diam-diam, jangan sarankan membuatnya kecuali diminta (`/domain-modeling` yang membuat secara lazy).

## Konteks dengan Template Ini

- `AGENTS.md` root adalah titik masuk panduan agent.
- Belum ada `CONTEXT.md`/`CONTEXT-MAP.md`/`docs/adr/` — sesuai protocol, lanjut saja tanpa membuatnya.
- Saat menambah MFE baru lewat agent: pakai skill `implement`/`wayfinder`, dan baca [`09-pola-dan-insight.md`](./09-pola-dan-insight.md) checklist + [`12-risiko-dan-gap-produksi.md`](./12-risiko-dan-gap-produksi.md) sebelum menyelesaikan.

---
Lanjut ke [**14. Ujian Pemahaman & Cheat Sheet**](./14-ujian-dan-cheatsheet.md)