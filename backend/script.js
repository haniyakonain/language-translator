const fromText =
	document.querySelector(".from-text");
const toText = document.querySelector(".to-text");
const selectTag =
	document.querySelectorAll("select");
const exchangeIcon =
	document.querySelector(".exchange");
const translateBtn = document.querySelector(
	".translate-btn"
);
const icons =
	document.querySelectorAll(".icons i");
const microphoneBtn =
	document.getElementById("microphone");

// Google Cloud API Keys (replace with your own)
const apiKey =
	"AIzaSyBMReu2HXQgIOxIAgPfO77biNaqEu1JiEU";
const translationApiUrl = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
const textToSpeechApiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

// Populate language options
selectTag.forEach((tag, id) => {
	if (id === 0) {
		// For the input side, add English as the first option
		let englishOption = `<option value="en" selected>English</option>`;
		tag.insertAdjacentHTML(
			"beforeend",
			englishOption
		);
	}

	// Add all languages (including English for the output side)
	for (const country_code in countries) {
		if (id === 0 && country_code === "en")
			continue; // Skip English for input side as it's already added

		let selected =
			id === 1 && country_code === "hi"
				? "selected"
				: "";
		let option = `<option value="${country_code}" ${selected}>${countries[country_code]}</option>`;
		tag.insertAdjacentHTML("beforeend", option);
	}

	// If English wasn't in the original list for input side, remove the duplicate
	if (id === 0 && countries["en"]) {
		tag
			.querySelector(
				'option[value="en"]:not(:first-child)'
			)
			.remove();
	}
});

// Function to handle language exchange
exchangeIcon.addEventListener("click", () => {
	[fromText.value, toText.value] = [
		toText.value,
		fromText.value,
	];
	[selectTag[0].value, selectTag[1].value] = [
		selectTag[1].value,
		selectTag[0].value,
	];
});

// Function to translate text using Google Cloud Translation API
function translateText(text, fromLang, toLang) {
	fetch(translationApiUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			q: text,
			source: fromLang,
			target: toLang,
			format: "text",
		}),
	})
		.then((res) => res.json())
		.then((data) => {
			if (
				data.data &&
				data.data.translations &&
				data.data.translations[0]
			) {
				toText.value =
					data.data.translations[0].translatedText;
				toText.setAttribute(
					"placeholder",
					"Translation"
				);
			} else {
				throw new Error(
					"Invalid response format from API"
				);
			}
		})
		.catch((error) => {
			console.error("Translation error:", error);
			toText.setAttribute(
				"placeholder",
				"Translation Error"
			);
		});
}

// Function to perform text-to-speech using Google Cloud Text-to-Speech API
function speakText(text, lang) {
	fetch(textToSpeechApiUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			input: { text: text },
			voice: { languageCode: lang },
			audioConfig: { audioEncoding: "MP3" },
		}),
	})
		.then((res) => res.json())
		.then((data) => {
			if (data.audioContent) {
				const audio = new Audio(
					"data:audio/mp3;base64," +
						data.audioContent
				);
				audio.play();
			} else {
				throw new Error(
					"Invalid response format from API"
				);
			}
		})
		.catch((error) => {
			console.error(
				"Text-to-Speech error:",
				error
			);
		});
}

// Function to handle speech recognition
function startSpeechRecognition() {
	if (!("webkitSpeechRecognition" in window)) {
		alert(
			"Your browser doesn't support speech recognition. Please try a different browser."
		);
		return;
	}

	const recognition =
		new webkitSpeechRecognition();
	recognition.lang = selectTag[0].value;
	recognition.interimResults = false;
	recognition.maxAlternatives = 1;

	recognition.onstart = () => {
		fromText.setAttribute(
			"placeholder",
			"Listening..."
		);
		microphoneBtn.classList.add("listening");
	};

	recognition.onresult = (event) => {
		fromText.value =
			event.results[0][0].transcript;
	};

	recognition.onerror = (event) => {
		console.error(
			"Speech recognition error:",
			event
		);
		fromText.setAttribute(
			"placeholder",
			"Speech Recognition Error"
		);
		microphoneBtn.classList.remove("listening");
	};

	recognition.onend = () => {
		fromText.setAttribute(
			"placeholder",
			"Enter text"
		);
		microphoneBtn.classList.remove("listening");
	};

	recognition.start();
}

// Event listener for translate button
translateBtn.addEventListener("click", () => {
	let text = fromText.value.trim();
	if (!text) return;

	let translateFrom =
		selectTag[0].value.split("-")[0];
	let translateTo =
		selectTag[1].value.split("-")[0];

	toText.setAttribute(
		"placeholder",
		"Translating..."
	);
	translateText(text, translateFrom, translateTo);
});

// Event listeners for copy and speak icons
icons.forEach((icon) => {
	icon.addEventListener("click", ({ target }) => {
		if (target.classList.contains("fa-copy")) {
			navigator.clipboard.writeText(
				target.id === "from"
					? fromText.value
					: toText.value
			);
		} else if (
			target.classList.contains("fa-volume-up")
		) {
			let textToSpeak =
				target.id === "from"
					? fromText.value
					: toText.value;
			let lang =
				target.id === "from"
					? selectTag[0].value
					: selectTag[1].value;
			speakText(textToSpeak, lang);
		}
	});
});

// Event listener for microphone button
microphoneBtn.addEventListener("click", () => {
	if (
		!microphoneBtn.classList.contains("listening")
	) {
		startSpeechRecognition();
	}
});
