const {Transform} = require("stream");

const defaults = {
    strict: true          // strict handling
};

/**
 * Create a transform stream to read ND-JSON input data and output parsed JSON
 * documents.
 */
function ndjson(options={}) {
    options = {...defaults, ...options};

    let buffer = Buffer(0);

    return new Transform({
        objectMode: true,
        transform(chunk, encoding, done) {
            let offset = 0;
            let index = -1;

            buffer = Buffer.concat([buffer, chunk]);

            while (~(index = buffer.indexOf(10, offset))) {
                push(this, buffer.slice(offset, index));
                offset = index + 1;   // set offset after newline
            }

            buffer = buffer.slice(offset);
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
