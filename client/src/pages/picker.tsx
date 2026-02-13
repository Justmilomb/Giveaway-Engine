import Layout from "@/components/layout";
import { SEO } from "@/components/seo";
import { Link } from "wouter";
import { ListPickerComponent } from "@/components/tools/ListPickerComponent";
import { motion } from "framer-motion";
import { AdBanner } from "@/components/AdBanner";
import { Zap } from "lucide-react";
import { InstagramFunnel } from "@/components/tools/InstagramFunnel";
import { RelatedTools } from "@/components/RelatedTools";

export default function PickerPage() {
    const faqStructuredData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "How does the Random Name Picker work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Our random name picker uses a secure algorithm to select a winner from your list. Simply paste your names and click the button."
                }
            },
            {
                "@type": "Question",
                "name": "How many names can I add?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can add thousands of names to the list. There is no strict limit, making it perfect for large raffles and giveaways."
                }
            },
            {
                "@type": "Question",
                "name": "Is this random name generator free?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Our random name generator is 100% free. No signup, no login, no payment. Use it for raffles, contests, and giveaways as much as you like."
                }
            },
            {
                "@type": "Question",
                "name": "Do I need an account?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. You can pick a random winner instantly without creating an account or logging in. Just paste your list and click pick."
                }
            }
        ]
    };

    const webAppSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "PickUsAWinner Random Name Generator",
        applicationCategory: "UtilitiesApplication",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        description: "Free random name generator. Pick a random winner from any list. No signup, no login.",
        url: "https://pickusawinner.com/picker",
    };

    return (
        <Layout>
            <SEO
                title="Random Name Generator | Free Raffle Winner Picker - No Signup"
                description="Free random name generator. Pick a random winner from any list. No signup, no login. For raffles, contests, giveaways. Instant, fair, unlimited names."
                url="/picker"
                keywords="random name generator, random name picker, raffle generator, random winner picker, list randomizer, pick a winner, no login"
                structuredData={faqStructuredData}
                additionalStructuredData={[webAppSchema]}
            />

            <div className="max-w-6xl mx-auto space-y-12 pb-12">
                {/* Header */}
                <div className="text-center space-y-4 pt-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 bg-[#A733F4] text-white border-2 border-black px-4 py-1 font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] transform rotate-1"
                    >
                        <Zap className="w-5 h-5" /> Instant Results
                    </motion.div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter">
                        Random Name <span className="text-primary text-stroke-sm">Picker</span>
                    </h1>
                    <p className="text-lg md:text-xl font-medium text-muted-foreground max-w-2xl mx-auto px-4">
                        The fairest way to draw a winner from a list. Perfect for raffles, contests, and giveaways.
                    </p>
                </div>

                {/* Main Tool Area */}
                <div className="px-4">
                    <ListPickerComponent />
                </div>

                <InstagramFunnel />

                <section className="container mx-auto px-4">
                    <AdBanner type="adsense" className="w-full" />
                </section>

                {/* SEO Content Section */}
                <div className="grid md:grid-cols-2 gap-8 px-4 py-8 bg-white border-y-4 border-black">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black uppercase">Random Name Generator - Pick a Winner Instantly</h2>
                        <p className="text-lg leading-relaxed">
                            Our <strong>random name generator</strong> is the fastest way to pick a random winner from any list. No signup, no login.
                            Paste names, click pick, get a fair result. Perfect for raffles, contests, and giveaways. Prefer to <Link href="/wheel" className="text-primary font-bold underline hover:no-underline">spin the wheel</Link>? Try our Wheel of Names. For Instagram, use our <Link href="/tool" className="text-primary font-bold underline hover:no-underline">Instagram Giveaway Generator</Link>.
                        </p>
                        <h3 className="text-xl font-bold uppercase mt-6">Key Features:</h3>
                        <ul className="list-disc pl-5 space-y-2 font-medium">
                            <li>No signup, no login required</li>
                            <li>100% Free and Ad-supported</li>
                            <li>No limit on number of names</li>
                            <li>Option to remove winners after selection</li>
                            <li>Fun animations and interface</li>
                            <li>Works on Mobile and Desktop</li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black uppercase">Start a Raffle</h2>
                        <ol className="list-decimal pl-5 space-y-4 text-lg font-medium">
                            <li>
                                <strong>Enter Names:</strong> Paste your list of names into the box. One name per line.
                            </li>
                            <li>
                                <strong>Configure:</strong> Check "Remove winner" if you plan to pick multiple people from the same list.
                            </li>
                            <li>
                                <strong>Pick:</strong> Click "PICK RANDOM WINNER" to start the selection process.
                            </li>
                            <li>
                                <strong>Celebration:</strong> We'll announce the winner with confetti!
                            </li>
                        </ol>
                        <p className="mt-4 p-4 bg-primary text-white border-2 border-black font-bold">
                            Looking for an Instagram giveaway? <Link href="/tool" className="underline hover:text-yellow-300">Instagram Giveaway Generator</Link>. Want to spin the wheel? <Link href="/wheel" className="underline hover:text-yellow-300">Wheel of Names</Link>.
                        </p>
                        <RelatedTools excludePath="/picker" max={3} className="mt-8 pt-6 border-t-2 border-black" />
                    </div>
                </div>

            </div>
        </Layout>
    );
}
