#!/usr/bin/env python3
"""
One-shot script to inject the Fase 2 landing translations into all 7 locale files.
Idempotent: running it twice yields the same output (in-place overwrite of the
`home.testimonials`, `home.comparison`, `home.faqInline`, `home.waitlist` blocks).

Usage:
  python3 /app/dashboard-web/scripts/add-fase2-translations.py
"""
import json
import os
from pathlib import Path

MESSAGES_DIR = Path("/app/dashboard-web/messages")

# =============================================================================
# All translations for all 7 languages
# =============================================================================
TRANSLATIONS = {
    # ------------------------------------------------------------- ESPAÑOL
    "es": {
        "testimonials": {
            "badge": "Lo que dicen los early adopters",
            "title": "Profesionales que ya lo prueban",
            "subtitle": "Testimonios de miembros del programa Founding Members. Únete y sé parte de la primera oleada.",
            "foundingMember": "Founding",
            "betaNote": "* Los primeros 20 miembros obtienen 6 meses gratis y un 30% de descuento de por vida.",
            "t1": {
                "quote": "En 3 días eliminé las cancelaciones de última hora. El depósito hace magia: si no pagas, no reservas.",
                "name": "Ana M.",
                "role": "Estilista · Madrid"
            },
            "t2": {
                "quote": "Antes usaba WhatsApp + Google Calendar y perdía horas. Ahora todo automático, incluso los recordatorios.",
                "name": "Diego R.",
                "role": "Coach de negocios · Barcelona"
            },
            "t3": {
                "quote": "La blacklist compartida es oro. Ya me ahorró dos clientes problemáticos que otros pros habían reportado.",
                "name": "Carla S.",
                "role": "Entrenadora personal · Valencia"
            },
            "t4": {
                "quote": "La IA responde a mis clientes 24/7 en español y catalán. Reservo mientras duermo. Literalmente.",
                "name": "Marc T.",
                "role": "Terapeuta · Barcelona"
            }
        },
        "comparison": {
            "badge": "Comparativa objetiva",
            "title": "¿Cómo nos comparamos con las otras opciones?",
            "subtitle": "Tabla honesta con las plataformas más populares del mercado en 2026.",
            "featureHeader": "Funcionalidad",
            "us": "Nosotros",
            "gcal": "Google Cal.",
            "legend": {
                "yes": "Incluido",
                "partial": "Parcial / con addon",
                "no": "No disponible"
            },
            "disclaimer": "* Comparación basada en información pública de las respectivas plataformas a junio 2026.",
            "rows": {
                "aiBot": "Bot IA multi-idioma (24/7)",
                "reminders": "Recordatorios automáticos (WhatsApp/Telegram)",
                "deposit": "Cobro de depósito anti no-show",
                "clientDatabase": "Base de datos de clientes",
                "sharedBlacklist": "Blacklist compartida entre profesionales",
                "multiLang": "Panel disponible en 7 idiomas",
                "gdpr": "GDPR nativo (servidores EU)",
                "flatFee": "Tarifa plana sin comisión por reserva",
                "regulatedTier": "Vertical privado regulado (invite-only)"
            }
        },
        "faqInline": {
            "badge": "Preguntas frecuentes",
            "title": "Lo que la gente nos pregunta",
            "subtitle": "Respuestas rápidas a las dudas más comunes. Para más detalles, visita la FAQ completa.",
            "seeAll": "Ver todas las preguntas",
            "items": {
                "q1": {
                    "q": "¿Necesito saber programar?",
                    "a": "No. Configuras tu agenda y servicios en 5 minutos desde el panel. Todo funciona sin código."
                },
                "q2": {
                    "q": "¿Cómo se entera mi cliente del bot?",
                    "a": "Al registrarte generamos tu enlace único de WhatsApp y de Telegram. Lo pones en tu Instagram, web o mensajes automáticos."
                },
                "q3": {
                    "q": "¿Qué pasa con los no-shows?",
                    "a": "El depósito no se reembolsa: te queda como compensación. La mayoría de nuestros usuarios reducen los no-shows más del 60% en el primer mes."
                },
                "q4": {
                    "q": "¿Es compatible con mi vertical?",
                    "a": "Sí. Funciona con peluquería, estética, coaching, fisio, entrenadores, terapia, fotografía y muchos más. Configuras tus servicios y precios personalizados."
                },
                "q5": {
                    "q": "¿Cuándo puedo empezar?",
                    "a": "La plataforma está en fase beta cerrada. Únete a la lista de espera y obtén acceso prioritario en las próximas semanas."
                },
                "q6": {
                    "q": "¿Es compatible con GDPR?",
                    "a": "Sí. Servidores en la UE, cifrado en tránsito y reposo, eliminación de datos bajo demanda y política de retención transparente. Cumplimos GDPR + ePrivacy nativos."
                }
            }
        },
        "waitlist": {
            "badge": "Acceso anticipado",
            "title": "Únete a la lista de espera",
            "subtitle": "Sé de los primeros en probar la plataforma cuando lancemos. Los 20 primeros miembros obtienen 6 meses gratis + 30% de descuento de por vida.",
            "counter": "profesionales ya se han apuntado",
            "emailPlaceholder": "tu@email.com",
            "professionPlaceholder": "¿Cuál es tu profesión? (opcional)",
            "submit": "Unirme a la lista",
            "submitting": "Enviando...",
            "successTitle": "¡Estás dentro!",
            "successDesc": "Te avisaremos por email cuando lancemos. Prepara tus mejores servicios.",
            "positionLabel": "Tu posición",
            "successToast": "Bienvenido a la lista de espera",
            "alreadyRegistered": "Este email ya está en la lista",
            "errorInvalidEmail": "Introduce un email válido",
            "errorRateLimit": "Demasiadas suscripciones. Vuelve a intentarlo en 1 hora.",
            "errorGeneric": "Algo salió mal. Inténtalo de nuevo.",
            "errorNetwork": "Sin conexión. Comprueba tu red.",
            "privacyNote": "Al inscribirte aceptas nuestra política de privacidad. No enviamos spam. Puedes darte de baja en cualquier momento.",
            "professions": {
                "beauty": "💅 Belleza / Estética",
                "wellness": "🧘 Bienestar / Masajes",
                "fitness": "🏋️ Fitness / Entrenamiento",
                "coaching": "🎓 Coaching / Consultoría",
                "health": "🩺 Salud / Fisioterapia",
                "education": "📚 Educación / Clases",
                "creative": "🎨 Creativos / Fotografía",
                "professional": "⚖️ Profesionales / Legal",
                "home": "🏠 Servicios a domicilio",
                "pets": "🐾 Mascotas",
                "events": "🎉 Eventos",
                "hospitality": "🍽️ Hostelería",
                "other": "☔ Otros profesionales"
            }
        }
    },

    # ------------------------------------------------------------- ENGLISH
    "en": {
        "testimonials": {
            "badge": "What early adopters say",
            "title": "Professionals already using it",
            "subtitle": "Testimonials from Founding Members. Join now and be part of the first wave.",
            "foundingMember": "Founding",
            "betaNote": "* First 20 members get 6 months free plus a 30% lifetime discount.",
            "t1": {
                "quote": "In 3 days I eliminated last-minute cancellations. Deposits are magic: no payment, no booking.",
                "name": "Ana M.",
                "role": "Hairstylist · Madrid"
            },
            "t2": {
                "quote": "I used to juggle WhatsApp + Google Calendar and lost hours. Now everything is automated, including reminders.",
                "name": "Diego R.",
                "role": "Business coach · Barcelona"
            },
            "t3": {
                "quote": "The shared blacklist is gold. It already saved me from two problematic clients that other pros had flagged.",
                "name": "Carla S.",
                "role": "Personal trainer · Valencia"
            },
            "t4": {
                "quote": "The AI answers my clients 24/7 in Spanish and Catalan. I book while I sleep. Literally.",
                "name": "Marc T.",
                "role": "Therapist · Barcelona"
            }
        },
        "comparison": {
            "badge": "Objective comparison",
            "title": "How do we compare to the other options?",
            "subtitle": "Honest side-by-side with the most popular platforms in 2026.",
            "featureHeader": "Feature",
            "us": "Us",
            "gcal": "Google Cal.",
            "legend": {
                "yes": "Included",
                "partial": "Partial / with add-on",
                "no": "Not available"
            },
            "disclaimer": "* Comparison based on public information from each platform as of June 2026.",
            "rows": {
                "aiBot": "Multi-language AI bot (24/7)",
                "reminders": "Automated reminders (WhatsApp/Telegram)",
                "deposit": "Anti-no-show deposit capture",
                "clientDatabase": "Client database",
                "sharedBlacklist": "Cross-professional shared blacklist",
                "multiLang": "Dashboard available in 7 languages",
                "gdpr": "Native GDPR (EU-hosted servers)",
                "flatFee": "Flat fee, no per-booking commission",
                "regulatedTier": "Regulated private tier (invite-only)"
            }
        },
        "faqInline": {
            "badge": "Frequently asked",
            "title": "What people ask us",
            "subtitle": "Quick answers to the most common questions. For the full list, visit our complete FAQ.",
            "seeAll": "View all questions",
            "items": {
                "q1": {
                    "q": "Do I need to know how to code?",
                    "a": "No. You set up your calendar and services in 5 minutes from the dashboard. Everything works code-free."
                },
                "q2": {
                    "q": "How do my clients find the bot?",
                    "a": "On sign-up we generate your unique WhatsApp and Telegram links. Add them to your Instagram, website or auto-replies."
                },
                "q3": {
                    "q": "What about no-shows?",
                    "a": "Deposits are non-refundable: you keep them as compensation. Most of our users cut no-shows by 60%+ in the first month."
                },
                "q4": {
                    "q": "Is it compatible with my vertical?",
                    "a": "Yes. Works with beauty, wellness, coaching, physio, trainers, therapy, photography and many more. Set up your custom services and prices."
                },
                "q5": {
                    "q": "When can I start?",
                    "a": "The platform is in closed beta. Join the waitlist and get priority access in the coming weeks."
                },
                "q6": {
                    "q": "Is it GDPR-compliant?",
                    "a": "Yes. EU-hosted servers, in-transit and at-rest encryption, on-demand data deletion and transparent retention policy. Native GDPR + ePrivacy compliance."
                }
            }
        },
        "waitlist": {
            "badge": "Early access",
            "title": "Join the waitlist",
            "subtitle": "Be among the first to try the platform when we launch. First 20 members get 6 months free + 30% lifetime discount.",
            "counter": "professionals already signed up",
            "emailPlaceholder": "you@email.com",
            "professionPlaceholder": "What's your profession? (optional)",
            "submit": "Join the list",
            "submitting": "Sending...",
            "successTitle": "You're in!",
            "successDesc": "We'll email you when we launch. Get your best services ready.",
            "positionLabel": "Your position",
            "successToast": "Welcome to the waitlist",
            "alreadyRegistered": "This email is already on the list",
            "errorInvalidEmail": "Enter a valid email",
            "errorRateLimit": "Too many signups. Try again in 1 hour.",
            "errorGeneric": "Something went wrong. Try again.",
            "errorNetwork": "Offline. Check your connection.",
            "privacyNote": "By signing up you accept our privacy policy. We don't send spam. You can unsubscribe anytime.",
            "professions": {
                "beauty": "💅 Beauty / Aesthetics",
                "wellness": "🧘 Wellness / Massage",
                "fitness": "🏋️ Fitness / Training",
                "coaching": "🎓 Coaching / Consulting",
                "health": "🩺 Health / Physio",
                "education": "📚 Education / Tutoring",
                "creative": "🎨 Creatives / Photography",
                "professional": "⚖️ Professional services",
                "home": "🏠 Home services",
                "pets": "🐾 Pets",
                "events": "🎉 Events",
                "hospitality": "🍽️ Hospitality",
                "other": "☔ Other professionals"
            }
        }
    },

    # ------------------------------------------------------------- FRANÇAIS
    "fr": {
        "testimonials": {
            "badge": "Ce que disent nos early adopters",
            "title": "Des professionnels l'utilisent déjà",
            "subtitle": "Témoignages des Founding Members. Rejoignez la première vague dès maintenant.",
            "foundingMember": "Founding",
            "betaNote": "* Les 20 premiers membres obtiennent 6 mois gratuits + 30% de réduction à vie.",
            "t1": {
                "quote": "En 3 jours j'ai éliminé les annulations de dernière minute. L'acompte fait des miracles.",
                "name": "Ana M.",
                "role": "Coiffeuse · Madrid"
            },
            "t2": {
                "quote": "Avant je jonglais entre WhatsApp et Google Agenda et je perdais des heures. Maintenant tout est automatisé.",
                "name": "Diego R.",
                "role": "Coach business · Barcelone"
            },
            "t3": {
                "quote": "La blacklist partagée est en or. Elle m'a déjà évité deux clients problématiques signalés par d'autres pros.",
                "name": "Carla S.",
                "role": "Coach sportif · Valence"
            },
            "t4": {
                "quote": "L'IA répond à mes clients 24h/24 en espagnol et catalan. Je prends des rendez-vous en dormant. Littéralement.",
                "name": "Marc T.",
                "role": "Thérapeute · Barcelone"
            }
        },
        "comparison": {
            "badge": "Comparaison objective",
            "title": "Comment nous nous comparons ?",
            "subtitle": "Un tableau honnête avec les plateformes les plus populaires en 2026.",
            "featureHeader": "Fonctionnalité",
            "us": "Nous",
            "gcal": "Google Cal.",
            "legend": {
                "yes": "Inclus",
                "partial": "Partiel / avec addon",
                "no": "Non disponible"
            },
            "disclaimer": "* Comparaison basée sur les informations publiques de chaque plateforme en juin 2026.",
            "rows": {
                "aiBot": "Bot IA multilingue (24h/24)",
                "reminders": "Rappels automatiques (WhatsApp/Telegram)",
                "deposit": "Acompte anti-no-show",
                "clientDatabase": "Base de données clients",
                "sharedBlacklist": "Blacklist partagée entre pros",
                "multiLang": "Interface en 7 langues",
                "gdpr": "RGPD natif (serveurs UE)",
                "flatFee": "Tarif fixe, sans commission par réservation",
                "regulatedTier": "Vertical privé régulé (sur invitation)"
            }
        },
        "faqInline": {
            "badge": "Questions fréquentes",
            "title": "Ce qu'on nous demande",
            "subtitle": "Réponses rapides aux questions les plus courantes. Pour plus de détails, voir la FAQ complète.",
            "seeAll": "Voir toutes les questions",
            "items": {
                "q1": {
                    "q": "Faut-il savoir coder ?",
                    "a": "Non. Configurez votre agenda et vos services en 5 minutes depuis le tableau de bord. Tout fonctionne sans code."
                },
                "q2": {
                    "q": "Comment mes clients trouvent le bot ?",
                    "a": "À l'inscription nous générons vos liens uniques WhatsApp et Telegram. Vous les mettez sur votre Instagram, site ou messages automatiques."
                },
                "q3": {
                    "q": "Que se passe-t-il avec les no-shows ?",
                    "a": "L'acompte n'est pas remboursé : il vous reste en compensation. La plupart de nos utilisateurs réduisent les no-shows de plus de 60% dès le premier mois."
                },
                "q4": {
                    "q": "Compatible avec mon métier ?",
                    "a": "Oui. Fonctionne avec coiffure, esthétique, coaching, kiné, coach sportif, thérapie, photographie et bien d'autres. Personnalisez vos services et tarifs."
                },
                "q5": {
                    "q": "Quand puis-je commencer ?",
                    "a": "La plateforme est en bêta fermée. Rejoignez la liste d'attente et obtenez un accès prioritaire dans les prochaines semaines."
                },
                "q6": {
                    "q": "RGPD compatible ?",
                    "a": "Oui. Serveurs en UE, chiffrement en transit et au repos, suppression des données à la demande et politique de conservation transparente. RGPD + ePrivacy natifs."
                }
            }
        },
        "waitlist": {
            "badge": "Accès anticipé",
            "title": "Rejoignez la liste d'attente",
            "subtitle": "Soyez parmi les premiers à essayer la plateforme au lancement. Les 20 premiers membres obtiennent 6 mois gratuits + 30% de réduction à vie.",
            "counter": "professionnels déjà inscrits",
            "emailPlaceholder": "vous@email.com",
            "professionPlaceholder": "Votre métier ? (optionnel)",
            "submit": "Rejoindre la liste",
            "submitting": "Envoi...",
            "successTitle": "Vous êtes inscrit !",
            "successDesc": "Nous vous préviendrons par email au lancement. Préparez vos meilleurs services.",
            "positionLabel": "Votre position",
            "successToast": "Bienvenue sur la liste d'attente",
            "alreadyRegistered": "Cet email est déjà sur la liste",
            "errorInvalidEmail": "Saisissez un email valide",
            "errorRateLimit": "Trop d'inscriptions. Réessayez dans 1 heure.",
            "errorGeneric": "Une erreur s'est produite. Réessayez.",
            "errorNetwork": "Hors ligne. Vérifiez votre connexion.",
            "privacyNote": "En vous inscrivant, vous acceptez notre politique de confidentialité. Nous n'envoyons pas de spam. Désinscription possible à tout moment.",
            "professions": {
                "beauty": "💅 Beauté / Esthétique",
                "wellness": "🧘 Bien-être / Massages",
                "fitness": "🏋️ Fitness / Entraînement",
                "coaching": "🎓 Coaching / Conseil",
                "health": "🩺 Santé / Kiné",
                "education": "📚 Éducation / Cours",
                "creative": "🎨 Créatifs / Photo",
                "professional": "⚖️ Services professionnels",
                "home": "🏠 Services à domicile",
                "pets": "🐾 Animaux",
                "events": "🎉 Événements",
                "hospitality": "🍽️ Hôtellerie / Resto",
                "other": "☔ Autres professionnels"
            }
        }
    },

    # ------------------------------------------------------------- DEUTSCH
    "de": {
        "testimonials": {
            "badge": "Was Early Adopter sagen",
            "title": "Profis, die es bereits nutzen",
            "subtitle": "Stimmen von Founding Members. Werde jetzt Teil der ersten Welle.",
            "foundingMember": "Founding",
            "betaNote": "* Die ersten 20 Mitglieder erhalten 6 Monate gratis + 30% Rabatt lebenslang.",
            "t1": {
                "quote": "In 3 Tagen habe ich Last-Minute-Absagen eliminiert. Die Anzahlung wirkt Wunder.",
                "name": "Ana M.",
                "role": "Friseurin · Madrid"
            },
            "t2": {
                "quote": "Früher jonglierte ich WhatsApp + Google Kalender und verlor Stunden. Jetzt alles automatisch.",
                "name": "Diego R.",
                "role": "Business Coach · Barcelona"
            },
            "t3": {
                "quote": "Die geteilte Blacklist ist Gold wert. Sie hat mir bereits zwei problematische Kunden erspart.",
                "name": "Carla S.",
                "role": "Personal Trainerin · Valencia"
            },
            "t4": {
                "quote": "Die KI antwortet 24/7 auf Spanisch und Katalanisch. Ich buche im Schlaf. Wortwörtlich.",
                "name": "Marc T.",
                "role": "Therapeut · Barcelona"
            }
        },
        "comparison": {
            "badge": "Objektiver Vergleich",
            "title": "Wie schneiden wir im Vergleich ab?",
            "subtitle": "Ehrlicher Side-by-Side-Vergleich mit den beliebtesten Plattformen 2026.",
            "featureHeader": "Funktion",
            "us": "Wir",
            "gcal": "Google Kal.",
            "legend": {
                "yes": "Inklusive",
                "partial": "Teilweise / mit Add-on",
                "no": "Nicht verfügbar"
            },
            "disclaimer": "* Vergleich basierend auf öffentlichen Informationen der jeweiligen Plattformen (Stand Juni 2026).",
            "rows": {
                "aiBot": "Mehrsprachiger KI-Bot (24/7)",
                "reminders": "Automatische Erinnerungen (WhatsApp/Telegram)",
                "deposit": "Anzahlung gegen No-Shows",
                "clientDatabase": "Kundendatenbank",
                "sharedBlacklist": "Geteilte Blacklist zwischen Profis",
                "multiLang": "Dashboard in 7 Sprachen",
                "gdpr": "Natives DSGVO (EU-Server)",
                "flatFee": "Flatrate, keine Provision pro Buchung",
                "regulatedTier": "Reguliertes Private-Tier (nur mit Einladung)"
            }
        },
        "faqInline": {
            "badge": "Häufige Fragen",
            "title": "Was uns oft gefragt wird",
            "subtitle": "Schnelle Antworten auf die häufigsten Fragen. Für Details siehe die vollständige FAQ.",
            "seeAll": "Alle Fragen ansehen",
            "items": {
                "q1": {
                    "q": "Muss ich programmieren können?",
                    "a": "Nein. Kalender und Services richtest du in 5 Minuten im Dashboard ein. Alles funktioniert ohne Code."
                },
                "q2": {
                    "q": "Wie finden meine Kunden den Bot?",
                    "a": "Bei der Registrierung generieren wir deine WhatsApp- und Telegram-Links. Diese fügst du in Instagram, Website oder Autoantworten ein."
                },
                "q3": {
                    "q": "Was passiert bei No-Shows?",
                    "a": "Die Anzahlung wird nicht erstattet und bleibt als Ausgleich. Die meisten Nutzer reduzieren No-Shows um mehr als 60% im ersten Monat."
                },
                "q4": {
                    "q": "Kompatibel mit meiner Branche?",
                    "a": "Ja. Funktioniert für Friseur, Kosmetik, Coaching, Physio, Trainer, Therapie, Fotografie und viele mehr. Passe deine Services und Preise individuell an."
                },
                "q5": {
                    "q": "Wann kann ich starten?",
                    "a": "Die Plattform ist in geschlossener Beta. Trage dich in die Warteliste ein und erhalte in den kommenden Wochen Prioritätszugang."
                },
                "q6": {
                    "q": "DSGVO-konform?",
                    "a": "Ja. EU-Server, Verschlüsselung im Transit und im Ruhezustand, Datenlöschung auf Anfrage und transparente Aufbewahrungsrichtlinien. Nativ DSGVO + ePrivacy."
                }
            }
        },
        "waitlist": {
            "badge": "Früher Zugang",
            "title": "Trage dich in die Warteliste ein",
            "subtitle": "Sei einer der Ersten, die die Plattform beim Launch testen. Die ersten 20 Mitglieder erhalten 6 Monate gratis + 30% Rabatt lebenslang.",
            "counter": "Profis haben sich bereits eingetragen",
            "emailPlaceholder": "du@email.com",
            "professionPlaceholder": "Dein Beruf? (optional)",
            "submit": "In die Liste eintragen",
            "submitting": "Wird gesendet...",
            "successTitle": "Du bist dabei!",
            "successDesc": "Wir benachrichtigen dich per E-Mail beim Launch. Bereite deine besten Services vor.",
            "positionLabel": "Deine Position",
            "successToast": "Willkommen auf der Warteliste",
            "alreadyRegistered": "Diese E-Mail ist bereits auf der Liste",
            "errorInvalidEmail": "Gib eine gültige E-Mail ein",
            "errorRateLimit": "Zu viele Anmeldungen. Versuche es in 1 Stunde erneut.",
            "errorGeneric": "Etwas ging schief. Bitte erneut versuchen.",
            "errorNetwork": "Offline. Prüfe deine Verbindung.",
            "privacyNote": "Mit der Anmeldung akzeptierst du unsere Datenschutzrichtlinie. Kein Spam. Abmeldung jederzeit möglich.",
            "professions": {
                "beauty": "💅 Beauty / Kosmetik",
                "wellness": "🧘 Wellness / Massage",
                "fitness": "🏋️ Fitness / Training",
                "coaching": "🎓 Coaching / Beratung",
                "health": "🩺 Gesundheit / Physio",
                "education": "📚 Bildung / Nachhilfe",
                "creative": "🎨 Kreative / Fotografie",
                "professional": "⚖️ Professionelle Dienste",
                "home": "🏠 Dienste zu Hause",
                "pets": "🐾 Haustiere",
                "events": "🎉 Events",
                "hospitality": "🍽️ Gastronomie",
                "other": "☔ Andere Berufe"
            }
        }
    },

    # ------------------------------------------------------------- ITALIANO
    "it": {
        "testimonials": {
            "badge": "Cosa dicono gli early adopter",
            "title": "Professionisti che lo stanno già usando",
            "subtitle": "Testimonianze dei Founding Members. Unisciti alla prima ondata.",
            "foundingMember": "Founding",
            "betaNote": "* I primi 20 membri ottengono 6 mesi gratis + 30% di sconto a vita.",
            "t1": {
                "quote": "In 3 giorni ho eliminato le cancellazioni dell'ultimo minuto. L'acconto fa magia.",
                "name": "Ana M.",
                "role": "Parrucchiera · Madrid"
            },
            "t2": {
                "quote": "Prima usavo WhatsApp + Google Calendar e perdevo ore. Ora tutto automatico.",
                "name": "Diego R.",
                "role": "Business coach · Barcellona"
            },
            "t3": {
                "quote": "La blacklist condivisa è oro. Mi ha già evitato due clienti problematici segnalati da altri pro.",
                "name": "Carla S.",
                "role": "Personal trainer · Valencia"
            },
            "t4": {
                "quote": "L'IA risponde 24/7 in spagnolo e catalano. Prenoto mentre dormo. Letteralmente.",
                "name": "Marc T.",
                "role": "Terapeuta · Barcellona"
            }
        },
        "comparison": {
            "badge": "Confronto oggettivo",
            "title": "Come ci confrontiamo con le altre opzioni?",
            "subtitle": "Tabella onesta con le piattaforme più popolari del 2026.",
            "featureHeader": "Funzionalità",
            "us": "Noi",
            "gcal": "Google Cal.",
            "legend": {
                "yes": "Incluso",
                "partial": "Parziale / con addon",
                "no": "Non disponibile"
            },
            "disclaimer": "* Confronto basato su informazioni pubbliche delle rispettive piattaforme a giugno 2026.",
            "rows": {
                "aiBot": "Bot IA multi-lingua (24/7)",
                "reminders": "Promemoria automatici (WhatsApp/Telegram)",
                "deposit": "Acconto anti no-show",
                "clientDatabase": "Database clienti",
                "sharedBlacklist": "Blacklist condivisa tra pro",
                "multiLang": "Pannello disponibile in 7 lingue",
                "gdpr": "GDPR nativo (server UE)",
                "flatFee": "Tariffa fissa, senza commissioni per prenotazione",
                "regulatedTier": "Vertical privato regolamentato (solo invito)"
            }
        },
        "faqInline": {
            "badge": "Domande frequenti",
            "title": "Cosa ci chiedono",
            "subtitle": "Risposte rapide alle domande più comuni. Per maggiori dettagli, visita la FAQ completa.",
            "seeAll": "Vedi tutte le domande",
            "items": {
                "q1": {
                    "q": "Devo saper programmare?",
                    "a": "No. Configuri agenda e servizi in 5 minuti dal pannello. Tutto funziona senza codice."
                },
                "q2": {
                    "q": "Come trovano il bot i miei clienti?",
                    "a": "Al momento della registrazione generiamo i tuoi link WhatsApp e Telegram unici. Li metti su Instagram, sito o messaggi automatici."
                },
                "q3": {
                    "q": "E i no-show?",
                    "a": "L'acconto non è rimborsabile: ti resta come compensazione. La maggior parte dei nostri utenti riduce i no-show di oltre il 60% nel primo mese."
                },
                "q4": {
                    "q": "È compatibile con la mia attività?",
                    "a": "Sì. Funziona con parrucchieri, estetica, coaching, fisioterapia, personal trainer, terapia, fotografia e molto altro. Personalizzi servizi e prezzi."
                },
                "q5": {
                    "q": "Quando posso iniziare?",
                    "a": "La piattaforma è in beta chiusa. Iscriviti alla lista d'attesa e ottieni accesso prioritario nelle prossime settimane."
                },
                "q6": {
                    "q": "È GDPR compliant?",
                    "a": "Sì. Server in UE, cifratura in transito e a riposo, cancellazione dati su richiesta e policy di ritenzione trasparente. GDPR + ePrivacy nativi."
                }
            }
        },
        "waitlist": {
            "badge": "Accesso anticipato",
            "title": "Iscriviti alla lista d'attesa",
            "subtitle": "Sii tra i primi a provare la piattaforma al lancio. I primi 20 membri ottengono 6 mesi gratis + 30% di sconto a vita.",
            "counter": "professionisti già iscritti",
            "emailPlaceholder": "tu@email.com",
            "professionPlaceholder": "Qual è la tua professione? (opzionale)",
            "submit": "Iscrivimi alla lista",
            "submitting": "Invio...",
            "successTitle": "Sei dentro!",
            "successDesc": "Ti avviseremo via email al lancio. Prepara i tuoi migliori servizi.",
            "positionLabel": "La tua posizione",
            "successToast": "Benvenuto nella lista d'attesa",
            "alreadyRegistered": "Questa email è già nella lista",
            "errorInvalidEmail": "Inserisci un'email valida",
            "errorRateLimit": "Troppe iscrizioni. Riprova tra 1 ora.",
            "errorGeneric": "Qualcosa è andato storto. Riprova.",
            "errorNetwork": "Offline. Controlla la connessione.",
            "privacyNote": "Iscrivendoti accetti la nostra privacy policy. Niente spam. Puoi disiscriverti in qualsiasi momento.",
            "professions": {
                "beauty": "💅 Bellezza / Estetica",
                "wellness": "🧘 Benessere / Massaggi",
                "fitness": "🏋️ Fitness / Allenamento",
                "coaching": "🎓 Coaching / Consulenza",
                "health": "🩺 Salute / Fisioterapia",
                "education": "📚 Educazione / Ripetizioni",
                "creative": "🎨 Creativi / Fotografia",
                "professional": "⚖️ Servizi professionali",
                "home": "🏠 Servizi a domicilio",
                "pets": "🐾 Animali",
                "events": "🎉 Eventi",
                "hospitality": "🍽️ Ristorazione",
                "other": "☔ Altri professionisti"
            }
        }
    },

    # ------------------------------------------------------------- PORTUGUÊS (BR)
    "pt-BR": {
        "testimonials": {
            "badge": "O que dizem os early adopters",
            "title": "Profissionais que já estão usando",
            "subtitle": "Depoimentos dos Founding Members. Junte-se agora à primeira onda.",
            "foundingMember": "Founding",
            "betaNote": "* Os primeiros 20 membros recebem 6 meses grátis + 30% de desconto vitalício.",
            "t1": {
                "quote": "Em 3 dias eliminei os cancelamentos de última hora. O depósito é mágico.",
                "name": "Ana M.",
                "role": "Cabeleireira · Madri"
            },
            "t2": {
                "quote": "Antes usava WhatsApp + Google Calendar e perdia horas. Agora tudo automático.",
                "name": "Diego R.",
                "role": "Coach de negócios · Barcelona"
            },
            "t3": {
                "quote": "A blacklist compartilhada é ouro. Já me poupou de dois clientes problemáticos.",
                "name": "Carla S.",
                "role": "Personal trainer · Valência"
            },
            "t4": {
                "quote": "A IA responde 24/7 em espanhol e catalão. Faço reservas enquanto durmo. Literalmente.",
                "name": "Marc T.",
                "role": "Terapeuta · Barcelona"
            }
        },
        "comparison": {
            "badge": "Comparação objetiva",
            "title": "Como nos comparamos com as outras opções?",
            "subtitle": "Tabela honesta com as plataformas mais populares em 2026.",
            "featureHeader": "Funcionalidade",
            "us": "Nós",
            "gcal": "Google Cal.",
            "legend": {
                "yes": "Incluído",
                "partial": "Parcial / com addon",
                "no": "Não disponível"
            },
            "disclaimer": "* Comparação baseada em informações públicas das plataformas em junho de 2026.",
            "rows": {
                "aiBot": "Bot IA multi-idioma (24/7)",
                "reminders": "Lembretes automáticos (WhatsApp/Telegram)",
                "deposit": "Depósito anti no-show",
                "clientDatabase": "Base de dados de clientes",
                "sharedBlacklist": "Blacklist compartilhada entre profissionais",
                "multiLang": "Painel disponível em 7 idiomas",
                "gdpr": "GDPR nativo (servidores UE)",
                "flatFee": "Tarifa fixa, sem comissão por reserva",
                "regulatedTier": "Vertical privado regulamentado (apenas convite)"
            }
        },
        "faqInline": {
            "badge": "Perguntas frequentes",
            "title": "O que nos perguntam",
            "subtitle": "Respostas rápidas às dúvidas mais comuns. Para mais detalhes, veja a FAQ completa.",
            "seeAll": "Ver todas as perguntas",
            "items": {
                "q1": {
                    "q": "Preciso saber programar?",
                    "a": "Não. Você configura sua agenda e serviços em 5 minutos pelo painel. Tudo funciona sem código."
                },
                "q2": {
                    "q": "Como meus clientes acham o bot?",
                    "a": "No cadastro geramos seus links únicos de WhatsApp e Telegram. Você os coloca no Instagram, site ou mensagens automáticas."
                },
                "q3": {
                    "q": "E os no-shows?",
                    "a": "O depósito não é reembolsável: fica como compensação. A maioria dos nossos usuários reduz no-shows em mais de 60% no primeiro mês."
                },
                "q4": {
                    "q": "É compatível com meu setor?",
                    "a": "Sim. Funciona com beleza, estética, coaching, fisioterapia, personal trainers, terapia, fotografia e muito mais. Configura serviços e preços personalizados."
                },
                "q5": {
                    "q": "Quando posso começar?",
                    "a": "A plataforma está em beta fechada. Entre na lista de espera e receba acesso prioritário nas próximas semanas."
                },
                "q6": {
                    "q": "É compatível com LGPD/GDPR?",
                    "a": "Sim. Servidores na UE, criptografia em trânsito e em repouso, exclusão de dados sob demanda e política de retenção transparente. LGPD + GDPR nativos."
                }
            }
        },
        "waitlist": {
            "badge": "Acesso antecipado",
            "title": "Entre na lista de espera",
            "subtitle": "Seja um dos primeiros a testar a plataforma no lançamento. Os 20 primeiros membros recebem 6 meses grátis + 30% de desconto vitalício.",
            "counter": "profissionais já inscritos",
            "emailPlaceholder": "voce@email.com",
            "professionPlaceholder": "Qual sua profissão? (opcional)",
            "submit": "Entrar na lista",
            "submitting": "Enviando...",
            "successTitle": "Você está dentro!",
            "successDesc": "Vamos te avisar por email no lançamento. Prepare seus melhores serviços.",
            "positionLabel": "Sua posição",
            "successToast": "Bem-vindo à lista de espera",
            "alreadyRegistered": "Este email já está na lista",
            "errorInvalidEmail": "Insira um email válido",
            "errorRateLimit": "Muitas inscrições. Tente novamente em 1 hora.",
            "errorGeneric": "Algo deu errado. Tente novamente.",
            "errorNetwork": "Sem conexão. Verifique sua rede.",
            "privacyNote": "Ao se inscrever você aceita nossa política de privacidade. Não enviamos spam. Você pode se descadastrar a qualquer momento.",
            "professions": {
                "beauty": "💅 Beleza / Estética",
                "wellness": "🧘 Bem-estar / Massagens",
                "fitness": "🏋️ Fitness / Treino",
                "coaching": "🎓 Coaching / Consultoria",
                "health": "🩺 Saúde / Fisioterapia",
                "education": "📚 Educação / Aulas",
                "creative": "🎨 Criativos / Fotografia",
                "professional": "⚖️ Serviços profissionais",
                "home": "🏠 Serviços em casa",
                "pets": "🐾 Pets",
                "events": "🎉 Eventos",
                "hospitality": "🍽️ Restaurantes",
                "other": "☔ Outros profissionais"
            }
        }
    },

    # ------------------------------------------------------------- РУССКИЙ
    "ru": {
        "testimonials": {
            "badge": "Что говорят первые пользователи",
            "title": "Профессионалы уже используют",
            "subtitle": "Отзывы Founding Members. Присоединяйтесь к первой волне.",
            "foundingMember": "Founding",
            "betaNote": "* Первые 20 участников получают 6 месяцев бесплатно + скидка 30% пожизненно.",
            "t1": {
                "quote": "За 3 дня убрала отмены в последнюю минуту. Депозит творит чудеса: нет оплаты — нет записи.",
                "name": "Анна М.",
                "role": "Парикмахер · Мадрид"
            },
            "t2": {
                "quote": "Раньше жонглировал WhatsApp + Google Calendar и терял часы. Теперь всё автоматически.",
                "name": "Диего Р.",
                "role": "Бизнес-коуч · Барселона"
            },
            "t3": {
                "quote": "Общий чёрный список — золото. Уже спас меня от двух проблемных клиентов.",
                "name": "Карла С.",
                "role": "Персональный тренер · Валенсия"
            },
            "t4": {
                "quote": "ИИ отвечает моим клиентам 24/7 на испанском и каталонском. Записываюсь во сне. Буквально.",
                "name": "Марк Т.",
                "role": "Терапевт · Барселона"
            }
        },
        "comparison": {
            "badge": "Объективное сравнение",
            "title": "Как мы сравниваемся с другими вариантами?",
            "subtitle": "Честная таблица с самыми популярными платформами 2026 года.",
            "featureHeader": "Функция",
            "us": "Мы",
            "gcal": "Google Cal.",
            "legend": {
                "yes": "Включено",
                "partial": "Частично / с дополнением",
                "no": "Недоступно"
            },
            "disclaimer": "* Сравнение основано на публичной информации платформ на июнь 2026.",
            "rows": {
                "aiBot": "Многоязычный ИИ-бот (24/7)",
                "reminders": "Автоматические напоминания (WhatsApp/Telegram)",
                "deposit": "Депозит против неявок",
                "clientDatabase": "База клиентов",
                "sharedBlacklist": "Общий чёрный список между профи",
                "multiLang": "Панель на 7 языках",
                "gdpr": "Родной GDPR (серверы ЕС)",
                "flatFee": "Фиксированная тарификация, без комиссий",
                "regulatedTier": "Регулируемый частный тир (по приглашению)"
            }
        },
        "faqInline": {
            "badge": "Частые вопросы",
            "title": "Что нас часто спрашивают",
            "subtitle": "Быстрые ответы на самые частые вопросы. Для подробностей см. полный FAQ.",
            "seeAll": "Все вопросы",
            "items": {
                "q1": {
                    "q": "Нужно ли уметь программировать?",
                    "a": "Нет. Настраиваете расписание и услуги за 5 минут в панели. Всё работает без кода."
                },
                "q2": {
                    "q": "Как мои клиенты найдут бота?",
                    "a": "При регистрации мы генерируем уникальные ссылки WhatsApp и Telegram. Публикуйте их в Instagram, на сайте или в автоответах."
                },
                "q3": {
                    "q": "Что с неявками (no-shows)?",
                    "a": "Депозит не возвращается: остаётся как компенсация. Большинство наших пользователей сокращают неявки более чем на 60% в первый месяц."
                },
                "q4": {
                    "q": "Совместимо с моей нишей?",
                    "a": "Да. Работает для салонов красоты, косметологии, коучинга, физиотерапии, тренеров, терапии, фотографии и многого другого. Настраиваете услуги и цены."
                },
                "q5": {
                    "q": "Когда можно начать?",
                    "a": "Платформа в закрытой бете. Присоединяйтесь к списку ожидания и получите приоритетный доступ в ближайшие недели."
                },
                "q6": {
                    "q": "Соответствует GDPR?",
                    "a": "Да. Серверы в ЕС, шифрование при передаче и хранении, удаление данных по запросу и прозрачная политика хранения. Родные GDPR + ePrivacy."
                }
            }
        },
        "waitlist": {
            "badge": "Ранний доступ",
            "title": "Присоединитесь к списку ожидания",
            "subtitle": "Будьте среди первых, кто попробует платформу на запуске. Первые 20 участников получают 6 месяцев бесплатно + скидку 30% пожизненно.",
            "counter": "профессионалов уже записались",
            "emailPlaceholder": "вы@email.com",
            "professionPlaceholder": "Ваша профессия? (необязательно)",
            "submit": "Присоединиться",
            "submitting": "Отправка...",
            "successTitle": "Вы в списке!",
            "successDesc": "Мы напишем вам на почту при запуске. Подготовьте свои лучшие услуги.",
            "positionLabel": "Ваша позиция",
            "successToast": "Добро пожаловать в список ожидания",
            "alreadyRegistered": "Этот email уже в списке",
            "errorInvalidEmail": "Введите корректный email",
            "errorRateLimit": "Слишком много подписок. Попробуйте через 1 час.",
            "errorGeneric": "Что-то пошло не так. Попробуйте снова.",
            "errorNetwork": "Нет сети. Проверьте соединение.",
            "privacyNote": "Подписываясь, вы принимаете нашу политику конфиденциальности. Мы не спамим. Отписаться можно в любой момент.",
            "professions": {
                "beauty": "💅 Красота / Эстетика",
                "wellness": "🧘 Велнес / Массаж",
                "fitness": "🏋️ Фитнес / Тренировки",
                "coaching": "🎓 Коучинг / Консалтинг",
                "health": "🩺 Здоровье / Физио",
                "education": "📚 Образование / Занятия",
                "creative": "🎨 Креативные / Фото",
                "professional": "⚖️ Профессиональные услуги",
                "home": "🏠 Услуги на дому",
                "pets": "🐾 Питомцы",
                "events": "🎉 Мероприятия",
                "hospitality": "🍽️ Общепит",
                "other": "☔ Другие профессионалы"
            }
        }
    },
}


def update_file(locale: str):
    """Merge new keys into a locale file preserving existing content."""
    path = MESSAGES_DIR / f"{locale}.json"
    if not path.exists():
        print(f"[SKIP] {path} does not exist")
        return

    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    home = data.setdefault("home", {})
    for section_key, section_value in TRANSLATIONS[locale].items():
        home[section_key] = section_value

    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[OK] {locale}.json updated with Fase 2 sections")


if __name__ == "__main__":
    for locale in TRANSLATIONS.keys():
        update_file(locale)
    print("Done.")
