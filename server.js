const http = require("node:http");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, "data");
const DATA_FILE = path.join(DATA_DIR, "guestbook.json");

const MAX_ENTRIES = 500;
const MAX_NAME_LENGTH = 32;
const MAX_MESSAGE_LENGTH = 140;
const MAX_OWNER_ID_LENGTH = 120;

const MIME_TYPES = {
	".css": "text/css; charset=utf-8",
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".png": "image/png",
	".svg": "image/svg+xml",
	".txt": "text/plain; charset=utf-8"
};

ensureDataFile();

const server = http.createServer((req, res) => {
	void handleRequest(req, res);
});

server.listen(PORT, () => {
	console.log(`Guestbook server running at http://localhost:${PORT}`);
});

async function handleRequest(req, res) {
	try {
		const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
		const pathname = decodeURIComponent(url.pathname);

		if (pathname === "/api/guestbook" && req.method === "GET") {
			return handleListEntries(res);
		}
		if (pathname === "/api/guestbook" && req.method === "POST") {
			return handleCreateEntry(req, res);
		}
		if (pathname.startsWith("/api/guestbook/") && req.method === "DELETE") {
			const id = pathname.slice("/api/guestbook/".length);
			return handleDeleteEntry(req, res, id);
		}
		if (pathname.startsWith("/api/")) {
			return sendJson(res, 404, { error: "API route not found." });
		}

		if (req.method !== "GET" && req.method !== "HEAD") {
			res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
			res.end("Method not allowed");
			return;
		}

		await serveStaticFile(pathname, req.method === "HEAD", res);
	} catch (error) {
		const statusCode = Number(error && error.statusCode) || 500;
		const message = statusCode >= 500
			? "Unexpected server error."
			: (error && typeof error.message === "string" && error.message) || "Request failed.";
		sendJson(res, statusCode, { error: message });
	}
}

function handleListEntries(res) {
	const entries = readEntries();
	sendJson(res, 200, entries);
}

async function handleCreateEntry(req, res) {
	const body = await readJsonBody(req);
	const name = sanitizeText(body.name, MAX_NAME_LENGTH);
	const message = sanitizeText(body.message, MAX_MESSAGE_LENGTH);
	const ownerId = sanitizeText(body.ownerId, MAX_OWNER_ID_LENGTH);

	if (!name || !message || !ownerId) {
		sendJson(res, 400, { error: "Name, message, and ownerId are required." });
		return;
	}

	const entries = readEntries();
	const entry = {
		id: randomUUID(),
		name,
		message,
		ownerId,
		createdAt: Date.now()
	};

	entries.unshift(entry);
	writeEntries(entries.slice(0, MAX_ENTRIES));
	sendJson(res, 201, entry);
}

async function handleDeleteEntry(req, res, id) {
	if (!id) {
		sendJson(res, 400, { error: "Entry id is required." });
		return;
	}

	const body = await readJsonBody(req);
	const ownerId = sanitizeText(body.ownerId, MAX_OWNER_ID_LENGTH);
	if (!ownerId) {
		sendJson(res, 400, { error: "ownerId is required to delete messages." });
		return;
	}

	const entries = readEntries();
	const index = entries.findIndex(entry => entry.id === id);
	if (index === -1) {
		sendJson(res, 404, { error: "Message not found." });
		return;
	}

	if (entries[index].ownerId !== ownerId) {
		sendJson(res, 403, { error: "You can only delete your own message." });
		return;
	}

	entries.splice(index, 1);
	writeEntries(entries);
	sendJson(res, 200, { ok: true });
}

async function serveStaticFile(pathname, isHeadRequest, res) {
	const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
	const absolutePath = path.resolve(ROOT_DIR, relativePath);

	if (!isInsideRoot(absolutePath)) {
		res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
		res.end("Forbidden");
		return;
	}

	let targetPath = absolutePath;
	let stat;
	try {
		stat = await fsp.stat(targetPath);
		if (stat.isDirectory()) {
			targetPath = path.join(targetPath, "index.html");
			stat = await fsp.stat(targetPath);
		}
	} catch (error) {
		res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
		res.end("Not found");
		return;
	}

	const extension = path.extname(targetPath).toLowerCase();
	const contentType = MIME_TYPES[extension] || "application/octet-stream";
	const body = await fsp.readFile(targetPath);
	res.writeHead(200, {
		"Content-Type": contentType,
		"Cache-Control": "no-cache"
	});
	if (!isHeadRequest) {
		res.end(body);
		return;
	}
	res.end();
}

function isInsideRoot(absolutePath) {
	return absolutePath === ROOT_DIR || absolutePath.startsWith(`${ROOT_DIR}${path.sep}`);
}

function ensureDataFile() {
	fs.mkdirSync(DATA_DIR, { recursive: true });
	if (!fs.existsSync(DATA_FILE)) {
		fs.writeFileSync(DATA_FILE, "[]\n", "utf8");
	}
}

function readEntries() {
	ensureDataFile();
	try {
		const raw = fs.readFileSync(DATA_FILE, "utf8");
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			return [];
		}
		return parsed;
	} catch (error) {
		return [];
	}
}

function writeEntries(entries) {
	ensureDataFile();
	fs.writeFileSync(DATA_FILE, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
}

function sendJson(res, statusCode, payload) {
	res.writeHead(statusCode, {
		"Content-Type": "application/json; charset=utf-8",
		"Cache-Control": "no-store"
	});
	res.end(JSON.stringify(payload));
}

function sanitizeText(value, maxLength) {
	return String(value || "").trim().slice(0, maxLength);
}

function readJsonBody(req) {
	return new Promise((resolve, reject) => {
		let body = "";
		let handled = false;

		function fail(statusCode, message) {
			if (handled) {
				return;
			}
			handled = true;
			const error = new Error(message);
			error.statusCode = statusCode;
			reject(error);
		}

		function succeed(payload) {
			if (handled) {
				return;
			}
			handled = true;
			resolve(payload);
		}

		req.on("data", chunk => {
			if (handled) {
				return;
			}
			body += chunk;
			if (body.length > 1_000_000) {
				req.destroy();
				fail(413, "Request body too large.");
			}
		});

		req.on("end", () => {
			if (handled) {
				return;
			}
			if (!body) {
				succeed({});
				return;
			}

			try {
				succeed(JSON.parse(body));
			} catch (error) {
				fail(400, "Invalid JSON body.");
			}
		});

		req.on("error", error => {
			if (handled) {
				return;
			}
			error.statusCode = Number(error.statusCode) || 400;
			reject(error);
		});
	});
}
