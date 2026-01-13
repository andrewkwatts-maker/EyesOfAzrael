const fs = require('fs').promises;
const path = require('path');

async function auditIcons() {
  const assetsPath = path.join(__dirname, '..', 'firebase-assets-downloaded');
  const categories = ['deities', 'heroes', 'creatures', 'items', 'places', 'mythologies', 'concepts'];
  const iconUsage = { hasIcon: 0, noIcon: 0, uniqueIcons: new Set() };

  for (const cat of categories) {
    const catPath = path.join(assetsPath, cat);
    try {
      const files = await fs.readdir(catPath);
      for (const file of files) {
        if (!file.endsWith('.json') || file.startsWith('_')) continue;
        try {
          const content = await fs.readFile(path.join(catPath, file), 'utf8');
          const data = JSON.parse(content);
          const assets = Array.isArray(data) ? data : [data];
          for (const asset of assets) {
            if (asset.icon) {
              iconUsage.hasIcon++;
              iconUsage.uniqueIcons.add(asset.icon);
            } else {
              iconUsage.noIcon++;
            }
          }
        } catch {}
      }
    } catch {}
  }

  console.log('Icon Usage Audit');
  console.log('----------------');
  console.log('Assets with icon:', iconUsage.hasIcon);
  console.log('Assets without icon:', iconUsage.noIcon);
  console.log('Unique icons:', iconUsage.uniqueIcons.size);
  console.log('\nSample icons:', [...iconUsage.uniqueIcons].slice(0, 50).join(' '));
}

auditIcons();
