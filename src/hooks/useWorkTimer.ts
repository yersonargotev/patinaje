import { useEffect, useRef } from "react";
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

	// Referencia para almacenar los tiempos exactos de cada segmento
	const segmentStartTimeRef = useRef<number | null>(null);
	const lastIntervalRef = useRef<number>(-1);
	const intervalTimingRef = useRef<number[]>([]);

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

			// Reiniciar los temporizadores y referencias
			setWorkTime(0);
			segmentStartTimeRef.current = performance.now();
			lastIntervalRef.current = -1;
			intervalTimingRef.current = [];

			if (!config.isPaused) {
				audioService?.playIntervalBeep();
			}

			const startTime = performance.now();
			let animationFrameId: number;

			const updateTimer = () => {
				const now = performance.now();
				const elapsed = (now - startTime) / 1000; // Tiempo transcurrido total en segundos
				setWorkTime(elapsed);

				// Cálculo teórico del intervalo actual basado en el tiempo transcurrido
				const theoreticalInterval = Math.floor(
					elapsed / periodData.partialTime,
				);

				// Si cambiamos de intervalo
				if (theoreticalInterval > lastIntervalRef.current) {
					const actualSegmentTime = now - (segmentStartTimeRef.current || now);

					// Guardar el tiempo real del segmento completado (en segundos)
					if (segmentStartTimeRef.current !== null) {
						const segmentTimeInSeconds = actualSegmentTime / 1000;
						intervalTimingRef.current.push(segmentTimeInSeconds);

						// Para debugging: console.log(`Segmento ${lastIntervalRef.current + 1} completado en: ${segmentTimeInSeconds.toFixed(2)}s (esperado: ${periodData.partialTime.toFixed(2)}s)`);
					}

					// Actualizar para el nuevo segmento
					segmentStartTimeRef.current = now;
					lastIntervalRef.current = theoreticalInterval;

					// Reproducir beep y actualizar distancia
					audioService?.playIntervalBeep();

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

				// Actualizar la posición en el track
				const currentSegment = theoreticalInterval % 4;
				const currentLap = Math.floor(theoreticalInterval / 4);

				setPosition({
					elapsedTime: elapsed,
					segment: currentSegment,
					lap: currentLap,
					expectedSegment: theoreticalInterval % 16,
				});

				// Verificar si se ha completado el periodo
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
