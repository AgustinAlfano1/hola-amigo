import { Search } from 'lucide-react';

const HeroBanner = () => {
  return (
    <section className="relative overflow-hidden border-b border-border" style={{ background: 'var(--gradient-hero)' }}>
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          <h2 className="font-heading text-4xl font-bold leading-tight text-foreground md:text-6xl">
            Encontrá el <span className="text-gradient">repuesto</span> que necesitás
          </h2>
          <p className="mt-4 font-body text-lg text-muted-foreground">
            Las mejores marcas. Los mejores precios. Envíos a todo el país.
          </p>
          <div className="mt-8 flex max-w-md items-center rounded-lg border border-border bg-card">
            <Search className="ml-4 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar repuestos..."
              className="w-full bg-transparent px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
        </div>
      </div>
      {/* Decorative elements */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-10 right-40 h-40 w-40 rounded-full bg-accent/5 blur-2xl" />
    </section>
  );
};

export default HeroBanner;
