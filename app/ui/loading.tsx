import Image from 'next/image';

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <img
        src="/loading_logo_gradient_1024.gif"
        alt="Cargando..."
        width={512}
        height={512}
        style={{ imageRendering: "auto" }} // asegura suavizado
      />
    </div>
  );
}