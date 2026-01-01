const serveRepositoryData = (res, req, directory) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    delete require.cache[require.resolve('../tooldata/' + directory)];
    const repoData = require('../tooldata/' + directory);
    res.end(JSON.stringify(repoData));
}

module.exports = {
    serveRepositoryData
}