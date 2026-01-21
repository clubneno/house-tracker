"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { User, Bell, Palette, Save, Loader2, Tags, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/client";
import { CategoriesTable } from "@/components/settings/categories-table";
import { TagsManager } from "@/components/tags/tags-manager";

export default function SettingsPage() {
  const { data: session } = authClient.useSession();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  // Profile settings
  const [name, setName] = useState(session?.user?.name || "");
  const [email, setEmail] = useState(session?.user?.email || "");

  // Preferences
  const [currency, setCurrency] = useState("EUR");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [warrantyReminders, setWarrantyReminders] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // Profile update logic would go here
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({
        title: t("settings.profileUpdated"),
        description: t("settings.profileSaved"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("settings.profileUpdateFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      // Preferences update logic would go here
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({
        title: t("settings.preferencesSaved"),
        description: t("settings.preferencesUpdated"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("settings.preferencesFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      // Notifications update logic would go here
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({
        title: t("settings.notificationsUpdated"),
        description: t("settings.notificationsSaved"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("settings.notificationsFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {t("settings.profile")}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            {t("settings.preferences")}
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            {t("settings.categories")}
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            {t("settings.tags")}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t("settings.notifications")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.profileInfo")}</CardTitle>
              <CardDescription>
                {t("settings.updatePersonalInfo")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("common.name")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("settings.yourName")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("common.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("settings.newPassword")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("settings.leaveBlankPassword")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t("settings.confirmNewPassword")}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder={t("settings.confirmNewPassword")}
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {t("settings.saveProfile")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.displayPreferences")}</CardTitle>
              <CardDescription>
                {t("settings.customizeDisplay")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">{t("settings.defaultCurrency")}</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder={t("settings.selectCurrency")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                    <SelectItem value="CHF">Swiss Franc (CHF)</SelectItem>
                    <SelectItem value="PLN">Polish Zloty (PLN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-format">{t("settings.dateFormat")}</Label>
                <Select value={dateFormat} onValueChange={setDateFormat}>
                  <SelectTrigger id="date-format">
                    <SelectValue placeholder={t("settings.selectDateFormat")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSavePreferences} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {t("settings.savePreferences")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesTable />
        </TabsContent>

        <TabsContent value="tags">
          <Card>
            <CardContent className="pt-6">
              <TagsManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.notificationSettings")}</CardTitle>
              <CardDescription>
                {t("settings.configureNotifications")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.emailNotifications")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.emailNotificationsDesc")}
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.warrantyReminders")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.warrantyRemindersDesc")}
                  </p>
                </div>
                <Switch
                  checked={warrantyReminders}
                  onCheckedChange={setWarrantyReminders}
                  disabled={!emailNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.paymentReminders")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.paymentRemindersDesc")}
                  </p>
                </div>
                <Switch
                  checked={paymentReminders}
                  onCheckedChange={setPaymentReminders}
                  disabled={!emailNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.budgetAlerts")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.budgetAlertsDesc")}
                  </p>
                </div>
                <Switch
                  checked={budgetAlerts}
                  onCheckedChange={setBudgetAlerts}
                  disabled={!emailNotifications}
                />
              </div>
              <Button onClick={handleSaveNotifications} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {t("settings.saveNotifications")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
