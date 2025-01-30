import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { formatTime } from "../utils/timing";

interface EvaluationRecord {
	id: number;
	athlete_id: number;
	completed_periods: string;
	total_time: number;
	date: string;
	status: string;
}

export const EvaluationHistory = ({ athleteId }: { athleteId: number }) => {
	const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadEvaluations = async () => {
			try {
				const records = await invoke<EvaluationRecord[]>(
					"get_athlete_evaluations",
					{
						athleteId,
					},
				);
				setEvaluations(records);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Error loading evaluations",
				);
			} finally {
				setLoading(false);
			}
		};

		if (athleteId) {
			loadEvaluations();
		}
	}, [athleteId]);

	if (loading) {
		return (
			<div className="flex justify-center items-center p-4">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-red-600 p-4 rounded-lg bg-red-50">
				Error: {error}
			</div>
		);
	}

	if (!evaluations.length) {
		return (
			<div className="text-gray-500 text-center p-4">
				No hay evaluaciones registradas para este atleta.
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full bg-white">
				<thead>
					<tr className="bg-gray-50">
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Fecha
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Periodos Completados
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Tiempo Total
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Estado
						</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-gray-200">
					{evaluations.map((evaluation) => {
						const completedPeriods = JSON.parse(evaluation.completed_periods);
						const date = new Date(evaluation.date);

						return (
							<tr key={evaluation.id} className="hover:bg-gray-50">
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{date.toLocaleDateString()} {date.toLocaleTimeString()}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{completedPeriods.length}
									<span className="text-xs ml-2 text-gray-400">
										({completedPeriods.join(", ")})
									</span>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatTime(evaluation.total_time)}
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<span
										className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
											evaluation.status === "completed"
												? "bg-green-100 text-green-800"
												: "bg-yellow-100 text-yellow-800"
										}`}
									>
										{evaluation.status === "completed"
											? "Completado"
											: "Cancelado"}
									</span>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
};
