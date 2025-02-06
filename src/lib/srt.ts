interface SubtitleEntry {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
}

export function parseSRT(content: string): string {
  try {
    const entries = content
      .trim()
      .split(/\n\s*\n/)
      .map(block => {
        const lines = block.trim().split('\n');
        if (lines.length < 3) return null;

        const id = parseInt(lines[0]);
        const [startTime, endTime] = lines[1].split(' --> ');
        const text = lines.slice(2).join(' ');

        return {
          id,
          startTime,
          endTime,
          text
        };
      })
      .filter((entry): entry is SubtitleEntry => entry !== null);

    // Concaténer tout le texte en un seul paragraphe
    return entries.map(entry => entry.text).join(' ');
  } catch (error) {
    console.error('Erreur lors du parsing du fichier SRT:', error);
    throw new Error('Le format du fichier SRT est invalide');
  }
}