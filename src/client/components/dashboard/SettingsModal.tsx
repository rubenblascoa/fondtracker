import { useState, useRef, useEffect } from "react";
import { api, type User } from "../../api";
import { useTheme } from "../../theme";
import { COUNTRIES } from "../RegisterPage";
import { X, Sun, Moon, Phone, Mail, Lock, AlertTriangle, ShieldAlert, Check, Globe } from "lucide-react";

type Props = {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  onLogout: () => void;
};

export function SettingsModal({ user, isOpen, onClose, onUserUpdated, onLogout }: Props) {
  const { theme, isDark, isLight, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"appearance" | "phone" | "email" | "password" | "danger">("appearance");

  // Phone state
  const [phoneCountry, setPhoneCountry] = useState(() => COUNTRIES.find(c => c.code === "ES") ?? COUNTRIES[0]);
  const [localPhone, setLocalPhone] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryRef = useRef<HTMLDivElement>(null);

  // Email & Password states
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user?.phone) {
      const matchingCountry = COUNTRIES.slice()
        .sort((a, b) => b.dial.length - a.dial.length)
        .find((c) => user.phone!.startsWith(c.dial));
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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setShowCountryPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  async function handleSavePhone(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const fullPhone = localPhone.trim() ? `${phoneCountry.dial}${localPhone.trim().replace(/\s+/g, "")}` : null;
    try {
      await api.updateAccount({ phone: fullPhone });
      setSuccess("Número de teléfono actualizado");
      onUserUpdated();
    } catch (err: any) {
      setError(err?.message || "Error al actualizar teléfono");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.updateAccount({ email: newEmail, currentEmail });
      setSuccess("Email actualizado correctamente");
      setCurrentEmail("");
      setNewEmail("");
      onUserUpdated();
    } catch (err: any) {
      setError(err?.message || "Error al actualizar email");
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.updateAccount({ currentPassword, newPassword });
      setSuccess("Contraseña cambiada con éxito");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setError(err?.message || "Error al cambiar contraseña");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm("¿Estás 100% seguro de que deseas eliminar tu cuenta y todas tus inversiones?")) return;
    setLoading(true);
    setError("");
    try {
      await api.deleteAccount(deletePassword);
      onLogout();
    } catch (err: any) {
      setError(err?.message || "Error al eliminar la cuenta");
      setLoading(false);
    }
  }

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dial.includes(countrySearch) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-ink-3)] bg-[var(--color-ink-2)]/40">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-fg-1)]">Ajustes de Usuario</h2>
            <p className="text-xs text-[var(--color-fg-4)] mt-0.5">@{user.username} · {user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] hover:bg-[var(--color-ink-3)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--color-ink-3)] bg-[var(--color-ink-2)]/30 overflow-x-auto p-2 gap-1.5">
          <button
            onClick={() => { setActiveTab("appearance"); setError(""); setSuccess(""); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "appearance" ? "bg-[var(--color-ink-1)] text-[var(--color-accent)] border border-[var(--color-ink-3)]" : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-2)]"
            }`}
          >
            Apariencia
          </button>
          <button
            onClick={() => { setActiveTab("phone"); setError(""); setSuccess(""); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "phone" ? "bg-[var(--color-ink-1)] text-[var(--color-accent)] border border-[var(--color-ink-3)]" : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-2)]"
            }`}
          >
            Teléfono & WhatsApp
          </button>
          <button
            onClick={() => { setActiveTab("email"); setError(""); setSuccess(""); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "email" ? "bg-[var(--color-ink-1)] text-[var(--color-accent)] border border-[var(--color-ink-3)]" : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-2)]"
            }`}
          >
            Cambiar Email
          </button>
          <button
            onClick={() => { setActiveTab("password"); setError(""); setSuccess(""); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "password" ? "bg-[var(--color-ink-1)] text-[var(--color-accent)] border border-[var(--color-ink-3)]" : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-2)]"
            }`}
          >
            Contraseña
          </button>
          <button
            onClick={() => { setActiveTab("danger"); setError(""); setSuccess(""); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "danger" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "text-red-400/60 hover:text-red-400"
            }`}
          >
            Zona de Peligro
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs">
              <Check size={16} />
              <span>{success}</span>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[var(--color-fg-1)]">Tema Visual del Dashboard</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all ${
                    isDark ? "bg-[var(--color-ink-2)] border-[var(--color-accent)] shadow-md" : "bg-[var(--color-ink-2)]/40 border-[var(--color-ink-3)] opacity-70"
                  }`}
                >
                  <Moon size={20} className={isDark ? "text-[var(--color-accent)]" : "text-[var(--color-fg-4)]"} />
                  <div>
                    <p className="text-xs font-bold text-[var(--color-fg-1)]">Modo Oscuro</p>
                    <p className="text-[10px] text-[var(--color-fg-4)]">Fondo grafito y acentos neón</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all ${
                    isLight ? "bg-[var(--color-ink-2)] border-[var(--color-accent)] shadow-md" : "bg-[var(--color-ink-2)]/40 border-[var(--color-ink-3)] opacity-70"
                  }`}
                >
                  <Sun size={20} className={isLight ? "text-[var(--color-accent)]" : "text-[var(--color-fg-4)]"} />
                  <div>
                    <p className="text-xs font-bold text-[var(--color-fg-1)]">Modo Claro</p>
                    <p className="text-[10px] text-[var(--color-fg-4)]">Interfaz blanca de alto contraste</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === "phone" && (
            <form onSubmit={handleSavePhone} className="space-y-4">
              <h3 className="text-sm font-bold text-[var(--color-fg-1)]">Número de Teléfono</h3>
              <p className="text-xs text-[var(--color-fg-4)]">
                Utilizado para recibir resúmenes diarios e informes de rentabilidad en tu WhatsApp.
              </p>

              <div className="flex gap-2 relative">
                <div ref={countryRef}>
                  <button
                    type="button"
                    onClick={() => setShowCountryPicker(!showCountryPicker)}
                    className="h-10 px-3 bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl flex items-center gap-1.5 text-xs text-[var(--color-fg-1)] font-mono"
                  >
                    <span>{phoneCountry.flag}</span>
                    <span>{phoneCountry.dial}</span>
                  </button>

                  {showCountryPicker && (
                    <div className="absolute left-0 top-12 z-50 w-64 bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-2 shadow-2xl max-h-60 overflow-y-auto">
                      <input
                        type="text"
                        placeholder="Buscar país o prefijo..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--color-fg-1)] outline-none mb-2"
                      />
                      <div className="space-y-1">
                        {filteredCountries.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => { setPhoneCountry(c); setShowCountryPicker(false); }}
                            className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between hover:bg-[var(--color-ink-3)] text-[var(--color-fg-2)]"
                          >
                            <span>{c.flag} {c.name}</span>
                            <span className="font-mono text-[var(--color-fg-4)]">{c.dial}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <input
                  type="tel"
                  placeholder="612 345 678"
                  value={localPhone}
                  onChange={(e) => setLocalPhone(e.target.value)}
                  className="flex-1 bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] rounded-xl px-3 text-sm text-[var(--color-fg-1)] font-mono outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[var(--color-accent)] text-black font-bold text-xs rounded-xl hover:brightness-110 disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar Teléfono"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "email" && (
            <form onSubmit={handleSaveEmail} className="space-y-4">
              <h3 className="text-sm font-bold text-[var(--color-fg-1)]">Cambiar Dirección de Email</h3>
              <div>
                <label className="text-xs text-[var(--color-fg-4)] block mb-1">Email actual *</label>
                <input
                  type="email"
                  value={currentEmail}
                  onChange={(e) => setCurrentEmail(e.target.value)}
                  required
                  placeholder="introduce tu email actual"
                  className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--color-fg-1)] outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-fg-4)] block mb-1">Nuevo email *</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  placeholder="nuevo@correo.com"
                  className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--color-fg-1)] outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[var(--color-accent)] text-black font-bold text-xs rounded-xl hover:brightness-110 disabled:opacity-50"
                >
                  {loading ? "Actualizando..." : "Actualizar Email"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "password" && (
            <form onSubmit={handleSavePassword} className="space-y-4">
              <h3 className="text-sm font-bold text-[var(--color-fg-1)]">Modificar Contraseña</h3>
              <div>
                <label className="text-xs text-[var(--color-fg-4)] block mb-1">Contraseña actual *</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--color-fg-1)] outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-fg-4)] block mb-1">Nueva contraseña *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Mínimo 8 caracteres, mayúscula, minúscula y número"
                  className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--color-fg-1)] outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[var(--color-accent)] text-black font-bold text-xs rounded-xl hover:brightness-110 disabled:opacity-50"
                >
                  {loading ? "Cambiando..." : "Cambiar Contraseña"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "danger" && (
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                  <ShieldAlert size={16} /> Eliminar Cuenta Definitivamente
                </h3>
                <p className="text-xs text-[var(--color-fg-4)] mt-1">
                  Esta acción borrará todas tus inversiones, historial y transacciones registradas.
                </p>
              </div>
              <div>
                <label className="text-xs text-[var(--color-fg-4)] block mb-1">Confirma tu contraseña para eliminar *</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                  className="w-full bg-[var(--color-ink-2)] border border-red-500/30 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-sm text-[var(--color-fg-1)] outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-red-500 text-white font-bold text-xs rounded-xl hover:bg-red-600 disabled:opacity-50 shadow-md"
                >
                  {loading ? "Eliminando..." : "Eliminar mi cuenta"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
