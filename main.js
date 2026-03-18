import { createGuestbookApp } from "./guestbook-app.js";
import { createGuestbookApi } from "./guestbook-api.js";
import { createLocalGuestbookApi } from "./guestbook-api-local.js";

const CONFIG = Object.freeze({
	storageKey: "guestbookEntries",
	visitorIdKey: "guestbookVisitorId",
	messageDraftKey: "guestbookMessageDraft",
	fallbackNameMaxLength: 32,
	fallbackMessageMaxLength: 140,
	maxEntries: 100,
	refreshIntervalMs: 15000,
	remoteOfflineMessage: "Guestbook server is offline. Start it with npm start.",
	githubPagesModeMessage: "GitHub Pages mode: messages are saved per browser."
});

const dom = getDomNodes();
if (dom) {
	const storage = createStorageAdapter(window.localStorage);
	const runtime = resolveGuestbookRuntime(storage, CONFIG);
	const guestbook = createGuestbookApp({
		dom,
		storage,
		api: runtime.api,
		config: {
			...CONFIG,
			offlineMessage: runtime.offlineMessage,
			modeMessage: runtime.modeMessage
		}
	});
	guestbook.init();
}

function getDomNodes() {
	const nodes = {
		form: document.getElementById("guestbook-form"),
		nameInput: document.getElementById("guestbook-name"),
		messageInput: document.getElementById("guestbook-message"),
		feedback: document.getElementById("guestbook-feedback"),
		list: document.getElementById("guestbook-list"),
		charCount: document.getElementById("guestbook-char-count"),
		modeNote: document.getElementById("guestbook-mode-note")
	};

	if (!nodes.form || !nodes.nameInput || !nodes.messageInput || !nodes.feedback || !nodes.list) {
		return null;
	}

	return nodes;
}

function createStorageAdapter(storageSource) {
	return {
		get(key) {
			try {
				return storageSource.getItem(key);
			} catch (error) {
				return null;
			}
		},
		set(key, value) {
			try {
				storageSource.setItem(key, value);
			} catch (error) {
				// Ignore write failures in private browsing or storage-restricted environments.
			}
		}
	};
}

function resolveGuestbookRuntime(storage, config) {
	const configuredApiUrl = getConfiguredApiUrl();
	const runningOnGitHubPages = isGitHubPagesHost(window.location.hostname);

	if (!configuredApiUrl && runningOnGitHubPages) {
		return {
			api: createLocalGuestbookApi(storage, {
				storageKey: config.storageKey,
				maxEntries: config.maxEntries
			}),
			offlineMessage: "",
			modeMessage: config.githubPagesModeMessage
		};
	}

	return {
		api: createGuestbookApi(configuredApiUrl || "/api/guestbook"),
		offlineMessage: config.remoteOfflineMessage,
		modeMessage: ""
	};
}

function getConfiguredApiUrl() {
	const tag = document.querySelector('meta[name="guestbook-api-url"]');
	if (!tag) {
		return "";
	}

	const value = String(tag.getAttribute("content") || "").trim();
	if (!value) {
		return "";
	}

	return value;
}

function isGitHubPagesHost(hostname) {
	return String(hostname || "").toLowerCase().endsWith("github.io");
}
