export function createLocalGuestbookApi(storage, options = {}) {
	const storageKey = options.storageKey || "guestbookEntries";
	const maxEntries = Number.isFinite(options.maxEntries) && options.maxEntries > 0
		? options.maxEntries
		: 100;

	return {
		listEntries,
		addEntry,
		deleteEntry
	};

	async function listEntries() {
		const entries = readEntries();
		entries.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
		return entries;
	}

	async function addEntry(entry) {
		const name = String(entry.name || "").trim();
		const message = String(entry.message || "").trim();
		const ownerId = String(entry.ownerId || "").trim();

		if (!name || !message || !ownerId) {
			throw new Error("Name, message, and ownerId are required.");
		}

		const nextEntry = {
			id: createId(),
			name,
			message,
			ownerId,
			createdAt: Date.now()
		};

		const entries = [nextEntry, ...readEntries()].slice(0, maxEntries);
		writeEntries(entries);
		return nextEntry;
	}

	async function deleteEntry(id, ownerId) {
		const safeId = String(id || "").trim();
		const safeOwnerId = String(ownerId || "").trim();

		if (!safeId || !safeOwnerId) {
			throw new Error("id and ownerId are required.");
		}

		const entries = readEntries();
		const index = entries.findIndex(entry => entry.id === safeId);
		if (index === -1) {
			throw new Error("Message not found.");
		}
		if (entries[index].ownerId !== safeOwnerId) {
			throw new Error("You can only delete your own message.");
		}

		entries.splice(index, 1);
		writeEntries(entries);
	}

	function readEntries() {
		const raw = storage.get(storageKey);
		if (!raw) {
			return [];
		}

		try {
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) {
				return [];
			}
			return parsed.filter(item => item && typeof item === "object");
		} catch (error) {
			return [];
		}
	}

	function writeEntries(entries) {
		storage.set(storageKey, JSON.stringify(entries));
	}

	function createId() {
		if (window.crypto && typeof window.crypto.randomUUID === "function") {
			return window.crypto.randomUUID();
		}
		return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
	}
}
