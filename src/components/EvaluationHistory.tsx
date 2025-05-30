import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import type { Athlete } from "../types";
import { EditObservationsModal } from "./EditObservationsModal";
import { Pencil } from "lucide-react";

interface RawEvaluation {
	id: number;
	athlete_id: number;
	template_id: number;
	status: string;
	date: string;
}

interface EvaluationTemplate {
	id: number;
	completed_periods: string;
	total_time: number;
	date: string;
	total_distance: number;
}

interface TransformedEvaluation extends Omit<RawEvaluation, "template_id"> {
	completed_periods: number[];
	total_time: number;
	date: string;
	total_distance: number;
	athlete: Athlete;
}

export function EvaluationHistory() {
	const [evaluations, setEvaluations] = useState<TransformedEvaluation[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedEvaluation, setSelectedEvaluation] =
		useState<TransformedEvaluation | null>(null);

	const transformCallback = useCallback(
		([evaluation, template, athlete]: [
			RawEvaluation,
			EvaluationTemplate,
			Athlete,
		]): TransformedEvaluation => {
			return {
				...evaluation,
				completed_periods: JSON.parse(template.completed_periods),
				total_time: template.total_time,
				date: new Date(evaluation.date).toLocaleDateString(),
				total_distance: template.total_distance,
				athlete,
			};
		},
		[],
	);

	const fetchEvaluations = useCallback(async () => {
		try {
			setLoading(true);
			console.log("Fetching all evaluations");
			const data = await invoke<[RawEvaluation, EvaluationTemplate, Athlete][]>(
				"get_all_evaluations",
			);
			console.log("Raw evaluations received:", data);
			const transformedData = data.map(transformCallback);
			console.log("Transformed evaluations:", transformedData);
			setEvaluations(transformedData);
		} catch (error) {
			console.error("Error fetching evaluations:", error);
			toast.error("Error al cargar las evaluaciones");
		} finally {
			setLoading(false);
		}
	}, [transformCallback]);

	useEffect(() => {
		fetchEvaluations();
	}, [fetchEvaluations]);

	useEffect(() => {
		const unlisten = listen("evaluation-completed", () => {
			fetchEvaluations();
		});

		return () => {
			unlisten.then((unlistenFn) => unlistenFn());
		};
	}, [fetchEvaluations]);

	if (loading) {
		return (
			<div className="flex items-center justify-center p-4">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold">Historial de Evaluaciones</h3>
			{!evaluations.length ? (
				<div className="text-center p-4 text-gray-500">
					No hay evaluaciones registradas
				</div>
			) : (
				<div className="grid gap-4">
					{evaluations.map((evaluation) => (
						<div
							key={evaluation.id}
							className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
						>
							<div className="border-b pb-4 mb-4">
								<div className="flex justify-between items-start mb-2">
									<h4 className="text-lg font-semibold">
										Información del Atleta
									</h4>
									<button
										type="button"
										onClick={() => setSelectedEvaluation(evaluation)}
										className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
										title="Editar observaciones"
									>
										<Pencil className="w-4 h-4" />
									</button>
								</div>
								<div className="grid grid-cols-4 gap-4 text-sm">
									<div>
										<span className="text-gray-500">Nombre:</span>
										<p className="font-medium">{evaluation.athlete.name}</p>
									</div>
									<div>
										<span className="text-gray-500">Edad:</span>
										<p className="font-medium">{evaluation.athlete.age} años</p>
									</div>
									<div>
										<span className="text-gray-500">Peso:</span>
										<p className="font-medium">
											{evaluation.athlete.weight} kg
										</p>
									</div>
									<div>
										<span className="text-gray-500">Altura:</span>
										<p className="font-medium">
											{evaluation.athlete.height} cm
										</p>
									</div>
								</div>
								{evaluation.athlete.observations && (
									<div className="mt-2">
										<span className="text-gray-500">Observaciones:</span>
										<p className="font-medium">
											{evaluation.athlete.observations}
										</p>
									</div>
								)}
							</div>
							<div className="flex justify-between items-start mb-2">
								<div>
									<span className="text-sm text-gray-500">
										{evaluation.date}
									</span>
									<span className="ml-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
										{evaluation.status}
									</span>
								</div>
								<div className="text-right">
									<span className="text-sm font-medium block">
										Tiempo total: {Math.floor(evaluation.total_time / 60)}:
										{(evaluation.total_time % 60).toString().padStart(2, "0")}
									</span>
									<span className="text-sm font-medium block">
										Distancia total: {evaluation.total_distance} m
									</span>
								</div>
							</div>
							<div className="mt-2">
								<h4 className="text-sm font-medium mb-1">
									Periodos completados:
								</h4>
								<div className="flex flex-wrap gap-2">
									{evaluation.completed_periods.map((period: number) => (
										<span
											key={`${evaluation.id}-period-${period}`}
											className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
										>
											Periodo {period}
										</span>
									))}
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			<EditObservationsModal
				show={selectedEvaluation !== null}
				onClose={() => setSelectedEvaluation(null)}
				evaluationId={selectedEvaluation?.id || 0}
				initialObservations={selectedEvaluation?.athlete.observations || ""}
				onSuccess={fetchEvaluations}
			/>
		</div>
	);
}
