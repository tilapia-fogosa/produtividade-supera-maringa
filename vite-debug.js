const { execSync } = require('child_process');

try {
    console.log('Running vite build...');
    execSync('npx vite build', { encoding: 'utf8', stdio: 'pipe' });
    console.log('Build succeeded!');
} catch (error) {
    console.log('Build failed. Full error message:');
    console.log(error.stdout);
    console.log(error.stderr);
}
