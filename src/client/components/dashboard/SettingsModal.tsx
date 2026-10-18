import { useEffect, useState, useRef, useMemo } from "react";
import { api, clearToken, getFundDataSourceInfo, getBankPortalInfo, type Investment, type Status, type User } from "../../api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { 
  LayoutDashboard, Database, PlusCircle, Smartphone, BarChart3, 
  FileText, Settings, LogOut, Search, ArrowUpRight, ArrowDownRight, 
  Wallet, TrendingUp, Layers, Activity, Shield, RefreshCw, 
  Download, Sparkles, Filter, ChevronRight, CheckCircle2,
  AlertTriangle, ExternalLink, Calendar, Plus, Globe, Building2,
  PieChart as PieIcon, ArrowUpDown, Table, LayoutGrid, Eye, Check, X,
  Key, Mail, Lock, Phone, UserCheck, ShieldAlert, Sun, Moon, Palette, BookOpen,
  Menu, MoreHorizontal
} from 'lucide-react';
import { COUNTRIES } from "../RegisterPage";
import { useTheme } from "../../theme";
import type { DashboardSection } from "./DashboardNav";

type Props = {
  user: User;
  isOpen: boolean;
  onClose: () => void;
};

export function SettingsModal({ user, isOpen, onClose }: Props) {
  const { theme, isDark, isLight, toggleTheme, setTheme } = useTheme();
  const setSettingsOpen = (open: boolean) => { if (!open) onClose(); };
  const [settingsTab, setSettingsTab] = useState<"appearance" | "phone" | "email" | "password" | "danger">("appearance");
  
  // Settings Form States
  const [phoneCountry, setPhoneCountry] = useState(() => COUNTRIES.find(c => c.code === "ES") ?? COUNTRIES[0]);
  const [localPhone, setLocalPhone] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryRef = useRef<HTMLDivElement>(null);
  
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");

  // Initialize Phone
  useEffect(() => {
    if (user?.phone) {
      const matchingCountry = COUNTRIES.slice().sort((a, b) => b.dial.length - a.dial.length).find(c => user.phone!.startsWith(c.dial));
      if (matchingCountry) {
        setPhoneCountry(matchingCountry);
        setLocalPhone(user.phone.slice(matchingCountry.dial.length));
      } else {
        setLocalPhone(user.phone);
      }
    } else {
      setLocalPhone("");
    }
  }, [user?.phone]);

  // Click outside country picker
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setShowCountryPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save Settings Handlers
  const handleSavePhone = async () => {
    setSettingsError("");
    setSettingsSuccess("");
    const num = localPhone.replace(/\D/g, "");
    const full = num ? `${phoneCountry.dial}${num}` : "";
    if (num && !/^\+[1-9]\d{6,14}$/.test(full.replace(/[\s-]/g, ""))) {
      setSettingsError("Número inválido. Formato: +34612345678");
      return;
    }
    setSettingsLoading(true);
    try {
      await api.updateAccount({ phone: full || null } as any);
      user.phone = full || null;
      setSettingsSuccess("Teléfono de WhatsApp guardado correctamente");
      setTimeout(() => setSettingsSuccess(""), 3000);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    setSettingsError("");
    setSettingsSuccess("");
    if (!currentEmail.includes("@") || !newEmail.includes("@")) {
      setSettingsError("Introduce direcciones de correo válidas");
      return;
    }
    setSettingsLoading(true);
    try {
      await api.updateAccount({ currentEmail: currentEmail.trim(), email: newEmail.trim() });
      user.email = newEmail.trim();
      setSettingsSuccess("Email actualizado correctamente");
      setCurrentEmail("");
      setNewEmail("");
      setTimeout(() => setSettingsSuccess(""), 3000);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Error al cambiar email");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setSettingsError("");
    setSettingsSuccess("");
    if (!currentPassword || !newPassword) {
      setSettingsError("Rellena todos los campos");
      return;
    }
    if (newPassword.length < 8) {
      setSettingsError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    setSettingsLoading(true);
    try {
      await api.updateAccount({ currentPassword, newPassword });
      setSettingsSuccess("Contraseña cambiada con éxito");
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setSettingsSuccess(""), 3000);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Error al cambiar contraseña");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setSettingsError("");
    if (!deletePassword) {
      setSettingsError("Introduce tu contraseña para confirmar");
      return;
    }
    setSettingsLoading(true);
    try {
      await api.deleteAccount(deletePassword);
      clearToken();
      window.location.replace("/login");
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Error al eliminar cuenta");
      setSettingsLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/75 backdrop-blur-md p-2.5 sm:p-4 overflow-y-auto pt-4 sm:pt-4 animate-fade-in">
          <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col max-h-[85vh] sm:max-h-[90vh] my-auto">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-[var(--color-ink-3)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent)] shrink-0">
                  <Settings size={17} />
                </div>
                <div className="truncate">
                  <h3 className="text-sm sm:text-base font-bold text-[var(--color-fg-1)] truncate">Ajustes de la cuenta</h3>
                  <p className="text-[11px] sm:text-xs text-[var(--color-fg-4)] truncate">{user.username} • {user.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSettingsOpen(false)}
                className="p-1.5 sm:p-2 text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] rounded-xl hover:bg-[var(--color-ink-2)] transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[var(--color-ink-3)] px-3 sm:px-6 pt-2 gap-1 sm:gap-2 overflow-x-auto no-scrollbar touch-scroll shrink-0">
              <button 
                onClick={() => { setSettingsTab("appearance"); setSettingsError(""); setSettingsSuccess(""); }}
                className={`pb-2.5 sm:pb-3 px-2 sm:px-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  settingsTab === "appearance" ? "border-[var(--color-accent)] text-[var(--color-accent)] font-semibold" : "border-transparent text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
                }`}
              >
                <Palette size={13} /> Apariencia
              </button>
              <button 
                onClick={() => { setSettingsTab("phone"); setSettingsError(""); setSettingsSuccess(""); }}
                className={`pb-2.5 sm:pb-3 px-2 sm:px-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  settingsTab === "phone" ? "border-[var(--color-accent)] text-[var(--color-accent)] font-semibold" : "border-transparent text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
                }`}
              >
                <Phone size={13} /> WhatsApp
              </button>
              <button 
                onClick={() => { setSettingsTab("email"); setSettingsError(""); setSettingsSuccess(""); }}
                className={`pb-2.5 sm:pb-3 px-2 sm:px-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  settingsTab === "email" ? "border-[var(--color-accent)] text-[var(--color-accent)] font-semibold" : "border-transparent text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
                }`}
              >
                <Mail size={13} /> Email
              </button>
              <button 
                onClick={() => { setSettingsTab("password"); setSettingsError(""); setSettingsSuccess(""); }}
                className={`pb-2.5 sm:pb-3 px-2 sm:px-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  settingsTab === "password" ? "border-[var(--color-accent)] text-[var(--color-accent)] font-semibold" : "border-transparent text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
                }`}
              >
                <Lock size={13} /> Contraseña
              </button>
              <button 
                onClick={() => { setSettingsTab("danger"); setSettingsError(""); setSettingsSuccess(""); }}
                className={`pb-2.5 sm:pb-3 px-2 sm:px-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ml-auto ${
                  settingsTab === "danger" ? "border-[var(--color-danger)] text-[var(--color-danger)] font-semibold" : "border-transparent text-[var(--color-fg-5)] hover:text-red-400"
                }`}
              >
                <ShieldAlert size={13} /> Peligro
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto touch-scroll space-y-4 flex-1">
              
              {settingsError && (
                <div className="p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-xl text-xs text-[var(--color-danger)] flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{settingsError}</span>
                </div>
              )}

              {settingsSuccess && (
                <div className="p-3 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 rounded-xl text-xs text-[var(--color-accent)] flex items-center gap-2">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{settingsSuccess}</span>
                </div>
              )}

              {/* Appearance / Theme Tab */}
              {settingsTab === "appearance" && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[var(--color-fg-3)] mb-1">
                      Personaliza la interfaz visual de toda la plataforma según tu preferencia.
                    </p>
                    <p className="text-[11px] text-[var(--color-fg-4)]">
                      El tema se aplica a tu panel. La web pública y el acceso se ven siempre en oscuro.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* Dark Theme Option */}
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                        isDark 
                          ? "border-[var(--color-accent)] bg-[var(--color-ink-2)] shadow-[0_0_20px_rgba(192,132,252,0.15)] ring-1 ring-[var(--color-accent)]" 
                          : "border-[var(--color-ink-3)] bg-[var(--color-ink-2)] hover:border-[var(--color-ink-3)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-black border border-[var(--color-ink-3)] flex items-center justify-center text-emerald-400 shadow-sm">
                            <Moon size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[var(--color-fg-1)]">Modo oscuro</p>
                            <span className="text-[10px] text-[var(--color-fg-4)]">Predeterminado</span>
                          </div>
                        </div>
                        {isDark && (
                          <div className="w-5 h-5 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-fg)] flex items-center justify-center shadow-[0_0_8px_rgba(192,132,252,0.5)]">
                            <Check size={11} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      {/* Visual Mini Preview */}
                      <div className="h-14 bg-[#0a0a0c] border border-[var(--color-ink-3)] rounded-xl p-2 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <div className="h-2 w-12 bg-white/20 rounded" />
                          <div className="h-2 w-6 bg-[var(--color-accent)] rounded" />
                        </div>
                        <div className="flex gap-1.5">
                          <div className="h-5 flex-1 bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded" />
                          <div className="h-5 flex-1 bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded" />
                        </div>
                      </div>
                    </button>

                    {/* Light Theme Option */}
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                        isLight 
                          ? "border-[var(--color-accent)] bg-[var(--color-ink-2)] shadow-[0_0_20px_rgba(5,150,105,0.15)] ring-1 ring-[var(--color-accent)]" 
                          : "border-[var(--color-ink-3)] bg-[var(--color-ink-2)] hover:border-[var(--color-ink-3)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-amber-500 shadow-sm">
                            <Sun size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[var(--color-fg-1)]">Modo claro</p>
                            <span className="text-[10px] text-[var(--color-fg-5)]">Luminoso & Nítido</span>
                          </div>
                        </div>
                        {isLight && (
                          <div className="w-5 h-5 rounded-full bg-[var(--color-accent)] text-[var(--color-fg-1)] flex items-center justify-center shadow-[0_0_8px_rgba(5,150,105,0.5)]">
                            <Check size={11} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      {/* Visual Mini Preview */}
                      <div className="h-14 bg-white border border-slate-200 rounded-xl p-2 flex flex-col justify-between shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="h-2 w-12 bg-slate-400 rounded" />
                          <div className="h-2 w-6 bg-emerald-600 rounded" />
                        </div>
                        <div className="flex gap-1.5">
                          <div className="h-5 flex-1 bg-slate-100 border border-slate-200 rounded" />
                          <div className="h-5 flex-1 bg-slate-100 border border-slate-200 rounded" />
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="p-3 bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl flex items-center gap-2 text-[11px] text-[var(--color-fg-4)]">
                    <CheckCircle2 size={13} className="text-[var(--color-accent)] shrink-0" />
                    <span>El cambio de tema se guarda automáticamente en tus preferencias locales.</span>
                  </div>
                </div>
              )}

              {/* Phone Tab */}
              {settingsTab === "phone" && (
                <div className="space-y-4">
                  <p className="text-xs text-[var(--color-fg-4)]">
                    Introduce el número donde quieres recibir los resúmenes diarios de cotizaciones por WhatsApp.
                  </p>
                  <div>
                    <label className="text-[11px] font-mono uppercase text-[var(--color-fg-4)] mb-1.5 block">Teléfono WhatsApp</label>
                    <div className="flex gap-2 relative" ref={countryRef}>
                      <button
                        type="button"
                        onClick={() => setShowCountryPicker(!showCountryPicker)}
                        className="flex items-center gap-1.5 bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] px-3 py-2.5 rounded-xl text-xs text-[var(--color-fg-1)] hover:border-[var(--color-accent)] transition-all shrink-0"
                      >
                        <span>{phoneCountry.flag}</span>
                        <span className="font-mono text-[var(--color-fg-4)]">{phoneCountry.dial}</span>
                      </button>

                      {showCountryPicker && (
                        <div className="absolute left-0 top-full mt-2 w-64 bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-2xl shadow-2xl z-50 p-2 max-h-52 overflow-y-auto">
                          <input
                            type="text"
                            placeholder="Buscar país..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] px-2.5 py-1.5 rounded-lg text-xs text-[var(--color-fg-1)] mb-2 outline-none"
                          />
                          {COUNTRIES.filter(c => !countrySearch || c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.dial.includes(countrySearch)).map(c => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => { setPhoneCountry(c); setShowCountryPicker(false); }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left hover:bg-[var(--color-ink-2)] rounded-lg text-[var(--color-fg-2)] hover:text-[var(--color-fg-1)]"
                            >
                              <span>{c.flag}</span>
                              <span className="font-mono text-[var(--color-fg-4)] text-[10px] w-10">{c.dial}</span>
                              <span className="truncate">{c.name}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <input
                        type="tel"
                        value={localPhone}
                        onChange={(e) => setLocalPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="612345678"
                        className="flex-1 bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] px-3 py-2.5 rounded-xl text-sm text-[var(--color-fg-1)] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSavePhone}
                    disabled={settingsLoading}
                    className="w-full py-2.5 bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-semibold text-xs rounded-xl hover:brightness-110 transition-all shadow-[0_0_15px_rgba(192,132,252,0.2)] disabled:opacity-50"
                  >
                    {settingsLoading ? "Guardando..." : "Guardar Teléfono"}
                  </button>
                </div>
              )}

              {/* Email Tab */}
              {settingsTab === "email" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-[var(--color-fg-4)] mb-1.5 block">Email Actual</label>
                    <input
                      type="email"
                      value={currentEmail}
                      onChange={(e) => setCurrentEmail(e.target.value)}
                      placeholder={user.email}
                      className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] px-3 py-2.5 rounded-xl text-sm text-[var(--color-fg-1)] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono uppercase text-[var(--color-fg-4)] mb-1.5 block">Nuevo Email</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="nuevo@email.com"
                      className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] px-3 py-2.5 rounded-xl text-sm text-[var(--color-fg-1)] outline-none transition-all"
                    />
                  </div>
                  <button
                    onClick={handleChangeEmail}
                    disabled={settingsLoading}
                    className="w-full py-2.5 bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-semibold text-xs rounded-xl hover:brightness-110 transition-all shadow-[0_0_15px_rgba(192,132,252,0.2)] disabled:opacity-50"
                  >
                    {settingsLoading ? "Actualizando..." : "Actualizar Email"}
                  </button>
                </div>
              )}

              {/* Password Tab */}
              {settingsTab === "password" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-[var(--color-fg-4)] mb-1.5 block">Contraseña Actual</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] px-3 py-2.5 rounded-xl text-sm text-[var(--color-fg-1)] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono uppercase text-[var(--color-fg-4)] mb-1.5 block">Nueva Contraseña (mín. 8 caracteres)</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] px-3 py-2.5 rounded-xl text-sm text-[var(--color-fg-1)] outline-none transition-all"
                    />
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={settingsLoading}
                    className="w-full py-2.5 bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-semibold text-xs rounded-xl hover:brightness-110 transition-all shadow-[0_0_15px_rgba(192,132,252,0.2)] disabled:opacity-50"
                  >
                    {settingsLoading ? "Cambiando..." : "Cambiar Contraseña"}
                  </button>
                </div>
              )}

              {/* Danger Zone */}
              {settingsTab === "danger" && (
                <div className="space-y-4">
                  <div className="p-4 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-2xl">
                    <p className="text-xs font-bold text-[var(--color-danger)] mb-1">Zona de Peligro</p>
                    <p className="text-xs text-[var(--color-fg-4)] leading-relaxed">
                      Esta acción eliminará permanentemente tu cuenta, tus fondos registrados y todo tu historial. No se puede deshacer.
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] font-mono uppercase text-[var(--color-fg-4)] mb-1.5 block">Introduce tu contraseña para confirmar</label>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="w-full bg-[var(--color-ink-2)] border border-[var(--color-danger)]/40 focus:border-[var(--color-danger)] px-3 py-2.5 rounded-xl text-sm text-[var(--color-fg-1)] outline-none transition-all"
                    />
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={settingsLoading}
                    className="w-full py-2.5 bg-[var(--color-danger)] text-[var(--color-fg-1)] font-bold text-xs rounded-xl hover:brightness-110 transition-all shadow-[0_0_15px_rgba(255,90,74,0.3)] disabled:opacity-50"
                  >
                    {settingsLoading ? "Eliminando..." : "Eliminar Cuenta Definitivamente"}
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
  );
}
