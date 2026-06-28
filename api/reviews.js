export default async function handler(req, res) {
  const PLACE_ID = process.env.GOOGLE_PLACE_ID || 'ChIJicdBse3mnYARzUlONkU2Rs0';
  const API_KEY = process.env.GOOGLE_API_KEY || 'YOUR_API_KEY_PLACEHOLDER';
  
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews&key=${API_KEY}&language=en`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.result || !data.result.reviews) {
      return res.json({ reviews: [] });
    }
    
    // Filter 5-star, sort by most recent, take top 5
    const fiveStar = data.result.reviews
      .filter(r => r.rating === 5)
      .sort((a, b) => b.time - a.time)
      .slice(0, 5)
      .map(r => ({
        name: r.author_name,
        text: r.text.length > 180 ? r.text.substring(0, 180) + '...' : r.text,
        time: r.relative_time_description,
        rating: r.rating,
        photo: r.profile_photo_url || null
      }));
    
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    res.json({ reviews: fiveStar });
  } catch (e) {
    res.json({ reviews: [] });
  }
}
