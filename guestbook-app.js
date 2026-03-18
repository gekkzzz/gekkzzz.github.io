export function createGuestbookApp({ dom: nodes, storage: store, api, config }) {
	const maxNameLength = getInputMaxLength(nodes.nameInput, config.fallbackNameMaxLength);
	const maxMessageLength = getInputMaxLength(nodes.messageInput, config.fallbackMessageMaxLength);
	const dateFormatter = new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
		timeStyle: "short"
	});

	const state = {
		visitorId: "",
		entries: [],
		isSubmitting: false,
		refreshTimerId: null
	};

	return {
		init
	};

	async function init() {
		state.visitorId = getVisitorId();

		renderModeNote();
		restoreMessageDraft();
		updateCharCount();
		bindEvents();
		await refreshEntries(true);
		startAutoRefresh();
	}

	function bindEvents() {
		nodes.form.addEventListener("submit", onFormSubmit);
		nodes.nameInput.addEventListener("input", clearFeedback);
		nodes.messageInput.addEventListener("keydown", onTextareaKeydown);
		nodes.messageInput.addEventListener("input", onMessageInput);
		nodes.list.addEventListener("click", onDeleteClick);
	}

	function onFormSubmit(event) {
		event.preventDefault();
	}

	function onTextareaKeydown(event) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			void submitEntry();
		}
	}

	function onMessageInput() {
		updateCharCount();
		saveMessageDraft(nodes.messageInput.value);
		clearFeedback();
	}

	async function onDeleteClick(event) {
		const button = event.target.closest(".delete-btn");
		if (!button || !nodes.list.contains(button)) {
			return;
		}

		const id = String(button.dataset.id || "");
		if (!id) {
			return;
		}

		const target = state.entries.find(entry => entry.id === id);
		if (!target || target.ownerId !== state.visitorId) {
			return;
		}

		try {
			await api.deleteEntry(id, state.visitorId);
			state.entries = state.entries.filter(entry => entry.id !== id);
			setFeedback("Message deleted.");
			renderEntries();
		} catch (error) {
			setFeedback(getErrorMessage(error, "Could not delete message right now."), true);
		}
	}

	async function submitEntry() {
		if (state.isSubmitting) {
			return;
		}

		const name = nodes.nameInput.value.trim().slice(0, maxNameLength);
		const message = nodes.messageInput.value.trim().slice(0, maxMessageLength);

		if (!name || !message) {
			setFeedback("Please enter both name and message.", true);
			return;
		}

		state.isSubmitting = true;
		try {
			const createdEntry = await api.addEntry({
				name,
				message,
				ownerId: state.visitorId
			});
			const normalized = normalizeEntry(createdEntry);

			if (normalized) {
				state.entries = [normalized, ...state.entries.filter(entry => entry.id !== normalized.id)]
					.slice(0, config.maxEntries);
				renderEntries();
			} else {
				await refreshEntries(false);
			}

			nodes.form.reset();
			saveMessageDraft("");
			updateCharCount();
			setFeedback("Thanks! Your message has been added.");
			nodes.nameInput.focus();
		} catch (error) {
			setFeedback(getErrorMessage(error, "Could not post message right now."), true);
		} finally {
			state.isSubmitting = false;
		}
	}

	function getVisitorId() {
		let id = store.get(config.visitorIdKey);
		if (!id) {
			id = window.crypto && typeof window.crypto.randomUUID === "function"
				? window.crypto.randomUUID()
				: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
			store.set(config.visitorIdKey, id);
		}
		return id;
	}

	async function refreshEntries(showConnectionError) {
		try {
			const loaded = await api.listEntries();
			state.entries = loaded
				.map(normalizeEntry)
				.filter(Boolean)
				.slice(0, config.maxEntries);
			renderEntries();
			if (showConnectionError) {
				clearFeedback();
			}
		} catch (error) {
			if (showConnectionError) {
				setFeedback(config.offlineMessage || "Guestbook is temporarily unavailable.", true);
			}
		}
	}

	function startAutoRefresh() {
		if (state.refreshTimerId || !Number.isFinite(config.refreshIntervalMs) || config.refreshIntervalMs <= 0) {
			return;
		}

		state.refreshTimerId = window.setInterval(() => {
			void refreshEntries(false);
		}, config.refreshIntervalMs);
	}

	function normalizeEntry(entry) {
		if (!entry || typeof entry !== "object") {
			return null;
		}

		const id = String(entry.id || "").trim();
		const name = String(entry.name || "").trim().slice(0, maxNameLength);
		const message = String(entry.message || "").trim().slice(0, maxMessageLength);
		const createdAt = Number(entry.createdAt);
		const ownerId = String(entry.ownerId || "");

		if (!id || !name || !message || !Number.isFinite(createdAt)) {
			return null;
		}

		return { id, name, message, createdAt, ownerId };
	}

	function restoreMessageDraft() {
		const draft = store.get(config.messageDraftKey);
		if (!draft) {
			return;
		}

		nodes.messageInput.value = draft.slice(0, maxMessageLength);
	}

	function saveMessageDraft(value) {
		store.set(config.messageDraftKey, String(value || "").slice(0, maxMessageLength));
	}

	function renderEntries() {
		nodes.list.textContent = "";

		if (state.entries.length === 0) {
			const empty = document.createElement("p");
			empty.className = "guestbook-empty";
			empty.textContent = "No messages yet. Be the first!";
			nodes.list.append(empty);
			return;
		}

		const fragment = document.createDocumentFragment();
		state.entries.forEach(entry => {
			fragment.append(createEntryElement(entry));
		});
		nodes.list.append(fragment);
	}

	function createEntryElement(entry) {
		const article = document.createElement("article");
		article.className = "guestbook-entry";

		if (entry.ownerId === state.visitorId) {
			const deleteButton = document.createElement("button");
			deleteButton.type = "button";
			deleteButton.className = "delete-btn";
			deleteButton.dataset.id = entry.id;
			deleteButton.setAttribute("aria-label", "Delete message");
			deleteButton.textContent = "Delete";
			article.append(deleteButton);
		}

		const name = document.createElement("p");
		name.className = "gb-name";
		name.textContent = entry.name;
		article.append(name);

		const message = document.createElement("p");
		message.className = "gb-message";
		message.textContent = entry.message;
		article.append(message);

		const timestamp = document.createElement("p");
		timestamp.className = "gb-time";
		timestamp.textContent = formatDate(entry.createdAt);
		article.append(timestamp);

		return article;
	}

	function updateCharCount() {
		if (!nodes.charCount) {
			return;
		}

		const length = nodes.messageInput.value.length;
		nodes.charCount.textContent = `${length}/${maxMessageLength}`;
		if (length >= maxMessageLength) {
			nodes.charCount.dataset.state = "limit";
		} else {
			delete nodes.charCount.dataset.state;
		}
	}

	function setFeedback(message, isError) {
		nodes.feedback.textContent = message;
		nodes.feedback.dataset.state = isError ? "error" : "success";
	}

	function clearFeedback() {
		nodes.feedback.textContent = "";
		delete nodes.feedback.dataset.state;
	}

	function renderModeNote() {
		if (!nodes.modeNote) {
			return;
		}

		nodes.modeNote.textContent = String(config.modeMessage || "").trim();
	}

	function getErrorMessage(error, fallback) {
		if (error && typeof error.message === "string" && error.message.trim()) {
			return error.message;
		}
		return fallback;
	}

	function formatDate(timestamp) {
		const date = new Date(timestamp);
		if (Number.isNaN(date.getTime())) {
			return "Unknown date";
		}
		return dateFormatter.format(date);
	}
}

function getInputMaxLength(input, fallback) {
	const parsed = Number(input.maxLength);
	return parsed > 0 ? parsed : fallback;
}
