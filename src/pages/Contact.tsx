import { MapPin, Clock, Phone, MessageCircle, Instagram, Facebook, ChevronRight, Car } from 'lucide-react';
import StoreHeader from '@/components/store/StoreHeader';
import CartDrawer from '@/components/store/CartDrawer';

const WHATSAPP_NUMBER = '5491149989332';
const WHATSAPP_MSG = encodeURIComponent('¡Hola! Me gustaría hacer una consulta sobre repuestos. 🔧');
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;

const HORARIOS = [
  { dia: 'Lunes', hora: '8:00 – 18:00', abierto: true },
  { dia: 'Martes', hora: '8:00 – 18:00', abierto: true },
  { dia: 'Miércoles', hora: '8:00 – 18:00', abierto: true },
  { dia: 'Jueves', hora: '8:00 – 18:00', abierto: true },
  { dia: 'Viernes', hora: '8:00 – 18:00', abierto: true },
  { dia: 'Sábado', hora: '8:00 – 13:00', abierto: true },
  { dia: 'Domingo', hora: 'Cerrado', abierto: false },
];

const isOpen = () => {
  const now = new Date();
  const day = now.getDay(); // 0 = Dom, 6 = Sáb
  const hour = now.getHours() + now.getMinutes() / 60;
  if (day === 0) return false;
  if (day === 6) return hour >= 8 && hour < 13;
  return hour >= 8 && hour < 18;
};

const Contact = () => {
  const open = isOpen();

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />
      <CartDrawer />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border" style={{ background: 'var(--gradient-hero)' }}>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container mx-auto px-4 py-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-body text-xs text-primary tracking-widest uppercase font-medium">Estamos para ayudarte</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-3">Contacto</h1>
          <p className="font-body text-zinc-400 max-w-xl text-base">
            Encontrá el repuesto que necesitás o consultanos sin compromiso. Respondemos rápido por WhatsApp.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Columna izquierda */}
          <div className="space-y-6 lg:col-span-1">

            {/* WhatsApp */}
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/15">
                  <MessageCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-bold tracking-wider text-foreground">WhatsApp</h3>
                  <p className="font-body text-xs text-muted-foreground">Respuesta en minutos</p>
                </div>
              </div>
              <p className="font-body text-sm text-muted-foreground mb-4">
                Consultanos por cualquier repuesto, precio o disponibilidad. Te respondemos a la brevedad.
              </p>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-3 font-heading text-sm font-bold tracking-widest text-white transition-all hover:bg-green-600 active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4" />
                Abrir WhatsApp
                <ChevronRight className="h-4 w-4" />
              </a>
              <p className="mt-3 text-center font-body text-xs text-muted-foreground">+54 9 11 4998-9332</p>
            </div>

            {/* Horarios */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-heading text-sm font-bold tracking-wider text-foreground">Horarios</h3>
                </div>
                <span className={`rounded-full px-2.5 py-1 font-body text-[10px] font-bold tracking-widest ${open ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                  {open ? '● ABIERTO' : '● CERRADO'}
                </span>
              </div>
              <div className="space-y-2">
                {HORARIOS.map(({ dia, hora, abierto }) => (
                  <div key={dia} className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-secondary transition-colors">
                    <span className="font-body text-sm text-muted-foreground">{dia}</span>
                    <span className={`font-body text-sm font-medium ${abierto ? 'text-foreground' : 'text-muted-foreground'}`}>{hora}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info adicional */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-heading text-sm font-bold tracking-wider text-foreground">¿Por qué elegirnos?</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Stock permanente de repuestos FIAT y otras marcas',
                  'Repuestos originales y alternativos de calidad',
                  'Asesoramiento técnico especializado',
                  'Envíos a todo el país',
                  'Más de 10 años en el rubro automotriz',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 font-body text-sm text-muted-foreground">
                    <ChevronRight className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Columna derecha — Mapa + Dirección */}
          <div className="space-y-6 lg:col-span-2">

            {/* Dirección */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-bold tracking-wider text-foreground">Ubicación</h3>
                  <p className="font-body text-xs text-muted-foreground">DLS Repuestos</p>
                </div>
              </div>
              <p className="font-body text-base font-medium text-foreground mb-1">Av. Hipólito Yrigoyen 510</p>
              <p className="font-body text-sm text-muted-foreground mb-4">B1708 Morón, Provincia de Buenos Aires</p>
              <a
                href="https://maps.google.com/?q=Av.+Hipólito+Yrigoyen+510,+Morón,+Buenos+Aires"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded border border-border bg-secondary px-4 py-2 font-body text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Abrir en Google Maps
                <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Mapa */}
            <div className="overflow-hidden rounded-xl border border-border bg-card" style={{ height: '420px' }}>
              <iframe
                title="Ubicación FIAT Morón"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src="https://maps.google.com/maps?q=Av.+Hip%C3%B3lito+Yrigoyen+510,+Mor%C3%B3n,+Buenos+Aires,+Argentina&output=embed&z=16"
              />
            </div>

            {/* CTA final */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-heading text-base font-bold tracking-wider text-foreground mb-1">¿No encontraste lo que buscabas?</h3>
                <p className="font-body text-sm text-muted-foreground">Consultanos y conseguimos el repuesto que necesitás.</p>
              </div>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-heading text-sm font-bold tracking-widest text-white transition-all hover:bg-primary/85"
              >
                <MessageCircle className="h-4 w-4" />
                Consultar ahora
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
