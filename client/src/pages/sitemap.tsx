import Layout from "@/components/layout";
import { SEO } from "@/components/seo";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ExternalLink, FileText, Zap, HelpCircle, Shield } from "lucide-react";

export default function SitemapPage() {
  const sitemapSections = [
    {
      title: "Main Tools",
      icon: Zap,
      links: [
        { url: "/giveaway-generator", label: "Instagram Giveaway Picker" },
        { url: "/tool", label: "Comment Picker Tool" },
        { url: "/spin-the-wheel", label: "Spin the Wheel" },
        { url: "/random-name-picker", label: "Random Name Picker" },
        { url: "/random-option-picker", label: "Random Option Picker" },
      ],
    },
    {
      title: "Platform Guides",
      icon: ExternalLink,
      links: [
        { url: "/instagram-giveaway-guide", label: "Instagram Giveaway Guide" },
        { url: "/facebook-picker", label: "Facebook Picker" },
        { url: "/youtube", label: "YouTube Giveaway Tool" },
        { url: "/tiktok", label: "TikTok Giveaway Tool" },
        { url: "/twitter-picker", label: "Twitter Picker" },
      ],
    },
    {
      title: "Alternative Tools",
      icon: Zap,
      links: [
        { url: "/wheel", label: "Wheel Spinner" },
        { url: "/picker", label: "Name Picker" },
      ],
    },
    {
      title: "Resources & Guides",
      icon: FileText,
      links: [
        { url: "/how-it-works", label: "How It Works" },
        { url: "/faq", label: "Frequently Asked Questions" },
        { url: "/press", label: "Press & Media" },
        { url: "/contact", label: "Contact Us" },
      ],
    },
    {
      title: "Articles & Tutorials",
      icon: FileText,
      links: [
        {
          url: "/article/best-instagram-comment-picker-tools-2026",
          label: "Best Instagram Comment Picker Tools 2026",
        },
        {
          url: "/article/how-to-pick-instagram-winner",
          label: "How to Pick a Random Instagram Winner",
        },
        {
          url: "/article/what-is-random-name-picker",
          label: "What is a Random Name Picker?",
        },
      ],
    },
    {
      title: "Legal & Privacy",
      icon: Shield,
      links: [
        { url: "/privacy", label: "Privacy Policy" },
        { url: "/terms", label: "Terms of Service" },
      ],
    },
  ];

  return (
    <Layout>
      <SEO
        title="Sitemap - All Pages & Tools"
        description="Complete sitemap of PickUsAWinner - find all giveaway tools, guides, articles, and resources in one place. Instagram picker, spin wheel, random name picker, and more."
        keywords="sitemap, pickusawinner pages, giveaway tools, instagram picker, spin wheel, random picker"
        url="/sitemap"
      />

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase italic tracking-tighter">
            <span className="text-primary">Site</span> Map
          </h1>
          <p className="text-lg sm:text-xl text-slate-700 font-medium max-w-2xl mx-auto">
            Explore all our giveaway tools, guides, articles, and resources
          </p>
        </div>

        {/* Sitemap Sections */}
        <div className="grid gap-8 md:grid-cols-2">
          {sitemapSections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="border-4 border-black bg-white p-6 shadow-neo"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary text-white p-2 border-2 border-black">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-black uppercase">{section.title}</h2>
                </div>

                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.url}>
                      <Link
                        href={link.url}
                        className="text-slate-700 hover:text-primary font-medium transition-colors flex items-center gap-2 group"
                      >
                        <span className="w-2 h-2 bg-primary group-hover:scale-150 transition-transform"></span>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="border-4 border-black bg-primary text-white p-8 shadow-neo text-center"
        >
          <h2 className="text-2xl font-black uppercase mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Contact us or check out our most popular tool
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact">
              <button className="bg-white text-black border-2 border-black px-6 py-3 font-bold uppercase hover:translate-x-1 hover:translate-y-1 transition-transform">
                Contact Us
              </button>
            </Link>
            <Link href="/tool">
              <button className="bg-black text-white border-2 border-white px-6 py-3 font-bold uppercase hover:translate-x-1 hover:translate-y-1 transition-transform">
                Try Picker Tool
              </button>
            </Link>
          </div>
        </motion.div>

        {/* XML Sitemap Link */}
        <div className="text-center text-sm text-slate-600">
          <p>
            Looking for the XML sitemap?{" "}
            <a
              href="/sitemap.xml"
              className="text-primary font-bold hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              View sitemap.xml
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
}
