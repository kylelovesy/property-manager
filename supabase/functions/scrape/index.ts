import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface PropertyData {
  image_url: string;
  price: number;
  description: string;
  location: string;
  bedrooms: number;
  date_on_sale: string;
  estate_agent: string;
  reduced: boolean;
  views: boolean;
  gardens: boolean;
  outbuildings: boolean;
  condition: string;
  features: string[];
}

// Helper function to safely extract text content
function safeTextContent(element: Element | null): string {
  return element?.textContent?.trim() || '';
}

// Helper function to safely extract attribute
function safeAttribute(element: Element | null, attr: string): string {
  return element?.getAttribute(attr) || '';
}

// Helper function to parse price from text
function parsePrice(priceText: string): number {
  const cleaned = priceText.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Helper function to parse integer from text
function parseInteger(text: string): number {
  const parsed = parseInt(text.replace(/\D/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

// Validate URL format
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Site-specific scrapers
function scrapeZillow(doc: Document): Partial<PropertyData> {
  return {
    price: parsePrice(safeTextContent(doc.querySelector('[data-testid="price"]'))),
    description: safeTextContent(doc.querySelector('[data-testid="description"]')).slice(0, 1000),
    location: safeTextContent(doc.querySelector('[data-testid="breadcrumb"]')).slice(0, 100),
    bedrooms: parseInteger(safeTextContent(doc.querySelector('[data-testid="bed-value"]'))),
    image_url: safeAttribute(doc.querySelector('picture img'), 'src'),
    estate_agent: 'Zillow'
  };
}

function scrapeRightmove(doc: Document): Partial<PropertyData> {
  return {
    price: parsePrice(safeTextContent(doc.querySelector('[data-testid="price"]') || doc.querySelector('.price') || doc.querySelector('._1gfnqJ3Vtd1z40MlC0MzXu'))),
    description: safeTextContent(doc.querySelector('[data-testid="description"]') || doc.querySelector('.description') || doc.querySelector('._1uI3I7o-0rCWy7-cUApkyW')).slice(0, 1000),
    location: safeTextContent(doc.querySelector('[data-testid="address"]') || doc.querySelector('.address') || doc.querySelector('._2uQQ3SV0eMHL1P6tEVhY7_')).slice(0, 100),
    bedrooms: parseInteger(safeTextContent(doc.querySelector('[data-testid="bedrooms"]') || doc.querySelector('.bedrooms') || doc.querySelector('._4hBezflLdgDM2EySOBO9v'))),
    image_url: safeAttribute(doc.querySelector('[data-testid="image-link"]') || doc.querySelector('img'), 'src'),
    estate_agent: 'Rightmove'
  };
}

function scrapeGeneric(doc: Document): Partial<PropertyData> {
  const possiblePriceSelectors = [
    '[data-test="price"]', '[data-testid="price"]', '.price', 
    '.property-price', '[class*="price"]', '[id*="price"]'
  ];
  
  const possibleDescSelectors = [
    '[data-test="description"]', '[data-testid="description"]', 
    '.description', '.property-description', '[class*="description"]'
  ];

  let price = 0;
  let description = '';
  let image_url = '';

  for (const selector of possiblePriceSelectors) {
    const element = doc.querySelector(selector);
    if (element) {
      price = parsePrice(safeTextContent(element));
      if (price > 0) break;
    }
  }

  for (const selector of possibleDescSelectors) {
    const element = doc.querySelector(selector);
    if (element) {
      description = safeTextContent(element).slice(0, 1000);
      if (description.length > 0) break;
    }
  }

  const images = doc.querySelectorAll('img');
  for (const img of images) {
    const src = safeAttribute(img, 'src');
    if (src && (src.includes('property') || src.includes('house') || src.includes('home'))) {
      image_url = src;
      break;
    }
  }

  if (!image_url && images.length > 0) {
    image_url = safeAttribute(images[0], 'src');
  }

  return {
    price,
    description,
    image_url,
    location: safeTextContent(doc.querySelector('title')).slice(0, 100),
    bedrooms: 0,
    estate_agent: 'Unknown'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!isValidUrl(url)) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Scraping URL: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': 'https://www.rightmove.co.uk/',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (!doc) {
      throw new Error('Failed to parse HTML document');
    }

    let scrapedData: Partial<PropertyData>;
    
    if (url.includes('zillow.com')) {
      scrapedData = scrapeZillow(doc);
    } else if (url.includes('rightmove.co.uk')) {
      scrapedData = scrapeRightmove(doc);
    } else {
      scrapedData = scrapeGeneric(doc);
    }

    if (scrapedData.image_url && !scrapedData.image_url.startsWith('http')) {
      const baseUrl = new URL(url);
      scrapedData.image_url = new URL(scrapedData.image_url, baseUrl.origin).href;
    }

    const propertyData: PropertyData = {
      image_url: scrapedData.image_url || '',
      price: scrapedData.price || 0,
      description: scrapedData.description || '',
      location: scrapedData.location || '',
      bedrooms: scrapedData.bedrooms || 0,
      date_on_sale: new Date().toISOString().split('T')[0],
      estate_agent: scrapedData.estate_agent || 'Unknown',
      reduced: false,
      views: false,
      gardens: false,
      outbuildings: false,
      condition: 'Unknown',
      features: [],
    };

    console.log(`Successfully scraped property data:`, propertyData);

    return new Response(
      JSON.stringify(propertyData),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Scraping error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to scrape property',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
});