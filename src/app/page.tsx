import { Suspense } from "react";
import BudgetApp from "@/components/BudgetApp";

export default function Home() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <BudgetApp />
    </Suspense>
  );
}
