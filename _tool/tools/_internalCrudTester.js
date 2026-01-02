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

const pingStream = async (req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'X-Content-Type-Options': 'nosniff' 
        });

        const sentenceToStream = "lorem ipsum dolor sit amet consectetur adipiscing elit";
        const words            = sentenceToStream.split(" ");
        
        words.forEach(async word => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            res.write(word + "\n");
        });
        
        res.end();
    });
}


module.exports = {
    pingMe,
    pingPost,
    pingStream
}