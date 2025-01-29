import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { resourceDir } from "@tauri-apps/api/path";

export class AudioService {
	private audioElements: { [key: string]: HTMLAudioElement } = {};
	private initialized = false;
	private isTauri: boolean;
	private initPromise: Promise<void> | null = null;

	constructor() {
		this.isTauri = "window.__TAURI__" in window;
		this.initPromise = this.initializeAudio();
	}

	private async initializeAudio(): Promise<void> {
		if (this.initialized) return;

		const sounds = [
			"work-start",
			"work-complete",
			"recovery-start",
			"recovery-complete",
			"pi",
		];

		if (this.isTauri) {
			// En Tauri, solo necesitamos verificar que los archivos existan
			const resourcePath = await resourceDir();
			for (const sound of sounds) {
				try {
					const assetUrl = convertFileSrc(
						`${resourcePath}/resources/${sound}.mp3`,
					);
					await fetch(assetUrl);
				} catch (error) {
					console.error(`Error checking sound file ${sound}:`, error);
				}
			}
		} else {
			// Para web, precargamos los elementos de audio
			for (const sound of sounds) {
				const audio = new Audio();
				audio.src = `/assets/${sound}.mp3`;
				audio.preload = "auto";
				this.audioElements[sound] = audio;
			}
		}

		this.initialized = true;
	}

	private async ensureInitialized(): Promise<void> {
		if (this.initPromise) {
			await this.initPromise;
		}
	}

	private async playSound(soundName: string): Promise<void> {
		await this.ensureInitialized();

		if (this.isTauri) {
			try {
				// Usar la función de Rust para reproducir el sonido
				await invoke("play_sound", { soundType: soundName });
			} catch (error) {
				console.error(`Error playing sound ${soundName} in Tauri:`, error);
			}
		} else {
			const audio = this.audioElements[soundName];
			if (audio) {
				try {
					audio.currentTime = 0;
					await audio.play();
				} catch (error) {
					console.error(`Error playing sound ${soundName} in web:`, error);
				}
			}
		}
	}

	async announceWorkStart(period: number): Promise<void> {
		await this.stopAll();
		await this.playSound("work-start");
	}

	async announceWorkComplete(): Promise<void> {
		await this.stopAll();
		await this.playSound("work-complete");
	}

	async announceRecoveryStart(): Promise<void> {
		await this.stopAll();
		await this.playSound("recovery-start");
	}

	async announceRecoveryComplete(): Promise<void> {
		await this.stopAll();
		await this.playSound("recovery-complete");
	}

	async playIntervalBeep(): Promise<void> {
		await this.playSound("pi");
	}

	async stopAll(): Promise<void> {
		await this.ensureInitialized();

		if (this.isTauri) {
			try {
				await invoke("stop_all_sounds");
			} catch (error) {
				console.error("Error stopping sounds in Tauri:", error);
			}
		} else {
			Object.values(this.audioElements).forEach((audio) => {
				audio.pause();
				audio.currentTime = 0;
			});
		}
	}

	async preloadAll(): Promise<void> {
		await this.ensureInitialized();
	}
}
