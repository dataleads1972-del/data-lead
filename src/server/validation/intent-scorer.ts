export interface ScoredPost {
  isIntent: boolean;
  score: number;
  matchedKeyword: string;
}

const POSITIVE_PATTERNS = [
  /looking\s+to\s+hire/i,
  /looking\s+for\s+a\s+(?:web\s+|website\s+|app\s+|software\s+)?developer/i,
  /need\s+a\s+(?:web\s+|website\s+|app\s+|software\s+)?developer/i,
  /hiring\s+(?:a\s+)?(?:web\s+|website\s+|app\s+|software\s+)?developer/i,
  /looking\s+for\s+someone\s+to\s+build/i,
  /need\s+a\s+website/i,
  /looking\s+to\s+build\s+a\s+website/i,
  /looking\s+for\s+freelance/i,
  /recommend\s+(?:someone|a\s+developer|a\s+freelancer)/i,
  /budget/i,
  /dm\s+me/i,
  /pm\s+me/i,
  /send\s+portfolio/i,
  /pay\s+is/i,
  /paying/i,
  /hourly\s+rate/i,
  /rate\s+is/i,
];

const NEGATIVE_PATTERNS = [
  /\[for\s*hire\]/i,
  /\bfor\s+hire\b/i,
  /\bhire\s+me\b/i,
  /\blooking\s+for\s+work\b/i,
  /\blooking\s+for\s+job\b/i,
  /\bmy\s+portfolio\b/i,
  /\bmy\s+resume\b/i,
  /\bmy\s+skills\b/i,
  /\bavailable\s+for\s+work\b/i,
  /\bavailable\s+for\s+hire\b/i,
  /\bopen\s+for\s+opportunities\b/i,
  /\bhow\s+to\b/i,
  /\btutorial\b/i,
  /\bguide\b/i,
  /\bcheck\s+out\s+my\b/i,
  /\bi\s+am\s+a\s+developer\b/i,
  /\bi'm\s+a\s+developer\b/i,
  /\bi\s+built\b/i,
  /\bi\s+created\b/i,
];

const HIRING_SUBREDDITS = [
  "forhire",
  "designjobs",
  "freelance_forhire",
  "jobbit",
  "hiring",
  "workonline",
  "jobs",
];

export function scorePost(
  title: string,
  body: string,
  keyword: string,
  subreddit?: string
): ScoredPost {
  const fullText = `${title}\n${body}`;
  const cleanKeyword = keyword.toLowerCase().trim();
  
  // 1. Check if the post mentions the target keyword (e.g. "developer", "designer", "writer", etc.)
  const keywordWords = cleanKeyword.split(/\s+/).filter(w => w.length > 2);
  let keywordMatches = false;
  let matchedKeyword = "";
  
  if (fullText.toLowerCase().includes(cleanKeyword)) {
    keywordMatches = true;
    matchedKeyword = cleanKeyword;
  } else {
    // Check if at least one significant word from the keyword matches
    for (const word of keywordWords) {
      if (fullText.toLowerCase().includes(word)) {
        keywordMatches = true;
        matchedKeyword = word;
        break;
      }
    }
  }

  if (!keywordMatches) {
    return { isIntent: false, score: 0, matchedKeyword: "" };
  }

  // 2. Check for negative signals (self-promotion, job seeking, tutorials)
  for (const pattern of NEGATIVE_PATTERNS) {
    if (pattern.test(fullText)) {
      return { isIntent: false, score: 0, matchedKeyword };
    }
  }

  // 3. Calculate score using rule-based criteria
  let score = 0;
  let matchesCount = 0;

  // Add points for matching positive intent patterns
  for (const pattern of POSITIVE_PATTERNS) {
    if (pattern.test(fullText)) {
      score += 25;
      matchesCount++;
    }
  }

  // Bonus for specific hiring subreddits
  if (subreddit && HIRING_SUBREDDITS.includes(subreddit.toLowerCase())) {
    score += 30;
  }

  // Bonus for specific signs of direct intent in the title (which is more prominent)
  const titleLower = title.toLowerCase();
  if (titleLower.includes("looking for") || titleLower.includes("hiring") || titleLower.includes("need")) {
    score += 15;
  }

  // Cap score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, score));

  // Determine if it meets the intent threshold
  // We require at least one positive pattern or being in a hiring subreddit + matching title keywords
  const isIntent = finalScore >= 40 && matchesCount > 0;

  return {
    isIntent,
    score: finalScore,
    matchedKeyword,
  };
}
