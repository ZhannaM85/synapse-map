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
  'session','sessions','conversation','conversations','response','responses',
  'output','input','command','commands','task','tasks','note','notes',
  // Pronouns that compromise.js sometimes tags as proper nouns
  'you','them','they','their','we','our','he','she','his','her','it','its',
  'me','him','us','my','your','i','am',
  // Generic structural terms
  'source','code','line','lines','section','sections','page','pages',
  'repo','repository','folder','directory','path','url','link','links',
  'file','files','this file','summary','summaries','context','detail','details',
  'user','users','account','accounts','name','names',
]);

function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function isUsefulPhrase(phrase: string): boolean {
  const lower = phrase.toLowerCase().trim();
  if (lower.length < 3) return false;
  if (NLP_STOPWORDS.has(lower)) return false;
  if (/^\d+$/.test(lower)) return false;
  // Skip article-leading phrases ("A Session", "The Thing")
  if (/^(a|an|the)\s/i.test(lower)) return false;
  // Skip phrases with trailing punctuation artifacts ("User-", "React.")
  if (/[-_.]$/.test(lower)) return false;
  // Skip phrases longer than 4 words
  if (lower.split(/\s+/).length > 4) return false;
  return true;
}

export function extractNounPhrases(text: string): string[] {
  const doc = nlp(text);

  const phrases = new Set<string>();

  // Multi-word noun phrases (e.g. "knowledge graph", "force directed layout")
  doc.nouns().out('array').forEach((p: string) => {
    if (p.includes("'") || p.includes('’')) return; // skip contractions ("doesn't")
    const clean = p.trim().replace(/[^a-zA-Z0-9\s\-_.]/g, '').trim();
    if (isUsefulPhrase(clean)) phrases.add(toTitleCase(clean));
  });

  // Proper nouns — highest confidence single terms
  doc.match('#ProperNoun+').out('array').forEach((p: string) => {
    if (p.includes("'") || p.includes('’')) return;
    const clean = p.trim().replace(/[^a-zA-Z0-9\s\-_.]/g, '').trim();
    if (isUsefulPhrase(clean)) phrases.add(toTitleCase(clean));
  });

  return Array.from(phrases);
}
