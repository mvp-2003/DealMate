'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Save } from "lucide-react";
import { useEffect } from "react";

const platforms = [
  { id: "amazon", label: "Amazon.in" },
  { id: "flipkart", label: "Flipkart" },
  { id: "myntra", label: "Myntra" },
  { id: "ajio", label: "Ajio" },
] as const;

const settingsFormSchema = z.object({
  preferredPlatforms: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one platform.",
  }),
  alertFrequency: z.enum(["daily", "weekly", "instant", "off"]),
  darkMode: z.boolean().default(false).optional(),
  autoApplyCoupons: z.boolean().default(true).optional(),
  priceDropNotifications: z.boolean().default(true).optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

// Hardcoded user ID for demonstration purposes
const USER_ID = "a1b2c3d4-e5f6-7890-1234-567890abcdef";

export default function SettingsForm() {
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
        preferredPlatforms: [],
        alertFrequency: "daily",
        darkMode: false,
        autoApplyCoupons: true,
        priceDropNotifications: true,
    },
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch(`/api/settings/${USER_ID}`);
        if (response.ok) {
          const data = await response.json();
          form.reset(data);
        } else {
          // Handle case where user has no settings yet
          console.log("No settings found for user, using default values.");
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        toast({
          title: "Error",
          description: "Could not load your settings.",
          variant: "destructive",
        });
      }
    }
    fetchSettings();
  }, [form]);

  async function onSubmit(data: SettingsFormValues) {
    try {
      const response = await fetch(`/api/settings/${USER_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Settings Saved",
          description: "Your preferences have been updated successfully.",
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error",
        description: "Could not save your settings.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        <Card className="neumorphic-card">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-md sm:text-lg">Preferred Platforms</CardTitle>
            <FormDescription className="text-sm">Select the e-commerce sites you shop on most.</FormDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="preferredPlatforms"
              render={() => (
                <FormItem>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {platforms.map((platform) => (
                      <FormField
                        key={platform.id}
                        control={form.control}
                        name="preferredPlatforms"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={platform.id}
                              className="flex flex-row items-center space-x-3 space-y-0 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(platform.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), platform.id])
                                      : field.onChange(
                                          (field.value || []).filter(
                                            (value) => value !== platform.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal text-sm cursor-pointer flex-1">
                                {platform.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-md">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="alertFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price Drop Alert Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="instant">Instant</SelectItem>
                      <SelectItem value="daily">Daily Summary</SelectItem>
                      <SelectItem value="weekly">Weekly Summary</SelectItem>
                      <SelectItem value="off">Off</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="priceDropNotifications"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Price Drop Notifications</FormLabel>
                    <FormDescription>
                      Receive alerts when prices drop.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-md">General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="autoApplyCoupons"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Auto-apply Coupons</FormLabel>
                    <FormDescription>
                      Automatically apply best coupons at checkout.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="darkMode"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Dark Mode</FormLabel>
                    <FormDescription>
                      Enable dark theme for the extension. (UI refresh may be needed)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled // Actual dark mode toggle needs theme provider integration
                      aria-readonly 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
             <Button type="submit" className="w-full sm:w-auto">
                <Save className="mr-2 h-4 w-4" /> Save Preferences
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
