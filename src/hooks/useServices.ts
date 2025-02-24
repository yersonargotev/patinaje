import { useEffect, useRef } from "react";
import { getServices } from "../store";
import type { AudioService } from "../utils/audio";
import type { TimerService } from "../services/TimerService";

export function useServices() {
	const { audioService, timerService } = getServices();
	const audioRef = useRef<AudioService>(audioService);
	const timerRef = useRef<TimerService | null>(timerService);

	useEffect(() => {
		return () => {
			if (timerRef.current) {
				timerRef.current.cleanup();
			}
		};
	}, []);

	return { audioService: audioRef, timerService: timerRef };
}
