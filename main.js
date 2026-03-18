import { createGuestbookApp } from "./guestbook-app.js";
import { createGuestbookApi } from "./guestbook-api.js";

const CONFIG = Object.freeze({
	storageKey: "guestbookEntries",
	visitorIdKey: "guestbookVisitorId",
	messageDraftKey: "guestbookMessageDraft",
	fallbackNameMaxLength: 32,
	fallbackMessageMaxLength: 140,
	maxEntries: 100,
	refreshIntervalMs: 15000,
	remoteOfflineMessage: "Guestbook server is offline. Start it with npm start.",
	githubGuestbookRepo: "gekkzzz/gekkzzz.github.io",
	githubGuestbookIssueTerm: "guestbook",
	githubGuestbookLabel: "guestbook",
	githubGuestbookTheme: "preferred-color-scheme",
	githubPagesModeMessage: "Permanent guestbook mode: sign in with GitHub to post."
});

const dom = getDomNodes();
if (dom) {
	const configuredApiUrl = getConfiguredApiUrl();

	if (shouldUseGitHubCommentsMode(configuredApiUrl) && canMountGitHubComments(CONFIG)) {
		mountGitHubCommentsGuestbook(dom, CONFIG);
	} else {
		const storage = createStorageAdapter(window.localStorage);
		const guestbook = createGuestbookApp({
			dom,
			storage,
			api: createGuestbookApi(configuredApiUrl || "/api/guestbook"),
			config: {
				...CONFIG,
				offlineMessage: CONFIG.remoteOfflineMessage,
				modeMessage: ""
			}
		});
		guestbook.init();
	}
}

function getDomNodes() {
	const nodes = {
		note: document.querySelector(".guestbook-note"),
		form: document.getElementById("guestbook-form"),
		nameInput: document.getElementById("guestbook-name"),
		messageInput: document.getElementById("guestbook-message"),
		feedback: document.getElementById("guestbook-feedback"),
		list: document.getElementById("guestbook-list"),
		charCount: document.getElementById("guestbook-char-count"),
		modeNote: document.getElementById("guestbook-mode-note"),
		thread: document.getElementById("guestbook-thread")
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

function shouldUseGitHubCommentsMode(configuredApiUrl) {
	return !configuredApiUrl && isGitHubPagesHost(window.location.hostname);
}

function canMountGitHubComments(config) {
	return Boolean(config.githubGuestbookRepo && config.githubGuestbookIssueTerm);
}

function mountGitHubCommentsGuestbook(dom, config) {
	if (dom.note) {
		dom.note.textContent = "Permanent guestbook: leave a message in the GitHub thread below.";
	}

	if (dom.form) {
		dom.form.hidden = true;
	}
	if (dom.charCount) {
		dom.charCount.hidden = true;
	}
	if (dom.feedback) {
		dom.feedback.hidden = true;
		dom.feedback.textContent = "";
		delete dom.feedback.dataset.state;
	}
	if (dom.list) {
		dom.list.hidden = true;
	}

	if (dom.modeNote) {
		dom.modeNote.textContent = config.githubPagesModeMessage;
	}

	if (!dom.thread) {
		return;
	}

	dom.thread.hidden = false;

	const script = document.createElement("script");
	script.src = "https://utteranc.es/client.js";
	script.async = true;
	script.setAttribute("repo", config.githubGuestbookRepo);
	script.setAttribute("issue-term", config.githubGuestbookIssueTerm);
	script.setAttribute("theme", config.githubGuestbookTheme);
	script.setAttribute("crossorigin", "anonymous");

	if (config.githubGuestbookLabel) {
		script.setAttribute("label", config.githubGuestbookLabel);
	}

	dom.thread.replaceChildren(script);
}

function isGitHubPagesHost(hostname) {
	return String(hostname || "").toLowerCase().endsWith("github.io");
}
