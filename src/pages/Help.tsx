import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Help() {
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-2">Centro de ayuda</h1>
      <p className="text-muted-foreground mb-6">Encuentra respuestas a preguntas frecuentes o contáctanos.</p>
      <Card>
        <CardHeader>
          <CardTitle>Preguntas frecuentes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            <li>
              <strong>¿Cómo creo un proyecto?</strong><br />
              Ve al dashboard y haz clic en "Crear proyecto".
            </li>
            <li>
              <strong>¿Cómo invito a un miembro?</strong><br />
              Solo los administradores pueden invitar miembros desde la sección "Equipo".
            </li>
            <li>
              <strong>¿Cómo cambio mi contraseña?</strong><br />
              Ve a "Configuración" y actualiza tu contraseña.
            </li>
            <li>
              <strong>¿No encuentras lo que buscas?</strong><br />
              Contáctanos usando el formulario abajo.
            </li>
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Tu email</label>
              <input className="border rounded px-2 py-1 w-full" type="email" placeholder="tu@email.com" />
            </div>
            <div>
              <label className="block text-sm mb-1">Mensaje</label>
              <textarea className="border rounded px-2 py-1 w-full" rows={3} placeholder="¿En qué podemos ayudarte?" />
            </div>
            <button className="bg-primary text-white px-4 py-2 rounded" type="submit">Enviar</button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
