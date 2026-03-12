/**
 * Legal pages i18n: Termeni și Condiții (T&C) & Politica de Confidențialitate (GDPR).
 * Format structurat pentru RO, EN și restul limbilor configurate.
 */

export type LegalLocale = "ro" | "en" | "de" | "it" | "es" | "fr" | "pt" | "nl" | "pl" | "tr";

export type TermsContent = {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: {
    eligibility: { title: string; body: string };
    account: { title: string; body: string };
    conduct: { title: string; body: string };
    intellectualProperty: { title: string; body: string };
    digitalNoRefund: { title: string; body: string };
    limitationOfLiability: { title: string; body: string };
    changesAndLaw: { title: string; body: string };
  };
};

export type GdprContent = {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: {
    dataController: { title: string; body: string };
    dataCollected: { title: string; body: string };
    noCardStorage: { title: string; body: string };
    purposes: { title: string; body: string };
    legalBasis: { title: string; body: string };
    yourRights: { title: string; body: string };
    cookies: { title: string; body: string };
    securityRetentionContact: { title: string; body: string };
  };
};

const LEGAL_TERMS: Record<LegalLocale, TermsContent> = {
  ro: {
    title: "Termeni și Condiții",
    lastUpdated: "Ultima actualizare: martie 2025",
    intro: "Bine ați venit pe NEON. Utilizând platforma, acceptați prezentele Termeni și Condiții. Vă rugăm să le citiți cu atenție.",
    sections: {
      eligibility: {
        title: "1. Eligibilitate",
        body: "Serviciile NEON sunt rezervate exclusiv persoanelor care au împlinit vârsta de 18 ani. Accesând sau utilizând platforma, declarați și garantați că aveți vârsta legală necesară conform legislației din țara dvs. de reședință. NEON își rezervă dreptul de a verifica vârsta și de a restricționa sau închide conturi în cazul în care eligibilitatea nu poate fi confirmată.",
      },
      account: {
        title: "2. Înregistrarea contului",
        body: "Pentru a accesa anumite funcționalități, este necesară crearea unui cont. Vă angajați să furnizați informații corecte și complete și să mențineți confidențialitatea parolei. Sunteți responsabil pentru toate activitățile desfășurate în contul dvs. NEON poate suspenda sau închide conturi în cazul încălcării acestor termeni.",
      },
      conduct: {
        title: "3. Reguli de conduită",
        body: "Acceptați să utilizați NEON doar în mod legal și respectuos. Este strict interzis: hărțuirea, amenințarea, conținutul obscen sau ilegal, spam-ul, falsul în identitate sau orice comportament care poate deranja sau pune în pericol alți utilizatori. Încălcarea acestor reguli duce la blocare imediată și, după caz, raportare către autorități. Comportamentul indecent duce la banarea instantanee a IP-ului, fără drept la rambursare.",
      },
      intellectualProperty: {
        title: "4. Proprietatea intelectuală",
        body: "Marca NEON, logo-urile, interfața și conținutul original al platformei sunt protejate de drepturile de autor și alte drepturi de proprietate intelectuală. Nu aveți dreptul de a copia, modifica, distribui sau exploata comercial acest conținut fără acordul nostru scris prealabil.",
      },
      digitalNoRefund: {
        title: "5. Furnizare digitală și renunțare la dreptul de retragere",
        body: "Prin achiziționarea de servicii digitale pe NEON (inclusiv filtre, acces prioritar sau alte beneficii), acceptați furnizarea imediată a conținutului digital după confirmarea plății. În conformitate cu Regulamentul (UE) 2011/83/UE privind drepturile consumatorilor, consumatorul își pierde dreptul de retragere în cazul serviciilor ale căror furnizare a început cu acordul expres al consumatorului înainte de expirarea termenului de retragere. Prin urmare, nu se acordă rambursări sau returnări pentru achizițiile de conținut digital efectuate pe platformă, odată ce accesul a fost acordat.",
      },
      limitationOfLiability: {
        title: "6. Limitarea răspunderii",
        body: "NEON este o platformă de divertisment care pune la dispoziție un spațiu de interacțiune între utilizatori. Nu ne asumăm răspunderea pentru conținutul, declarațiile sau acțiunile utilizatorilor, nici pentru rezultatul interacțiunilor dintre aceștia. Utilizați platforma pe propriul risc. Răspunderea noastră este limitată, în măsura permisă de lege, la valoarea plăților efectuate de dvs. în ultimele 12 luni.",
      },
      changesAndLaw: {
        title: "7. Modificări, lege aplicabilă, contact",
        body: "Ne rezervăm dreptul de a modifica acești Termeni. Utilizarea continuată după modificări constituie acceptarea noilor termeni. Legea română este aplicabilă; litigiile sunt de competența instanțelor române. Pentru întrebări legale: contact@neon-platform.com.",
      },
    },
  },
  en: {
    title: "Terms and Conditions",
    lastUpdated: "Last updated: March 2025",
    intro: "Welcome to NEON. By using the platform, you agree to these Terms and Conditions. Please read them carefully.",
    sections: {
      eligibility: {
        title: "1. Eligibility",
        body: "NEON services are reserved exclusively for persons who have reached the age of 18. By accessing or using the platform, you represent and warrant that you meet the legal age requirement under the laws of your country of residence. NEON reserves the right to verify age and to restrict or close accounts where eligibility cannot be confirmed.",
      },
      account: {
        title: "2. Account registration",
        body: "To access certain features, you must create an account. You agree to provide accurate and complete information and to keep your password confidential. You are responsible for all activity under your account. NEON may suspend or close accounts in the event of a breach of these terms.",
      },
      conduct: {
        title: "3. Code of conduct",
        body: "You agree to use NEON only in a lawful and respectful manner. The following are strictly prohibited: harassment, threats, obscene or illegal content, spam, identity fraud, or any behaviour that may disturb or endanger other users. Breach of these rules results in immediate blocking and, where applicable, reporting to authorities. Indecent behaviour leads to instant IP ban without right to refund.",
      },
      intellectualProperty: {
        title: "4. Intellectual property",
        body: "The NEON brand, logos, interface and original platform content are protected by copyright and other intellectual property rights. You may not copy, modify, distribute or commercially exploit this content without our prior written consent.",
      },
      digitalNoRefund: {
        title: "5. Digital supply and waiver of right of withdrawal",
        body: "By purchasing digital services on NEON (including filters, priority access or other benefits), you agree to the immediate supply of digital content after payment confirmation. Under Directive 2011/83/EU on consumer rights, the consumer loses the right of withdrawal where performance has begun with the consumer's express consent before the end of the withdrawal period. Therefore, no refunds or returns are granted for digital content purchases once access has been granted.",
      },
      limitationOfLiability: {
        title: "6. Limitation of liability",
        body: "NEON is an entertainment platform providing a space for interaction between users. We do not accept liability for the content, statements or actions of users, nor for the outcome of interactions between them. You use the platform at your own risk. Our liability is limited, to the extent permitted by law, to the amount of payments made by you in the last 12 months.",
      },
      changesAndLaw: {
        title: "7. Changes, governing law, contact",
        body: "We reserve the right to modify these Terms. Continued use after changes constitutes acceptance of the new terms. Romanian law applies; disputes fall under the jurisdiction of Romanian courts. For legal enquiries: contact@neon-platform.com.",
      },
    },
  },
  de: {
    title: "Allgemeine Geschäftsbedingungen",
    lastUpdated: "Zuletzt aktualisiert: März 2025",
    intro: "Willkommen bei NEON. Durch die Nutzung der Plattform akzeptieren Sie diese AGB. Bitte lesen Sie sie aufmerksam.",
    sections: {
      eligibility: {
        title: "1. Teilnahmevoraussetzungen",
        body: "NEON-Dienste sind ausschließlich Personen vorbehalten, die das 18. Lebensjahr vollendet haben. Mit dem Zugriff auf die Plattform bestätigen Sie, dass Sie das gesetzliche Mindestalter in Ihrem Land erfüllen. NEON behält sich das Recht vor, das Alter zu prüfen und Konten einzuschränken oder zu schließen.",
      },
      account: {
        title: "2. Konto-Registrierung",
        body: "Für bestimmte Funktionen ist ein Konto erforderlich. Sie verpflichten sich zu wahrheitsgemäßen Angaben und zur Geheimhaltung Ihres Passworts. Sie sind für alle Aktivitäten unter Ihrem Konto verantwortlich. NEON kann Konten bei Verstößen sperren oder schließen.",
      },
      conduct: {
        title: "3. Verhaltensregeln",
        body: "Sie verpflichten sich zu rechtmäßiger und respektvoller Nutzung. Verboten sind u. a.: Belästigung, Drohungen, obszöne oder illegale Inhalte, Spam, Identitätsbetrug. Verstöße führen zu sofortiger Sperrung und ggf. Meldung an Behörden. Unangemessenes Verhalten führt zum sofortigen IP-Bann ohne Rückerstattung.",
      },
      intellectualProperty: {
        title: "4. Geistiges Eigentum",
        body: "Die Marke NEON, Logos, Oberfläche und Originalinhalte sind urheberrechtlich geschützt. Kopieren, Ändern oder gewerbliche Nutzung ohne unsere vorherige schriftliche Zustimmung ist nicht gestattet.",
      },
      digitalNoRefund: {
        title: "5. Digitale Leistung und Verzicht auf Widerrufsrecht",
        body: "Mit dem Kauf digitaler Leistungen (Filter, Prioritätszugang usw.) stimmen Sie der sofortigen Bereitstellung nach Zahlung zu. Nach der EU-Verbraucherrechterichtlinie entfällt das Widerrufsrecht, sobald die Leistung mit Ihrem ausdrücklichen Konsens begonnen hat. Es werden keine Rückerstattungen gewährt.",
      },
      limitationOfLiability: {
        title: "6. Haftungsbeschränkung",
        body: "NEON ist eine Unterhaltungsplattform. Wir übernehmen keine Haftung für Inhalte oder Handlungen der Nutzer oder das Ergebnis von Interaktionen. Die Nutzung erfolgt auf eigenes Risiko. Unsere Haftung ist gesetzlich begrenzt.",
      },
      changesAndLaw: {
        title: "7. Änderungen, anwendbares Recht, Kontakt",
        body: "Wir behalten uns Änderungen vor. Fortgesetzte Nutzung gilt als Zustimmung. Es gilt rumänisches Recht; contact@neon-platform.com.",
      },
    },
  },
  it: {
    title: "Termini e Condizioni",
    lastUpdated: "Ultimo aggiornamento: marzo 2025",
    intro: "Benvenuto su NEON. Utilizzando la piattaforma, accetti i presenti Termini e Condizioni. Si prega di leggerli con attenzione.",
    sections: {
      eligibility: {
        title: "1. Idoneità",
        body: "I servizi NEON sono riservati a chi ha compiuto 18 anni. Accedendo alla piattaforma dichiari di avere l'età legale richiesta. NEON si riserva di verificare l'età e limitare o chiudere account.",
      },
      account: {
        title: "2. Registrazione account",
        body: "Per alcune funzioni è richiesto un account. Ti impegni a fornire dati corretti e a mantenere riservata la password. Sei responsabile di ogni attività sotto il tuo account. NEON può sospendere o chiudere account in caso di violazione.",
      },
      conduct: {
        title: "3. Regole di condotta",
        body: "È vietato molestare, minacciare, diffondere contenuti osceni o illegali, spam o falsa identità. Le violazioni comportano blocco immediato e, ove previsto, segnalazione alle autorità. Comportamento indecente comporta ban IP senza rimborso.",
      },
      intellectualProperty: {
        title: "4. Proprietà intellettuale",
        body: "Il marchio NEON, i loghi e i contenuti originali sono protetti. È vietato copiare, modificare o sfruttare commercialmente senza nostro consenso scritto.",
      },
      digitalNoRefund: {
        title: "5. Fornitura digitale e rinuncia al diritto di recesso",
        body: "Acquistando servizi digitali accetti la fornitura immediata dopo il pagamento. Secondo la direttiva UE sui diritti dei consumatori, il diritto di recesso decade quando l'esecuzione è iniziata con il tuo consenso. Non sono previsti rimborsi.",
      },
      limitationOfLiability: {
        title: "6. Limitazione di responsabilità",
        body: "NEON è una piattaforma di intrattenimento. Non ci assumiamo responsabilità per contenuti o azioni degli utenti né per l'esito delle interazioni. L'uso è a tuo rischio. La nostra responsabilità è limitata dalla legge.",
      },
      changesAndLaw: {
        title: "7. Modifiche, legge applicabile, contatto",
        body: "Ci riserviamo di modificare i Termini. L'uso continuato costituisce accettazione. Si applica la legge rumena; contact@neon-platform.com.",
      },
    },
  },
  es: {
    title: "Términos y Condiciones",
    lastUpdated: "Última actualización: marzo 2025",
    intro: "Bienvenido a NEON. Al usar la plataforma, aceptas estos Términos y Condiciones. Léelos atentamente.",
    sections: {
      eligibility: {
        title: "1. Elegibilidad",
        body: "Los servicios de NEON están reservados a mayores de 18 años. Al acceder declaras tener la edad legal en tu país. NEON se reserva el derecho de verificar la edad y restringir o cerrar cuentas.",
      },
      account: {
        title: "2. Registro de cuenta",
        body: "Para ciertas funciones se requiere cuenta. Te comprometes a dar información veraz y mantener la contraseña en secreto. Eres responsable de toda actividad en tu cuenta. NEON puede suspender o cerrar cuentas por incumplimiento.",
      },
      conduct: {
        title: "3. Normas de conducta",
        body: "Está prohibido acosar, amenazar, publicar contenido obsceno o ilegal, spam o suplantación. Las infracciones conllevan bloqueo inmediato y, en su caso, denuncia. El comportamiento indecente conlleva ban IP sin reembolso.",
      },
      intellectualProperty: {
        title: "4. Propiedad intelectual",
        body: "La marca NEON, logotipos y contenidos originales están protegidos. No está permitida la copia, modificación o explotación comercial sin consentimiento previo por escrito.",
      },
      digitalNoRefund: {
        title: "5. Suministro digital y renuncia al derecho de desistimiento",
        body: "Al comprar servicios digitales aceptas el suministro inmediato tras el pago. Según la directiva UE, el derecho de desistimiento caduca cuando la ejecución ha comenzado con tu consentimiento. No hay reembolsos.",
      },
      limitationOfLiability: {
        title: "6. Limitación de responsabilidad",
        body: "NEON es una plataforma de entretenimiento. No asumimos responsabilidad por contenidos o actos de usuarios ni por el resultado de interacciones. El uso es bajo tu riesgo. Nuestra responsabilidad está limitada por ley.",
      },
      changesAndLaw: {
        title: "7. Cambios, ley aplicable, contacto",
        body: "Nos reservamos el derecho a modificar los Términos. El uso continuado constituye aceptación. Aplica la ley rumana; contact@neon-platform.com.",
      },
    },
  },
  fr: {
    title: "Conditions générales",
    lastUpdated: "Dernière mise à jour : mars 2025",
    intro: "Bienvenue sur NEON. En utilisant la plateforme, vous acceptez les présentes Conditions générales. Veuillez les lire attentivement.",
    sections: {
      eligibility: {
        title: "1. Éligibilité",
        body: "Les services NEON sont réservés aux personnes de 18 ans et plus. En accédant à la plateforme, vous déclarez avoir l'âge légal requis. NEON se réserve le droit de vérifier l'âge et de restreindre ou fermer des comptes.",
      },
      account: {
        title: "2. Inscription au compte",
        body: "Un compte est requis pour certaines fonctionnalités. Vous vous engagez à fournir des informations exactes et à garder votre mot de passe confidentiel. Vous êtes responsable de toute activité sur votre compte. NEON peut suspendre ou fermer des comptes en cas de manquement.",
      },
      conduct: {
        title: "3. Règles de conduite",
        body: "Il est interdit de harceler, menacer, diffuser du contenu obscène ou illégal, du spam ou de usurper une identité. Les manquements entraînent un blocage immédiat et, le cas échéant, un signalement aux autorités. Comportement indécent : bannissement IP sans remboursement.",
      },
      intellectualProperty: {
        title: "4. Propriété intellectuelle",
        body: "La marque NEON, les logos et les contenus originaux sont protégés. Toute copie, modification ou exploitation commerciale sans notre accord écrit préalable est interdite.",
      },
      digitalNoRefund: {
        title: "5. Fourniture numérique et renonciation au droit de rétractation",
        body: "En achetant des services numériques, vous acceptez la fourniture immédiate après paiement. Conformément à la directive UE, le droit de rétractation disparaît lorsque l'exécution a commencé avec votre consentement. Aucun remboursement.",
      },
      limitationOfLiability: {
        title: "6. Limitation de responsabilité",
        body: "NEON est une plateforme de divertissement. Nous n'assumons pas la responsabilité des contenus ou actes des utilisateurs ni du résultat des interactions. L'utilisation est à vos risques. Notre responsabilité est limitée par la loi.",
      },
      changesAndLaw: {
        title: "7. Modifications, droit applicable, contact",
        body: "Nous nous réservons le droit de modifier les Conditions. L'utilisation continue vaut acceptation. Droit roumain applicable ; contact@neon-platform.com.",
      },
    },
  },
  pt: {
    title: "Termos e Condições",
    lastUpdated: "Última atualização: março 2025",
    intro: "Bem-vindo ao NEON. Ao utilizar a plataforma, aceita estes Termos e Condições. Leia-os com atenção.",
    sections: {
      eligibility: {
        title: "1. Elegibilidade",
        body: "Os serviços NEON são reservados a maiores de 18 anos. Ao aceder declara ter a idade legal no seu país. NEON reserva-se o direito de verificar a idade e restringir ou encerrar contas.",
      },
      account: {
        title: "2. Registo de conta",
        body: "Para certas funcionalidades é necessário conta. Compromete-se a dar informações verdadeiras e a manter a palavra-passe confidencial. É responsável por toda a atividade na sua conta. NEON pode suspender ou encerrar contas por incumprimento.",
      },
      conduct: {
        title: "3. Regras de conduta",
        body: "É proibido assediar, ameaçar, publicar conteúdo obsceno ou ilegal, spam ou usurpação de identidade. As infrações implicam bloqueio imediato e, quando aplicável, denúncia. Comportamento indecente implica banimento de IP sem reembolso.",
      },
      intellectualProperty: {
        title: "4. Propriedade intelectual",
        body: "A marca NEON, logótipos e conteúdos originais estão protegidos. Não é permitida cópia, modificação ou exploração comercial sem consentimento prévio por escrito.",
      },
      digitalNoRefund: {
        title: "5. Fornecimento digital e renúncia ao direito de desistência",
        body: "Ao comprar serviços digitais aceita o fornecimento imediato após pagamento. Nos termos da diretiva UE, o direito de desistência caduca quando a execução começou com o seu consentimento. Sem reembolsos.",
      },
      limitationOfLiability: {
        title: "6. Limitação de responsabilidade",
        body: "NEON é uma plataforma de entretenimento. Não assumimos responsabilidade por conteúdos ou atos de utilizadores nem pelo resultado de interações. O uso é por sua conta e risco. A nossa responsabilidade é limitada por lei.",
      },
      changesAndLaw: {
        title: "7. Alterações, lei aplicável, contacto",
        body: "Reservamo-nos o direito de alterar os Termos. O uso continuado constitui aceitação. Lei romena aplicável; contact@neon-platform.com.",
      },
    },
  },
  nl: {
    title: "Algemene Voorwaarden",
    lastUpdated: "Laatst bijgewerkt: maart 2025",
    intro: "Welkom bij NEON. Door het platform te gebruiken, gaat u akkoord met deze Voorwaarden. Lees ze aandachtig.",
    sections: {
      eligibility: {
        title: "1. Geschiktheid",
        body: "NEON-diensten zijn voorbehouden aan personen van 18 jaar en ouder. Door toegang te nemen verklaart u de wettelijke leeftijd te hebben. NEON behoudt zich het recht voor leeftijd te controleren en accounts te beperken of te sluiten.",
      },
      account: {
        title: "2. Accountregistratie",
        body: "Voor bepaalde functies is een account vereist. U verbindt zich tot juiste gegevens en geheimhouding van uw wachtwoord. U bent verantwoordelijk voor alle activiteit onder uw account. NEON kan accounts schorsen of sluiten bij overtreding.",
      },
      conduct: {
        title: "3. Gedragsregels",
        body: "Het is verboden te intimideren, bedreigen, obscene of illegale inhoud te plaatsen, spam of identiteitsfraude. Overtredingen leiden tot directe blokkade en eventueel melding bij autoriteiten. Ongepast gedrag: IP-ban zonder terugbetaling.",
      },
      intellectualProperty: {
        title: "4. Intellectueel eigendom",
        body: "Het merk NEON, logo's en originele inhoud zijn beschermd. Kopiëren, wijzigen of commercieel exploiteren zonder onze voorafgaande schriftelijke toestemming is niet toegestaan.",
      },
      digitalNoRefund: {
        title: "5. Digitale levering en afstand van herroepingsrecht",
        body: "Door digitale diensten te kopen aanvaardt u onmiddellijke levering na betaling. Volgens de EU-richtlijn vervalt het herroepingsrecht zodra de uitvoering met uw toestemming is begonnen. Geen terugbetalingen.",
      },
      limitationOfLiability: {
        title: "6. Beperking van aansprakelijkheid",
        body: "NEON is een entertainmentplatform. Wij aanvaarden geen aansprakelijkheid voor inhoud of handelingen van gebruikers of het resultaat van interacties. Gebruik is op eigen risico. Onze aansprakelijkheid is wettelijk beperkt.",
      },
      changesAndLaw: {
        title: "7. Wijzigingen, toepasselijk recht, contact",
        body: "Wij behouden ons het recht voor de Voorwaarden te wijzigen. Voortgezet gebruik geldt als aanvaarding. Roemeens recht is van toepassing; contact@neon-platform.com.",
      },
    },
  },
  pl: {
    title: "Regulamin",
    lastUpdated: "Ostatnia aktualizacja: marzec 2025",
    intro: "Witamy w NEON. Korzystając z platformy, akceptujesz niniejszy Regulamin. Przeczytaj go uważnie.",
    sections: {
      eligibility: {
        title: "1. Warunki uczestnictwa",
        body: "Usługi NEON są przeznaczone wyłącznie dla osób pełnoletnich (18+). Korzystając z platformy, oświadczasz, że spełniasz wymóg wieku. NEON zastrzega sobie prawo weryfikacji wieku oraz ograniczenia lub zamknięcia konta.",
      },
      account: {
        title: "2. Rejestracja konta",
        body: "Niektóre funkcje wymagają konta. Zobowiązujesz się podawać prawdziwe dane i zachować poufność hasła. Ponosisz odpowiedzialność za aktywność na koncie. NEON może zawiesić lub zamknąć konto w razie naruszenia.",
      },
      conduct: {
        title: "3. Zasady zachowania",
        body: "Zabronione są: nękanie, groźby, treści obsceniczne lub nielegalne, spam, podszywanie się. Naruszenia skutkują natychmiastową blokadą i ewentualnym zgłoszeniem. Nieprzyzwoite zachowanie: ban IP bez zwrotu.",
      },
      intellectualProperty: {
        title: "4. Własność intelektualna",
        body: "Marka NEON, loga i oryginalna treść są chronione. Zabronione jest kopiowanie, modyfikowanie lub wykorzystywanie komercyjne bez naszej uprzedniej pisemnej zgody.",
      },
      digitalNoRefund: {
        title: "5. Dostawa cyfrowa i zrzeczenie się prawa do odstąpienia",
        body: "Kupując usługi cyfrowe, wyrażasz zgodę na niezwłoczną dostawę po płatności. Zgodnie z dyrektywą UE prawo do odstąpienia wygasa po rozpoczęciu świadczenia za Twoją zgodą. Zwroty nie są udzielane.",
      },
      limitationOfLiability: {
        title: "6. Ograniczenie odpowiedzialności",
        body: "NEON to platforma rozrywkowa. Nie ponosimy odpowiedzialności za treści lub działania użytkowników ani za wynik interakcji. Korzystanie na własną odpowiedzialność. Odpowiedzialność ograniczona przez prawo.",
      },
      changesAndLaw: {
        title: "7. Zmiany, prawo właściwe, kontakt",
        body: "Zastrzegamy sobie prawo do zmiany Regulaminu. Dalsze korzystanie oznacza akceptację. Prawo rumuńskie; contact@neon-platform.com.",
      },
    },
  },
  tr: {
    title: "Şartlar ve Koşullar",
    lastUpdated: "Son güncelleme: Mart 2025",
    intro: "NEON'a hoş geldiniz. Platformu kullanarak bu Şartlar ve Koşulları kabul etmiş olursunuz. Lütfen dikkatle okuyun.",
    sections: {
      eligibility: {
        title: "1. Uygunluk",
        body: "NEON hizmetleri yalnızca 18 yaşını doldurmuş kişilere açıktır. Platforma erişerek yaş şartını taşıdığınızı beyan edersiniz. NEON yaş doğrulama ve hesap kısıtlama veya kapatma hakkını saklı tutar.",
      },
      account: {
        title: "2. Hesap kaydı",
        body: "Bazı özellikler için hesap gerekir. Doğru bilgi vermeyi ve şifrenizi gizli tutmayı kabul edersiniz. Hesabınızdaki tüm faaliyetlerden siz sorumlusunuz. NEON ihlal durumunda hesabı askıya alabilir veya kapatabilir.",
      },
      conduct: {
        title: "3. Davranış kuralları",
        body: "Taciz, tehdit, müstehcen veya yasadışı içerik, spam veya kimlik taklidi yasaktır. İhlaller anında engelleme ve gerektiğinde yetkililere bildirimle sonuçlanır. Uygunsuz davranış: iade olmaksızın IP banı.",
      },
      intellectualProperty: {
        title: "4. Fikri mülkiyet",
        body: "NEON markası, logoları ve orijinal içerik korunmaktadır. Önceden yazılı iznimiz olmadan kopyalama, değiştirme veya ticari kullanım yasaktır.",
      },
      digitalNoRefund: {
        title: "5. Dijital tedarik ve cayma hakkından feragat",
        body: "Dijital hizmet satın alarak ödeme sonrası anında tedariki kabul edersiniz. AB tüketici direktifine göre performans onayınızla başladığında cayma hakkı düşer. İade yapılmaz.",
      },
      limitationOfLiability: {
        title: "6. Sorumluluk sınırı",
        body: "NEON bir eğlence platformudur. Kullanıcı içerik veya eylemlerinden veya etkileşim sonuçlarından sorumluluk kabul etmiyoruz. Kullanım kendi riskinizdedir. Sorumluluk yasayla sınırlıdır.",
      },
      changesAndLaw: {
        title: "7. Değişiklikler, uygulanacak hukuk, iletişim",
        body: "Şartları değiştirme hakkımız saklıdır. Kullanıma devam kabul sayılır. Rumen hukuku uygulanır; contact@neon-platform.com.",
      },
    },
  },
};

const LEGAL_GDPR: Record<LegalLocale, GdprContent> = {
  ro: {
    title: "Politica de Confidențialitate (GDPR)",
    lastUpdated: "Ultima actualizare: martie 2025",
    intro: "Această politică descrie cum NEON colectează, folosește și protejează datele dvs. personale, în conformitate cu Regulamentul (UE) 2016/679 (GDPR).",
    sections: {
      dataController: {
        title: "1. Operatorul de date",
        body: "Operatorul de date cu caracter personal este entitatea care administrează platforma NEON. Pentru exercitarea drepturilor sau pentru întrebări privind datele personale, ne puteți contacta la: contact@neon-platform.com sau la adresa indicată pe site.",
      },
      dataCollected: {
        title: "2. Ce date colectăm",
        body: "Colectăm: (a) date de identificare a dispozitivului și adresa IP; (b) date de navigare (pagini vizualizate, timp pe platformă, preferințe de limbă); (c) date legate de tranzacții (sumă, dată, tip de produs) procesate prin procesor de plată securizat — nu stocăm numerele de card sau CVV. Putem stoca un identificator de plată (payment intent ID) pentru reconciliere. (d) dacă vă înregistrați: adresă de email și hash de parolă.",
      },
      noCardStorage: {
        title: "3. Nu stocăm datele cardurilor",
        body: "Toate plățile cu cardul sunt procesate în mod securizat de procesorul de plată. NEON nu primește, nu stochează și nu procesează numerele complete ale cardurilor, datele CVV sau alte date sensibile de plată. Procesorul este în conformitate cu PCI-DSS.",
      },
      purposes: {
        title: "4. Scopul prelucrării",
        body: "Datele sunt folosite pentru: furnizarea și îmbunătățirea serviciilor, procesarea plăților, prevenirea fraudelor, respectarea obligațiilor legale, comunicări legate de cont (dacă există) și personalizarea experienței (inclusiv limbă și preferințe).",
      },
      legalBasis: {
        title: "5. Baza legală",
        body: "Prelucrăm datele pe baza: executării contractului (furnizarea serviciilor), interesului legitim (securitate, analiză agregată, îmbunătățirea platformei), consimțământul (cookie-uri opționale, marketing — unde aplicabil) și obligațiilor legale (păstrarea facturilor, răspuns la cereri ale autorităților).",
      },
      yourRights: {
        title: "6. Drepturile dvs.",
        body: "Conform GDPR aveți dreptul la: acces la datele pe care le deținem; rectificarea datelor inexacte; ștergerea datelor („dreptul de a fi uitat”); restricționarea prelucrării; portabilitatea datelor; opoziția față de prelucrarea bazată pe interes legitim; retragerea consimțământului (unde acesta este baza). De asemenea, aveți dreptul să depuneți o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP) sau la autoritatea de supraveghere din țara dvs. de reședință.",
      },
      cookies: {
        title: "7. Cookie-uri",
        body: "Folosim cookie-uri pentru: sesiunea de autentificare (dacă există cont) și preferințele de limbă, necesare pentru funcționarea de bază. Cookie-urile opționale (analiză, preferințe de interfață) pot fi acceptate sau refuzate la prima vizită. Puteți șterge sau bloca cookie-urile din setările browserului.",
      },
      securityRetentionContact: {
        title: "8. Securitate, păstrare, contact",
        body: "Aplicăm măsuri tehnice și organizatorice adecvate (criptare, acces limitat, parteneri verificați) pentru a proteja datele. Păstrăm datele atât timp cât este necesar pentru scopurile indicate (ex.: date de facturare conform legii fiscale; jurnale de securitate pentru perioada permisă). Pentru exercitarea drepturilor sau întrebări: contact@neon-platform.com.",
      },
    },
  },
  en: {
    title: "Privacy Policy (GDPR)",
    lastUpdated: "Last updated: March 2025",
    intro: "This policy describes how NEON collects, uses and protects your personal data in accordance with Regulation (EU) 2016/679 (GDPR).",
    sections: {
      dataController: {
        title: "1. Data controller",
        body: "The data controller for personal data is the entity operating the NEON platform. To exercise your rights or for data-related enquiries, contact us at: contact@neon-platform.com or at the address indicated on the site.",
      },
      dataCollected: {
        title: "2. Data we collect",
        body: "We collect: (a) device identifiers and IP address; (b) browsing data (pages viewed, time on platform, language preferences); (c) transaction-related data (amount, date, product type) processed via a secure payment processor — we do not store card numbers or CVV. We may store a payment identifier (payment intent ID) for reconciliation. (d) If you register: email address and password hash.",
      },
      noCardStorage: {
        title: "3. We do not store card data",
        body: "All card payments are processed securely by our payment processor. NEON does not receive, store or process full card numbers, CVV or other sensitive payment data. Our payment processor is PCI-DSS compliant.",
      },
      purposes: {
        title: "4. Purposes of processing",
        body: "Data is used to: provide and improve services, process payments, prevent fraud, comply with legal obligations, send account-related communications (if applicable) and personalise your experience (including language and preferences).",
      },
      legalBasis: {
        title: "5. Legal basis",
        body: "We process data on the basis of: performance of contract (delivery of services), legitimate interest (security, aggregated analytics, platform improvement), consent (optional cookies, marketing where applicable) and legal obligations (retention of invoices, response to authority requests).",
      },
      yourRights: {
        title: "6. Your rights",
        body: "Under the GDPR you have the right to: access the data we hold; rectification of inaccurate data; erasure (\"right to be forgotten\"); restriction of processing; data portability; object to processing based on legitimate interest; withdraw consent (where it is the basis). You also have the right to lodge a complaint with the National Supervisory Authority for Personal Data Processing (ANSPDCP) in Romania or with the supervisory authority in your country of residence.",
      },
      cookies: {
        title: "7. Cookies",
        body: "We use cookies for: authentication session (if you have an account) and language preferences, which are necessary for basic operation. Optional cookies (analytics, interface preferences) may be accepted or declined on first visit. You can delete or block cookies in your browser settings.",
      },
      securityRetentionContact: {
        title: "8. Security, retention, contact",
        body: "We apply appropriate technical and organisational measures (encryption, limited access, verified partners) to protect data. We retain data only as long as necessary for the stated purposes (e.g. billing data as required by tax law; security logs for the permitted period). To exercise your rights or for enquiries: contact@neon-platform.com.",
      },
    },
  },
  de: {
    title: "Datenschutzerklärung (DSGVO)",
    lastUpdated: "Zuletzt aktualisiert: März 2025",
    intro: "Diese Richtlinie beschreibt, wie NEON personenbezogene Daten erhebt, verwendet und schützt, in Übereinstimmung mit der Verordnung (EU) 2016/679 (DSGVO).",
    sections: {
      dataController: {
        title: "1. Verantwortlicher",
        body: "Verantwortlicher für personenbezogene Daten ist die die Plattform NEON betreibende Stelle. Zur Ausübung Ihrer Rechte: contact@neon-platform.com.",
      },
      dataCollected: {
        title: "2. Erhobene Daten",
        body: "Wir erheben: (a) Geräte- und IP-Daten; (b) Nutzungsdaten (Seiten, Verweildauer, Sprache); (c) Transaktionsdaten über einen sicheren Zahlungsanbieter – keine Kartenummern oder CVV. (d) Bei Registrierung: E-Mail und Passwort-Hash.",
      },
      noCardStorage: {
        title: "3. Keine Speicherung von Kartendaten",
        body: "Kartenzahlungen werden sicher von unserem Zahlungsanbieter verarbeitet. NEON speichert keine vollständigen Kartennummern oder CVV. Unser Zahlungsanbieter ist PCI-DSS-konform.",
      },
      purposes: {
        title: "4. Zwecke der Verarbeitung",
        body: "Daten dienen der Bereitstellung und Verbesserung der Dienste, Zahlungsabwicklung, Betrugsprävention, gesetzlichen Pflichten und Personalisierung (z. B. Sprache).",
      },
      legalBasis: {
        title: "5. Rechtsgrundlage",
        body: "Verarbeitung erfolgt auf Grundlage von Vertragserfüllung, berechtigtem Interesse, Einwilligung (optional) und gesetzlichen Verpflichtungen.",
      },
      yourRights: {
        title: "6. Ihre Rechte",
        body: "Sie haben u. a. Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch. Sie können sich bei einer Aufsichtsbehörde (z. B. ANSPDCP in Rumänien) beschweren.",
      },
      cookies: {
        title: "7. Cookies",
        body: "Wir setzen Cookies für Sitzung und Sprachpräferenz (notwendig). Optionale Cookies können beim ersten Besuch abgelehnt werden. Sie können Cookies in den Browsereinstellungen verwalten.",
      },
      securityRetentionContact: {
        title: "8. Sicherheit, Aufbewahrung, Kontakt",
        body: "Wir wenden geeignete technische und organisatorische Maßnahmen an. Daten werden nur so lange aufbewahrt, wie nötig. Kontakt: contact@neon-platform.com.",
      },
    },
  },
  it: {
    title: "Informativa sulla Privacy (GDPR)",
    lastUpdated: "Ultimo aggiornamento: marzo 2025",
    intro: "Questa informativa descrive come NEON raccoglie, utilizza e protegge i tuoi dati personali secondo il Regolamento (UE) 2016/679 (GDPR).",
    sections: {
      dataController: { title: "1. Titolare del trattamento", body: "Il titolare è l'entità che gestisce la piattaforma NEON. Per esercitare i tuoi diritti: contact@neon-platform.com." },
      dataCollected: { title: "2. Dati raccolti", body: "Raccogliamo: identificativi dispositivo e IP; dati di navigazione; dati di transazione tramite processore di pagamento sicuro (nessun numero di carta o CVV). Se ti registri: email e hash password." },
      noCardStorage: { title: "3. Nessuna memorizzazione delle carte", body: "I pagamenti con carta sono elaborati in modo sicuro dal nostro processore. NEON non memorizza numeri di carta completi o CVV. Il processore è conforme PCI-DSS." },
      purposes: { title: "4. Finalità", body: "I dati servono per erogare e migliorare i servizi, elaborare pagamenti, prevenire frodi, adempiere obblighi di legge e personalizzare l'esperienza (lingua, preferenze)." },
      legalBasis: { title: "5. Base giuridica", body: "Trattiamo i dati in base a esecuzione del contratto, interesse legittimo, consenso (cookie opzionali) e obblighi di legge." },
      yourRights: { title: "6. I tuoi diritti", body: "Hai diritto ad accesso, rettifica, cancellazione, limitazione, portabilità e opposizione. Puoi presentare reclamo all'autorità di controllo (es. ANSPDCP in Romania)." },
      cookies: { title: "7. Cookie", body: "Usiamo cookie per sessione e lingua (necessari). I cookie opzionali possono essere rifiutati al primo accesso. Puoi gestire i cookie nelle impostazioni del browser." },
      securityRetentionContact: { title: "8. Sicurezza, conservazione, contatto", body: "Applichiamo misure tecniche e organizzative adeguate. Conserviamo i dati solo per il tempo necessario. Contatto: contact@neon-platform.com." },
    },
  },
  es: {
    title: "Política de Privacidad (GDPR)",
    lastUpdated: "Última actualización: marzo 2025",
    intro: "Esta política describe cómo NEON recopila, usa y protege sus datos personales conforme al Reglamento (UE) 2016/679 (GDPR).",
    sections: {
      dataController: { title: "1. Responsable del tratamiento", body: "El responsable es la entidad que opera la plataforma NEON. Para ejercer sus derechos: contact@neon-platform.com." },
      dataCollected: { title: "2. Datos que recogemos", body: "Recogemos: identificadores de dispositivo e IP; datos de navegación; datos de transacción vía procesador de pago seguro (sin números de tarjeta ni CVV). Si se registra: email y hash de contraseña." },
      noCardStorage: { title: "3. No almacenamos datos de tarjeta", body: "Los pagos con tarjeta los procesa nuestro proveedor de pago de forma segura. NEON no almacena números completos ni CVV. Nuestro proveedor cumple PCI-DSS." },
      purposes: { title: "4. Finalidades", body: "Los datos se usan para prestar y mejorar servicios, procesar pagos, prevenir fraudes, cumplir obligaciones legales y personalizar la experiencia (idioma, preferencias)." },
      legalBasis: { title: "5. Base legal", body: "Tratamos datos por ejecución del contrato, interés legítimo, consentimiento (cookies opcionales) y obligaciones legales." },
      yourRights: { title: "6. Sus derechos", body: "Tiene derecho a acceso, rectificación, supresión, limitación, portabilidad y oposición. Puede reclamar ante la autoridad de control (ej. ANSPDCP en Rumanía)." },
      cookies: { title: "7. Cookies", body: "Usamos cookies para sesión e idioma (necesarias). Las opcionales pueden rechazarse en la primera visita. Puede gestionar cookies en la configuración del navegador." },
      securityRetentionContact: { title: "8. Seguridad, conservación, contacto", body: "Aplicamos medidas técnicas y organizativas adecuadas. Conservamos datos solo el tiempo necesario. Contacto: contact@neon-platform.com." },
    },
  },
  fr: {
    title: "Politique de confidentialité (RGPD)",
    lastUpdated: "Dernière mise à jour : mars 2025",
    intro: "Cette politique décrit comment NEON collecte, utilise et protège vos données personnelles conformément au Règlement (UE) 2016/679 (RGPD).",
    sections: {
      dataController: { title: "1. Responsable du traitement", body: "Le responsable est l'entité qui exploite la plateforme NEON. Pour exercer vos droits : contact@neon-platform.com." },
      dataCollected: { title: "2. Données collectées", body: "Nous collectons : identifiants appareil et IP ; données de navigation ; données de transaction via un processeur de paiement sécurisé (aucun numéro de carte ni CVV). En cas d'inscription : e-mail et hash du mot de passe." },
      noCardStorage: { title: "3. Aucun stockage des données cartes", body: "Les paiements par carte sont traités de manière sécurisée par notre processeur. NEON ne stocke pas les numéros complets ni le CVV. Notre processeur est conforme PCI-DSS." },
      purposes: { title: "4. Finalités", body: "Les données servent à fournir et améliorer les services, traiter les paiements, prévenir la fraude, respecter les obligations légales et personnaliser l'expérience (langue, préférences)." },
      legalBasis: { title: "5. Base légale", body: "Nous traitons les données sur la base de l'exécution du contrat, de l'intérêt légitime, du consentement (cookies optionnels) et des obligations légales." },
      yourRights: { title: "6. Vos droits", body: "Vous avez droit à l'accès, à la rectification, à l'effacement, à la limitation, à la portabilité et à l'opposition. Vous pouvez saisir une autorité de contrôle (ex. ANSPDCP en Roumanie)." },
      cookies: { title: "7. Cookies", body: "Nous utilisons des cookies pour la session et la langue (nécessaires). Les cookies optionnels peuvent être refusés à la première visite. Vous pouvez gérer les cookies dans les paramètres du navigateur." },
      securityRetentionContact: { title: "8. Sécurité, conservation, contact", body: "Nous appliquons des mesures techniques et organisationnelles appropriées. Nous conservons les données uniquement le temps nécessaire. Contact : contact@neon-platform.com." },
    },
  },
  pt: {
    title: "Política de Privacidade (GDPR)",
    lastUpdated: "Última atualização: março 2025",
    intro: "Esta política descreve como o NEON recolhe, utiliza e protege os seus dados pessoais em conformidade com o Regulamento (UE) 2016/679 (GDPR).",
    sections: {
      dataController: { title: "1. Responsável pelo tratamento", body: "O responsável é a entidade que opera a plataforma NEON. Para exercer os seus direitos: contact@neon-platform.com." },
      dataCollected: { title: "2. Dados recolhidos", body: "Recolhemos: identificadores de dispositivo e IP; dados de navegação; dados de transação via processador seguro (sem números de cartão ou CVV). Se se registar: e-mail e hash da palavra-passe." },
      noCardStorage: { title: "3. Não armazenamos dados de cartão", body: "Os pagamentos com cartão são processados de forma segura pelo nosso processador. O NEON não armazena números completos nem CVV. O processador é compatível com PCI-DSS." },
      purposes: { title: "4. Finalidades", body: "Os dados servem para prestar e melhorar serviços, processar pagamentos, prevenir fraudes, cumprir obrigações legais e personalizar a experiência (idioma, preferências)." },
      legalBasis: { title: "5. Base legal", body: "Tratamos dados com base na execução do contrato, interesse legítimo, consentimento (cookies opcionais) e obrigações legais." },
      yourRights: { title: "6. Os seus direitos", body: "Tem direito a acesso, retificação, apagamento, limitação, portabilidade e oposição. Pode reclamar à autoridade de controlo (ex. ANSPDCP na Roménia)." },
      cookies: { title: "7. Cookies", body: "Utilizamos cookies para sessão e idioma (necessários). Os opcionais podem ser recusados na primeira visita. Pode gerir cookies nas definições do browser." },
      securityRetentionContact: { title: "8. Segurança, conservação, contacto", body: "Aplicamos medidas técnicas e organizacionais adequadas. Conservamos dados apenas o tempo necessário. Contacto: contact@neon-platform.com." },
    },
  },
  nl: {
    title: "Privacybeleid (AVG)",
    lastUpdated: "Laatst bijgewerkt: maart 2025",
    intro: "Dit beleid beschrijft hoe NEON persoonsgegevens verzamelt, gebruikt en beschermt in overeenstemming met Verordening (EU) 2016/679 (AVG).",
    sections: {
      dataController: { title: "1. Verwerkingsverantwoordelijke", body: "De verantwoordelijke is de entiteit die het NEON-platform exploiteert. Voor het uitoefenen van uw rechten: contact@neon-platform.com." },
      dataCollected: { title: "2. Verzamelde gegevens", body: "We verzamelen: apparaat- en IP-gegevens; navigatiegegevens; transactiegegevens via veilige betalingsverwerker (geen kaartnummers of CVV). Bij registratie: e-mail en wachtwoordhash." },
      noCardStorage: { title: "3. Geen opslag van kaartgegevens", body: "Kaartbetalingen worden veilig door onze betalingsverwerker verwerkt. NEON slaat geen volledige kaartnummers of CVV op. Onze verwerker is PCI-DSS-conform." },
      purposes: { title: "4. Doeleinden", body: "Gegevens worden gebruikt voor het leveren en verbeteren van diensten, betalingsverwerking, fraudepreventie, wettelijke verplichtingen en personalisatie (taal, voorkeuren)." },
      legalBasis: { title: "5. Rechtsgrondslag", body: "We verwerken op basis van contractuitvoering, gerechtvaardigd belang, toestemming (optionele cookies) en wettelijke verplichtingen." },
      yourRights: { title: "6. Uw rechten", body: "U heeft recht op inzage, rectificatie, wissing, beperking, overdraagbaarheid en bezwaar. U kunt een klacht indienen bij een toezichthouder (bijv. ANSPDCP in Roemenië)." },
      cookies: { title: "7. Cookies", body: "We gebruiken cookies voor sessie en taal (noodzakelijk). Optionele cookies kunnen bij het eerste bezoek worden geweigerd. U kunt cookies beheren in de browserinstellingen." },
      securityRetentionContact: { title: "8. Beveiliging, bewaartermijn, contact", body: "We passen passende technische en organisatorische maatregelen toe. We bewaren gegevens alleen zolang nodig. Contact: contact@neon-platform.com." },
    },
  },
  pl: {
    title: "Polityka prywatności (RODO)",
    lastUpdated: "Ostatnia aktualizacja: marzec 2025",
    intro: "Niniejsza polityka opisuje, w jaki sposób NEON zbiera, wykorzystuje i chroni Twoje dane osobowe zgodnie z Rozporządzeniem (UE) 2016/679 (RODO).",
    sections: {
      dataController: { title: "1. Administrator danych", body: "Administratorem jest podmiot prowadzący platformę NEON. Aby skorzystać z praw: contact@neon-platform.com." },
      dataCollected: { title: "2. Zbierane dane", body: "Zbieramy: identyfikatory urządzenia i adres IP; dane nawigacji; dane transakcji przez bezpieczny procesor płatności (bez numerów kart ani CVV). Przy rejestracji: e-mail i hash hasła." },
      noCardStorage: { title: "3. Nie przechowujemy danych kart", body: "Płatności kartą są bezpiecznie przetwarzane przez nasz procesor. NEON nie przechowuje pełnych numerów kart ani CVV. Procesor jest zgodny z PCI-DSS." },
      purposes: { title: "4. Cele przetwarzania", body: "Dane służą do świadczenia i ulepszania usług, obsługi płatności, zapobiegania oszustwom, obowiązkom prawnym i personalizacji (język, preferencje)." },
      legalBasis: { title: "5. Podstawa prawna", body: "Przetwarzamy dane na podstawie wykonania umowy, prawnie uzasadnionego interesu, zgody (opcjonalne pliki cookie) i obowiązków prawnych." },
      yourRights: { title: "6. Twoje prawa", body: "Masz prawo do dostępu, sprostowania, usunięcia, ograniczenia, przenoszenia i sprzeciwu. Możesz złożyć skargę do organu nadzorczego (np. ANSPDCP w Rumunii)." },
      cookies: { title: "7. Pliki cookie", body: "Używamy plików cookie do sesji i języka (niezbędne). Opcjonalne można odrzucić przy pierwszej wizycie. Możesz zarządzać plikami cookie w ustawieniach przeglądarki." },
      securityRetentionContact: { title: "8. Bezpieczeństwo, przechowywanie, kontakt", body: "Stosujemy odpowiednie środki techniczne i organizacyjne. Przechowujemy dane tylko przez niezbędny czas. Kontakt: contact@neon-platform.com." },
    },
  },
  tr: {
    title: "Gizlilik Politikası (GDPR)",
    lastUpdated: "Son güncelleme: Mart 2025",
    intro: "Bu politika, NEON'un Kişisel Verilerin Korunması (GDPR) AB Tüzüğü 2016/679 kapsamında kişisel verilerinizi nasıl topladığını, kullandığını ve koruduğunu açıklar.",
    sections: {
      dataController: { title: "1. Veri sorumlusu", body: "Sorumlu, NEON platformunu işleten tüzel kişiliktir. Haklarınızı kullanmak için: contact@neon-platform.com." },
      dataCollected: { title: "2. Toplanan veriler", body: "Cihaz tanımlayıcıları ve IP; gezinme verileri; güvenli ödeme sağlayıcısı üzerinden işlem verileri (kart numarası veya CVV saklanmaz). Kayıt durumunda: e-posta ve şifre hash'i." },
      noCardStorage: { title: "3. Kart verisi saklanmaz", body: "Kart ödemeleri ödeme sağlayıcımız tarafından güvenli işlenir. NEON tam kart numarası veya CVV saklamaz. Ödeme sağlayıcımız PCI-DSS uyumludur." },
      purposes: { title: "4. İşleme amaçları", body: "Veriler hizmet sunumu, ödeme işleme, dolandırıcılık önleme, yasal yükümlülükler ve kişiselleştirme (dil, tercihler) için kullanılır." },
      legalBasis: { title: "5. Hukuki dayanak", body: "Sözleşme ifası, meşru menfaat, rıza (isteğe bağlı çerezler) ve yasal yükümlülükler temelinde işliyoruz." },
      yourRights: { title: "6. Haklarınız", body: "Erişim, düzeltme, silme, kısıtlama, taşınabilirlik ve itiraz hakkınız vardır. Romanya'da ANSPDCP veya ikamet ettiğiniz ülkedeki denetim makamına şikayette bulunabilirsiniz." },
      cookies: { title: "7. Çerezler", body: "Oturum ve dil için çerez kullanıyoruz (gerekli). İsteğe bağlı çerezler ilk ziyarette reddedilebilir. Tarayıcı ayarlarından çerezleri yönetebilirsiniz." },
      securityRetentionContact: { title: "8. Güvenlik, saklama, iletişim", body: "Uygun teknik ve idari önlemler uyguluyoruz. Verileri yalnızca gerekli süre saklıyoruz. İletişim: contact@neon-platform.com." },
    },
  },
};

export function getTermsContent(locale: LegalLocale): TermsContent {
  return LEGAL_TERMS[locale] ?? LEGAL_TERMS.en;
}

export function getGdprContent(locale: LegalLocale): GdprContent {
  return LEGAL_GDPR[locale] ?? LEGAL_GDPR.en;
}

const LEGAL_LOCALE_MAP: Record<string, LegalLocale> = {
  ro: "ro", en: "en", de: "de", it: "it", es: "es", fr: "fr", pt: "pt", nl: "nl", pl: "pl", tr: "tr",
};

/** Resolve legal locale from ?lang= or Accept-Language header (server). */
export function resolveLegalLocale(langParam: string | null, acceptLanguage: string | null): LegalLocale {
  if (langParam) {
    const lower = langParam.slice(0, 2).toLowerCase();
    if (LEGAL_LOCALE_MAP[lower]) return LEGAL_LOCALE_MAP[lower];
  }
  if (acceptLanguage) {
    const first = acceptLanguage.split(",")[0]?.split("-")[0]?.toLowerCase();
    if (first && LEGAL_LOCALE_MAP[first]) return LEGAL_LOCALE_MAP[first];
  }
  return "en";
}
