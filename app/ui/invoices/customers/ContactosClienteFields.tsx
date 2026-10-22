import { TIPOS_CONTACTO, type ContactoCliente, type TipoContacto } from '@/app/lib/cliente-contactos';

const iconos: Record<TipoContacto, string> = {
  ventas: '🛍️',
  pagos: '💵',
};

/** Campos de teléfono de ventas y de pagos, compartidos por el alta y la edición de clientes. */
export default function ContactosClienteFields({
  contactos = [],
  inputBase,
}: {
  contactos?: ContactoCliente[];
  inputBase: string;
}) {
  return (
    <>
      <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-8">📞 Contactos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.keys(TIPOS_CONTACTO) as TipoContacto[]).map((tipo) => {
          const contacto = contactos.find((c) => c.tipo === tipo);

          return (
            <div key={tipo} className="p-4 bg-white rounded-lg border space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">
                {iconos[tipo]} {TIPOS_CONTACTO[tipo]}
              </h4>
              <div>
                <label htmlFor={`contacto_${tipo}_telefono`} className="block text-sm font-medium mb-1">Teléfono</label>
                <input
                  id={`contacto_${tipo}_telefono`}
                  name={`contacto_${tipo}_telefono`}
                  type="tel"
                  maxLength={30}
                  defaultValue={contacto?.telefono ?? ''}
                  className={inputBase}
                  placeholder="+54 9 11 1234-5678"
                />
              </div>
              <div>
                <label htmlFor={`contacto_${tipo}_nombre`} className="block text-sm font-medium mb-1">Nombre (opcional)</label>
                <input
                  id={`contacto_${tipo}_nombre`}
                  name={`contacto_${tipo}_nombre`}
                  type="text"
                  maxLength={100}
                  defaultValue={contacto?.nombre ?? ''}
                  className={inputBase}
                  placeholder="¿Con quién hablamos?"
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
