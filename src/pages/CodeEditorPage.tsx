import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CodeEditorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="max-w-lg mx-auto bg-muted/20 border-border">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Editor de Código</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-lg text-muted-foreground py-8">
            🚧 Próximamente
            <p className="mt-2 text-base">Esta funcionalidad estará disponible muy pronto.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}