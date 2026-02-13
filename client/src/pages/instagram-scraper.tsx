import Layout from "@/components/layout";
import { SEO } from "@/components/seo";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { AdBanner } from "@/components/AdBanner";
import { Instagram, Search, ShieldCheck, Zap } from "lucide-react";
import { InstagramFunnel } from "@/components/tools/InstagramFunnel";
import { RelatedTools } from "@/components/RelatedTools";

export default function InstagramScraperPage() {
    const faqStructuredData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What is an Instagram Comment Getter?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "An Instagram comment getter is a simple tool that lets you get all comments from any public Instagram post. It's different from our Giveaway Picker—it just gets the comments. Use it for analysis, export, or to feed into our winner picker."
                }
            },
            {
                "@type": "Question",
                "name": "How do I export Instagram comments?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Our tool gets all comments from any post and lets you use them for winner selection or export for further analysis."
                }
            }
        ]
    };

    const webAppSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "PickUsAWinner Instagram Comments - Get All Comments",
        applicationCategory: "UtilitiesApplication",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        description: "Get all Instagram comments from any post. No signup, no login. Export comments, analyze engagement, or feed into our giveaway picker.",
        url: "https://pickusawinner.com/instagram-comment-scraper",
    };

    return (
        <Layout>
            <SEO
                title="Instagram Comments | Get All Comments From Any Post - No Login"
                description="Get all Instagram comments from any post. No signup, no login. Export comments, analyze engagement, or feed into our giveaway picker. Works with posts and Reels."
                url="/instagram-comment-scraper"
                keywords="instagram comments, get instagram comments, export instagram comments, instagram comment getter, instagram giveaway tool"
                structuredData={faqStructuredData}
                additionalStructuredData={[webAppSchema]}
            />

            <div className="max-w-6xl mx-auto space-y-12 pb-20 pt-8">
                <div className="text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 bg-instagram text-white border-2 border-black px-4 py-1 font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000]"
                    >
                        <Search className="w-5 h-5" /> Get All Comments
                    </motion.div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter leading-[0.9]">
                        Instagram <br className="hidden md:block" />
                        <span className="text-primary text-stroke-sm">Comment Getter</span>
                    </h1>
                    <p className="text-xl font-bold text-muted-foreground max-w-2xl mx-auto px-4">
                        Get all <strong>Instagram comments</strong> from any post. No signup, no login. Export comments, analyze engagement, or feed into our giveaway picker. Works with posts and Reels.
                    </p>

                    <div className="pt-4">
                        <Link href="/tool" className="neo-btn-primary text-2xl py-6 px-12">
                            Get Comments Now
                        </Link>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 px-4">
                    <div className="neo-box p-8 bg-white space-y-4">
                        <div className="bg-yellow-400 p-3 border-2 border-black w-fit shadow-neo-sm">
                            <Zap className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black uppercase">Instant</h3>
                        <p className="font-bold text-muted-foreground">Get up to 200 comments instantly. Same tech as our giveaway picker—just gets the comments, no winner selection.</p>
                    </div>
                    <div className="neo-box p-8 bg-white space-y-4">
                        <div className="bg-primary p-3 border-2 border-black w-fit shadow-neo-sm text-white">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black uppercase">Anti-Fraud</h3>
                        <p className="font-bold text-muted-foreground">Automatically filter out spam, fake accounts, and duplicate entries to ensure a fair result.</p>
                    </div>
                    <div className="neo-box p-8 bg-white space-y-4">
                        <div className="bg-accent p-3 border-2 border-black w-fit shadow-neo-sm text-white">
                            <Instagram className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black uppercase">Post & Reels</h3>
                        <p className="font-bold text-muted-foreground">Works with standard photo posts, carousels, and even the latest viral Reels.</p>
                    </div>
                </div>

                <InstagramFunnel />

                <section className="px-4">
                    <AdBanner type="adsense" className="w-full" />
                </section>

                {/* Deep Dive Content */}
                <div className="bg-white border-y-4 border-black py-16 px-6">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <h2 className="text-4xl font-black uppercase">Get Instagram Comments From Any Post</h2>
                        <div className="space-y-4 text-lg font-medium leading-relaxed">
                            <p>
                                Need to <strong>get Instagram comments</strong> from a post? Our tool fetches all comments instantly. No signup, no login.
                                In 2026, Instagram giveaways are more popular than ever. But as a creator, you face a huge challenge: <strong>how do you pick a winner fairly?</strong>
                                Manually selecting from thousands of comments is not only slow but also prone to bias and can lead to accusations of "rigging" the contest.
                            </p>
                            <p>
                                Our tool gets all <strong>Instagram comments</strong> from any post—same tech as our giveaway picker, but this one just fetches the list. No winner selection here.
                                Use it for analysis, export, or to see what you're working with. Then use our <Link href="/tool" className="text-primary font-bold underline hover:no-underline">Instagram Giveaway Generator</Link> to pick random winners fairly.
                            </p>
                            <h3 className="text-2xl font-black uppercase mt-8">SEO Benefits for Creators</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Increase engagement by requiring specific keywords.</li>
                                <li>Analyze which fans are your most loyal (top commenters).</li>
                                <li>Export data to Excel/CSV for marketing purposes.</li>
                                <li>Show proof of randomness to your audience.</li>
                            </ul>
                        </div>
                        <RelatedTools excludePath="/instagram-comment-scraper" max={3} className="mt-12 pt-8 border-t-2 border-black" />
                    </div>
                </div>

            </div>
        </Layout>
    );
}
