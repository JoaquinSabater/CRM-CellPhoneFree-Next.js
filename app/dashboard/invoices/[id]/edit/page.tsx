import Form from '@/app/ui/invoices/edit-form';
import { fetchClienteById } from '@/app/lib/data';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  const [cliente] = await Promise.all([
    fetchClienteById(id),
  ]);

  console.log('Page - params.id:', params.id); // Depurar el valor de params.id

  return (
    <main>
      <Form cliente={cliente} />
    </main>
  );
}