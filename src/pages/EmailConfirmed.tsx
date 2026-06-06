import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, LogIn, Loader2 } from 'lucide-react';

const EmailConfirmed = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    // Supabase puts the token in the URL hash after email confirmation
    const hash = window.location.hash;
    if (hash.includes('access_token') && hash.includes('type=signup')) {
      setStatus('success');
    } else if (hash.includes('access_token')) {
      // Could be a password recovery
      navigate('/reset-password' + hash);
    } else {
      setStatus('error');
    }
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4" style={{ background: 'var(--gradient-hero)' }}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-sm p-8 text-center shadow-2xl">

        {status === 'success' ? (
          <>
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15 border border-green-500/30">
              <CheckCircle2 className="h-10 w-10 text-green-400" />
            </div>

            <h1 className="font-heading text-3xl font-bold text-white mb-2">
              ¡Cuenta confirmada!
            </h1>
            <p className="font-body text-zinc-400 mb-8 leading-relaxed">
              Tu cuenta fue creada exitosamente. Ya podés ingresar y empezar a comprar.
            </p>

            <button
              onClick={() => navigate('/auth')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-heading text-sm font-bold tracking-widest text-white transition-all hover:bg-primary/85 active:scale-[0.98]"
            >
              <LogIn className="h-4 w-4" />
              Ingresar a mi cuenta
            </button>

            <button
              onClick={() => navigate('/')}
              className="mt-3 w-full font-body text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Ir a la tienda
            </button>
          </>
        ) : (
          <>
            <h1 className="font-heading text-2xl font-bold text-white mb-2">
              Link inválido
            </h1>
            <p className="font-body text-zinc-400 mb-6">
              Este link de confirmación no es válido o ya fue usado.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-heading text-sm font-bold tracking-widest text-white hover:bg-primary/85"
            >
              <LogIn className="h-4 w-4" />
              Ir al login
            </button>
          </>
        )}
      </div>

      {/* Logo */}
      <div className="mt-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
          <span className="font-heading text-sm font-black text-white">F</span>
        </div>
        <span className="font-heading text-sm font-bold tracking-widest text-white">FIAT MORÓN</span>
      </div>
    </div>
  );
};

export default EmailConfirmed;
