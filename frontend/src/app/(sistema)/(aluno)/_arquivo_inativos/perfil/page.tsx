"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function PerfilPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para configurações já que unificamos o perfil lá
    router.replace("/configuracoes");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      <p className="text-slate-500 font-medium">Estamos movendo você para as Configurações...</p>
    </div>
  );
}
