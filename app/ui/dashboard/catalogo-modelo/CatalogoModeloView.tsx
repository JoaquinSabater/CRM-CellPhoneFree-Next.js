'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getCloudinaryImageUrl } from '@/app/lib/cloudinary';

type Marca = {
  id: number;
  nombre: string;
};

type Modelo = {
  modelo: string;
};

type ProductoCatalogo = {
  codigo_interno: string;
  item_id: number;
  item: string;
  modelo: string;
  marca_nombre: string;
  stock_real: number;
  foto1_url: string | null;
  foto_portada: string | null;
};

export default function CatalogoModeloView({
  initialMarcaId,
  initialModelo,
}: {
  initialMarcaId: string;
  initialModelo: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const marcaQuery = searchParams.get('marca') ?? initialMarcaId;
  const modeloQuery = searchParams.get('modelo') ?? initialModelo;

  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [selectedMarcaId, setSelectedMarcaId] = useState(marcaQuery);
  const [selectedModelo, setSelectedModelo] = useState(modeloQuery);
  const [loadingMarcas, setLoadingMarcas] = useState(true);
  const [loadingModelos, setLoadingModelos] = useState(false);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [error, setError] = useState('');
  const [pageLoaded, setPageLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setSelectedMarcaId(marcaQuery);
    setSelectedModelo(modeloQuery);
  }, [marcaQuery, modeloQuery]);

  useEffect(() => {
    let active = true;

    async function loadMarcas() {
      setLoadingMarcas(true);
      try {
        const response = await fetch('/api/catalogo-modelo/marcas');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error ?? 'No se pudieron cargar las marcas');
        }

        if (active) {
          setMarcas(Array.isArray(data) ? data : []);
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'No se pudieron cargar las marcas');
        }
      } finally {
        if (active) {
          setLoadingMarcas(false);
          setPageLoaded(true);
        }
      }
    }

    loadMarcas();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedMarcaId) {
      setModelos([]);
      return;
    }

    let active = true;

    async function loadModelos() {
      setLoadingModelos(true);
      setError('');

      try {
        const response = await fetch(`/api/catalogo-modelo/modelos?marcaId=${selectedMarcaId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error ?? 'No se pudieron cargar los modelos');
        }

        if (active) {
          const modelosCargados = Array.isArray(data) ? data : [];
          setModelos(modelosCargados);

          if (selectedModelo && !modelosCargados.some((modelo) => modelo.modelo === selectedModelo)) {
            setSelectedModelo('');
          }
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'No se pudieron cargar los modelos');
          setModelos([]);
        }
      } finally {
        if (active) {
          setLoadingModelos(false);
        }
      }
    }

    loadModelos();

    return () => {
      active = false;
    };
  }, [selectedMarcaId]);

  useEffect(() => {
    if (!marcaQuery || !modeloQuery) {
      setProductos([]);
      return;
    }

    let active = true;

    async function loadProductos() {
      setLoadingProductos(true);
      setError('');

      try {
        const response = await fetch(
          `/api/catalogo-modelo/productos?marcaId=${encodeURIComponent(marcaQuery)}&modelo=${encodeURIComponent(modeloQuery)}`,
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error ?? 'No se pudieron cargar los productos');
        }

        if (active) {
          setProductos(Array.isArray(data) ? data : []);
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'No se pudieron cargar los productos');
          setProductos([]);
        }
      } finally {
        if (active) {
          setLoadingProductos(false);
        }
      }
    }

    loadProductos();

    return () => {
      active = false;
    };
  }, [marcaQuery, modeloQuery]);

  const marcaSeleccionada = useMemo(
    () => marcas.find((marca) => String(marca.id) === selectedMarcaId),
    [marcas, selectedMarcaId],
  );

  function handleMarcaChange(value: string) {
    setSelectedMarcaId(value);
    setSelectedModelo('');
    setProductos([]);
    setError('');
  }

  function handleApply() {
    if (!selectedMarcaId) {
      setError('Seleccioná una marca.');
      return;
    }

    if (!selectedModelo.trim()) {
      setError('Seleccioná un modelo.');
      return;
    }

    const params = new URLSearchParams();
    params.set('marca', selectedMarcaId);
    params.set('modelo', selectedModelo.trim());
    router.push(`${pathname}?${params.toString()}`);
  }

  const totalProductos = productos.length;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
              Catálogo visual
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-gray-900 md:text-3xl">
              Fotos por modelo
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600 md:text-base">
              Elegí una marca y un modelo para ver todos los ítems con stock real disponible y compartir la captura con el cliente.
            </p>
          </div>

          <div className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-orange-900">
            <div className="font-semibold">Vista lista para captura</div>
            <div>{totalProductos > 0 ? `${totalProductos} productos encontrados` : 'Sin resultados todavía'}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_1.1fr_auto]">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Marca</span>
            <select
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              value={selectedMarcaId}
              onChange={(event) => handleMarcaChange(event.target.value)}
              disabled={isMounted && loadingMarcas}
            >
              <option value="">Seleccionar marca</option>
              {marcas.map((marca) => (
                <option key={marca.id} value={marca.id}>
                  {marca.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Modelo</span>
            <select
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100"
              value={selectedModelo}
              onChange={(event) => setSelectedModelo(event.target.value)}
              disabled={isMounted && (!selectedMarcaId || loadingModelos)}
            >
              <option value="">Seleccionar modelo</option>
              {modelos.map((modelo) => (
                <option key={modelo.modelo} value={modelo.modelo}>
                  {modelo.modelo}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleApply}
              className="w-full rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300 lg:w-auto"
              disabled={isMounted && (loadingMarcas || loadingModelos)}
            >
              Aplicar
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {pageLoaded && selectedMarcaId && selectedModelo ? (
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
            {marcaSeleccionada ? (
              <span className="rounded-full bg-gray-100 px-3 py-1">
                Marca: {marcaSeleccionada.nombre}
              </span>
            ) : null}
            <span className="rounded-full bg-gray-100 px-3 py-1">
              Modelo: {selectedModelo}
            </span>
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Resultados</h2>
            <p className="text-sm text-gray-500">Mostrando solo ítems con stock real mayor a 0.</p>
          </div>
          <div className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
            {loadingProductos ? 'Cargando productos...' : `${totalProductos} visibles`}
          </div>
        </div>

        {!marcaQuery || !modeloQuery ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 py-14 text-center text-gray-500">
            Seleccioná una marca y un modelo, y luego aplicá el filtro para ver el catálogo visual.
          </div>
        ) : loadingProductos ? (
          <div className="grid gap-3.5 sm:gap-4 [grid-template-columns:repeat(auto-fill,minmax(190px,1fr))]">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="aspect-[4/5] rounded-xl bg-gray-200" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-3.5 w-1/2 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : totalProductos === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 py-14 text-center text-gray-500">
            No se encontraron productos con stock para esa combinación.
          </div>
        ) : (
          <div className="grid gap-3.5 sm:gap-4 [grid-template-columns:repeat(auto-fill,minmax(190px,1fr))]">
            {productos.map((producto) => {
              const imagen =
                getCloudinaryImageUrl(producto.foto1_url) ||
                getCloudinaryImageUrl(producto.foto_portada);

              return (
                <article
                  key={`${producto.item_id}-${producto.codigo_interno}`}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="relative bg-gray-100">
                    {imagen ? (
                      <img
                        src={imagen}
                        alt={`${producto.item} - ${producto.modelo}`}
                        className="aspect-[4/5] w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-orange-100 via-white to-gray-100 px-4 text-center text-xs font-medium text-gray-500">
                        Sin imagen principal disponible
                      </div>
                    )}

                    <div className="absolute left-2 top-2 rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Stock {producto.stock_real}
                    </div>
                  </div>

                  <div className="space-y-2.5 p-3.5">
                    <div>
                      <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-gray-900">
                        {producto.item}
                      </h3>
                      <p className="mt-0.5 text-[12px] leading-tight text-gray-500">
                        {producto.marca_nombre} · {producto.modelo}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}