// Bot Protection and Rate Limiting for AI Features
// Prevents abuse and protects against automated attacks

interface BotCheckResult {
  isBot: boolean;
  reason?: string;
  score: number; // 0-100, higher = more likely bot
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
}

// In-memory storage for rate limiting (in production, use Redis or D1)
const rateLimitStore = new Map<string, { count: number; resetTime: Date }>();
const behaviorStore = new Map<string, { 
  firstSeen: Date;
  mouseEvents: number;
  keyboardEvents: number;
  interactions: number;
}>();

// Known bot user agents
const BOT_USER_AGENTS = [
  'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python',
  'java', 'ruby', 'perl', 'php', 'go-http', 'axios', 'fetch',
  'postman', 'insomnia', 'httpie', 'scrapy', 'puppeteer', 'selenium'
];

// Suspicious behavior patterns
const SUSPICIOUS_PATTERNS = {
  tooFast: 500, // Actions faster than 500ms are suspicious
  tooRegular: 0.9, // Timing regularity above 90% is suspicious
  noMouse: true, // No mouse movement is suspicious
  directAccess: true, // Direct API access without page load
};

// Check if user agent is a known bot
export function checkUserAgent(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

// Check IP reputation (simplified - in production use external service)
export async function checkIPReputation(ip: string): Promise<BotCheckResult> {
  // Check for localhost/private IPs
  if (ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { isBot: false, score: 0, reason: 'Private IP' };
  }

  // Check for known VPN/proxy IPs (simplified)
  // In production, use services like IPQualityScore, MaxMind, etc.
  const suspiciousRanges = [
    '104.', // Common VPN range
    '45.', // Common proxy range
  ];

  const isSuspicious = suspiciousRanges.some(range => ip.startsWith(range));
  
  return {
    isBot: isSuspicious,
    score: isSuspicious ? 70 : 10,
    reason: isSuspicious ? 'Suspicious IP range' : undefined
  };
}

// Behavior-based bot detection
export function analyzeBehavior(sessionId: string, event: {
  type: 'mouse' | 'keyboard' | 'interaction' | 'pageLoad';
  timestamp: number;
}): BotCheckResult {
  let behavior = behaviorStore.get(sessionId);
  
  if (!behavior) {
    behavior = {
      firstSeen: new Date(),
      mouseEvents: 0,
      keyboardEvents: 0,
      interactions: 0
    };
    behaviorStore.set(sessionId, behavior);
  }

  // Update behavior counters
  switch (event.type) {
    case 'mouse':
      behavior.mouseEvents++;
      break;
    case 'keyboard':
      behavior.keyboardEvents++;
      break;
    case 'interaction':
      behavior.interactions++;
      break;
  }

  // Calculate bot score
  let score = 0;
  const timeSinceFirstSeen = Date.now() - behavior.firstSeen.getTime();

  // Check if interaction is too fast
  if (timeSinceFirstSeen < SUSPICIOUS_PATTERNS.tooFast) {
    score += 40;
  }

  // Check for no mouse movement
  if (behavior.mouseEvents === 0 && behavior.interactions > 2) {
    score += 30;
  }

  // Check for suspicious patterns
  if (behavior.interactions > 10 && behavior.mouseEvents < 2) {
    score += 20;
  }

  // No keyboard events but multiple interactions
  if (behavior.keyboardEvents === 0 && behavior.interactions > 5) {
    score += 10;
  }

  return {
    isBot: score > 50,
    score,
    reason: score > 50 ? 'Suspicious behavior pattern' : undefined
  };
}

// Rate limiting implementation
export function checkRateLimit(
  identifier: string, // IP or session ID
  limits: {
    maxRequests: number;
    windowMinutes: number;
  }
): RateLimitResult {
  const now = new Date();
  const windowMs = limits.windowMinutes * 60 * 1000;
  
  let record = rateLimitStore.get(identifier);
  
  // Clean up old entries
  if (record && record.resetTime < now) {
    record = undefined;
  }
  
  if (!record) {
    record = {
      count: 0,
      resetTime: new Date(now.getTime() + windowMs)
    };
    rateLimitStore.set(identifier, record);
  }
  
  record.count++;
  
  const allowed = record.count <= limits.maxRequests;
  const remaining = Math.max(0, limits.maxRequests - record.count);
  
  return {
    allowed,
    remaining,
    resetTime: record.resetTime
  };
}

// Cloudflare Turnstile verification
export async function verifyTurnstile(token: string, secretKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Turnstile verification failed:', error);
    return false;
  }
}

// Google reCAPTCHA v3 verification
export async function verifyRecaptcha(
  token: string,
  secretKey: string,
  threshold: number = 0.5
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`,
      { method: 'POST' }
    );

    const data = await response.json();
    return data.success === true && data.score >= threshold;
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error);
    return false;
  }
}

// Honeypot field check (invisible form field that bots fill)
export function checkHoneypot(honeypotValue: string | undefined): boolean {
  // If honeypot field has any value, it's likely a bot
  return !honeypotValue || honeypotValue.length === 0;
}

// Timing analysis (how long between page load and interaction)
export function checkTiming(pageLoadTime: number, interactionTime: number): BotCheckResult {
  const timeDiff = interactionTime - pageLoadTime;
  
  // Too fast (less than 1 second)
  if (timeDiff < 1000) {
    return {
      isBot: true,
      score: 90,
      reason: 'Interaction too fast after page load'
    };
  }
  
  // Suspicious (less than 2 seconds)
  if (timeDiff < 2000) {
    return {
      isBot: false,
      score: 50,
      reason: 'Quick interaction'
    };
  }
  
  // Normal human behavior
  return {
    isBot: false,
    score: 10
  };
}

// Comprehensive bot check
export async function performBotCheck(params: {
  ip: string;
  userAgent: string;
  sessionId: string;
  honeypot?: string;
  captchaToken?: string;
  captchaSecret?: string;
  pageLoadTime?: number;
  interactionTime?: number;
}): Promise<BotCheckResult> {
  const checks: BotCheckResult[] = [];
  
  // User agent check
  if (checkUserAgent(params.userAgent)) {
    checks.push({
      isBot: true,
      score: 100,
      reason: 'Bot user agent detected'
    });
  }
  
  // IP reputation check
  const ipCheck = await checkIPReputation(params.ip);
  checks.push(ipCheck);
  
  // Honeypot check
  if (params.honeypot !== undefined) {
    const isHuman = checkHoneypot(params.honeypot);
    if (!isHuman) {
      checks.push({
        isBot: true,
        score: 100,
        reason: 'Honeypot triggered'
      });
    }
  }
  
  // Timing check
  if (params.pageLoadTime && params.interactionTime) {
    const timingCheck = checkTiming(params.pageLoadTime, params.interactionTime);
    checks.push(timingCheck);
  }
  
  // CAPTCHA verification
  if (params.captchaToken && params.captchaSecret) {
    const captchaValid = await verifyTurnstile(params.captchaToken, params.captchaSecret);
    if (!captchaValid) {
      checks.push({
        isBot: true,
        score: 100,
        reason: 'CAPTCHA verification failed'
      });
    }
  }
  
  // Calculate overall score
  const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
  const avgScore = totalScore / checks.length;
  
  // Determine if bot based on average score
  const isBot = avgScore > 50;
  const reasons = checks
    .filter(c => c.reason)
    .map(c => c.reason)
    .join(', ');
  
  return {
    isBot,
    score: Math.round(avgScore),
    reason: isBot ? reasons : undefined
  };
}

// Clean up old entries periodically
export function cleanupOldEntries() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  // Clean rate limit store
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime.getTime() < now) {
      rateLimitStore.delete(key);
    }
  }
  
  // Clean behavior store
  for (const [key, value] of behaviorStore.entries()) {
    if (now - value.firstSeen.getTime() > maxAge) {
      behaviorStore.delete(key);
    }
  }
}

// Set up periodic cleanup
if (typeof window === 'undefined') {
  // Server-side: clean up every hour
  setInterval(cleanupOldEntries, 60 * 60 * 1000);
}
