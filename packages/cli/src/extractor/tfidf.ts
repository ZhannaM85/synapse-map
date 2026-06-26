// TF-IDF over the full conversation corpus.
// Surfaces terms that are statistically significant in one session but rare
// globally — catches project-specific names the static vocabulary misses.

const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','as','is','was','are','were','be','been','being','have',
  'has','had','do','does','did','will','would','could','should','may',
  'might','shall','can','need','dare','ought','used','not','no','nor',
  'so','yet','both','either','neither','each','few','more','most','other',
  'some','such','than','too','very','just','also','then','than','that',
  'this','these','those','it','its','it\'s','i','you','he','she','we',
  'they','me','him','her','us','them','my','your','his','our','their',
  'what','which','who','whom','how','when','where','why','all','any',
  'new','get','use','using','used','make','like','want','know','think',
  'see','look','go','going','gone','come','coming','take','taking','need',
  'needs','work','working','works','run','running','runs','add','added',
  'try','trying','fix','fixes','fixed','update','updated','change',
  'changes','changed','file','files','code','function','value','type',
  'object','string','number','true','false','null','undefined','import',
  'export','return','const','let','var','class','interface','extends',
  'implements','if','else','while','for','switch','case','break',
  'continue','new','delete','typeof','instanceof','void',
  // Common conversational / UI words that don't carry technical meaning
  'pick','click','press','open','close','scroll','drag','drop','hover',
  'select','focus','down','up','back','left','right','front','side',
  'just','also','now','here','there','still','again','often','always',
  'never','maybe','perhaps','actually','really','basically','simply',
  'please','thanks','thank','sure','okay','right','wrong','good','bad',
  'say','said','says','tell','told','ask','asked','help','show','shows',
  'showing','shown','put','puts','set','sets','call','calls','called',
  'give','gives','gave','given','find','found','found','keep','kept',
  'mean','means','meant','feel','feels','felt','seem','seems','seemed',
  'check','move','turn','start','stop','end','begin','began',
  // Claude Code conversation meta-terms (not technical topics)
  'session','sessions','conversation','conversations','response','responses',
  'output','input','task','tasks','note','notes','prompt','prompts',
  'user','users','summary','summaries','context','message','messages',
  'line','lines','page','pages','section','sections','repo','repository',
  // Contraction artifacts (apostrophes stripped by tokenizer: "doesn't" → "doesn")
  'doesn','isn','aren','wasn','weren','can','won','wouldn','couldn',
  'shouldn','haven','hasn','don','let','didn','mustn','needn',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-_./]/g, ' ')
    .split(/\s+/)
    .map(t => t.replace(/^[-_.]+|[-_.]+$/g, '')) // strip leading/trailing punctuation
    .filter(t => t.length >= 3 && !STOPWORDS.has(t));
}

interface TfIdfResult {
  term: string;
  score: number;
}

export class TfIdf {
  // doc index → term → frequency
  private docs: Map<string, number>[] = [];

  addDocument(tokens: string[]): void {
    const freq = new Map<string, number>();
    for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
    this.docs.push(freq);
  }

  // IDF = log((N + 1) / (df + 1)) + 1  (smoothed to avoid division by zero)
  private idf(term: string): number {
    const df = this.docs.filter(d => d.has(term)).length;
    return Math.log((this.docs.length + 1) / (df + 1)) + 1;
  }

  topTerms(docIndex: number, topN = 15): TfIdfResult[] {
    const doc = this.docs[docIndex];
    if (!doc) return [];

    const totalTerms = Array.from(doc.values()).reduce((a, b) => a + b, 0);
    const scores: TfIdfResult[] = [];

    for (const [term, freq] of doc.entries()) {
      const tf = freq / totalTerms;
      const score = tf * this.idf(term);
      scores.push({ term, score });
    }

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }
}

export function buildCorpus(sessionTexts: string[][]): TfIdf {
  const tfidf = new TfIdf();
  for (const messages of sessionTexts) {
    tfidf.addDocument(tokenize(messages.join(' ')));
  }
  return tfidf;
}

export function topTermsForSession(
  messages: string[],
  corpus: TfIdf,
  sessionIndex: number,
  topN = 15,
): string[] {
  return corpus
    .topTerms(sessionIndex, topN)
    .filter(r => r.score > 0.01) // filter near-zero scores
    .map(r => r.term);
}
