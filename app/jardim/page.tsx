"use client";
import { ParticipationFlow } from "../../components/ParticipationFlow";

export default function PublicGarden() {
  return <main><ParticipationFlow startInGarden onClose={() => location.assign("/")} /></main>;
}
