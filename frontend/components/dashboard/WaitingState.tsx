export function WaitingState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="text-6xl">✓</div>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-bicicleta-text mb-2">
            Diagnóstico enviado
          </h2>
          <p className="text-bicicleta-text-muted text-lg mb-4">
            Completaste tu cuestionario de onboarding.
          </p>
          <p className="text-bicicleta-text-muted">
            Manu está revisando tus respuestas y va a coordinar tu primera sesión con vos.
          </p>
        </div>
        <div className="bg-bicicleta-accent/10 border-2 border-bicicleta-accent/30 rounded-lg p-4">
          <p className="text-bicicleta-text-muted">
            Mientras tanto, podés cerrar esta ventana.
          </p>
          <p className="text-bicicleta-accent font-semibold">
            Te vamos a avisar cuando tu reporte esté listo.
          </p>
        </div>
      </div>
    </div>
  )
}
