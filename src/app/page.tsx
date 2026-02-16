import Link from 'next/link'
import Image from 'next/image'
import {
  UtensilsCrossed,
  Clock,
  LayoutDashboard,
  Tablet as TabletIcon,
  ChevronRight,
} from 'lucide-react'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950">
              <UtensilsCrossed size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight">Restauria</span>
          </div>
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Acceder
          </Link>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden pt-16">
          <div className="absolute inset-0 z-0 opacity-40">
            <Image
              src="/hero-bg.png"
              alt="Premium Restaurant Interior"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-b from-white via-white/40 to-white dark:from-zinc-950 dark:via-zinc-950/40 dark:to-zinc-950" />
          </div>

          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-7xl">
              Domina tu restaurante en{' '}
              <span className="bg-linear-to-r from-zinc-900 to-zinc-500 bg-clip-text text-transparent dark:from-zinc-100 dark:to-zinc-500">
                tiempo real.
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-600 sm:text-xl dark:text-zinc-400">
              La plataforma integral para gestionar cocina, sala y
              administración con una elegancia y sencillez sin precedentes.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className="group inline-flex h-14 items-center justify-center rounded-full bg-zinc-900 px-8 text-lg font-semibold text-white transition-all hover:bg-zinc-700 hover:shadow-xl dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Comenzar ahora
                <ChevronRight
                  className="ml-2 transition-transform group-hover:translate-x-1"
                  size={20}
                />
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-zinc-50 py-24 dark:bg-zinc-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<Clock className="text-zinc-900 dark:text-zinc-100" />}
                title="Cocina"
                description="Control total de comandas en tiempo real para tu equipo de cocina."
              />
              <FeatureCard
                icon={
                  <UtensilsCrossed className="text-zinc-900 dark:text-zinc-100" />
                }
                title="Camareros"
                description="Gestión ágil de mesas y pedidos desde cualquier dispositivo."
              />
              <FeatureCard
                icon={
                  <LayoutDashboard className="text-zinc-900 dark:text-zinc-100" />
                }
                title="Administración"
                description="Visión global de tu negocio, inventario y facturación."
              />
              <FeatureCard
                icon={
                  <TabletIcon className="text-zinc-900 dark:text-zinc-100" />
                }
                title="Tablets"
                description="Experiencia premium para tus clientes directamente en la mesa."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-12 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-center gap-2">
            <UtensilsCrossed size={20} />
            <span className="font-bold tracking-tight">Restauria</span>
          </div>
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} Restauria. Elevando la gastronomía
            digital.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group relative rounded-3xl border border-zinc-200 bg-white p-8 transition-all hover:shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-bold">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  )
}
