const {Transform} = require("stream");

const defaults = {
    maxSize: Infinity,    // maximum document size
    strict: true          // strict handling
};

/**
 * Create a transform stream to read ND-JSON input data and output parsed JSON
 * documents.
 */
function ndjson(options={}) {
    options = {...defaults, ...options};

    let buffer = Buffer(0);
    let oversized = false;

    return new Transform({
        objectMode: true,
        transform(chunk, encoding, done) {
            let offset = 0;
            let index = -1;
            let pushed = false;

            buffer = Buffer.concat([buffer, chunk]);

            // create a window into the starting buffer data
            const window = buffer.slice(0, options.maxSize);

            while (~(index = window.indexOf(10, offset))) {
                if (oversized) {
                    oversized = false;
                } else {
                    push(this, buffer.slice(offset, index));
                    pushed = true;
                }

                offset = index + 1;   // set offset after newline
            }

            // if full window is missing newline, document is too big
            if (!pushed && window.length === options.maxSize) {
                oversized = true;
                this.emit("error", new Error("document too big"));
            }

            buffer = oversized ? Buffer(0) : buffer.slice(offset);
            done();
        },
        flush(done) {
            if (buffer.length && options.strict) {
                this.emit("error", new Error("input not properly terminated"));
            } else if (buffer.length) {
                push(this, buffer);
            }
        }
    });

    function push(stream, bytes) {
        try {
            const text = bytes.toString("utf8");
            const doc = JSON.parse(text);
            stream.push(doc);
        } catch (err) {
            stream.emit("error", err);
        }
    }
}

module.exports = ndjson;
