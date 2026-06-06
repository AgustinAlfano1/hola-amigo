import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, LogIn, Loader2, XCircle } from 'lucide-react';

const EmailConfirmed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const confirm = async () => {
      // PKCE flow: Supabase sends ?code=... query param
      const code = searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) { setStatus('error'); return; }
        setStatus('success');
        return;
      }

      // Implicit flow: token in hash fragment
      const hash = window.location.hash;
      if (hash.includes('access_token')) {
        // Let Supabase handle the hash automatically
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          // Give it a moment to process
          setTimeout(async () => {
            const { data: d2 } = await supabase.auth.getSession();
            setStatus(d2.session ? 'success' : 'error');
          }, 1000);
          return;
        }
        setStatus('success');
        return;
      }

      // No token found
      setStatus('error');
    };

    confirm();
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4" style={{ background: 'var(--gradient-hero)' }}>
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-body text-zinc-400 text-sm">Verificando tu cuenta...</p>
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
            <h1 className="font-heading text-3xl font-bold text-white mb-2">¡Cuenta confirmada!</h1>
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
            <button onClick={() => navigate('/')} className="mt-3 w-full font-body text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              Ir a la tienda
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15 border border-red-500/30">
              <XCircle className="h-10 w-10 text-red-400" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-white mb-2">Link inválido</h1>
            <p className="font-body text-zinc-400 mb-6">
              Este link ya fue usado o expiró. Si ya confirmaste tu cuenta, podés ingresar directamente.
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
