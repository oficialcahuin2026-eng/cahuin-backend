const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      const original = fs.readFileSync(fullPath, 'utf8');
      
      if (original.includes('Ã') || original.includes('âœ¨') || original.includes('ðŸ')) {
        try {
            // Revert utf-8 decoding
            const buf = Buffer.from(original, 'latin1');
            const fixed = buf.toString('utf8');
            if (!fixed.includes('\uFFFD') && fixed !== original && !fixed.includes('Ã')) {
                fs.writeFileSync(fullPath, fixed, 'utf8');
                console.log('Fixed using Buffer decoding:', fullPath);
                continue;
            }
        } catch (e) {
            // Ignore
        }

        let manual = original
            .replace(/Ã¡/g, 'á')
            .replace(/Ã©/g, 'é')
            .replace(/Ã­/g, 'í') // Ã + soft hyphen
            .replace(/Ã³/g, 'ó')
            .replace(/Ãº/g, 'ú')
            .replace(/Ã±/g, 'ñ')
            .replace(/Ã\xAD/g, 'í')
            .replace(/Ã¼/g, 'ü')
            .replace(/Ã‘/g, 'Ñ')
            .replace(/Ã¿/g, 'í') // sometimes í is mangled as Ã¿ or others
            .replace(/CahuÃn/g, 'Cahuín')
            .replace(/CahuÃ/g, 'Cahuí')
            .replace(/anÃ³nimas/g, 'anónimas')
            .replace(/TodavÃa/g, 'Todavía')
            .replace(/dÃa/g, 'día')
            .replace(/âœ¨/g, '✨')
            .replace(/ðŸ”¥/g, '🔥')
            .replace(/ðŸ“œ/g, '📜')
            .replace(/ðŸ‘€/g, '👀');

        if (manual !== original) {
            fs.writeFileSync(fullPath, manual, 'utf8');
            console.log('Manually Fixed:', fullPath);
        }
      }
    }
  }
}

processDir('./src');
console.log('Done!');
