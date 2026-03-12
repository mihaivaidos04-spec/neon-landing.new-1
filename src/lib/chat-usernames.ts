/**
 * Randomizer astronomic pentru nume în chat.
 * Combinații: ~120 prenume × ~120 sufixe × 90 numere = peste 1.2M nume unice per limbă.
 */

import type { ContentLocale } from "./content-i18n";

const FIRST_NAMES: string[] = [
  "Alex", "Mihai", "Andrei", "Vlad", "Cosmin", "Radu", "Stefan", "Bogdan", "Catalin", "Dragos",
  "Tudor", "Ionut", "Darius", "Mihnea", "Jonathan", "Elena", "Ana", "Maria", "Ioana", "Andra",
  "Diana", "Cristina", "Simona", "Raluca", "Georgiana", "Adina", "Oana", "Laura", "Teodora",
  "Sara", "Emma", "Olivia", "Sophia", "Ava", "Isabella", "Mia", "Charlotte", "Amelia", "Harper",
  "Ella", "Jake", "Leo", "Max", "Noah", "Liam", "Ethan", "Mason", "Lucas", "Henry", "Sebastian",
  "Jack", "Aiden", "Chris", "Lukas", "Felix", "Paul", "Leon", "Tim", "Jonas", "Nik", "Finn",
  "Marco", "Luigi", "Alessandro", "Lorenzo", "Matteo", "Andrea", "Luca", "Davide", "Simone", "Antonio",
  "Giulia", "Francesca", "Elena", "Sofia", "Chiara", "Valentina", "Giada", "Alessia", "Federica",
  "Carlos", "Pablo", "Diego", "Javier", "Miguel", "Antonio", "David", "Raul", "Daniel",
  "Lucia", "Maria", "Elena", "Carmen", "Laura", "Sofia", "Isabel", "Paula", "Eva", "Rocio",
  "Pierre", "Thomas", "Nicolas", "Lucas", "Hugo", "Louis", "Arthur", "Raphael", "Gabriel", "Jules",
  "Marie", "Julie", "Sophie", "Camille", "Lea", "Chloe", "Manon", "Emma", "Charlotte", "Sarah",
  "Joao", "Pedro", "Miguel", "Rafael", "Tiago", "Francisco", "Rodrigo", "Duarte", "Goncalo", "Martim",
  "Ana", "Maria", "Ines", "Sofia", "Beatriz", "Carolina", "Mariana", "Leonor", "Matilde", "Rita",
  "Daan", "Luuk", "Bram", "Ruben", "Jesse", "Thomas", "Sem", "Noah", "Finn", "Milan",
  "Emma", "Sophie", "Lisa", "Eva", "Anna", "Julia", "Lotte", "Isa", "Sanne", "Fleur",
  "Jakub", "Kacper", "Michal", "Filip", "Szymon", "Piotr", "Bartek", "Adam", "Mateusz", "Kuba",
  "Zuzanna", "Natalia", "Wiktoria", "Julia", "Maja", "Karolina", "Aleksandra", "Magda", "Ania",
  "Emre", "Can", "Burak", "Efe", "Arda", "Mert", "Kerem", "Baris", "Cem", "Deniz",
  "Elif", "Zeynep", "Defne", "Selin", "Ece", "Beren", "Sude", "Dila", "Azra", "Leyla",
];

const SUFFIXES: string[] = [
  "Vibe_Check", "Searching_24", "Solo_Weekend", "No_Filters", "Stealth_Mode", "Real_Talk",
  "Just_Curious", "One_More_Match", "Chill_Mode", "No_Limits", "Camera_On", "Lost_In_Neon",
  "Secret_Agent", "Offline_But_Here", "Imperfect_Real", "Midnight_Solo", "Real_Vibes",
  "Fara_Filtre", "Imperfectul_Tau", "Nu_Stau_Mult", "Doar_Curioasa", "Un_Filtru_Doar",
  "92_Live", "Searching_România", "Noaptea", "Noaptea_Albastra", "Just_Vibes", "92_Solo",
  "Secret_Vibe", "One_More_Swipe", "No_Filters_92", "Vibe_Only", "Stealth_Vibes",
  "Ohne_Filter", "Solo_Wochenende", "Stealth_Modus", "Such_Noch_24", "Real_Talk_Nur",
  "Geheim_Agent", "Eine_Noch", "Mitternacht_Solo", "Kamera_An_Spät", "Noch_Ein_Match",
  "Senza_Tempo", "Solo_Weekend", "Vibe_Solo_IT", "Stealth_Mode", "Una_Ancora",
  "Notte_Blu", "Cerca_24", "Senza_Filtri", "Agente_Segreto", "Perso_Nei_Neon",
  "Sin_Filtros", "Solo_Fin_De", "Vibe_Check_ES", "Una_Mas", "Modo_Stealth",
  "Buscando_24", "Agente_Secreto", "Perdido_En_Neon", "Solo_Finde", "Camara_Encendida",
  "Sans_Filtre", "Solo_Week_End", "Vibe_Check_FR", "Encore_Une", "Mode_Stealth",
  "Parfait_Real", "Cherche_24", "Agent_Secret", "Perdu_Dans_Neon", "Solo_Samedi",
  "Sem_Filtros", "Solo_Fim_De", "Vibe_Check_PT", "Mais_Uma", "Modo_Stealth",
  "A_Procurar_24", "Agente_Secreto", "Perdido_No_Neon", "Solo_Sabado", "Camara_Ligada",
  "Zonder_Filters", "Solo_Weekend", "Vibe_Check_NL", "Nog_Een", "Stealth_Modus",
  "Zoekt_24", "Geheim_Agent", "Verloren_In_Neon", "Solo_Zaterdag", "Camera_Aan_Laat",
  "Bez_Filtrow", "Solo_Weekend", "Vibe_Check_PL", "Jeszcze_Jedna", "Tryb_Stealth",
  "Szuka_24", "Tajny_Agent", "Zgubiony_W_Neon", "Solo_Sobota", "Kamera_Wlaczona",
  "Filtresiz", "Solo_Hafta_Sonu", "Vibe_Check_TR", "Bir_Tane_Daha", "Stealth_Mod",
  "Ariyor_24", "Gizli_Ajan", "Kayip_Neon", "Cumartesi_Solo", "Kamera_Acik",
  "Random_99", "Live_42", "X_88", "Pro_77", "New_23", "Cool_66", "Chill_55",
];

export function generateRandomUsername(_locale: ContentLocale): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${first}_${suffix}_${num}`;
}
