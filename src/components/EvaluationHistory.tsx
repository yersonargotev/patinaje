import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Evaluation {
	id: number;
	athlete_id: number;
	completed_periods: string;
	total_time: number;
	date: string;
	status: string;
}

interface EvaluationHistoryProps {
	athleteId: number;
}

export function EvaluationHistory({ athleteId }: EvaluationHistoryProps) {
	const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchEvaluations = async () => {
			try {
				setLoading(true);
				const data = await invoke<Evaluation[]>("get_athlete_evaluations", {
					athleteId,
				});
				setEvaluations(data);
			} catch (error) {
				console.error("Error fetching evaluations:", error);
				toast.error("Error al cargar las evaluaciones");
			} finally {
				setLoading(false);
			}
		};

		if (athleteId) {
			fetchEvaluations();
		}
	}, [athleteId]);

	if (loading) {
		return (
			<div className="flex items-center justify-center p-4">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
			</div>
		);
	}

	if (!evaluations.length) {
		return (
			<div className="text-center p-4 text-gray-500">
				No hay evaluaciones registradas
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold mb-4">Historial de Evaluaciones</h3>
			<div className="grid gap-4">
				{evaluations.map((evaluation) => (
					<div
						key={evaluation.id}
						className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
					>
						<div className="flex justify-between items-start mb-2">
							<div>
								<span className="text-sm text-gray-500">
									{new Date(evaluation.date).toLocaleDateString()}
								</span>
								<span className="ml-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
									{evaluation.status}
								</span>
							</div>
							<span className="text-sm font-medium">
								Tiempo total: {Math.floor(evaluation.total_time / 60)}:
								{(evaluation.total_time % 60).toString().padStart(2, "0")}
							</span>
						</div>
						<div className="mt-2">
							<h4 className="text-sm font-medium mb-1">
								Periodos completados:
							</h4>
							<div className="flex flex-wrap gap-2">
								{JSON.parse(evaluation.completed_periods).map(
									(period: number) => (
										<span
											key={`${evaluation.id}-period-${period}`}
											className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
										>
											Periodo {period}
										</span>
									),
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
