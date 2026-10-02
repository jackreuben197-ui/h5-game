/**
 * Split a wallet channel label without breaking Unicode grapheme clusters.
 *
 * The small four-column cards reserve a fixed two-line label area. Labels that
 * fit five visible graphemes stay on one centered line; longer labels are
 * divided as evenly as possible, with the extra grapheme kept on the second
 * line. The source text is never changed.
 */
export function splitWalletLabel(value: string | null | undefined, maxSingleLine = 5): string[] {
  const text = String(value ?? '').trim()
  if (!text) return ['']

  const segmenter = (Intl as unknown as {
    Segmenter?: new (
      locales?: string | string[],
      options?: { granularity: 'grapheme' },
    ) => { segment(input: string): Iterable<{ segment: string }> }
  }).Segmenter

  const graphemes = segmenter
    ? Array.from(new segmenter(undefined, { granularity: 'grapheme' }).segment(text), ({ segment }) => segment)
    : fallbackGraphemes(text)

  if (graphemes.length <= maxSingleLine) return [text]

  const splitAt = Math.floor(graphemes.length / 2)
  return [graphemes.slice(0, splitAt).join(''), graphemes.slice(splitAt).join('')]
}

/** Conservative grapheme fallback for older WebViews without Intl.Segmenter. */
function fallbackGraphemes(text: string): string[] {
  const clusters: string[] = []
  const codePoints = Array.from(text)
  let regionalIndicatorCount = 0

  for (const codePoint of codePoints) {
    const code = codePoint.codePointAt(0) ?? 0
    const isMark = /\p{Mark}/u.test(codePoint)
    const isVariationSelector = (code >= 0xfe00 && code <= 0xfe0f) || (code >= 0xe0100 && code <= 0xe01ef)
    const isEmojiModifier = code >= 0x1f3fb && code <= 0x1f3ff
    const isJoiner = codePoint === '\u200d'
    const previous = clusters[clusters.length - 1] ?? ''
    const previousEndsWithJoiner = previous.endsWith('\u200d')
    const isRegionalIndicator = code >= 0x1f1e6 && code <= 0x1f1ff
    const pairRegionalIndicators = isRegionalIndicator && regionalIndicatorCount % 2 === 1

    if (isMark || isVariationSelector || isEmojiModifier || isJoiner || previousEndsWithJoiner || pairRegionalIndicators) {
      if (clusters.length > 0) clusters[clusters.length - 1] += codePoint
    } else {
      clusters.push(codePoint)
    }

    if (isRegionalIndicator) {
      regionalIndicatorCount += 1
    } else {
      regionalIndicatorCount = 0
    }
  }

  return clusters
}
