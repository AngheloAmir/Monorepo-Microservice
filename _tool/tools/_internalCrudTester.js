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

    const requestHeader = req.headers;
    const requestBody   = req.body;

    res.write(JSON.stringify({
        message: "it mirrors your inputs",
        requestHeader,
        requestBody
    }));
    res.end();
}

module.exports = {
    pingMe,
    pingPost
}