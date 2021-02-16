const expect = require("expect.js");
const sinon = require("sinon");
const ndjson = require("..");

const EOL = Object.freeze([10]);    // end-of-line byte sequence

describe("ndjson({strict})", () => {
    const strict = true;
    let stream;

    beforeEach(() => {
        stream = ndjson({strict});
    });

    it("should return Transform stream", () => {
        expect(stream.readable).to.be(true);
        expect(stream.writable).to.be(true);
    });

    it("should output parsed JSON", () => {
        const bodyA = JSON.stringify({A:"foo"});
        const bodyB = JSON.stringify({B:"foo"});

        stream.write(Buffer.from(bodyA)); stream.write(Buffer.from(EOL));
        stream.write(Buffer.from(bodyB)); stream.write(Buffer.from(EOL));
        stream.end();

        const docA = stream.read();
        const docB = stream.read();

        expect(docA).to.be.an("object");
        expect(docB).to.be.an("object");
        expect(docA.A).to.be("foo");
        expect(docB.B).to.be("foo");
    });

    it("should error on missing terminator if strict", () => {
        const body = JSON.stringify({A:"foo"});
        const errspy = sinon.spy();

        stream.on("error", errspy);
        stream.write(Buffer.from(body));
        stream.end();

        expect(errspy.called).to.be(true);
    });
});
