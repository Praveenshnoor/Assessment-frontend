const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            walkDir(dirPath, callback);
        } else {
            if (dirPath.endsWith('.jsx') || dirPath.endsWith('.js') || dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
                callback(dirPath);
            }
        }
    });
}

const mapColor = (fullClass, prefix, color, shade) => {
    shade = parseInt(shade, 10);
    let isLight = shade <= 300;

    if (color === 'gray' || color === 'slate' || color === 'zinc' || color === 'neutral' || color === 'stone') {
        if (prefix.includes('bg')) {
            return isLight ? prefix + 'shnoor-lavender' : prefix + 'shnoor-navyLight';
        } else if (prefix.includes('text')) {
            return isLight ? prefix + 'shnoor-soft' : prefix + 'shnoor-navy';
        } else if (prefix.includes('border') || prefix.includes('ring') || prefix.includes('divide')) {
            return isLight ? prefix + 'shnoor-mist' : prefix + 'shnoor-navyLight';
        }
    }

    if (color === 'blue' || color === 'indigo' || color === 'purple' || color === 'violet' || color === 'fuchsia' || color === 'sky') {
        if (prefix.includes('bg')) {
            return isLight ? prefix + 'shnoor-lavender' : prefix + 'shnoor-indigo';
        } else if (prefix.includes('text')) {
            return isLight ? prefix + 'shnoor-indigoMedium' : prefix + 'shnoor-indigo';
        } else {
            return isLight ? prefix + 'shnoor-mist' : prefix + 'shnoor-indigo';
        }
    }

    if (color === 'red' || color === 'rose' || color === 'pink') {
        return prefix + (isLight ? 'shnoor-dangerLight' : 'shnoor-danger');
    }

    if (color === 'green' || color === 'emerald' || color === 'teal' || color === 'lime' || color === 'cyan') {
        return prefix + (isLight ? 'shnoor-successLight' : 'shnoor-success');
    }

    if (color === 'yellow' || color === 'amber' || color === 'orange') {
        return prefix + (isLight ? 'shnoor-warningLight' : 'shnoor-warning');
    }

    return fullClass;
};

let modifiedFilesCount = 0;

walkDir('./src', (filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    let newContent = content.replace(/([a-z0-9:-]+-)(blue|gray|red|green|purple|yellow|indigo|pink|orange|teal|cyan|slate|zinc|neutral|stone|amber|lime|emerald|sky|violet|fuchsia|rose)-(\d{2,3})/g,
        (match, prefix, color, shade) => mapColor(match, prefix, color, shade)
    );

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        modifiedFilesCount++;
        console.log('Modified:', filePath);
    }
});

console.log('Total files modified:', modifiedFilesCount);