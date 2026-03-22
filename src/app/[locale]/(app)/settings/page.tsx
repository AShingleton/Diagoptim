"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Bell, CreditCard, Users, Globe, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";

export default function SettingsPage() {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("Antoine Dupont");
  const [email] = useState("antoine@example.com");
  const [language, setLanguage] = useState("fr");
  const [theme, setTheme] = useState("system");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  const handleSave = () => {
    toast.success(t("settings.saved"));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold font-heading">{t("settings.title")}</h1>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="gap-2 text-xs sm:text-sm">
            <User className="h-4 w-4" /> {t("settings.profile")}
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2 text-xs sm:text-sm">
            <Palette className="h-4 w-4" /> {t("settings.general")}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 text-xs sm:text-sm">
            <Bell className="h-4 w-4" /> {t("settings.notifications")}
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2 text-xs sm:text-sm">
            <Users className="h-4 w-4" /> {t("settings.team")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle>{t("settings.profile")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">AD</span>
                </div>
                <div>
                  <p className="font-medium">{fullName}</p>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>{t("auth.fullName")}</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>{t("auth.email")}</Label>
                  <Input value={email} disabled />
                </div>
              </div>
              <Separator />
              <Button onClick={handleSave}>{t("settings.save")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="mt-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle>{t("settings.general")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label>{t("settings.language")}</Label>
                <Select value={language} onValueChange={(v) => v && setLanguage(v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">
                      <span className="flex items-center gap-2">
                        <Globe className="h-4 w-4" /> Français
                      </span>
                    </SelectItem>
                    <SelectItem value="en">
                      <span className="flex items-center gap-2">
                        <Globe className="h-4 w-4" /> English
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t("settings.theme")}</Label>
                <Select value={theme} onValueChange={(v) => v && setTheme(v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t("settings.light")}</SelectItem>
                    <SelectItem value="dark">{t("settings.dark")}</SelectItem>
                    <SelectItem value="system">{t("settings.system")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <Button onClick={handleSave}>{t("settings.save")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle>{t("settings.notifications")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications by email</p>
                </div>
                <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push notifications</p>
                  <p className="text-sm text-muted-foreground">Browser push notifications</p>
                </div>
                <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly digest</p>
                  <p className="text-sm text-muted-foreground">Weekly summary of activity</p>
                </div>
                <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
              </div>
              <Separator />
              <Button onClick={handleSave}>{t("settings.save")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t("settings.team")}
                <Button size="sm" className="gap-2">
                  <Users className="h-4 w-4" />
                  Inviter
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Antoine Dupont", email: "antoine@example.com", role: "owner" },
                  { name: "Marie Martin", email: "marie@example.com", role: "collaborator" },
                ].map((member) => (
                  <div
                    key={member.email}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <span className="text-xs capitalize text-muted-foreground">{member.role}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
