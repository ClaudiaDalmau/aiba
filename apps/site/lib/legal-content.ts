/**
 * Central content module for the 4 legal pages in 6 languages.
 *
 * Structure:
 * - Each locale has 4 pages: avisoLegal, privacidad, terminos, cookies.
 * - Each page has a common shape (see LegalPage type).
 * - Rich text uses a lightweight markdown-lite syntax:
 *     **bold text**            → <strong>
 *     [link text](https://url) → <a target="_blank" rel="noopener">
 *     [link text](/relative)   → <Link href="/relative">
 *     [link text](mailto:x)    → <a href="mailto:x">
 *
 * The Spanish version is the authoritative source. Other locales include a
 * short disclaimer indicating so (customary for Spanish-based SaaS).
 */

import type { Locale } from "@/i18n/routing";

export type Paragraph = string | { list: string[] };

export type Section = {
  h: string;
  paras: Paragraph[];
};

export type CookieRow = {
  name: string;
  type: string;
  purpose: string;
  duration: string;
  required?: boolean;
};

export type LegalPage = {
  metaTitle: string;
  metaDescription: string;
  legalLabel: string; // e.g. "Legal"
  title: string;
  updatedLabel: string; // "Última actualización:"
  updated: string;
  /** optional highlighted intro card (used by privacidad and cookies) */
  intro?: string;
  sections: Section[];
  cookiesTable?: {
    headers: { name: string; type: string; purpose: string; duration: string };
    rows: CookieRow[];
    essentialLabel: string;
  };
  managePrefs?: { title: string; body: string };
  seeAlso: { prefix: string; and: string };
  /** disclaimer shown at the top of non-ES pages */
  authoritativeNote?: string;
};

export type LocaleLegal = {
  labels: {
    avisoLegal: string;
    privacidad: string;
    terminos: string;
    cookies: string;
  };
  avisoLegal: LegalPage;
  privacidad: LegalPage;
  terminos: LegalPage;
  cookies: LegalPage;
};

// -------------------- shared cookie rows (structure identical across locales,
// only "type" and "purpose" fields are translated) --------------------
function cookieRows(t: {
  tec: string; tec_purpose: string;
  pref: string; pref_purpose: string;
  ana: string; ana_purpose: string;
  speed: string; speed_purpose: string;
  duration_7d: string; duration_1y: string;
}): CookieRow[] {
  return [
    { name: "aib_session", type: t.tec, purpose: t.tec_purpose, duration: t.duration_7d, required: true },
    { name: "aib_theme", type: t.pref, purpose: t.pref_purpose, duration: t.duration_1y },
    { name: "_vercel_analytics", type: t.ana, purpose: t.ana_purpose, duration: t.duration_1y },
    { name: "_vercel_speed_insights", type: t.speed, purpose: t.speed_purpose, duration: t.duration_1y },
  ];
}

// -------------------- ES (authoritative source) --------------------
const ES: LocaleLegal = {
  labels: { avisoLegal: "Aviso Legal", privacidad: "Política de Privacidad", terminos: "Términos y Condiciones", cookies: "Política de Cookies" },
  avisoLegal: {
    metaTitle: "Aviso Legal · AIBA",
    metaDescription: "Aviso legal de AIBA conforme a la LSSI-CE: titular, objeto, propiedad intelectual, exclusión de responsabilidad y jurisdicción.",
    legalLabel: "Legal",
    title: "Aviso Legal",
    updatedLabel: "Última actualización",
    updated: "1 de agosto de 2026",
    sections: [
      { h: "1. Datos identificativos del titular", paras: [
        "En cumplimiento con la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE), se informa que el titular del sitio web **aibookingassistant.app** es:",
        { list: [
          "**Titular:** Claudia Dalmau",
          "**NIF:** 45541443V",
          "**Domicilio a efectos de notificaciones:** Barcelona, España",
          "**Email de contacto:** [info@aibookingassistant.app](mailto:info@aibookingassistant.app)",
          "**Sitio web:** [aibookingassistant.app](https://aibookingassistant.app)",
        ]},
      ]},
      { h: "2. Objeto y ámbito de aplicación", paras: [
        "El presente Aviso Legal regula el uso del sitio web aibookingassistant.app (en adelante, «el Sitio Web»), el cual ofrece un servicio SaaS de gestión automatizada de reservas y citas para profesionales autónomas/os. El acceso, navegación y uso del Sitio Web atribuye la condición de usuario/a y supone la aceptación plena de todas las cláusulas incluidas en este Aviso Legal.",
      ]},
      { h: "3. Propiedad intelectual e industrial", paras: [
        "Todos los contenidos del Sitio Web (textos, imágenes, código fuente, diseño, marcas, logotipos, etc.) son propiedad exclusiva del titular o de terceros que han autorizado su uso. Queda expresamente prohibida su reproducción, distribución, comunicación pública, transformación o cualquier otra forma de explotación sin autorización expresa y por escrito del titular.",
      ]},
      { h: "4. Exclusión de responsabilidad", paras: [
        "El titular no se responsabiliza de los perjuicios derivados de interrupciones, virus, errores, fallos técnicos, o del uso indebido del Sitio Web por parte de las personas usuarias. El titular se reserva el derecho a suspender temporalmente el acceso al Sitio Web por motivos de mantenimiento, actualización o mejora del servicio.",
        "El titular no responde del contenido de enlaces externos que puedan aparecer en el Sitio Web, siendo responsabilidad exclusiva del titular del sitio enlazado.",
      ]},
      { h: "5. Legislación aplicable y jurisdicción", paras: [
        "El presente Aviso Legal se rige por la legislación española. Para la resolución de cualquier controversia derivada del uso del Sitio Web, las partes se someten expresamente a los juzgados y tribunales de la ciudad de Barcelona, con renuncia expresa a cualquier otro fuero que pudiera corresponderles.",
      ]},
    ],
    seeAlso: { prefix: "Consulta también nuestra", and: "y" },
  },
  privacidad: {
    metaTitle: "Política de Privacidad · AIBA",
    metaDescription: "Política de privacidad conforme al RGPD y LOPDGDD: responsable, finalidades, datos tratados, conservación, destinatarios, derechos ARSOPL y seguridad.",
    legalLabel: "Legal",
    title: "Política de Privacidad",
    updatedLabel: "Última actualización",
    updated: "1 de agosto de 2026",
    intro: "**Resumen breve:** Tratamos tus datos únicamente para prestar el servicio de gestión de reservas. Servidores en la UE. Cifrado en tránsito y en reposo. Nunca vendemos ni cedemos tus datos a terceros con fines comerciales. Puedes ejercer tus derechos en cualquier momento.",
    sections: [
      { h: "1. Responsable del tratamiento", paras: [
        "Claudia Dalmau, NIF 45541443V, con domicilio en Barcelona (España) y contacto en [info@aibookingassistant.app](mailto:info@aibookingassistant.app), es la responsable del tratamiento de los datos personales recogidos a través del sitio web aibookingassistant.app y de la plataforma AIBA.",
      ]},
      { h: "2. Finalidades del tratamiento", paras: [
        "Tratamos tus datos personales para las siguientes finalidades:",
        { list: [
          "Prestar el servicio de gestión de reservas contratado.",
          "Facturación, cobros y cumplimiento de obligaciones fiscales.",
          "Comunicación operativa (recordatorios, confirmaciones, incidencias).",
          "Prevención del fraude y protección de la comunidad de profesionales.",
          "Mejora del servicio y análisis estadístico agregado.",
          "Envío de comunicaciones comerciales sobre el propio servicio (solo si has dado consentimiento expreso).",
        ]},
      ]},
      { h: "3. Datos que tratamos", paras: [
        "Recabamos y tratamos los siguientes datos:",
        { list: [
          "**Identificativos:** nombre, apellidos, email, teléfono.",
          "**Fiscales:** NIF/CIF, dirección de facturación.",
          "**Bancarios:** IBAN o datos de tarjeta (procesados por el proveedor de pagos).",
          "**Operativos:** historial de reservas, valoraciones, mensajes con el bot.",
          "**Técnicos:** IP, dispositivo, navegador, logs de acceso.",
        ]},
      ]},
      { h: "4. Base jurídica", paras: [
        { list: [
          "**Ejecución de contrato** para prestarte el servicio (art. 6.1.b RGPD).",
          "**Obligación legal** para facturación y contabilidad (art. 6.1.c RGPD).",
          "**Interés legítimo** para prevención de fraude y seguridad (art. 6.1.f RGPD).",
          "**Consentimiento** para comunicaciones comerciales y cookies analíticas (art. 6.1.a RGPD).",
        ]},
      ]},
      { h: "5. Conservación de los datos", paras: [
        "Conservamos tus datos mientras dure la relación contractual. Una vez cancelada tu cuenta, mantenemos los datos bloqueados durante el plazo legalmente exigible (hasta 6 años para documentación mercantil, según el Código de Comercio). Los datos operativos se eliminan definitivamente pasados 30 días desde la cancelación.",
      ]},
      { h: "6. Destinatarios y encargados de tratamiento", paras: [
        "Tus datos solo se comparten con encargados de tratamiento estrictamente necesarios para prestar el servicio:",
        { list: [
          "Proveedores de infraestructura cloud en la Unión Europea.",
          "Procesadores de pago autorizados por la normativa europea.",
          "Proveedores de mensajería (WhatsApp Business API, Telegram Bot API).",
          "Herramientas de analítica agregada y anonimizada.",
        ]},
        "No realizamos transferencias internacionales de datos fuera del Espacio Económico Europeo salvo con las garantías adecuadas previstas en el RGPD.",
      ]},
      { h: "7. Tus derechos", paras: [
        "Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad, así como retirar el consentimiento prestado, enviando un email a [info@aibookingassistant.app](mailto:info@aibookingassistant.app) con copia de tu documento identificativo.",
        "Si consideras que el tratamiento de tus datos no se ajusta a la normativa, tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD): [www.aepd.es](https://www.aepd.es).",
      ]},
      { h: "8. Seguridad", paras: [
        "Aplicamos medidas técnicas y organizativas apropiadas para garantizar la seguridad de los datos, incluyendo cifrado TLS 1.3 en tránsito, cifrado AES-256 en reposo, control de accesos basado en roles, copias de seguridad diarias cifradas y auditorías periódicas de seguridad.",
      ]},
    ],
    seeAlso: { prefix: "Consulta también nuestro", and: "y" },
  },
  terminos: {
    metaTitle: "Términos y Condiciones · AIBA",
    metaDescription: "Términos y condiciones del servicio AIBA: objeto, aceptación, planes, cancelación, obligaciones, propiedad intelectual y jurisdicción.",
    legalLabel: "Legal",
    title: "Términos y Condiciones",
    updatedLabel: "Última actualización",
    updated: "1 de agosto de 2026",
    sections: [
      { h: "1. Objeto", paras: [
        "Los presentes Términos y Condiciones regulan el acceso y uso del servicio SaaS AIBA (en adelante, «el Servicio») titularidad de Claudia Dalmau, NIF 45541443V, con domicilio en Barcelona (España).",
      ]},
      { h: "2. Aceptación", paras: [
        "El registro y uso del Servicio implica la aceptación plena y sin reservas de todas las cláusulas de estos Términos. Si no estás de acuerdo con alguno de los puntos, no debes utilizar el Servicio.",
      ]},
      { h: "3. Descripción del Servicio", paras: [
        "AIBA es una plataforma SaaS que ofrece a profesionales autónomas/os herramientas de gestión de reservas automatizadas a través de bots conversacionales con inteligencia artificial en WhatsApp y Telegram, dashboard analítico web, cobro de depósitos, recordatorios y sistema de valoraciones.",
      ]},
      { h: "4. Registro y cuenta", paras: [
        "Para utilizar el Servicio debes registrarte proporcionando información veraz, actualizada y completa. Eres responsable de mantener la confidencialidad de tus credenciales y de cualquier actividad realizada desde tu cuenta.",
      ]},
      { h: "5. Planes, precios y facturación", paras: [
        "El Servicio se presta bajo distintos planes (Basic, Pro, Premium) con precios y funcionalidades detalladas en la página [/precios](/precios). Todos los planes incluyen un periodo de prueba gratuito de 14 días. Los precios se muestran sin IVA, que se añadirá según la legislación vigente.",
        "La facturación se realiza por adelantado con periodicidad mensual o anual, según hayas elegido. Los pagos son no-reembolsables una vez iniciado el ciclo de facturación, salvo obligación legal en contrario.",
      ]},
      { h: "6. Cancelación", paras: [
        "Puedes cancelar tu suscripción en cualquier momento desde el dashboard sin necesidad de justificación. La cancelación surte efecto al finalizar el ciclo de facturación en curso. No existe período de permanencia.",
      ]},
      { h: "7. Obligaciones de la persona usuaria", paras: [
        { list: [
          "Utilizar el Servicio conforme a la legislación vigente y a la buena fe.",
          "No emplear el Servicio para actividades ilícitas o que atenten contra derechos de terceros.",
          "Respetar la privacidad y dignidad de tus clientes.",
          "Mantener actualizada la información fiscal y de contacto.",
          "No intentar comprometer la seguridad ni el funcionamiento del Servicio.",
        ]},
      ]},
      { h: "8. Propiedad intelectual", paras: [
        "El Servicio y todos sus contenidos (software, diseño, marcas, textos, gráficos) son propiedad exclusiva del titular o de sus licenciantes. Se te concede una licencia limitada, personal, no transferible y revocable para utilizar el Servicio conforme a estos Términos.",
      ]},
      { h: "9. Responsabilidad", paras: [
        "El titular presta el Servicio «tal cual» y hace sus mejores esfuerzos para garantizar la disponibilidad y continuidad. No obstante, no se garantiza que el Servicio esté libre de errores, interrupciones o fallos técnicos. La responsabilidad máxima del titular queda limitada al importe pagado por la persona usuaria en los 12 meses anteriores al hecho generador.",
      ]},
      { h: "10. Modificaciones", paras: [
        "El titular podrá modificar estos Términos cuando lo considere necesario. Los cambios sustanciales se comunicarán con al menos 30 días de antelación por email. El uso continuado del Servicio tras dicha comunicación implicará la aceptación de los nuevos Términos.",
      ]},
      { h: "11. Ley aplicable y jurisdicción", paras: [
        "Los presentes Términos se rigen por la legislación española. Para la resolución de cualquier controversia, las partes se someten expresamente a los juzgados y tribunales de Barcelona, con renuncia expresa a cualquier otro fuero.",
      ]},
      { h: "12. Perfiles múltiples y responsabilidad KYC", paras: [
        "Una misma cuenta puede operar varios perfiles públicos simultáneamente (por ejemplo, para trabajar en distintas ciudades o países). Todos los perfiles están vinculados a una única identidad KYC verificada y a una única suscripción, cuenta bancaria y sistema de facturación.",
        "La persona titular de la cuenta es la única responsable de todos los perfiles creados bajo la misma, incluidas las reservas, los ingresos y las comunicaciones con clientes. No está permitido crear o utilizar perfiles en nombre de terceras personas, ni ceder acceso a la cuenta a otras personas físicas. El incumplimiento de esta obligación podrá suponer la suspensión inmediata de la cuenta y la baja de todos los perfiles asociados.",
      ]},
    ],
    seeAlso: { prefix: "Consulta también nuestro", and: "y" },
  },
  cookies: {
    metaTitle: "Política de Cookies · AIBA",
    metaDescription: "Política de cookies conforme al RGPD: qué son, cuáles utilizamos (técnicas y analíticas) y cómo desactivarlas.",
    legalLabel: "Legal",
    title: "Política de Cookies",
    updatedLabel: "Última actualización",
    updated: "1 de agosto de 2026",
    sections: [
      { h: "1. ¿Qué son las cookies?", paras: [
        "Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Permiten que el sitio recuerde información sobre tu visita, como tus preferencias, tu sesión activa o datos anónimos de uso, para ofrecerte una experiencia mejor y más personalizada.",
      ]},
      { h: "2. Cookies que utilizamos", paras: [
        "A continuación se detallan las cookies utilizadas en el sitio aibookingassistant.app:",
      ]},
      { h: "3. Cookies técnicas y esenciales", paras: [
        "Son necesarias para el correcto funcionamiento del sitio web (por ejemplo, mantener tu sesión iniciada). No requieren consentimiento previo según el artículo 22.2 de la LSSI-CE, ya que sin ellas el servicio no puede prestarse.",
      ]},
      { h: "4. Cookies analíticas", paras: [
        "Nos ayudan a entender cómo se usa el sitio para mejorarlo. Los datos que recogen son anónimos y agregados. Puedes rechazarlas desde el banner de cookies o desde la configuración de tu navegador.",
      ]},
      { h: "5. Cómo desactivar las cookies", paras: [
        "Puedes configurar tu navegador para aceptar, rechazar o eliminar las cookies. Aquí tienes las guías oficiales de los navegadores más habituales:",
        { list: [
          "[Google Chrome](https://support.google.com/chrome/answer/95647)",
          "[Mozilla Firefox](https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias)",
          "[Safari](https://support.apple.com/es-es/guide/safari/sfri11471/mac)",
          "[Microsoft Edge](https://support.microsoft.com/es-es/microsoft-edge)",
        ]},
        "Ten en cuenta que si desactivas las cookies técnicas, algunas funcionalidades del sitio pueden no funcionar correctamente.",
      ]},
      { h: "6. Contacto", paras: [
        "Para cualquier duda sobre esta política de cookies, puedes escribirnos a [info@aibookingassistant.app](mailto:info@aibookingassistant.app).",
      ]},
    ],
    cookiesTable: {
      headers: { name: "Nombre", type: "Tipo", purpose: "Finalidad", duration: "Duración" },
      essentialLabel: "Esencial",
      rows: cookieRows({
        tec: "Técnica (propia)", tec_purpose: "Mantener tu sesión iniciada de forma segura.",
        pref: "Preferencias (propia)", pref_purpose: "Recordar tu preferencia entre modo claro y oscuro.",
        ana: "Analítica (Vercel)", ana_purpose: "Recopilar métricas anónimas de rendimiento y uso para mejorar el sitio. No identifica a personas individuales.",
        speed: "Analítica (Vercel)", speed_purpose: "Medir el rendimiento técnico del sitio (Core Web Vitals).",
        duration_7d: "7 días", duration_1y: "1 año",
      }),
    },
    managePrefs: { title: "¿Quieres cambiar tus preferencias?", body: "Puedes revocar o modificar tu consentimiento en cualquier momento." },
    seeAlso: { prefix: "Consulta también nuestro", and: "y" },
  },
};

// -------------------- non-authoritative locales --------------------
// A note included at the top of every non-ES page.
const NOTE = {
  en: "This document is a translation for information purposes. In case of discrepancy, the Spanish version at [aibookingassistant.app/es/legal](/es/legal/aviso-legal) prevails.",
  fr: "Ce document est une traduction à titre informatif. En cas de divergence, la version espagnole disponible sur [aibookingassistant.app/es/legal](/es/legal/aviso-legal) prévaut.",
  de: "Dieses Dokument ist eine Übersetzung zu Informationszwecken. Bei Abweichungen ist die spanische Fassung unter [aibookingassistant.app/es/legal](/es/legal/aviso-legal) maßgeblich.",
  it: "Il presente documento è una traduzione a scopo informativo. In caso di discrepanza, prevale la versione spagnola disponibile su [aibookingassistant.app/es/legal](/es/legal/aviso-legal).",
  "pt-BR": "Este documento é uma tradução para fins informativos. Em caso de divergência, prevalece a versão em espanhol disponível em [aibookingassistant.app/es/legal](/es/legal/aviso-legal).",
  ru: "Этот документ является переводом для информационных целей. В случае расхождений преимущественную силу имеет испанская версия на [aibookingassistant.app/es/legal](/es/legal/aviso-legal).",
};

const EN: LocaleLegal = {
  labels: { avisoLegal: "Legal Notice", privacidad: "Privacy Policy", terminos: "Terms and Conditions", cookies: "Cookie Policy" },
  avisoLegal: {
    metaTitle: "Legal Notice · AIBA",
    metaDescription: "Legal notice of AIBA under Spanish LSSI-CE: owner, purpose, intellectual property, liability disclaimer and jurisdiction.",
    legalLabel: "Legal",
    title: "Legal Notice",
    updatedLabel: "Last updated",
    updated: "August 1, 2026",
    authoritativeNote: NOTE.en,
    sections: [
      { h: "1. Owner identification", paras: [
        "In compliance with Spanish Law 34/2002 of July 11 on Information Society and E-Commerce Services (LSSI-CE), the owner of the **aibookingassistant.app** website is:",
        { list: [
          "**Owner:** Claudia Dalmau",
          "**Tax ID:** 45541443V",
          "**Registered address for notifications:** Barcelona, Spain",
          "**Contact email:** [info@aibookingassistant.app](mailto:info@aibookingassistant.app)",
          "**Website:** [aibookingassistant.app](https://aibookingassistant.app)",
        ]},
      ]},
      { h: "2. Purpose and scope", paras: [
        "This Legal Notice governs the use of the aibookingassistant.app website (hereinafter, \"the Website\"), which provides a SaaS service for automated bookings and appointments management for self-employed professionals. Accessing, browsing and using the Website confers user status and implies full acceptance of all the clauses included in this Legal Notice.",
      ]},
      { h: "3. Intellectual and industrial property", paras: [
        "All content on the Website (text, images, source code, design, trademarks, logos, etc.) is the exclusive property of the owner or of third parties who have authorized its use. Its reproduction, distribution, public communication, transformation or any other form of exploitation is expressly forbidden without express written authorization from the owner.",
      ]},
      { h: "4. Liability disclaimer", paras: [
        "The owner is not responsible for damages arising from interruptions, viruses, errors, technical failures, or improper use of the Website by users. The owner reserves the right to temporarily suspend access to the Website for maintenance, updates or service improvements.",
        "The owner is not responsible for the content of external links that may appear on the Website, which is the sole responsibility of the owner of the linked site.",
      ]},
      { h: "5. Applicable law and jurisdiction", paras: [
        "This Legal Notice is governed by Spanish law. For the resolution of any dispute arising from the use of the Website, the parties expressly submit to the courts of the city of Barcelona, expressly waiving any other jurisdiction.",
      ]},
    ],
    seeAlso: { prefix: "Also see our", and: "and" },
  },
  privacidad: {
    metaTitle: "Privacy Policy · AIBA",
    metaDescription: "Privacy policy under GDPR: data controller, purposes, data processed, retention, recipients, data subject rights and security.",
    legalLabel: "Legal",
    title: "Privacy Policy",
    updatedLabel: "Last updated",
    updated: "August 1, 2026",
    authoritativeNote: NOTE.en,
    intro: "**Short summary:** We process your data solely to provide the booking management service. Servers in the EU. Encryption in transit and at rest. We never sell or share your data with third parties for commercial purposes. You can exercise your rights at any time.",
    sections: [
      { h: "1. Data controller", paras: [
        "Claudia Dalmau, Tax ID 45541443V, with address in Barcelona (Spain) and contact at [info@aibookingassistant.app](mailto:info@aibookingassistant.app), is the controller responsible for the processing of personal data collected through the aibookingassistant.app website and the AIBA platform.",
      ]},
      { h: "2. Purposes of processing", paras: [
        "We process your personal data for the following purposes:",
        { list: [
          "Providing the booking management service you have contracted.",
          "Billing, collections and compliance with tax obligations.",
          "Operational communication (reminders, confirmations, incidents).",
          "Fraud prevention and protection of the community of professionals.",
          "Service improvement and aggregated statistical analysis.",
          "Sending commercial communications about the service itself (only if you have given express consent).",
        ]},
      ]},
      { h: "3. Data we process", paras: [
        "We collect and process the following data:",
        { list: [
          "**Identification:** name, surname, email, phone.",
          "**Tax data:** tax ID, billing address.",
          "**Banking:** IBAN or card details (processed by the payment provider).",
          "**Operational:** booking history, ratings, messages with the bot.",
          "**Technical:** IP, device, browser, access logs.",
        ]},
      ]},
      { h: "4. Legal basis", paras: [
        { list: [
          "**Performance of contract** to provide you with the service (art. 6.1.b GDPR).",
          "**Legal obligation** for billing and accounting (art. 6.1.c GDPR).",
          "**Legitimate interest** for fraud prevention and security (art. 6.1.f GDPR).",
          "**Consent** for commercial communications and analytics cookies (art. 6.1.a GDPR).",
        ]},
      ]},
      { h: "5. Data retention", paras: [
        "We keep your data for as long as the contractual relationship lasts. Once your account is cancelled, we keep the data blocked for the legally required period (up to 6 years for commercial documentation, according to the Spanish Commercial Code). Operational data is definitively deleted 30 days after cancellation.",
      ]},
      { h: "6. Recipients and processors", paras: [
        "Your data is only shared with processors strictly necessary to provide the service:",
        { list: [
          "Cloud infrastructure providers in the European Union.",
          "Payment processors authorized by European regulations.",
          "Messaging providers (WhatsApp Business API, Telegram Bot API).",
          "Aggregated and anonymized analytics tools.",
        ]},
        "We do not carry out international data transfers outside the European Economic Area unless with the appropriate safeguards provided for in the GDPR.",
      ]},
      { h: "7. Your rights", paras: [
        "You can exercise at any time your rights of access, rectification, erasure, objection, restriction of processing and portability, as well as withdraw the consent given, by sending an email to [info@aibookingassistant.app](mailto:info@aibookingassistant.app) with a copy of your ID document.",
        "If you consider that the processing of your data does not comply with the regulations, you have the right to file a complaint with the Spanish Data Protection Agency (AEPD): [www.aepd.es](https://www.aepd.es).",
      ]},
      { h: "8. Security", paras: [
        "We apply appropriate technical and organizational measures to guarantee data security, including TLS 1.3 encryption in transit, AES-256 encryption at rest, role-based access control, encrypted daily backups and periodic security audits.",
      ]},
    ],
    seeAlso: { prefix: "Also see our", and: "and" },
  },
  terminos: {
    metaTitle: "Terms and Conditions · AIBA",
    metaDescription: "Terms and conditions of AIBA: purpose, acceptance, plans, cancellation, obligations, intellectual property and jurisdiction.",
    legalLabel: "Legal",
    title: "Terms and Conditions",
    updatedLabel: "Last updated",
    updated: "August 1, 2026",
    authoritativeNote: NOTE.en,
    sections: [
      { h: "1. Purpose", paras: [
        "These Terms and Conditions govern access to and use of the SaaS service AIBA (hereinafter, \"the Service\") owned by Claudia Dalmau, Tax ID 45541443V, with address in Barcelona (Spain).",
      ]},
      { h: "2. Acceptance", paras: [
        "Registering and using the Service implies full and unreserved acceptance of all the clauses of these Terms. If you do not agree with any of the points, you must not use the Service.",
      ]},
      { h: "3. Service description", paras: [
        "AIBA is a SaaS platform that offers self-employed professionals tools for automated booking management through AI-powered conversational bots on WhatsApp and Telegram, a web analytics dashboard, deposit collection, reminders and ratings system.",
      ]},
      { h: "4. Registration and account", paras: [
        "To use the Service you must register by providing truthful, updated and complete information. You are responsible for keeping your credentials confidential and for any activity carried out from your account.",
      ]},
      { h: "5. Plans, prices and billing", paras: [
        "The Service is provided under different plans (Basic, Pro, Premium) with prices and features detailed on the [/precios](/precios) page. All plans include a free 14-day trial period. Prices are shown excluding VAT, which will be added according to applicable law.",
        "Billing is done in advance on a monthly or annual basis, according to your choice. Payments are non-refundable once the billing cycle has started, unless required otherwise by law.",
      ]},
      { h: "6. Cancellation", paras: [
        "You can cancel your subscription at any time from the dashboard without justification. Cancellation takes effect at the end of the current billing cycle. There is no minimum commitment period.",
      ]},
      { h: "7. User obligations", paras: [
        { list: [
          "Use the Service in accordance with applicable law and in good faith.",
          "Do not use the Service for illegal activities or activities that violate the rights of third parties.",
          "Respect the privacy and dignity of your clients.",
          "Keep your tax and contact information up to date.",
          "Do not attempt to compromise the security or operation of the Service.",
        ]},
      ]},
      { h: "8. Intellectual property", paras: [
        "The Service and all its contents (software, design, trademarks, texts, graphics) are the exclusive property of the owner or its licensors. You are granted a limited, personal, non-transferable and revocable license to use the Service in accordance with these Terms.",
      ]},
      { h: "9. Liability", paras: [
        "The owner provides the Service \"as is\" and makes its best efforts to guarantee availability and continuity. However, the Service is not guaranteed to be free of errors, interruptions or technical failures. The maximum liability of the owner is limited to the amount paid by the user in the 12 months prior to the event giving rise to liability.",
      ]},
      { h: "10. Amendments", paras: [
        "The owner may modify these Terms whenever deemed necessary. Substantial changes will be communicated at least 30 days in advance by email. Continued use of the Service after such notification will imply acceptance of the new Terms.",
      ]},
      { h: "11. Applicable law and jurisdiction", paras: [
        "These Terms are governed by Spanish law. For the resolution of any dispute, the parties expressly submit to the courts of Barcelona, expressly waiving any other jurisdiction.",
      ]},
      { h: "12. Multiple profiles and KYC responsibility", paras: [
        "A single account may operate several public profiles simultaneously (for example, to work in different cities or countries). All profiles are linked to a single verified KYC identity and to a single subscription, bank account and billing system.",
        "The account holder is the sole responsible party for every profile created under the account, including bookings, revenue and client communications. Creating or using profiles on behalf of third parties, or granting account access to other individuals, is not permitted. Non-compliance may result in immediate account suspension and termination of every associated profile.",
      ]},
    ],
    seeAlso: { prefix: "Also see our", and: "and" },
  },
  cookies: {
    metaTitle: "Cookie Policy · AIBA",
    metaDescription: "Cookie policy under GDPR: what they are, which ones we use (technical and analytics) and how to disable them.",
    legalLabel: "Legal",
    title: "Cookie Policy",
    updatedLabel: "Last updated",
    updated: "August 1, 2026",
    authoritativeNote: NOTE.en,
    sections: [
      { h: "1. What are cookies?", paras: [
        "Cookies are small text files that are stored on your device when you visit a website. They allow the site to remember information about your visit, such as your preferences, your active session or anonymous usage data, to offer you a better and more personalized experience.",
      ]},
      { h: "2. Cookies we use", paras: [
        "Below are the cookies used on the aibookingassistant.app site:",
      ]},
      { h: "3. Essential and technical cookies", paras: [
        "They are necessary for the correct functioning of the website (for example, keeping your session logged in). They do not require prior consent under article 22.2 of the Spanish LSSI-CE, as the service cannot be provided without them.",
      ]},
      { h: "4. Analytics cookies", paras: [
        "They help us understand how the site is used so we can improve it. The data collected is anonymous and aggregated. You can reject them from the cookie banner or from your browser settings.",
      ]},
      { h: "5. How to disable cookies", paras: [
        "You can configure your browser to accept, reject or delete cookies. Here are the official guides for the most common browsers:",
        { list: [
          "[Google Chrome](https://support.google.com/chrome/answer/95647)",
          "[Mozilla Firefox](https://support.mozilla.org/kb/enable-and-disable-cookies-website-preferences)",
          "[Safari](https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac)",
          "[Microsoft Edge](https://support.microsoft.com/microsoft-edge)",
        ]},
        "Please note that if you disable technical cookies, some functionalities of the site may not work correctly.",
      ]},
      { h: "6. Contact", paras: [
        "For any questions about this cookie policy, you can write to us at [info@aibookingassistant.app](mailto:info@aibookingassistant.app).",
      ]},
    ],
    cookiesTable: {
      headers: { name: "Name", type: "Type", purpose: "Purpose", duration: "Duration" },
      essentialLabel: "Essential",
      rows: cookieRows({
        tec: "Technical (first-party)", tec_purpose: "Keep your session logged in securely.",
        pref: "Preferences (first-party)", pref_purpose: "Remember your light/dark mode preference.",
        ana: "Analytics (Vercel)", ana_purpose: "Collect anonymous performance and usage metrics to improve the site. Does not identify individuals.",
        speed: "Analytics (Vercel)", speed_purpose: "Measure the technical performance of the site (Core Web Vitals).",
        duration_7d: "7 days", duration_1y: "1 year",
      }),
    },
    managePrefs: { title: "Want to change your preferences?", body: "You can revoke or modify your consent at any time." },
    seeAlso: { prefix: "Also see our", and: "and" },
  },
};

// -------------------- FR, DE, IT, PT-BR share the same structure --------------------
// Content is a faithful translation of the ES source.

const FR: LocaleLegal = {
  labels: { avisoLegal: "Mentions légales", privacidad: "Politique de confidentialité", terminos: "Conditions générales", cookies: "Politique de cookies" },
  avisoLegal: {
    metaTitle: "Mentions légales · AIBA",
    metaDescription: "Mentions légales d’AIBA conformément à la LSSI-CE espagnole : titulaire, objet, propriété intellectuelle, exclusion de responsabilité et juridiction.",
    legalLabel: "Legal", title: "Mentions légales", updatedLabel: "Dernière mise à jour", updated: "1er août 2026",
    authoritativeNote: NOTE.fr,
    sections: [
      { h: "1. Identification du titulaire", paras: [
        "Conformément à la loi espagnole 34/2002 du 11 juillet sur les services de la société de l’information et du commerce électronique (LSSI-CE), le titulaire du site **aibookingassistant.app** est :",
        { list: [
          "**Titulaire :** Claudia Dalmau",
          "**Numéro fiscal :** 45541443V",
          "**Adresse pour notifications :** Barcelone, Espagne",
          "**Email de contact :** [info@aibookingassistant.app](mailto:info@aibookingassistant.app)",
          "**Site web :** [aibookingassistant.app](https://aibookingassistant.app)",
        ]},
      ]},
      { h: "2. Objet et champ d’application", paras: [
        "Les présentes mentions légales régissent l’utilisation du site aibookingassistant.app (ci-après « le Site »), qui fournit un service SaaS de gestion automatisée de réservations et de rendez-vous pour professionnels indépendants. L’accès, la navigation et l’utilisation du Site confèrent la qualité d’utilisateur et impliquent l’acceptation pleine et entière de toutes les clauses des présentes mentions.",
      ]},
      { h: "3. Propriété intellectuelle et industrielle", paras: [
        "Tout le contenu du Site (textes, images, code source, design, marques, logos, etc.) est la propriété exclusive du titulaire ou de tiers ayant autorisé son utilisation. Toute reproduction, distribution, communication publique, transformation ou toute autre forme d’exploitation est expressément interdite sans autorisation écrite préalable du titulaire.",
      ]},
      { h: "4. Exclusion de responsabilité", paras: [
        "Le titulaire n’est pas responsable des dommages découlant d’interruptions, virus, erreurs, défaillances techniques ou d’une utilisation abusive du Site par les utilisateurs. Le titulaire se réserve le droit de suspendre temporairement l’accès au Site pour maintenance, mise à jour ou amélioration du service.",
        "Le titulaire n’est pas responsable du contenu des liens externes qui pourraient figurer sur le Site, cette responsabilité incombant exclusivement au titulaire du site lié.",
      ]},
      { h: "5. Loi applicable et juridiction", paras: [
        "Les présentes mentions sont régies par la loi espagnole. Pour la résolution de tout litige lié à l’utilisation du Site, les parties se soumettent expressément aux tribunaux de la ville de Barcelone, renonçant expressément à toute autre juridiction.",
      ]},
    ],
    seeAlso: { prefix: "Consultez également nos", and: "et" },
  },
  privacidad: {
    metaTitle: "Politique de confidentialité · AIBA",
    metaDescription: "Politique de confidentialité conforme au RGPD : responsable, finalités, données traitées, conservation, destinataires, droits et sécurité.",
    legalLabel: "Legal", title: "Politique de confidentialité", updatedLabel: "Dernière mise à jour", updated: "1er août 2026",
    authoritativeNote: NOTE.fr,
    intro: "**Résumé bref :** Nous traitons vos données uniquement pour fournir le service de gestion de réservations. Serveurs dans l’UE. Chiffrement en transit et au repos. Nous ne vendons ni ne cédons jamais vos données à des tiers à des fins commerciales. Vous pouvez exercer vos droits à tout moment.",
    sections: [
      { h: "1. Responsable du traitement", paras: [
        "Claudia Dalmau, numéro fiscal 45541443V, domiciliée à Barcelone (Espagne), contact [info@aibookingassistant.app](mailto:info@aibookingassistant.app), est responsable du traitement des données personnelles collectées via le site aibookingassistant.app et la plateforme AIBA.",
      ]},
      { h: "2. Finalités du traitement", paras: [
        "Nous traitons vos données personnelles aux fins suivantes :",
        { list: [
          "Fournir le service de gestion de réservations souscrit.",
          "Facturation, encaissements et obligations fiscales.",
          "Communication opérationnelle (rappels, confirmations, incidents).",
          "Prévention de la fraude et protection de la communauté de professionnels.",
          "Amélioration du service et analyse statistique agrégée.",
          "Envoi de communications commerciales sur le service (uniquement avec consentement explicite).",
        ]},
      ]},
      { h: "3. Données traitées", paras: [
        "Nous collectons et traitons les données suivantes :",
        { list: [
          "**Identification :** nom, prénom, email, téléphone.",
          "**Fiscales :** numéro fiscal, adresse de facturation.",
          "**Bancaires :** IBAN ou données de carte (traitées par le prestataire de paiement).",
          "**Opérationnelles :** historique des réservations, évaluations, messages avec le bot.",
          "**Techniques :** IP, appareil, navigateur, journaux d’accès.",
        ]},
      ]},
      { h: "4. Base juridique", paras: [
        { list: [
          "**Exécution du contrat** pour vous fournir le service (art. 6.1.b RGPD).",
          "**Obligation légale** pour la facturation et la comptabilité (art. 6.1.c RGPD).",
          "**Intérêt légitime** pour la prévention de la fraude et la sécurité (art. 6.1.f RGPD).",
          "**Consentement** pour les communications commerciales et les cookies analytiques (art. 6.1.a RGPD).",
        ]},
      ]},
      { h: "5. Conservation des données", paras: [
        "Nous conservons vos données pendant la durée de la relation contractuelle. Après annulation de votre compte, nous conservons les données bloquées pendant la période légale requise (jusqu’à 6 ans pour les documents commerciaux, selon le Code de commerce espagnol). Les données opérationnelles sont définitivement supprimées 30 jours après l’annulation.",
      ]},
      { h: "6. Destinataires et sous-traitants", paras: [
        "Vos données sont partagées uniquement avec les sous-traitants strictement nécessaires à la fourniture du service :",
        { list: [
          "Fournisseurs d’infrastructure cloud dans l’Union européenne.",
          "Prestataires de paiement autorisés par la réglementation européenne.",
          "Fournisseurs de messagerie (WhatsApp Business API, Telegram Bot API).",
          "Outils d’analyse agrégée et anonymisée.",
        ]},
        "Nous n’effectuons pas de transferts internationaux de données hors de l’Espace économique européen, sauf avec les garanties appropriées prévues par le RGPD.",
      ]},
      { h: "7. Vos droits", paras: [
        "Vous pouvez exercer à tout moment vos droits d’accès, de rectification, d’effacement, d’opposition, de limitation du traitement et de portabilité, ainsi que retirer votre consentement, en envoyant un email à [info@aibookingassistant.app](mailto:info@aibookingassistant.app) avec une copie de votre pièce d’identité.",
        "Si vous considérez que le traitement de vos données ne respecte pas la réglementation, vous avez le droit de déposer une réclamation auprès de l’Agence espagnole de protection des données (AEPD) : [www.aepd.es](https://www.aepd.es).",
      ]},
      { h: "8. Sécurité", paras: [
        "Nous appliquons des mesures techniques et organisationnelles appropriées pour garantir la sécurité des données, notamment le chiffrement TLS 1.3 en transit, le chiffrement AES-256 au repos, un contrôle d’accès basé sur les rôles, des sauvegardes quotidiennes chiffrées et des audits de sécurité périodiques.",
      ]},
    ],
    seeAlso: { prefix: "Consultez également nos", and: "et" },
  },
  terminos: {
    metaTitle: "Conditions générales · AIBA",
    metaDescription: "Conditions générales d’AIBA : objet, acceptation, plans, résiliation, obligations, propriété intellectuelle et juridiction.",
    legalLabel: "Legal", title: "Conditions générales", updatedLabel: "Dernière mise à jour", updated: "1er août 2026",
    authoritativeNote: NOTE.fr,
    sections: [
      { h: "1. Objet", paras: ["Les présentes conditions générales régissent l’accès et l’utilisation du service SaaS AIBA (ci-après « le Service ») dont la titulaire est Claudia Dalmau, numéro fiscal 45541443V, domiciliée à Barcelone (Espagne)."]},
      { h: "2. Acceptation", paras: ["L’inscription et l’utilisation du Service impliquent l’acceptation pleine et sans réserve de toutes les clauses des présentes conditions. Si vous n’êtes pas d’accord avec un point, n’utilisez pas le Service."]},
      { h: "3. Description du Service", paras: ["AIBA est une plateforme SaaS qui offre aux professionnels indépendants des outils de gestion automatisée des réservations via des bots conversationnels avec intelligence artificielle sur WhatsApp et Telegram, un tableau de bord d’analytique web, l’encaissement d’acomptes, des rappels et un système d’évaluations."]},
      { h: "4. Inscription et compte", paras: ["Pour utiliser le Service, vous devez vous inscrire en fournissant des informations véridiques, à jour et complètes. Vous êtes responsable de la confidentialité de vos identifiants et de toute activité effectuée depuis votre compte."]},
      { h: "5. Plans, prix et facturation", paras: [
        "Le Service est fourni selon différents plans (Basic, Pro, Premium) avec les prix et fonctionnalités détaillés sur la page [/precios](/precios). Tous les plans incluent une période d’essai gratuite de 14 jours. Les prix sont affichés hors TVA, qui sera ajoutée selon la législation en vigueur.",
        "La facturation se fait à l’avance sur une base mensuelle ou annuelle, selon votre choix. Les paiements ne sont pas remboursables une fois le cycle de facturation commencé, sauf obligation légale contraire.",
      ]},
      { h: "6. Résiliation", paras: ["Vous pouvez résilier votre abonnement à tout moment depuis le tableau de bord sans justification. La résiliation prend effet à la fin du cycle de facturation en cours. Il n’y a pas de période d’engagement."]},
      { h: "7. Obligations de l’utilisateur", paras: [{ list: [
        "Utiliser le Service conformément à la loi applicable et à la bonne foi.",
        "Ne pas utiliser le Service à des fins illicites ou portant atteinte aux droits des tiers.",
        "Respecter la vie privée et la dignité de vos clients.",
        "Maintenir à jour vos informations fiscales et de contact.",
        "Ne pas tenter de compromettre la sécurité ou le fonctionnement du Service.",
      ]}]},
      { h: "8. Propriété intellectuelle", paras: ["Le Service et l’ensemble de son contenu (logiciel, design, marques, textes, graphiques) sont la propriété exclusive du titulaire ou de ses concédants. Une licence limitée, personnelle, non transférable et révocable vous est accordée pour utiliser le Service conformément aux présentes conditions."]},
      { h: "9. Responsabilité", paras: ["Le titulaire fournit le Service « en l’état » et met tout en œuvre pour garantir sa disponibilité et sa continuité. Toutefois, il n’est pas garanti que le Service soit exempt d’erreurs, d’interruptions ou de défaillances techniques. La responsabilité maximale du titulaire est limitée au montant payé par l’utilisateur au cours des 12 mois précédant le fait générateur."]},
      { h: "10. Modifications", paras: ["Le titulaire pourra modifier les présentes conditions à sa discrétion. Les changements substantiels seront communiqués au moins 30 jours à l’avance par email. L’utilisation continue du Service après cette notification implique l’acceptation des nouvelles conditions."]},
      { h: "11. Loi applicable et juridiction", paras: ["Les présentes conditions sont régies par la loi espagnole. Pour la résolution de tout litige, les parties se soumettent expressément aux tribunaux de Barcelone, renonçant expressément à toute autre juridiction."]},
      { h: "12. Profils multiples et responsabilité KYC", paras: [
        "Un même compte peut exploiter simultanément plusieurs profils publics (par exemple, pour travailler dans plusieurs villes ou pays). Tous les profils sont liés à une unique identité KYC vérifiée ainsi qu'à un unique abonnement, compte bancaire et système de facturation.",
        "Le titulaire du compte est seul responsable de tous les profils créés sous ledit compte, y compris des réservations, des revenus et des communications avec la clientèle. Il n'est pas autorisé à créer ou à utiliser des profils pour le compte de tiers, ni à céder l'accès du compte à d'autres personnes. Tout manquement pourra entraîner la suspension immédiate du compte et la clôture de tous les profils associés.",
      ]},
    ],
    seeAlso: { prefix: "Consultez également nos", and: "et" },
  },
  cookies: {
    metaTitle: "Politique de cookies · AIBA",
    metaDescription: "Politique de cookies conforme au RGPD : ce que sont les cookies, ceux que nous utilisons et comment les désactiver.",
    legalLabel: "Legal", title: "Politique de cookies", updatedLabel: "Dernière mise à jour", updated: "1er août 2026",
    authoritativeNote: NOTE.fr,
    sections: [
      { h: "1. Que sont les cookies ?", paras: ["Les cookies sont de petits fichiers texte stockés sur votre appareil lorsque vous visitez un site web. Ils permettent au site de mémoriser des informations sur votre visite, comme vos préférences, votre session active ou des données anonymes d’utilisation, pour vous offrir une expérience meilleure et plus personnalisée."]},
      { h: "2. Cookies que nous utilisons", paras: ["Vous trouverez ci-dessous les cookies utilisés sur le site aibookingassistant.app :"]},
      { h: "3. Cookies techniques et essentiels", paras: ["Ils sont nécessaires au bon fonctionnement du site (par exemple, maintenir votre session ouverte). Ils ne requièrent pas de consentement préalable selon l’article 22.2 de la LSSI-CE espagnole, car sans eux le service ne peut pas être fourni."]},
      { h: "4. Cookies analytiques", paras: ["Ils nous aident à comprendre l’utilisation du site pour l’améliorer. Les données collectées sont anonymes et agrégées. Vous pouvez les refuser depuis le bandeau de cookies ou depuis les paramètres de votre navigateur."]},
      { h: "5. Comment désactiver les cookies", paras: [
        "Vous pouvez configurer votre navigateur pour accepter, refuser ou supprimer les cookies. Voici les guides officiels des navigateurs les plus courants :",
        { list: [
          "[Google Chrome](https://support.google.com/chrome/answer/95647)",
          "[Mozilla Firefox](https://support.mozilla.org/fr/kb/activer-desactiver-cookies-preferences)",
          "[Safari](https://support.apple.com/fr-fr/guide/safari/sfri11471/mac)",
          "[Microsoft Edge](https://support.microsoft.com/fr-fr/microsoft-edge)",
        ]},
        "Notez que si vous désactivez les cookies techniques, certaines fonctionnalités du site peuvent ne pas fonctionner correctement.",
      ]},
      { h: "6. Contact", paras: ["Pour toute question sur cette politique de cookies, vous pouvez nous écrire à [info@aibookingassistant.app](mailto:info@aibookingassistant.app)."]},
    ],
    cookiesTable: {
      headers: { name: "Nom", type: "Type", purpose: "Finalité", duration: "Durée" },
      essentialLabel: "Essentiel",
      rows: cookieRows({
        tec: "Technique (interne)", tec_purpose: "Maintenir votre session ouverte en toute sécurité.",
        pref: "Préférences (interne)", pref_purpose: "Mémoriser votre préférence de mode clair/sombre.",
        ana: "Analytique (Vercel)", ana_purpose: "Collecter des métriques anonymes de performance et d’usage pour améliorer le site. N’identifie pas les personnes.",
        speed: "Analytique (Vercel)", speed_purpose: "Mesurer la performance technique du site (Core Web Vitals).",
        duration_7d: "7 jours", duration_1y: "1 an",
      }),
    },
    managePrefs: { title: "Vous souhaitez modifier vos préférences ?", body: "Vous pouvez révoquer ou modifier votre consentement à tout moment." },
    seeAlso: { prefix: "Consultez également nos", and: "et" },
  },
};

const DE: LocaleLegal = {
  labels: { avisoLegal: "Rechtliche Hinweise", privacidad: "Datenschutzerklärung", terminos: "Allgemeine Geschäftsbedingungen", cookies: "Cookie-Richtlinie" },
  avisoLegal: {
    metaTitle: "Rechtliche Hinweise · AIBA",
    metaDescription: "Rechtliche Hinweise gemäß spanischem LSSI-CE-Gesetz: Inhaber, Zweck, geistiges Eigentum, Haftungsausschluss und Gerichtsstand.",
    legalLabel: "Legal", title: "Rechtliche Hinweise", updatedLabel: "Zuletzt aktualisiert", updated: "1. August 2026",
    authoritativeNote: NOTE.de,
    sections: [
      { h: "1. Identifikation des Inhabers", paras: [
        "In Erfüllung des spanischen Gesetzes 34/2002 vom 11. Juli über Dienste der Informationsgesellschaft und elektronischen Handel (LSSI-CE) wird darauf hingewiesen, dass der Inhaber der Website **aibookingassistant.app** ist:",
        { list: [
          "**Inhaberin:** Claudia Dalmau",
          "**Steuernummer:** 45541443V",
          "**Anschrift für Zustellungen:** Barcelona, Spanien",
          "**Kontakt-E-Mail:** [info@aibookingassistant.app](mailto:info@aibookingassistant.app)",
          "**Website:** [aibookingassistant.app](https://aibookingassistant.app)",
        ]},
      ]},
      { h: "2. Zweck und Anwendungsbereich", paras: ["Diese rechtlichen Hinweise regeln die Nutzung der Website aibookingassistant.app (im Folgenden „die Website“), die einen SaaS-Dienst zur automatisierten Buchungs- und Terminverwaltung für Selbstständige bietet. Der Zugang, das Surfen und die Nutzung der Website verleihen den Status als Nutzer und implizieren die vollständige Annahme aller in diesen rechtlichen Hinweisen enthaltenen Klauseln."]},
      { h: "3. Geistiges und gewerbliches Eigentum", paras: ["Alle Inhalte der Website (Texte, Bilder, Quellcode, Design, Marken, Logos usw.) sind ausschließliches Eigentum des Inhabers oder Dritter, die deren Nutzung genehmigt haben. Vervielfältigung, Verbreitung, öffentliche Wiedergabe, Umgestaltung oder jede andere Form der Verwertung ist ohne ausdrückliche schriftliche Genehmigung des Inhabers ausdrücklich untersagt."]},
      { h: "4. Haftungsausschluss", paras: [
        "Der Inhaber haftet nicht für Schäden, die durch Unterbrechungen, Viren, Fehler, technische Störungen oder missbräuchliche Nutzung der Website durch Nutzer entstehen. Der Inhaber behält sich das Recht vor, den Zugang zur Website vorübergehend für Wartungs-, Aktualisierungs- oder Verbesserungsarbeiten zu unterbrechen.",
        "Der Inhaber haftet nicht für den Inhalt externer Links, die auf der Website erscheinen können. Die Verantwortung liegt ausschließlich beim Inhaber der verlinkten Seite.",
      ]},
      { h: "5. Anwendbares Recht und Gerichtsstand", paras: ["Diese rechtlichen Hinweise unterliegen dem spanischen Recht. Zur Beilegung von Streitigkeiten aus der Nutzung der Website unterwerfen sich die Parteien ausdrücklich den Gerichten der Stadt Barcelona und verzichten ausdrücklich auf jede andere Gerichtsbarkeit."]},
    ],
    seeAlso: { prefix: "Siehe auch unsere", and: "und" },
  },
  privacidad: {
    metaTitle: "Datenschutzerklärung · AIBA",
    metaDescription: "Datenschutzerklärung gemäß DSGVO: Verantwortlicher, Zwecke, verarbeitete Daten, Aufbewahrung, Empfänger, Rechte und Sicherheit.",
    legalLabel: "Legal", title: "Datenschutzerklärung", updatedLabel: "Zuletzt aktualisiert", updated: "1. August 2026",
    authoritativeNote: NOTE.de,
    intro: "**Kurzzusammenfassung:** Wir verarbeiten deine Daten ausschließlich zur Erbringung des Buchungsverwaltungsdienstes. Server in der EU. Verschlüsselung während der Übertragung und im Ruhezustand. Wir verkaufen oder teilen deine Daten niemals mit Dritten zu kommerziellen Zwecken. Du kannst deine Rechte jederzeit ausüben.",
    sections: [
      { h: "1. Verantwortlicher", paras: ["Claudia Dalmau, Steuernummer 45541443V, mit Sitz in Barcelona (Spanien) und Kontakt unter [info@aibookingassistant.app](mailto:info@aibookingassistant.app), ist verantwortlich für die Verarbeitung personenbezogener Daten, die über die Website aibookingassistant.app und die Plattform AIBA erhoben werden."]},
      { h: "2. Zwecke der Verarbeitung", paras: [
        "Wir verarbeiten deine personenbezogenen Daten zu folgenden Zwecken:",
        { list: [
          "Erbringung des vertraglich vereinbarten Buchungsverwaltungsdienstes.",
          "Rechnungsstellung, Inkasso und Einhaltung steuerlicher Pflichten.",
          "Operative Kommunikation (Erinnerungen, Bestätigungen, Vorfälle).",
          "Betrugsprävention und Schutz der Fachcommunity.",
          "Verbesserung des Dienstes und aggregierte statistische Analyse.",
          "Versand kommerzieller Mitteilungen über den Dienst (nur mit ausdrücklicher Einwilligung).",
        ]},
      ]},
      { h: "3. Verarbeitete Daten", paras: [
        "Wir erheben und verarbeiten folgende Daten:",
        { list: [
          "**Identifikationsdaten:** Name, Nachname, E-Mail, Telefon.",
          "**Steuerdaten:** Steuernummer, Rechnungsadresse.",
          "**Bankdaten:** IBAN oder Kartendaten (verarbeitet vom Zahlungsanbieter).",
          "**Betriebsdaten:** Buchungshistorie, Bewertungen, Bot-Nachrichten.",
          "**Technische Daten:** IP, Gerät, Browser, Zugriffsprotokolle.",
        ]},
      ]},
      { h: "4. Rechtsgrundlage", paras: [{ list: [
        "**Vertragserfüllung** zur Erbringung des Dienstes (Art. 6 Abs. 1 lit. b DSGVO).",
        "**Gesetzliche Verpflichtung** für Rechnungsstellung und Buchhaltung (Art. 6 Abs. 1 lit. c DSGVO).",
        "**Berechtigtes Interesse** zur Betrugsprävention und Sicherheit (Art. 6 Abs. 1 lit. f DSGVO).",
        "**Einwilligung** für kommerzielle Kommunikation und Analyse-Cookies (Art. 6 Abs. 1 lit. a DSGVO).",
      ]}]},
      { h: "5. Aufbewahrung der Daten", paras: ["Wir bewahren deine Daten während der Vertragsbeziehung auf. Nach Kündigung deines Kontos speichern wir die Daten für die gesetzlich vorgeschriebene Frist gesperrt (bis zu 6 Jahre für Geschäftsunterlagen gemäß spanischem Handelsgesetzbuch). Betriebsdaten werden 30 Tage nach der Kündigung endgültig gelöscht."]},
      { h: "6. Empfänger und Auftragsverarbeiter", paras: [
        "Deine Daten werden nur mit Auftragsverarbeitern geteilt, die für die Erbringung des Dienstes unbedingt erforderlich sind:",
        { list: [
          "Cloud-Infrastrukturanbieter in der Europäischen Union.",
          "Von der europäischen Regulierung autorisierte Zahlungsdienstleister.",
          "Messaging-Anbieter (WhatsApp Business API, Telegram Bot API).",
          "Aggregierte und anonymisierte Analysetools.",
        ]},
        "Wir führen keine internationalen Datenübermittlungen außerhalb des Europäischen Wirtschaftsraums durch, außer mit den in der DSGVO vorgesehenen angemessenen Garantien.",
      ]},
      { h: "7. Deine Rechte", paras: [
        "Du kannst jederzeit deine Rechte auf Auskunft, Berichtigung, Löschung, Widerspruch, Einschränkung der Verarbeitung und Datenübertragbarkeit ausüben sowie deine Einwilligung widerrufen, indem du eine E-Mail an [info@aibookingassistant.app](mailto:info@aibookingassistant.app) sendest, zusammen mit einer Kopie deines Ausweisdokuments.",
        "Wenn du der Meinung bist, dass die Verarbeitung deiner Daten nicht den Vorschriften entspricht, hast du das Recht, eine Beschwerde bei der spanischen Datenschutzbehörde (AEPD) einzureichen: [www.aepd.es](https://www.aepd.es).",
      ]},
      { h: "8. Sicherheit", paras: ["Wir setzen geeignete technische und organisatorische Maßnahmen ein, um die Datensicherheit zu gewährleisten, einschließlich TLS 1.3-Verschlüsselung während der Übertragung, AES-256-Verschlüsselung im Ruhezustand, rollenbasierter Zugriffskontrolle, verschlüsselter täglicher Backups und regelmäßiger Sicherheitsaudits."]},
    ],
    seeAlso: { prefix: "Siehe auch unsere", and: "und" },
  },
  terminos: {
    metaTitle: "AGB · AIBA",
    metaDescription: "Allgemeine Geschäftsbedingungen von AIBA: Zweck, Annahme, Tarife, Kündigung, Pflichten, geistiges Eigentum und Gerichtsstand.",
    legalLabel: "Legal", title: "Allgemeine Geschäftsbedingungen", updatedLabel: "Zuletzt aktualisiert", updated: "1. August 2026",
    authoritativeNote: NOTE.de,
    sections: [
      { h: "1. Zweck", paras: ["Diese AGB regeln den Zugang zu und die Nutzung des SaaS-Dienstes AIBA (im Folgenden „der Dienst“), im Eigentum von Claudia Dalmau, Steuernummer 45541443V, mit Sitz in Barcelona (Spanien)."]},
      { h: "2. Annahme", paras: ["Die Registrierung und Nutzung des Dienstes bedeutet die vollständige und vorbehaltlose Annahme aller Klauseln dieser AGB. Wenn du mit einem Punkt nicht einverstanden bist, darfst du den Dienst nicht nutzen."]},
      { h: "3. Beschreibung des Dienstes", paras: ["AIBA ist eine SaaS-Plattform, die Selbstständigen Tools zur automatisierten Buchungsverwaltung über KI-gestützte Chatbots auf WhatsApp und Telegram, ein Web-Analytics-Dashboard, Anzahlungserfassung, Erinnerungen und ein Bewertungssystem bietet."]},
      { h: "4. Registrierung und Konto", paras: ["Zur Nutzung des Dienstes musst du dich mit wahrheitsgemäßen, aktuellen und vollständigen Informationen registrieren. Du bist dafür verantwortlich, die Vertraulichkeit deiner Zugangsdaten zu wahren und für alle Aktivitäten, die von deinem Konto aus durchgeführt werden."]},
      { h: "5. Tarife, Preise und Rechnungsstellung", paras: [
        "Der Dienst wird in verschiedenen Tarifen (Basic, Pro, Premium) mit auf der Seite [/precios](/precios) angegebenen Preisen und Funktionen angeboten. Alle Tarife beinhalten eine kostenlose 14-tägige Testphase. Preise sind ohne MwSt. angegeben, die gemäß geltendem Recht hinzugefügt wird.",
        "Die Rechnungsstellung erfolgt im Voraus monatlich oder jährlich nach deiner Wahl. Zahlungen sind nach Beginn des Abrechnungszyklus nicht erstattungsfähig, sofern gesetzlich nicht anders vorgeschrieben.",
      ]},
      { h: "6. Kündigung", paras: ["Du kannst dein Abonnement jederzeit über das Dashboard ohne Begründung kündigen. Die Kündigung wird am Ende des aktuellen Abrechnungszyklus wirksam. Es gibt keine Mindestlaufzeit."]},
      { h: "7. Nutzerpflichten", paras: [{ list: [
        "Nutzung des Dienstes im Einklang mit geltendem Recht und Treu und Glauben.",
        "Keine Nutzung des Dienstes für illegale Aktivitäten oder solche, die Rechte Dritter verletzen.",
        "Achtung der Privatsphäre und Würde deiner Kunden.",
        "Aktualisierung deiner Steuer- und Kontaktdaten.",
        "Kein Versuch, die Sicherheit oder den Betrieb des Dienstes zu gefährden.",
      ]}]},
      { h: "8. Geistiges Eigentum", paras: ["Der Dienst und alle Inhalte (Software, Design, Marken, Texte, Grafiken) sind ausschließliches Eigentum des Inhabers oder seiner Lizenzgeber. Dir wird eine begrenzte, persönliche, nicht übertragbare und widerrufliche Lizenz zur Nutzung des Dienstes gemäß diesen AGB gewährt."]},
      { h: "9. Haftung", paras: ["Der Inhaber stellt den Dienst „wie besehen“ bereit und bemüht sich nach besten Kräften um Verfügbarkeit und Kontinuität. Es wird jedoch nicht garantiert, dass der Dienst frei von Fehlern, Unterbrechungen oder technischen Störungen ist. Die Höchsthaftung des Inhabers ist auf den vom Nutzer in den 12 Monaten vor dem haftungsauslösenden Ereignis gezahlten Betrag begrenzt."]},
      { h: "10. Änderungen", paras: ["Der Inhaber kann diese AGB nach eigenem Ermessen ändern. Wesentliche Änderungen werden mindestens 30 Tage im Voraus per E-Mail mitgeteilt. Die fortgesetzte Nutzung des Dienstes nach dieser Mitteilung bedeutet die Annahme der neuen AGB."]},
      { h: "11. Anwendbares Recht und Gerichtsstand", paras: ["Diese AGB unterliegen dem spanischen Recht. Zur Beilegung von Streitigkeiten unterwerfen sich die Parteien ausdrücklich den Gerichten von Barcelona und verzichten ausdrücklich auf jede andere Gerichtsbarkeit."]},
      { h: "12. Mehrere Profile und KYC-Verantwortung", paras: [
        "Ein einziges Konto kann gleichzeitig mehrere öffentliche Profile führen (beispielsweise für die Tätigkeit in verschiedenen Städten oder Ländern). Alle Profile sind mit einer einzigen verifizierten KYC-Identität sowie mit einem einzigen Abonnement, Bankkonto und Abrechnungssystem verknüpft.",
        "Der Kontoinhaber ist allein verantwortlich für alle unter dem Konto angelegten Profile, einschließlich Buchungen, Einnahmen und Kundenkommunikation. Die Erstellung oder Nutzung von Profilen im Namen Dritter oder die Weitergabe des Kontozugriffs an andere Personen ist nicht gestattet. Ein Verstoß kann zur sofortigen Sperrung des Kontos und zur Kündigung aller zugehörigen Profile führen.",
      ]},
    ],
    seeAlso: { prefix: "Siehe auch unsere", and: "und" },
  },
  cookies: {
    metaTitle: "Cookie-Richtlinie · AIBA",
    metaDescription: "Cookie-Richtlinie gemäß DSGVO: was Cookies sind, welche wir verwenden und wie du sie deaktivierst.",
    legalLabel: "Legal", title: "Cookie-Richtlinie", updatedLabel: "Zuletzt aktualisiert", updated: "1. August 2026",
    authoritativeNote: NOTE.de,
    sections: [
      { h: "1. Was sind Cookies?", paras: ["Cookies sind kleine Textdateien, die auf deinem Gerät gespeichert werden, wenn du eine Website besuchst. Sie ermöglichen es der Website, Informationen über deinen Besuch zu merken, wie z. B. deine Präferenzen, deine aktive Sitzung oder anonyme Nutzungsdaten, um dir eine bessere und personalisierte Erfahrung zu bieten."]},
      { h: "2. Von uns verwendete Cookies", paras: ["Nachfolgend die auf der Seite aibookingassistant.app verwendeten Cookies:"]},
      { h: "3. Technische und wesentliche Cookies", paras: ["Sie sind für das korrekte Funktionieren der Website notwendig (z. B. um deine Sitzung eingeloggt zu halten). Sie erfordern keine vorherige Einwilligung gemäß Artikel 22.2 des spanischen LSSI-CE, da der Dienst ohne sie nicht bereitgestellt werden kann."]},
      { h: "4. Analyse-Cookies", paras: ["Sie helfen uns zu verstehen, wie die Website genutzt wird, damit wir sie verbessern können. Die erhobenen Daten sind anonym und aggregiert. Du kannst sie über den Cookie-Banner oder in deinen Browsereinstellungen ablehnen."]},
      { h: "5. Cookies deaktivieren", paras: [
        "Du kannst deinen Browser so konfigurieren, dass er Cookies akzeptiert, ablehnt oder löscht. Hier findest du die offiziellen Leitfäden der gängigsten Browser:",
        { list: [
          "[Google Chrome](https://support.google.com/chrome/answer/95647)",
          "[Mozilla Firefox](https://support.mozilla.org/de/kb/cookies-erlauben-und-ablehnen)",
          "[Safari](https://support.apple.com/de-de/guide/safari/sfri11471/mac)",
          "[Microsoft Edge](https://support.microsoft.com/de-de/microsoft-edge)",
        ]},
        "Beachte, dass beim Deaktivieren technischer Cookies einige Funktionen der Website möglicherweise nicht korrekt funktionieren.",
      ]},
      { h: "6. Kontakt", paras: ["Bei Fragen zu dieser Cookie-Richtlinie kannst du uns unter [info@aibookingassistant.app](mailto:info@aibookingassistant.app) schreiben."]},
    ],
    cookiesTable: {
      headers: { name: "Name", type: "Typ", purpose: "Zweck", duration: "Dauer" },
      essentialLabel: "Wesentlich",
      rows: cookieRows({
        tec: "Technisch (Erstanbieter)", tec_purpose: "Deine Sitzung sicher eingeloggt halten.",
        pref: "Präferenzen (Erstanbieter)", pref_purpose: "Deine Hell-/Dunkelmodus-Präferenz merken.",
        ana: "Analyse (Vercel)", ana_purpose: "Anonyme Leistungs- und Nutzungsmetriken zur Verbesserung der Website sammeln. Identifiziert keine Personen.",
        speed: "Analyse (Vercel)", speed_purpose: "Technische Leistung der Website messen (Core Web Vitals).",
        duration_7d: "7 Tage", duration_1y: "1 Jahr",
      }),
    },
    managePrefs: { title: "Möchtest du deine Präferenzen ändern?", body: "Du kannst deine Einwilligung jederzeit widerrufen oder ändern." },
    seeAlso: { prefix: "Siehe auch unsere", and: "und" },
  },
};

const IT: LocaleLegal = {
  labels: { avisoLegal: "Note legali", privacidad: "Informativa sulla privacy", terminos: "Termini e condizioni", cookies: "Informativa sui cookie" },
  avisoLegal: {
    metaTitle: "Note legali · AIBA",
    metaDescription: "Note legali di AIBA ai sensi della LSSI-CE spagnola: titolare, oggetto, proprietà intellettuale, esclusione di responsabilità e giurisdizione.",
    legalLabel: "Legal", title: "Note legali", updatedLabel: "Ultimo aggiornamento", updated: "1 agosto 2026",
    authoritativeNote: NOTE.it,
    sections: [
      { h: "1. Dati identificativi del titolare", paras: [
        "Ai sensi della legge spagnola 34/2002 dell’11 luglio sui servizi della società dell’informazione e del commercio elettronico (LSSI-CE), si informa che il titolare del sito web **aibookingassistant.app** è:",
        { list: [
          "**Titolare:** Claudia Dalmau",
          "**Codice fiscale:** 45541443V",
          "**Indirizzo per notifiche:** Barcellona, Spagna",
          "**Email di contatto:** [info@aibookingassistant.app](mailto:info@aibookingassistant.app)",
          "**Sito web:** [aibookingassistant.app](https://aibookingassistant.app)",
        ]},
      ]},
      { h: "2. Oggetto e ambito di applicazione", paras: ["Le presenti note legali regolano l’uso del sito web aibookingassistant.app (di seguito, «il Sito»), che offre un servizio SaaS di gestione automatizzata di prenotazioni e appuntamenti per liberi/e professionisti/e. L’accesso, la navigazione e l’uso del Sito conferiscono lo status di utente e implicano l’accettazione piena di tutte le clausole delle presenti note."]},
      { h: "3. Proprietà intellettuale e industriale", paras: ["Tutti i contenuti del Sito (testi, immagini, codice sorgente, design, marchi, loghi, ecc.) sono di proprietà esclusiva del titolare o di terzi che ne hanno autorizzato l’uso. Sono espressamente vietate la riproduzione, distribuzione, comunicazione pubblica, trasformazione o qualsiasi altra forma di sfruttamento senza autorizzazione scritta espressa del titolare."]},
      { h: "4. Esclusione di responsabilità", paras: [
        "Il titolare non risponde dei danni derivanti da interruzioni, virus, errori, guasti tecnici o uso improprio del Sito da parte degli utenti. Il titolare si riserva il diritto di sospendere temporaneamente l’accesso al Sito per manutenzione, aggiornamento o miglioramento del servizio.",
        "Il titolare non risponde del contenuto di link esterni che possono comparire sul Sito, essendo responsabilità esclusiva del titolare del sito collegato.",
      ]},
      { h: "5. Legge applicabile e giurisdizione", paras: ["Le presenti note sono regolate dalla legge spagnola. Per la risoluzione di qualsiasi controversia derivante dall’uso del Sito, le parti si sottomettono espressamente ai tribunali di Barcellona, rinunciando espressamente a qualsiasi altro foro."]},
    ],
    seeAlso: { prefix: "Consulta anche i nostri", and: "e" },
  },
  privacidad: {
    metaTitle: "Informativa sulla privacy · AIBA",
    metaDescription: "Informativa sulla privacy ai sensi del GDPR: titolare, finalità, dati trattati, conservazione, destinatari, diritti e sicurezza.",
    legalLabel: "Legal", title: "Informativa sulla privacy", updatedLabel: "Ultimo aggiornamento", updated: "1 agosto 2026",
    authoritativeNote: NOTE.it,
    intro: "**Riepilogo:** Trattiamo i tuoi dati solo per fornire il servizio di gestione prenotazioni. Server nell’UE. Cifratura in transito e a riposo. Non vendiamo né cediamo mai i tuoi dati a terzi a fini commerciali. Puoi esercitare i tuoi diritti in qualsiasi momento.",
    sections: [
      { h: "1. Titolare del trattamento", paras: ["Claudia Dalmau, codice fiscale 45541443V, con sede a Barcellona (Spagna) e contatto [info@aibookingassistant.app](mailto:info@aibookingassistant.app), è la titolare del trattamento dei dati personali raccolti tramite il sito aibookingassistant.app e la piattaforma AIBA."]},
      { h: "2. Finalità del trattamento", paras: [
        "Trattiamo i tuoi dati personali per le seguenti finalità:",
        { list: [
          "Erogare il servizio di gestione prenotazioni contrattualizzato.",
          "Fatturazione, incassi e adempimento degli obblighi fiscali.",
          "Comunicazione operativa (promemoria, conferme, incidenti).",
          "Prevenzione delle frodi e protezione della comunità di professionisti/e.",
          "Miglioramento del servizio e analisi statistica aggregata.",
          "Invio di comunicazioni commerciali sul servizio stesso (solo con consenso esplicito).",
        ]},
      ]},
      { h: "3. Dati trattati", paras: [
        "Raccogliamo e trattiamo i seguenti dati:",
        { list: [
          "**Identificativi:** nome, cognome, email, telefono.",
          "**Fiscali:** codice fiscale, indirizzo di fatturazione.",
          "**Bancari:** IBAN o dati della carta (trattati dal fornitore di pagamenti).",
          "**Operativi:** cronologia prenotazioni, valutazioni, messaggi con il bot.",
          "**Tecnici:** IP, dispositivo, browser, log di accesso.",
        ]},
      ]},
      { h: "4. Base giuridica", paras: [{ list: [
        "**Esecuzione del contratto** per erogare il servizio (art. 6.1.b GDPR).",
        "**Obbligo legale** per fatturazione e contabilità (art. 6.1.c GDPR).",
        "**Legittimo interesse** per prevenzione frodi e sicurezza (art. 6.1.f GDPR).",
        "**Consenso** per comunicazioni commerciali e cookie analitici (art. 6.1.a GDPR).",
      ]}]},
      { h: "5. Conservazione dei dati", paras: ["Conserviamo i tuoi dati per la durata del rapporto contrattuale. Una volta annullato il tuo account, manteniamo i dati bloccati per il periodo legalmente richiesto (fino a 6 anni per la documentazione commerciale, ai sensi del Codice di Commercio spagnolo). I dati operativi vengono eliminati definitivamente 30 giorni dopo l’annullamento."]},
      { h: "6. Destinatari e responsabili del trattamento", paras: [
        "I tuoi dati sono condivisi solo con i responsabili del trattamento strettamente necessari per erogare il servizio:",
        { list: [
          "Fornitori di infrastruttura cloud nell’Unione Europea.",
          "Elaboratori di pagamento autorizzati dalla normativa europea.",
          "Fornitori di messaggistica (WhatsApp Business API, Telegram Bot API).",
          "Strumenti di analisi aggregata e anonimizzata.",
        ]},
        "Non effettuiamo trasferimenti internazionali di dati al di fuori dello Spazio Economico Europeo se non con le garanzie adeguate previste dal GDPR.",
      ]},
      { h: "7. I tuoi diritti", paras: [
        "Puoi esercitare in qualsiasi momento i tuoi diritti di accesso, rettifica, cancellazione, opposizione, limitazione del trattamento e portabilità, nonché revocare il consenso prestato, inviando un’email a [info@aibookingassistant.app](mailto:info@aibookingassistant.app) con copia del tuo documento d’identità.",
        "Se ritieni che il trattamento dei tuoi dati non sia conforme alla normativa, hai il diritto di presentare un reclamo all’Autorità spagnola di protezione dei dati (AEPD): [www.aepd.es](https://www.aepd.es).",
      ]},
      { h: "8. Sicurezza", paras: ["Applichiamo misure tecniche e organizzative adeguate per garantire la sicurezza dei dati, tra cui cifratura TLS 1.3 in transito, cifratura AES-256 a riposo, controllo degli accessi basato sui ruoli, backup giornalieri cifrati e audit di sicurezza periodici."]},
    ],
    seeAlso: { prefix: "Consulta anche i nostri", and: "e" },
  },
  terminos: {
    metaTitle: "Termini e condizioni · AIBA",
    metaDescription: "Termini e condizioni di AIBA: oggetto, accettazione, piani, cancellazione, obblighi, proprietà intellettuale e giurisdizione.",
    legalLabel: "Legal", title: "Termini e condizioni", updatedLabel: "Ultimo aggiornamento", updated: "1 agosto 2026",
    authoritativeNote: NOTE.it,
    sections: [
      { h: "1. Oggetto", paras: ["I presenti Termini e Condizioni regolano l’accesso e l’uso del servizio SaaS AIBA (di seguito, «il Servizio») di proprietà di Claudia Dalmau, codice fiscale 45541443V, con sede a Barcellona (Spagna)."]},
      { h: "2. Accettazione", paras: ["La registrazione e l’uso del Servizio implicano l’accettazione piena e senza riserve di tutte le clausole dei presenti Termini. Se non sei d’accordo con qualche punto, non devi utilizzare il Servizio."]},
      { h: "3. Descrizione del Servizio", paras: ["AIBA è una piattaforma SaaS che offre a liberi/e professionisti/e strumenti di gestione automatizzata delle prenotazioni tramite bot conversazionali con intelligenza artificiale su WhatsApp e Telegram, dashboard analitico web, incasso di acconti, promemoria e sistema di valutazioni."]},
      { h: "4. Registrazione e account", paras: ["Per utilizzare il Servizio devi registrarti fornendo informazioni veritiere, aggiornate e complete. Sei responsabile della riservatezza delle tue credenziali e di qualsiasi attività svolta dal tuo account."]},
      { h: "5. Piani, prezzi e fatturazione", paras: [
        "Il Servizio è fornito con diversi piani (Basic, Pro, Premium) con prezzi e funzionalità dettagliati nella pagina [/precios](/precios). Tutti i piani includono un periodo di prova gratuito di 14 giorni. I prezzi sono mostrati IVA esclusa, che verrà aggiunta secondo la normativa vigente.",
        "La fatturazione avviene in anticipo con cadenza mensile o annuale, a tua scelta. I pagamenti non sono rimborsabili una volta iniziato il ciclo di fatturazione, salvo obbligo di legge contrario.",
      ]},
      { h: "6. Cancellazione", paras: ["Puoi cancellare il tuo abbonamento in qualsiasi momento dalla dashboard senza necessità di giustificazione. La cancellazione ha effetto al termine del ciclo di fatturazione in corso. Non c’è alcun periodo di permanenza."]},
      { h: "7. Obblighi dell’utente", paras: [{ list: [
        "Utilizzare il Servizio in conformità con la normativa vigente e la buona fede.",
        "Non utilizzare il Servizio per attività illecite o lesive dei diritti di terzi.",
        "Rispettare la privacy e la dignità dei tuoi clienti.",
        "Mantenere aggiornate le informazioni fiscali e di contatto.",
        "Non tentare di compromettere la sicurezza o il funzionamento del Servizio.",
      ]}]},
      { h: "8. Proprietà intellettuale", paras: ["Il Servizio e tutti i suoi contenuti (software, design, marchi, testi, grafiche) sono proprietà esclusiva del titolare o dei suoi licenzianti. Ti viene concessa una licenza limitata, personale, non trasferibile e revocabile per utilizzare il Servizio in conformità con i presenti Termini."]},
      { h: "9. Responsabilità", paras: ["Il titolare fornisce il Servizio «così com’è» e fa il massimo sforzo per garantirne disponibilità e continuità. Tuttavia, non si garantisce che il Servizio sia privo di errori, interruzioni o guasti tecnici. La responsabilità massima del titolare è limitata all’importo pagato dall’utente nei 12 mesi precedenti al fatto generatore."]},
      { h: "10. Modifiche", paras: ["Il titolare potrà modificare i presenti Termini a propria discrezione. Le modifiche sostanziali saranno comunicate con almeno 30 giorni di preavviso via email. L’uso continuato del Servizio dopo tale comunicazione implica l’accettazione dei nuovi Termini."]},
      { h: "11. Legge applicabile e giurisdizione", paras: ["I presenti Termini sono regolati dalla legge spagnola. Per la risoluzione di qualsiasi controversia, le parti si sottomettono espressamente ai tribunali di Barcellona, rinunciando espressamente a qualsiasi altro foro."]},
      { h: "12. Profili multipli e responsabilità KYC", paras: [
        "Un unico account può gestire contemporaneamente più profili pubblici (ad esempio per lavorare in città o paesi diversi). Tutti i profili sono collegati a un'unica identità KYC verificata e a un unico abbonamento, conto bancario e sistema di fatturazione.",
        "L'intestatario dell'account è l'unico responsabile di tutti i profili creati al suo interno, comprese prenotazioni, incassi e comunicazioni con i clienti. Non è consentito creare o utilizzare profili per conto di terzi, né concedere l'accesso all'account ad altre persone. L'inosservanza può comportare la sospensione immediata dell'account e la chiusura di tutti i profili collegati.",
      ]},
    ],
    seeAlso: { prefix: "Consulta anche i nostri", and: "e" },
  },
  cookies: {
    metaTitle: "Informativa sui cookie · AIBA",
    metaDescription: "Informativa sui cookie ai sensi del GDPR: cosa sono, quali usiamo e come disattivarli.",
    legalLabel: "Legal", title: "Informativa sui cookie", updatedLabel: "Ultimo aggiornamento", updated: "1 agosto 2026",
    authoritativeNote: NOTE.it,
    sections: [
      { h: "1. Cosa sono i cookie?", paras: ["I cookie sono piccoli file di testo memorizzati sul tuo dispositivo quando visiti un sito web. Consentono al sito di ricordare informazioni sulla tua visita, come le tue preferenze, la sessione attiva o dati anonimi di utilizzo, per offrirti un’esperienza migliore e più personalizzata."]},
      { h: "2. Cookie che utilizziamo", paras: ["Di seguito i cookie utilizzati sul sito aibookingassistant.app:"]},
      { h: "3. Cookie tecnici ed essenziali", paras: ["Sono necessari per il corretto funzionamento del sito (ad esempio, mantenere la tua sessione attiva). Non richiedono consenso preventivo ai sensi dell’articolo 22.2 della LSSI-CE spagnola, poiché senza di essi il servizio non può essere erogato."]},
      { h: "4. Cookie analitici", paras: ["Ci aiutano a capire come viene utilizzato il sito per migliorarlo. I dati raccolti sono anonimi e aggregati. Puoi rifiutarli dal banner dei cookie o dalle impostazioni del tuo browser."]},
      { h: "5. Come disattivare i cookie", paras: [
        "Puoi configurare il tuo browser per accettare, rifiutare o eliminare i cookie. Ecco le guide ufficiali dei browser più comuni:",
        { list: [
          "[Google Chrome](https://support.google.com/chrome/answer/95647)",
          "[Mozilla Firefox](https://support.mozilla.org/it/kb/attivare-disattivare-cookie-siti-web-tracciare-preferenze)",
          "[Safari](https://support.apple.com/it-it/guide/safari/sfri11471/mac)",
          "[Microsoft Edge](https://support.microsoft.com/it-it/microsoft-edge)",
        ]},
        "Tieni presente che se disattivi i cookie tecnici, alcune funzionalità del sito potrebbero non funzionare correttamente.",
      ]},
      { h: "6. Contatto", paras: ["Per qualsiasi domanda su questa informativa sui cookie, puoi scriverci a [info@aibookingassistant.app](mailto:info@aibookingassistant.app)."]},
    ],
    cookiesTable: {
      headers: { name: "Nome", type: "Tipo", purpose: "Finalità", duration: "Durata" },
      essentialLabel: "Essenziale",
      rows: cookieRows({
        tec: "Tecnico (prima parte)", tec_purpose: "Mantenere la tua sessione attiva in modo sicuro.",
        pref: "Preferenze (prima parte)", pref_purpose: "Ricordare la tua preferenza tra modalità chiara e scura.",
        ana: "Analitico (Vercel)", ana_purpose: "Raccogliere metriche anonime di performance e utilizzo per migliorare il sito. Non identifica le persone.",
        speed: "Analitico (Vercel)", speed_purpose: "Misurare la performance tecnica del sito (Core Web Vitals).",
        duration_7d: "7 giorni", duration_1y: "1 anno",
      }),
    },
    managePrefs: { title: "Vuoi cambiare le tue preferenze?", body: "Puoi revocare o modificare il tuo consenso in qualsiasi momento." },
    seeAlso: { prefix: "Consulta anche i nostri", and: "e" },
  },
};

const PT_BR: LocaleLegal = {
  labels: { avisoLegal: "Aviso Legal", privacidad: "Política de Privacidade", terminos: "Termos e Condições", cookies: "Política de Cookies" },
  avisoLegal: {
    metaTitle: "Aviso Legal · AIBA",
    metaDescription: "Aviso legal do AIBA conforme a LSSI-CE espanhola: titular, objeto, propriedade intelectual, isenção de responsabilidade e jurisdição.",
    legalLabel: "Legal", title: "Aviso Legal", updatedLabel: "Última atualização", updated: "1 de agosto de 2026",
    authoritativeNote: NOTE["pt-BR"],
    sections: [
      { h: "1. Dados de identificação do titular", paras: [
        "Em cumprimento à Lei espanhola 34/2002, de 11 de julho, sobre Serviços da Sociedade da Informação e do Comércio Eletrônico (LSSI-CE), informa-se que o titular do site **aibookingassistant.app** é:",
        { list: [
          "**Titular:** Claudia Dalmau",
          "**CIF/NIF:** 45541443V",
          "**Endereço para notificações:** Barcelona, Espanha",
          "**Email de contato:** [info@aibookingassistant.app](mailto:info@aibookingassistant.app)",
          "**Site:** [aibookingassistant.app](https://aibookingassistant.app)",
        ]},
      ]},
      { h: "2. Objeto e âmbito de aplicação", paras: ["O presente Aviso Legal regula o uso do site aibookingassistant.app (doravante, «o Site»), que oferece um serviço SaaS de gestão automatizada de reservas e agendamentos para profissionais autônomos/as. O acesso, a navegação e o uso do Site conferem a condição de usuário/a e implicam a aceitação plena de todas as cláusulas deste Aviso Legal."]},
      { h: "3. Propriedade intelectual e industrial", paras: ["Todo o conteúdo do Site (textos, imagens, código-fonte, design, marcas, logotipos etc.) é de propriedade exclusiva do titular ou de terceiros que autorizaram seu uso. Fica expressamente proibida sua reprodução, distribuição, comunicação pública, transformação ou qualquer outra forma de exploração sem autorização expressa e por escrito do titular."]},
      { h: "4. Isenção de responsabilidade", paras: [
        "O titular não se responsabiliza por danos decorrentes de interrupções, vírus, erros, falhas técnicas ou uso indevido do Site por parte de usuários/as. O titular se reserva o direito de suspender temporariamente o acesso ao Site por motivos de manutenção, atualização ou melhoria do serviço.",
        "O titular não responde pelo conteúdo de links externos que possam aparecer no Site, sendo responsabilidade exclusiva do titular do site vinculado.",
      ]},
      { h: "5. Legislação aplicável e jurisdição", paras: ["O presente Aviso Legal é regido pela legislação espanhola. Para a resolução de qualquer controvérsia decorrente do uso do Site, as partes se submetem expressamente aos juizados e tribunais da cidade de Barcelona, renunciando expressamente a qualquer outro foro."]},
    ],
    seeAlso: { prefix: "Consulte também nossos", and: "e" },
  },
  privacidad: {
    metaTitle: "Política de Privacidade · AIBA",
    metaDescription: "Política de privacidade em conformidade com o RGPD: responsável, finalidades, dados tratados, conservação, destinatários, direitos e segurança.",
    legalLabel: "Legal", title: "Política de Privacidade", updatedLabel: "Última atualização", updated: "1 de agosto de 2026",
    authoritativeNote: NOTE["pt-BR"],
    intro: "**Resumo breve:** Tratamos seus dados unicamente para prestar o serviço de gestão de reservas. Servidores na UE. Criptografia em trânsito e em repouso. Nunca vendemos nem cedemos seus dados a terceiros com fins comerciais. Você pode exercer seus direitos a qualquer momento.",
    sections: [
      { h: "1. Responsável pelo tratamento", paras: ["Claudia Dalmau, CIF/NIF 45541443V, com endereço em Barcelona (Espanha) e contato em [info@aibookingassistant.app](mailto:info@aibookingassistant.app), é a responsável pelo tratamento dos dados pessoais coletados através do site aibookingassistant.app e da plataforma AIBA."]},
      { h: "2. Finalidades do tratamento", paras: [
        "Tratamos seus dados pessoais para as seguintes finalidades:",
        { list: [
          "Prestar o serviço de gestão de reservas contratado.",
          "Faturamento, cobranças e cumprimento de obrigações fiscais.",
          "Comunicação operacional (lembretes, confirmações, incidentes).",
          "Prevenção de fraudes e proteção da comunidade de profissionais.",
          "Melhoria do serviço e análise estatística agregada.",
          "Envio de comunicações comerciais sobre o próprio serviço (somente com consentimento expresso).",
        ]},
      ]},
      { h: "3. Dados que tratamos", paras: [
        "Coletamos e tratamos os seguintes dados:",
        { list: [
          "**Identificação:** nome, sobrenome, email, telefone.",
          "**Fiscais:** CIF/NIF, endereço de faturamento.",
          "**Bancários:** IBAN ou dados de cartão (processados pelo provedor de pagamentos).",
          "**Operacionais:** histórico de reservas, avaliações, mensagens com o bot.",
          "**Técnicos:** IP, dispositivo, navegador, logs de acesso.",
        ]},
      ]},
      { h: "4. Base jurídica", paras: [{ list: [
        "**Execução de contrato** para prestar o serviço (art. 6.1.b RGPD).",
        "**Obrigação legal** para faturamento e contabilidade (art. 6.1.c RGPD).",
        "**Interesse legítimo** para prevenção de fraudes e segurança (art. 6.1.f RGPD).",
        "**Consentimento** para comunicações comerciais e cookies analíticos (art. 6.1.a RGPD).",
      ]}]},
      { h: "5. Conservação dos dados", paras: ["Conservamos seus dados enquanto durar a relação contratual. Após o cancelamento da sua conta, mantemos os dados bloqueados durante o prazo legalmente exigível (até 6 anos para documentação comercial, segundo o Código Comercial espanhol). Os dados operacionais são eliminados definitivamente 30 dias após o cancelamento."]},
      { h: "6. Destinatários e operadores", paras: [
        "Seus dados são compartilhados apenas com operadores estritamente necessários para prestar o serviço:",
        { list: [
          "Provedores de infraestrutura cloud na União Europeia.",
          "Processadores de pagamento autorizados pela normativa europeia.",
          "Provedores de mensageria (WhatsApp Business API, Telegram Bot API).",
          "Ferramentas de analítica agregada e anonimizada.",
        ]},
        "Não realizamos transferências internacionais de dados fora do Espaço Econômico Europeu, salvo com as garantias adequadas previstas no RGPD.",
      ]},
      { h: "7. Seus direitos", paras: [
        "Você pode exercer a qualquer momento seus direitos de acesso, retificação, exclusão, oposição, limitação do tratamento e portabilidade, bem como retirar o consentimento prestado, enviando um email para [info@aibookingassistant.app](mailto:info@aibookingassistant.app) com cópia do seu documento de identidade.",
        "Se considerar que o tratamento dos seus dados não está de acordo com a normativa, tem o direito de apresentar reclamação à Agência Espanhola de Proteção de Dados (AEPD): [www.aepd.es](https://www.aepd.es).",
      ]},
      { h: "8. Segurança", paras: ["Aplicamos medidas técnicas e organizacionais adequadas para garantir a segurança dos dados, incluindo criptografia TLS 1.3 em trânsito, criptografia AES-256 em repouso, controle de acessos baseado em papéis, backups diários criptografados e auditorias de segurança periódicas."]},
    ],
    seeAlso: { prefix: "Consulte também nossos", and: "e" },
  },
  terminos: {
    metaTitle: "Termos e Condições · AIBA",
    metaDescription: "Termos e condições do AIBA: objeto, aceitação, planos, cancelamento, obrigações, propriedade intelectual e jurisdição.",
    legalLabel: "Legal", title: "Termos e Condições", updatedLabel: "Última atualização", updated: "1 de agosto de 2026",
    authoritativeNote: NOTE["pt-BR"],
    sections: [
      { h: "1. Objeto", paras: ["Os presentes Termos e Condições regulam o acesso e uso do serviço SaaS AIBA (doravante, «o Serviço»), de titularidade de Claudia Dalmau, CIF/NIF 45541443V, com endereço em Barcelona (Espanha)."]},
      { h: "2. Aceitação", paras: ["O cadastro e uso do Serviço implica a aceitação plena e sem reservas de todas as cláusulas destes Termos. Se não estiver de acordo com algum ponto, não deve utilizar o Serviço."]},
      { h: "3. Descrição do Serviço", paras: ["AIBA é uma plataforma SaaS que oferece a profissionais autônomos/as ferramentas de gestão de reservas automatizadas através de bots conversacionais com inteligência artificial no WhatsApp e Telegram, dashboard analítico web, cobrança de depósitos, lembretes e sistema de avaliações."]},
      { h: "4. Cadastro e conta", paras: ["Para utilizar o Serviço deve se cadastrar fornecendo informações verdadeiras, atualizadas e completas. Você é responsável por manter a confidencialidade das suas credenciais e por qualquer atividade realizada a partir da sua conta."]},
      { h: "5. Planos, preços e faturamento", paras: [
        "O Serviço é prestado sob diferentes planos (Basic, Pro, Premium) com preços e funcionalidades detalhados na página [/precios](/precios). Todos os planos incluem um período de teste gratuito de 14 dias. Os preços são exibidos sem IVA, que será adicionado conforme a legislação vigente.",
        "O faturamento é feito antecipadamente com periodicidade mensal ou anual, conforme sua escolha. Os pagamentos não são reembolsáveis uma vez iniciado o ciclo de faturamento, salvo obrigação legal em contrário.",
      ]},
      { h: "6. Cancelamento", paras: ["Você pode cancelar sua assinatura a qualquer momento pelo dashboard sem necessidade de justificativa. O cancelamento surte efeito ao final do ciclo de faturamento em curso. Não existe período de permanência."]},
      { h: "7. Obrigações do usuário", paras: [{ list: [
        "Utilizar o Serviço em conformidade com a legislação vigente e com boa-fé.",
        "Não empregar o Serviço em atividades ilícitas ou que atentem contra direitos de terceiros.",
        "Respeitar a privacidade e a dignidade dos seus clientes.",
        "Manter atualizadas as informações fiscais e de contato.",
        "Não tentar comprometer a segurança nem o funcionamento do Serviço.",
      ]}]},
      { h: "8. Propriedade intelectual", paras: ["O Serviço e todos os seus conteúdos (software, design, marcas, textos, gráficos) são propriedade exclusiva do titular ou de seus licenciantes. É concedida a você uma licença limitada, pessoal, intransferível e revogável para utilizar o Serviço conforme estes Termos."]},
      { h: "9. Responsabilidade", paras: ["O titular presta o Serviço «no estado em que se encontra» e envida seus melhores esforços para garantir disponibilidade e continuidade. Contudo, não se garante que o Serviço esteja livre de erros, interrupções ou falhas técnicas. A responsabilidade máxima do titular fica limitada ao valor pago pelo usuário nos 12 meses anteriores ao fato gerador."]},
      { h: "10. Modificações", paras: ["O titular poderá modificar estes Termos quando considerar necessário. As alterações substanciais serão comunicadas com pelo menos 30 dias de antecedência por email. O uso continuado do Serviço após tal comunicação implicará a aceitação dos novos Termos."]},
      { h: "11. Lei aplicável e jurisdição", paras: ["Os presentes Termos são regidos pela legislação espanhola. Para a resolução de qualquer controvérsia, as partes se submetem expressamente aos juizados e tribunais de Barcelona, renunciando expressamente a qualquer outro foro."]},
      { h: "12. Múltiplos perfis e responsabilidade KYC", paras: [
        "Uma mesma conta pode operar simultaneamente vários perfis públicos (por exemplo, para trabalhar em cidades ou países diferentes). Todos os perfis estão vinculados a uma única identidade KYC verificada e a uma única assinatura, conta bancária e sistema de faturamento.",
        "A pessoa titular da conta é a única responsável por todos os perfis criados sob a mesma, incluindo reservas, receitas e comunicações com clientes. Não é permitido criar ou utilizar perfis em nome de terceiros, nem ceder o acesso à conta a outras pessoas. O descumprimento pode implicar a suspensão imediata da conta e o encerramento de todos os perfis associados.",
      ]},
    ],
    seeAlso: { prefix: "Consulte também nossos", and: "e" },
  },
  cookies: {
    metaTitle: "Política de Cookies · AIBA",
    metaDescription: "Política de cookies em conformidade com o RGPD: o que são, quais utilizamos e como desativá-los.",
    legalLabel: "Legal", title: "Política de Cookies", updatedLabel: "Última atualização", updated: "1 de agosto de 2026",
    authoritativeNote: NOTE["pt-BR"],
    sections: [
      { h: "1. O que são cookies?", paras: ["Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita um site. Permitem que o site lembre informações sobre sua visita, como suas preferências, sua sessão ativa ou dados anônimos de uso, para oferecer uma experiência melhor e mais personalizada."]},
      { h: "2. Cookies que utilizamos", paras: ["A seguir, os cookies utilizados no site aibookingassistant.app:"]},
      { h: "3. Cookies técnicos e essenciais", paras: ["São necessários para o correto funcionamento do site (por exemplo, manter sua sessão iniciada). Não requerem consentimento prévio conforme o artigo 22.2 da LSSI-CE espanhola, já que sem eles o serviço não pode ser prestado."]},
      { h: "4. Cookies analíticos", paras: ["Ajudam-nos a entender como o site é utilizado para melhorá-lo. Os dados coletados são anônimos e agregados. Pode recusá-los pelo banner de cookies ou nas configurações do seu navegador."]},
      { h: "5. Como desativar os cookies", paras: [
        "Você pode configurar seu navegador para aceitar, recusar ou eliminar cookies. Aqui estão os guias oficiais dos navegadores mais comuns:",
        { list: [
          "[Google Chrome](https://support.google.com/chrome/answer/95647)",
          "[Mozilla Firefox](https://support.mozilla.org/pt-BR/kb/ative-e-desative-os-cookies-que-os-sites-usam)",
          "[Safari](https://support.apple.com/pt-br/guide/safari/sfri11471/mac)",
          "[Microsoft Edge](https://support.microsoft.com/pt-br/microsoft-edge)",
        ]},
        "Considere que, se desativar os cookies técnicos, algumas funcionalidades do site podem não funcionar corretamente.",
      ]},
      { h: "6. Contato", paras: ["Para qualquer dúvida sobre esta política de cookies, pode escrever-nos em [info@aibookingassistant.app](mailto:info@aibookingassistant.app)."]},
    ],
    cookiesTable: {
      headers: { name: "Nome", type: "Tipo", purpose: "Finalidade", duration: "Duração" },
      essentialLabel: "Essencial",
      rows: cookieRows({
        tec: "Técnico (próprio)", tec_purpose: "Manter sua sessão iniciada de forma segura.",
        pref: "Preferências (próprio)", pref_purpose: "Lembrar sua preferência entre modo claro e escuro.",
        ana: "Analítico (Vercel)", ana_purpose: "Coletar métricas anônimas de desempenho e uso para melhorar o site. Não identifica pessoas.",
        speed: "Analítico (Vercel)", speed_purpose: "Medir o desempenho técnico do site (Core Web Vitals).",
        duration_7d: "7 dias", duration_1y: "1 ano",
      }),
    },
    managePrefs: { title: "Quer alterar suas preferências?", body: "Você pode revogar ou modificar seu consentimento a qualquer momento." },
    seeAlso: { prefix: "Consulte também nossos", and: "e" },
  },
};

const RU: LocaleLegal = {
  labels: { avisoLegal: "Правовая информация", privacidad: "Политика конфиденциальности", terminos: "Условия использования", cookies: "Политика cookies" },
  avisoLegal: {
    metaTitle: "Правовая информация · AIBA",
    metaDescription: "Правовая информация AIBA согласно испанскому LSSI-CE: владелец, цель, интеллектуальная собственность, ограничение ответственности и юрисдикция.",
    legalLabel: "Legal", title: "Правовая информация", updatedLabel: "Последнее обновление", updated: "1 августа 2026",
    authoritativeNote: "Этот документ является переводом для информационных целей. В случае расхождений преимущественную силу имеет испанская версия на [aibookingassistant.app/es/legal](/es/legal/aviso-legal).",
    sections: [
      { h: "1. Идентификация владельца", paras: [
        "В соответствии с испанским законом 34/2002 от 11 июля об услугах информационного общества и электронной коммерции (LSSI-CE) владельцем сайта **aibookingassistant.app** является:",
        { list: [
          "**Владелец:** Claudia Dalmau",
          "**Налоговый идентификатор:** 45541443V",
          "**Адрес для уведомлений:** Барселона, Испания",
          "**Email для связи:** [info@aibookingassistant.app](mailto:info@aibookingassistant.app)",
          "**Сайт:** [aibookingassistant.app](https://aibookingassistant.app)",
        ]},
      ]},
      { h: "2. Цель и область применения", paras: ["Настоящая правовая информация регулирует использование сайта aibookingassistant.app (далее «Сайт»), который предоставляет SaaS-сервис автоматизированного управления записями и приёмами для самозанятых специалистов. Доступ, навигация и использование Сайта присваивают статус пользователя и подразумевают полное принятие всех положений настоящего документа."]},
      { h: "3. Интеллектуальная и промышленная собственность", paras: ["Всё содержимое Сайта (тексты, изображения, исходный код, дизайн, товарные знаки, логотипы и т. д.) является исключительной собственностью владельца или третьих лиц, разрешивших его использование. Воспроизведение, распространение, публичное сообщение, преобразование или любая иная форма использования прямо запрещены без письменного разрешения владельца."]},
      { h: "4. Ограничение ответственности", paras: [
        "Владелец не несёт ответственности за ущерб, возникший в результате перебоев, вирусов, ошибок, технических сбоев или неправомерного использования Сайта пользователями. Владелец оставляет за собой право временно приостанавливать доступ к Сайту для обслуживания, обновлений или улучшений сервиса.",
        "Владелец не несёт ответственности за содержимое внешних ссылок, которые могут появляться на Сайте — это исключительная ответственность владельца связанного сайта.",
      ]},
      { h: "5. Применимое право и юрисдикция", paras: ["Настоящая правовая информация регулируется испанским законодательством. Для разрешения любых споров, вытекающих из использования Сайта, стороны прямо подчиняются судам города Барселоны, прямо отказываясь от любой другой юрисдикции."]},
    ],
    seeAlso: { prefix: "См. также наши", and: "и" },
  },
  privacidad: {
    metaTitle: "Политика конфиденциальности · AIBA",
    metaDescription: "Политика конфиденциальности согласно GDPR: контролёр данных, цели, обрабатываемые данные, хранение, получатели, права и безопасность.",
    legalLabel: "Legal", title: "Политика конфиденциальности", updatedLabel: "Последнее обновление", updated: "1 августа 2026",
    authoritativeNote: "Этот документ является переводом для информационных целей. В случае расхождений преимущественную силу имеет испанская версия на [aibookingassistant.app/es/legal](/es/legal/aviso-legal).",
    intro: "**Краткое резюме:** Мы обрабатываем ваши данные исключительно для оказания услуги управления записями. Серверы в ЕС. Шифрование при передаче и хранении. Мы никогда не продаём и не передаём ваши данные третьим лицам в коммерческих целях. Вы можете реализовать свои права в любое время.",
    sections: [
      { h: "1. Контролёр данных", paras: ["Claudia Dalmau, налоговый идентификатор 45541443V, с адресом в Барселоне (Испания) и контактом [info@aibookingassistant.app](mailto:info@aibookingassistant.app), является контролёром обработки персональных данных, собираемых через сайт aibookingassistant.app и платформу AIBA."]},
      { h: "2. Цели обработки", paras: [
        "Мы обрабатываем ваши персональные данные в следующих целях:",
        { list: [
          "Оказание заказанной услуги управления записями.",
          "Выставление счетов, взимание платы и соблюдение налоговых обязательств.",
          "Операционные коммуникации (напоминания, подтверждения, инциденты).",
          "Предотвращение мошенничества и защита сообщества специалистов.",
          "Улучшение сервиса и агрегированный статистический анализ.",
          "Отправка коммерческих сообщений о самом сервисе (только с явного согласия).",
        ]},
      ]},
      { h: "3. Обрабатываемые данные", paras: [
        "Мы собираем и обрабатываем следующие данные:",
        { list: [
          "**Идентификационные:** имя, фамилия, email, телефон.",
          "**Налоговые:** налоговый идентификатор, адрес для счетов.",
          "**Банковские:** IBAN или данные карты (обрабатываются платёжным провайдером).",
          "**Операционные:** история записей, оценки, сообщения с ботом.",
          "**Технические:** IP, устройство, браузер, логи доступа.",
        ]},
      ]},
      { h: "4. Правовая основа", paras: [{ list: [
        "**Исполнение договора** для оказания услуги (ст. 6.1.b GDPR).",
        "**Юридическая обязанность** для выставления счетов и бухучёта (ст. 6.1.c GDPR).",
        "**Законный интерес** для предотвращения мошенничества и безопасности (ст. 6.1.f GDPR).",
        "**Согласие** для коммерческих коммуникаций и аналитических cookies (ст. 6.1.a GDPR).",
      ]}]},
      { h: "5. Хранение данных", paras: ["Мы храним ваши данные в течение договорных отношений. После отмены аккаунта данные остаются заблокированными в течение юридически требуемого периода (до 6 лет для коммерческой документации, согласно испанскому Торговому кодексу). Операционные данные окончательно удаляются через 30 дней после отмены."]},
      { h: "6. Получатели и обработчики", paras: [
        "Ваши данные передаются только обработчикам, строго необходимым для оказания услуги:",
        { list: [
          "Провайдеры облачной инфраструктуры в Европейском союзе.",
          "Платёжные обработчики, авторизованные европейским регулированием.",
          "Провайдеры сообщений (WhatsApp Business API, Telegram Bot API).",
          "Инструменты агрегированной и анонимной аналитики.",
        ]},
        "Мы не осуществляем международные передачи данных за пределы Европейской экономической зоны, кроме случаев с соответствующими гарантиями, предусмотренными GDPR.",
      ]},
      { h: "7. Ваши права", paras: [
        "Вы можете в любое время реализовать свои права на доступ, исправление, удаление, возражение, ограничение обработки и переносимость, а также отозвать данное согласие, отправив email на [info@aibookingassistant.app](mailto:info@aibookingassistant.app) с копией документа, удостоверяющего личность.",
        "Если вы считаете, что обработка ваших данных не соответствует нормативам, вы имеете право подать жалобу в Испанское агентство по защите данных (AEPD): [www.aepd.es](https://www.aepd.es).",
      ]},
      { h: "8. Безопасность", paras: ["Мы применяем соответствующие технические и организационные меры для обеспечения безопасности данных, включая шифрование TLS 1.3 при передаче, шифрование AES-256 в состоянии покоя, ролевой контроль доступа, зашифрованные ежедневные резервные копии и периодические аудиты безопасности."]},
    ],
    seeAlso: { prefix: "См. также наши", and: "и" },
  },
  terminos: {
    metaTitle: "Условия использования · AIBA",
    metaDescription: "Условия использования AIBA: цель, принятие, планы, отмена, обязательства, интеллектуальная собственность и юрисдикция.",
    legalLabel: "Legal", title: "Условия использования", updatedLabel: "Последнее обновление", updated: "1 августа 2026",
    authoritativeNote: "Этот документ является переводом для информационных целей. В случае расхождений преимущественную силу имеет испанская версия на [aibookingassistant.app/es/legal](/es/legal/aviso-legal).",
    sections: [
      { h: "1. Цель", paras: ["Настоящие Условия регулируют доступ и использование SaaS-сервиса AIBA (далее «Сервис»), принадлежащего Claudia Dalmau, налоговый идентификатор 45541443V, с адресом в Барселоне (Испания)."]},
      { h: "2. Принятие", paras: ["Регистрация и использование Сервиса подразумевают полное и безоговорочное принятие всех положений настоящих Условий. Если вы не согласны с каким-либо пунктом, вы не должны использовать Сервис."]},
      { h: "3. Описание Сервиса", paras: ["AIBA — это SaaS-платформа, предоставляющая самозанятым специалистам инструменты автоматизированного управления записями через диалоговых ИИ-ботов в WhatsApp и Telegram, веб-панель аналитики, сбор депозитов, напоминания и систему оценок."]},
      { h: "4. Регистрация и аккаунт", paras: ["Для использования Сервиса вы должны зарегистрироваться, предоставив правдивую, актуальную и полную информацию. Вы несёте ответственность за конфиденциальность ваших учётных данных и за любую активность, совершённую с вашего аккаунта."]},
      { h: "5. Планы, цены и выставление счетов", paras: [
        "Сервис предоставляется на разных планах (Basic, Pro, Premium) с ценами и функциями, подробно указанными на странице [/precios](/precios). Все планы включают бесплатный пробный период 14 дней. Цены указаны без НДС, который добавляется согласно действующему законодательству.",
        "Выставление счетов производится авансом ежемесячно или ежегодно по вашему выбору. Платежи не возвращаются после начала расчётного цикла, кроме случаев, требуемых законом.",
      ]},
      { h: "6. Отмена", paras: ["Вы можете отменить подписку в любое время из панели без обоснования. Отмена вступает в силу в конце текущего расчётного цикла. Минимального срока обязательств нет."]},
      { h: "7. Обязательства пользователя", paras: [{ list: [
        "Использовать Сервис в соответствии с действующим законодательством и добросовестно.",
        "Не использовать Сервис для незаконной деятельности или нарушающей права третьих лиц.",
        "Уважать конфиденциальность и достоинство ваших клиентов.",
        "Поддерживать актуальность налоговой и контактной информации.",
        "Не пытаться нарушить безопасность или работу Сервиса.",
      ]}]},
      { h: "8. Интеллектуальная собственность", paras: ["Сервис и всё его содержимое (программное обеспечение, дизайн, товарные знаки, тексты, графика) являются исключительной собственностью владельца или его лицензиаров. Вам предоставляется ограниченная, персональная, непередаваемая и отзывная лицензия на использование Сервиса согласно настоящим Условиям."]},
      { h: "9. Ответственность", paras: ["Владелец предоставляет Сервис «как есть» и прилагает все усилия для обеспечения доступности и непрерывности. Однако не гарантируется, что Сервис будет свободен от ошибок, перебоев или технических сбоев. Максимальная ответственность владельца ограничена суммой, уплаченной пользователем за 12 месяцев, предшествовавших событию, вызвавшему ответственность."]},
      { h: "10. Изменения", paras: ["Владелец может изменять настоящие Условия по своему усмотрению. Существенные изменения будут сообщены не менее чем за 30 дней по email. Продолжение использования Сервиса после такого уведомления подразумевает принятие новых Условий."]},
      { h: "11. Применимое право и юрисдикция", paras: ["Настоящие Условия регулируются испанским законодательством. Для разрешения любых споров стороны прямо подчиняются судам Барселоны, прямо отказываясь от любой другой юрисдикции."]},
      { h: "12. Несколько профилей и ответственность KYC", paras: [
        "С одной учётной записи можно одновременно вести несколько публичных профилей (например, для работы в разных городах или странах). Все профили связаны с единой верифицированной KYC-личностью, а также с одной подпиской, банковским счётом и системой выставления счетов.",
        "Владелец учётной записи несёт единоличную ответственность за все профили, созданные в её рамках, включая бронирования, доходы и переписку с клиентами. Создание или использование профилей от имени третьих лиц, а также передача доступа к учётной записи другим лицам не допускается. Нарушение может привести к немедленной блокировке учётной записи и удалению всех связанных профилей.",
      ]},
    ],
    seeAlso: { prefix: "См. также наши", and: "и" },
  },
  cookies: {
    metaTitle: "Политика cookies · AIBA",
    metaDescription: "Политика cookies согласно GDPR: что это, какие мы используем и как их отключить.",
    legalLabel: "Legal", title: "Политика cookies", updatedLabel: "Последнее обновление", updated: "1 августа 2026",
    authoritativeNote: "Этот документ является переводом для информационных целей. В случае расхождений преимущественную силу имеет испанская версия на [aibookingassistant.app/es/legal](/es/legal/aviso-legal).",
    sections: [
      { h: "1. Что такое cookies?", paras: ["Cookies — это небольшие текстовые файлы, которые сохраняются на вашем устройстве при посещении сайта. Они позволяют сайту запоминать информацию о вашем визите: предпочтения, активную сессию или анонимные данные использования, чтобы предложить вам лучший и более персонализированный опыт."]},
      { h: "2. Cookies, которые мы используем", paras: ["Ниже приведены cookies, используемые на сайте aibookingassistant.app:"]},
      { h: "3. Технические и существенные cookies", paras: ["Они необходимы для корректной работы сайта (например, поддержание сессии). Не требуют предварительного согласия согласно статье 22.2 испанского LSSI-CE, так как без них сервис не может быть предоставлен."]},
      { h: "4. Аналитические cookies", paras: ["Помогают нам понять, как используется сайт, чтобы улучшить его. Собираемые данные анонимны и агрегированы. Вы можете отклонить их через баннер cookies или настройки браузера."]},
      { h: "5. Как отключить cookies", paras: [
        "Вы можете настроить браузер для приёма, отклонения или удаления cookies. Официальные руководства самых распространённых браузеров:",
        { list: [
          "[Google Chrome](https://support.google.com/chrome/answer/95647)",
          "[Mozilla Firefox](https://support.mozilla.org/ru/kb/vklyuchenie-i-otklyuchenie-kuki-veb-sajtami-i)",
          "[Safari](https://support.apple.com/ru-ru/guide/safari/sfri11471/mac)",
          "[Microsoft Edge](https://support.microsoft.com/ru-ru/microsoft-edge)",
        ]},
        "Учтите, что при отключении технических cookies некоторые функции сайта могут работать некорректно.",
      ]},
      { h: "6. Контакты", paras: ["По любым вопросам об этой политике cookies напишите нам на [info@aibookingassistant.app](mailto:info@aibookingassistant.app)."]},
    ],
    cookiesTable: {
      headers: { name: "Название", type: "Тип", purpose: "Цель", duration: "Срок" },
      essentialLabel: "Обязательные",
      rows: cookieRows({
        tec: "Технические (первая сторона)", tec_purpose: "Безопасно поддерживать вашу сессию.",
        pref: "Настройки (первая сторона)", pref_purpose: "Запоминать предпочтение светлой/тёмной темы.",
        ana: "Аналитические (Vercel)", ana_purpose: "Сбор анонимной статистики производительности и использования для улучшения сайта. Не идентифицирует людей.",
        speed: "Аналитические (Vercel)", speed_purpose: "Измерение технической производительности сайта (Core Web Vitals).",
        duration_7d: "7 дней", duration_1y: "1 год",
      }),
    },
    managePrefs: { title: "Хотите изменить свои настройки?", body: "Вы можете отозвать или изменить согласие в любое время." },
    seeAlso: { prefix: "См. также наши", and: "и" },
  },
};

// -------------------- registry --------------------
export const LEGAL_CONTENT: Record<Locale, LocaleLegal> = {
  es: ES,
  en: EN,
  fr: FR,
  de: DE,
  it: IT,
  "pt-BR": PT_BR,
  ru: RU,
  // Sin traducción legal revisada todavía: se muestra la versión en inglés (prevalece la española).
  nl: EN,
  ro: EN,
  pl: EN,
};

export function getLegalContent(locale: string): LocaleLegal {
  if (locale in LEGAL_CONTENT) return LEGAL_CONTENT[locale as Locale];
  return ES;
}
