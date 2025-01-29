import { convertFileSrc } from "@tauri-apps/api/core";
import { resourceDir } from "@tauri-apps/api/path";

export class AudioService {
	private audioElements: { [key: string]: HTMLAudioElement } = {};
	private initialized = false;

	constructor() {
		this.initializeAudio();
	}

	private async initializeAudio() {
		if (this.initialized) return;

		const sounds = [
			"work-start",
			"work-complete",
			"recovery-start",
			"recovery-complete",
			"pi",
		];

		// Check if we're running in Tauri
		const isTauri = "window.__TAURI__" in window;

		for (const sound of sounds) {
			const audio = new Audio();

			if (isTauri) {
				// Use resource dir for Tauri
				const resourcePath = await resourceDir();
				const assetUrl = convertFileSrc(`${resourcePath}/${sound}.mp3`);
				audio.src = assetUrl;
			} else {
				// Use web assets for browser
				audio.src = `/assets/${sound}.mp3`;
			}

			// Enable playing multiple sounds simultaneously
			audio.preload = "auto";
			this.audioElements[sound] = audio;
		}

		this.initialized = true;
	}

	private async playSound(soundName: string) {
		await this.initializeAudio();
		const audio = this.audioElements[soundName];
		if (audio) {
			audio.currentTime = 0;
			await audio.play();
		}
	}

	async announceWorkStart(period: number) {
		await this.stopAll();
		await this.playSound("work-start");
	}

	async announceWorkComplete() {
		await this.stopAll();
		await this.playSound("work-complete");
	}

	async announceRecoveryStart() {
		await this.stopAll();
		await this.playSound("recovery-start");
	}

	async announceRecoveryComplete() {
		await this.stopAll();
		await this.playSound("recovery-complete");
	}

	async playIntervalBeep() {
		await this.playSound("pi");
	}

	private async stopAll() {
		Object.values(this.audioElements).forEach((audio) => {
			audio.pause();
			audio.currentTime = 0;
		});
	}

	async preloadAll(): Promise<void> {
		await this.initializeAudio();
	}
}
