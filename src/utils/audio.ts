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
			"five-to-one",
			"test-paused",
			"prep-start",
			"fifteen-seconds",
			"ten-seconds",
			"countdown",
			"1",
			"2",
			"3",
			"4",
			"5",
			"6",
			"7",
			"8",
			"9",
			"10",
			"11",
			"12",
			"13",
			"14",
			"15",
			"16",
			"17",
			"18",
			"19",
			"20",
			"21",
			"22",
		];

		if (this.isTauri) {
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

	public async playCountdown(): Promise<void> {
		await this.ensureInitialized();
		await this.stopAll();

		// Play "15 seconds" announcement
		await this.internalPlaySound("fifteen-seconds");
	}

	private async internalPlaySound(soundName: string): Promise<void> {
		await this.ensureInitialized();

		if (this.isTauri) {
			try {
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

	public async announceWorkStart(): Promise<void> {
		await this.stopAll();
		await this.internalPlaySound("work-start");
	}

	public async announceWorkStartPeriod(period: number): Promise<void> {
		await this.stopAll();
		await this.internalPlaySound("work-start");
		await new Promise((resolve) => setTimeout(resolve, 2000));
		await this.internalPlaySound(period.toString());
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	public async announceWorkComplete(): Promise<void> {
		await this.stopAll();
		await this.internalPlaySound("work-complete");
	}

	public async playCountdownRecovery(): Promise<void> {
		await this.stopAll();
		// Play "10 seconds" announcement
		await this.internalPlaySound("ten-seconds");
	}

	public async announceRecoveryStart(): Promise<void> {
		await this.stopAll();
		await this.internalPlaySound("recovery-start");
	}

	public async announceRecoveryComplete(): Promise<void> {
		await this.stopAll();
		await this.internalPlaySound("recovery-complete");
	}

	public async playIntervalBeep(): Promise<void> {
		await this.internalPlaySound("pi");
	}

	public async stopAll(): Promise<void> {
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

	public async preloadAll(): Promise<void> {
		await this.ensureInitialized();
	}

	public async announceTestPaused(): Promise<void> {
		await this.stopAll();
		await this.internalPlaySound("test-paused");
	}

	public async playFifteenSeconds(): Promise<void> {
		await this.stopAll();
		await this.internalPlaySound("fifteen-seconds");
	}
}
