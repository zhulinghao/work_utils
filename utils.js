const { execSync } = require('child_process');

const handlePush = (path, commitMsg) => {
  execSync(`git add .`, {
    stdio: 'inherit',
    cwd: path
  });

  execSync(`git commit -m "${commitMsg || '更新前端'}"`, {
    stdio: 'inherit',
    cwd: path
  });

  execSync(`git push origin`, {
    stdio: 'inherit',
    cwd: path
  });
};

module.exports = {
  handlePush
};
