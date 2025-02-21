// src/workers/timer.worker.ts

type TimerMessage = {
	type: "start" | "pause" | "reset";
};

let startTime: number | null = null;
let pausedElapsedTime = 0;
let isRunning = false;
let animationFrameId: number;

function updateTimer() {
	if (!isRunning || !startTime) return;

	const now = performance.now();
	const totalElapsed = (now - startTime) / 1000 + pausedElapsedTime;
	const workTime = totalElapsed - pausedElapsedTime;

	self.postMessage({
		totalElapsed,
		workTime,
		isRunning,
	});

	animationFrameId = requestAnimationFrame(updateTimer);
}

self.onmessage = (event: MessageEvent<TimerMessage>) => {
	const { type } = event.data;

	switch (type) {
		case "start":
			isRunning = true;
			startTime = performance.now();
			updateTimer();
			break;

		case "pause":
			isRunning = false;
			if (startTime) {
				pausedElapsedTime += (performance.now() - startTime) / 1000;
			}
			startTime = null;
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
			break;

		case "reset":
			isRunning = false;
			startTime = null;
			pausedElapsedTime = 0;
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
			self.postMessage({
				totalElapsed: 0,
				workTime: 0,
				isRunning: false,
			});
			break;
	}
};
