import SettingsForm from '@/components/settings/SettingsForm';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="glass-card p-4 sm:p-6">
            <h2 className="text-2xl sm:text-3xl font-headline font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              ⚙️ Settings
            </h2>
            <p className="text-sm sm:text-md text-muted-foreground/80 mt-2">
              Customize your DealPal experience and preferences.
            </p>
          </div>
          <SettingsForm />
        </div>
      </div>
    </div>
  );
}
