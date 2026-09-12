import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/login');
    }

    return (
        <div className="flex min-h-screen">
            <div className="hidden w-1/2 flex-col justify-between bg-(--brand-indigo-900) p-12 text-white lg:flex">
                <img src="/pullstack.png" alt="Pullstack Dev" className="h-10 w-auto self-start object-contain" />
                <div>
                    <p className="max-w-sm text-2xl font-medium leading-snug text-white/90">
                        Dokumentasi dan invoice internal, di satu tempat.
                    </p>
                    <p className="mt-3 text-sm text-white/50">Akses dikelola oleh admin — hubungi admin kalau butuh akun.</p>
                </div>
            </div>

            <div className="flex flex-1 items-center justify-center bg-background p-6">
                <div className="w-full max-w-sm">
                    <img src="/pullstack.png" alt="Pullstack Dev" className="mb-8 h-8 w-auto lg:hidden" />
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">Masuk ke akun kamu</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Masukkan email dan password internal kamu.</p>

                    <form onSubmit={submit} className="mt-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                autoFocus
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={processing}>
                            Masuk
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
