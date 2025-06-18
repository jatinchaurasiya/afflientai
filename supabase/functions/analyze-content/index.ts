// Edge function to analyze content from websites
import { createClient } from "npm:@supabase/supabase-js@2.39.8";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body
    const { url, title, content, integrationKey, userId, sessionId, contentUrl, websiteId } = await req.json();

    // Use fallback values for testing
    const testContent = content || "This is a sample blog post about the best smartphones in 2024. We'll review the latest iPhone and Samsung Galaxy models.";
    const testTitle = title || "Best Smartphones 2024 Review";

    // Analyze content
    const analysis = await analyzeContent(testContent, testTitle);

    // Create mock content analysis record
    const contentAnalysis = {
      id: crypto.randomUUID(),
      website_id: websiteId || crypto.randomUUID(),
      content_url: url || contentUrl || "https://example.com/test-post",
      content_hash: generateContentHash(testContent),
      keywords: analysis.keywords,
      products_identified: analysis.productMentions,
      analysis_score: analysis.score,
      category: analysis.category,
      buying_intent_score: analysis.buyingIntentScore,
      sentiment: analysis.sentiment,
      created_at: new Date().toISOString()
    };

    // Generate mock product recommendations
    const recommendations = [
      {
        id: crypto.randomUUID(),
        name: "iPhone 15 Pro",
        description: "Latest iPhone with advanced features",
        price: 999.99,
        commission_rate: 5.0,
        affiliate_url: "https://example.com/iphone-15-pro"
      },
      {
        id: crypto.randomUUID(),
        name: "Samsung Galaxy S24",
        description: "Premium Android smartphone",
        price: 899.99,
        commission_rate: 4.5,
        affiliate_url: "https://example.com/galaxy-s24"
      }
    ];

    // Determine if we should create a popup
    const shouldCreatePopup = analysis.buyingIntentScore > 0.6;

    return new Response(
      JSON.stringify({
        success: true,
        contentId: contentAnalysis.id,
        keywords: analysis.keywords,
        intentScore: analysis.buyingIntentScore,
        categories: [analysis.category],
        recommendedProducts: recommendations,
        shouldShowPopup: shouldCreatePopup,
        analysis: contentAnalysis,
        recommendations
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        success: false,
        contentId: null,
        keywords: [],
        intentScore: 0,
        categories: ['general'],
        recommendedProducts: [],
        shouldShowPopup: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Content analysis function
async function analyzeContent(content: string, title: string) {
  const text = `${title} ${content}`.toLowerCase();
  
  // Extract keywords
  const keywords = extractKeywords(text);
  
  // Identify buying intent
  const buyingIntent = identifyBuyingIntent(text);
  
  // Categorize content
  const category = categorizeContent(text);
  
  // Analyze sentiment
  const sentiment = analyzeSentiment(text);
  
  // Calculate content score
  const score = calculateContentScore(text, keywords);
  
  return {
    keywords,
    buyingIntentScore: buyingIntent.score,
    productMentions: buyingIntent.products,
    category,
    sentiment,
    score
  };
}

// Extract keywords from content
function extractKeywords(text: string): string[] {
  // Remove common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
  ]);

  const words = text
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  // Count word frequency
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  // Return top keywords
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

// Identify buying intent
function identifyBuyingIntent(text: string) {
  const buyingKeywords = [
    'best', 'review', 'compare', 'buy', 'purchase', 'deal', 'discount', 'price',
    'cheap', 'affordable', 'recommend', 'vs', 'versus', 'alternative', 'guide',
    'how to choose', 'top', 'rating', 'recommendation', 'shopping', 'sale'
  ];

  let score = 0;
  const foundKeywords = [];
  const products = [];

  // Check for buying intent keywords
  buyingKeywords.forEach(keyword => {
    const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
    if (matches > 0) {
      score += matches * getKeywordWeight(keyword);
      foundKeywords.push({ keyword, frequency: matches });
    }
  });

  // Identify potential product mentions
  const productPatterns = [
    /\b\w+\s+(phone|laptop|camera|headphones|watch|tablet|speaker)\b/gi,
    /\b(iphone|samsung|apple|sony|nike|adidas)\s+\w+/gi,
    /\$\d+/g // Price mentions
  ];

  productPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    products.push(...matches);
  });

  // Normalize score (0-1)
  const normalizedScore = Math.min(score / 100, 1);

  return {
    score: normalizedScore,
    keywords: foundKeywords,
    products: [...new Set(products)], // Remove duplicates
    hasHighIntent: normalizedScore > 0.6
  };
}

// Get keyword weight
function getKeywordWeight(keyword: string): number {
  const weights: Record<string, number> = {
    'buy': 10, 'purchase': 10, 'best': 8, 'review': 7, 'compare': 6,
    'deal': 8, 'discount': 7, 'recommend': 6, 'vs': 5, 'guide': 4
  };
  return weights[keyword] || 1;
}

// Categorize content
function categorizeContent(text: string): string {
  const categories: Record<string, string[]> = {
    'technology': ['tech', 'software', 'computer', 'phone', 'app', 'digital', 'internet'],
    'health': ['health', 'fitness', 'medical', 'wellness', 'exercise', 'nutrition'],
    'fashion': ['fashion', 'clothing', 'style', 'outfit', 'dress', 'shoes'],
    'home': ['home', 'kitchen', 'furniture', 'decor', 'garden', 'cleaning'],
    'travel': ['travel', 'vacation', 'trip', 'hotel', 'flight', 'destination'],
    'food': ['food', 'recipe', 'cooking', 'restaurant', 'meal', 'ingredient'],
    'finance': ['money', 'finance', 'investment', 'budget', 'savings', 'credit'],
    'education': ['education', 'learning', 'course', 'study', 'school', 'training']
  };

  let bestCategory = 'general';
  let highestScore = 0;

  Object.entries(categories).forEach(([category, keywords]) => {
    let score = 0;
    keywords.forEach(keyword => {
      const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
      score += matches;
    });

    if (score > highestScore) {
      highestScore = score;
      bestCategory = category;
    }
  });

  return bestCategory;
}

// Analyze sentiment
function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'best', 'awesome', 'fantastic'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing'];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    positiveCount += (text.match(new RegExp(word, 'gi')) || []).length;
  });

  negativeWords.forEach(word => {
    negativeCount += (text.match(new RegExp(word, 'gi')) || []).length;
  });

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// Calculate content score
function calculateContentScore(text: string, keywords: string[]): number {
  // Simple scoring based on content length and keyword density
  const wordCount = text.split(' ').length;
  const keywordDensity = keywords.length / wordCount;
  
  let score = Math.min(wordCount / 1000, 1) * 50; // Length score (0-50)
  score += Math.min(keywordDensity * 1000, 50); // Keyword density score (0-50)
  
  return Math.round(score);
}

// Generate content hash
function generateContentHash(content: string): string {
  // Simple hash function for content
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}