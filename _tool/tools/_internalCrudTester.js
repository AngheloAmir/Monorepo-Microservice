const pingMe = (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify({
        message:   'pong',
        server:    "Yehey, you have ping the server",
        timestamp: new Date().toISOString()
    }));
    res.end();
}

const pingPost = (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        res.write(JSON.stringify({
            message: "it mirrors your inputs",
            timestamp: new Date().toISOString(),
            headers: req.headers,
            body:    JSON.parse(body)
        }));
        res.end();
    });
}

module.exports = {
    pingMe,
    pingPost
}