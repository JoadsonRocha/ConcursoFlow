const https = require('https');
https.get('https://web-05163bqg5a.skywork.website/assets/index-D78yHGns.js', (res) => {
  let js = '';
  res.on('data', (d) => { js += d; });
  res.on('end', () => {
    // try to get larger chunks of strings or the react elements
    // Just dump all string literals that are words, spaces, more than 10 characters
    const texts = js.match(/"[\w\sÀ-ÿ\-—.,!?+]{15,}"/g) || [];
    console.log([...new Set(texts.map(t => t.slice(1, -1)))].join('\n'));
  });
});
