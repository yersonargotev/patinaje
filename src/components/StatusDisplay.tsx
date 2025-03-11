import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { getPeriodData } from "../utils/testData";
import { formatTime } from "../utils/timing";

interface StatusDisplayProps {
	period: number;
	recoveryTime: number;
	activeAthletes: number;
	totalDistance: number;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({
	period,
	recoveryTime,
	activeAthletes,
	totalDistance,
}) => {
	const { isRecovery } = useStore();
	const periodData = getPeriodData(period);

	// Track the previous recovery state to detect transitions
	const prevIsRecoveryRef = useRef(isRecovery);
	// Use state instead of ref for more reliable rendering control
	const [isStartingNewPeriod, setIsStartingNewPeriod] = useState(false);
	// Store previous total distance to detect real movement
	const prevTotalDistanceRef = useRef(totalDistance);

	// Detect transitions between recovery and normal periods
	useEffect(() => {
		// Transition from recovery to normal period
		if (prevIsRecoveryRef.current && !isRecovery) {
			// When recovery ends, set flag to show we're starting a new period
			setIsStartingNewPeriod(true);
		}
		prevIsRecoveryRef.current = isRecovery;
	}, [isRecovery]);

	// Detect when athlete actually starts moving in the new period
	useEffect(() => {
		// If we've moved at least 50m since the last measurement and we're in "starting new period" mode
		if (isStartingNewPeriod && totalDistance > prevTotalDistanceRef.current) {
			// Athlete has started moving in the new period, exit the special state
			setIsStartingNewPeriod(false);
		}
		prevTotalDistanceRef.current = totalDistance;
	}, [totalDistance, isStartingNewPeriod]);

	let distanceInPeriod = totalDistance % 800;
	let currentLap = 1;

	if (isRecovery) {
		// During recovery time, always show 800m and lap 4
		distanceInPeriod = 800;
		currentLap = 4;
	} else if (isStartingNewPeriod) {
		// Special case: Just started a new period after recovery
		// Show lap 1 and distance 0m until athlete starts moving
		distanceInPeriod = 0;
		currentLap = 1;
	} else if (distanceInPeriod === 0 && totalDistance > 0) {
		// Special case: Completed a full 800m (transition to recovery)
		// Show lap 4 and distance 800m
		distanceInPeriod = 800;
		currentLap = 4;
	} else {
		// Normal lap calculation during a period
		if (distanceInPeriod >= 200 && distanceInPeriod < 400) {
			currentLap = 2;
		} else if (distanceInPeriod >= 400 && distanceInPeriod < 600) {
			currentLap = 3;
		} else if (distanceInPeriod >= 600 && distanceInPeriod < 800) {
			currentLap = 4;
		}
	}

	return (
		<div className="grid grid-cols-4 gap-4 mb-4">
			<div className="bg-white p-4 rounded-lg shadow-md">
				<h3 className="text-sm font-medium text-gray-500">Periodo</h3>
				<p className="text-2xl font-bold">{period}</p>
				<p className="text-sm text-gray-600">
					Velocidad: {periodData?.speed} km/h
				</p>
			</div>

			<div className="bg-white p-4 rounded-lg shadow-md">
				<h3 className="text-sm font-medium text-gray-500">Distancia Total</h3>
				<p className="text-2xl font-bold">{totalDistance}m</p>
				<p className="text-sm text-gray-600">
					Distancia: {distanceInPeriod}m
				</p>
				<p className="text-sm text-gray-600">Vuelta: {currentLap}</p>
			</div>

			<div className="bg-white p-4 rounded-lg shadow-md">
				<h3 className="text-sm font-medium text-gray-500">Recuperación</h3>
				<p className="text-2xl font-bold">{formatTime(recoveryTime)}</p>
			</div>

			<div className="bg-white p-4 rounded-lg shadow-md">
				<h3 className="text-sm font-medium text-gray-500">
					Deportistas Activos
				</h3>
				<p className="text-2xl font-bold">{activeAthletes}</p>
			</div>
		</div>
	);
};
