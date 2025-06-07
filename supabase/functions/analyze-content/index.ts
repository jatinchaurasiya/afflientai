// Edge function to analyze content from websites
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.8";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body
    const { url, title, content, integrationKey, userId, sessionId } = await req.json();

    // Validate request
    if (!integrationKey || !content) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify integration key
    const { data: website, error: websiteError } = await supabase
      .from("websites")
      .select("id, user_id, domain, status")
      .eq("integration_key", integrationKey)
      .eq("status", "active")
      .single();

    if (websiteError || !website) {
      return new Response(
        JSON.stringify({ error: "Invalid integration key" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Analyze content
    const analysis = await analyzeContent(content, title);

    // Store analysis in database
    const { data: contentAnalysis, error: analysisError } = await supabase
      .from("content_analysis")
      .insert({
        website_id: website.id,
        content_url: url,
        content_hash: generateContentHash(content),
        keywords: analysis.keywords,
        products_identified: analysis.productMentions,
        analysis_score: analysis.score,
        category: analysis.category,
        buying_intent_score: analysis.buyingIntentScore,
        sentiment: analysis.sentiment
      })
      .select()
      .single();

    if (analysisError) {
      throw analysisError;
    }

    // Generate product recommendations
    const recommendations = await generateRecommendations(
      website.user_id,
      analysis.keywords,
      analysis.category
    );

    // Determine if we should create a popup
    const shouldCreatePopup = analysis.buyingIntentScore > 0.6;

    return new Response(
      JSON.stringify({
        success: true,
        analysis: contentAnalysis,
        recommendations,
        shouldCreatePopup
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
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

// Generate product recommendations
async function generateRecommendations(
  userId: string,
  keywords: string[],
  category: string
): Promise<any[]> {
  try {
    // Get relevant products
    const { data: products, error } = await supabase
      .from('affiliate_products')
      .select(`
        *,
        affiliate_accounts!inner(user_id, platform, status)
      `)
      .eq('affiliate_accounts.user_id', userId)
      .eq('affiliate_accounts.status', 'active')
      .limit(20);

    if (error) throw error;

    // Filter products based on keywords
    const filteredProducts = products?.filter(product => {
      const searchText = `${product.name} ${product.description}`.toLowerCase();
      return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
    }) || [];

    // Score and rank products
    const scoredProducts = filteredProducts.map(product => ({
      ...product,
      relevanceScore: calculateProductRelevance(product, keywords, category)
    }));

    // Sort by relevance and return top products
    return scoredProducts
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);

  } catch (error) {
    console.error('Error generating product recommendations:', error);
    return [];
  }
}

// Calculate product relevance score
function calculateProductRelevance(product: any, keywords: string[], category: string): number {
  let score = 0;
  const productText = `${product.name} ${product.description}`.toLowerCase();

  // Keyword matching
  keywords.forEach(keyword => {
    if (productText.includes(keyword)) {
      score += 2;
    }
  });

  // Category matching
  if (product.category?.toLowerCase().includes(category)) {
    score += 5;
  }

  // Commission rate bonus
  score += product.commission_rate * 0.1;

  return score;
}