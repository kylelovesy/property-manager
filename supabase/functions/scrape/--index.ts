import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12';

serve(async (req) => {
  const { url } = await req.json();
  if (!url) return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400 });

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const data = {
      image_url: $('img').first().attr('src') || '',
      price: parseFloat($('[data-price]').text().replace(/[^0-9.]/g, '')) || 0,
      description: $('.description').text().trim() || 'No description',
      location: $('.location').text().trim() || 'Unknown',
      bedrooms: parseInt($('.bedrooms').text()) || 0,
      date_on_sale: $('.date').text().trim() || new Date().toISOString(),
      estate_agent: $('.agent').text().trim() || 'Unknown',
      reduced: $('.reduced').length > 0,
      views: $('.views').length > 0,
      gardens: $('.gardens').length > 0,
      outbuildings: $('.outbuildings').length > 0,
      condition: $('.condition').text().trim() || 'Unknown',
      features: $('.features').map((_, el) => $(el).text().trim()).get(),
    };
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to scrape property' }), { status: 500 });
  }
});