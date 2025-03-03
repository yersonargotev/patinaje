import { useEffect } from "react";
import { toast } from "sonner";
import { useStore, getServices } from "../store";

export function useRecoveryTimer() {
	const {
		config,
		position,
		isRecovery,
		setIsRecovery,
		setCurrentRecoveryTime,
		setWorkTime,
	} = useStore();

	useEffect(() => {
		if (!isRecovery || !config.isRunning || config.isPaused) return;

		const { audioService } = getServices();
		let animationFrameId: number;
		const startTime = Date.now();
		const endTime = startTime + config.recoveryTime * 1000;
		let lastUpdateTime = Math.floor(config.recoveryTime);
		let hasPlayedCountdown = false;

		const startRecovery = async () => {
			// Reiniciar el tiempo de recuperación
			setCurrentRecoveryTime(config.recoveryTime);

			// Esperar un segundo antes de anunciar
			await new Promise((resolve) => setTimeout(resolve, 1000));
			await audioService?.announceRecoveryStart();

			const updateRecoveryTime = () => {
				const now = Date.now();
				const remaining = Math.ceil((endTime - now) / 1000);

				// Actualizar solo cuando cambia el segundo
				if (remaining !== lastUpdateTime) {
					lastUpdateTime = remaining;
					setCurrentRecoveryTime(remaining);

					// Anuncios de tiempo
					if (remaining === 10 && !hasPlayedCountdown) {
						hasPlayedCountdown = true;
						audioService?.playCountdownRecovery();
					}
				}

				if (remaining <= 0) {
					// Fin de la recuperación
					finishRecovery();
					return;
				}

				animationFrameId = requestAnimationFrame(updateRecoveryTime);
			};

			animationFrameId = requestAnimationFrame(updateRecoveryTime);
		};

		const finishRecovery = async () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}

			try {
				// Transición al siguiente periodo
				setIsRecovery(false);
				setCurrentRecoveryTime(config.recoveryTime);
				setWorkTime(0);

				// Anunciar fin de recuperación
				await audioService?.announceRecoveryComplete();
				await new Promise((resolve) => setTimeout(resolve, 2000));

				// Anunciar inicio del siguiente periodo
				await audioService?.announceWorkStartPeriod(position.period);
			} catch (error) {
				console.error("Error en la transición de recuperación:", error);
				toast.error("Error al finalizar el periodo de recuperación");
			}
		};

		startRecovery();

		return () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	}, [
		isRecovery,
		config.isRunning,
		config.isPaused,
		config.recoveryTime,
		position.period,
	]);
}
