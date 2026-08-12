#!/usr/bin/env python3
"""Generate src/lib/ui-i18n.ts with UTF-8 dictionaries (run from repo root)."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/lib/ui-i18n.ts"

en = {
    "nav.front": "Front Page",
    "nav.archive": "Archive",
    "nav.method": "Method",
    "nav.sections": "Sections",
    "nav.footer": "Footer",
    "masthead.est": "Est. 2026",
    "masthead.factline": "Fact-grounded · Auditable",
    "masthead.motto": "Someone has to keep you grounded.",
    "masthead.brandAria": "The Grounded Times — front page",
    "notice.stamp": "Notice",
    "notice.ask": "Have we kept you grounded?",
    "notice.jump": "Tell us ↓",
    "lang.label": "Language",
    "lang.aria": "Language",
    "deck.title": "In this edition",
    "deck.more": "{n} more dispatches",
    "deck.ordered": "ordered by importance",
    "deck.restAria": "The rest of this edition",
    "empty.noStories": "No stories were grounded in this edition.",
    "empty.browseArchive": "Browse the back issues →",
    "carousel.aria": "Featured dispatches",
    "carousel.lead": "The lead — by importance",
    "carousel.featured": "Featured — by importance",
    "carousel.continue": "Continue reading →",
    "carousel.prev": "Previous featured story",
    "carousel.next": "Next featured story",
    "carousel.pause": "Pause auto-rotation",
    "carousel.resume": "Resume auto-rotation",
    "carousel.select": "Select a featured story",
    "teaser.read": "Read",
    "briefs.title": "In Brief",
    "briefs.aria": "News in brief",
    "mode.report": "Report",
    "mode.debate": "Debate",
    "mode.reportTitle": "Report — grounded in a primary/official source.",
    "mode.debateTitle": (
        "Contested — no primary or official source; presented as a two-sided debate."
    ),
    "sources.one": "1 source",
    "sources.many": "{n} sources",
    "claims.one": "1 claim kept",
    "claims.many": "{n} claims kept",
    "verified": "{n} verified",
    "story.of": "No. {n} of {total}",
    "section.context": "Context",
    "section.report": "Report",
    "section.debate": "The debate",
    "section.grounded": "Grounded points",
    "section.whatWeKnow": "What we know",
    "section.photos": "Photographs",
    "section.cited": "Cited sources",
    "nav.prev": "← Previous",
    "nav.next": "Next →",
    "nav.backEdition": "Back to the edition",
    "nav.storyAria": "Story navigation",
    "debate.bottomLine": "The bottom line",
    "debate.oneAccount": "One account",
    "debate.otherAccount": "The other account",
    "debate.empty": "No counter-argument could be constructed from the sources.",
    "claim.primary": "Primary",
    "impact.high": "High",
    "impact.notable": "Notable",
    "impact.moderate": "Moderate",
    "impact.routine": "Routine",
    "impact.title": "Importance: {label}",
    "footer.correspondence": "Correspondence",
    "footer.lettersHeadline": "Have we kept you grounded?",
    "footer.lettersLede": (
        "The paper is written by machine; the verdict is yours. Tell us what "
        "landed, what felt off, and whether the citations earned your trust — "
        "a minute of frankness beats a thousand polite nods."
    ),
    "footer.lettersCta": "Write to the editor →",
    "footer.lettersNote": "Anonymous · takes about a minute · we actually read these",
    "footer.tagline": "Every claim, a citation",
    "footer.audit": (
        "Every claim above was extracted from source material, verified against "
        "its citations, and audited for hallucination. Items marked DEBATE lack "
        "a primary/official source and are presented as contested rather than confirmed."
    ),
    "footer.service": (
        "An autonomous, fact-grounded news service · Published by machine, "
        "grounded in sources"
    ),
    "footer.feedbackAria": "Reader feedback",
    "home.backIssues": "Read the back-issues →",
}

# Overlays stored as UTF-8 JSON sibling so this generator stays maintainable.
DICTS_JSON = ROOT / "scripts/ui-i18n-overlays.json"


def emit_dict(name: str, d: dict, *, full: bool = False) -> str:
    keys = list(en.keys())
    if full:
        lines = [f"const {name}: Dict = {{"]
        for k in keys:
            lines.append(f"  {json.dumps(k)}: {json.dumps(d[k], ensure_ascii=False)},")
        lines.append("};")
        return "\n".join(lines)
    lines = [f"const {name} = overlay(en, {{"]
    for k, v in d.items():
        lines.append(f"  {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)},")
    lines.append("});")
    return "\n".join(lines)


def main() -> None:
    overlays = json.loads(DICTS_JSON.read_text(encoding="utf-8"))
    for name, patch in overlays.items():
        blob = json.dumps(patch, ensure_ascii=False)
        if "\ufffd" in blob:
            raise SystemExit(f"replacement char in {name}")

    keys = list(en.keys())
    key_union = "\n".join(f'  | "{k}"' for k in keys)

    out = f"""/**
 * UI chrome strings for the broadsheet shell. Story prose comes from translated
 * Markdown; this dictionary covers masthead, deck, stamps, story chrome, and footer.
 *
 * Generated by scripts/gen-ui-i18n.py — edit scripts/ui-i18n-overlays.json then re-run.
 */
import {{ DEFAULT_LANG, isLang, type Lang }} from "./i18n";

export type UiKey =
{key_union};

type Dict = Record<UiKey, string>;

{emit_dict("en", en, full=True)}

function overlay(base: Dict, patch: Partial<Dict>): Dict {{
  return {{ ...base, ...patch }};
}}

{emit_dict("hi", overlays["hi"])}

{emit_dict("kn", overlays["kn"])}

{emit_dict("mr", overlays["mr"])}

{emit_dict("te", overlays["te"])}

const DICTS: Partial<Record<Lang, Dict>> = {{ en, hi, kn, mr, te }};

export function uiLang(value: string | null | undefined): Lang {{
  return isLang(value) ? value : DEFAULT_LANG;
}}

/** Interpolate `{{n}}` / `{{total}}` / `{{label}}` placeholders. */
export function t(
  lang: string | null | undefined,
  key: UiKey,
  vars?: Record<string, string | number>,
): string {{
  const code = uiLang(lang);
  const dict = DICTS[code] ?? en;
  let out = dict[key] ?? en[key] ?? key;
  if (key === "deck.more" && code === "en" && vars?.n !== undefined) {{
    const n = Number(vars.n);
    return `${{n}} more dispatch${{n === 1 ? "" : "es"}}`;
  }}
  if (vars) {{
    for (const [k, v] of Object.entries(vars)) {{
      out = out.split(`{{${{k}}}}`).join(String(v));
    }}
  }}
  return out;
}}

export function sourceCountLabel(
  lang: string | null | undefined,
  n: number,
): string {{
  return n === 1 ? t(lang, "sources.one") : t(lang, "sources.many", {{ n }});
}}

export function claimsKeptLabel(
  lang: string | null | undefined,
  n: number,
): string {{
  return n === 1 ? t(lang, "claims.one") : t(lang, "claims.many", {{ n }});
}}
"""
    if "\ufffd" in out:
        raise SystemExit("replacement char in output")
    OUT.write_text(out, encoding="utf-8")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
