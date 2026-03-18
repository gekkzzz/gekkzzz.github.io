export function createGuestbookApi(baseUrl) {
	return {
		listEntries,
		addEntry,
		deleteEntry
	};

	async function listEntries() {
		const response = await fetch(baseUrl, {
			headers: {
				Accept: "application/json"
			}
		});
		if (!response.ok) {
			throw new Error(`Failed to load guestbook entries (${response.status})`);
		}

		const payload = await response.json();
		return Array.isArray(payload) ? payload : [];
	}

	async function addEntry(entry) {
		const response = await fetch(baseUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json"
			},
			body: JSON.stringify(entry)
		});
		if (!response.ok) {
			throw new Error(await readErrorMessage(response, "Failed to add message"));
		}

		return response.json();
	}

	async function deleteEntry(id, ownerId) {
		const response = await fetch(`${baseUrl}/${encodeURIComponent(id)}`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json"
			},
			body: JSON.stringify({ ownerId })
		});
		if (!response.ok) {
			throw new Error(await readErrorMessage(response, "Failed to delete message"));
		}
	}
}

async function readErrorMessage(response, fallback) {
	try {
		const payload = await response.json();
		if (payload && typeof payload.error === "string" && payload.error.trim()) {
			return payload.error;
		}
	} catch (error) {
		// Ignore parse errors and use fallback.
	}
	return `${fallback} (${response.status})`;
}
