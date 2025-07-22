import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/contexts/AppContext';
import { useEffect, useState } from 'react';
import { firestore } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Navigate } from 'react-router-dom';
import { Download, CreditCard, Calendar, FileText, TrendingUp, AlertCircle, Plus, ExternalLink, CheckCircle, Star, Zap, Globe, Users, Shield } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { PAYMENT_TYPES, formatCurrency } from '@/lib/mercadopago';
import { getUserPayments, createMercadoPagoPreference, Payment } from '@/lib/paymentService';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaymentSync from '@/components/PaymentSync';
import { useTranslation } from 'react-i18next';

export default function Facturacion() {
  const { user } = useApp();
  const [pagos, setPagos] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPago, setSelectedPago] = useState<Payment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    
    // Escuchar pagos en tiempo real
    const unsubscribe = getUserPayments(user.email, (payments) => {
      setPagos(payments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) return <Navigate to="/login" />;

  const totalGastado = pagos
    .filter(p => p.status === 'approved')
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const pagosPendientes = pagos.filter(p => p.status === 'pending').length;
  const pagosCompletados = pagos.filter(p => p.status === 'approved').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'cancelled': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const handleDownloadInvoice = (pago: Payment) => {
    if (pago.invoiceUrl) {
      window.open(pago.invoiceUrl, '_blank');
    } else {
      // Generar factura en el momento
      const facturaData = {
        numero: `FAC-${pago.id.slice(-6)}`,
        fecha: new Date(pago.createdAt).toLocaleDateString('es-ES'),
        cliente: user.name || user.email,
        concepto: pago.description,
        monto: formatCurrency(pago.amount, pago.currency),
        estado: pago.status
      };
      
      const facturaText = `
        FACTURA ${facturaData.numero}
        
        Fecha: ${facturaData.fecha}
        Cliente: ${facturaData.cliente}
        Concepto: ${facturaData.concepto}
        Monto: ${facturaData.monto}
        Estado: ${facturaData.estado}
      `;
      
      const blob = new Blob([facturaText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-${facturaData.numero}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleCreatePayment = async (paymentType: string) => {
    if (!user) return;
    
    setProcessingPayment(true);
    try {
      const paymentData = {
        userId: user.uid || '',
        userEmail: user.email,
        userName: user.name,
        paymentType: paymentType
      };

      const result = await createMercadoPagoPreference(paymentData);
      
      // Redirigir a Mercado Pago
      window.location.href = result.initPoint;
      
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el pago. Intenta de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const PLANES = [
    {
      key: 'basico',
      nombre: 'Plan Básico',
      precio: 299000,
      currency: 'ARS',
      descripcion: 'Ideal para empresas pequeñas que inician su presencia digital',
      popular: false,
      features: [
        'Sitio web de 5 páginas',
        'Optimización SEO básica',
        'Diseño responsive',
        'Formulario de contacto',
        'Integración con redes sociales',
        'Soporte técnico por 3 meses',
      ],
      icon: Star,
    },
    {
      key: 'profesional',
      nombre: 'Plan Profesional',
      precio: 499000,
      currency: 'ARS',
      descripcion: 'Perfecto para empresas en crecimiento que buscan destacar',
      popular: true,
      features: [
        'Sitio web de 10 páginas',
        'Estrategia SEO completa',
        'Blog integrado con CMS',
        'Panel de administración',
        'Email marketing (hasta 1,000 suscriptores)',
        'Integraciones con CRM',
        'Soporte técnico prioritario',
      ],
      icon: Zap,
    },
    {
      key: 'enterprise',
      nombre: 'Plan Enterprise',
      precio: 0,
      currency: 'ARS',
      descripcion: 'Para empresas con necesidades específicas y a gran escala',
      popular: false,
      features: [
        'Sitio web con páginas ilimitadas',
        'Estrategia digital completa',
        'SEO avanzado y SEM',
        'Automatización de marketing',
        'Desarrollos a medida',
        'Integraciones avanzadas',
        'Soporte técnico 24/7',
        'Gerente de cuenta dedicado',
      ],
      icon: Globe,
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('Facturación y Pagos')}</h1>
          <p className="text-muted-foreground">{t('Gestiona tus pagos y descarga facturas')}</p>
        </div>
        <div className="flex items-center gap-2">
           <Button
             onClick={() => window.location.href = 'https://tuweb-ai.com/#pricing'}
           >
             <Plus className="h-4 w-4 mr-2" />
             {t('Nuevo Pago')}
           </Button>
        </div>
      </div>

      {/* Sincronización con página principal */}
      <PaymentSync />

      {/* Resumen de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Gastado</p>
                <p className="text-2xl font-bold">{formatCurrency(totalGastado)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagos Completados</p>
                <p className="text-2xl font-bold">{pagosCompletados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagos Pendientes</p>
                <p className="text-2xl font-bold">{pagosPendientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historial de pagos */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
          <CardDescription>Lista completa de todos tus pagos y transacciones</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Cargando pagos...</p>
            </div>
          ) : pagos.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay pagos registrados</h3>
              <p className="text-muted-foreground mb-4">Cuando realices tu primer pago, aparecerá aquí.</p>
              <Button onClick={() => window.location.href = 'https://tuweb-ai.com/#pricing'}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Pago
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {pagos.map((pago) => (
                <div
                  key={pago.id}
                  className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedPago(pago);
                    setIsModalOpen(true);
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{pago.description || 'Pago de proyecto'}</h3>
                      <p className="text-sm text-muted-foreground">{pago.paymentType}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(pago.createdAt).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(pago.amount, pago.currency)}</p>
                      <Badge className={getStatusColor(pago.status)}>
                        {pago.status || 'Pendiente'}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadInvoice(pago);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalle del pago */}
      {selectedPago && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${isModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity`}>
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Detalle del Pago</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Concepto</Label>
                <p className="text-sm text-muted-foreground">{selectedPago.description}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Monto</Label>
                <p className="text-lg font-bold text-primary">{formatCurrency(selectedPago.amount, selectedPago.currency)}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Estado</Label>
                <Badge className={getStatusColor(selectedPago.status)}>
                  {selectedPago.status || 'Pendiente'}
                </Badge>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Fecha</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedPago.createdAt).toLocaleDateString('es-ES')}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Método de pago</Label>
                <p className="text-sm text-muted-foreground">{selectedPago.paymentMethod || 'Mercado Pago'}</p>
              </div>
              
              {selectedPago.features && selectedPago.features.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Características incluidas</Label>
                  <ul className="text-sm text-muted-foreground mt-1">
                    {selectedPago.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleDownloadInvoice(selectedPago)}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Factura
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 