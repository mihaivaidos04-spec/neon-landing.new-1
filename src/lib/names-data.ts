/**
 * Lista de nume pentru social proof – donatori și cumpărători.
 * Folosită de random-names.ts pentru varietate.
 */

import type { ContentLocale } from "./content-i18n";

export const USERNAMES_BY_LOCALE: Record<ContentLocale, string[]> = {
  ro: [
    "Mihai_Fara_Filtre", "Jonathan_Imperfectul_Tau", "Darius_Vibe_Check", "Andra_Searching_24",
    "Solo_Cezar_92", "Elena_Nu_Stau_Mult", "Vlad_Noaptea", "Ioana_Secret_Agent",
    "Cosmin_Offline_Mode", "Ana_Doar_Curioasa", "Radu_Un_Filtru_Doar", "Cristina_Vibe_Only_RO",
    "Alexandru_92_Live", "Diana_Searching_România", "Mihnea_Solo_Weekend", "Teodora_Camera_On",
    "Andrei_No_Limits", "Maria_Imperfect_Real", "Stefan_Chill_Mode", "Laura_Noaptea_Albastra",
    "Bogdan_Fara_Filtre_2", "Simona_Just_Vibes", "Catalin_92_Solo", "Raluca_Secret_Vibe",
    "Dragos_One_More_Match", "Georgiana_Lost_In_Neon", "Tudor_Midnight_Loner", "Adina_Real_Talk_Only",
    "Ionut_Searching_24h", "Oana_Imperfectul_Tau",
  ],
  en: [
    "Midnight_Loner_X", "Lost_In_Neon", "Not_Your_Typical_John", "Sara_Vibe_Only",
    "The_Real_Alex_P", "Jake_No_Filters_92", "Emma_Just_Curious", "Chris_Stealth_Mode",
    "Maya_One_More_Swipe", "Leo_Solo_Weekend", "Zoe_Real_Vibes_Only", "Max_Searching_24",
    "Olivia_Imperfect_Real", "Noah_Camera_On_Late", "Ava_Chill_Connection", "Liam_No_Limits_X",
    "Sophia_Secret_Agent_99", "Ethan_Vibe_Check_Daily", "Isabella_Offline_But_Here", "Mason_Just_One_More",
    "Mia_Lost_In_Chat", "Lucas_Stealth_Vibes", "Charlotte_Real_Talk_Only", "Henry_Midnight_Solo",
    "Amelia_No_Filters_Zone", "Sebastian_Searching_4_U", "Harper_Imperfect_Cool", "Jack_Vibe_Only_Club",
    "Ella_Solo_But_Open", "Aiden_Neon_Nights_88",
  ],
  de: [
    "Berlin_Nacht_88", "Hannah_Ohne_Filter", "Lukas_Solo_Wochenende", "Anna_Vibe_Check_DE",
    "Felix_Stealth_Modus", "Laura_Such_Noch_24", "Max_Real_Talk_Nur", "Julia_Geheim_Agent",
    "Paul_Eine_Noch", "Sophie_Mitternacht_Solo", "Leon_Imperfekt_Real", "Emma_Kamera_An_Spät",
    "Tim_Noch_Ein_Match", "Lena_Chill_Connection", "Jonas_Ohne_Limits", "Marie_Lost_In_Berlin",
    "Nik_Just_Vibes_DE", "Lisa_Searching_DE", "Finn_Real_Vibes_Nur", "Clara_Offline_Aber_Hier",
  ],
  it: [
    "Marco_Senza_Tempo", "Luigi_Solo_Weekend", "Giulia_Vibe_Solo_IT", "Alessandro_Stealth_Mode",
    "Francesca_Una_Ancora", "Lorenzo_Notte_Blu", "Elena_Imperfetto_Reale", "Matteo_Cerca_24",
    "Sofia_Senza_Filtri", "Andrea_Real_Talk_Solo", "Chiara_Agente_Segreto", "Luca_Perso_Nei_Neon",
    "Valentina_Vibe_Check_IT", "Marco_Solo_Sabato", "Giada_Camera_Accesa", "Davide_Un_Altro_Match",
    "Federica_Chill_Connection", "Simone_No_Limits_IT", "Alessia_Mezzanotte_Solo", "Antonio_Just_Vibes_IT",
  ],
  es: [
    "Carlos_Sin_Filtros", "Lucia_Solo_Fin_De", "Pablo_Vibe_Check_ES", "Maria_Una_Mas",
    "Diego_Modo_Stealth", "Elena_Real_Talk_Solo", "Javier_Buscando_24", "Carmen_Agente_Secreto",
    "Miguel_Perdido_En_Neon", "Laura_Imperfecto_Real", "Antonio_Solo_Finde", "Sofia_Camara_Encendida",
    "David_Otro_Match", "Isabel_Chill_Conexion", "Alejandro_Sin_Limites", "Paula_Medianoche_Solo",
    "Raul_Just_Vibes_ES", "Eva_Buscando_ES", "Daniel_Real_Vibes_Solo", "Rocio_Offline_Pero_Aqui",
  ],
  fr: [
    "Pierre_Sans_Filtre", "Marie_Solo_Week_End", "Thomas_Vibe_Check_FR", "Julie_Encore_Une",
    "Nicolas_Mode_Stealth", "Sophie_Parfait_Real", "Lucas_Cherche_24", "Camille_Agent_Secret",
    "Hugo_Perdu_Dans_Neon", "Lea_Real_Talk_Seulement", "Louis_Solo_Samedi", "Chloe_Camera_On_Tard",
    "Arthur_Un_Autre_Match", "Manon_Chill_Connexion", "Raphael_Sans_Limites", "Emma_Minuit_Solo",
    "Gabriel_Just_Vibes_FR", "Charlotte_Cherche_FR", "Jules_Real_Vibes_Seulement", "Sarah_Offline_Mais_La",
  ],
  pt: [
    "Joao_Sem_Filtros", "Ana_Solo_Fim_De", "Pedro_Vibe_Check_PT", "Maria_Mais_Uma",
    "Miguel_Modo_Stealth", "Ines_Real_Talk_So", "Rafael_A_Procurar_24", "Sofia_Agente_Secreto",
    "Tiago_Perdido_No_Neon", "Beatriz_Imperfeito_Real", "Francisco_Solo_Sabado", "Carolina_Camara_Ligada",
    "Rodrigo_Outro_Match", "Mariana_Chill_Conexao", "Duarte_Sem_Limites", "Leonor_Meia_Noite_Solo",
    "Goncalo_Just_Vibes_PT", "Matilde_A_Procurar_PT", "Martim_Real_Vibes_So", "Rita_Offline_Mas_Aqui",
  ],
  nl: [
    "Daan_Zonder_Filters", "Emma_Solo_Weekend", "Luuk_Vibe_Check_NL", "Sophie_Nog_Een",
    "Bram_Stealth_Modus", "Lisa_Real_Talk_Alleen", "Ruben_Zoekt_24", "Eva_Geheim_Agent",
    "Jesse_Verloren_In_Neon", "Anna_Imperfect_Real", "Thomas_Solo_Zaterdag", "Julia_Camera_Aan_Laat",
    "Sem_Nog_Een_Match", "Lotte_Chill_Verbinding", "Noah_Zonder_Limits", "Isa_Middernacht_Solo",
    "Finn_Just_Vibes_NL", "Sanne_Zoekt_NL", "Milan_Real_Vibes_Alleen", "Fleur_Offline_Maar_Hier",
  ],
  pl: [
    "Jakub_Bez_Filtrow", "Zuzanna_Solo_Weekend", "Kacper_Vibe_Check_PL", "Natalia_Jeszcze_Jedna",
    "Michal_Tryb_Stealth", "Wiktoria_Real_Talk_Tylko", "Filip_Szuka_24", "Julia_Tajny_Agent",
    "Szymon_Zgubiony_W_Neon", "Maja_Imperfekcyjna_Real", "Piotr_Solo_Sobota", "Karolina_Kamera_Wlaczona",
    "Bartek_Jeszcze_Jeden_Match", "Aleksandra_Chill_Polaczenie", "Adam_Bez_Limitow", "Ola_Polnoc_Solo",
    "Mateusz_Just_Vibes_PL", "Magda_Szuka_PL", "Kuba_Real_Vibes_Tylko", "Ania_Offline_Ale_Tutaj",
  ],
  tr: [
    "Emre_Filtresiz", "Elif_Solo_Hafta_Sonu", "Can_Vibe_Check_TR", "Zeynep_Bir_Tane_Daha",
    "Burak_Stealth_Mod", "Defne_Real_Talk_Sadece", "Efe_Ariyor_24", "Selin_Gizli_Ajan",
    "Arda_Neonda_Kayip", "Ece_Imperfect_Real", "Kerem_Solo_Cumartesi", "Deniz_Kamera_Acik_Gec",
    "Alp_Bir_Match_Daha", "Ceren_Chill_Baglanti", "Kaan_Limitsiz", "Asli_Gece_Yarisi_Solo",
    "Baris_Just_Vibes_TR", "Melis_Ariyor_TR", "Mert_Real_Vibes_Sadece", "Sude_Offline_Ama_Burada",
  ],
};
