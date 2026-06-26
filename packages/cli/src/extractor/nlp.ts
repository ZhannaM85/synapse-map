// Noun phrase extraction using compromise.js.
// Pure JS, no model download — catches named concepts the static vocabulary misses.

import nlp from 'compromise';

// Generic terms that add noise without conveying useful topics
const NLP_STOPWORDS = new Set([
  'thing','things','way','ways','case','cases','part','parts','point',
  'points','place','places','time','times','step','steps','issue','issues',
  'problem','problems','example','examples','result','results','bit','lot',
  'kind','type','set','list','item','items','user','users','data','app',
  'application','project','version','feature','approach','solution',
  'error','message','value','option','config','something','everything',
  'anything','nothing','someone','everyone','anyone','later','first',
  'second','third','next','previous','current','new','old','good','bad',
  'right','wrong','true','false','yes','no','ok','okay',
]);

function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function isUsefulPhrase(phrase: string): boolean {
  const lower = phrase.toLowerCase().trim();
  if (lower.length < 3) return false;
  if (NLP_STOPWORDS.has(lower)) return false;
  // Skip phrases that are purely numeric or single common letters
  if (/^\d+$/.test(lower)) return false;
  // Skip phrases longer than 4 words — too specific to be a reusable topic
  if (lower.split(/\s+/).length > 4) return false;
  return true;
}

export function extractNounPhrases(text: string): string[] {
  const doc = nlp(text);

  const phrases = new Set<string>();

  // Multi-word noun phrases (e.g. "knowledge graph", "force directed layout")
  doc.nouns().out('array').forEach((p: string) => {
    const clean = p.trim().replace(/[^a-zA-Z0-9\s\-_.]/g, '').trim();
    if (isUsefulPhrase(clean)) phrases.add(toTitleCase(clean));
  });

  // Proper nouns — highest confidence single terms
  doc.match('#ProperNoun+').out('array').forEach((p: string) => {
    const clean = p.trim().replace(/[^a-zA-Z0-9\s\-_.]/g, '').trim();
    if (isUsefulPhrase(clean)) phrases.add(toTitleCase(clean));
  });

  return Array.from(phrases);
}
