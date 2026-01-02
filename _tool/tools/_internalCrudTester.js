const url = require('url');

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

const poem1 ="" +
`[I Wandered Lonely as a Cloud]

I wandered lonely as a cloud
That floats on high o'er vales and hills,
When all at once I saw a crowd,
A host, of golden daffodils;
Beside the lake, beneath the trees,
Fluttering and dancing in the breeze.

Continuous as the stars that shine
And twinkle on the milky way,
They stretched in never-ending line
Along the margin of a bay:
Ten thousand saw I at a glance,
Tossing their heads in sprightly dance.

The waves beside them danced; but they
Out-did the sparkling waves in glee:
A poet could not but be gay,
In such a jocund company:
I gazed—and gazed—but little thought
What wealth the show to me had brought:
 
For oft, when on my couch I lie
In vacant or in pensive mood,
They flash upon that inward eye
Which is the bliss of solitude;
And then my heart with pleasure fills,
And dances with the daffodils.
`
const poem2 = "" +  
`[The Sun Has Long Been Set]

The sun has long been set,
The stars are out by twos and threes,
The little birds are piping yet
Among the bushes and trees;
There's a cuckoo, and one or two thrushes,
And a far-off wind that rushes,
And a sound of water that gushes,
And the cuckoo's sovereign cry
Fills all the hollow of the sky.
Who would "go parading"
In London, "and masquerading,"
On such a night of June
With that beautiful soft half-moon,
And all these innocent blisses?
On such a night as this is!
`

const pingStream = (req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'X-Content-Type-Options': 'nosniff' 
        });

        // Parse Query Params manually
        const parsedUrl = url.parse(req.url, true);
        const whichPoem = parsedUrl.query.poem;
        
        let poem;
        if (whichPoem === "I Wandered Lonely as a Cloud") {
            poem = poem1;
        } else if (whichPoem === "The Sun Has Long Been Set") {
            poem = poem2;
        } else {
            poem = "No poem provided or unknown title. Try ?poem=... with the exact title.";
        }

        const words = poem.split(" ");
        
        for (const word of words) {
            res.write(word + " ");
            // Use a proper delay
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        res.end();
    });
}

module.exports = {
    pingMe,
    pingPost,
    pingStream
}