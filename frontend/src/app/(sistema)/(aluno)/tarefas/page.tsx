"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// A funcionalidade de tarefas foi integrada à aba Semana (Backlog)
export default function TarefasRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/semana");
  }, [router]);

  return null;
}
