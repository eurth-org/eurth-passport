/**
 * A checker for real machine-readable zones, written from the public standard (ICAO Doc 9303,
 * parts 3 to 6). It lives in the tests and nowhere else: the tool itself knows nothing about the
 * format. The tests use it to prove that nothing Passport draws could ever be read as one.
 */
const WEIGHTS = [7, 3, 1];

const valueOf = (ch: string): number => {
  if (ch >= '0' && ch <= '9') return ch.charCodeAt(0) - 48;
  if (ch >= 'A' && ch <= 'Z') return ch.charCodeAt(0) - 55;
  return 0; // the filler
};

/** The check digit of a field. */
export function checkDigit(text: string): number {
  let sum = 0;
  for (let i = 0; i < text.length; i++) sum += valueOf(text[i]!) * WEIGHTS[i % 3]!;
  return sum % 10;
}

export type MrzKind = 'TD1' | 'TD2' | 'TD3';

const line = (length: number): RegExp => new RegExp(`^[A-Z0-9<]{${length}}$`);

/** Which kind of zone these lines have the shape of, if any. */
export function mrzShape(lines: readonly string[]): MrzKind | null {
  if (lines.length === 3 && lines.every((l) => line(30).test(l))) return 'TD1';
  if (lines.length === 2 && lines.every((l) => line(36).test(l))) return 'TD2';
  if (lines.length === 2 && lines.every((l) => line(44).test(l))) return 'TD3';
  return null;
}

const checks = (field: string, digit: string | undefined): boolean => digit !== undefined && /^[0-9]$/.test(digit) && checkDigit(field) === Number(digit);

/** Whether these lines are a zone a document reader would accept: the right shape and every check digit right. */
export function mrzValid(lines: readonly string[]): boolean {
  const kind = mrzShape(lines);
  if (kind === 'TD3' || kind === 'TD2') {
    const l = lines[1]!;
    const end = kind === 'TD3' ? 43 : 35;
    const optional = kind === 'TD3' ? checks(l.slice(28, 42), l[42] === '<' ? '0' : l[42]) : true;
    return (
      checks(l.slice(0, 9), l[9]) &&
      checks(l.slice(13, 19), l[19]) &&
      checks(l.slice(21, 27), l[27]) &&
      optional &&
      checks(l.slice(0, 10) + l.slice(13, 20) + l.slice(21, end), l[end])
    );
  }
  if (kind === 'TD1') {
    const [a, b] = lines as [string, string, string];
    return (
      checks(a.slice(5, 14), a[14]) &&
      checks(b.slice(0, 6), b[6]) &&
      checks(b.slice(8, 14), b[14]) &&
      checks(a.slice(5, 30) + b.slice(0, 7) + b.slice(8, 15) + b.slice(18, 29), b[29])
    );
  }
  return false;
}

/** The specimen from the standard itself (issuing state "Utopia"), to prove the checker works. */
export const ICAO_SPECIMEN_TD3 = ['P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<', 'L898902C36UTO7408122F1204159ZE184226B<<<<<10'] as const;

/** Every piece of text an SVG shows: the contents of its text elements, tags stripped, entities read. */
export function textsOf(svg: string): string[] {
  const out: string[] = [];
  for (const match of svg.matchAll(/<(text|title|desc)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
    out.push(
      match[2]!
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&'),
    );
  }
  return out;
}

/**
 * Why a set of texts could be taken for a machine-readable zone, or an empty list.
 * Strict: any filler character, any unbroken run of thirty or more zone characters, any texts
 * that together have the shape of a zone.
 */
export function mrzFindings(texts: readonly string[]): string[] {
  const findings: string[] = [];
  for (const text of texts) {
    if (text.includes('<')) findings.push(`filler character in "${text}"`);
    if (/[A-Z0-9<]{30,}/.test(text)) findings.push(`a run of thirty or more zone characters in "${text}"`);
  }
  const lines = texts.map((t) => t.trim());
  for (const length of [30, 36, 44]) {
    const shaped = lines.filter((l) => line(length).test(l));
    if (shaped.length >= 2) findings.push(`${shaped.length} lines of ${length} zone characters`);
  }
  return findings;
}
