export const calculateIntervalTime = (period: number): number => {
	if (period <= 1) return 9.0;

	// Starting from period 2 with 8.65s
	const baseInterval = 8.65;
	const reduction = 0.32; // Average reduction per period
	return baseInterval - (period - 2) * reduction;
};

export const formatTime = (seconds: number): string => {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
};
