import { Howl } from "howler";

export class AudioService {
	private sounds: {
		workStart: Howl;
		workComplete: Howl;
		recoveryStart: Howl;
		recoveryComplete: Howl;
	};

	constructor() {
		// Inicializar todos los sonidos
		this.sounds = {
			workStart: new Howl({
				src: ["assets/work-start.mp3"],
				volume: 0.8,
				preload: true,
			}),
			workComplete: new Howl({
				src: ["assets/work-complete.mp3"],
				volume: 0.8,
				preload: true,
			}),
			recoveryStart: new Howl({
				src: ["assets/recovery-start.mp3"],
				volume: 0.8,
				preload: true,
			}),
			recoveryComplete: new Howl({
				src: ["assets/recovery-complete.mp3"],
				volume: 0.8,
				preload: true,
			}),
		};
	}

	announceWorkStart(period: number) {
		// Detener cualquier sonido actual
		this.stopAll();
		// Reproducir el sonido de inicio de trabajo
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

	private stopAll() {
		Object.values(this.sounds).forEach((sound) => sound.stop());
	}

	// Método para cargar todos los sonidos de manera asíncrona
	async preloadAll(): Promise<void> {
		const loadPromises = Object.values(this.sounds).map((sound) => {
			return new Promise<void>((resolve, reject) => {
				sound.once("load", () => resolve());
				sound.once("loaderror", () => reject());
			});
		});

		await Promise.all(loadPromises);
	}
}
