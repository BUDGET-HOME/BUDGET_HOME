import { Suspense } from "react";
import EntrepriseApp from "@/components/entreprise/EntrepriseApp";

export default function EntreprisePage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <EntrepriseApp />
    </Suspense>
  );
}
