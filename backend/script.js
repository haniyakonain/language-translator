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
const speakFromBtn =
	document.getElementById("speak-from");
const listenFromBtn = document.getElementById(
	"listen-from"
);
const listenToBtn =
	document.getElementById("listen-to");

// Google Cloud API Keys (replace with your own)
const apiKey =
	"AIzaSyBMReu2HXQgIOxIAgPfO77biNaqEu1JiEU";
const translationApiUrl = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
const textToSpeechApiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
const speechToTextApiUrl = `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`;

// Populate language options
selectTag.forEach((tag, id) => {
	for (const country_code in countries) {
		let selected = "";
		if (id === 0 && country_code === "en") {
			selected = "selected";
		} else if (
			id === 1 &&
			country_code === "hi"
		) {
			selected = "selected";
		}
		let option = `<option value="${country_code}" ${selected}>${countries[country_code]}</option>`;
		tag.insertAdjacentHTML("beforeend", option);
	}
});

// Function to handle language exchange
exchangeIcon.addEventListener("click", () => {
	let tempText = fromText.value;
	let tempLang = selectTag[0].value;
	fromText.value = toText.value;
	selectTag[0].value = selectTag[1].value;
	toText.value = tempText;
	selectTag[1].value = tempLang;
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

// Function to perform speech recognition using Google Cloud Speech-to-Text API
function recognizeSpeech() {
	if (!("webkitSpeechRecognition" in window)) {
		alert(
			"Your browser does not support speech recognition."
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
	};

	recognition.onend = () => {
		fromText.setAttribute(
			"placeholder",
			"Enter text"
		);
	};

	recognition.start();
}

// Event listener for translate button
translateBtn.addEventListener("click", () => {
	let text = fromText.value;
	let translateFrom =
		selectTag[0].value.split("-")[0]; // Get primary language code
	let translateTo =
		selectTag[1].value.split("-")[0]; // Get primary language code

	if (!text) return;

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
			let textToCopy =
				target.id === "from"
					? fromText.value
					: toText.value;
			navigator.clipboard.writeText(textToCopy);
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

// Event listener for speech recognition button
speakFromBtn.addEventListener("click", () => {
	recognizeSpeech();
});
