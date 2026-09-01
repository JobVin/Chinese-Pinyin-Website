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

const pinyinToneMap = {
  'a': ['ā', 'á', 'ǎ', 'à', 'a'],
  'o': ['ō', 'ó', 'ǒ', 'ò', 'o'],
  'e': ['ē', 'é', 'ě', 'è', 'e'],
  'i': ['ī', 'í', 'ǐ', 'ì', 'i'],
  'u': ['ū', 'ú', 'ǔ', 'ù', 'u'],
  'ü': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
  'v': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü']
};

function stripDiacritics(str) {
  return str.replace(/[āáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜĀÁǍÀŌÓǑÒĒÉĚÈĪÍǏÌŪÚǓÙǕǗǙǛ]/g, m => toneCharToPlain[m] || m);
}

function applyToneToSyllable(rawSyllable, toneNum) {
  const syllable = stripDiacritics(rawSyllable).toLowerCase().replace(/u:/gi, 'ü');
  const tone = parseInt(toneNum, 10);
  if (tone === 0 || tone === 5) {
    return syllable.replace(/v/gi, 'ü');
  }
  const toneIdx = tone - 1;

  if (/[ae]/.test(syllable)) {
    return syllable
      .replace(/v/gi, 'ü')
      .replace(/([ae])/, v => pinyinToneMap[v] ? pinyinToneMap[v][toneIdx] : v);
  }
  if (/ou/.test(syllable)) {
    return syllable
      .replace(/v/gi, 'ü')
      .replace(/([o])/, v => pinyinToneMap[v] ? pinyinToneMap[v][toneIdx] : v);
  }
  if (/ui/.test(syllable)) {
    return syllable
      .replace(/v/gi, 'ü')
      .replace(/([i])/, v => pinyinToneMap[v] ? pinyinToneMap[v][toneIdx] : v);
  }
  if (/iu/.test(syllable)) {
    return syllable
      .replace(/v/gi, 'ü')
      .replace(/([u])/, v => pinyinToneMap[v] ? pinyinToneMap[v][toneIdx] : v);
  }

  let replaced = false;
  const sylChars = syllable.split('');
  for (let i = sylChars.length - 1; i >= 0; i--) {
    const char = sylChars[i];
    if (pinyinToneMap[char]) {
      sylChars[i] = pinyinToneMap[char][toneIdx];
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

  const initialsWithVowelRegex = /(?:zh|ch|sh|[bpmfdtnlgkhjqxzcsryw])(?=[aeiouüvāáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜ])/gi;
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

  const isInitialUpper = syllable.length > 0 && syllable[0] === syllable[0].toUpperCase() && syllable[0] !== syllable[0].toLowerCase();
  const cleanSyllable = stripDiacritics(syllable).replace(/u:/gi, 'ü');
  if (!cleanSyllable || !/[aeiouüAEIOUÜvV]/.test(cleanSyllable)) {
    return null;
  }

  const syllableStart = chunkStart + prefix.length;
  const syllableEnd = pos;

  let currentTone = 5;
  const variants = [1, 2, 3, 4, 5].map(t => {
    let text = applyToneToSyllable(cleanSyllable.toLowerCase(), t);
    if (isInitialUpper && text.length > 0) {
      text = text[0].toUpperCase() + text.slice(1);
    }
    if (text === syllable || text.toLowerCase() === syllable.toLowerCase()) {
      currentTone = t;
    }
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

console.log('Active info for "Shi":', getActiveSyllableInfo('Shi'));
console.log('Active info for "Shī":', getActiveSyllableInfo('Shī'));
console.log('Active info for "shi":', getActiveSyllableInfo('shi'));
console.log('Active info for "Shu":', getActiveSyllableInfo('Shu'));
console.log('Active info for "Zhe":', getActiveSyllableInfo('Zhe'));
