import bcrypt from 'bcryptjs';
import postgres from 'postgres';
import { provincias, localidades, vendedores, usuarios, clientes, pedidos } from '../lib/placeholder-data';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function seedProvincias() {
  await sql`
    CREATE TABLE IF NOT EXISTS provincia (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100),
      codigo31662 VARCHAR(10),
      realizar_percepcion BOOLEAN,
      tipo_percepcion VARCHAR(50),
      tasa_percepcion DECIMAL(5,2)
    );
  `;

  const insertedProvincias = await Promise.all(
    provincias.map((provincia) => sql`
      INSERT INTO provincia (nombre, codigo31662, realizar_percepcion, tipo_percepcion, tasa_percepcion)
      VALUES (${provincia.nombre}, ${provincia.codigo31662}, ${provincia.realizar_percepcion}, ${provincia.tipo_percepcion}, ${provincia.tasa_percepcion})
      ON CONFLICT (id) DO NOTHING;
    `),
  );

  return insertedProvincias;
}

async function seedLocalidades() {
  await sql`
    CREATE TABLE IF NOT EXISTS localidad (
      id SERIAL PRIMARY KEY,
      provincia_id INT,
      nombre VARCHAR(100),
      codigopostal VARCHAR(10),
      FOREIGN KEY (provincia_id) REFERENCES provincia(id)
    );
  `;

  const insertedLocalidades = await Promise.all(
    localidades.map((localidad) => sql`
      INSERT INTO localidad (provincia_id, nombre, codigopostal)
      VALUES (${localidad.provincia_id}, ${localidad.nombre}, ${localidad.codigopostal})
      ON CONFLICT (id) DO NOTHING;
    `),
  );

  return insertedLocalidades;
}

async function seedVendedores() {
  await sql`
    CREATE TABLE IF NOT EXISTS vendedores (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100),
      cuil VARCHAR(20),
      telefono VARCHAR(20),
      domicilio VARCHAR(150),
      fecha_inicio DATE,
      excluir_informes BOOLEAN,
      url_imagen TEXT,
      contraseña TEXT
    );
  `;

  const insertedVendedores = await Promise.all(
    vendedores.map(async (vendedor) => {
      const hashedPassword = await bcrypt.hash(vendedor.contraseña, 10);
      return sql`
        INSERT INTO vendedores (nombre, cuil, telefono, domicilio, fecha_inicio, excluir_informes, url_imagen, contraseña)
        VALUES (${vendedor.nombre}, ${vendedor.cuil}, ${vendedor.telefono}, ${vendedor.domicilio}, ${vendedor.fecha_inicio}, ${vendedor.excluir_informes}, ${vendedor.url_imagen}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  return insertedVendedores;
}

async function seedUsuarios() {
  await sql`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50),
      password TEXT,
      email VARCHAR(100),
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      vendedor_id INT,
      FOREIGN KEY (vendedor_id) REFERENCES vendedores(id)
    );
  `;

  const insertedUsuarios = await Promise.all(
    usuarios.map(async (usuario) => {
      const hashedPassword = await bcrypt.hash(usuario.password, 10);
      return sql`
        INSERT INTO usuarios (username, password, email, created_at, updated_at, vendedor_id)
        VALUES (${usuario.username}, ${hashedPassword}, ${usuario.email}, ${usuario.created_at}, ${usuario.updated_at}, ${usuario.vendedor_id})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  return insertedUsuarios;
}

async function seedClientes() {
  await sql`
    CREATE TABLE IF NOT EXISTS clientes (
      id SERIAL PRIMARY KEY,
      razon_social VARCHAR(100),
      email VARCHAR(100),
      nombre VARCHAR(100),
      apellido VARCHAR(100),
      contacto VARCHAR(100),
      telefono VARCHAR(20),
      domicilio VARCHAR(150),
      cuit_dni VARCHAR(20),
      vendedor_id INT,
      localidad_id INT,
      condicion_iva_id INT,
      condicion_iibb_id INT,
      observaciones TEXT,
      facebook VARCHAR(100),
      instagram VARCHAR(100),
      fecha_creacion DATE,
      modalidad_de_pago VARCHAR(100),
      contactar BOOLEAN,
      tipo_de_cliente VARCHAR(50),
      cumpleaños DATE,
      cantidad_de_dias INT,
      cuenta_corriente BOOLEAN,
      monto DECIMAL(10,2),
      moroso BOOLEAN,
      FOREIGN KEY (vendedor_id) REFERENCES vendedores(id),
      FOREIGN KEY (localidad_id) REFERENCES localidad(id)
    );
  `;

  const insertedClientes = await Promise.all(
    clientes.map((cliente) => sql`
      INSERT INTO clientes (razon_social, email, nombre, apellido, contacto, telefono, domicilio, cuit_dni, vendedor_id, localidad_id, condicion_iva_id, condicion_iibb_id, observaciones, facebook, instagram, fecha_creacion, modalidad_de_pago, contactar, tipo_de_cliente, cumpleaños, cantidad_de_dias, cuenta_corriente, monto, moroso)
      VALUES (${cliente.razon_social}, ${cliente.email}, ${cliente.nombre}, ${cliente.apellido}, ${cliente.contacto}, ${cliente.telefono}, ${cliente.domicilio}, ${cliente.cuit_dni}, ${cliente.vendedor_id}, ${cliente.localidad_id}, ${cliente.condicion_iva_id}, ${cliente.condicion_iibb_id}, ${cliente.observaciones}, ${cliente.facebook}, ${cliente.instagram}, ${cliente.fecha_creacion}, ${cliente.modalidad_de_pago}, ${cliente.contactar}, ${cliente.tipo_de_cliente}, ${cliente.cumpleaños}, ${cliente.cantidad_de_dias}, ${cliente.cuenta_corriente}, ${cliente.monto}, ${cliente.moroso})
      ON CONFLICT (id) DO NOTHING;
    `),
  );

  return insertedClientes;
}

async function seedPedidos() {
  await sql`
    CREATE TABLE IF NOT EXISTS pedidos (
      id SERIAL PRIMARY KEY,
      vendedor_id INT,
      cliente_id INT,
      fecha_creacion TIMESTAMP,
      estado VARCHAR(50),
      hora_inicio_armado TIME,
      hora_fin_armado TIME,
      armador_id INT,
      hora_inicio_control TIME,
      hora_fin_control TIME,
      controlador_id INT,
      remito VARCHAR(50),
      consolidado_id INT,
      FOREIGN KEY (vendedor_id) REFERENCES vendedores(id),
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    );
  `;

  const insertedPedidos = await Promise.all(
    pedidos.map((pedido) => sql`
      INSERT INTO pedidos (vendedor_id, cliente_id, fecha_creacion, estado, hora_inicio_armado, hora_fin_armado, armador_id, hora_inicio_control, hora_fin_control, controlador_id, remito, consolidado_id)
      VALUES (${pedido.vendedor_id}, ${pedido.cliente_id}, ${pedido.fecha_creacion}, ${pedido.estado}, ${pedido.hora_inicio_armado}, ${pedido.hora_fin_armado}, ${pedido.armador_id}, ${pedido.hora_inicio_control}, ${pedido.hora_fin_control}, ${pedido.controlador_id}, ${pedido.remito}, ${pedido.consolidado_id})
      ON CONFLICT (id) DO NOTHING;
    `),
  );

  return insertedPedidos;
}

export async function GET() {
  try {
    const result = await sql.begin((sql) => [
      seedProvincias(),
      seedLocalidades(),
      seedVendedores(),
      seedUsuarios(),
      seedClientes(),
      seedPedidos(),
    ]);

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}