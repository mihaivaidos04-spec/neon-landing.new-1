/**
 * Display names matched to country flags (ISO 3166-1 alpha-2).
 * Scripts: Arabic, Cyrillic, CJK, Japanese, Korean, Thai, Hebrew, Greek, Indic, etc.
 */

export type NameScript =
  | "latin"
  | "arabic"
  | "cyrillic"
  | "cjk"
  | "japanese"
  | "korean"
  | "thai"
  | "hebrew"
  | "greek"
  | "devanagari"
  | "bengali"
  | "georgian"
  | "armenian"
  | "vietnamese"
  | "sinhala"
  | "myanmar"
  | "khmer"
  | "lao"
  | "ethiopic";

const NAMES: Record<NameScript, string[]> = {
  latin: [
    "Marco_Neon_42", "Sofia_Vibes_88", "Alex_Pulse_17", "Emma_Live_63", "Leo_Match_91",
    "Nina_Stealth_24", "Diego_Flow_55", "Laura_Chat_73", "Tom_Quick_39", "Zoe_Glow_12",
    "Chris_Next_66", "Mia_Real_48", "Sam_Chill_81", "Julia_OK_57", "Ben_Wave_93",
    "Sara_Hey_22", "Max_Cool_74", "Anna_Sup_35", "Dan_Vibe_69", "Eva_Sky_14",
    "Luca_Jump_51", "Ivy_Neon_86", "Noah_Buzz_28", "Lily_Star_97", "Ryan_Link_44",
    "Olivia_Jet_19", "Jack_Moon_62", "Ava_Sun_77", "Luke_Fox_33", "Maya_Bee_58",
    "Felix_K_88", "Clara_R_41", "Paul_S_26", "Nora_T_72", "Adam_U_15",
    "Elena_V_99", "Victor_W_53", "Daria_X_37", "Igor_Y_64", "Yuki_Z_21",
    "Łukasz_Neon_11", "Zuzanna_Vibe_45", "Björn_Ice_78", "Søren_Sea_32", "Åsa_Nord_56",
    "José_Sol_84", "François_Lumi_29", "München_K_67", "București_N_13", "İstanbul_E_95",
    "Christopher_NeonWanderer_Stream",
    "Alexandrina_Midnight_Aurora_Live",
    "Maximilian_Encrypted_Heartbeat_7",
    "Valentinian_Parallel_Dimension_Visitor",
    "Montgomery_Streaming_From_The_Stratosphere",
    "Seraphina_Holographic_Confession_Booth",
    "Konstantinos_Aegean_Neon_Signal_Tower",
    "Guadalupe_Solar_Flare_Chat_Protocol",
    "Wilhelmina_Secret_Agent_Of_The_Grid",
    "Bartholomew_Cosmic_Coffee_And_Chat",
    "Anastasiya_Frostbyte_Matchmaking_Node",
    "Zachariah_Quantum_Curiosity_Overdrive",
    "Constantinopolitan_Phosphorescent_Aurora_Link",
    "Evangelina_Interstellar_Secret_Whisper_Network",
    "Theophilus_Multiversal_Tea_Ceremony_Moderator",
  ],
  arabic: [
    "محمد", "فاطمة", "علي", "نور", "يوسف", "ليلى", "خالد", "سارة", "عمر", "مريم",
    "حسن", "زينب", "طارق", "رنا", "كريم", "هند", "سامي", "دينا", "باسم", "سلمى",
    "أحمد", "آمنة", "مصطفى", "إيمان", "وليد", "شيماء", "تامر", "غادة", "هشام", "نادين",
    "عبدالرحمن", "فاطمةالزهراء", "محمودالسيد", "نورالهدى", "خالدالمحترف",
    "أحمدالنجارللدردشة", "سارةالشاميةالليلية",
  ],
  cyrillic: [
    "Александр", "Мария", "Дмитрий", "Анна", "Иван", "Елена", "Сергей", "Ольга", "Андрей", "Наталья",
    "Михаил", "Татьяна", "Павел", "Юлия", "Николай", "Светлана", "Владимир", "Ирина", "Артём", "Ксения",
    "Олександр", "Катерина", "Богдан", "Соломія", "Георгі", "Марія", "Никола", "Јелена", "Марко", "Ана",
    "Борис", "Виктория", "Стефан", "Магдалена", "Кирил", "Рая", "Петър", "Десислава",
    "Владислав", "Екатерина", "Константин", "Анастасия", "ДмитрийСергеевичНочной",
    "СветланаАлександровнаСтрим", "НиколайПетровичНеоновыйСигнал",
  ],
  cjk: [
    "王伟", "李娜", "张敏", "刘洋", "陈静", "杨洋", "赵磊", "黄婷", "周杰", "吴秀英",
    "林佳慧", "志明", "淑芬", "家豪", "怡君", "俊傑", "詩涵", "承翰", "婉婷", "子軒",
    "陳奕迅", "王心凌", "李沐宸", "張雨霏", "劉昊然",
    "欧阳震华", "司马相如", "诸葛孔明", "上官婉儿", "司徒美堂",
    "慕容晓晓", "东方不败聊天中", "南宫紫霞直播号",
  ],
  japanese: [
    "さくら", "はると", "みお", "ゆうき", "あおい", "けんた", "りな", "そうた", "みゆき", "たくや",
    "ひなた", "しょう", "えみ", "りく", "かなで", "ゆい", "はじめ", "あかり", "だいき", "ももか",
    "やまだたろう", "すずきはなこ", "たなかみどりのライブ",
    "にほんごながいなまえのテストユーザー",
  ],
  korean: [
    "민준", "서연", "도윤", "지우", "예준", "하은", "시우", "수아", "주원", "지민",
    "건우", "서윤", "우진", "채원", "연우", "다은", "현우", "유진", "승민", "소율",
  ],
  thai: [
    "สมชาย", "สมหญิง", "นภา", "ธนา", "ปิยะ", "วิภา", "กิตติ", "มาลี", "อรทัย", "ชาญชัย",
    "พิมพ์", "ณัฐ", "ศุภชัย", "กานต์", "รัตน์", "ทิพย์", "ปวีณ์", "จิรา", "ธีรัจน์", "อภิชญา",
    "พิชัยราชาธิราช", "อรุณรุ่งเรืองทอง", "สุขสมบูรณ์พูลสุข",
  ],
  hebrew: [
    "נועם", "מאיה", "איתי", "שירה", "דניאל", "תמר", "יונתן", "רוני", "עומר", "ליאור",
    "גל", "נועה", "אלון", "הילה", "רועי", "מיכל", "אמיר", "יעל", "שי", "דנה",
  ],
  greek: [
    "Γιώργος", "Μαρία", "Νίκος", "Ελένη", "Δημήτρης", "Σοφία", "Κώστας", "Αννα", "Παύλος", "Χριστίνα",
    "Αλέξανδρος", "Κατερίνα", "Στέφανος", "Βασιλική", "Θοδωρής", "Φωτεινή",
  ],
  devanagari: [
    "अरविन्द", "प्रिया", "राहुल", "अंजली", "विक्रम", "नेहा", "आदित्य", "कविता", "रोहित", "दीपिका",
    "सूरज", "मीना", "करण", "पूजा", "मनोज", "स्नेहा", "हर्ष", "अनुष्का", "यश", "श्रुति",
    "अमित", "रिया", "निखिल", "साक्षी", "विवेक", "तनु",
  ],
  bengali: [
    "রাহুল", "সুমন", "আয়েশা", "ফারহান", "নুসরাত", "তানভীর", "মিম", "সাকিব", "জয়া", "অনিক",
    "তাসনিম", "রাফি", "ইশতিয়াক", "শ্রাবণ", "মেহজাবিন", "অর্ণব", "লামিয়া", "নাফিস",
  ],
  georgian: [
    "გიორგი", "ნინო", "დავით", "მარიამ", "ლუკა", "ანა", "ნიკოლოზ", "თამარ", "საბა", "ქეთი",
    "ლევან", "სალომე", "ზურაბ", "ეკა", "ირაკლი", "ნათია",
  ],
  armenian: [
    "Արմեն", "Անահիտ", "Դավիթ", "Մարիամ", "Հայկ", "Լիլիթ", "Տիգրան", "Նարե", "Գևորգ", "Սոնա",
    "Վահե", "Կարինե", "Սարգիս", "Ելենա", "Արտուր", "Մանե",
  ],
  vietnamese: [
    "Minh_An", "Thanh_Hà", "Quốc_Bảo", "Ngọc_Lan", "Tuấn_Kiệt", "Phương_Linh", "Đức_Minh", "Thảo_Nhi",
    "Hoàng_Nam", "Mai_Chi", "Văn_Hùng", "Hương_Giang", "Trọng_Khánh", "Bích_Ngọc", "Đình_Phúc", "Khánh_Vy",
    "Nguyễn_Thị_Minh_Khai_Stream", "Trần_Văn_Thành_Công_Neon",
  ],
  sinhala: [
    "නිමල්", "සඳුනි", "කසුන්", "මයුරි", "දිල්ෂාන්", "නිශා", "රවින්දු", "සඳුමිණි", "චමින්ද", "තරිඳු",
    "සහනි", "අකිල", "නෙතුමි", "සඳුන්", "කවින්ද", "රුමේෂ්",
  ],
  myanmar: [
    "ကိုကို", "အေးအေးမြင့်", "မျိုးမျိုးအောင်", "သီရိသွင်", "အောင်အောင်", "နေခြည်ဦး", "ဝေယံထိုက်", "စန္ဒာလှိုင်",
    "ထက်လင်း", "မြင့်မြင့်စိုး", "ရွှေမန်း", "သက်တင့်", "ဇော်ဂျီ", "ဖြူဖြူအောင်", "မောင်မောင်", "စိန်စိန်",
  ],
  khmer: [
    "សុខា", "ចាន់តា", "រដ្ឋា", "វណ្ណា", "ពេជ្រ", "ម៉ាលីស", "ធារី", "រស្មី", "ចេស្តា", "វឌ្ឍនា",
    "គឹមសួគ៍", "លីហួរ", "សំណាង", "ចរិយា", "ធន់ធា", "មន្នី",
  ],
  lao: [
    "ສົມສັກ", "ສົມຫວຽງ", "ວິໄລ", "ບຸນມີ", "ຄຳພັນ", "ວົງສະຫວັນ", "ສຸກກະສິນ", "ອຸບັດ", "ພອນສະຫວັນ", "ຈັນທະວົງ",
    "ສິລິວັນ", "ມະນີວັນ", "ວິໄລສັກ", "ບຸນທຳ", "ຄຳພາ", "ສົມພອນ",
  ],
  ethiopic: [
    "አበበ", "ለማ", "ገብረ", "ማርያም", "ዳንኤል", "ሰላም", "ተስፋ", "አስናክ", "ሀና", "ዮናስ",
    "ብርሃን", "አምሃ", "አዲስ", "ሩት", "አብርሃም", "ሚኪያስ", "አስማማው", "ሀይማኖት", "አስናቀ", "ይታላ",
  ],
};

/**
 * Longest username `pickLocalizedUsername` can return (Unicode code points).
 * Non-Latin names append a ·10–·99 suffix (3 code points).
 */
export const MAX_LOCALIZED_USERNAME_CODEPOINTS: number = (() => {
  let m = 0;
  for (const script of Object.keys(NAMES) as NameScript[]) {
    const pool = NAMES[script];
    for (const raw of pool) {
      const decorated = script === "latin" ? raw : `${raw}·99`;
      m = Math.max(m, [...decorated].length);
    }
  }
  return m;
})();

/** ISO2 → script for display names (fallback latin). */
const ISO_TO_SCRIPT: Record<string, NameScript> = {
  // Arabic script / MENA
  SA: "arabic",
  AE: "arabic",
  EG: "arabic",
  IQ: "arabic",
  JO: "arabic",
  LB: "arabic",
  KW: "arabic",
  QA: "arabic",
  BH: "arabic",
  OM: "arabic",
  YE: "arabic",
  SY: "arabic",
  PS: "arabic",
  MA: "arabic",
  DZ: "arabic",
  TN: "arabic",
  LY: "arabic",
  SD: "arabic",
  MR: "arabic",
  DJ: "arabic",
  SO: "arabic",
  KM: "arabic",
  TD: "arabic",
  NE: "arabic",
  ML: "arabic",
  IR: "arabic",
  PK: "arabic",
  AF: "arabic",
  // Cyrillic
  RU: "cyrillic",
  BY: "cyrillic",
  UA: "cyrillic",
  BG: "cyrillic",
  RS: "cyrillic",
  MK: "cyrillic",
  KZ: "cyrillic",
  KG: "cyrillic",
  TJ: "cyrillic",
  MN: "cyrillic",
  UZ: "latin",
  BA: "cyrillic",
  ME: "cyrillic",
  // CJK
  CN: "cjk",
  TW: "cjk",
  HK: "cjk",
  MO: "cjk",
  JP: "japanese",
  KR: "korean",
  TH: "thai",
  LA: "lao",
  KH: "khmer",
  MM: "myanmar",
  ET: "ethiopic",
  IL: "hebrew",
  GR: "greek",
  CY: "greek",
  IN: "devanagari",
  NP: "devanagari",
  BD: "bengali",
  LK: "sinhala",
  GE: "georgian",
  AM: "armenian",
  VN: "vietnamese",
  // Latin-heavy regions stay default
};

function scriptForCountry(countryCode: string): NameScript {
  const cc = countryCode.toUpperCase();
  return ISO_TO_SCRIPT[cc] ?? "latin";
}

export function pickLocalizedUsername(countryCode: string, seed: number): string {
  const cc =
    typeof countryCode === "string" && countryCode.length >= 2
      ? countryCode.slice(0, 2)
      : "US";
  const script = scriptForCountry(cc);
  const pool = NAMES[script] ?? NAMES.latin;
  if (!pool?.length) return "guest";
  const name = pool[Math.abs(seed) % pool.length] ?? pool[0]!;
  if (script === "latin") {
    return name;
  }
  // Subtle suffix so cycle collisions differ; keep script visible
  const tag = (Math.abs(seed) % 89) + 10;
  return `${name}·${tag}`;
}

export function getNameScriptForCountry(countryCode: string): NameScript {
  return scriptForCountry(countryCode);
}
