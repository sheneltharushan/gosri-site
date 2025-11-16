// netlify/functions/social-stats.js

exports.handler = async function () {
  const { IG_USER_ID, IG_ACCESS_TOKEN, YT_API_KEY, YT_CHANNEL_ID } =
    process.env;

  try {
    // --- Instagram followers ---
    let instagramFollowers = null;

    if (IG_USER_ID && IG_ACCESS_TOKEN) {
      const igUrl = `https://graph.facebook.com/v18.0/${IG_USER_ID}?fields=followers_count,media_count&access_token=${IG_ACCESS_TOKEN}`;

      const igRes = await fetch(igUrl);
      const igData = await igRes.json();

      if (igData && !igData.error) {
        instagramFollowers = Number(igData.followers_count || 0);
      }
    }

    // --- YouTube stats ---
    let youtubeSubscribers = null;
    let youtubeViews = null;

    if (YT_API_KEY && YT_CHANNEL_ID) {
      const ytUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${YT_CHANNEL_ID}&key=${YT_API_KEY}`;

      const ytRes = await fetch(ytUrl);
      const ytData = await ytRes.json();

      const stats =
        ytData.items && ytData.items[0] && ytData.items[0].statistics;
      if (stats) {
        youtubeSubscribers = Number(stats.subscriberCount || 0);
        youtubeViews = Number(stats.viewCount || 0);
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        instagramFollowers,
        youtubeSubscribers,
        youtubeViews,
      }),
    };
  } catch (err) {
    console.error("social-stats error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch social stats" }),
    };
  }
};
