import { Howl } from "howler";

export class AudioService {
	private sounds: {
		workStart: Howl;
		workComplete: Howl;
		recoveryStart: Howl;
		recoveryComplete: Howl;
		intervalBeep: Howl;
	};

	constructor() {
		// Inicializar todos los sonidos con las rutas correctas
		this.sounds = {
			workStart: new Howl({
				src: ["/assets/work-start.mp3"],
				volume: 0.8,
				preload: true,
			}),
			workComplete: new Howl({
				src: ["/assets/work-complete.mp3"],
				volume: 0.8,
				preload: true,
				format: ["mp3"],
			}),
			recoveryStart: new Howl({
				src: ["/assets/recovery-start.mp3"],
				volume: 0.8,
				preload: true,
				format: ["mp3"],
			}),
			recoveryComplete: new Howl({
				src: ["/assets/recovery-complete.mp3"],
				volume: 0.8,
				preload: true,
				format: ["mp3"],
			}),
			intervalBeep: new Howl({
				src: ["/assets/pi.mp3"],
				volume: 0.8,
				preload: true,
				format: ["mp3"],
			}),
		};
	}

	announceWorkStart(period: number) {
		this.stopAll();
		this.sounds.workStart.play();
	}

	announceWorkComplete() {
		this.stopAll();
		this.sounds.workComplete.play();
	}

	announceRecoveryStart() {
		this.stopAll();
		this.sounds.recoveryStart.play();
	}

	announceRecoveryComplete() {
		this.stopAll();
		this.sounds.recoveryComplete.play();
	}

	playIntervalBeep() {
		this.sounds.intervalBeep.play();
	}

	private stopAll() {
		Object.values(this.sounds).forEach((sound) => sound.stop());
	}

	async preloadAll(): Promise<void> {
		const loadPromises = Object.values(this.sounds).map((sound) => {
			return new Promise<void>((resolve, reject) => {
				sound.once("load", () => resolve());
				sound.once("loaderror", (error) => {
					console.error("Error loading sound:", error);
					reject(error);
				});
			});
		});

		await Promise.all(loadPromises);
	}
}
