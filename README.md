Node.js library for parsing ND-JSON streams.

Usage
=====

```js
const ndjson = require("@zingle/ndjson");
const docs = getStreamSomehow().pipe(ndjson());

printIds(docs).catch(console.error);

async function printIds(iterable) {
    for await (const doc of iterable) {
        console.log(doc.id);
    }
}
```
