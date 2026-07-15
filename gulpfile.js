const { src, dest, parallel } = require('gulp');

function buildIcons() {
	return src('icons/**').pipe(dest('dist/icons'));
}

// tsc does not copy the codex (*.node.json) metadata files to dist
function buildCodex() {
	return src('nodes/**/*.json').pipe(dest('dist/nodes'));
}

exports['build:icons'] = parallel(buildIcons, buildCodex);
exports.default = parallel(buildIcons, buildCodex);
