/**
 * Text display helpers.
 */

const CP1252_REVERSE_MAP: Record<number, number> = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f
}

const MOJIBAKE_MARKER_RE = /[ÃÂÄÅÆÇÈÉåæçèéäöüï¼œŠŽšžŒœ˜™‘’“”–—…]/
const CJK_RE = /[\u3400-\u9fff]/

function toPercentEncodedBytes(value: string): string | null {
  let encoded = ''

  for (const char of value) {
    const codePoint = char.codePointAt(0)
    if (codePoint == null) return null

    let byte: number | undefined
    if (codePoint <= 0xff) {
      byte = codePoint
    } else {
      byte = CP1252_REVERSE_MAP[codePoint]
    }

    if (byte == null) return null
    encoded += `%${byte.toString(16).padStart(2, '0')}`
  }

  return encoded
}

/**
 * Repair UTF-8 Chinese text that was decoded as Windows-1252/Latin-1.
 * Leaves normal Chinese/English text unchanged.
 */
export function repairMojibakeText<T extends string | null | undefined>(value: T): T {
  if (typeof value !== 'string' || !value || !MOJIBAKE_MARKER_RE.test(value)) {
    return value
  }

  const encoded = toPercentEncodedBytes(value)
  if (!encoded) return value

  try {
    const repaired = decodeURIComponent(encoded)
    if (repaired !== value && CJK_RE.test(repaired)) {
      return repaired as T
    }
  } catch {
    return value
  }

  return value
}
