import { SERVICES, servicesInCategory, type ServiceDef } from "@/lib/marketplace/catalog";

export const MARKET_ORIGIN = "https://sukull.com";

export const MARKET_FAQS: { q: string; a: string }[] = [
  {
    q: "Sukull bu hizmetlerden ücret alıyor mu?",
    a: "Hayır. İlan açmak, teklif vermek ve yazışmak ücretsizdir. Komisyon veya teklif bedeli yoktur.",
  },
  {
    q: "Teklif nasıl gelir?",
    a: "İlanın incelenir, onaylanınca uyan hizmet verenler görür. En fazla dört teklif gelir. Yeni teklifte e-posta gider.",
  },
  {
    q: "Hizmet verenler her ilanı görür mü?",
    a: "Hayır. Yerinde işler yalnızca aynı şehirdeki hizmet verenlere gider. Online işler ve bazı uzaktan hizmetler her yerden görünür.",
  },
  {
    q: "Hizmet vermek için ne gerekir?",
    a: "Hesap açıp Hizmetlerim'e verdiğin işleri eklersin. Uyan yeni ilan olursa üç günde bir kısa e-posta gelir.",
  },
];

export function servicePath(slug: string) {
  return `/hizmet/${slug}`;
}

export function servicePlaceNote(service: ServiceDef) {
  if (service.anywhere) {
    return "Bu iş uzaktan veya şehirler arası yapılır. İlan, konumdan bağımsız hizmet verenlere gider.";
  }
  return "Yerinde işler yalnızca aynı şehirdeki hizmet verenlere gösterilir. Online seçersen şehir fark etmez.";
}

export function serviceMeta(service: ServiceDef) {
  return {
    title: `${service.name} teklifi al`,
    description: `${service.name} için ücretsiz ilan aç, en fazla dört teklif karşılaştır. Sukull komisyon almaz.`,
  };
}

export function listedQuestions(service: ServiceDef) {
  return service.questions.filter((question) => !question.parent).slice(0, 6);
}

export function relatedServices(service: ServiceDef) {
  return servicesInCategory(service.categorySlug).filter((item) => item.slug !== service.slug).slice(0, 8);
}

export function serviceJsonLd(service: ServiceDef) {
  const meta = serviceMeta(service);
  const url = `${MARKET_ORIGIN}${servicePath(service.slug)}`;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    serviceType: service.name,
    category: service.category,
    description: meta.description,
    url,
    provider: {
      "@type": "Organization",
      name: "Sukull",
      url: MARKET_ORIGIN,
    },
    areaServed: "TR",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "TRY",
      description: "İlan açmak ve teklif almak ücretsizdir.",
    },
  };
}

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: MARKET_FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Sukull",
    url: MARKET_ORIGIN,
    inLanguage: "tr-TR",
    description: "Ücretsiz hizmet ilanı aç, teklifleri karşılaştır. Komisyon yok.",
  };
}

export function sitemapServicePaths() {
  return ["/hizmet", "/hizmet-ver", ...SERVICES.map((service) => servicePath(service.slug))];
}

