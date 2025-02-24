import { useEffect } from "react";
import { useStore, getServices } from "../store";
import { getPeriodData } from "../utils/testData";

export function useWorkTimer() {
	const {
		config,
		position,
		isRecovery,
		setWorkTime,
		setPosition,
		setAthletes,
		setIsRecovery,
	} = useStore();

	useEffect(() => {
		if (
			config.isRunning &&
			!config.isPaused &&
			!config.isFinished &&
			!isRecovery
		) {
			const { audioService } = getServices();
			const periodData = getPeriodData(position.period);
			if (!periodData) return;

			if (!config.isPaused) {
				setWorkTime(0);
				audioService?.playIntervalBeep();
			}

			const startTime = performance.now();
			let lastBeepTime = 0;
			let animationFrameId: number;

			const updateTimer = () => {
				const now = performance.now();
				const elapsed = (now - startTime) / 1000; // Convert to seconds with millisecond precision
				setWorkTime(elapsed);

				const currentInterval = Math.floor(elapsed / periodData.partialTime);
				const currentSegment = currentInterval % 4;
				const currentLap = Math.floor(currentInterval / 4);

				const shouldBeep =
					currentInterval > Math.floor(lastBeepTime / periodData.partialTime);

				if (shouldBeep && elapsed >= periodData.partialTime) {
					audioService?.playIntervalBeep();
					lastBeepTime = elapsed;

					setAthletes((currentAthletes) =>
						currentAthletes.map((athlete) => {
							if (athlete.active) {
								const newDistance = athlete.totalDistance + 50;
								return {
									...athlete,
									totalDistance: newDistance,
								};
							}
							return athlete;
						}),
					);
				}

				setPosition({
					elapsedTime: elapsed,
					segment: currentSegment,
					lap: currentLap,
					expectedSegment: currentInterval % 16,
				});

				if (elapsed >= periodData.totalTime) {
					cancelAnimationFrame(animationFrameId);

					setAthletes((currentAthletes) =>
						currentAthletes.map((athlete) =>
							athlete.active
								? {
										...athlete,
										completedPeriods: [
											...athlete.completedPeriods,
											position.period,
										],
									}
								: athlete,
						),
					);

					const finishPeriod = async () => {
						await new Promise((resolve) => setTimeout(resolve, 1000));
						await audioService?.announceWorkComplete();
						await new Promise((resolve) => setTimeout(resolve, 1500));
						setIsRecovery(true);
						setWorkTime(0);
						setPosition({
							period: position.period + 1,
							lap: 0,
							segment: 0,
							elapsedTime: 0,
							expectedSegment: 0,
						});
					};

					finishPeriod();
					return;
				}

				animationFrameId = requestAnimationFrame(updateTimer);
			};

			animationFrameId = requestAnimationFrame(updateTimer);

			return () => {
				if (animationFrameId) {
					cancelAnimationFrame(animationFrameId);
				}
			};
		}
	}, [
		config.isRunning,
		config.isPaused,
		config.isFinished,
		isRecovery,
		position.period,
	]);
}
