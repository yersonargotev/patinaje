export class AudioService {
	private speechSynthesis: SpeechSynthesis;
	private voice: SpeechSynthesisVoice | null = null;

	constructor() {
		this.speechSynthesis = window.speechSynthesis;

		// Initialize voice when voices are loaded
		if (speechSynthesis.onvoiceschanged !== undefined) {
			speechSynthesis.onvoiceschanged = () => {
				this.initializeVoice();
			};
		}

		this.initializeVoice();
	}

	private initializeVoice() {
		const voices = this.speechSynthesis.getVoices();
		// Try to find a neutral English voice
		this.voice =
			voices.find(
				(voice) =>
					voice.lang.startsWith("en-") &&
					!voice.name.toLowerCase().includes("zira"),
			) || voices[0];
	}

	private speak(text: string, rate: number = 1, pitch: number = 1) {
		// Cancel any ongoing speech
		this.speechSynthesis.cancel();

		const utterance = new SpeechSynthesisUtterance(text);
		utterance.voice = this.voice;
		utterance.rate = rate;
		utterance.pitch = pitch;
		utterance.volume = 0.8; // Slightly reduced volume

		this.speechSynthesis.speak(utterance);
	}

	announceWorkStart(period: number) {
		this.speak(`Period ${period} starting`);
	}

	announceWorkComplete() {
		this.speak("Period complete");
	}

	announceRecoveryStart() {
		this.speak("Recovery starting");
	}

	announceRecoveryComplete() {
		this.speak("Recovery complete");
	}
}
