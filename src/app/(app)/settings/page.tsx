import SettingsForm from '@/components/settings/SettingsForm';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-headline font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Customize your ShopSavvy experience.
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}
