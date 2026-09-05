const ADJECTIVES = ["Solidaire", "Discret", "Bienveillant", "Généreux", "Attentif", "Fidèle"];
const NOUNS = ["Fennec", "Jasmin", "Olivier", "Grenat", "Aigle", "Cèdre"];

export function generatePseudonym(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${adj} ${noun} #${num}`;
}
