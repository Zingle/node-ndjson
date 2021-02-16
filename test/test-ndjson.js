const expect = require("expect.js");
const sinon = require("sinon");
const ndjson = require("..");

const EOL = Buffer.from([10]);          // end-of-line byte sequence

describe("ndjson({maxSize, strict})", () => {
    let stream;

    describe("-> Transform", () => {
        beforeEach(() => {
            stream = ndjson();
        });

        it("should return Transform stream", () => {
            expect(stream.readable).to.be(true);
            expect(stream.writable).to.be(true);
        });

        it("should output parsed JSON", () => {
            const bodyA = JSON.stringify({A:"foo"});
            const bodyB = JSON.stringify({B:"foo"});

            stream.write(Buffer.from(bodyA)); stream.write(EOL);
            stream.write(Buffer.from(bodyB)); stream.write(EOL);
            stream.end();

            const docA = stream.read();
            const docB = stream.read();

            expect(docA).to.be.an("object");
            expect(docB).to.be.an("object");
            expect(docA.A).to.be("foo");
            expect(docB.B).to.be("foo");
        });
    });

    describe("option: strict enabled", () => {
        beforeEach(() => {
            stream = ndjson({strict: true});
        });

        it("should error on missing terminator", () => {
            const body = JSON.stringify({A:"foo"});
            const errspy = sinon.spy();

            stream.on("error", errspy);
            stream.write(Buffer.from(body));
            stream.end();

            expect(errspy.called).to.be(true);
        });
    });

    describe("option: strict disabled", () => {
        beforeEach(() => {
            stream = ndjson({strict: false});
        });

        it("should handle last line", () => {
            const body = JSON.stringify({A:"foo"});

            stream.write(Buffer.from(body));
            stream.end();

            const doc = stream.read();

            expect(doc.A).to.be("foo");
        });
    });

    describe("option: maxSize", () => {
        beforeEach(() => {
            stream = ndjson({maxSize: 32});
        });

        it("should error if document is bigger than maxSize", () => {
            const body = JSON.stringify({foo: {bar: {baz: {bang: 42}}}});
            const errspy = sinon.spy();

            stream.on("error", errspy);
            stream.write(Buffer.from(body)); stream.write(EOL);
            stream.end();

            const doc = stream.read();

            expect(errspy.calledOnce).to.be(true);

            const call = errspy.args.shift();
            const arg = call.shift();

            expect(arg).to.be.an(Error);
            expect(arg.message).to.be("document too big");
        });
    });
});
