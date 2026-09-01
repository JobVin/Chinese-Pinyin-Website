const toneCharToPlain = {
  'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
  'ō': 'o', 'ó': 'o', 'ē': 'e', 'é': 'e',
  'ě': 'e', 'è': 'e', 'ī': 'i', 'í': 'i',
  'ǐ': 'i', 'ì': 'i', 'ū': 'u', 'ú': 'u',
  'ǔ': 'u', 'ù': 'u', 'ǖ': 'ü', 'ǘ': 'ü',
  'ǚ': 'ü', 'ǜ': 'ü', 'Ā': 'A', 'Á': 'A',
  'Ǎ': 'A', 'À': 'A', 'Ō': 'O', 'Ó': 'O',
  'Ǒ': 'O', 'Ò': 'O', 'Ē': 'E', 'É': 'E',
  'Ě': 'E', 'È': 'E', 'Ī': 'I', 'Í': 'I',
  'Ǐ': 'I', 'Ì': 'I', 'Ū': 'U', 'Ú': 'U',
  'Ǔ': 'U', 'Ù': 'U', 'Ǖ': 'Ü', 'Ǘ': 'Ü',
  'Ǚ': 'Ü', 'Ǜ': 'Ü'
};

const toneMap = {
  'a': ['ā', 'á', 'ǎ', 'à', 'a'],
  'o': ['ō', 'ó', 'ǒ', 'ò', 'o'],
  'e': ['ē', 'é', 'ě', 'è', 'e'],
  'i': ['ī', 'í', 'ǐ', 'ì', 'i'],
  'u': ['ū', 'ú', 'ǔ', 'ù', 'u'],
  'ü': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
  'v': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
  'A': ['Ā', 'Á', 'Ǎ', 'À', 'A'],
  'O': ['Ō', 'Ó', 'Ǒ', 'Ò', 'O'],
  'E': ['Ē', 'É', 'Ě', 'È', 'E'],
  'I': ['Ī', 'Í', 'Ǐ', 'Ì', 'I'],
  'U': ['Ū', 'Ú', 'Ǔ', 'Ù', 'U'],
  'Ü': ['Ǖ', 'Ǘ', 'Ǚ', 'Ǜ', 'Ü'],
  'V': ['Ǖ', 'Ǘ', 'Ǚ', 'Ǜ', 'Ü']
};

function stripDiacritics(str) {
  return str.replace(/[āáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜĀÁǍÀŌÓǑÒĒÉĚÈĪÍǏÌŪÚǓÙǕǗǙǛ]/g, m => toneCharToPlain[m] || m);
}

function applyToneToSyllable(rawSyllable, toneNum) {
  const syllable = stripDiacritics(rawSyllable).replace(/u:/gi, 'ü');
  const tone = parseInt(toneNum, 10);
  if (tone === 0 || tone === 5) {
    return syllable.replace(/v/gi, 'ü');
  }
  const toneIdx = tone - 1;

  if (/[aeAE]/.test(syllable)) {
    return syllable
      .replace(/v/gi, 'ü')
      .replace(/([aeAE])/, v => toneMap[v] ? toneMap[v][toneIdx] : v);
  }
  if (/ou|OU|oU|Ou/.test(syllable)) {
    return syllable
      .replace(/v/gi, 'ü')
      .replace(/([oO])/, v => toneMap[v] ? toneMap[v][toneIdx] : v);
  }
  if (/ui|UI|uI|Ui/.test(syllable)) {
    return syllable
      .replace(/v/gi, 'ü')
      .replace(/([iI])/, v => toneMap[v] ? toneMap[v][toneIdx] : v);
  }
  if (/iu|IU|iU|Iu/.test(syllable)) {
    return syllable
      .replace(/v/gi, 'ü')
      .replace(/([uU])/, v => toneMap[v] ? toneMap[v][toneIdx] : v);
  }

  let replaced = false;
  const sylChars = syllable.split('');
  for (let i = sylChars.length - 1; i >= 0; i--) {
    const char = sylChars[i];
    if (toneMap[char]) {
      sylChars[i] = toneMap[char][toneIdx];
      replaced = true;
      break;
    }
  }
  if (replaced) {
    return sylChars.join('').replace(/v/gi, 'ü');
  }
  return syllable;
}

function splitChunkIntoPrefixAndSyllable(chunk) {
  if (!chunk) return { prefix: '', syllable: '' };

  const initialsWithVowelRegex = /(?:zh|ch|sh|[bpmfdtnlgkhjqxzcsrywBPMFDTNLGKHJQXZCSRYW])(?=[aeiouüvāáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜAEIOUÜVĀÁǍÀŌÓǑÒĒÉĚÈĪÍǏÌŪÚǓÙǕǗǙǛ])/g;
  const initialMatches = [...chunk.matchAll(initialsWithVowelRegex)];

  if (initialMatches.length > 1) {
    const lastInitial = initialMatches[initialMatches.length - 1];
    return {
      prefix: chunk.slice(0, lastInitial.index),
      syllable: chunk.slice(lastInitial.index)
    };
  } else if (initialMatches.length === 1 && initialMatches[0].index > 0) {
    const init = initialMatches[0];
    return {
      prefix: chunk.slice(0, init.index),
      syllable: chunk.slice(init.index)
    };
  }

  return {
    prefix: '',
    syllable: chunk
  };
}

function getActiveSyllableInfo(fullText, cursorPosition) {
  if (!fullText) return null;
  const pos = typeof cursorPosition === 'number' ? cursorPosition : fullText.length;
  const beforeCursor = fullText.slice(0, pos);
  const match = beforeCursor.match(/([a-zA-ZüÜvVāáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜĀÁǍÀŌÓǑÒĒÉĚÈĪÍǏÌŪÚǓÙǕǗǙǛ:]+)$/);
  if (!match) return null;

  const rawChunk = match[1];
  const chunkStart = pos - rawChunk.length;
  const { prefix, syllable } = splitChunkIntoPrefixAndSyllable(rawChunk);

  const cleanSyllable = stripDiacritics(syllable).replace(/u:/gi, 'ü');
  if (!cleanSyllable || !/[aeiouüAEIOUÜvV]/.test(cleanSyllable)) {
    return null;
  }

  const syllableStart = chunkStart + prefix.length;
  const syllableEnd = pos;

  // Determine current active tone if any
  let currentTone = 5;
  const variants = [1, 2, 3, 4, 5].map(t => {
    const text = applyToneToSyllable(cleanSyllable, t);
    if (text === syllable) currentTone = t;
    return { tone: t, text };
  });

  return {
    prefix,
    syllable,
    cleanSyllable,
    syllableStart,
    syllableEnd,
    currentTone,
    variants
  };
}

console.log('Active info for "ni" at pos 2:', getActiveSyllableInfo('ni', 2));
console.log('Active info for "nǐhǎo" at pos 5:', getActiveSyllableInfo('nǐhǎo', 5));
console.log('Active info for "nǐhao" at pos 5:', getActiveSyllableInfo('nǐhao', 5));
console.log('Active info for "héng" at pos 4:', getActiveSyllableInfo('héng', 4));
console.log('Active info for "h" at pos 1:', getActiveSyllableInfo('h', 1));
