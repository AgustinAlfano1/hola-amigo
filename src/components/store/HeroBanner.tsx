import { Search, Wrench, Zap, Shield } from 'lucide-react';

interface HeroBannerProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const HeroBanner = ({ searchTerm, onSearchChange }: HeroBannerProps) => {
  return (
    <section
      className="relative overflow-hidden hero-pattern"
      style={{ background: 'var(--gradient-hero)' }}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary/30 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="container relative mx-auto px-4 py-14 md:py-20">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-body text-xs text-primary tracking-widest uppercase font-medium">
              Repuestos originales y alternativos
            </span>
          </div>

          <h2 className="font-heading text-4xl font-bold leading-tight text-white md:text-6xl">
            Encontrá el{' '}
            <span className="text-gradient">repuesto</span>{' '}
            que necesitás
          </h2>
          <p className="mt-3 font-body text-base text-zinc-400 max-w-xl">
            Las mejores marcas al mejor precio. Stock permanente y envíos a todo el país.
          </p>

          {/* Search */}
          <div className="mt-7 flex max-w-xl items-center rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm ring-1 ring-white/5 focus-within:border-primary/60 focus-within:bg-white/8 transition-all">
            <Search className="ml-4 h-5 w-5 shrink-0 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por nombre, marca, categoría..."
              className="w-full bg-transparent px-4 py-3.5 font-body text-sm text-white placeholder:text-zinc-500 outline-none"
            />
          </div>

          {/* Feature pills */}
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { icon: Wrench, label: 'Amplio catálogo' },
              { icon: Zap, label: 'Entrega rápida' },
              { icon: Shield, label: 'Garantía de calidad' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span className="font-body text-xs text-zinc-300">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
