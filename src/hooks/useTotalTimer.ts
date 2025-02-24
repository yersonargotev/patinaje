import { useEffect } from "react";
import { useStore } from "../store";

export function useTotalTimer() {
	const { config, setTotalTime } = useStore();

	useEffect(() => {
		if (config.isRunning && !config.isPaused && !config.isFinished) {
			const startTime = performance.now();
			let animationFrameId: number;

			const updateTotalTime = () => {
				const now = performance.now();
				setTotalTime((now - startTime) / 1000);
				animationFrameId = requestAnimationFrame(updateTotalTime);
			};

			animationFrameId = requestAnimationFrame(updateTotalTime);

			return () => {
				if (animationFrameId) {
					cancelAnimationFrame(animationFrameId);
				}
			};
		}
	}, [config.isRunning, config.isPaused, config.isFinished]);
}
