import { useRef, useState } from "react";
import { api, setToken } from "../api";

export const COUNTRIES = [
  { code: "AF", name: "Afghanistan", dial: "+93", flag: "🇦🇫" },
  { code: "AL", name: "Albania", dial: "+355", flag: "🇦🇱" },
  { code: "DZ", name: "Algeria", dial: "+213", flag: "🇩🇿" },
  { code: "AD", name: "Andorra", dial: "+376", flag: "🇦🇩" },
  { code: "AI", name: "Anguilla", dial: "+1264", flag: "🇦🇮" },
  { code: "AQ", name: "Antarctica", dial: "+672", flag: "🇦🇶" },
  { code: "AO", name: "Angola", dial: "+244", flag: "🇦🇴" },
  { code: "AG", name: "Antigua & Barbuda", dial: "+1", flag: "🇦🇬" },
  { code: "AR", name: "Argentina", dial: "+54", flag: "🇦🇷" },
  { code: "AM", name: "Armenia", dial: "+374", flag: "🇦🇲" },
  { code: "AW", name: "Aruba", dial: "+297", flag: "🇦🇼" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { code: "AT", name: "Austria", dial: "+43", flag: "🇦🇹" },
  { code: "AZ", name: "Azerbaijan", dial: "+994", flag: "🇦🇿" },
  { code: "BS", name: "Bahamas", dial: "+1", flag: "🇧🇸" },
  { code: "BH", name: "Bahrain", dial: "+973", flag: "🇧🇭" },
  { code: "BD", name: "Bangladesh", dial: "+880", flag: "🇧🇩" },
  { code: "BB", name: "Barbados", dial: "+1", flag: "🇧🇧" },
  { code: "BY", name: "Belarus", dial: "+375", flag: "🇧🇾" },
  { code: "BE", name: "Belgium", dial: "+32", flag: "🇧🇪" },
  { code: "BZ", name: "Belize", dial: "+501", flag: "🇧🇿" },
  { code: "BM", name: "Bermuda", dial: "+1441", flag: "🇧🇲" },
  { code: "BJ", name: "Benin", dial: "+229", flag: "🇧🇯" },
  { code: "BT", name: "Bhutan", dial: "+975", flag: "🇧🇹" },
  { code: "BO", name: "Bolivia", dial: "+591", flag: "🇧🇴" },
  { code: "BA", name: "Bosnia & Herzegovina", dial: "+387", flag: "🇧🇦" },
  { code: "BW", name: "Botswana", dial: "+267", flag: "🇧🇼" },
  { code: "BR", name: "Brazil", dial: "+55", flag: "🇧🇷" },
  { code: "IO", name: "British Indian Ocean Territory", dial: "+246", flag: "🇮🇴" },
  { code: "BN", name: "Brunei", dial: "+673", flag: "🇧🇳" },
  { code: "BG", name: "Bulgaria", dial: "+359", flag: "🇧🇬" },
  { code: "BF", name: "Burkina Faso", dial: "+226", flag: "🇧🇫" },
  { code: "BI", name: "Burundi", dial: "+257", flag: "🇧🇮" },
  { code: "KH", name: "Cambodia", dial: "+855", flag: "🇰🇭" },
  { code: "CM", name: "Cameroon", dial: "+237", flag: "🇨🇲" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "CV", name: "Cape Verde", dial: "+238", flag: "🇨🇻" },
  { code: "BQ", name: "Caribbean Netherlands", dial: "+599", flag: "🇧🇶" },
  { code: "KY", name: "Cayman Islands", dial: "+1345", flag: "🇰🇾" },
  { code: "CF", name: "Central African Republic", dial: "+236", flag: "🇨🇫" },
  { code: "TD", name: "Chad", dial: "+235", flag: "🇹🇩" },
  { code: "CL", name: "Chile", dial: "+56", flag: "🇨🇱" },
  { code: "CN", name: "China", dial: "+86", flag: "🇨🇳" },
  { code: "CX", name: "Christmas Island", dial: "+61", flag: "🇨🇽" },
  { code: "CC", name: "Cocos (Keeling) Islands", dial: "+61", flag: "🇨🇨" },
  { code: "CO", name: "Colombia", dial: "+57", flag: "🇨🇴" },
  { code: "KM", name: "Comoros", dial: "+269", flag: "🇰🇲" },
  { code: "CK", name: "Cook Islands", dial: "+682", flag: "🇨🇰" },
  { code: "CG", name: "Congo", dial: "+242", flag: "🇨🇬" },
  { code: "CD", name: "Congo (DRC)", dial: "+243", flag: "🇨🇩" },
  { code: "CR", name: "Costa Rica", dial: "+506", flag: "🇨🇷" },
  { code: "CI", name: "Côte d'Ivoire", dial: "+225", flag: "🇨🇮" },
  { code: "HR", name: "Croatia", dial: "+385", flag: "🇭🇷" },
  { code: "CU", name: "Cuba", dial: "+53", flag: "🇨🇺" },
  { code: "CW", name: "Curaçao", dial: "+599", flag: "🇨🇼" },
  { code: "CY", name: "Cyprus", dial: "+357", flag: "🇨🇾" },
  { code: "CZ", name: "Czech Republic", dial: "+420", flag: "🇨🇿" },
  { code: "DK", name: "Denmark", dial: "+45", flag: "🇩🇰" },
  { code: "DJ", name: "Djibouti", dial: "+253", flag: "🇩🇯" },
  { code: "DM", name: "Dominica", dial: "+1", flag: "🇩🇲" },
  { code: "DO", name: "Dominican Republic", dial: "+1", flag: "🇩🇴" },
  { code: "EC", name: "Ecuador", dial: "+593", flag: "🇪🇨" },
  { code: "EG", name: "Egypt", dial: "+20", flag: "🇪🇬" },
  { code: "SV", name: "El Salvador", dial: "+503", flag: "🇸🇻" },
  { code: "GQ", name: "Equatorial Guinea", dial: "+240", flag: "🇬🇶" },
  { code: "ER", name: "Eritrea", dial: "+291", flag: "🇪🇷" },
  { code: "EE", name: "Estonia", dial: "+372", flag: "🇪🇪" },
  { code: "SZ", name: "Eswatini", dial: "+268", flag: "🇸🇿" },
  { code: "ET", name: "Ethiopia", dial: "+251", flag: "🇪🇹" },
  { code: "FK", name: "Falkland Islands", dial: "+500", flag: "🇫🇰" },
  { code: "FO", name: "Faroe Islands", dial: "+298", flag: "🇫🇴" },
  { code: "FJ", name: "Fiji", dial: "+679", flag: "🇫🇯" },
  { code: "FI", name: "Finland", dial: "+358", flag: "🇫🇮" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "GF", name: "French Guiana", dial: "+594", flag: "🇬🇫" },
  { code: "PF", name: "French Polynesia", dial: "+689", flag: "🇵🇫" },
  { code: "TF", name: "French Southern Territories", dial: "+262", flag: "🇹🇫" },
  { code: "GA", name: "Gabon", dial: "+241", flag: "🇬🇦" },
  { code: "GM", name: "Gambia", dial: "+220", flag: "🇬🇲" },
  { code: "GE", name: "Georgia", dial: "+995", flag: "🇬🇪" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
  { code: "GH", name: "Ghana", dial: "+233", flag: "🇬🇭" },
  { code: "GI", name: "Gibraltar", dial: "+350", flag: "🇬🇮" },
  { code: "GR", name: "Greece", dial: "+30", flag: "🇬🇷" },
  { code: "GD", name: "Grenada", dial: "+1", flag: "🇬🇩" },
  { code: "GL", name: "Greenland", dial: "+299", flag: "🇬🇱" },
  { code: "GP", name: "Guadeloupe", dial: "+590", flag: "🇬🇵" },
  { code: "GU", name: "Guam", dial: "+1671", flag: "🇬🇺" },
  { code: "GT", name: "Guatemala", dial: "+502", flag: "🇬🇹" },
  { code: "GN", name: "Guinea", dial: "+224", flag: "🇬🇳" },
  { code: "GW", name: "Guinea-Bissau", dial: "+245", flag: "🇬🇼" },
  { code: "GY", name: "Guyana", dial: "+592", flag: "🇬🇾" },
  { code: "HT", name: "Haiti", dial: "+509", flag: "🇭🇹" },
  { code: "HN", name: "Honduras", dial: "+504", flag: "🇭🇳" },
  { code: "HK", name: "Hong Kong", dial: "+852", flag: "🇭🇰" },
  { code: "HU", name: "Hungary", dial: "+36", flag: "🇭🇺" },
  { code: "IS", name: "Iceland", dial: "+354", flag: "🇮🇸" },
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "ID", name: "Indonesia", dial: "+62", flag: "🇮🇩" },
  { code: "IR", name: "Iran", dial: "+98", flag: "🇮🇷" },
  { code: "IQ", name: "Iraq", dial: "+964", flag: "🇮🇶" },
  { code: "IE", name: "Ireland", dial: "+353", flag: "🇮🇪" },
  { code: "IM", name: "Isle of Man", dial: "+44", flag: "🇮🇲" },
  { code: "IL", name: "Israel", dial: "+972", flag: "🇮🇱" },
  { code: "IT", name: "Italy", dial: "+39", flag: "🇮🇹" },
  { code: "JM", name: "Jamaica", dial: "+1", flag: "🇯🇲" },
  { code: "JP", name: "Japan", dial: "+81", flag: "🇯🇵" },
  { code: "JE", name: "Jersey", dial: "+44", flag: "🇯🇪" },
  { code: "JO", name: "Jordan", dial: "+962", flag: "🇯🇴" },
  { code: "KZ", name: "Kazakhstan", dial: "+7", flag: "🇰🇿" },
  { code: "KE", name: "Kenya", dial: "+254", flag: "🇰🇪" },
  { code: "KI", name: "Kiribati", dial: "+686", flag: "🇰🇮" },
  { code: "XK", name: "Kosovo", dial: "+383", flag: "🇽🇰" },
  { code: "KW", name: "Kuwait", dial: "+965", flag: "🇰🇼" },
  { code: "KG", name: "Kyrgyzstan", dial: "+996", flag: "🇰🇬" },
  { code: "LA", name: "Laos", dial: "+856", flag: "🇱🇦" },
  { code: "LV", name: "Latvia", dial: "+371", flag: "🇱🇻" },
  { code: "LB", name: "Lebanon", dial: "+961", flag: "🇱🇧" },
  { code: "LS", name: "Lesotho", dial: "+266", flag: "🇱🇸" },
  { code: "LR", name: "Liberia", dial: "+231", flag: "🇱🇷" },
  { code: "LY", name: "Libya", dial: "+218", flag: "🇱🇾" },
  { code: "LI", name: "Liechtenstein", dial: "+423", flag: "🇱🇮" },
  { code: "LT", name: "Lithuania", dial: "+370", flag: "🇱🇹" },
  { code: "LU", name: "Luxembourg", dial: "+352", flag: "🇱🇺" },
  { code: "MO", name: "Macau", dial: "+853", flag: "🇲🇴" },
  { code: "MG", name: "Madagascar", dial: "+261", flag: "🇲🇬" },
  { code: "MW", name: "Malawi", dial: "+265", flag: "🇲🇼" },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾" },
  { code: "MV", name: "Maldives", dial: "+960", flag: "🇲🇻" },
  { code: "ML", name: "Mali", dial: "+223", flag: "🇲🇱" },
  { code: "MT", name: "Malta", dial: "+356", flag: "🇲🇹" },
  { code: "MH", name: "Marshall Islands", dial: "+692", flag: "🇲🇭" },
  { code: "MR", name: "Mauritania", dial: "+222", flag: "🇲🇷" },
  { code: "MU", name: "Mauritius", dial: "+230", flag: "🇲🇺" },
  { code: "MX", name: "México", dial: "+52", flag: "🇲🇽" },
  { code: "FM", name: "Micronesia", dial: "+691", flag: "🇫🇲" },
  { code: "MD", name: "Moldova", dial: "+373", flag: "🇲🇩" },
  { code: "MC", name: "Monaco", dial: "+377", flag: "🇲🇨" },
  { code: "MN", name: "Mongolia", dial: "+976", flag: "🇲🇳" },
  { code: "ME", name: "Montenegro", dial: "+382", flag: "🇲🇪" },
  { code: "MS", name: "Montserrat", dial: "+1664", flag: "🇲🇸" },
  { code: "MA", name: "Morocco", dial: "+212", flag: "🇲🇦" },
  { code: "MZ", name: "Mozambique", dial: "+258", flag: "🇲🇿" },
  { code: "MM", name: "Myanmar", dial: "+95", flag: "🇲🇲" },
  { code: "NA", name: "Namibia", dial: "+264", flag: "🇳🇦" },
  { code: "NR", name: "Nauru", dial: "+674", flag: "🇳🇷" },
  { code: "NP", name: "Nepal", dial: "+977", flag: "🇳🇵" },
  { code: "NL", name: "Netherlands", dial: "+31", flag: "🇳🇱" },
  { code: "NC", name: "New Caledonia", dial: "+687", flag: "🇳🇨" },
  { code: "NZ", name: "New Zealand", dial: "+64", flag: "🇳🇿" },
  { code: "NI", name: "Nicaragua", dial: "+505", flag: "🇳🇮" },
  { code: "NE", name: "Niger", dial: "+227", flag: "🇳🇪" },
  { code: "NG", name: "Nigeria", dial: "+234", flag: "🇳🇬" },
  { code: "KP", name: "North Korea", dial: "+850", flag: "🇰🇵" },
  { code: "MK", name: "North Macedonia", dial: "+389", flag: "🇲🇰" },
  { code: "NF", name: "Norfolk Island", dial: "+672", flag: "🇳🇫" },
  { code: "MP", name: "Northern Mariana Islands", dial: "+1670", flag: "🇲🇵" },
  { code: "NO", name: "Norway", dial: "+47", flag: "🇳🇴" },
  { code: "OM", name: "Oman", dial: "+968", flag: "🇴🇲" },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰" },
  { code: "PW", name: "Palau", dial: "+680", flag: "🇵🇼" },
  { code: "PS", name: "Palestine", dial: "+970", flag: "🇵🇸" },
  { code: "PA", name: "Panamá", dial: "+507", flag: "🇵🇦" },
  { code: "PG", name: "Papua New Guinea", dial: "+675", flag: "🇵🇬" },
  { code: "PY", name: "Paraguay", dial: "+595", flag: "🇵🇾" },
  { code: "PE", name: "Perú", dial: "+51", flag: "🇵🇪" },
  { code: "PH", name: "Philippines", dial: "+63", flag: "🇵🇭" },
  { code: "PL", name: "Poland", dial: "+48", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", dial: "+351", flag: "🇵🇹" },
  { code: "PR", name: "Puerto Rico", dial: "+1", flag: "🇵🇷" },
  { code: "QA", name: "Qatar", dial: "+974", flag: "🇶🇦" },
  { code: "RE", name: "Réunion", dial: "+262", flag: "🇷🇪" },
  { code: "RO", name: "Romania", dial: "+40", flag: "🇷🇴" },
  { code: "RU", name: "Russia", dial: "+7", flag: "🇷🇺" },
  { code: "RW", name: "Rwanda", dial: "+250", flag: "🇷🇼" },
  { code: "KN", name: "Saint Kitts & Nevis", dial: "+1", flag: "🇰🇳" },
  { code: "LC", name: "Saint Lucia", dial: "+1", flag: "🇱🇨" },
  { code: "VC", name: "Saint Vincent", dial: "+1", flag: "🇻🇨" },
  { code: "WS", name: "Samoa", dial: "+685", flag: "🇼🇸" },
  { code: "SM", name: "San Marino", dial: "+378", flag: "🇸🇲" },
  { code: "ST", name: "São Tomé & Príncipe", dial: "+239", flag: "🇸🇹" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { code: "SN", name: "Senegal", dial: "+221", flag: "🇸🇳" },
  { code: "RS", name: "Serbia", dial: "+381", flag: "🇷🇸" },
  { code: "SC", name: "Seychelles", dial: "+248", flag: "🇸🇨" },
  { code: "SL", name: "Sierra Leone", dial: "+232", flag: "🇸🇱" },
  { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬" },
  { code: "SK", name: "Slovakia", dial: "+421", flag: "🇸🇰" },
  { code: "SI", name: "Slovenia", dial: "+386", flag: "🇸🇮" },
  { code: "SB", name: "Solomon Islands", dial: "+677", flag: "🇸🇧" },
  { code: "SO", name: "Somalia", dial: "+252", flag: "🇸🇴" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦" },
  { code: "KR", name: "South Korea", dial: "+82", flag: "🇰🇷" },
  { code: "SS", name: "South Sudan", dial: "+211", flag: "🇸🇸" },
  { code: "ES", name: "España", dial: "+34", flag: "🇪🇸" },
  { code: "LK", name: "Sri Lanka", dial: "+94", flag: "🇱🇰" },
  { code: "SD", name: "Sudan", dial: "+249", flag: "🇸🇩" },
  { code: "SR", name: "Suriname", dial: "+597", flag: "🇸🇷" },
  { code: "SE", name: "Sweden", dial: "+46", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", dial: "+41", flag: "🇨🇭" },
  { code: "SY", name: "Syria", dial: "+963", flag: "🇸🇾" },
  { code: "TW", name: "Taiwan", dial: "+886", flag: "🇹🇼" },
  { code: "TJ", name: "Tajikistan", dial: "+992", flag: "🇹🇯" },
  { code: "TZ", name: "Tanzania", dial: "+255", flag: "🇹🇿" },
  { code: "TH", name: "Thailand", dial: "+66", flag: "🇹🇭" },
  { code: "TL", name: "Timor-Leste", dial: "+670", flag: "🇹🇱" },
  { code: "TG", name: "Togo", dial: "+228", flag: "🇹🇬" },
  { code: "TO", name: "Tonga", dial: "+676", flag: "🇹🇴" },
  { code: "TT", name: "Trinidad & Tobago", dial: "+1", flag: "🇹🇹" },
  { code: "TN", name: "Tunisia", dial: "+216", flag: "🇹🇳" },
  { code: "TR", name: "Turkey", dial: "+90", flag: "🇹🇷" },
  { code: "TM", name: "Turkmenistan", dial: "+993", flag: "🇹🇲" },
  { code: "TV", name: "Tuvalu", dial: "+688", flag: "🇹🇻" },
  { code: "UG", name: "Uganda", dial: "+256", flag: "🇺🇬" },
  { code: "UA", name: "Ukraine", dial: "+380", flag: "🇺🇦" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "UY", name: "Uruguay", dial: "+598", flag: "🇺🇾" },
  { code: "UZ", name: "Uzbekistan", dial: "+998", flag: "🇺🇿" },
  { code: "VU", name: "Vanuatu", dial: "+678", flag: "🇻🇺" },
  { code: "VA", name: "Vatican City", dial: "+379", flag: "🇻🇦" },
  { code: "VE", name: "Venezuela", dial: "+58", flag: "🇻🇪" },
  { code: "VN", name: "Vietnam", dial: "+84", flag: "🇻🇳" },
  { code: "VG", name: "Virgin Islands (British)", dial: "+1284", flag: "🇻🇬" },
  { code: "VI", name: "Virgin Islands (US)", dial: "+1340", flag: "🇻🇮" },
  { code: "YE", name: "Yemen", dial: "+967", flag: "🇾🇪" },
  { code: "ZM", name: "Zambia", dial: "+260", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe", dial: "+263", flag: "🇿🇼" },
];

type Props = {
  onAuth: () => void;
  onSwitchToLogin: () => void;
};

export function RegisterPage({ onAuth, onSwitchToLogin }: Props) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c => c.code === "ES") ?? COUNTRIES[0]);
  const [localNumber, setLocalNumber] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (username.length < 3) {
      setError("Username needs at least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Only letters, numbers, and underscores in username");
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setError("Enter a valid email");
      return;
    }
    if (password.length < 8) { setError("Mínimo 8 caracteres"); return; }
    if (!/[A-Z]/.test(password)) { setError("Requiere al menos una mayúscula"); return; }
    if (!/[a-z]/.test(password)) { setError("Requiere al menos una minúscula"); return; }
    if (!/[0-9]/.test(password)) { setError("Requiere al menos un número"); return; }

    setLoading(true);
    try {
      const fullPhone = localNumber ? `${selectedCountry.dial}${localNumber}` : "";
      const result = await api.register({ username, email, password, phone: fullPhone || undefined });
      setToken(result.token);
      onAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[var(--color-accent)]/5 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Main Container */}
      <div className="w-full max-w-[1000px] flex flex-col lg:flex-row rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] relative z-10 fade-in border border-white/10 bg-black/40 backdrop-blur-2xl">
        
        {/* LEFT COLUMN: Features & Branding */}
        <div className="w-full lg:w-[50%] p-8 sm:p-12 relative overflow-hidden flex flex-col justify-center">
          {/* Subtle Grid Background (Perspective) */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(57,255,136,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,136,0.2) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              transform: 'perspective(500px) rotateX(60deg) scale(2.5) translateY(-50%)'
            }}
          />
          {/* Gradient Overlay for the grid to fade it out nicely */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/80 pointer-events-none" />

          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="w-8 h-8 bg-[var(--color-accent)]/20 rounded-lg flex items-center justify-center border border-[var(--color-accent)]/30">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7"></path>
                  <path d="M7 7h10v10"></path>
                </svg>
              </div>
              <span className="font-heading font-bold text-lg text-white tracking-wide">FondTracker</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
              Elevate your portfolio
            </h1>
            <p className="text-[var(--color-fg-4)] text-sm mb-12 flex items-center gap-2 font-medium">
              <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              No credit card required
            </p>

            <div className="space-y-8">
              {/* Feature 1 */}
              <div className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1 text-[15px]">Track unlimited assets</h3>
                  <p className="text-[var(--color-fg-4)] text-[13px] leading-relaxed">
                    Add and monitor as many investment funds and ETFs as you need without arbitrary restrictions. Build your ultimate dashboard.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1 text-[15px]">Real-time accuracy</h3>
                  <p className="text-[var(--color-fg-4)] text-[13px] leading-relaxed">
                    Prices and NAVs are automatically synced every single day to ensure your portfolio valuation is always up to date.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1 text-[15px]">Built-in privacy</h3>
                  <p className="text-[var(--color-fg-4)] text-[13px] leading-relaxed">
                    Your financial data is yours. We don't sell data to third parties, and our architecture is designed to keep you in control.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Form */}
        <div className="w-full lg:w-[50%] p-8 sm:p-12 bg-black/30 border-l border-white/5 flex flex-col justify-center">
          
          <div className="flex items-center gap-3 mb-8">
            <span className="text-[13px] text-[var(--color-fg-4)] font-medium">Register with</span>
            <div className="flex gap-2">
              <a href="/api/auth/google" className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                <span className="text-[13px] text-[var(--color-fg-2)]">Google</span>
              </a>
              <a href="/api/auth/github" className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.285 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                <span className="text-[13px] text-[var(--color-fg-2)]">GitHub</span>
              </a>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="block text-[13px] text-[var(--color-fg-1)] font-medium">Username</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-fg-4)]">
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 focus:border-[var(--color-accent)]/50 focus:bg-black/60 text-[var(--color-fg-1)] text-sm pl-11 pr-3 py-3.5 rounded-lg outline-none transition-all placeholder:text-[var(--color-fg-5)]"
                  placeholder="Username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[13px] text-[var(--color-fg-1)] font-medium">Email</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-fg-4)]">
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 focus:border-[var(--color-accent)]/50 focus:bg-black/60 text-[var(--color-fg-1)] text-sm pl-11 pr-3 py-3.5 rounded-lg outline-none transition-all placeholder:text-[var(--color-fg-5)]"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[13px] text-[var(--color-fg-1)] font-medium">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-fg-4)]">
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 focus:border-[var(--color-accent)]/50 focus:bg-black/60 text-[var(--color-fg-1)] text-sm pl-11 pr-3 py-3.5 rounded-lg outline-none transition-all placeholder:text-[var(--color-fg-5)]"
                  placeholder="Password"
                />
              </div>
              <p className="text-[11px] text-[var(--color-fg-4)] mt-1 ml-1">Minimum length is 8 characters.</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[13px] text-[var(--color-fg-1)] font-medium">Phone <span className="text-[var(--color-fg-5)]">(optional)</span></label>
              <div className="flex gap-2">
                <div className="relative shrink-0" ref={countryRef}>
                  <button
                    type="button"
                    onClick={() => { setShowCountryPicker(!showCountryPicker); setCountrySearch(""); }}
                    className="flex items-center gap-1.5 bg-black/40 border border-white/5 hover:border-white/20 text-[var(--color-fg-1)] text-sm px-2.5 py-3.5 rounded-lg outline-none transition-all min-w-[90px]"
                  >
                    <span className="text-base leading-none">{selectedCountry.flag}</span>
                    <span className="font-mono text-xs">{selectedCountry.dial}</span>
                    <svg className={`w-3 h-3 text-[var(--color-fg-4)] transition-transform ${showCountryPicker ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showCountryPicker && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowCountryPicker(false)} />
                      <div className="absolute bottom-full left-0 mb-2 z-50 w-72 bg-[#0d0d0f]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                        <div className="p-2 border-b border-white/5">
                          <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-fg-4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                              type="text"
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              placeholder="Search country..."
                              className="w-full bg-black/60 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-[var(--color-fg-1)] placeholder:text-[var(--color-fg-5)] outline-none focus:border-[var(--color-accent)]/50 transition-colors"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-52 overflow-y-auto">
                          {COUNTRIES.filter(c =>
                            !countrySearch ||
                            c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                            c.dial.includes(countrySearch) ||
                            c.code.toLowerCase().includes(countrySearch.toLowerCase())
                          ).map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => { setSelectedCountry(c); setShowCountryPicker(false); }}
                              className={`flex items-center gap-3 w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/5 border-l-2 ${selectedCountry.code === c.code ? "border-[var(--color-accent)] bg-white/5 text-white" : "border-transparent text-[var(--color-fg-2)]"}`}
                            >
                              <span className="text-base w-6 text-center">{c.flag}</span>
                              <span className="font-mono text-xs text-[var(--color-fg-4)] w-14">{c.dial}</span>
                              <span className="text-xs truncate">{c.name}</span>
                            </button>
                          ))}
                          {COUNTRIES.filter(c =>
                            !countrySearch ||
                            c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                            c.dial.includes(countrySearch) ||
                            c.code.toLowerCase().includes(countrySearch.toLowerCase())
                          ).length === 0 && (
                            <div className="px-4 py-8 text-center text-xs text-[var(--color-fg-5)]">No countries found</div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-fg-4)]">
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  </span>
                  <input
                    type="tel"
                    value={localNumber}
                    onChange={(e) => setLocalNumber(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-black/40 border border-white/5 focus:border-[var(--color-accent)]/50 focus:bg-black/60 text-[var(--color-fg-1)] text-sm pl-11 pr-3 py-3.5 rounded-lg outline-none transition-all placeholder:text-[var(--color-fg-5)]"
                    placeholder="612345678"
                  />
                </div>
              </div>
              <p className="text-[11px] text-[var(--color-fg-4)] mt-1 ml-1">Used for WhatsApp notifications. Select your country and enter your number.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[var(--color-danger)] text-xs font-mono bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 px-3 py-2 rounded-md">
                <span className="shrink-0">!</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !email || !password}
              className="w-full bg-[var(--color-accent)] text-[#0a0a0a] font-semibold text-sm py-4 rounded-lg hover:brightness-110 active:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-[11px] text-[var(--color-fg-4)] leading-relaxed mt-6">
            By creating an account, you agree to our <a href="/legal/terms-of-service" target="_blank" className="text-[var(--color-fg-2)] hover:text-white underline">Terms of Service</a> and <a href="/legal/privacy-policy" target="_blank" className="text-[var(--color-fg-2)] hover:text-white underline">Privacy Policy</a>.
          </p>

          <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
             <span className="text-[13px] text-[var(--color-fg-4)]">Already have an account?</span>
             <button
               onClick={onSwitchToLogin}
               className="text-[13px] text-white font-medium hover:text-[var(--color-accent)] transition-colors"
             >
               Sign In &rarr;
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}
