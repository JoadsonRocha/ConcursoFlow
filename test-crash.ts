import { VercelResponse } from '@vercel/node';

const mockRes = {
    status: function(code: any) {
        console.log("Setting status to", code);
        // simulating express / vercel
        if (typeof code !== 'number' || code < 100 || code > 999) {
            throw new RangeError(`Invalid status code: ${code}`);
        }
        return this;
    },
    json: function(data: any) {
        console.log("JSON:", data);
        return this;
    }
};

const error = {
    status: "RESOURCE_EXHAUSTED",
    message: "Some quota error"
};

try {
    mockRes.status(error.status || 429).json({ error: "LIMIT" });
} catch (e) {
    console.error("IT CRASHED:", e);
}
