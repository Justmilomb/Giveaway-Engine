import Layout from "@/components/layout";
import { SEO } from "@/components/seo";
import { Mail, ArrowRight } from "lucide-react";

const CONTACT_EMAIL = "info@useblank.ai";

export default function ContactPage() {
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://pickusawinner.com/" },
      { "@type": "ListItem", position: 2, name: "Contact", item: "https://pickusawinner.com/contact" },
    ],
  };

  return (
    <Layout>
      <SEO
        title="Contact"
        description="Pick Us A Winner is a viewing playground made by Certified Random. Reach the studio by email."
        url="/contact"
        keywords="contact pickusawinner, certified random studio, email"
        additionalStructuredData={[breadcrumbData]}
      />

      <div className="max-w-3xl mx-auto py-16 px-4">
        <h1 className="text-4xl md:text-6xl font-black uppercase italic mb-6">
          Contact <span className="text-primary">Us</span>
        </h1>
        <p className="text-xl font-bold text-muted-foreground mb-12">
          The contact form is gone. Best way to reach us is email — we read every one.
        </p>

        <div className="border-4 border-black bg-white shadow-neo p-8 md:p-12 space-y-8">
          <div className="flex items-center gap-3 text-primary">
            <Mail className="w-8 h-8" />
            <span className="font-black uppercase tracking-widest text-sm">
              Email the studio
            </span>
          </div>

          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="block text-3xl md:text-5xl font-black break-all hover:text-primary transition-colors group"
          >
            {CONTACT_EMAIL}
            <ArrowRight className="inline-block w-6 h-6 md:w-10 md:h-10 ml-3 group-hover:translate-x-2 transition-transform" />
          </a>

          <p className="text-base font-medium text-muted-foreground leading-relaxed">
            Pick Us A Winner is a viewing playground built by{" "}
            <a
              href="https://certifiedrandom.onrender.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-bold underline hover:no-underline"
            >
              Certified Random
            </a>
            . Use the email above for anything — feedback, ideas, press, or just to say hi.
          </p>
        </div>
      </div>
    </Layout>
  );
}
