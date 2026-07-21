export type TitleFit = {
  lines: string[];
  fontSize: number;
  lineHeight: number;
};

type TitleFitOptions = {
  maxWidth: number;
  maxLines: number;
  preferredSize: number;
  minimumSize: number;
};

function characterUnits(character: string) {
  if (/\s/u.test(character)) return 0.3;
  if (/[ilI1'’.,:;!|]/u.test(character)) return 0.3;
  if (/[mwMW@%&]/u.test(character)) return 0.96;
  if ((character.codePointAt(0) ?? 0) > 255) return 0.92;
  if (/[A-Z0-9]/u.test(character)) return 0.7;
  return 0.57;
}

export function estimateTextWidth(value: string, fontSize: number) {
  return Array.from(value).reduce(
    (width, character) => width + characterUnits(character) * fontSize,
    0,
  );
}

function splitLongToken(token: string, maxWidth: number, fontSize: number) {
  const pieces: string[] = [];
  let piece = "";
  for (const character of Array.from(token)) {
    if (piece && estimateTextWidth(piece + character, fontSize) > maxWidth) {
      pieces.push(piece);
      piece = character;
    } else {
      piece += character;
    }
  }
  if (piece) pieces.push(piece);
  return pieces;
}

function wrapAtSize(
  value: string,
  maxWidth: number,
  fontSize: number,
  splitLongWords = false,
) {
  const tokens = value
    .trim()
    .split(/\s+/u)
    .flatMap((token) =>
      splitLongWords
        ? splitLongToken(token, maxWidth, fontSize)
        : [token],
    );
  const lines: string[] = [];
  for (const token of tokens) {
    const current = lines.at(-1);
    const next = current ? `${current} ${token}` : token;
    if (current && estimateTextWidth(next, fontSize) > maxWidth) {
      lines.push(token);
    } else if (current) {
      lines[lines.length - 1] = next;
    } else {
      lines.push(token);
    }
  }

  if (lines.length > 1) {
    const last = lines.at(-1) ?? "";
    const previousWords = lines[lines.length - 2].split(" ");
    const candidate = previousWords.at(-1);
    if (
      candidate &&
      estimateTextWidth(last, fontSize) < maxWidth * 0.34 &&
      estimateTextWidth(`${candidate} ${last}`, fontSize) <= maxWidth
    ) {
      previousWords.pop();
      if (previousWords.length) {
        lines[lines.length - 2] = previousWords.join(" ");
        lines[lines.length - 1] = `${candidate} ${last}`;
      }
    }
  }
  return lines;
}

export function fitCardTitle(
  value: string,
  options: TitleFitOptions,
): TitleFit {
  const normalized = value.replace(/\s+/g, " ").trim() || "Untitled";
  for (
    let fontSize = options.preferredSize;
    fontSize >= options.minimumSize;
    fontSize -= 2
  ) {
    const lines = wrapAtSize(normalized, options.maxWidth, fontSize);
    if (
      lines.length <= options.maxLines &&
      lines.every(
        (line) => estimateTextWidth(line, fontSize) <= options.maxWidth,
      )
    ) {
      return {
        lines,
        fontSize,
        lineHeight: Math.round(fontSize * 0.96),
      };
    }
  }
  const lines = wrapAtSize(
    normalized,
    options.maxWidth,
    options.minimumSize,
    true,
  );
  return {
    lines,
    fontSize: options.minimumSize,
    lineHeight: Math.round(options.minimumSize * 0.98),
  };
}
