module.exports = src => src.replace(/\brequire\(['"][^'"]*\.\.[\\/]modules[\\/]web\.[^'"]*['"]\)/g, '');
