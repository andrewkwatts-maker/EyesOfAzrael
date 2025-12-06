const fs = require('fs');
const path = require('path');

/**
 * Creates simple redirect pages for moved/deleted content
 */

const redirectTemplate = (title, targetPath, mythology = 'Hindu') => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="0; url=${targetPath}">
    <title>Redirecting to ${title}</title>
    <link rel="stylesheet" href="../../../themes/theme-base.css">
</head>
<body style="display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center;">
    <div>
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">🔄 Redirecting...</h1>
        <p style="font-size: 1.2rem; color: var(--color-text-secondary);">
            ${title} has been moved to the ${mythology} Deities section.
        </p>
        <p style="margin-top: 2rem;">
            <a href="${targetPath}" style="color: var(--color-primary); font-size: 1.1rem; text-decoration: none; border-bottom: 2px solid var(--color-primary);">
                Click here if you are not redirected automatically →
            </a>
        </p>
    </div>
    <script>
        // Redirect immediately
        window.location.href = "${targetPath}";
    </script>
</body>
</html>`;

const redirects = [
  {
    file: 'mythos/hindu/creatures/brahma.html',
    title: 'Brahma',
    target: '../deities/brahma.html'
  },
  {
    file: 'mythos/hindu/creatures/vishnu.html',
    title: 'Vishnu',
    target: '../deities/vishnu.html'
  },
  {
    file: 'mythos/hindu/creatures/shiva.html',
    title: 'Shiva',
    target: '../deities/shiva.html'
  },
  {
    file: 'mythos/buddhist/deities/avalokiteshvara_detailed.html',
    title: 'Avalokiteshvara',
    target: 'avalokiteshvara.html',
    mythology: 'Buddhist'
  },
  {
    file: 'mythos/buddhist/deities/manjushri_detailed.html',
    title: 'Manjushri',
    target: 'manjushri.html',
    mythology: 'Buddhist'
  }
];

console.log('🔄 Creating redirect pages...\n');

redirects.forEach(r => {
  const dir = path.dirname(r.file);

  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Create redirect page
  const content = redirectTemplate(r.title, r.target, r.mythology || 'Hindu');
  fs.writeFileSync(r.file, content);

  console.log(`   ✅ Created: ${r.file}`);
  console.log(`      → redirects to ${r.target}\n`);
});

console.log('✅ All redirect pages created!\n');
