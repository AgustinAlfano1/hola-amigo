import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [dni, setDni] = useState('');
  const [cuilCuit, setCuilCuit] = useState('');

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: 'Ingresá tu email', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Email enviado', description: 'Revisá tu bandeja de entrada para restablecer tu contraseña.' });
      setIsForgotPassword(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: 'Error al iniciar sesión', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '¡Bienvenido!' });
      navigate('/');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !dni.trim()) {
      toast({ title: 'Campos requeridos', description: 'Completá nombre, teléfono y DNI.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          dni: dni.trim(),
          cuil_cuit: cuilCuit.trim(),
        },
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Error al registrarse', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Registro exitoso', description: 'Revisá tu email para confirmar tu cuenta.' });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-1 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a la tienda
        </button>

        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <h1 className="mb-1 font-heading text-2xl tracking-wider text-foreground">
            {isForgotPassword ? 'Recuperar contraseña' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h1>
          <p className="mb-6 font-body text-sm text-muted-foreground">
            {isForgotPassword
              ? 'Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña'
              : isLogin
                ? 'Ingresá tus datos para continuar'
                : 'Completá tus datos para registrarte'}
          </p>

          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-body text-sm">Email *</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
              </div>
              <Button type="submit" className="w-full font-heading tracking-wider" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar enlace
              </Button>
            </form>
          ) : (
            <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="font-body text-sm">Nombre completo *</Label>
                    <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Juan Pérez" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="dni" className="font-body text-sm">DNI *</Label>
                      <Input id="dni" value={dni} onChange={e => setDni(e.target.value)} placeholder="12345678" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cuilCuit" className="font-body text-sm">CUIL/CUIT</Label>
                      <Input id="cuilCuit" value={cuilCuit} onChange={e => setCuilCuit(e.target.value)} placeholder="20-12345678-9" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="font-body text-sm">Teléfono *</Label>
                    <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+54 11 1234-5678" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="font-body text-sm">Dirección</Label>
                    <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Av. Corrientes 1234, CABA" />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-body text-sm">Email *</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="font-body text-sm">Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="font-body text-xs text-muted-foreground hover:text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}

              <Button type="submit" className="w-full font-heading tracking-wider" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? 'Ingresar' : 'Registrarse'}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center space-y-2">
            {isForgotPassword ? (
              <button
                onClick={() => setIsForgotPassword(false)}
                className="font-body text-sm text-primary hover:underline"
              >
                Volver al inicio de sesión
              </button>
            ) : (
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-body text-sm text-primary hover:underline"
              >
                {isLogin ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Iniciá sesión'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
