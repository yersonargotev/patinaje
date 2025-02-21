import { formatTime } from "../utils/timing";
import { getPeriodData } from "../utils/testData";

interface StatusDisplayProps {
	period: number;
	segment: number;
	recoveryTime: number;
	activeAthletes: number;
	totalDistance: number;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({
	period,
	segment,
	recoveryTime,
	activeAthletes,
	totalDistance,
}) => {
	const periodData = getPeriodData(period);

	const segmentDistance = segment * 50;

	const currentLap = Math.floor((totalDistance % 800) / 200);

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
					Segmento actual: {segmentDistance}m
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
