// src/services/TimerService.ts

interface TimerData {
	totalElapsed: number;
	workTime: number;
	isRunning: boolean;
}

export class TimerService {
	private worker: Worker;
	private updateCallback: ((data: TimerData) => void) | null = null;

	constructor() {
		this.worker = new Worker(
			new URL("../workers/timer.worker.ts", import.meta.url),
			{
				type: "module",
			},
		);

		this.worker.onmessage = (event) => {
			if (this.updateCallback) {
				this.updateCallback(event.data);
			}
		};
	}

	start() {
		this.worker.postMessage({ type: "start" });
	}

	pause() {
		this.worker.postMessage({ type: "pause" });
	}

	reset() {
		this.worker.postMessage({ type: "reset" });
	}

	onTimerUpdate(callback: (data: TimerData) => void) {
		this.updateCallback = callback;
	}

	cleanup() {
		this.worker.terminate();
	}
}
